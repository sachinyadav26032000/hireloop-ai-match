/**
 * AI Adapter - Multi-Provider Implementation
 *
 * Priority order: NVIDIA (free) → OpenAI → Anthropic
 * NVIDIA API uses OpenAI-compatible endpoint with free models.
 *
 * Uses runtime environment checks to ensure dotenv is loaded.
 */
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize clients lazily
let nvidiaClient = null;
let openaiClient = null;
let anthropicClient = null;
let initialized = false;

/**
 * Model selection based on task complexity
 */
const MODELS = {
  // NVIDIA (free tier via NVIDIA API catalog)
  nvidiaFast: "meta/llama-3.1-8b-instruct",
  nvidiaPowerful: "meta/llama-3.1-70b-instruct",
  // OpenAI
  fast: "gpt-4o-mini",
  powerful: "gpt-4o",
  // Anthropic
  claudeFast: "claude-3-haiku-20240307",
  claudePowerful: "claude-3-5-sonnet-20241022",
};

/**
 * Check if NVIDIA API is configured (runtime check)
 */
function isNvidiaConfigured() {
  const key = process.env.NVIDIA_API_KEY;
  return key && key.startsWith("nvapi-") && key.length > 20;
}

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

  if (isNvidiaConfigured()) {
    nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
    console.log("[AI Adapter] ✓ NVIDIA API initialized - Real AI enabled (free tier)");
    console.log(`[AI Adapter]   Fast model: ${MODELS.nvidiaFast}`);
    console.log(`[AI Adapter]   Powerful model: ${MODELS.nvidiaPowerful}`);
  }

  if (isOpenAIConfigured()) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("[AI Adapter] ✓ OpenAI GPT initialized - Real AI enabled");
  }

  if (isAnthropicConfigured()) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log("[AI Adapter] ✓ Anthropic Claude initialized - Real AI enabled");
  }

  if (!isNvidiaConfigured() && !isOpenAIConfigured() && !isAnthropicConfigured()) {
    console.warn("[AI Adapter] ⚠ No valid API key found!");
    console.warn("[AI Adapter] Set NVIDIA_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in backend/.env");
  }
}

/**
 * Ensure clients are initialized before making calls
 */
