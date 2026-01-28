/**
 * Resume Parser Service - PRODUCTION GRADE
 * Extracts text and structured data from uploaded resume files
 * Supports: PDF, DOCX, DOC, TXT
 *
 * FEATURES:
 * - Name/email mismatch detection
 * - Session data conflict detection
 * - Graceful error handling
 * - AI-powered skill suggestions
 * - AI-generated profile summary
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// pdf-parse v2 exports PDFParse class
const { PDFParse } = require("pdf-parse");
import mammoth from "mammoth";
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";
import { extractResumeData as extractWithAgent, isClaudeCodeEnabled } from "../agents/index.js";

/**
 * Detect mismatches between form data and resume data
 * Returns warnings for user review
 */
export function detectDataMismatches(formData, resumeData) {
  const mismatches = [];

  // Check name mismatch
  if (formData.fullName && resumeData.name) {
    const formNameLower = formData.fullName.toLowerCase().trim();
    const resumeNameLower = resumeData.name.toLowerCase().trim();

    // Check if names are significantly different
    if (!namesAreRelated(formNameLower, resumeNameLower)) {
      mismatches.push({
        field: "name",
        formValue: formData.fullName,
        resumeValue: resumeData.name,
        message: `Name in resume "${resumeData.name}" differs from form "${formData.fullName}". Please verify.`
      });
    }
  }

  // Check email mismatch
  if (formData.email && resumeData.email) {
    const formEmailLower = formData.email.toLowerCase().trim();
    const resumeEmailLower = resumeData.email.toLowerCase().trim();

    if (formEmailLower !== resumeEmailLower) {
      mismatches.push({
        field: "email",
        formValue: formData.email,
        resumeValue: resumeData.email,
        message: `Email in resume "${resumeData.email}" differs from form "${formData.email}". Please verify.`
      });
    }
  }

  // Check phone mismatch
  if (formData.phone && resumeData.phone) {
    const formPhoneDigits = (formData.phone || "").replace(/\D/g, "");
    const resumePhoneDigits = (resumeData.phone || "").replace(/\D/g, "");

    if (formPhoneDigits.length > 5 && resumePhoneDigits.length > 5 &&
        !formPhoneDigits.includes(resumePhoneDigits.slice(-10)) &&
        !resumePhoneDigits.includes(formPhoneDigits.slice(-10))) {
      mismatches.push({
        field: "phone",
        formValue: formData.phone,
        resumeValue: resumeData.phone,
        message: `Phone in resume "${resumeData.phone}" differs from form. Please verify.`
      });
    }
  }

  return mismatches;
}

/**
 * Check if two names are related (same person)
 * Handles variations like "John Smith" vs "John J. Smith" vs "J. Smith"
 */
