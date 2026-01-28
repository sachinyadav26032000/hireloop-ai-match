/**
 * CV Generation Agent
 *
 * Specialized Claude Code agent for creating professional, ATS-optimized CVs.
 * Uses AI to transform raw candidate data into polished, impactful CVs.
 *
 * Key Features:
 * - ATS keyword optimization
 * - Impact-focused bullet point transformation
 * - Professional summary writing
 * - Role-targeted content customization
 */
import { runClaudeCodeForJSON, isClaudeCodeEnabled } from "./claudeCodeRunner.js";

const CV_GENERATION_PROMPT = `You are an elite CV/resume writer who has helped thousands land jobs at top companies (Google, Amazon, McKinsey, Goldman Sachs, startups, etc.).

Your task is to create a powerful, ATS-optimized CV from the provided candidate information.

CRITICAL RULES (NEVER BREAK):
1. NEVER invent or fabricate information not in the input
2. ONLY enhance presentation and wording, not content
3. If experience details are missing, leave sections empty - do NOT create fake jobs
4. Transform weak descriptions into achievement-focused statements
5. Preserve all quantifiable metrics exactly as provided

CV WRITING EXCELLENCE:
- Professional Summary: Compelling, specific, tailored to target role (3-4 sentences)
- Experience Bullets: Start with action verbs, use X-Y-Z formula (Accomplished X by doing Y, resulting in Z)
- Quantify everything possible (%, $, #, time saved, team size, etc.)
- Keywords: Naturally incorporate role-relevant keywords for ATS
- Formatting: Clean, scannable, 1-2 line bullets max

ACTION VERB BANK:
Led, Spearheaded, Architected, Delivered, Achieved, Drove, Optimized, Transformed,
Launched, Scaled, Reduced, Increased, Managed, Built, Designed, Implemented,
Streamlined, Pioneered, Established, Negotiated, Mentored, Collaborated

ATS OPTIMIZATION:
- Use standard section headers (Experience, Education, Skills)
- Include exact keywords from the target role
- No tables, graphics, or complex formatting
- Consistent date formats (Month Year - Month Year)

Return ONLY valid JSON with this structure:
{
  "cv": {
    "fullName": "Name from input",
    "title": "Professional title aligned with target role",
    "contact": {
      "email": "from input",
      "phone": "from input",
      "location": "from input",
      "linkedin": "from input",
      "portfolio": "from input or null"
    },
    "summary": "Compelling 3-4 sentence professional summary tailored to target role",
    "experience": [
      {
        "title": "Job Title (standardized)",
        "company": "Company Name",
        "location": "City, Country",
        "startDate": "Month Year",
        "endDate": "Month Year or Present",
        "bullets": [
          "Achievement-focused bullet with metrics if available",
          "Another impactful accomplishment",
          "Third bullet highlighting key contribution"
        ]
      }
    ],
    "education": [
      {
        "degree": "Degree Type in Field",
        "institution": "University Name",
        "location": "City, Country",
        "year": "Year",
        "honors": "GPA, honors, or null"
      }
    ],
    "skills": {
      "technical": ["Skill 1", "Skill 2"],
      "tools": ["Tool 1", "Tool 2"],
      "soft": ["Soft Skill 1", "Soft Skill 2"]
    },
    "certifications": [
      {
        "name": "Certification Name",
        "issuer": "Issuing Org",
        "year": "Year or null"
      }
    ],
    "languages": ["English (Native)", "Spanish (Fluent)"],
    "projects": [
      {
        "name": "Project Name",
        "description": "One-line impactful description",
        "techStack": ["Tech 1", "Tech 2"]
      }
    ]
  },
  "atsOptimization": {
    "score": 85,
    "keywordsIncluded": ["keyword1", "keyword2"],
    "keywordsMissing": ["keyword that should be added if applicable"],
    "formatScore": 90,
    "readabilityScore": 85
  },
  "improvements": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3"
  ],
  "targetRoleAlignment": {
    "alignmentScore": 80,
    "strengths": ["How CV aligns with target role"],
    "gaps": ["Areas that need strengthening"]
  },
  "bulletTransformations": [
    {
      "original": "Original bullet if transformed",
      "improved": "Enhanced version",
      "improvement": "What was improved"
    }
  ]
}`;

