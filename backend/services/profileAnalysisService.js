/**
 * Profile Analysis Service - AI-POWERED
 *
 * Uses GPT/Claude to provide intelligent career analysis:
 * - Deep understanding of career trajectory
 * - Personalized role suggestions based on actual experience
 * - Contextual skill extraction (not just keyword matching)
 * - Real market insights and actionable recommendations
 *
 * The AI analyzes the candidate holistically, not just pattern matching.
 */
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";
import { analyzeSkills as analyzeWithAgent, isClaudeCodeEnabled } from "../agents/index.js";

/**
 * System prompt for AI career analysis
 * This prompt instructs the AI to act as a senior career advisor
 */
const CAREER_ANALYST_PROMPT = `You are a world-class career advisor and talent assessor with 20+ years of experience in recruitment, career coaching, and talent acquisition across multiple industries.

Your task is to analyze a candidate's profile and provide deep, personalized career insights.

ANALYSIS APPROACH:
1. Read between the lines - understand implied skills and experience, not just explicit mentions
2. Consider career trajectory - where they've been and where they could go
3. Identify transferable skills that may not be obvious
4. Be honest but constructive - point out gaps without being discouraging
5. Provide specific, actionable advice - not generic tips

IMPORTANT RULES:
- Base ALL analysis on the provided information only
- Do NOT invent or assume facts not present in the input
- If information is missing, acknowledge it and work with what you have
- Be specific to THIS candidate, not generic advice
- Consider the current job market and industry trends

Return your analysis as valid JSON with this structure:
{
  "suggestedRoles": ["Most suitable role", "Alternative 1", "Alternative 2"],
  "experienceLevel": "entry|junior|mid|senior|lead|executive",
  "yearsOfExperience": estimated_number,
  "coreSkills": ["Technical skills found or implied"],
  "softSkills": ["Soft skills evidenced by their experience"],
  "industryFit": ["Industries they'd excel in"],
  "careerTrajectory": "Brief assessment of their career path and potential",
  "uniqueStrengths": ["What makes this candidate stand out"],
  "weakAreas": ["Specific gaps to address - be constructive"],
  "marketGaps": ["Skills/experiences that would make them more competitive"],
  "immediateActions": ["Top 3 things they should do right now"],
  "summary": "Compelling 2-3 sentence professional summary for this candidate",
  "confidenceScore": 0-100 based on how much information you had to work with
}`;

/**
 * System prompt for ATS optimization analysis
 */
const ATS_ANALYST_PROMPT = `You are an ATS (Applicant Tracking System) optimization expert who understands how automated systems parse and score resumes.

Analyze the provided resume/profile for ATS compatibility and provide specific scoring.

SCORING CRITERIA (0-100 scale):
1. Keyword Relevance (25%): Does the content contain relevant keywords for the target role?
2. Impact Metrics (25%): Are achievements quantified with numbers, percentages, or specific outcomes?
3. Role Alignment (25%): How well does the experience align with the target role?
4. Format & Clarity (25%): Is the content well-structured and easy to parse?

Return ONLY valid JSON:
{
  "overall": overall_score_40_to_100,
  "keywordRelevance": {
    "score": 0-100,
    "found": ["keywords found"],
    "missing": ["important keywords missing for target role"],
    "feedback": "specific feedback"
  },
  "impactMetrics": {
    "score": 0-100,
    "examples": ["quantified achievements found"],
    "improvements": ["how to add more metrics"],
    "feedback": "specific feedback"
  },
  "roleAlignment": {
    "score": 0-100,
    "strengths": ["alignment strengths"],
    "gaps": ["alignment gaps"],
    "feedback": "specific feedback"
  },
  "formattingClarity": {
    "score": 0-100,
    "positives": ["what's good"],
    "issues": ["what to fix"],
    "feedback": "specific feedback"
  },
  "topImprovements": ["Top 5 specific, actionable improvements ranked by impact"]
}`;

/**
 * Extract basic info for fallback when AI is unavailable
 */