function namesAreRelated(name1, name2) {
  if (!name1 || !name2) return true; // Can't compare, assume OK

  // Exact match
  if (name1 === name2) return true;

  const words1 = name1.split(/\s+/).filter(w => w.length > 1);
  const words2 = name2.split(/\s+/).filter(w => w.length > 1);

  if (words1.length === 0 || words2.length === 0) return true;

  // Check if at least one word matches (first or last name)
  for (const w1 of words1) {
    for (const w2 of words2) {
      // Full match or one is abbreviation of other
      if (w1 === w2 || w1.startsWith(w2) || w2.startsWith(w1)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parse resume file and extract text content
 * FAIL-SAFE: Always returns success, gracefully degrades on errors
 */
export async function parseResumeFile(fileBuffer, mimeType, filename) {
  const extension = filename?.split(".").pop()?.toLowerCase();

  // Default empty result for graceful degradation
  const emptyExtractedData = {
    name: null,
    email: null,
    phone: null,
    linkedin: null,
    skills: [],
    experience: [],
    education: [],
    suggestedRoles: [],
  };

  let text = "";

  try {
    if (mimeType === "application/pdf" || extension === "pdf") {
      text = await parsePDF(fileBuffer);
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    ) {
      text = await parseDOCX(fileBuffer);
    } else if (mimeType === "application/msword" || extension === "doc") {
      // For older .doc files, try mammoth (limited support)
      text = await parseDOCX(fileBuffer);
    } else if (mimeType === "text/plain" || extension === "txt") {
      text = fileBuffer.toString("utf-8");
    } else {
      // FAIL-SAFE: Try to read as text anyway
      try {
        text = fileBuffer.toString("utf-8");
      } catch {
        text = "";
      }
    }
  } catch (parseError) {
    // FAIL-SAFE: Log but don't fail
    console.log("[ResumeParser] Parse attempt issue (gracefully degrading):", parseError.message);
    text = "";
  }

  // Clean up extracted text (with fallback)
  try {
    text = cleanResumeText(text || "");
  } catch {
    text = "";
  }

  // Extract structured data (with fallback)
  let extractedData = emptyExtractedData;
  try {
    if (text && text.length > 0) {
      extractedData = extractResumeData(text);
    }
  } catch {
    extractedData = emptyExtractedData;
  }

  // Try Claude Code agent for enhanced extraction if enabled
  let agentExtraction = null;
  if (isClaudeCodeEnabled() && text && text.length > 100) {
    console.log("[ResumeParser] Using Claude Code agent for enhanced extraction...");
    try {
      agentExtraction = await extractWithAgent(text);
      if (agentExtraction) {
        console.log("[ResumeParser] ✓ Claude Code agent extraction successful");
        // Merge agent extraction with basic extraction
        extractedData = {
          name: agentExtraction.contact?.name || extractedData.name,
          email: agentExtraction.contact?.email || extractedData.email,
          phone: agentExtraction.contact?.phone || extractedData.phone,
          linkedin: agentExtraction.contact?.linkedin || extractedData.linkedin,
          skills: [
            ...(agentExtraction.skills?.technical || []),
            ...(agentExtraction.skills?.soft || []),
            ...(agentExtraction.skills?.tools || []),
          ],
          experience: agentExtraction.experience || extractedData.experience,
          education: agentExtraction.education || extractedData.education,
          suggestedRoles: agentExtraction.summary?.suggestedRoles || extractedData.suggestedRoles,
        };
      }
    } catch (err) {
      console.log("[ResumeParser] Claude Code agent error (continuing with basic):", err.message);
    }
  }

  // ALWAYS return success
  return {
    success: true,
    text: text || "",
    extractedData: extractedData || emptyExtractedData,
    wordCount: text ? text.split(/\s+/).filter(w => w.length > 0).length : 0,
    agentExtraction: agentExtraction, // Include full agent extraction if available
  };
}

/**
 * Parse PDF file using pdf-parse v2 API - FAIL-SAFE
 */
async function parsePDF(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const result = await parser.getText();
    // Result has { pages: [], text: string, total: number }
    return result?.text || "";
  } catch (error) {
    console.log("[ResumeParser] PDF parse issue (gracefully degrading):", error.message);
    return "";
  }
}

/**
 * Parse DOCX file - FAIL-SAFE
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || "";
  } catch (error) {
    console.log("[ResumeParser] DOCX parse issue (gracefully degrading):", error.message);
    return "";
  }
}

/**
 * Clean up extracted text
 */
function cleanResumeText(text) {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
    .replace(/\t+/g, " ") // Replace tabs with spaces
    .replace(/ {2,}/g, " ") // Remove multiple spaces
    .trim();
}

/**
 * Extract structured data from resume text using pattern matching
 */
function extractResumeData(text) {
  const data = {
    name: null,
    email: null,
    phone: null,
    linkedin: null,
    skills: [],
    experience: [],
    education: [],
    suggestedRoles: [],
  };

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    data.email = emailMatch[0].toLowerCase();
  }

  // Extract phone (various formats)
  const phoneMatch = text.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    data.phone = phoneMatch[0];
  }

  // Extract LinkedIn URL
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
  if (linkedinMatch) {
    let url = linkedinMatch[0];
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }
    data.linkedin = url;
  }

  // Extract name (usually at the top of resume)
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    // First non-empty line is often the name
    const firstLine = lines[0].trim();
    // Check if it looks like a name (2-4 words, alphabetic)
    const nameWords = firstLine.split(/\s+/);
    if (nameWords.length >= 2 && nameWords.length <= 5 && /^[a-zA-Z\s\-'.]+$/.test(firstLine)) {
      data.name = firstLine;
    }
  }

  // Extract skills using common skill keywords
  const skillKeywords = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    // Frontend
    "React", "Angular", "Vue", "Next.js", "HTML", "CSS", "SASS", "Tailwind", "Bootstrap",
    // Backend
    "Node.js", "Express", "Django", "Flask", "Spring", "FastAPI", "GraphQL", "REST",
    // Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase", "DynamoDB",
    // Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform",
    // Data & ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Data Analysis",
    // Tools
    "Git", "Jira", "Figma", "Photoshop", "Excel", "Tableau", "Power BI",
    // Soft Skills
    "Leadership", "Communication", "Team Management", "Project Management", "Agile", "Scrum",
    // Business & Management Skills
    "Sales", "Marketing", "Business Development", "Strategic Planning", "P&L Management",
    "Revenue Growth", "Operations", "Channel Sales", "Distribution", "Account Management",
    "Customer Success", "Negotiation", "Stakeholder Management", "Budget Management",
    "Team Building", "Mentoring", "Training", "Public Speaking", "Presentation Skills",
    "CRM", "Salesforce", "HubSpot", "Analytics", "Market Research", "Competitive Analysis",
    "Product Launch", "Go-to-Market", "Partnership Development", "Vendor Management",
    "Cross-functional Collaboration", "Change Management", "Process Improvement",
    "KPI Management", "Performance Management", "Talent Acquisition", "Employee Engagement",
  ];

  const textLower = text.toLowerCase();
  for (const skill of skillKeywords) {
    if (textLower.includes(skill.toLowerCase())) {
      data.skills.push(skill);
    }
  }

  // Dedupe skills
  data.skills = [...new Set(data.skills)];

  // Suggest roles based on skills
  const roleMapping = {
    "Software Engineer": ["JavaScript", "Python", "Java", "C++", "Git"],
    "Frontend Developer": ["React", "Angular", "Vue", "HTML", "CSS", "JavaScript"],
    "Backend Developer": ["Node.js", "Django", "Flask", "SQL", "REST", "GraphQL"],
    "Full Stack Developer": ["React", "Node.js", "MongoDB", "Express", "JavaScript"],
    "Data Scientist": ["Python", "Machine Learning", "Pandas", "TensorFlow", "Data Analysis"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Data Analysis"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
    "Product Manager": ["Agile", "Scrum", "Jira", "Communication", "Leadership"],
    "UX Designer": ["Figma", "Photoshop", "User Research", "Wireframing"],
    "Project Manager": ["Project Management", "Agile", "Scrum", "Jira", "Leadership"],
    // Business Roles
    "Business Development Manager": ["Business Development", "Sales", "Negotiation", "Partnership Development", "Revenue Growth"],
    "Sales Manager": ["Sales", "Channel Sales", "Account Management", "CRM", "Negotiation"],
    "Operations Manager": ["Operations", "Process Improvement", "Team Management", "Budget Management", "KPI Management"],
    "General Manager": ["P&L Management", "Strategic Planning", "Team Building", "Operations", "Leadership"],
    "Marketing Manager": ["Marketing", "Market Research", "Analytics", "Product Launch", "Go-to-Market"],
    "HR Manager": ["Talent Acquisition", "Employee Engagement", "Performance Management", "Training", "Team Building"],
  };

  for (const [role, roleSkills] of Object.entries(roleMapping)) {
    const matchCount = roleSkills.filter(s =>
      data.skills.some(ds => ds.toLowerCase() === s.toLowerCase())
    ).length;
    if (matchCount >= 2) {
      data.suggestedRoles.push({ role, matchCount });
    }
  }

  // Sort by match count and take top 3
  data.suggestedRoles = data.suggestedRoles
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(r => r.role);

  return data;
}

