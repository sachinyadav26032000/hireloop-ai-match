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
import mammoth from "mammoth";
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";

// Import pdfjs-dist for robust PDF parsing
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Import Tesseract for OCR fallback (image-based PDFs)
import { createWorker } from "tesseract.js";

// OCR worker instance (lazy init)
let ocrWorker = null;

console.log("[ResumeParser] Module loaded - VERSION 2.0 with containsSectionWord fix");

// Common resume section headers to exclude from name detection (all lowercase)
const SECTION_HEADERS = [
  "profile summary", "professional summary", "summary", "objective",
  "experience", "work experience", "employment history", "work history",
  "education", "qualifications", "skills", "technical skills", "core competencies",
  "certifications", "projects", "achievements", "accomplishments", "awards",
  "contact", "contact information", "references", "languages", "interests",
  "personal information", "personal details", "hobbies", "volunteer", "publications",
  "profile", "career summary", "career objective", "about me", "about", "bio"
];

// Individual words that commonly appear in section headers
const SECTION_HEADER_WORDS = [
  "summary", "profile", "objective", "experience", "education", "skills",
  "certifications", "projects", "achievements", "awards", "contact", "references",
  "qualifications", "competencies", "history", "details", "information"
];

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

  // Calculate word count
  const wordCount = text ? text.split(/\s+/).filter(w => w.length > 0).length : 0;

  // Check if this appears to be an image-based PDF with low text extraction
  const isPDF = mimeType === "application/pdf" || extension === "pdf";
  const isImageBasedPDF = isPDF && wordCount < 30;

  // ALWAYS return success (graceful degradation)
  return {
    success: true,
    text: text || "",
    extractedData: extractedData || emptyExtractedData,
    wordCount: wordCount,
    isImageBasedPDF: isImageBasedPDF,
    message: isImageBasedPDF
      ? "This PDF appears to be image-based. For best results, please copy and paste your resume text in the About section."
      : null
  };
}

/**
 * Parse PDF file using pdfjs-dist - ROBUST HANDLING
 * Handles complex layouts, multi-column, and various PDF formats
 * Falls back to OCR for image-based PDFs
 */
async function parsePDF(buffer) {
  let fullText = "";

  try {
    // Convert buffer to Uint8Array for pdfjs
    const data = new Uint8Array(buffer);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
    const pdf = await loadingTask.promise;

    console.log(`[ResumeParser] PDF loaded: ${pdf.numPages} page(s)`);

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Sort text items by position for proper reading order
      const textItems = textContent.items
        .filter(item => item.str && item.str.trim().length > 0)
        .map(item => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || 0,
          height: item.height || item.transform[3] || 12
        }));

      // Group text by lines (items with similar Y position)
      const lines = [];
      let currentLine = [];
      let currentY = null;
      const lineThreshold = 5; // Y distance threshold for same line

      // Sort by Y (descending - top to bottom), then X (left to right)
      textItems.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > lineThreshold) return yDiff;
        return a.x - b.x;
      });

      for (const item of textItems) {
        if (currentY === null || Math.abs(item.y - currentY) <= lineThreshold) {
          currentLine.push(item);
          currentY = currentY || item.y;
        } else {
          if (currentLine.length > 0) {
            // Sort line items by X position
            currentLine.sort((a, b) => a.x - b.x);
            lines.push(currentLine);
          }
          currentLine = [item];
          currentY = item.y;
        }
      }
      if (currentLine.length > 0) {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine);
      }

      // Convert lines to text
      for (const line of lines) {
        const lineText = line.map(item => item.str).join(" ").trim();
        if (lineText.length > 0) {
          fullText += lineText + "\n";
        }
      }

      fullText += "\n"; // Page break
    }

    fullText = fullText.trim();
    const wordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`[ResumeParser] pdfjs extracted: ${wordCount} words`);

    // Debug: Show first 3 lines
    const debugLines = fullText.split('\n').slice(0, 3);
    console.log(`[ResumeParser] First 3 lines: ${JSON.stringify(debugLines)}`);

    // Check if extraction yielded enough content
    // If less than 50 words, the PDF is likely image-based
    if (wordCount < 50) {
      console.log("[ResumeParser] Low word count - PDF may be image-based, trying OCR...");
      const ocrText = await parsePDFWithOCR(buffer);
      if (ocrText && ocrText.split(/\s+/).length > wordCount) {
        console.log(`[ResumeParser] OCR extracted more content: ${ocrText.split(/\s+/).length} words`);
        return ocrText;
      }
    }

    return fullText;
  } catch (error) {
    console.log("[ResumeParser] pdfjs parse issue:", error.message);
    // Return empty string on failure - user can paste text manually
    return "";
  }
}

