/**
 * AI Adapter - OpenAI-First Implementation
 *
 * This adapter prioritizes real AI responses using OpenAI's GPT models.
 * Fallback to Anthropic Claude if OpenAI unavailable.
 *
 * Uses runtime environment checks to ensure dotenv is loaded.
 */
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize clients lazily
let openaiClient = null;
let anthropicClient = null;
let initialized = false;

/**
 * Model selection based on task complexity
 */
const MODELS = {
  fast: "gpt-4o-mini",
  powerful: "gpt-4o",
  claudeFast: "claude-3-haiku-20240307",
  claudePowerful: "claude-3-5-sonnet-20241022",
};

/**
 * Check if OpenAI is configured (runtime check)
 */
function isOpenAIConfigured() {
  const key = process.env.OPENAI_API_KEY;
  return key && !key.includes("your_") && !key.includes("YOUR_") && key.length > 20;
}

/**
 * Check if Anthropic is configured (runtime check)
 */
function isAnthropicConfigured() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && !key.includes("your_") && !key.includes("YOUR_") && key.length > 20;
}

/**
 * Initialize AI clients (called once)
 */
function initializeClients() {
  if (initialized) return;
  initialized = true;

  if (isOpenAIConfigured()) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("[AI Adapter] ✓ OpenAI GPT initialized - Real AI enabled");
  } else if (isAnthropicConfigured()) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log("[AI Adapter] ✓ Anthropic Claude initialized - Real AI enabled");
  } else {
    console.warn("[AI Adapter] ⚠ No valid API key found!");
    console.warn("[AI Adapter] Set OPENAI_API_KEY in backend/.env for AI-powered responses");
  }
}

/**
 * Ensure clients are initialized before making calls
 */
function ensureInitialized() {
  if (!initialized) {
    initializeClients();
  }
  // Reinitialize if key was added after startup
  if (!openaiClient && isOpenAIConfigured()) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (!anthropicClient && isAnthropicConfigured()) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
}

/**
 * Call AI API with automatic retry and error handling
 */
export async function callAI(systemPrompt, userPrompt, options = {}) {
  const {
    maxTokens = 2000,
    temperature = 0.7,
    model = "fast",
    retries = 2,
    jsonMode = false,
  } = options;

  ensureInitialized();

  if (!isAIAvailable()) {
    console.warn("[AI Adapter] No API key - cannot make AI call");
    return null;
  }

  // Try OpenAI first
  if (isOpenAIConfigured() && openaiClient) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const selectedModel = model === "powerful" ? MODELS.powerful : MODELS.fast;
        console.log(`[AI Adapter] Calling OpenAI ${selectedModel} (attempt ${attempt}/${retries})...`);

        const requestConfig = {
          model: selectedModel,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        };

        if (jsonMode) {
          requestConfig.response_format = { type: "json_object" };
        }

        const response = await openaiClient.chat.completions.create(requestConfig);
        const content = response.choices[0]?.message?.content;

        if (content) {
          console.log(`[AI Adapter] ✓ OpenAI response received (${content.length} chars)`);
          return content;
        }
      } catch (error) {
        console.error(`[AI Adapter] OpenAI attempt ${attempt} failed:`, error.message);

        if (error.status === 401 || error.status === 403) {
          console.error("[AI Adapter] Authentication failed - check your API key");
          break;
        }

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  // Fallback to Anthropic
  if (isAnthropicConfigured() && anthropicClient) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const selectedModel = model === "powerful" ? MODELS.claudePowerful : MODELS.claudeFast;
        console.log(`[AI Adapter] Calling Anthropic ${selectedModel} (attempt ${attempt}/${retries})...`);

        const response = await anthropicClient.messages.create({
          model: selectedModel,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const content = response.content[0]?.text;

        if (content) {
          console.log(`[AI Adapter] ✓ Anthropic response received (${content.length} chars)`);
          return content;
        }
      } catch (error) {
        console.error(`[AI Adapter] Anthropic attempt ${attempt} failed:`, error.message);

        if (error.status === 401 || error.status === 403) {
          console.error("[AI Adapter] Authentication failed - check your API key");
          break;
        }

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  console.error("[AI Adapter] All AI providers failed");
  return null;
}

/**
 * Call AI and parse JSON response with validation
 */
export async function callAIForJSON(systemPrompt, userPrompt, fallback, options = {}) {
  const response = await callAI(systemPrompt, userPrompt, { ...options, jsonMode: true });
  return parseAIResponse(response, fallback);
}

/**
 * Parse JSON from AI response with robust extraction
 */
export function parseAIResponse(response, fallback) {
  if (!response) return fallback;

  try {
    return JSON.parse(response);
  } catch (e) {
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (e2) {}
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e3) {
        console.error("[AI Adapter] JSON extraction failed:", e3.message);
      }
    }

    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e4) {
        console.error("[AI Adapter] Array extraction failed:", e4.message);
      }
    }
  }

  console.warn("[AI Adapter] Could not parse AI response as JSON, using fallback");
  return fallback;
}

/**
 * Get current AI mode status (runtime check)
 */
export function getAIMode() {
  const key = process.env.OPENAI_API_KEY;
  const configured = isOpenAIConfigured();
  console.log(`[AI Debug] getAIMode called - key exists: ${!!key}, key length: ${key?.length}, configured: ${configured}`);
  if (configured) return "openai-gpt";
  if (isAnthropicConfigured()) return "anthropic-claude";
  return "no-ai-configured";
}

/**
 * Check if AI is available (runtime check)
 */
export function isAIAvailable() {
  return isOpenAIConfigured() || isAnthropicConfigured();
}

/**
 * Check if running in mock mode (no AI)
 */
export function isMockMode() {
  return !isAIAvailable();
}

/**
 * Get AI configuration status
 */
export function getAIStatus() {
  return {
    available: isAIAvailable(),
    provider: isOpenAIConfigured() ? "openai" : isAnthropicConfigured() ? "anthropic" : "none",
    model: isOpenAIConfigured() ? MODELS.fast : isAnthropicConfigured() ? MODELS.claudeFast : null,
    powerfulModel: isOpenAIConfigured() ? MODELS.powerful : isAnthropicConfigured() ? MODELS.claudePowerful : null,
  };
}

// Initialize on first import (for startup message)
initializeClients();