/**
 * AI-powered resume analysis for suggestions
 * Generates: skill suggestions, profile summary (3 crisp lines)
 */
const RESUME_SUGGESTER_PROMPT = `You are an expert career coach who quickly analyzes resumes to provide smart suggestions.

Analyze this resume and provide:
1. KEY SKILLS - Extract 8-12 most relevant skills (both technical and soft skills)
2. PROFILE SUMMARY - Write exactly 3 crisp, impactful one-liner sentences summarizing the candidate

IMPORTANT RULES:
- Only extract skills actually mentioned or clearly implied in the resume
- For skills, include a mix of technical skills, domain expertise, and soft skills
- Profile summary should be professional, confident, and highlight key strengths
- Each summary line should be 15-25 words max
- Do NOT invent information not in the resume

Return ONLY valid JSON:
{
  "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3", ...],
  "profileSummary": [
    "First impactful one-liner about their core expertise.",
    "Second line about their key achievements or experience.",
    "Third line about their value proposition or career focus."
  ],
  "experienceYears": estimated_number_or_null,
  "primaryDomain": "Their main industry/domain"
}`;

/**
 * Generate AI-powered suggestions from resume text
 */
export async function generateResumeSuggestions(resumeText) {
  if (!resumeText || resumeText.length < 100) {
    return null;
  }

  // Check if AI is available
  if (!isAIAvailable()) {
    console.log("[ResumeParser] AI not available for suggestions");
    return null;
  }

  try {
    const prompt = `Analyze this resume and provide suggestions:

RESUME CONTENT:
${resumeText.slice(0, 4000)}

Provide skill suggestions and a 3-line profile summary.`;

    console.log("[ResumeParser] Generating AI suggestions...");
    const response = await callAI(RESUME_SUGGESTER_PROMPT, prompt, {
      model: "fast",
      maxTokens: 1000,
      temperature: 0.5
    });

    if (!response) {
      return null;
    }

    const suggestions = parseAIResponse(response, null);

    if (suggestions) {
      console.log("[ResumeParser] AI suggestions generated successfully");
      return {
        suggestedSkills: suggestions.suggestedSkills || [],
        profileSummary: suggestions.profileSummary || [],
        experienceYears: suggestions.experienceYears,
        primaryDomain: suggestions.primaryDomain
      };
    }

    return null;
  } catch (error) {
    console.log("[ResumeParser] AI suggestion error:", error.message);
    return null;
  }
}