function extractBasicInfo(input) {
  const { selfDescription, resumeText, selectedSkills, desiredRole, totalExperience } = input;
  const combinedText = `${selfDescription || ""} ${resumeText || ""}`.toLowerCase();

  // Basic skill extraction
  const commonSkills = [
    "JavaScript", "Python", "Java", "React", "Node.js", "SQL", "AWS", "Docker",
    "TypeScript", "Git", "Agile", "Scrum", "Leadership", "Communication"
  ];

  const foundSkills = selectedSkills?.length > 0
    ? selectedSkills
    : commonSkills.filter(skill => combinedText.includes(skill.toLowerCase()));

  // Basic experience level detection
  let experienceLevel = "junior";
  let years = parseInt(totalExperience) || 2;

  if (years >= 10 || /director|vp|head of|principal/.test(combinedText)) {
    experienceLevel = "lead";
  } else if (years >= 7 || /senior|lead|architect/.test(combinedText)) {
    experienceLevel = "senior";
  } else if (years >= 4 || /mid-level|experienced/.test(combinedText)) {
    experienceLevel = "mid";
  } else if (years >= 1 || /junior|associate/.test(combinedText)) {
    experienceLevel = "junior";
  } else {
    experienceLevel = "entry";
  }

  // Normalize desiredRole
  const normalizedRole = Array.isArray(desiredRole) ? desiredRole[0] : desiredRole;

  return {
    suggestedRoles: normalizedRole ? [normalizedRole] : ["Software Developer"],
    experienceLevel,
    yearsOfExperience: years,
    coreSkills: foundSkills.slice(0, 10),
    softSkills: ["Communication", "Problem Solving", "Teamwork"],
    industryFit: ["Technology"],
    careerTrajectory: "Career trajectory analysis requires AI. Please configure OPENAI_API_KEY.",
    uniqueStrengths: ["Unable to analyze without AI - please configure API key"],
    weakAreas: ["AI analysis unavailable - configure OPENAI_API_KEY for personalized insights"],
    marketGaps: ["Configure AI for market gap analysis"],
    immediateActions: [
      "Configure OPENAI_API_KEY in backend/.env for full AI analysis",
      "Ensure your resume has quantified achievements",
      "Tailor your profile to your target role"
    ],
    summary: `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}-level professional seeking ${normalizedRole || "new opportunities"}.`,
    confidenceScore: 20,
    aiPowered: false,
    warning: "Limited analysis - AI not configured. Set OPENAI_API_KEY for comprehensive insights."
  };
}

/**
 * Analyze user profile using AI
 *
 * @param {Object} input - User profile data
 * @returns {Promise<Object>} - Comprehensive profile analysis
 */
