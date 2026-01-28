/**
 * Skill Analysis Agent
 *
 * Specialized Claude Code agent for deep career and skill analysis.
 * Analyzes candidate profile holistically to provide:
 * - Career trajectory assessment
 * - Skill gap analysis
 * - Role recommendations
 * - Market positioning insights
 */
import { runClaudeCodeForJSON, isClaudeCodeEnabled } from "./claudeCodeRunner.js";

const SKILL_ANALYSIS_PROMPT = `You are a world-class career advisor and talent assessor with 20+ years of experience across multiple industries including tech, finance, healthcare, and consulting.

Your task is to provide deep, personalized career analysis for a candidate.

ANALYSIS APPROACH:
1. Read between the lines - identify implied skills, not just explicit mentions
2. Assess career trajectory - where they've been, growth pattern, and potential
3. Identify transferable skills that open doors to adjacent roles
4. Be constructively honest - point out gaps without discouragement
5. Provide SPECIFIC, actionable advice tailored to THIS candidate
6. Consider current market trends and in-demand skills for 2024-2025

ANALYSIS DIMENSIONS:
- Core Competencies: Technical skills, domain expertise, specialized knowledge
- Leadership & Soft Skills: Communication, collaboration, problem-solving, adaptability
- Industry Fit: Which industries value their background most
- Growth Potential: Based on trajectory and skill breadth
- Market Positioning: How competitive they are for their target roles
- Skill Gaps: What's missing for the next level

CRITICAL RULES:
- Base analysis ONLY on provided information
- If info is limited, acknowledge it and work with what's available
- Avoid generic advice - be specific to THIS person
- Provide at least 3 actionable next steps

Return ONLY valid JSON:
{
  "candidateProfile": {
    "currentLevel": "entry|junior|mid|senior|lead|executive",
    "yearsOfExperience": number,
    "primaryDomain": "Their main area of expertise",
    "careerStage": "Early Career|Growth Phase|Established|Transitioning|Senior Leadership"
  },
  "roleAnalysis": {
    "suggestedRoles": [
      {
        "title": "Role Title",
        "fitScore": 85,
        "reasoning": "Why this role fits them"
      }
    ],
    "stretchRoles": [
      {
        "title": "Aspirational Role",
        "gapToClose": "What they need to get there"
      }
    ],
    "pivotOptions": [
      {
        "title": "Adjacent Role",
        "transferableSkills": ["Skill 1", "Skill 2"]
      }
    ]
  },
  "skillsAssessment": {
    "coreStrengths": [
      {
        "skill": "Skill Name",
        "level": "Expert|Advanced|Intermediate|Beginner",
        "evidence": "How we know this from their profile"
      }
    ],
    "technicalSkills": ["Tech Skill 1", "Tech Skill 2"],
    "softSkills": ["Soft Skill 1", "Soft Skill 2"],
    "domainKnowledge": ["Domain 1", "Domain 2"],
    "emergingSkills": ["Skills they're developing"]
  },
  "gapAnalysis": {
    "criticalGaps": [
      {
        "skill": "Missing Skill",
        "importance": "Critical|Important|Nice-to-have",
        "recommendation": "How to address this gap"
      }
    ],
    "marketGaps": ["Skills that would make them more competitive"],
    "experienceGaps": ["Types of experience they should seek"]
  },
  "marketPositioning": {
    "competitiveness": 75,
    "uniqueValueProposition": "What makes this candidate stand out",
    "targetMarkets": ["Industries/sectors where they'd thrive"],
    "salaryRange": {
      "low": number,
      "mid": number,
      "high": number,
      "currency": "USD",
      "basis": "Annual"
    }
  },
  "careerTrajectory": {
    "assessment": "Detailed assessment of their career path",
    "nextLogicalStep": "Most likely next role",
    "fiveYearPotential": "Where they could be in 5 years",
    "riskFactors": ["Potential career risks to watch"]
  },
  "actionPlan": {
    "immediate": ["Do this week"],
    "shortTerm": ["Do this month"],
    "mediumTerm": ["Do in 3-6 months"],
    "skillsToLearn": ["Specific skills to acquire"],
    "certificationsToConsider": ["Relevant certifications"],
    "networkingAdvice": "How to build their professional network"
  },
  "professionalSummary": "A compelling 3-4 sentence summary of this candidate for their resume/LinkedIn",
  "confidenceScore": 85,
  "analysisNotes": "Any caveats or notes about this analysis"
}`;

/**
 * Analyze candidate skills and career profile using Claude Code
 *
 * @param {Object} input - Candidate profile data
 * @returns {Promise<Object>} - Comprehensive skill analysis
 */