/**
 * Attempt OCR for image-based PDFs
 * Returns empty string with logging if OCR unavailable/fails
 */
async function parsePDFWithOCR(buffer) {
  // OCR is complex to set up on Windows - for now just log and return empty
  // User will need to paste text manually for image-based PDFs
  console.log("[ResumeParser] Image-based PDF detected. OCR not available in this environment.");
  console.log("[ResumeParser] Please copy and paste your resume text manually for best results.");
  return "";
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
  // Patterns:
  // +91 9113835789, +91-9372947627, 9630480704
  // (123) 456-7890, 123-456-7890
  const phonePatterns = [
    /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // US style: (123) 456-7890
    /\+?\d{1,3}[-.\s]?\d{10}/, // International: +91 9113835789 or +91-9372947627
    /\+?\d{1,3}[-.\s]?\d{5}[-.\s]?\d{5}/, // Split: +91 91138 35789
    /\b\d{10}\b/, // Plain 10 digit number
  ];

  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      data.phone = phoneMatch[0];
      break;
    }
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

  // Extract name (usually at the top of resume, but may appear later in two-column layouts)
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    // Try first 15 lines to find a name (skip section headers) - increased range for multi-column PDFs
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      const lineLower = line.toLowerCase();

      // BULLETPROOF check: skip exact "PROFILE SUMMARY" (case insensitive)
      if (lineLower === "profile summary" || lineLower === "profilesummary") {
        console.log(`[ResumeParser] SKIPPED line ${i} - exact match "profile summary"`);
        continue;
      }

      // Skip if it's a section header (check full match and word-by-word)
      const isSectionHeader = SECTION_HEADERS.some(header =>
        lineLower === header || lineLower.includes(header)
      );

      // Also check if line contains common section header words
      const lineWords = lineLower.split(/\s+/);
      const containsSectionWord = SECTION_HEADER_WORDS.some(word =>
        lineWords.includes(word)
      );

      // Direct check for common false positives (case-insensitive)
      const knownNotNames = ["profile summary", "professional summary", "career summary",
        "executive summary", "summary of qualifications", "work experience", "contact info"];
      const isKnownNotName = knownNotNames.some(notName => lineLower === notName || lineLower === notName.replace(/\s+/g, ""));

      console.log(`[ResumeParser] Name check line ${i}: "${line}" -> isSectionHeader: ${isSectionHeader}, containsSectionWord: ${containsSectionWord}, isKnownNotName: ${isKnownNotName}`);

      if (isSectionHeader || containsSectionWord || isKnownNotName) continue;

      // Skip if it contains email or phone
      if (line.includes("@") || /\d{10}|\d{3}[-.\s]\d{3}/.test(line)) continue;

      // Skip if it's a job title pattern (contains common job words)
      const jobTitleWords = ["engineer", "developer", "manager", "analyst", "executive", "director", "consultant", "specialist", "coordinator", "officer", "lead", "architect"];
      const isJobTitle = jobTitleWords.some(word => lineLower.includes(word));
      if (isJobTitle && !lineLower.match(/^[a-z]+\s+[a-z]+$/)) continue;

      // Skip if it looks like a date or year (must START with year or month name)
      if (/^(\d{4}\b|january|february|march|april|may|june|july|august|september|october|november|december|jan\b|feb\b|mar\b|apr\b|jun\b|jul\b|aug\b|sep\b|oct\b|nov\b|dec\b)/i.test(line)) continue;

      // Try to extract name - handling various formats:
      // "SHIVANI CHOPRA, LLB | CS | MBA" -> Extract "SHIVANI CHOPRA"
      // "John Smith - Software Engineer" -> Extract "John Smith"
      // "Sudharshan Profile" -> Extract "Sudharshan" (if followed by last name)

      // First, try to extract name before common separators
      let namePart = line;

      // Handle case where "Profile" or "Resume" is appended to first name
      // e.g., "Sudharshan Profile" or "John Resume"
      if (/\s+(profile|resume|cv|bio)$/i.test(namePart)) {
        namePart = namePart.replace(/\s+(profile|resume|cv|bio)$/i, '').trim();
        // If just one word left and next line has another capitalized word, combine them
        if (namePart.split(/\s+/).length === 1 && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const nextLineWords = nextLine.split(/\s+/);
          if (nextLineWords.length === 1 && /^[A-Z][a-z]+$/.test(nextLineWords[0])) {
            namePart = `${namePart} ${nextLineWords[0]}`;
            console.log(`[ResumeParser] Combined name from two lines: "${namePart}"`);
          }
        }
      }

      // Strip credentials and titles after name
      // Common patterns: "Name, Credentials" or "Name | Title" or "Name - Role"
      const credentialSeparators = [',', '|', '–', '-', '•', '/', '\\'];
      for (const sep of credentialSeparators) {
        if (namePart.includes(sep)) {
          const parts = namePart.split(sep);
          const firstPart = parts[0].trim();
          // If first part looks like a name (2-4 words, mostly alphabetic), use it
          if (firstPart.length >= 4 && firstPart.length <= 40) {
            const testWords = firstPart.split(/\s+/);
            if (testWords.length >= 2 && testWords.length <= 4 &&
                /^[a-zA-Z\s\-'.]+$/.test(firstPart)) {
              namePart = firstPart;
              break;
            }
          }
        }
      }

      // Check if it looks like a name (2-5 words, alphabetic, reasonable length)
      const nameWords = namePart.split(/\s+/);
      if (nameWords.length >= 2 && nameWords.length <= 5 &&
          /^[a-zA-Z\s\-'.]+$/.test(namePart) &&
          namePart.length >= 4 && namePart.length <= 60) {

        // Additional check: each word should be capitalized or all caps
        const looksLikeName = nameWords.every(word =>
          /^[A-Z][a-z]*\.?$/.test(word) || // Capitalized
          /^[A-Z]+\.?$/.test(word) ||       // All caps
          /^[a-z]{1,2}\.?$/.test(word)      // Short lowercase (initials like "de", "van")
        );

        if (looksLikeName) {
          data.name = namePart;
          console.log(`[ResumeParser] Name extracted: "${namePart}" from line "${line}"`);
          break;
        }
      }
    }

    // Fallback: If no name found, try extracting from filename-like patterns in text
    if (!data.name) {
      // Look for pattern "Name:" or "NAME" at start of lines
      const namePattern = /^(?:name\s*[:.-]?\s*)([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/im;
      const nameMatch = text.match(namePattern);
      if (nameMatch) {
        data.name = nameMatch[1].trim();
      }
    }

    // Second fallback: Search entire text for ALL CAPS name patterns (2-3 words)
    // that appear on their own line and are NOT section headers
    if (!data.name) {
      const allCapsNamePattern = /^([A-Z][A-Z\s]{2,}[A-Z])$/gm;
      const matches = [...text.matchAll(allCapsNamePattern)];
      for (const match of matches) {
        const candidate = match[1].trim();
        const candidateLower = candidate.toLowerCase();

        // Skip if it's a section header
        if (SECTION_HEADERS.some(h => candidateLower === h || candidateLower.includes(h))) continue;
        if (SECTION_HEADER_WORDS.some(w => candidateLower.split(/\s+/).includes(w))) continue;

        // Skip if it contains common non-name words
        const skipWords = ["president", "vice", "manager", "director", "head", "officer", "executive"];
        if (skipWords.some(w => candidateLower.includes(w))) continue;

        // Check if it looks like a name (2-3 words, reasonable length)
        const words = candidate.split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && candidate.length >= 4 && candidate.length <= 40) {
          data.name = candidate;
          console.log(`[ResumeParser] Fallback found ALL CAPS name: "${candidate}"`);
          break;
        }
      }
    }
  }

  // Extract skills using common skill keywords (avoiding ambiguous short names like Go, R, C)
  const skillKeywords = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Golang", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "Scala", "Perl", "Shell", "Bash", "PowerShell", "Groovy", "XML", "JSON", "YAML",
    // Frontend
    "React", "Angular", "Vue", "Next.js", "HTML", "CSS", "SASS", "SCSS", "Tailwind", "Bootstrap",
    "Redux", "Material UI", "jQuery", "Webpack", "Vite",
    // Backend & Frameworks
    "Node.js", "Express", "Django", "Flask", "Spring", "Spring Boot", "FastAPI", "GraphQL", "REST",
    "RESTful APIs", "RESTful Web Services", "NestJS", "Laravel", "Rails", "ASP.NET", "Hibernate",
    "JPA", "MyBatis", "Microservices", "API Gateway", "Eureka", "Service Discovery",
    // Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase", "DynamoDB", "Cassandra",
    "Oracle", "SQL Server", "SQLite", "Elasticsearch", "Neo4j", "MariaDB",
    // Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform",
    "Ansible", "GitHub Actions", "GitLab CI", "CircleCI", "Cloud Foundry", "PCF",
    "Nginx", "Apache", "Linux", "Unix", "Windows Server",
    // Monitoring & Logging
    "Grafana", "Splunk", "AppDynamics", "New Relic", "Datadog", "Prometheus", "ELK Stack",
    "Kibana", "Logstash",
    // Messaging & Integration
    "Kafka", "RabbitMQ", "ActiveMQ", "JMS", "Tibco", "MQ", "SQS", "SNS", "Event-Driven",
    // Build Tools
    "Maven", "Gradle", "npm", "Yarn", "Webpack", "Babel",
    // Testing
    "JUnit", "Mockito", "Jest", "Mocha", "Cypress", "Selenium", "TestNG", "Postman",
    "Unit Testing", "Integration Testing", "TDD", "BDD",
    // Security
    "OAuth", "OAuth 2.0", "JWT", "SSL", "TLS", "HTTPS", "Security", "Authentication",
    // Data & ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Data Analysis", "Data Science", "NLP", "Computer Vision", "Scikit-learn",
    // Tools & IDE
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Figma", "Photoshop",
    "Excel", "Tableau", "Power BI", "VS Code", "IntelliJ", "Eclipse",
    // Methodologies
    "Agile", "Scrum", "SAFe", "Kanban", "Waterfall", "DevOps", "CI/CD Pipeline",
    // Soft Skills
    "Leadership", "Communication", "Team Management", "Project Management", "Problem Solving",
    "Critical Thinking", "Collaboration", "Mentoring",
    // Business & Management Skills
    "Sales", "Marketing", "Business Development", "Strategic Planning", "P&L Management",
    "Revenue Growth", "Operations", "Channel Sales", "Distribution", "Account Management",
    "Customer Success", "Negotiation", "Stakeholder Management", "Budget Management",
    "Team Building", "Training", "Public Speaking", "Presentation Skills",
    "CRM", "Salesforce", "HubSpot", "Analytics", "Market Research", "Competitive Analysis",
    "Product Launch", "Go-to-Market", "Partnership Development", "Vendor Management",
    "Cross-functional Collaboration", "Change Management", "Process Improvement",
    "KPI Management", "Performance Management", "Talent Acquisition", "Employee Engagement",
    // Finance & Insurance
    "Financial Analysis", "Risk Management", "Investment", "Banking", "Insurance",
    "Wealth Management", "Portfolio Management", "Mutual Funds", "Asset Management",
    // Legal & Compliance
    "Legal", "Compliance", "Corporate Law", "Commercial Law", "Contract Management",
    "Contract Negotiation", "Regulatory Compliance", "Corporate Governance", "Board Advisory",
    "Company Secretary", "Legal Counsel", "Litigation", "Dispute Resolution",
    "Due Diligence", "M&A", "Mergers and Acquisitions", "IPR", "Legal Drafting",
    "Arbitration", "Mediation", "Secretarial",
    // HR & Talent Acquisition
    "Talent Acquisition", "Recruitment", "Sourcing", "Headhunting", "Technical Recruiting",
    "Campus Recruitment", "Employer Branding", "LinkedIn Recruiter", "ATS",
    "Onboarding", "Employee Engagement", "HR Operations", "Talent Management",
    "Compensation", "Benefits", "Workforce Planning", "HR Analytics", "People Operations",
    // Domain Specific
    "Guidewire", "PolicyCenter", "ClaimCenter", "BillingCenter", "SAP", "Salesforce",
    "ServiceNow", "Workday", "Oracle EBS",
  ];

  const textLower = text.toLowerCase();
  // Skills that need word boundary matching to avoid false positives
  const needsWordBoundary = ["Java", "SQL", "AWS", "GCP", "Git", "CSS", "PHP", "Scala", "Rust", "Ruby", "REST", "MQ"];

  for (const skill of skillKeywords) {
    // For short skills or skills that are substrings of other skills, use word boundary matching
    if (skill.length <= 4 || needsWordBoundary.includes(skill)) {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(text)) {
        data.skills.push(skill);
      }
    } else if (textLower.includes(skill.toLowerCase())) {
      data.skills.push(skill);
    }
  }

  // Dedupe skills
  data.skills = [...new Set(data.skills)];

  // Suggest roles based on skills
  const roleMapping = {
    // Software Development Roles
    "Java Developer": ["Java", "Spring", "Spring Boot", "Hibernate", "Maven", "Microservices"],
    "Java Backend Developer": ["Java", "Spring Boot", "REST", "Microservices", "SQL", "Maven"],
    "Software Engineer": ["JavaScript", "Python", "Java", "C++", "Git", "Agile"],
    "Senior Software Engineer": ["Java", "Microservices", "Spring Boot", "AWS", "CI/CD", "Leadership"],
    "Frontend Developer": ["React", "Angular", "Vue", "HTML", "CSS", "JavaScript"],
    "Backend Developer": ["Node.js", "Django", "Flask", "SQL", "REST", "GraphQL"],
    "Full Stack Developer": ["React", "Node.js", "MongoDB", "Express", "JavaScript", "SQL"],
    "Python Developer": ["Python", "Django", "Flask", "FastAPI", "SQL"],
    // Cloud & DevOps
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Jenkins"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform"],
    "Site Reliability Engineer": ["Linux", "Kubernetes", "Monitoring", "Grafana", "Prometheus"],
    // Data Roles
    "Data Scientist": ["Python", "Machine Learning", "Pandas", "TensorFlow", "Data Analysis"],
    "Data Engineer": ["SQL", "Python", "Kafka", "Spark", "ETL", "Data Pipeline"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Data Analysis"],
    // Architecture & Lead
    "Solution Architect": ["AWS", "Microservices", "Docker", "Architecture", "Cloud"],
    "Technical Lead": ["Java", "Leadership", "Agile", "Code Review", "Mentoring"],
    // Product & Project
    "Product Manager": ["Agile", "Scrum", "Jira", "Communication", "Leadership"],
    "Project Manager": ["Project Management", "Agile", "Scrum", "Jira", "Leadership"],
    "Scrum Master": ["Scrum", "Agile", "Jira", "SAFe", "Kanban"],
    // Design
    "UX Designer": ["Figma", "Photoshop", "User Research", "Wireframing"],
    "UI Developer": ["HTML", "CSS", "JavaScript", "React", "Figma"],
    // Business Roles
    "Business Analyst": ["SQL", "Excel", "Jira", "Requirements", "Agile"],
    "Business Development Manager": ["Business Development", "Sales", "Negotiation", "Partnership Development"],
    "Sales Manager": ["Sales", "Channel Sales", "Account Management", "CRM", "Negotiation"],
    "Operations Manager": ["Operations", "Process Improvement", "Team Management", "Budget Management"],
    "Marketing Manager": ["Marketing", "Market Research", "Analytics", "Product Launch"],
    "HR Manager": ["Talent Acquisition", "Employee Engagement", "Performance Management", "Training"],
    "Talent Acquisition Manager": ["Talent Acquisition", "Recruitment", "Sourcing", "Headhunting", "LinkedIn Recruiter"],
    "Recruiter": ["Recruitment", "Sourcing", "Talent Acquisition", "ATS", "Headhunting"],
    // Legal & Compliance Roles
    "Legal Counsel": ["Legal", "Compliance", "Contract Management", "Corporate Governance", "Litigation"],
    "Head Legal": ["Legal", "Compliance", "Contract Negotiation", "M&A", "Due Diligence"],
    "Company Secretary": ["Company Secretary", "Secretarial", "Corporate Governance", "Board Advisory", "Compliance"],
    "Compliance Officer": ["Compliance", "Regulatory Compliance", "Risk Management", "Corporate Governance"],
    // Finance Roles
    "Financial Analyst": ["Financial Analysis", "Excel", "Investment", "Risk Management"],
    "Investment Analyst": ["Investment", "Portfolio Management", "Financial Analysis", "Mutual Funds"],
    "Relationship Manager": ["Sales", "Account Management", "Customer Success", "Banking"],
    // Insurance
    "Insurance Developer": ["Guidewire", "PolicyCenter", "Java", "Insurance"],
    "Guidewire Developer": ["Guidewire", "PolicyCenter", "ClaimCenter", "Insurance", "Java"],
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
 * Detect experience years from resume text
 */
function detectExperienceYears(text) {
  // Look for explicit mentions
  const explicitMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
  if (explicitMatch) {
    return parseInt(explicitMatch[1]);
  }

  // Calculate from date ranges
  const dateRanges = text.matchAll(/(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/gi);
  let earliestYear = new Date().getFullYear();
  let latestYear = new Date().getFullYear();

  for (const match of dateRanges) {
    const startYear = parseInt(match[1]);
    const endYear = match[2].toLowerCase().includes("present") || match[2].toLowerCase().includes("current")
      ? new Date().getFullYear()
      : parseInt(match[2]);

    if (startYear < earliestYear && startYear > 1980) earliestYear = startYear;
    if (endYear > latestYear) latestYear = endYear;
  }

  const calculatedYears = latestYear - earliestYear;
  return calculatedYears > 0 && calculatedYears < 50 ? calculatedYears : null;
}

/**
 * Detect primary domain from skills and content
 */
function detectPrimaryDomain(skills, text) {
  const textLower = text.toLowerCase();

  const domainIndicators = {
    "Software Engineering": ["software", "developer", "programming", "code", "application"],
    "Data Science": ["data science", "machine learning", "ml", "analytics", "modeling"],
    "Web Development": ["web", "frontend", "backend", "full stack", "website"],
    "Cloud & DevOps": ["cloud", "devops", "aws", "azure", "infrastructure", "kubernetes"],
    "Product Management": ["product", "roadmap", "stakeholder", "user research"],
    "Business Development": ["business development", "sales", "partnership", "revenue"],
    "Marketing": ["marketing", "campaign", "brand", "growth", "digital marketing"],
    "Finance": ["finance", "accounting", "investment", "banking", "financial"],
    "Operations": ["operations", "supply chain", "logistics", "process improvement"],
    "Human Resources": ["hr", "recruitment", "talent", "employee", "hiring"]
  };

  // Score each domain
  const scores = {};
  for (const [domain, keywords] of Object.entries(domainIndicators)) {
    scores[domain] = keywords.filter(k => textLower.includes(k)).length;
    // Bonus for matching skills
    scores[domain] += skills.filter(s =>
      keywords.some(k => s.toLowerCase().includes(k) || k.includes(s.toLowerCase()))
    ).length;
  }

  // Find highest scoring domain
  const sortedDomains = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sortedDomains[0]?.[1] > 0 ? sortedDomains[0][0] : "Technology";
}

/**
 * Generate professional summary lines
 */
function generateSummaryLines(skills, experienceYears, domain, suggestedRoles) {
  const primaryRole = suggestedRoles?.[0] || "Professional";
  const topSkills = skills.slice(0, 3);
  const lines = [];

  // Line 1: Core identity
  if (experienceYears && experienceYears > 0) {
    lines.push(`Seasoned ${primaryRole} with ${experienceYears}+ years of experience driving results in ${domain}.`);
  } else {
    lines.push(`Motivated ${primaryRole} with a strong foundation in ${domain} and passion for excellence.`);
  }

  // Line 2: Key expertise
  if (topSkills.length >= 2) {
    lines.push(`Core expertise in ${topSkills.slice(0, 2).join(" and ")}, with additional proficiency in ${topSkills[2] || "modern best practices"}.`);
  } else if (topSkills.length > 0) {
    lines.push(`Specialized in ${topSkills[0]} with a commitment to delivering high-quality solutions.`);
  }

  // Line 3: Value proposition
  const valueProps = [
    "Proven track record of collaborating with cross-functional teams to deliver impactful solutions.",
    "Adept at translating complex requirements into actionable strategies and measurable outcomes.",
    "Committed to continuous learning and staying current with industry trends and best practices."
  ];
  lines.push(valueProps[Math.floor(Math.random() * valueProps.length)]);

  return lines;
}

/**
 * Generate intelligent suggestions without AI (enhanced fallback)
 */
export function generateBasicSuggestions(extractedData, resumeText) {
  const skills = extractedData.skills || [];
  const suggestedRoles = extractedData.suggestedRoles || [];

  // Calculate word count for validation
  const wordCount = (resumeText || "").split(/\s+/).filter(w => w.length > 0).length;

  // Detect experience years
  const experienceYears = detectExperienceYears(resumeText || "");

  // Detect primary domain
  const primaryDomain = detectPrimaryDomain(skills, resumeText || "");

  // Generate profile summary
  const profileSummary = generateSummaryLines(skills, experienceYears, primaryDomain, suggestedRoles);

  // VALIDATION: Only enhance skills if there's actual resume content (50+ words)
  // This prevents adding "hallucinated" skills to non-resumes or empty uploads
  const hasActualContent = wordCount >= 50 && skills.length > 0;

  const enhancedSkills = [...skills];

  if (hasActualContent) {
    // Enhance skills list with role-appropriate additions ONLY if resume has content
    const roleSkillsMap = {
      "Software Engineer": ["Problem Solving", "Code Review", "Agile"],
      "Frontend Developer": ["UI/UX", "Responsive Design", "Performance Optimization"],
      "Backend Developer": ["API Design", "Database Management", "Security"],
      "Data Scientist": ["Statistical Analysis", "Data Visualization", "Communication"],
      "Product Manager": ["Stakeholder Management", "Roadmap Planning", "User Research"],
      "DevOps Engineer": ["Automation", "Monitoring", "Infrastructure as Code"],
      "Project Manager": ["Risk Management", "Resource Planning", "Communication"]
    };

    const additionalSkills = roleSkillsMap[suggestedRoles[0]] || [];
    // Only add role-specific skills, NOT generic fallback skills
    // to avoid "hallucinating" skills not present in the resume

    for (const skill of additionalSkills) {
      if (!enhancedSkills.some(s => s.toLowerCase() === skill.toLowerCase()) && enhancedSkills.length < 12) {
        enhancedSkills.push(skill);
      }
    }
  }

  return {
    suggestedSkills: enhancedSkills,
    profileSummary,
    experienceYears,
    primaryDomain,
    analysisMethod: "intelligent-rule-based",
    hasActualContent
  };
}

export default { parseResumeFile, generateResumeSuggestions, generateBasicSuggestions };