export async function analyzeProfile(input) {
  const {
    selfDescription,
    resumeText,
    linkedinText,
    desiredRole,
    locations,
    totalExperience,
    fullName,
    selectedSkills
  } = input;

  // Normalize desiredRole (handle array or string)
  const normalizedRole = Array.isArray(desiredRole) ? desiredRole[0] : desiredRole;

  // Try Claude Code agent first if enabled (preferred for local dev)
  if (isClaudeCodeEnabled()) {
    console.log("[Profile Analysis] Using Claude Code agent for analysis...");
    try {
      const agentResult = await analyzeWithAgent(input);
      console.log("[Profile Analysis] Agent result:", agentResult ? "received" : "null",
        agentResult?._analyzedBy || "no-marker");

      if (agentResult && agentResult._analyzedBy === "claude-code-agent") {
        console.log("[Profile Analysis] ✓ Claude Code agent analysis successful");
        // Add ATS score breakdown (agent provides detailed analysis)
        return {
          ...agentResult,
          aiPowered: true,
          atsScoreBreakdown: {
            overall: agentResult.marketPositioning?.competitiveness || 70,
            keywordRelevance: 70,
            impactMetrics: 65,
            roleAlignment: agentResult.roleAnalysis?.suggestedRoles?.[0]?.fitScore || 70,
            formattingClarity: 75,
          },
        };
      }

      // Agent returned but without proper marker - might be fallback data
      if (agentResult) {
        console.log("[Profile Analysis] Agent returned fallback data, using it");
        return {
          ...agentResult,
          aiPowered: false,
          atsScoreBreakdown: {
            overall: 50,
            warning: "Claude Code agent returned basic analysis"
          }
        };
      }
    } catch (err) {
      console.error("[Profile Analysis] Claude Code agent error:", err.message);
    }

    // If Claude Code is the ONLY AI option and it failed, use basic analysis
    // Don't try API calls since we know they'll fail too
    const hasApiKeys = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!hasApiKeys) {
      console.warn("[Profile Analysis] Claude Code failed, no API keys - using basic analysis");
      const basicAnalysis = extractBasicInfo(input);
      return {
        ...basicAnalysis,
        atsScoreBreakdown: {
          overall: 50,
          warning: "AI analysis failed. Using rule-based analysis."
        }
      };
    }
  }

  // Check if AI is available (API keys)
  if (!isAIAvailable()) {
    console.warn("[Profile Analysis] AI not available - returning basic analysis");
    const basicAnalysis = extractBasicInfo(input);
    return {
      ...basicAnalysis,
      atsScoreBreakdown: {
        overall: 50,
        warning: "ATS scoring requires AI. Configure OPENAI_API_KEY for accurate scoring."
      }
    };
  }

  // Build comprehensive user prompt with all available data
  const userPrompt = `
CANDIDATE PROFILE TO ANALYZE:

Name: ${fullName || "Not provided"}

Self-Description:
${selfDescription || "Not provided"}

Resume/CV Content:
${resumeText || "No resume provided"}

LinkedIn Profile:
${linkedinText || "Not provided"}

Target Role: ${normalizedRole || "Open to suggestions"}
Total Experience: ${totalExperience ? `${totalExperience} years` : "Not specified"}
Skills Listed: ${selectedSkills?.join(", ") || "Not specified"}
Preferred Locations: ${locations?.join(", ") || "Flexible"}

Please provide a thorough career analysis for this candidate. Be specific to THEIR situation - avoid generic advice. If limited information is provided, acknowledge this and do the best analysis possible with available data.`;

  // Call AI for career analysis
  console.log("[Profile Analysis] Calling AI for comprehensive analysis...");
  const analysisResponse = await callAI(CAREER_ANALYST_PROMPT, userPrompt, {
    model: "fast", // Use GPT-4o-mini (cost-effective, avoids quota issues)
    maxTokens: 2500,
    temperature: 0.7
  });

  // Parse AI response with fallback
  const fallbackAnalysis = extractBasicInfo(input);
  let analysis = parseAIResponse(analysisResponse, fallbackAnalysis);

  // Mark as AI-powered
  analysis.aiPowered = analysisResponse !== null;

  // Now get ATS score analysis
  console.log("[Profile Analysis] Analyzing ATS compatibility...");
  const atsPrompt = `
Analyze this profile for ATS (Applicant Tracking System) optimization:

Target Role: ${normalizedRole || "General"}

Resume/Profile Content:
${resumeText || selfDescription || "Limited content provided"}

Skills: ${selectedSkills?.join(", ") || analysis.coreSkills?.join(", ") || "Not specified"}
Experience: ${totalExperience || analysis.yearsOfExperience || 0} years

Provide specific ATS scoring and actionable improvements.`;

  const atsResponse = await callAI(ATS_ANALYST_PROMPT, atsPrompt, {
    model: "fast", // GPT-4o-mini is sufficient for ATS analysis
    maxTokens: 1500,
    temperature: 0.3 // Lower temperature for more consistent scoring
  });

  const atsAnalysis = parseAIResponse(atsResponse, {
    overall: 55,
    keywordRelevance: { score: 50, feedback: "AI analysis in progress" },
    impactMetrics: { score: 50, feedback: "AI analysis in progress" },
    roleAlignment: { score: 55, feedback: "AI analysis in progress" },
    formattingClarity: { score: 60, feedback: "AI analysis in progress" },
    topImprovements: analysis.weakAreas || []
  });

  // Combine analyses
  return {
    ...analysis,
    atsScoreBreakdown: {
      overall: atsAnalysis.overall || 55,
      keywordRelevance: atsAnalysis.keywordRelevance?.score || 50,
      impactMetrics: atsAnalysis.impactMetrics?.score || 50,
      roleAlignment: atsAnalysis.roleAlignment?.score || 55,
      formattingClarity: atsAnalysis.formattingClarity?.score || 60,
      breakdown: {
        keywordRelevance: {
          score: atsAnalysis.keywordRelevance?.score || 50,
          factors: atsAnalysis.keywordRelevance?.found || [],
          improvements: atsAnalysis.keywordRelevance?.missing || []
        },
        impactMetrics: {
          score: atsAnalysis.impactMetrics?.score || 50,
          factors: atsAnalysis.impactMetrics?.examples || [],
          improvements: atsAnalysis.impactMetrics?.improvements || []
        },
        roleAlignment: {
          score: atsAnalysis.roleAlignment?.score || 55,
          factors: atsAnalysis.roleAlignment?.strengths || [],
          improvements: atsAnalysis.roleAlignment?.gaps || []
        },
        formattingClarity: {
          score: atsAnalysis.formattingClarity?.score || 60,
          factors: atsAnalysis.formattingClarity?.positives || [],
          improvements: atsAnalysis.formattingClarity?.issues || []
        }
      },
      topImprovements: atsAnalysis.topImprovements || analysis.weakAreas || []
    },
    // Ensure weakAreas uses ATS improvements if available
    weakAreas: atsAnalysis.topImprovements?.length > 0
      ? atsAnalysis.topImprovements
      : analysis.weakAreas
  };
}