/**
 * Generate professional CV using Claude Code
 *
 * @param {Object} input - CV generation input
 * @returns {Promise<Object>} - Generated CV data
 */
export async function generateCV(input) {
  const {
    profileAnalysis,
    skillAnalysis,
    extractedResume,
    userInfo,
    existingResume,
    targetRole,
  } = input;

  if (!isClaudeCodeEnabled()) {
    console.warn("[CV Agent] Claude Code not enabled (set USE_CLAUDE_CODE=true)");
    return null; // Let caller fall back to other methods
  }

  // Determine target role
  const role =
    targetRole ||
    profileAnalysis?.suggestedRoles?.[0] ||
    skillAnalysis?.suggestedRoles?.[0] ||
    "Professional";

  // Build comprehensive prompt
  const userPrompt = `Generate a professional, ATS-optimized CV for this candidate:

---CANDIDATE INFORMATION---

Name: ${userInfo?.fullName || extractedResume?.contact?.name || "Not provided"}
Email: ${userInfo?.email || extractedResume?.contact?.email || "Not provided"}
Phone: ${userInfo?.phone || extractedResume?.contact?.phone || "Not provided"}
Location: ${userInfo?.location || userInfo?.locations?.[0] || extractedResume?.contact?.location || "Not provided"}
LinkedIn: ${userInfo?.linkedinUrl || extractedResume?.contact?.linkedin || "Not provided"}

---TARGET ROLE---
${role}

---EXPERIENCE LEVEL---
${profileAnalysis?.experienceLevel || skillAnalysis?.candidateProfile?.currentLevel || "mid"} level
${profileAnalysis?.yearsOfExperience || skillAnalysis?.candidateProfile?.yearsOfExperience || 0} years of experience

---SELF-DESCRIPTION---
${userInfo?.selfDescription || "Not provided"}

---EXISTING RESUME CONTENT---
${existingResume || "Not provided"}

${extractedResume ? `
---EXTRACTED RESUME DATA---
${JSON.stringify(extractedResume, null, 2)}
` : ""}

${profileAnalysis ? `
---PROFILE ANALYSIS---
Core Skills: ${profileAnalysis.coreSkills?.join(", ") || "None identified"}
Soft Skills: ${profileAnalysis.softSkills?.join(", ") || "None identified"}
Summary: ${profileAnalysis.summary || "None"}
` : ""}

${skillAnalysis ? `
---SKILL ANALYSIS---
Strengths: ${skillAnalysis.uniqueStrengths?.join(", ") || "None identified"}
Target Markets: ${skillAnalysis.industryFit?.join(", ") || "None identified"}
Professional Summary: ${skillAnalysis.professionalSummary || "None"}
` : ""}

---INSTRUCTIONS---
1. Create a compelling professional summary tailored to the ${role} role
2. Transform experience bullets into achievement-focused statements with metrics
3. Optimize for ATS with relevant keywords for ${role}
4. If experience data is provided, enhance it - do NOT invent new positions
5. Return valid JSON only`;

  console.log("[CV Agent] Generating professional CV...");

  const result = await runClaudeCodeForJSON(
    CV_GENERATION_PROMPT,
    userPrompt,
    getDefaultCV(input),
    { timeout: 120000 }
  );

  // Validate and transform to expected format
  return transformCVResult(result, input);
}

/**
 * Generate section-specific improvements
 *
 * @param {string} section - Section to improve (summary, experience, skills)
 * @param {string} content - Current content
 * @param {string} targetRole - Target role for optimization
 * @returns {Promise<string>} - Improved content
 */
