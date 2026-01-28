/**
 * CV Generation Service - AI-POWERED
 *
 * Uses GPT to create professional, ATS-optimized CVs:
 * - AI-written professional summaries
 * - Impact-focused bullet point rewrites
 * - Keyword optimization for target roles
 * - Clean, parseable formatting
 *
 * CRITICAL RULE: NEVER hallucinate or invent data.
 * Only enhance and reformat information the user provides.
 */
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";
import { generateCV as generateWithAgent, isClaudeCodeEnabled } from "../agents/index.js";

/**
 * System prompt for CV content generation
 */
const CV_WRITER_PROMPT = `You are an elite CV/resume writer who has helped thousands of candidates land jobs at top companies (Google, Amazon, McKinsey, Goldman Sachs, etc.).

Your task is to transform the provided candidate information into a powerful, ATS-optimized CV.

CRITICAL RULES:
1. NEVER invent or assume information not provided
2. ONLY use facts from the input - enhance presentation, not content
3. If experience details are missing, leave them blank - do NOT create fake jobs
4. Transform weak bullets into impact-focused achievements
5. Quantify achievements where numbers are provided

CV WRITING PRINCIPLES:
- Start bullets with strong action verbs (Led, Developed, Achieved, Delivered, Optimized)
- Use the X-Y-Z formula: "Accomplished X by doing Y, resulting in Z"
- Prioritize quantifiable achievements (%, $, #)
- Tailor keywords to the target role
- Keep it scannable - bullets should be 1-2 lines max
- Professional summary should be compelling and specific

Return ONLY valid JSON with this structure:
{
  "fullName": "Name from input",
  "title": "Professional title aligned with target role",
  "email": "Email from input",
  "phone": "Phone from input",
  "location": "Location from input",
  "linkedin": "LinkedIn from input",
  "summary": "Compelling 3-4 sentence professional summary",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "duration": "Start - End",
      "bullets": ["Achievement-focused bullet 1", "Achievement-focused bullet 2", "Achievement-focused bullet 3"]
    }
  ],
  "skills": {
    "technical": ["Technical skills from input"],
    "soft": ["Soft skills from input"]
  },
  "education": [
    {
      "degree": "Degree from input",
      "institution": "School from input",
      "year": "Year from input"
    }
  ],
  "certifications": ["Certifications from input"],
  "atsScore": 70-95,
  "atsKeywords": ["Keywords optimized for target role"],
  "improvements": ["Specific suggestions for this CV"]
}`;

/**
 * System prompt for rewriting experience bullets
 */
const BULLET_REWRITER_PROMPT = `You are an expert at transforming weak resume bullets into powerful, achievement-focused statements.

TRANSFORMATION RULES:
1. Start with a strong action verb
2. Include specific metrics/numbers if available in the original
3. Focus on outcomes and impact, not just responsibilities
4. Keep it concise - 1-2 lines max
5. NEVER add information not in the original

FORMULA: Action Verb + What You Did + Impact/Result

Examples:
- WEAK: "Responsible for managing team"
  STRONG: "Led cross-functional team of 8 engineers, delivering projects 15% ahead of schedule"

- WEAK: "Worked on customer support"
  STRONG: "Resolved 50+ daily customer inquiries, maintaining 98% satisfaction rating"

- WEAK: "Helped with marketing campaigns"
  STRONG: "Drove 3 marketing campaigns generating $150K in qualified pipeline"

Transform the provided bullets. Return as JSON array of strings.
If a bullet already has numbers/metrics, preserve them exactly.`;

/**
 * Parse resume text to extract structured experience
 */