function ensureInitialized() {
  if (!initialized) {
    initializeClients();
  }
  // Reinitialize if keys were added after startup
  if (!nvidiaClient && isNvidiaConfigured()) {
    nvidiaClient = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  if (!openaiClient && isOpenAIConfigured()) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (!anthropicClient && isAnthropicConfigured()) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
}

/**
 * Call NVIDIA API via OpenAI-compatible endpoint
 */
async function callNvidia(systemPrompt, userPrompt, options) {
  const { maxTokens, temperature, model, retries } = options;
  const selectedModel = model === "powerful" ? MODELS.nvidiaPowerful : MODELS.nvidiaFast;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI Adapter] Calling NVIDIA ${selectedModel} (attempt ${attempt}/${retries})...`);

      const requestConfig = {
        model: selectedModel,
        max_tokens: maxTokens,
        temperature,
        top_p: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      };

      // Add 30s timeout to prevent hanging on slow NVIDIA free tier
      const timeoutMs = 30000;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await nvidiaClient.chat.completions.create(requestConfig, { signal: controller.signal });
        clearTimeout(timeout);
        const content = response.choices[0]?.message?.content;

        if (content) {
          console.log(`[AI Adapter] ✓ NVIDIA response received (${content.length} chars)`);
          return content;
        }
      } catch (timeoutErr) {
        clearTimeout(timeout);
        if (timeoutErr.name === 'AbortError' || timeoutErr.message?.includes('abort')) {
          console.warn(`[AI Adapter] NVIDIA ${selectedModel} timed out after ${timeoutMs/1000}s`);
          // If powerful model timed out, try fast model immediately
          if (selectedModel === MODELS.nvidiaPowerful) {
            console.log(`[AI Adapter] Falling back to fast model after timeout...`);
            try {
              const fallbackResponse = await nvidiaClient.chat.completions.create({
                model: MODELS.nvidiaFast,
                max_tokens: maxTokens,
                temperature,
                top_p: 0.7,
                messages: requestConfig.messages,
              });
              const fallbackContent = fallbackResponse.choices[0]?.message?.content;
              if (fallbackContent) {
                console.log(`[AI Adapter] ✓ NVIDIA fast fallback response received (${fallbackContent.length} chars)`);
                return fallbackContent;
              }
            } catch (fbErr) {
              console.error(`[AI Adapter] Fast fallback also failed:`, fbErr.message);
            }
          }
          throw timeoutErr;
        }
        throw timeoutErr;
      }
    } catch (error) {
      console.error(`[AI Adapter] NVIDIA attempt ${attempt} failed:`, error.message);

      if (error.status === 401 || error.status === 403) {
        console.error("[AI Adapter] NVIDIA authentication failed - check your API key");
        break;
      }

      // If model is unavailable (500/503), try the fast model as fallback
      if ((error.status === 500 || error.status === 503) && selectedModel === MODELS.nvidiaPowerful) {
        console.log(`[AI Adapter] Powerful model unavailable, trying fast model...`);
        try {
          const fallbackResponse = await nvidiaClient.chat.completions.create({
            model: MODELS.nvidiaFast,
            max_tokens: maxTokens,
            temperature,
            top_p: 0.7,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
          });
          const fallbackContent = fallbackResponse.choices[0]?.message?.content;
          if (fallbackContent) {
            console.log(`[AI Adapter] ✓ NVIDIA fallback response received (${fallbackContent.length} chars)`);
            return fallbackContent;
          }
        } catch (fallbackError) {
          console.error(`[AI Adapter] NVIDIA fallback also failed:`, fallbackError.message);
        }
      }

      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  return null;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(systemPrompt, userPrompt, options) {
  const { maxTokens, temperature, model, retries, jsonMode } = options;
  const selectedModel = model === "powerful" ? MODELS.powerful : MODELS.fast;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
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
  return null;
}

/**
 * Call Anthropic API
 */
async function callAnthropic(systemPrompt, userPrompt, options) {
  const { maxTokens, temperature, model, retries } = options;
  const selectedModel = model === "powerful" ? MODELS.claudePowerful : MODELS.claudeFast;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
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
  return null;
}

/**
 * Call AI API with automatic provider selection, retry, and fallback
 * Priority: NVIDIA → OpenAI → Anthropic
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

  // Try NVIDIA first (free tier)
  if (isNvidiaConfigured() && nvidiaClient) {
    const result = await callNvidia(systemPrompt, userPrompt, { maxTokens, temperature, model, retries });
    if (result) return result;
    console.warn("[AI Adapter] NVIDIA failed, trying fallback providers...");
  }

  // Fallback to OpenAI
  if (isOpenAIConfigured() && openaiClient) {
    const result = await callOpenAI(systemPrompt, userPrompt, { maxTokens, temperature, model, retries, jsonMode });
    if (result) return result;
  }

  // Fallback to Anthropic
  if (isAnthropicConfigured() && anthropicClient) {
    const result = await callAnthropic(systemPrompt, userPrompt, { maxTokens, temperature, model, retries });
    if (result) return result;
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

  // Clean common issues from Llama/NVIDIA responses
  let cleaned = response.trim();
  // Remove <think>...</think> blocks from reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try extracting from code blocks (common with NVIDIA/Llama models)
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (e2) {}
    }

    // Try finding the outermost JSON object by matching balanced braces
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e3) {
        console.error("[AI Adapter] JSON extraction failed:", e3.message);
      }
    }

    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
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
  if (isNvidiaConfigured()) return "nvidia-llama";
  if (isOpenAIConfigured()) return "openai-gpt";
  if (isAnthropicConfigured()) return "anthropic-claude";
  return "no-ai-configured";
}

/**
 * Check if AI is available (runtime check)
 */
export function isAIAvailable() {
  return isNvidiaConfigured() || isOpenAIConfigured() || isAnthropicConfigured();
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
  const provider = isNvidiaConfigured() ? "nvidia" : isOpenAIConfigured() ? "openai" : isAnthropicConfigured() ? "anthropic" : "none";

  const modelMap = {
    nvidia: { fast: MODELS.nvidiaFast, powerful: MODELS.nvidiaPowerful },
    openai: { fast: MODELS.fast, powerful: MODELS.powerful },
    anthropic: { fast: MODELS.claudeFast, powerful: MODELS.claudePowerful },
    none: { fast: null, powerful: null },
  };

  return {
    available: isAIAvailable(),
    provider,
    model: modelMap[provider].fast,
    powerfulModel: modelMap[provider].powerful,
  };
}

// Initialize on first import (for startup message)
initializeClients();