export async function improveCVSection(section, content, targetRole) {
  if (!isClaudeCodeEnabled()) {
    return null;
  }

  const sectionPrompts = {
    summary: `Rewrite this professional summary to be more compelling and targeted for a ${targetRole} role. Make it 3-4 sentences, specific, and impactful. Return ONLY the new summary text, no JSON.`,
    experience: `Transform these experience bullets into achievement-focused statements using the X-Y-Z formula. Add metrics where possible. Return as JSON array of strings.`,
    skills: `Optimize this skills section for a ${targetRole} role. Add relevant keywords, organize by category. Return as JSON: {"technical": [], "tools": [], "soft": []}`,
  };

  const prompt = sectionPrompts[section] || "Improve this content professionally.";

  const { runClaudeCode } = await import("./claudeCodeRunner.js");
  return runClaudeCode(prompt, content, { timeout: 60000 });
}

/**
 * Get default CV structure
 */
function getDefaultCV(input) {
  const { userInfo, extractedResume, profileAnalysis, skillAnalysis } = input;

  return {
    cv: {
      fullName: userInfo?.fullName || extractedResume?.contact?.name || "",
      title: profileAnalysis?.suggestedRoles?.[0] || "Professional",
      contact: {
        email: userInfo?.email || extractedResume?.contact?.email || "",
        phone: userInfo?.phone || extractedResume?.contact?.phone || "",
        location: userInfo?.location || extractedResume?.contact?.location || "",
        linkedin: userInfo?.linkedinUrl || extractedResume?.contact?.linkedin || "",
        portfolio: extractedResume?.contact?.portfolio || null,
      },
      summary: profileAnalysis?.summary || skillAnalysis?.professionalSummary || "",
      experience: extractedResume?.experience || [],
      education: extractedResume?.education || [],
      skills: {
        technical: profileAnalysis?.coreSkills || extractedResume?.skills?.technical || [],
        tools: extractedResume?.skills?.tools || [],
        soft: profileAnalysis?.softSkills || extractedResume?.skills?.soft || [],
      },
      certifications: extractedResume?.certifications || [],
      languages: extractedResume?.spokenLanguages?.map((l) => `${l.language} (${l.proficiency})`) || [],
      projects: extractedResume?.projects || [],
    },
    atsOptimization: {
      score: 50,
      keywordsIncluded: [],
      keywordsMissing: [],
      formatScore: 60,
      readabilityScore: 60,
    },
    improvements: ["Enable Claude Code (USE_CLAUDE_CODE=true) for AI-powered CV generation"],
    targetRoleAlignment: {
      alignmentScore: 50,
      strengths: [],
      gaps: [],
    },
    bulletTransformations: [],
    _generatedBy: "fallback",
  };
}

/**
 * Transform result to match existing API format
 */
function transformCVResult(result, input) {
  if (!result || !result.cv) {
    return getDefaultCV(input);
  }

  // Mark as generated by Claude Code
  result._generatedBy = "claude-code-agent";

  // Map to existing API format for compatibility
  const cv = result.cv;

  return {
    // New structured format
    ...result,

    // Legacy format mapping for backward compatibility
    fullName: cv.fullName,
    title: cv.title,
    email: cv.contact?.email,
    phone: cv.contact?.phone,
    location: cv.contact?.location,
    linkedin: cv.contact?.linkedin,
    summary: cv.summary,
    experience: cv.experience || [],
    education: cv.education || [],
    skills: cv.skills || { technical: [], soft: [] },
    certifications: cv.certifications || [],

    // ATS info
    atsScore: result.atsOptimization?.score || 70,
    atsKeywords: result.atsOptimization?.keywordsIncluded || [],
    improvements: result.improvements || [],

    // Metadata
    hasExperienceData: (cv.experience || []).length > 0,
    aiPowered: true,
    dataSource: {
      note: "CV generated by Claude Code agent using only your provided information.",
      aiEnhanced: true,
    },
  };
}

export default { generateCV, improveCVSection };