export async function analyzeSkills(input) {
  const {
    selfDescription,
    resumeText,
    linkedinText,
    extractedResume,
    desiredRole,
    locations,
    totalExperience,
    fullName,
    selectedSkills,
  } = input;

  if (!isClaudeCodeEnabled()) {
    console.warn("[Skill Agent] Claude Code not enabled (set USE_CLAUDE_CODE=true)");
    return null; // Let caller fall back to other methods
  }

  // Build comprehensive context
  const userPrompt = `Analyze this candidate's profile and provide comprehensive career insights:

---CANDIDATE PROFILE---

Name: ${fullName || "Not provided"}

Self-Description:
${selfDescription || "Not provided"}

Resume Content:
${resumeText || "Not provided"}

${extractedResume ? `
Extracted Resume Data:
${JSON.stringify(extractedResume, null, 2)}
` : ""}

LinkedIn Profile:
${linkedinText || "Not provided"}

---CAREER CONTEXT---

Target Role(s): ${Array.isArray(desiredRole) ? desiredRole.join(", ") : desiredRole || "Open to suggestions"}
Total Experience: ${totalExperience ? `${totalExperience} years` : "Not specified"}
Skills Listed: ${selectedSkills?.join(", ") || "Not specified"}
Preferred Locations: ${Array.isArray(locations) ? locations.join(", ") : locations || "Flexible"}

---ANALYSIS REQUEST---

Please provide a thorough, personalized career analysis. Focus on:
1. Their realistic role options based on current experience
2. Specific skill gaps holding them back
3. Concrete actions they can take NOW
4. What makes them unique/competitive

Be specific to THIS candidate - avoid generic advice.`;

  console.log("[Skill Agent] Analyzing candidate profile...");

  const fallbackData = getDefaultAnalysis(input);
  const result = await runClaudeCodeForJSON(
    SKILL_ANALYSIS_PROMPT,
    userPrompt,
    fallbackData,
    { timeout: 120000 }
  );

  // Check if we got real AI response or fallback
  const isRealResponse = result !== fallbackData && result?.candidateProfile?.primaryDomain !== "Not determined";

  // Validate and enhance result
  return validateAnalysisResult(result, input, isRealResponse);
}

/**
 * Get default analysis structure
 */
function getDefaultAnalysis(input) {
  const role = Array.isArray(input.desiredRole) ? input.desiredRole[0] : input.desiredRole;
  const years = parseInt(input.totalExperience) || 0;

  let level = "junior";
  if (years >= 10) level = "lead";
  else if (years >= 7) level = "senior";
  else if (years >= 4) level = "mid";
  else if (years >= 1) level = "junior";
  else level = "entry";

  return {
    candidateProfile: {
      currentLevel: level,
      yearsOfExperience: years,
      primaryDomain: "Not determined",
      careerStage: years < 3 ? "Early Career" : years < 7 ? "Growth Phase" : "Established",
    },
    roleAnalysis: {
      suggestedRoles: role ? [{ title: role, fitScore: 70, reasoning: "Based on stated preference" }] : [],
      stretchRoles: [],
      pivotOptions: [],
    },
    skillsAssessment: {
      coreStrengths: [],
      technicalSkills: input.selectedSkills || [],
      softSkills: [],
      domainKnowledge: [],
      emergingSkills: [],
    },
    gapAnalysis: {
      criticalGaps: [],
      marketGaps: [],
      experienceGaps: [],
    },
    marketPositioning: {
      competitiveness: 50,
      uniqueValueProposition: "Analysis requires more information",
      targetMarkets: [],
      salaryRange: null,
    },
    careerTrajectory: {
      assessment: "Enable Claude Code for detailed trajectory analysis",
      nextLogicalStep: role || "To be determined",
      fiveYearPotential: "Analysis pending",
      riskFactors: [],
    },
    actionPlan: {
      immediate: ["Enable Claude Code (USE_CLAUDE_CODE=true) for personalized recommendations"],
      shortTerm: [],
      mediumTerm: [],
      skillsToLearn: [],
      certificationsToConsider: [],
      networkingAdvice: "",
    },
    professionalSummary: input.selfDescription?.slice(0, 300) || "",
    confidenceScore: 20,
    analysisNotes: "Limited analysis - Claude Code agent not enabled",
    _analyzedBy: "fallback",
  };
}

/**
 * Validate and clean analysis result
 */
function validateAnalysisResult(result, input, isRealResponse = false) {
  if (!result || typeof result !== "object") {
    const fallback = getDefaultAnalysis(input);
    fallback._analyzedBy = "fallback";
    return fallback;
  }

  // Mark source - only mark as claude-code-agent if we got a real AI response
  result._analyzedBy = isRealResponse ? "claude-code-agent" : "fallback";
  console.log(`[Skill Agent] Result marked as: ${result._analyzedBy}`);

  // Ensure suggestedRoles is in expected format for compatibility
  if (result.roleAnalysis?.suggestedRoles) {
    // Extract just titles for backward compatibility
    result.suggestedRoles = result.roleAnalysis.suggestedRoles.map((r) =>
      typeof r === "string" ? r : r.title
    );
  }

  // Map to existing API format for compatibility
  result.coreSkills = result.skillsAssessment?.technicalSkills || [];
  result.softSkills = result.skillsAssessment?.softSkills || [];
  result.experienceLevel = result.candidateProfile?.currentLevel || "mid";
  result.yearsOfExperience = result.candidateProfile?.yearsOfExperience || 0;
  result.summary = result.professionalSummary || "";
  result.weakAreas = result.gapAnalysis?.criticalGaps?.map((g) => g.recommendation) || [];
  result.marketGaps = result.gapAnalysis?.marketGaps || [];
  result.immediateActions = result.actionPlan?.immediate || [];
  result.industryFit = result.marketPositioning?.targetMarkets || [];
  result.uniqueStrengths = result.skillsAssessment?.coreStrengths?.map((s) => s.skill) || [];
  result.careerTrajectory = result.careerTrajectory?.assessment || "";

  return result;
}

export default { analyzeSkills };
