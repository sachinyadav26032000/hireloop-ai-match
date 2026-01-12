/**
 * AI Adapter - Abstracts AI calls to allow easy switching between providers
 * Falls back to mock responses when API key is not available
 */
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const USE_MOCK = !ANTHROPIC_API_KEY || process.env.USE_MOCK === "true";

let claudeClient = null;

if (!USE_MOCK && ANTHROPIC_API_KEY) {
  claudeClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

/**
 * Call Claude API or return mock response
 */
export async function callAI(systemPrompt, userPrompt, options = {}) {
  const { maxTokens = 2000, temperature = 0.7 } = options;

  if (USE_MOCK) {
    console.log("[AI Adapter] Using mock response (no API key)");
    return null; // Services should handle null and provide mock data
  }

  try {
    const response = await claudeClient.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error("[AI Adapter] API call failed:", error.message);
    return null;
  }
}

/**
 * Parse JSON from AI response, with fallback
 */
export function parseAIResponse(response, fallback) {
  if (!response) return fallback;

  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return fallback;
  } catch (error) {
    console.error("[AI Adapter] JSON parse failed:", error.message);
    return fallback;
  }
}

export const isMockMode = () => USE_MOCK;
