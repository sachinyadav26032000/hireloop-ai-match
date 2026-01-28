/**
 * Resume Extraction Agent
 *
 * Specialized Claude Code agent for extracting structured data from resumes.
 * Handles PDF text, Word document text, and raw resume content.
 *
 * Outputs:
 * - Contact info (name, email, phone, LinkedIn)
 * - Work experience (structured)
 * - Education (structured)
 * - Skills (technical + soft)
 * - Certifications
 * - Suggested roles based on experience
 */
import { runClaudeCodeForJSON, isClaudeCodeEnabled } from "./claudeCodeRunner.js";

const RESUME_EXTRACTION_PROMPT = `You are an expert resume parser with 15+ years of experience in HR tech and ATS systems.

Your task is to extract ALL structured information from the provided resume text.

EXTRACTION RULES:
1. Extract EXACTLY what's in the document - never invent or assume data
2. For ambiguous dates, make reasonable estimates (e.g., "3 years ago" → calculate from 2024)
3. Normalize job titles to standard formats (e.g., "Sr. SWE" → "Senior Software Engineer")
4. Extract skills mentioned explicitly AND skills implied by technologies/projects
5. Identify experience level from job titles and total years
6. If information is missing, use null - don't guess

EXTRACTION FOCUS:
- Contact: name, email, phone, location, LinkedIn URL, portfolio/GitHub
- Experience: company, title, dates, location, bullet points (preserve original text)
- Education: degree, field, institution, year, GPA if mentioned
- Skills: separate technical skills from soft skills
- Certifications: name, issuer, date if available
- Languages: spoken languages with proficiency
- Projects: notable projects with tech stack

Return ONLY valid JSON with this exact structure:
{
  "contact": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1-xxx-xxx-xxxx",
    "location": "City, Country",
    "linkedin": "linkedin.com/in/...",
    "github": "github.com/...",
    "portfolio": "url or null"
  },
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "location": "City, Country",
      "bullets": ["Original bullet point 1", "Original bullet point 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Type",
      "field": "Field of Study",
      "institution": "University/School Name",
      "year": "Graduation Year",
      "gpa": "GPA if mentioned or null"
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "soft": ["Communication", "Leadership"],
    "tools": ["Tool 1", "Tool 2"],
    "languages": ["Python", "JavaScript"]
  },
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date or null"
    }
  ],
  "spokenLanguages": [
    {"language": "English", "proficiency": "Native"}
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "techStack": ["Tech 1", "Tech 2"]
    }
  ],
  "summary": {
    "totalYearsExperience": number,
    "experienceLevel": "entry|junior|mid|senior|lead|executive",
    "primaryDomain": "Main industry/domain",
    "suggestedRoles": ["Role 1", "Role 2", "Role 3"]
  }
}`;

/**
 * Extract structured data from resume text using Claude Code
 *
 * @param {string} resumeText - Raw text extracted from resume file
 * @param {Object} options - Additional context
 * @returns {Promise<Object>} - Structured resume data
 */
export async function extractResumeData(resumeText, options = {}) {
  if (!resumeText || resumeText.length < 50) {
    console.warn("[Resume Agent] Resume text too short for extraction");
    return getEmptyExtractionResult();
  }

  if (!isClaudeCodeEnabled()) {
    console.warn("[Resume Agent] Claude Code not enabled (set USE_CLAUDE_CODE=true)");
    return null; // Let caller fall back to other methods
  }

  const userPrompt = `Extract all structured information from this resume:

---RESUME START---
${resumeText.slice(0, 30000)}
---RESUME END---

Remember: Extract exactly what's present, use null for missing fields, never invent data.`;

  console.log("[Resume Agent] Extracting resume data...");

  const result = await runClaudeCodeForJSON(
    RESUME_EXTRACTION_PROMPT,
    userPrompt,
    getEmptyExtractionResult(),
    { timeout: 90000 }
  );

  // Validate and clean result
  return validateExtractionResult(result);
}

/**
 * Get empty extraction result structure
 */
function getEmptyExtractionResult() {
  return {
    contact: {
      name: null,
      email: null,
      phone: null,
      location: null,
      linkedin: null,
      github: null,
      portfolio: null,
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      tools: [],
      languages: [],
    },
    certifications: [],
    spokenLanguages: [],
    projects: [],
    summary: {
      totalYearsExperience: null,
      experienceLevel: null,
      primaryDomain: null,
      suggestedRoles: [],
    },
  };
}

/**
 * Validate and clean extraction result
 */
function validateExtractionResult(result) {
  const empty = getEmptyExtractionResult();

  if (!result || typeof result !== "object") {
    return empty;
  }

  // Ensure all expected fields exist
  return {
    contact: {
      name: result.contact?.name || null,
      email: result.contact?.email || null,
      phone: result.contact?.phone || null,
      location: result.contact?.location || null,
      linkedin: result.contact?.linkedin || null,
      github: result.contact?.github || null,
      portfolio: result.contact?.portfolio || null,
    },
    experience: Array.isArray(result.experience) ? result.experience : [],
    education: Array.isArray(result.education) ? result.education : [],
    skills: {
      technical: Array.isArray(result.skills?.technical) ? result.skills.technical : [],
      soft: Array.isArray(result.skills?.soft) ? result.skills.soft : [],
      tools: Array.isArray(result.skills?.tools) ? result.skills.tools : [],
      languages: Array.isArray(result.skills?.languages) ? result.skills.languages : [],
    },
    certifications: Array.isArray(result.certifications) ? result.certifications : [],
    spokenLanguages: Array.isArray(result.spokenLanguages) ? result.spokenLanguages : [],
    projects: Array.isArray(result.projects) ? result.projects : [],
    summary: {
      totalYearsExperience: result.summary?.totalYearsExperience || null,
      experienceLevel: result.summary?.experienceLevel || null,
      primaryDomain: result.summary?.primaryDomain || null,
      suggestedRoles: Array.isArray(result.summary?.suggestedRoles) ? result.summary.suggestedRoles : [],
    },
    _extractedBy: "claude-code-agent",
  };
}

export default { extractResumeData };
