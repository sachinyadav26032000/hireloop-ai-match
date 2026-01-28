/**
 * Claude Code CLI Runner
 *
 * Executes Claude Code CLI as a local AI backend for development.
 * Spawns `claude` process, pipes prompts, and captures responses.
 *
 * Usage:
 *   Set USE_CLAUDE_CODE=true in .env to enable
 *   Requires `claude` CLI installed and authenticated
 */
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

// Configuration
const CLAUDE_CODE_TIMEOUT = 120000; // 2 minutes max per request
const MAX_PROMPT_LENGTH = 50000; // Max characters to send

/**
 * Check if Claude Code CLI is available
 */
export async function isClaudeCodeAvailable() {
  return new Promise((resolve) => {
    const proc = spawn("which", ["claude"]);
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
  });
}

/**
 * Check if Claude Code mode is enabled
 */
export function isClaudeCodeEnabled() {
  return process.env.USE_CLAUDE_CODE === "true";
}

/**
 * Run a prompt through Claude Code CLI
 *
 * @param {string} systemPrompt - The system/context prompt
 * @param {string} userPrompt - The user's request
 * @param {Object} options - Configuration options
 * @returns {Promise<string|null>} - Claude's response or null on failure
 */
export async function runClaudeCode(systemPrompt, userPrompt, options = {}) {
  const {
    timeout = CLAUDE_CODE_TIMEOUT,
    maxTokens = 4000,
    model = "sonnet",
  } = options;

  // Combine prompts with strong JSON instruction
  const jsonInstruction = `CRITICAL: You must respond with ONLY valid JSON. No explanations, no markdown, no prose before or after. Just the raw JSON object starting with { and ending with }.`;
  const fullPrompt = `${jsonInstruction}\n\n${systemPrompt}\n\n---\n\n${userPrompt}\n\n${jsonInstruction}`.slice(0, MAX_PROMPT_LENGTH);

  console.log(`[Claude Code] Running agent (${fullPrompt.length} chars)...`);

  return new Promise(async (resolve, reject) => {
    let output = "";
    let errorOutput = "";
    let resolved = false;

    // Write prompt to temp file (handles large prompts better than args)
    const tempFile = join(tmpdir(), `claude-prompt-${randomUUID()}.txt`);

    try {
      await writeFile(tempFile, fullPrompt, "utf-8");
    } catch (err) {
      console.error("[Claude Code] Failed to write temp file:", err.message);
      resolve(null);
      return;
    }

    // Cleanup temp file
    const cleanup = async () => {
      try {
        await unlink(tempFile);
      } catch {}
    };

    // Build claude command args
    // Use --print for non-interactive, --dangerously-skip-permissions for automation
    // Pass prompt via stdin from file
    const args = [
      "--print",
      "--dangerously-skip-permissions",
      "--output-format", "text",
    ];

    console.log(`[Claude Code] Executing: claude ${args.join(" ")} < ${tempFile}`);

    // Spawn claude CLI
    const proc = spawn("claude", args, {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Pipe the prompt file to stdin
    const fs = await import("fs");
    const inputStream = fs.createReadStream(tempFile);
    inputStream.pipe(proc.stdin);

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill("SIGTERM");
        cleanup();
        console.error("[Claude Code] Request timed out after", timeout, "ms");
        resolve(null);
      }
    }, timeout);

    // Capture stdout
    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    // Capture stderr (for debugging)
    proc.stderr.on("data", (data) => {
      const msg = data.toString();
      // Filter out progress messages
      if (!msg.includes("⠋") && !msg.includes("⠙") && !msg.includes("⠸")) {
        errorOutput += msg;
      }
    });

    // Handle completion
    proc.on("close", async (code) => {
      clearTimeout(timeoutId);
      await cleanup();

      if (resolved) return;
      resolved = true;

      if (code !== 0 && code !== null) {
        console.error(`[Claude Code] Process exited with code ${code}`);
        if (errorOutput) {
          console.error("[Claude Code] Stderr:", errorOutput.slice(0, 500));
        }
        // Still try to use output if we got any
        if (output && output.trim().length > 0) {
          console.log(`[Claude Code] Got output despite exit code, using it (${output.length} chars)`);
          resolve(output.trim());
          return;
        }
        resolve(null);
        return;
      }

      if (!output || output.trim().length === 0) {
        console.warn("[Claude Code] Empty response received");
        if (errorOutput) {
          console.warn("[Claude Code] Stderr was:", errorOutput.slice(0, 500));
        }
        resolve(null);
        return;
      }

      console.log(`[Claude Code] ✓ Response received (${output.length} chars)`);
      console.log(`[Claude Code] Raw response:\n${output.slice(0, 1000)}${output.length > 1000 ? '...' : ''}`);
      resolve(output.trim());
    });

    // Handle spawn errors
    proc.on("error", async (err) => {
      clearTimeout(timeoutId);
      await cleanup();

      if (resolved) return;
      resolved = true;

      console.error("[Claude Code] Spawn error:", err.message);
      resolve(null);
    });
  });
}

/**
 * Run Claude Code and parse JSON response
 *
 * @param {string} systemPrompt - The system/context prompt
 * @param {string} userPrompt - The user's request (should ask for JSON)
 * @param {Object} fallback - Fallback value if parsing fails
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Parsed JSON or fallback
 */
export async function runClaudeCodeForJSON(systemPrompt, userPrompt, fallback, options = {}) {
  const response = await runClaudeCode(systemPrompt, userPrompt, options);

  if (!response) {
    return fallback;
  }

  // Try to parse JSON from response
  try {
    return JSON.parse(response);
  } catch (e) {
    // Try to extract JSON from markdown code block
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {}
    }

    // Try to find JSON object in response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {}
    }

    // Try to find JSON array
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {}
    }

    console.warn("[Claude Code] Could not parse JSON response, using fallback");
    return fallback;
  }
}

export default {
  isClaudeCodeAvailable,
  isClaudeCodeEnabled,
  runClaudeCode,
  runClaudeCodeForJSON,
};
