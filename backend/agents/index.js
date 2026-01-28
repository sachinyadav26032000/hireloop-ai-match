/**
 * Claude Code Agents - Index
 *
 * Specialized AI agents powered by Claude Code CLI for local development.
 * In production, the same prompts route to the API.
 *
 * Available Agents:
 * 1. Resume Extraction - Parse PDF/Word/text resumes into structured data
 * 2. Skill Analysis - Deep career and skill assessment
 * 3. CV Generation - Create ATS-optimized professional CVs
 *
 * Usage:
 *   Set USE_CLAUDE_CODE=true in .env to enable Claude Code agents
 *   Requires `claude` CLI installed and authenticated
 */

// Core runner
export {
  isClaudeCodeAvailable,
  isClaudeCodeEnabled,
  runClaudeCode,
  runClaudeCodeForJSON,
} from "./claudeCodeRunner.js";

// Specialized agents
export { extractResumeData } from "./resumeExtractionAgent.js";
export { analyzeSkills } from "./skillAnalysisAgent.js";
export { generateCV, improveCVSection } from "./cvGenerationAgent.js";

/**
 * Run the complete assistant flow using Claude Code agents
 *
 * @param {Object} input - User input (self-description, resume file, etc.)
 * @returns {Promise<Object>} - Complete analysis result
 */
export async function runCompleteFlow(input) {
  const { isClaudeCodeEnabled } = await import("./claudeCodeRunner.js");

  if (!isClaudeCodeEnabled()) {
    console.warn("[Agents] Claude Code not enabled - returning null");
    return null;
  }

  const { extractResumeData } = await import("./resumeExtractionAgent.js");
  const { analyzeSkills } = await import("./skillAnalysisAgent.js");
  const { generateCV } = await import("./cvGenerationAgent.js");

  console.log("[Agents] Starting complete flow with Claude Code agents...");

  // Step 1: Extract resume data if provided
  let extractedResume = null;
  if (input.resumeText) {
    console.log("[Agents] Step 1: Extracting resume data...");
    extractedResume = await extractResumeData(input.resumeText);
  }

  // Step 2: Analyze skills and profile
  console.log("[Agents] Step 2: Analyzing skills and profile...");
  const skillAnalysis = await analyzeSkills({
    ...input,
    extractedResume,
  });

  // Step 3: Generate CV
  console.log("[Agents] Step 3: Generating CV...");
  const cvResult = await generateCV({
    profileAnalysis: skillAnalysis,
    skillAnalysis,
    extractedResume,
    userInfo: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      location: input.locations?.[0],
      linkedinUrl: input.linkedinUrl,
      selfDescription: input.selfDescription,
    },
    existingResume: input.resumeText,
    targetRole: input.desiredRole,
  });

  console.log("[Agents] ✓ Complete flow finished");

  return {
    extractedResume,
    profileAnalysis: skillAnalysis,
    generatedCV: cvResult,
    _processedBy: "claude-code-agents",
  };
}

export default {
  runCompleteFlow,
};