/**
 * Generate basic suggestions without AI (fallback)
 */
export function generateBasicSuggestions(extractedData, resumeText) {
  const suggestions = {
    suggestedSkills: extractedData.skills || [],
    profileSummary: [],
    experienceYears: null,
    primaryDomain: null
  };

  // Generate basic profile summary from resume
  if (resumeText && resumeText.length > 100) {
    const lines = resumeText.split('\n').filter(l => l.trim().length > 20);

    // Try to find summary/objective section
    const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
    let summaryLines = [];

    for (let i = 0; i < lines.length && summaryLines.length < 3; i++) {
      const line = lines[i].toLowerCase();
      const isHeader = summaryKeywords.some(k => line.includes(k));

      if (isHeader && i + 1 < lines.length) {
        // Get next few lines after header
        for (let j = i + 1; j < lines.length && summaryLines.length < 3; j++) {
          const nextLine = lines[j].trim();
          if (nextLine.length > 30 && nextLine.length < 200 && !summaryKeywords.some(k => nextLine.toLowerCase().includes(k))) {
            summaryLines.push(nextLine);
          }
        }
        break;
      }
    }

    suggestions.profileSummary = summaryLines;
  }

  return suggestions;
}

export default { parseResumeFile, generateResumeSuggestions, generateBasicSuggestions };