function parseResumeForExperience(resumeText) {
  if (!resumeText || resumeText.length < 50) return [];

  // Simple extraction - look for common patterns
  const experience = [];
  const sections = resumeText.split(/(?:experience|work history|employment)/i);

  if (sections.length > 1) {
    const expSection = sections[1].split(/(?:education|skills|certifications|projects)/i)[0];

    // Look for job entries (Company - Title patterns)
    const jobPattern = /([A-Z][a-zA-Z\s&]+)\s*[-–|]\s*([A-Za-z\s]+)\s*(?:\()?(\d{4}|\w+\s*\d{4})\s*[-–to]+\s*(\d{4}|present|current)?/gi;
    let match;

    while ((match = jobPattern.exec(expSection)) !== null) {
      experience.push({
        company: match[1].trim(),
        title: match[2].trim(),
        duration: `${match[3]} - ${match[4] || "Present"}`,
        location: "",
        bullets: []
      });
    }
  }

  return experience;
}

/**
 * Extract education from resume text
 */
function parseResumeForEducation(resumeText) {
  if (!resumeText) return [];

  const education = [];
  const eduPatterns = [
    /(?:B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA|Bachelor|Master|Doctor)[^\n]*(?:in|of)?\s*([^\n,]+)/gi,
    /([A-Z][a-zA-Z\s]+(?:University|College|Institute|School))[^\n]*/gi
  ];

  for (const pattern of eduPatterns) {
    let match;
    while ((match = pattern.exec(resumeText)) !== null) {
      const text = match[0];
      const yearMatch = text.match(/20\d{2}|19\d{2}/);

      education.push({
        degree: text.split(/,|-|at/)[0].trim().slice(0, 100),
        institution: text.match(/(?:University|College|Institute|School)[^\n,]*/i)?.[0]?.trim() || "",
        year: yearMatch?.[0] || ""
      });
    }
  }

  return education.slice(0, 3);
}

/**
 * Generate CV using AI
 *
 * @param {Object} input - CV generation input
 * @returns {Promise<Object>} - Generated CV data
 */
export async function generateCV(input) {
  const { profileAnalysis, userInfo, existingResume } = input;

  // Extract all available data
  const name = userInfo?.fullName || "";
  const email = userInfo?.email || "";
  const phone = userInfo?.phone || "";
  const location = userInfo?.location || userInfo?.locations?.[0] || "";
  const linkedin = userInfo?.linkedinUrl || "";
  const selfDescription = userInfo?.selfDescription || "";
  const targetRole = profileAnalysis?.suggestedRoles?.[0] || "";
  const skills = profileAnalysis?.coreSkills || [];
  const softSkills = profileAnalysis?.softSkills || [];
  const experienceLevel = profileAnalysis?.experienceLevel || "mid";
  const years = profileAnalysis?.yearsOfExperience || 0;

  // Parse experience and education from resume
  const parsedExperience = input.parsedExperience || parseResumeForExperience(existingResume);
  const parsedEducation = input.parsedEducation || parseResumeForEducation(existingResume);
  const certifications = input.parsedCertifications || [];

  // Try Claude Code agent first if enabled
  if (isClaudeCodeEnabled()) {
    console.log("[CV Generation] Using Claude Code agent for CV generation...");
    try {
      const agentResult = await generateWithAgent({
        profileAnalysis,
        extractedResume: input.extractedResume,
        userInfo: {
          fullName: name,
          email,
          phone,
          location,
          linkedinUrl: linkedin,
          selfDescription,
          locations: userInfo?.locations,
        },
        existingResume,
        targetRole,
      });
      if (agentResult && agentResult._generatedBy === "claude-code-agent") {
        console.log("[CV Generation] ✓ Claude Code agent CV generation successful");
        return agentResult;
      }
    } catch (err) {
      console.log("[CV Generation] Claude Code agent error (continuing with API):", err.message);
    }
  }

  // Check if AI is available
  if (!isAIAvailable()) {
    console.warn("[CV Generation] AI not available - returning basic CV structure");
    return generateBasicCV({
      name, email, phone, location, linkedin, targetRole,
      skills, softSkills, experienceLevel, years,
      parsedExperience, parsedEducation, certifications, selfDescription
    });
  }

  // Build comprehensive prompt for AI
  const userPrompt = `
Generate a professional CV for this candidate:

CONTACT INFORMATION:
- Name: ${name || "Not provided"}
- Email: ${email || "Not provided"}
- Phone: ${phone || "Not provided"}
- Location: ${location || "Not provided"}
- LinkedIn: ${linkedin || "Not provided"}

TARGET ROLE: ${targetRole || "Not specified"}
EXPERIENCE LEVEL: ${experienceLevel} (${years} years)

SELF-DESCRIPTION:
${selfDescription || "Not provided"}

EXISTING RESUME CONTENT:
${existingResume || "No existing resume provided"}

SKILLS IDENTIFIED:
Technical: ${skills.join(", ") || "Not specified"}
Soft: ${softSkills.join(", ") || "Not specified"}

PARSED EXPERIENCE:
${parsedExperience.length > 0 ? JSON.stringify(parsedExperience, null, 2) : "No structured experience data"}

PARSED EDUCATION:
${parsedEducation.length > 0 ? JSON.stringify(parsedEducation, null, 2) : "No structured education data"}

CERTIFICATIONS: ${certifications.join(", ") || "None listed"}

IMPORTANT INSTRUCTIONS:
1. Create a compelling professional summary tailored to ${targetRole || "their career goals"}
2. If experience is provided, rewrite bullets for maximum impact
3. If no experience is provided, leave the experience array empty - do NOT invent fake jobs
4. Optimize keywords for ATS compatibility with the target role
5. Return valid JSON only`;

  console.log("[CV Generation] Calling AI for CV creation...");
  const cvResponse = await callAI(CV_WRITER_PROMPT, userPrompt, {
    model: "fast", // Use GPT-4o-mini (cost-effective)
    maxTokens: 3000,
    temperature: 0.6
  });

  // Generate fallback CV
  const fallbackCV = generateBasicCV({
    name, email, phone, location, linkedin, targetRole,
    skills, softSkills, experienceLevel, years,
    parsedExperience, parsedEducation, certifications, selfDescription
  });

  const generatedCV = parseAIResponse(cvResponse, fallbackCV);

  // If AI enhanced the experience bullets, use them; otherwise keep parsed
  if (!generatedCV.experience || generatedCV.experience.length === 0) {
    generatedCV.experience = parsedExperience;
    generatedCV.hasExperienceData = parsedExperience.length > 0;
  } else {
    generatedCV.hasExperienceData = true;
  }

  // Ensure education is included
  if (!generatedCV.education || generatedCV.education.length === 0) {
    generatedCV.education = parsedEducation;
  }

  // Mark as AI-powered
  generatedCV.aiPowered = cvResponse !== null;
  generatedCV.dataSource = {
    note: "CV generated by AI using only your provided information. No data was invented.",
    aiEnhanced: cvResponse !== null
  };

  return generatedCV;
}

/**
 * Generate basic CV without AI (fallback)
 */
function generateBasicCV(data) {
  const {
    name, email, phone, location, linkedin, targetRole,
    skills, softSkills, experienceLevel, years,
    parsedExperience, parsedEducation, certifications, selfDescription
  } = data;

  // Generate basic summary
  let summary = "";
  if (targetRole && skills.length > 0) {
    const topSkills = skills.slice(0, 3).join(", ");
    if (years > 0) {
      summary = `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}-level ${targetRole} with ${years}+ years of experience. Core expertise in ${topSkills}. Seeking opportunities to drive impact and growth.`;
    } else {
      summary = `Aspiring ${targetRole} with skills in ${topSkills}. Eager to contribute and grow in a dynamic environment.`;
    }
  } else if (selfDescription) {
    summary = selfDescription.slice(0, 300);
  }

  return {
    fullName: name,
    title: targetRole || "Professional",
    email,
    phone,
    location,
    linkedin,
    summary,
    experience: parsedExperience || [],
    hasExperienceData: (parsedExperience || []).length > 0,
    skills: {
      technical: skills,
      soft: softSkills
    },
    education: parsedEducation || [],
    certifications: certifications || [],
    atsScore: calculateBasicATSScore(data),
    atsKeywords: [...skills.slice(0, 6), targetRole].filter(Boolean),
    improvements: [
      "Configure OPENAI_API_KEY for AI-enhanced CV generation",
      "Add quantifiable achievements to your experience",
      "Include relevant keywords for your target role",
      "Ensure your summary highlights your unique value proposition"
    ],
    aiPowered: false,
    warning: "Basic CV generated without AI. Set OPENAI_API_KEY for professional AI-enhanced CV."
  };
}

/**
 * Calculate basic ATS score without AI
 */
function calculateBasicATSScore(data) {
  let score = 45;

  if (data.skills?.length >= 5) score += 10;
  if (data.parsedExperience?.length > 0) score += 15;
  if (data.parsedEducation?.length > 0) score += 5;
  if (data.selfDescription?.length > 100) score += 5;
  if (data.email) score += 3;
  if (data.phone) score += 2;
  if (data.linkedin) score += 5;

  return Math.min(85, score);
}

/**
 * Convert CV data to downloadable HTML format
 */
export function cvToHTML(cvData) {
  const {
    fullName = "",
    title = "",
    email = "",
    phone = "",
    location = "",
    linkedin = "",
    summary = "",
    experience = [],
    skills = {},
    education = [],
    certifications = []
  } = cvData;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fullName} - CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: #fff;
    }
    h1 {
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 4px;
      font-weight: 600;
    }
    h2 {
      font-size: 16px;
      color: #4a5568;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .contact {
      font-size: 13px;
      color: #555;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .contact a {
      color: #2563eb;
      text-decoration: none;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-bottom: 14px;
    }
    .summary {
      font-size: 14px;
      color: #444;
      line-height: 1.7;
    }
    .job {
      margin-bottom: 20px;
    }
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }
    .job-title {
      font-weight: 600;
      font-size: 15px;
      color: #1a1a1a;
    }
    .job-company {
      color: #4a5568;
      font-size: 14px;
    }
    .job-duration {
      color: #718096;
      font-size: 13px;
      white-space: nowrap;
    }
    .job-bullets {
      padding-left: 20px;
      font-size: 13px;
      color: #444;
    }
    .job-bullets li {
      margin-bottom: 5px;
      line-height: 1.5;
    }
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill {
      background: #f0f4f8;
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 12px;
      color: #2d3748;
      font-weight: 500;
    }
    .edu-item {
      margin-bottom: 10px;
      font-size: 14px;
    }
    .edu-degree {
      font-weight: 600;
      color: #1a1a1a;
    }
    .edu-school {
      color: #4a5568;
    }
    @media print {
      body { padding: 20px; }
      .section-title { border-bottom-color: #333; }
    }
  </style>
</head>
<body>
  <h1>${fullName}</h1>
  <h2>${title}</h2>
  <div class="contact">
    ${email ? `<span>${email}</span>` : ""}
    ${phone ? `<span>${phone}</span>` : ""}
    ${location ? `<span>${location}</span>` : ""}
    ${linkedin ? `<a href="${linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}" target="_blank">${linkedin}</a>` : ""}
  </div>

  ${summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p class="summary">${summary}</p>
  </div>
  ` : ""}

  ${experience.length > 0 ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${experience.map(job => `
      <div class="job">
        <div class="job-header">
          <div>
            <div class="job-title">${job.title || ""}</div>
            <div class="job-company">${job.company || ""}${job.location ? ` - ${job.location}` : ""}</div>
          </div>
          <div class="job-duration">${job.duration || ""}</div>
        </div>
        ${job.bullets && job.bullets.length > 0 ? `
        <ul class="job-bullets">
          ${job.bullets.map(b => `<li>${b}</li>`).join("")}
        </ul>
        ` : ""}
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${(skills.technical?.length > 0 || skills.soft?.length > 0) ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-list">
      ${[...(skills.technical || []), ...(skills.soft || [])].map(s => `<span class="skill">${s}</span>`).join("")}
    </div>
  </div>
  ` : ""}

  ${education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${education.map(edu => `
      <div class="edu-item">
        <span class="edu-degree">${edu.degree || ""}</span>
        ${edu.institution ? ` - <span class="edu-school">${edu.institution}</span>` : ""}
        ${edu.year ? `, ${edu.year}` : ""}
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${certifications?.length > 0 ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    <div class="skills-list">
      ${certifications.map(c => `<span class="skill">${c}</span>`).join("")}
    </div>
  </div>
  ` : ""}
</body>
</html>`;
}
