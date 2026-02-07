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

console.log("[ResumeParser] Module loaded - VERSION 5.0 with comprehensive text cleaning & smart skill extraction");

// Common resume section headers to exclude from name detection (all lowercase)
const SECTION_HEADERS = [
  "profile summary", "professional summary", "summary", "objective",
  "experience", "work experience", "employment history", "work history",
  "education", "qualifications", "skills", "technical skills", "core competencies",
  "certifications", "projects", "achievements", "accomplishments", "awards",
  "contact", "contact information", "references", "languages", "interests",
  "personal information", "personal details", "hobbies", "volunteer", "publications",
  "profile", "career summary", "career objective", "about me", "about", "bio",
  "business leadership", "executive summary", "professional experience", "key skills",
  "core skills", "areas of expertise", "professional profile", "career profile",
  "curriculum vitae", "resume", "biodata",
  // E-Commerce resume section headers
  "category head", "category growth", "category marketing", "omnichannel strategy",
  "inventory supply", "chain optimization", "category expansion", "digital marketing",
  "fashion business", "demand growth", "monetization travel", "business finance",
  "strategic acquisitions", "employment overview", "career history", "core competencies skills",
  // Additional common headers
  "job responsibilities", "responsibilities", "key responsibilities", "duties",
  "role description", "job description", "position overview", "role overview",
  "key achievements", "key accomplishments", "major achievements", "highlights",
  "professional highlights", "career highlights", "key deliverables", "deliverables"
];

// Individual words that commonly appear in section headers
const SECTION_HEADER_WORDS = [
  "summary", "profile", "objective", "experience", "education", "skills",
  "certifications", "projects", "achievements", "awards", "contact", "references",
  "qualifications", "competencies", "history", "details", "information",
  "leadership", "executive", "professional", "responsibilities", "duties",
  "deliverables", "highlights", "overview", "description"
];

// Words that indicate this is NOT a person's name
const NOT_NAME_INDICATORS = [
  "resume", "cv", "curriculum", "vitae", "profile", "biodata", "summary",
  "jewellery", "jewelry", "pvt", "ltd", "limited", "inc", "corp", "llc", "llp",
  "technologies", "solutions", "services", "consulting", "enterprises", "group",
  "business", "head", "leadership", "executive", "president", "vice",
  "director", "manager", "officer", "specialist", "consultant", "analyst",
  "engineer", "developer", "architect", "lead", "senior", "junior",
  "india", "usa", "bangalore", "mumbai", "delhi", "hyderabad", "chennai", "pune",
  "giva", "tata", "infosys", "wipro", "cognizant", "accenture", "capgemini",
  "professional", "experience", "skills", "education", "objective", "career",
  "job", "responsibilities", "duties", "role", "position", "overview", "description"
];

// Related skills mapping - when a skill is found, suggest these related ones
const RELATED_SKILLS_MAP = {
  "Java": ["Maven", "JUnit", "Spring", "Hibernate", "JPA"],
  "Spring Boot": ["Spring", "REST", "Microservices", "Maven", "JUnit"],
  "React": ["JavaScript", "Redux", "HTML", "CSS", "Node.js"],
  "Angular": ["TypeScript", "RxJS", "HTML", "CSS"],
  "Node.js": ["JavaScript", "Express", "MongoDB", "REST"],
  "Python": ["Pandas", "NumPy", "Flask", "Django"],
  "AWS": ["EC2", "S3", "Lambda", "CloudFormation", "Docker"],
  "Docker": ["Kubernetes", "CI/CD", "DevOps", "Containerization"],
  "Kubernetes": ["Docker", "Helm", "CI/CD", "DevOps"],
  "SQL": ["MySQL", "PostgreSQL", "Database", "Data Modeling"],
  "MongoDB": ["NoSQL", "Node.js", "Database"],
  "Machine Learning": ["Python", "TensorFlow", "Data Science", "Statistics"],
  "Microservices": ["REST", "Docker", "Kubernetes", "API Gateway"],
  "Agile": ["Scrum", "Jira", "Sprint Planning", "Kanban"],
  "Git": ["GitHub", "Version Control", "CI/CD"],
  "Jenkins": ["CI/CD", "DevOps", "Automation"],
  "Guidewire": ["PolicyCenter", "ClaimCenter", "Insurance", "Java"],
  "PolicyCenter": ["Guidewire", "Insurance", "Java", "Gosu"],
  "Sales": ["Negotiation", "CRM", "Business Development", "Account Management"],
  "Marketing": ["Digital Marketing", "SEO", "Content Marketing", "Analytics"],
  "Leadership": ["Team Management", "Mentoring", "Strategic Planning"],
  "Recruitment": ["Talent Acquisition", "Sourcing", "ATS"],
  "Legal": ["Compliance", "Contract Management", "Corporate Law"],
  "Finance": ["Financial Analysis", "Budgeting", "Forecasting"],
  // E-Commerce & Growth
  "E-Commerce": ["Category Management", "Digital Marketing", "Analytics", "Omnichannel", "D2C"],
  "Ecommerce": ["Category Management", "Digital Marketing", "Analytics", "Omnichannel", "D2C"],
  "Category Management": ["P&L Management", "Pricing Strategy", "Inventory Management", "Analytics"],
  "D2C": ["E-Commerce", "Digital Marketing", "Brand Management", "Customer Acquisition"],
  "Omnichannel": ["E-Commerce", "Retail", "Customer Experience", "Digital Transformation"],
  "Growth Strategy": ["Analytics", "A/B Testing", "User Acquisition", "Performance Marketing"],
  "Performance Marketing": ["ROAS", "CAC", "Google Ads", "Meta Ads", "Analytics"],
  "Digital Marketing": ["SEO", "SEM", "Content Marketing", "Social Media", "Analytics"],
};

/**
 * Clean PDF text artifacts for better readability
 * Fixes common PDF extraction issues like spacing, bullets, and fragmented text
 * VERSION 5.0 - Comprehensive cleaning for production use
 */
function cleanPDFText(text) {
  if (!text) return text;

  let cleaned = text;

  // Step 0: Remove control characters and non-printable chars (except newline, tab)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Remove zero-width characters, soft hyphens, BOM
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u200E\u200F\u202A-\u202E]/g, '');

  // Step 0.5: Normalize smart quotes and special dashes early
  cleaned = cleaned.replace(/[\u2018\u2019\u201B\u0060]/g, "'");  // Smart single quotes -> '
  cleaned = cleaned.replace(/[\u201C\u201D\u201E\u201F]/g, '"');  // Smart double quotes -> "
  cleaned = cleaned.replace(/[\u2011]/g, '-');  // Non-breaking hyphen -> regular hyphen
  cleaned = cleaned.replace(/[\u2013\u2014\u2015\u2012]/g, '-');  // En/em dashes -> hyphen

  // Step 0.6: Remove emoji characters (surrogate pairs and common emoji ranges)
  cleaned = cleaned.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ''); // Surrogate pairs (emoji)
  cleaned = cleaned.replace(/[\u2600-\u27BF\u2B50-\u2B55\u231A-\u231B\u23E9-\u23F3\u23F8-\u23FA]/g, ''); // Misc symbols
  cleaned = cleaned.replace(/[\u{1F000}-\u{1FFFF}]/gu, ''); // Extended emoji (with unicode flag)

  // Step 1: Replace ALL weird bullet/symbol characters with standard bullet
  // Includes Unicode bullets, Microsoft Symbol/Wingdings private-use area chars (U+F000-U+F0FF)
  cleaned = cleaned.replace(/[▪▸▹►▻●○◦◆◇■□★☆→⇒⇨⮕➜➤➢➣➔➡•‣⁃◘◙◉◎▶▷▸▹▲△▴▵▻▹✦✧✩✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅❆❇❈❉❊❋➲⊕⊗⊙⊚⊛⊜⊝♦♣♠♥⬥⬦⬧⬨⬩⬪⬫◈⧫▰▱❖⁂⁎⁕❍❑❒⊡⊞⊟⬡⬢⬣▮▯⏩⏵⏶⏷]/g, '•');
  // Microsoft Symbol font chars (Private Use Area) - commonly appear as bullets in PDF
  cleaned = cleaned.replace(/[\uF020-\uF0FF]/g, '•');
  // Also handle common PDF extraction artifacts for bullets
  cleaned = cleaned.replace(/^\s*[·∙⋅‧∘⦁⦿⧂]\s*/gm, '• ');
  // Fix "o " used as bullet at line start
  cleaned = cleaned.replace(/^\s*o\s{2,}/gm, '• ');
  // Clean up multiple consecutive bullets (from symbol font cleanup)
  cleaned = cleaned.replace(/•{2,}/g, '•');

  // Step 2: Fix spaces around hyphens (E - COMMERCE -> E-COMMERCE)
  cleaned = cleaned.replace(/(\w)\s+-\s+(\w)/g, '$1-$2');
  cleaned = cleaned.replace(/(\w)\s+–\s+(\w)/g, '$1-$2'); // en-dash
  cleaned = cleaned.replace(/(\w)\s+—\s+(\w)/g, '$1-$2'); // em-dash

  // Step 2.5: Fix extremely spaced text (per-character spacing from PDFs)
  // Handles text like "M R . A M O L G A T H A D I" → "MR. AMOL GATHADI"
  // And numbers: "9 0 9 6 9 4 7 2 9 4" → "9096947294"
  // Process line by line to only fix heavily spaced lines
  const spacedLines = cleaned.split('\n');
  for (let li = 0; li < spacedLines.length; li++) {
    const line = spacedLines[li];
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 4) continue;
    const singleCharTokens = tokens.filter(t => t.length === 1).length;
    const spacingRatio = singleCharTokens / tokens.length;
    // If > 50% of tokens are single characters, this line has extreme per-char spacing
    if (spacingRatio > 0.5 && singleCharTokens >= 4) {
      // Strategy: collapse single-char sequences, using multi-char tokens and
      // double spaces as word boundary indicators
      let fixed = line;
      // First: normalize multiple spaces to detect word boundaries (3+ spaces → double space marker)
      fixed = fixed.replace(/\s{3,}/g, '  ');
      // Iteratively collapse single-char gaps (preserving double-space word boundaries)
      for (let iter = 0; iter < 10; iter++) {
        const prev = fixed;
        // Join single alphanumeric char + single space + single alphanumeric char
        // But NOT across double spaces (word boundaries)
        fixed = fixed.replace(/([A-Za-z0-9])\s([A-Za-z0-9])(?!\s\s)/g, (m, a, b, offset) => {
          // Check if the space before 'a' is also a single space (part of same spaced word)
          // or if 'a' is the start of a new word (preceded by double space or non-alpha)
          return a + b;
        });
        if (prev === fixed) break;
      }
      // Also collapse punctuation that got spaced: ". " → "." when between letters
      fixed = fixed.replace(/([A-Za-z])\s*\.\s*([A-Za-z])/g, '$1. $2');
      // Collapse spaced digits: "9 0 9 6" → "9096"
      for (let iter = 0; iter < 5; iter++) {
        const prev = fixed;
        fixed = fixed.replace(/(\d)\s(\d)/g, '$1$2');
        if (prev === fixed) break;
      }
      // Restore word boundaries: add space before capital letters preceded by lowercase
      fixed = fixed.replace(/([a-z])([A-Z])/g, '$1 $2');
      // Clean up multiple spaces
      fixed = fixed.replace(/\s{2,}/g, ' ');
      spacedLines[li] = fixed;
    }
  }
  cleaned = spacedLines.join('\n');

  // Step 3: Fix spaced single letters forming words (iterative - handles deeply broken text)
  for (let i = 0; i < 10; i++) {
    const prev = cleaned;
    // Fix "G ROWTH" -> "GROWTH" (single uppercase + space + rest starting with uppercase)
    cleaned = cleaned.replace(/\b([A-Z])\s+([A-Z]+[a-z]*)\b/g, '$1$2');
    // Fix "C OR E" -> "CORE" (spaced all-caps fragments)
    cleaned = cleaned.replace(/\b([A-Z]{1,3})\s+([A-Z]{1,3})\s+([A-Z]{1,3})\b/g, '$1$2$3');
    // Fix "SKI LLS" -> "SKILLS"
    cleaned = cleaned.replace(/\b([A-Z]{2,4})\s+([A-Z]{2,4})\b/g, '$1$2');
    if (prev === cleaned) break;
  }

  // Step 4: Fix fragmented words with trailing single letter
  // "Presen t" -> "Present", "neutra l" -> "neutral", "developmen t" -> "development"
  cleaned = cleaned.replace(/(\w{3,})\s([a-z])\b/g, '$1$2');
  // "Presen tation" -> "Presentation"
  cleaned = cleaned.replace(/(\w{3,})\s([a-z]{2,4})\b/g, (match, p1, p2) => {
    // Only fix if the combined word looks valid (no double consonant clusters etc.)
    const combined = p1 + p2;
    // Check if p1 ends with a letter that can connect to p2's start
    if (/[a-zA-Z]$/.test(p1) && /^[a-z]/.test(p2) && combined.length <= 20) {
      return combined;
    }
    return match;
  });
  // "E stablish ed" -> "Established"
  cleaned = cleaned.replace(/\b([A-Z])\s([a-z]{2,})\s([a-z]{2,})\b/g, '$1$2$3');
  // "wo rk" -> "work", "ma nage" -> "manage" (short prefix + rest)
  cleaned = cleaned.replace(/\b([a-z]{2})\s([a-z]{2,})\b/g, (match, p1, p2) => {
    // Only merge if it creates a valid-looking word
    const combined = p1 + p2;
    if (combined.length >= 4 && combined.length <= 15) {
      return combined;
    }
    return match;
  });

  // Step 5: Fix multiple spaces (but preserve newlines)
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Step 6: Fix space before punctuation
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');

  // Step 7: Clean up line breaks (3+ newlines -> double)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Step 8: Fix common PDF artifacts
  cleaned = cleaned.replace(/\s*\|\s*/g, ' | '); // Normalize pipe separators
  cleaned = cleaned.replace(/\(\s+/g, '('); // Fix space after opening paren
  cleaned = cleaned.replace(/\s+\)/g, ')'); // Fix space before closing paren

  // Step 9: Fix numbers with spaces (4 K Cr -> 4K Cr, 20 % -> 20%)
  cleaned = cleaned.replace(/(\d)\s+([KMB])\s/g, '$1$2 ');
  cleaned = cleaned.replace(/(\d)\s+%/g, '$1%');
  cleaned = cleaned.replace(/(\d)\s+(Cr|Lakh|cr|lakh|crore|lakhs)/g, '$1 $2');

  // Step 10: Fix words stuck together from PDF extraction (missing spaces)
  // 10a: CamelCase-like patterns: lowercase meets uppercase
  cleaned = cleaned.replace(/([a-z]{2,})([A-Z][a-z]{2,})/g, '$1 $2');

  // 10b: Common words stuck to previous word (3+ char words only to avoid breaking "India", "Java" etc.)
  // Only fix when left part is 3+ letters and the common word is clearly a separate word
  const stuckWords3 = ['and', 'the', 'for', 'but', 'not', 'nor', 'yet', 'from', 'into', 'over', 'also', 'this', 'that', 'than', 'then', 'with', 'using', 'their', 'about', 'after', 'being', 'every', 'other', 'since', 'still', 'these', 'those', 'under', 'would', 'which', 'where', 'while', 'through', 'across', 'during', 'time', 'cost', 'code', 'thus', 'like', 'such', 'when', 'each', 'both', 'more', 'most', 'some', 'many', 'were', 'will', 'been', 'have', 'has', 'had', 'was', 'are', 'can', 'did', 'per', 'via', 'our', 'who'];
  for (const word of stuckWords3) {
    // Pattern: 3+ lowercase letters + stuck common word + space/punctuation/uppercase
    const regex = new RegExp(`([a-z]{3,})(${word})(?=[\\s,.;:!?A-Z(]|$)`, 'g');
    cleaned = cleaned.replace(regex, '$1 $2');
  }

  // 10c: Short common words (2 chars) stuck to previous word - more conservative
  // Only fix when left part is 5+ letters to minimize false positives
  const stuckWords2 = ['of', 'in', 'on', 'to', 'at', 'by', 'as', 'is', 'or', 'an', 'if', 'so', 'do', 'no', 'up', 'us', 'we', 'be'];
  for (const word of stuckWords2) {
    // Pattern: 5+ lowercase letters + stuck short word + space/punctuation/uppercase
    const regex = new RegExp(`([a-z]{5,})(${word})(?=[\\s,.;:!?A-Z(]|$)`, 'g');
    cleaned = cleaned.replace(regex, '$1 $2');
  }

  // Step 11: Join broken sentences across lines
  // If a line ends without sentence-ending punctuation and next line starts lowercase, join them
  cleaned = cleaned.replace(/([a-z,])\n([a-z])/g, '$1 $2');
  // If a line ends with a hyphen (word break), join the word
  cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2');

  // Step 11: Remove orphan single characters on their own lines (PDF artifacts)
  cleaned = cleaned.replace(/\n\s*[•\-]\s*\n/g, '\n');

  // Step 12: Clean up bullet formatting for consistency
  // Ensure bullets have a space after them
  cleaned = cleaned.replace(/•\s*/g, '• ');
  // Remove empty bullets (bullet with no content)
  cleaned = cleaned.replace(/•\s*\n/g, '\n');
  // Remove bullets that only have 1-2 characters of content (PDF noise)
  cleaned = cleaned.replace(/•\s*.{1,2}\s*\n/g, '\n');

  // Step 13: Remove lines that are just noise (common PDF artifacts)
  // Lines that are just special characters, pipes, dashes
  cleaned = cleaned.replace(/^\s*[-|_=~]{3,}\s*$/gm, '');
  // Lines that are just a single character
  cleaned = cleaned.replace(/^\s*[a-zA-Z]\s*$/gm, '');

  // Step 14: Final cleanup
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Re-clean excess newlines from removals
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Re-clean spaces

  return cleaned.trim();
}

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
 * Fix spaced-out names like "A R U N  A H L A W A T" -> "ARUN AHLAWAT"
 * Also handles "A RUN A HLAWAT" or partial spacing
 */
function fixSpacedName(name) {
  if (!name) return name;

  // Skip if the name contains digits (likely has phone number or date)
  if (/\d/.test(name)) {
    return name;
  }

  // First, check if this is extreme letter-by-letter spacing
  // e.g., "M R . A M O L G A T H A D I" or "A M O L  G A T H A D I"
  // Pattern: mostly single letters separated by spaces
  const words = name.trim().split(/\s+/);
  const singleLetterWords = words.filter(w => w.length === 1 && /[a-zA-Z]/.test(w)).length;

  // Extreme spacing: more than 50% of words are single letters
  if (singleLetterWords >= 3 && singleLetterWords / words.length >= 0.5) {
    console.log(`[ResumeParser] fixSpacedName extreme spacing detected: "${name}"`);

    // Remove all spaces and punctuation, then try to split into name words
    const letters = name.replace(/[^a-zA-Z]/g, '');

    // For names with mixed case, try to find capital letter boundaries
    const matches = letters.match(/[A-Z][a-z]*/g) || [];

    if (matches.length >= 2) {
      // Filter out common prefixes like MR, MS, DR
      const prefixes = ['MR', 'MS', 'MRS', 'DR', 'PROF'];
      const filtered = matches.filter(m => !prefixes.includes(m.toUpperCase()));

      if (filtered.length >= 2) {
        const result = filtered.join(' ');
        console.log(`[ResumeParser] Fixed extreme spaced name: "${name}" -> "${result}"`);
        return result;
      }
    }

    // For ALL CAPS names like "A M O L G A T H A D I", try to find word boundaries
    // by looking for common name patterns or vowel clusters
    if (/^[A-Z\s.]+$/.test(name)) {
      // Just concatenate all letters - user will need to correct if wrong
      if (letters.length >= 4 && letters.length <= 30) {
        console.log(`[ResumeParser] All caps spaced name - concatenating: "${letters}"`);
        return letters;
      }
    }
  }

  // Handle moderate spacing like "A RUN A HLAWAT"
  const nameWords = name.trim().split(/\s+/);
  const singleCharCount = nameWords.filter(w => w.length === 1 && /[a-zA-Z]/.test(w)).length;
  const totalWords = nameWords.length;

  if (singleCharCount >= 2 && singleCharCount / totalWords >= 0.3) {
    console.log(`[ResumeParser] fixSpacedName moderate spacing: "${name}" (${singleCharCount}/${totalWords} single chars)`);

    const resultWords = [];
    let currentWord = '';
    let builtFromSingleLetter = false;

    for (let i = 0; i < nameWords.length; i++) {
      const word = nameWords[i];

      if (word.length === 1 && /[a-zA-Z]/.test(word)) {
        if (currentWord && !builtFromSingleLetter) {
          resultWords.push(currentWord);
          currentWord = word;
          builtFromSingleLetter = true;
        } else {
          currentWord += word;
          builtFromSingleLetter = true;
        }
      } else if (builtFromSingleLetter && currentWord.length > 0 && currentWord.length <= 3) {
        currentWord += word;
        builtFromSingleLetter = false;
      } else {
        if (currentWord) {
          resultWords.push(currentWord);
          currentWord = '';
        }
        if (/[a-zA-Z]+/.test(word)) {
          resultWords.push(word);
        }
        builtFromSingleLetter = false;
      }
    }

    if (currentWord) {
      resultWords.push(currentWord);
    }

    const result = resultWords.join(' ');
    if (result !== name) {
      console.log(`[ResumeParser] Fixed spaced name: "${name}" -> "${result}"`);
      return result;
    }
  }

  return name;
}

/**
 * Check if a string looks like a company/organization name or section header
 */
function looksLikeCompanyName(text) {
  if (!text) return false;

  // First, normalize by removing extra spaces (handles "B U S I N E S S" -> "BUSINESS")
  const normalized = text.replace(/\s+/g, '').toLowerCase();
  const lower = text.toLowerCase();

  // Check if it matches any section header (normalized)
  for (const header of SECTION_HEADERS) {
    const normalizedHeader = header.replace(/\s+/g, '');
    if (normalized === normalizedHeader || normalized.includes(normalizedHeader)) {
      console.log(`[ResumeParser] looksLikeCompanyName: "${text}" matches section header "${header}"`);
      return true;
    }
  }

  // Check both normalized and original against NOT_NAME_INDICATORS
  const isCompany = NOT_NAME_INDICATORS.some(indicator => {
    const normalizedIndicator = indicator.replace(/\s+/g, '');
    return normalized.includes(normalizedIndicator) ||
           lower.includes(indicator) ||
           lower.split(/\s+/).includes(indicator);
  });

  if (isCompany) {
    console.log(`[ResumeParser] looksLikeCompanyName: "${text}" matched NOT_NAME_INDICATOR`);
  }

  return isCompany;
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
  // IMPORTANT: cleanResumeText runs first (basic normalization), then cleanPDFText (PDF artifact fixes)
  // Both MUST run BEFORE extractResumeData so skill matching sees clean text
  try {
    text = cleanResumeText(text || "");
  } catch {
    text = "";
  }

  // Clean PDF artifacts BEFORE extraction (fixes "E - COMMERCE" -> "E-COMMERCE", spaced words, etc.)
  try {
    text = cleanPDFText(text);
  } catch {
    // If cleanPDFText fails, continue with cleanResumeText output
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

      // Convert lines to text - join items with space separator
      // Post-processing in cleanPDFText handles stuck/split words
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
 * Clean up extracted text - comprehensive normalization
 * VERSION 5.0 - Handles PDF artifacts, broken text, noise characters
 */
function cleanResumeText(text) {
  if (!text) return "";

  let cleaned = text;

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/\r/g, "\n");

  // Remove null bytes and control characters
  cleaned = cleaned.replace(/\0/g, '');
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Replace tabs with spaces
  cleaned = cleaned.replace(/\t+/g, " ");

  // Fix common PDF ligature artifacts
  cleaned = cleaned.replace(/ﬁ/g, 'fi');
  cleaned = cleaned.replace(/ﬂ/g, 'fl');
  cleaned = cleaned.replace(/ﬀ/g, 'ff');
  cleaned = cleaned.replace(/ﬃ/g, 'ffi');
  cleaned = cleaned.replace(/ﬄ/g, 'ffl');

  // Normalize quotes and apostrophes
  cleaned = cleaned.replace(/[''‛`]/g, "'");
  cleaned = cleaned.replace(/[""„‟]/g, '"');

  // Normalize dashes
  cleaned = cleaned.replace(/[–—―‒]/g, '-');

  // Normalize ellipsis
  cleaned = cleaned.replace(/…/g, '...');

  // Remove multiple spaces
  cleaned = cleaned.replace(/ {2,}/g, " ");

  // Remove excessive newlines (3+ -> 2)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Remove trailing spaces on each line
  cleaned = cleaned.replace(/ +\n/g, "\n");

  // Remove leading spaces on each line (except intentional indentation)
  cleaned = cleaned.replace(/\n {3,}/g, "\n  ");

  return cleaned.trim();
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

  // Extract email - handle spaced emails like "a nkitdutt87@gmail.com" or "DEWAS.AGARWAL 3 @GMAIL.COM"
  // Strategy: First try line-by-line extraction to handle PDF spacing artifacts
  const emailLines = text.split('\n');
  for (const line of emailLines) {
    if (line.includes('@')) {
      const trimmedLine = line.trim();

      // For shorter lines (likely dedicated email line), try multiple strategies
      if (trimmedLine.length <= 80) {
        // Strategy A: Extract email directly from line (preserving word boundaries)
        // This handles "sachinyadav18virat@gmail.com" as a clean word token
        let emailFromWordToken = null;
        const words = trimmedLine.split(/\s+/);
        for (const word of words) {
          const cleanWord = word.replace(/[<>()[\]{},;]/g, '').toLowerCase();
          if (cleanWord.includes('@')) {
            const emailMatch = cleanWord.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
              emailFromWordToken = emailMatch[0];
              break;
            }
          }
        }

        // Strategy A.5: Handle PDF character spacing around @ sign
        // For cases like "DEWAS.AGARWAL 3 @GMAIL.COM" or "a nkitdutt87@gmail.com"
        // Reconstruct by removing spaces from portion around @
        let emailFromReconstruct = null;
        const atIdx = trimmedLine.indexOf('@');
        if (atIdx >= 0) {
          const beforeAt = trimmedLine.substring(Math.max(0, atIdx - 30), atIdx);
          const afterAt = trimmedLine.substring(atIdx + 1, Math.min(trimmedLine.length, atIdx + 25));
          let cleanLocal = beforeAt.replace(/\s+/g, '').replace(/^[^a-zA-Z0-9]+/, '');
          const cleanDomain = afterAt.replace(/\s+/g, '');
          // Strip leading phone numbers (5+ consecutive digits) from local part
          cleanLocal = cleanLocal.replace(/^\d{5,}/, '');
          // Strip leading non-alphanumeric chars
          cleanLocal = cleanLocal.replace(/^[^a-zA-Z0-9]+/, '');
          if (cleanLocal.length >= 2) {
            const candidate = cleanLocal + '@' + cleanDomain;
            const tldEmailMatch = candidate.match(/[a-zA-Z0-9._%+-]{2,30}@[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|co\.in|in|uk|us|info|ac\.in)/i);
            if (tldEmailMatch) {
              emailFromReconstruct = tldEmailMatch[0].toLowerCase();
            }
          }
        }

        // Choose best result: prefer reconstruct if it has a longer local part (more complete)
        // This handles "a nkitdutt87@gmail.com" where word token gets "nkitdutt87@gmail.com"
        // but reconstruct gets "ankitdutt87@gmail.com"
        if (emailFromWordToken && emailFromReconstruct) {
          const localA = emailFromWordToken.split('@')[0];
          const localB = emailFromReconstruct.split('@')[0];
          // Guard: if A's local part is already a suffix of B, A.5 just prepended name/garbage
          // e.g., "nikhilcm" (A) vs "nikhilcmnikhilcm" (A.5) - A.5 grabbed "Nikhil CM" from name text
          const isDuplicated = localB.length > localA.length && localB.endsWith(localA) && localA.length >= 5;
          if (!isDuplicated && localB.length > localA.length && localB.length <= 30) {
            data.email = emailFromReconstruct;
            console.log(`[ResumeParser] Email extracted (reconstruct preferred over token): "${emailFromReconstruct}"`);
          } else {
            data.email = emailFromWordToken;
            console.log(`[ResumeParser] Email extracted (word token${isDuplicated ? ', reconstruct was duplicated' : ''}): "${emailFromWordToken}"`);
          }
        } else if (emailFromReconstruct) {
          data.email = emailFromReconstruct;
          console.log(`[ResumeParser] Email extracted (spaced reconstruct): "${emailFromReconstruct}"`);
        } else if (emailFromWordToken) {
          data.email = emailFromWordToken;
          console.log(`[ResumeParser] Email extracted (word token): "${emailFromWordToken}"`);
        }
        if (data.email) break;

        // Strategy B: Handle spaced emails like "sachin @ gmail.com" - remove spaces around @
        const spacedEmailMatch = trimmedLine.match(/[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (spacedEmailMatch) {
          data.email = spacedEmailMatch[0].replace(/\s+/g, '').toLowerCase();
          console.log(`[ResumeParser] Email extracted (spaced): "${spacedEmailMatch[0]}" -> "${data.email}"`);
          break;
        }

        // Strategy C: Full line clean (for heavily fragmented emails like "s a c h i n @ g m a i l . c o m")
        const cleaned = trimmedLine.replace(/\s+/g, '').toLowerCase();
        const fullLineMatch = cleaned.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
        if (fullLineMatch) {
          data.email = fullLineMatch[0];
          console.log(`[ResumeParser] Email extracted (full line clean): "${trimmedLine}" -> "${fullLineMatch[0]}"`);
          break;
        }
      }

      // For any line with @, try to extract email using word-boundary approach
      // Build email by collecting words before and after @
      const atIndex = trimmedLine.indexOf('@');
      if (atIndex > 0) {
        // Build local part: collect space-separated tokens before @, working backwards
        const beforeAt = trimmedLine.substring(0, atIndex);
        const afterAt = trimmedLine.substring(atIndex + 1);
        const tokensBefore = beforeAt.split(/\s+/).filter(t => t.length > 0);
        const tokensAfter = afterAt.split(/\s+/).filter(t => t.length > 0);

        // Build local part from rightmost tokens
        let localPart = '';
        for (let ti = tokensBefore.length - 1; ti >= 0; ti--) {
          const token = tokensBefore[ti].replace(/[<>()[\]{},;:|]/g, '').toLowerCase();
          // Skip if token is only digits with 5+ chars (phone number)
          if (/^\d{5,}$/.test(token)) continue;
          // Skip if token is clearly not email (contains uppercase section-like words)
          if (/^(phone|email|contact|mobile|tel|location|address|city|linkedin)$/i.test(token)) break;
          const candidate = token + localPart;
          // Stop if local part would exceed 25 chars (too long for email)
          if (candidate.length > 25) break;
          localPart = candidate;
          // If we have a reasonable local part (> 5 chars), don't keep going unless next token is short (1-3 chars, likely split)
          if (localPart.length > 5 && ti > 0) {
            const nextToken = tokensBefore[ti - 1].replace(/[<>()[\]{},;:|]/g, '');
            if (nextToken.length > 3) break;
          }
        }

        // Build domain from first token after @
        const domainToken = tokensAfter.length > 0 ? tokensAfter[0].replace(/[<>()[\]{},;:|]/g, '').toLowerCase() : '';

        if (localPart.length >= 2 && domainToken.includes('.')) {
          const candidate = localPart + '@' + domainToken;
          const emailMatch = candidate.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            data.email = emailMatch[0];
            console.log(`[ResumeParser] Email extracted (word-boundary): "${emailMatch[0]}"`);
            break;
          }
        }

        // Fallback: original approach with space removal and TLD matching
        let start = Math.max(0, atIndex - 30);
        let end = Math.min(trimmedLine.length, atIndex + 25);
        const emailPortion = trimmedLine.substring(start, end);
        let cleaned = emailPortion.replace(/\s+/g, '').toLowerCase();
        // Strip leading phone numbers (5+ consecutive digits)
        cleaned = cleaned.replace(/^\d{5,}/, '');
        // Strip leading non-alphanumeric chars
        cleaned = cleaned.replace(/^[^a-zA-Z0-9@]+/, '');

        // Try to extract with known TLDs first (most reliable)
        // These patterns match email ending at known TLD
        const knownTLDs = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
                          'icloud.com', 'protonmail.com', 'mail.com', 'aol.com',
                          '.com', '.org', '.net', '.edu', '.gov', '.io', '.co.in', '.in', '.uk', '.us', '.info'];
        for (const tld of knownTLDs) {
          const tldIndex = cleaned.indexOf(tld);
          if (tldIndex > 0) {
            // Extract email ending at this TLD
            const emailEndIndex = tldIndex + tld.length;
            const emailCandidate = cleaned.substring(0, emailEndIndex);
            // Validate it's a proper email format
            const emailMatch = emailCandidate.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
            if (emailMatch) {
              data.email = emailMatch[0];
              console.log(`[ResumeParser] Email extracted (TLD ${tld}): "${emailPortion.trim()}" -> "${emailMatch[0]}"`);
              break;
            }
          }
        }
        if (data.email) break;

        // Fallback: try general pattern (may include extra chars)
        const generalMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
        if (generalMatch) {
          data.email = generalMatch[0];
          console.log(`[ResumeParser] Email extracted (general): "${emailPortion.trim()}" -> "${generalMatch[0]}"`);
          break;
        }
      }
    }
  }

  // Fallback: try standard regex on full text if line-by-line didn't find anything
  if (!data.email) {
    const standardEmailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (standardEmailMatch) {
      data.email = standardEmailMatch[0].toLowerCase();
      console.log(`[ResumeParser] Email extracted (standard fallback): "${standardEmailMatch[0]}"`);
    }
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

      // First, try to extract name portion before section headers
      // e.g., "Aditya Rajput Career Objective" -> try extracting "Aditya Rajput"
      let lineForNameExtraction = line;
      const sectionPhrases = ["career objective", "objective", "profile summary", "professional summary",
        "summary", "profile", "resume", "cv", "contact"];
      for (const phrase of sectionPhrases) {
        const phraseRegex = new RegExp(`\\s+${phrase.replace(/\s+/g, '\\s+')}.*$`, 'i');
        if (phraseRegex.test(lineForNameExtraction)) {
          const beforePhrase = lineForNameExtraction.replace(phraseRegex, '').trim();
          if (beforePhrase.length >= 4 && /^[a-zA-Z\s\-'.]+$/.test(beforePhrase)) {
            console.log(`[ResumeParser] Extracted name before section phrase: "${beforePhrase}" from "${line}"`);
            lineForNameExtraction = beforePhrase;
            break;
          }
        }
      }

      // Skip if entire line is a section header (but not if we extracted a name portion)
      const lineLowerForCheck = lineForNameExtraction.toLowerCase();
      const isSectionHeader = lineForNameExtraction === line && SECTION_HEADERS.some(header =>
        lineLower === header || lineLower.includes(header)
      );

      // Also check if line contains common section header words (but allow if we extracted name portion)
      const lineWords = lineLowerForCheck.split(/\s+/);
      const containsSectionWord = lineForNameExtraction === line && SECTION_HEADER_WORDS.some(word =>
        lineWords.includes(word)
      );

      // Direct check for common false positives (case-insensitive)
      const knownNotNames = ["profile summary", "professional summary", "career summary",
        "executive summary", "summary of qualifications", "work experience", "contact info",
        "business leadership", "business head", "technical lead", "team lead"];
      const isKnownNotName = knownNotNames.some(notName => lineLowerForCheck === notName || lineLowerForCheck === notName.replace(/\s+/g, ""));

      // Check if it looks like a company name (use extracted portion)
      const isCompanyName = looksLikeCompanyName(lineForNameExtraction);

      console.log(`[ResumeParser] Name check line ${i}: "${lineForNameExtraction}" -> isSectionHeader: ${isSectionHeader}, containsSectionWord: ${containsSectionWord}, isKnownNotName: ${isKnownNotName}, isCompanyName: ${isCompanyName}`);

      if (isSectionHeader || containsSectionWord || isKnownNotName || isCompanyName) continue;

      // Handle lines with email - try to extract name before the email
      // e.g., "Nikhil C M nikhilcm@gmail.com" -> extract "Nikhil C M"
      let lineToCheck = lineForNameExtraction;
      if (lineForNameExtraction.includes("@")) {
        // Try to extract name before email
        const emailMatch = lineForNameExtraction.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          const emailIndex = lineForNameExtraction.indexOf(emailMatch[0]);
          const namePortion = lineForNameExtraction.substring(0, emailIndex).trim();
          if (namePortion && namePortion.length >= 4) {
            lineToCheck = namePortion;
            console.log(`[ResumeParser] Extracted name portion before email: "${namePortion}"`);
          } else {
            continue; // Skip if no valid name portion
          }
        } else {
          continue;
        }
      }

      // Handle lines with phone number - try to extract name before phone
      // e.g., "ANKIT DUTT +91 - 7022602702" -> extract "ANKIT DUTT"
      // More flexible phone pattern that handles various international formats
      if (/[\+\d]/.test(lineToCheck)) {
        console.log(`[ResumeParser] Line ${i} has phone indicator, trying extraction from: "${lineToCheck}"`);
        const phonePatterns = [
          /\+\s*\d{1,3}[\s\-]+\d{10}/,               // +91 - 7022602702 (with separator before 10 digits)
          /\+\s*\d{1,3}[\s\-]*\d{3,}[\s\-]*\d{3,}/, // + 91 - 702 260 2702 or +91-7022602702
          /\+\s*\d{1,3}[\s\-]*\d{10,}/,              // +91 7022602702
          /\d{10,}/,                                  // 7022602702
          /\(\d{3}\)[\s\-]?\d{3}[\s\-]?\d{4}/,       // (123) 456-7890
        ];

        for (const phonePattern of phonePatterns) {
          const phoneMatch = lineToCheck.match(phonePattern);
          if (phoneMatch) {
            const phoneIndex = lineToCheck.indexOf(phoneMatch[0]);
            console.log(`[ResumeParser] Phone match: "${phoneMatch[0]}" at index ${phoneIndex}`);
            if (phoneIndex > 3) {  // Reduced from 4 to 3 to catch shorter names
              // Extract and clean: remove all non-letter characters from start and end
              const rawName = lineToCheck.substring(0, phoneIndex);
              let namePortion = rawName.replace(/[^a-zA-Z]+$/, '').replace(/^[^a-zA-Z]+/, '');
              // Normalize internal whitespace
              namePortion = namePortion.replace(/\s+/g, ' ').trim();

              console.log(`[ResumeParser] Raw name portion: "${rawName}" -> cleaned: "${namePortion}"`);

              const isValidName = namePortion && namePortion.length >= 4 && /^[a-zA-Z][a-zA-Z\s\-'.]*[a-zA-Z]$/.test(namePortion);
              if (isValidName) {
                // Additional check: make sure extracted name is not a section header
                if (!looksLikeCompanyName(namePortion)) {
                  console.log(`[ResumeParser] Extracted name before phone: "${namePortion}"`);
                  lineToCheck = namePortion;
                  break;
                } else {
                  console.log(`[ResumeParser] Extracted portion "${namePortion}" looks like company/section, skipping`);
                }
              }
            }
          }
        }
      }

      // Skip if it's just a phone number line
      if (/^\+?\d[\d\s\-().]{8,}$/.test(lineToCheck)) continue;

      // Skip if it's a job title pattern (contains common job words)
      const lineToCheckLower = lineToCheck.toLowerCase();
      const jobTitleWords = ["engineer", "developer", "manager", "analyst", "executive", "director", "consultant", "specialist", "coordinator", "officer", "lead", "architect", "head", "president", "vice"];
      const isJobTitle = jobTitleWords.some(word => lineToCheckLower.includes(word));
      if (isJobTitle && !lineToCheckLower.match(/^[a-z]+\s+[a-z]+$/)) continue;

      // Skip if it looks like a date or year (must START with year or month name)
      // All month names need word boundaries to avoid matching names like "Mayank"
      if (/^(\d{4}\b|january\b|february\b|march\b|april\b|may\b|june\b|july\b|august\b|september\b|october\b|november\b|december\b|jan\b|feb\b|mar\b|apr\b|jun\b|jul\b|aug\b|sep\b|oct\b|nov\b|dec\b)/i.test(lineToCheck)) continue;

      // Try to extract name - handling various formats:
      // "SHIVANI CHOPRA, LLB | CS | MBA" -> Extract "SHIVANI CHOPRA"
      // "John Smith - Software Engineer" -> Extract "John Smith"
      // "Nikhil C M nikhilcm@gmail.com" -> Extract "Nikhil C M"

      // First, try to extract name before common separators
      let namePart = lineToCheck;

      // Handle case where section header words are appended to name
      // e.g., "Aditya Rajput Career Objective" or "Sudharshan Profile"
      const sectionSuffixes = ["career objective", "objective", "profile summary", "summary", "profile", "resume", "cv", "bio"];
      for (const suffix of sectionSuffixes) {
        const suffixRegex = new RegExp(`\\s+${suffix.replace(/\s+/g, '\\s+')}$`, 'i');
        if (suffixRegex.test(namePart)) {
          namePart = namePart.replace(suffixRegex, '').trim();
          console.log(`[ResumeParser] Removed section suffix "${suffix}" -> "${namePart}"`);
          break;
        }
      }

      // If just one word left after removing suffix, try to combine with next line
      if (namePart.split(/\s+/).length === 1 && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const nextLineWords = nextLine.split(/\s+/);
        if (nextLineWords.length === 1 && /^[A-Z][a-z]+$/.test(nextLineWords[0])) {
          namePart = `${namePart} ${nextLineWords[0]}`;
          console.log(`[ResumeParser] Combined name from two lines: "${namePart}"`);
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

      // Fix spaced-out names (e.g., "A R U N" -> "ARUN")
      namePart = fixSpacedName(namePart);

      // Double-check it's not a company name after fixing
      if (looksLikeCompanyName(namePart)) continue;

      console.log(`[ResumeParser] Checking name candidate: "${namePart}"`);

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
          // Fix spaced names
          const fixedCandidate = fixSpacedName(candidate);
          if (!looksLikeCompanyName(fixedCandidate)) {
            data.name = fixedCandidate;
            console.log(`[ResumeParser] Fallback found ALL CAPS name: "${fixedCandidate}"`);
            break;
          }
        }
      }
    }

    // Validate extracted name: reject if any word is too long (likely stuck-together from spacing issues)
    // e.g., "MR. AMOLGATHADI" has "AMOLGATHADI" (11 chars) which is not a real name word
    if (data.name) {
      const nameWords = data.name.replace(/^(MR\.?|MS\.?|MRS\.?|DR\.?|PROF\.?)\s+/i, '').split(/\s+/);
      const hasStuckWord = nameWords.some(w => w.replace(/[.]/g, '').length > 10);
      if (hasStuckWord) {
        console.log(`[ResumeParser] Name "${data.name}" rejected - likely stuck-together text, falling back to email`);
        data.name = null;
      }
    }

    // Third fallback: Try to extract name from email
    if (!data.name && data.email) {
      const emailParts = data.email.split('@')[0];
      // Remove common suffixes like numbers
      const cleanEmail = emailParts.replace(/\d+$/, '').replace(/[._]/g, ' ');
      const words = cleanEmail.split(' ').filter(w => w.length > 1);

      if (words.length >= 2) {
        // Capitalize each word
        const nameFromEmail = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (!looksLikeCompanyName(nameFromEmail) && nameFromEmail.length >= 4 && nameFromEmail.length <= 40) {
          data.name = nameFromEmail;
          console.log(`[ResumeParser] Extracted name from email: "${nameFromEmail}"`);
        }
      }
    }
  }

  // Extract skills using common skill keywords
  // IMPORTANT: Excludes ambiguous short names like Go, R, C that cause false positives
  // Skills are categorized by matching strategy needed
  const skillKeywords = [
    // Programming Languages (removed ambiguous: Go, R, C — these cause too many false positives)
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Golang", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "Scala", "Perl", "Shell", "Bash", "PowerShell", "Groovy",
    // Data formats
    "XML", "JSON", "YAML",
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
    "Maven", "Gradle", "npm", "Yarn", "Babel",
    // Testing
    "JUnit", "Mockito", "Jest", "Mocha", "Cypress", "Selenium", "TestNG", "Postman",
    "Unit Testing", "Integration Testing", "TDD", "BDD",
    // Security (removed bare "Security" - too generic)
    "OAuth", "OAuth 2.0", "JWT", "SSL", "TLS", "HTTPS", "Authentication",
    // Data & ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Data Analysis", "Data Science", "NLP", "Computer Vision", "Scikit-learn",
    // Tools & IDE
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Figma", "Photoshop",
    "Excel", "Tableau", "Power BI", "VS Code", "IntelliJ", "Eclipse",
    // Methodologies
    "Agile", "Scrum", "SAFe", "Kanban", "Waterfall", "DevOps", "CI/CD Pipeline",
    // Leadership & Management Skills
    "Leadership", "Communication", "Collaboration", "Mentoring",
    "Team Management", "Project Management", "Problem Solving",
    "Critical Thinking", "Cross-functional Collaboration",
    // Business & Management Skills
    "Sales", "Marketing", "Operations", "Negotiation", "Training", "Analytics",
    "Business Development", "Strategic Planning", "P&L Management",
    "Revenue Growth", "Channel Sales", "Account Management", "Distribution",
    "Customer Success", "Stakeholder Management", "Budget Management",
    "Team Building", "Public Speaking", "Presentation Skills",
    "CRM", "Salesforce", "HubSpot", "Market Research", "Competitive Analysis",
    "Product Launch", "Go-to-Market", "Partnership Development", "Vendor Management",
    "Change Management", "Process Improvement",
    "KPI Management", "Performance Management", "Talent Acquisition", "Employee Engagement",
    // E-Commerce & Digital Business
    "E-Commerce", "Ecommerce", "D2C", "Direct to Consumer", "Omnichannel", "Category Management",
    "Category Planning", "Digital Transformation", "Online Retail", "Marketplace",
    "Amazon", "Flipkart", "Shopify", "Magento", "WooCommerce",
    "GMV", "ARR", "ROAS", "CAC", "Customer Acquisition", "Retention",
    "Inventory Management", "Supply Chain", "Demand Planning", "Pricing Strategy",
    "Digital Marketing", "Performance Marketing", "SEO", "SEM", "PPC", "Google Ads", "Meta Ads",
    "Affiliate Marketing", "Influencer Marketing", "Content Marketing",
    "Growth Strategy", "Growth Marketing", "User Acquisition", "Conversion Optimization",
    "A/B Testing", "Funnel Optimization", "Customer Journey", "UX Optimization",
    // Finance & Insurance (context-sensitive single words are in contextSensitiveSkills)
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
    "Guidewire", "PolicyCenter", "ClaimCenter", "BillingCenter", "SAP",
    "ServiceNow", "Workday", "Oracle EBS",
  ];

  // Skills that should ONLY match when they appear in a skills/technical section or as standalone terms
  // These are common English words that happen to also be skill names
  // They need special context-aware matching to avoid false positives
  const contextSensitiveSkills = [
    "Leadership", "Communication", "Sales", "Marketing", "Operations",
    "Negotiation", "Training", "Collaboration", "Analytics",
    "Distribution", "Legal", "Compliance", "Insurance", "Investment", "Banking",
    "Retention", "Sourcing", "Onboarding", "Compensation", "Benefits",
    "Secretarial", "Litigation", "Marketplace", "Amazon", "Flipkart",
    "Excel", "Shell", "Express", "Swift",
  ];

  // Skills that MUST match case-sensitively (uppercase only) to avoid matching regular English words
  // e.g., "REST" should not match "rest", "SQL" should not match inside "result"
  // These skills MUST appear as uppercase to be detected (prevents matching regular English words)
  // "REST" won't match "rest of the team", "SQL" won't match "result", "MQ" won't match random text
  const caseSensitiveSkills = ["REST", "SQL", "MQ"];

  // Normalize text for heavily spaced PDFs (like "J a v a" -> "Java")
  let normalizedText = text;
  const singleCharPattern = /\b[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\b/g;
  const singleCharMatches = text.match(singleCharPattern) || [];
  const spacingRatio = singleCharMatches.length / (text.length / 100);

  if (spacingRatio > 2) {
    normalizedText = text.replace(/([A-Za-z])\s+([A-Za-z])(?=\s+[A-Za-z]|\s*$|\s*[^A-Za-z])/g, '$1$2');
    for (let i = 0; i < 5; i++) {
      const prev = normalizedText;
      normalizedText = normalizedText.replace(/([A-Za-z])\s+([A-Za-z])(?=\s+[A-Za-z]|\s*$|\s*[^A-Za-z])/g, '$1$2');
      if (prev === normalizedText) break;
    }
    normalizedText = normalizedText.replace(/([A-Za-z])\s([A-Za-z])/g, '$1$2');
    console.log(`[ResumeParser] Normalized heavily spaced text (ratio: ${spacingRatio.toFixed(1)})`);
  }

  const textLower = normalizedText.toLowerCase();

  // Detect skills section boundaries for context-sensitive matching
  const skillsSectionRegex = /(?:skills|technical skills|core competencies|key skills|areas of expertise|tools?\s*(?:&|and)\s*technologies)[\s:]*\n([\s\S]*?)(?:\n\s*\n|\n(?:[A-Z][A-Za-z\s]+:?\s*\n))/gi;
  const skillsSections = [];
  let sectionMatch;
  while ((sectionMatch = skillsSectionRegex.exec(normalizedText)) !== null) {
    skillsSections.push(sectionMatch[0].toLowerCase());
  }
  // Also include lines that look like skill lists (comma/pipe separated, bullet lists)
  const skillListLines = normalizedText.split('\n').filter(line => {
    const trimmed = line.trim();
    // Lines with multiple commas or pipes that contain known skill words
    const separators = (trimmed.match(/[,|•]/g) || []).length;
    return separators >= 2 && trimmed.length < 300;
  }).join('\n').toLowerCase();

  const combinedSkillsContext = skillsSections.join('\n') + '\n' + skillListLines;

  // Skills that need word boundary matching to avoid false positives
  const needsWordBoundary = ["Java", "SQL", "AWS", "GCP", "Git", "CSS", "PHP", "Scala", "Rust", "Ruby", "JMS", "SQS", "SNS", "JPA", "PCF", "TDD", "BDD", "JWT", "SSL", "TLS", "PPC", "SEM", "SEO", "CRM", "ATS", "NLP", "SAP", "D2C", "GMV", "ARR", "CAC", "IPR", "SAFe"];

  for (const skill of skillKeywords) {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Case-sensitive skills: must match exact case
    if (caseSensitiveSkills.includes(skill)) {
      const regex = new RegExp(`\\b${escapedSkill}\\b`);
      if (regex.test(normalizedText)) {
        data.skills.push(skill);
      }
      continue;
    }

    // Context-sensitive skills: must appear in skills section OR appear 2+ times OR appear in a skill-list-like line
    if (contextSensitiveSkills.includes(skill)) {
      const skillLower = skill.toLowerCase();
      const escapedLower = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Check if it appears in detected skills section
      const inSkillsSection = combinedSkillsContext.includes(skillLower);

      // Check if it appears 2+ times (indicating it's a core topic, not incidental)
      const globalRegex = new RegExp(`\\b${escapedLower}\\b`, 'gi');
      const occurrences = (normalizedText.match(globalRegex) || []).length;

      if (inSkillsSection || occurrences >= 2) {
        data.skills.push(skill);
      }
      continue;
    }

    // Short skills or skills that are substrings: use word boundary matching (case-insensitive)
    if (skill.length <= 5 || needsWordBoundary.includes(skill)) {
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(normalizedText)) {
        data.skills.push(skill);
      }
    } else if (textLower.includes(skill.toLowerCase())) {
      data.skills.push(skill);
    }
  }

  // Dedupe skills
  data.skills = [...new Set(data.skills)];

  // Add related skills based on detected skills
  const originalSkillsCount = data.skills.length;
  const relatedSkillsToAdd = [];

  for (const skill of data.skills) {
    const relatedSkills = RELATED_SKILLS_MAP[skill] || [];
    for (const relatedSkill of relatedSkills) {
      const relatedLower = relatedSkill.toLowerCase();
      const resumeTextLower = normalizedText.toLowerCase();
      if (!data.skills.some(s => s.toLowerCase() === relatedLower) &&
          !relatedSkillsToAdd.some(s => s.toLowerCase() === relatedLower)) {
        // Check if the FULL skill name (not just first word) appears in text
        // This prevents false positives like "Content" matching any text with "content"
        const escapedRelated = relatedLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const relatedRegex = new RegExp(`\\b${escapedRelated}\\b`, 'i');
        if (relatedRegex.test(resumeTextLower)) {
          relatedSkillsToAdd.push(relatedSkill);
        }
      }
    }
  }

  // Add top related skills (limit to avoid over-suggestion)
  data.skills = [...data.skills, ...relatedSkillsToAdd.slice(0, 5)];
  data.skills = [...new Set(data.skills)];

  if (relatedSkillsToAdd.length > 0) {
    console.log(`[ResumeParser] Added ${Math.min(relatedSkillsToAdd.length, 5)} related skills: ${relatedSkillsToAdd.slice(0, 5).join(', ')}`);
  }

  // Suggest roles based on skills - COMPREHENSIVE MAPPING
  // Role names MUST match exactly with frontend constants.ts
  const roleMapping = {
    // ============ JAVA & BACKEND ============
    "Java Developer": ["Java", "Spring", "Spring Boot", "Hibernate", "Maven", "JUnit"],
    "Backend Developer": ["Java", "Spring Boot", "REST", "Microservices", "SQL", "Maven", "Node.js", "Python"],
    "Senior Backend Developer": ["Java", "Spring Boot", "Microservices", "AWS", "CI/CD", "Architecture"],
    "Software Engineer": ["JavaScript", "Python", "Java", "C++", "Git", "Agile"],
    "Senior Software Engineer": ["Java", "Microservices", "Spring Boot", "AWS", "CI/CD", "Leadership"],
    "Node.js Developer": ["Node.js", "Express", "JavaScript", "MongoDB", "REST", "GraphQL"],
    "Python Developer": ["Python", "Django", "Flask", "FastAPI", "SQL", "Machine Learning"],
    ".NET Developer": [".NET", "C#", "ASP.NET", "SQL Server", "Azure"],

    // ============ GUIDEWIRE & INSURANCE ============
    "Guidewire Developer": ["Guidewire", "PolicyCenter", "ClaimCenter", "BillingCenter", "Java", "Insurance", "Gosu"],
    "Guidewire Consultant": ["Guidewire", "PolicyCenter", "Insurance", "Configuration", "Java"],
    "Guidewire PolicyCenter Developer": ["Guidewire", "PolicyCenter", "Java", "Insurance", "Gosu"],
    "Senior Guidewire Developer": ["Guidewire", "PolicyCenter", "ClaimCenter", "Java", "Insurance", "Leadership"],
    "Insurance Developer": ["Guidewire", "Insurance", "PolicyCenter", "Java", "Claims"],

    // ============ FRONTEND ============
    "Frontend Developer": ["React", "Angular", "Vue", "HTML", "CSS", "JavaScript", "TypeScript"],
    "React Developer": ["React", "JavaScript", "TypeScript", "Redux", "CSS", "Node.js"],
    "Angular Developer": ["Angular", "TypeScript", "JavaScript", "RxJS", "CSS"],
    "Vue.js Developer": ["Vue", "JavaScript", "Vuex", "CSS", "Node.js"],
    "UI Developer": ["HTML", "CSS", "JavaScript", "React", "Figma", "Responsive Design"],

    // ============ FULL STACK ============
    "Full Stack Developer": ["React", "Node.js", "MongoDB", "Express", "JavaScript", "SQL"],
    "MERN Stack Developer": ["MongoDB", "Express", "React", "Node.js", "JavaScript"],

    // ============ CLOUD & DEVOPS ============
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Jenkins"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform"],
    "AWS Solutions Architect": ["AWS", "Cloud", "Architecture", "EC2", "S3", "Lambda"],
    "Site Reliability Engineer": ["Linux", "Kubernetes", "Monitoring", "Grafana", "Prometheus", "SRE"],

    // ============ DATA ROLES ============
    "Data Scientist": ["Python", "Machine Learning", "Pandas", "TensorFlow", "Data Analysis", "Statistics"],
    "Data Engineer": ["SQL", "Python", "Kafka", "Spark", "ETL", "Data Pipeline", "Airflow"],
    "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Data Analysis", "Python"],
    "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning"],

    // ============ ARCHITECTURE & LEAD ============
    "Solution Architect": ["AWS", "Microservices", "Docker", "Architecture", "Cloud", "Design Patterns"],
    "Technical Lead": ["Java", "Leadership", "Agile", "Code Review", "Mentoring", "Architecture"],
    "Engineering Manager": ["Leadership", "Agile", "Team Management", "Java", "Architecture"],

    // ============ PRODUCT & PROJECT ============
    "Product Manager": ["Agile", "Scrum", "Jira", "Product Management", "Roadmap", "User Research"],
    "Project Manager": ["Project Management", "Agile", "Scrum", "Jira", "Leadership", "PMP"],
    "Scrum Master": ["Scrum", "Agile", "Jira", "SAFe", "Kanban", "Facilitation"],
    "Technical Project Manager": ["Project Management", "Agile", "Technical", "Jira", "Software Development"],

    // ============ DESIGN ============
    "UX Designer": ["Figma", "UX", "User Research", "Wireframing", "Prototyping"],
    "UI/UX Designer": ["Figma", "UI", "UX", "Adobe XD", "Sketch", "User Research"],
    "Product Designer": ["Figma", "Product Design", "UX", "Prototyping", "Design Systems"],

    // ============ QA & TESTING ============
    "QA Engineer": ["Testing", "Selenium", "Test Automation", "QA", "JIRA", "Agile"],
    "Test Automation Engineer": ["Selenium", "Test Automation", "Java", "Python", "CI/CD"],
    "SDET": ["Test Automation", "Java", "Python", "Selenium", "API Testing", "CI/CD"],

    // ============ MOBILE ============
    "Mobile Developer": ["iOS", "Android", "React Native", "Flutter", "Mobile"],
    "iOS Developer": ["iOS", "Swift", "Objective-C", "Xcode", "Mobile"],
    "Android Developer": ["Android", "Kotlin", "Java", "Mobile", "Android Studio"],
    "React Native Developer": ["React Native", "JavaScript", "Mobile", "React", "iOS", "Android"],

    // ============ BUSINESS ROLES ============
    "Business Analyst": ["SQL", "Excel", "Jira", "Requirements", "Agile", "Business Analysis"],
    "Business Development Manager": ["Business Development", "Sales", "Negotiation", "Partnership"],
    "Sales Manager": ["Sales", "Account Management", "CRM", "Negotiation", "Leadership"],
    "Operations Manager": ["Operations", "Process Improvement", "Team Management", "Budget"],
    "Marketing Manager": ["Marketing", "Digital Marketing", "Analytics", "SEO", "Content"],

    // ============ E-COMMERCE & GROWTH ROLES ============
    "E-Commerce Director": ["E-Commerce", "Ecommerce", "Category Management", "P&L Management", "Digital Transformation", "Omnichannel"],
    "E-Commerce Manager": ["E-Commerce", "Ecommerce", "Category Management", "Digital Marketing", "Analytics"],
    "Category Head": ["Category Management", "Category Planning", "P&L Management", "Revenue Growth", "Pricing Strategy"],
    "Category Manager": ["Category Management", "Category Planning", "Inventory Management", "Pricing Strategy"],
    "Growth Manager": ["Growth Strategy", "Growth Marketing", "User Acquisition", "Analytics", "Performance Marketing"],
    "Growth Head": ["Growth Strategy", "User Acquisition", "P&L Management", "Leadership", "Performance Marketing"],
    "Digital Marketing Manager": ["Digital Marketing", "Performance Marketing", "SEO", "SEM", "Google Ads", "Meta Ads"],
    "Performance Marketing Manager": ["Performance Marketing", "ROAS", "CAC", "Google Ads", "Meta Ads", "Analytics"],
    "D2C Brand Manager": ["D2C", "Direct to Consumer", "E-Commerce", "Brand Management", "Digital Marketing"],
    "Omnichannel Manager": ["Omnichannel", "E-Commerce", "Retail", "Customer Experience", "Digital Transformation"],
    "Business Head": ["P&L Management", "Revenue Growth", "Leadership", "Strategic Planning", "Team Building"],
    "Marketplace Manager": ["Amazon", "Flipkart", "Marketplace", "E-Commerce", "Category Management"],

    // ============ HR & TALENT ============
    "HR Manager": ["Talent Acquisition", "Employee Engagement", "Performance Management", "Training", "HR"],
    "Talent Acquisition Manager": ["Talent Acquisition", "Recruitment", "Sourcing", "Leadership", "ATS"],
    "Recruiter": ["Recruitment", "Sourcing", "Talent Acquisition", "ATS", "Headhunting"],
    "Technical Recruiter": ["Technical Recruitment", "Sourcing", "IT Hiring", "ATS", "LinkedIn"],

    // ============ LEGAL & COMPLIANCE ============
    "Legal Counsel": ["Legal", "Compliance", "Contract Management", "Corporate Governance", "Litigation"],
    "Head Legal": ["Legal", "Compliance", "Contract Negotiation", "M&A", "Due Diligence"],
    "Company Secretary": ["Company Secretary", "Secretarial", "Corporate Governance", "Board Advisory", "Compliance"],
    "Compliance Officer": ["Compliance", "Regulatory", "Risk Management", "Corporate Governance"],

    // ============ FINANCE ============
    "Financial Analyst": ["Financial Analysis", "Excel", "Financial Modeling", "Investment", "Valuation"],
    "Investment Analyst": ["Investment", "Portfolio Management", "Financial Analysis", "Equity Research"],
    "Relationship Manager": ["Sales", "Account Management", "Customer Success", "Banking", "Client Relations"],
    "Finance Manager": ["Financial Planning", "Budgeting", "Accounting", "Excel", "SAP"],
  };

  for (const [role, roleSkills] of Object.entries(roleMapping)) {
    const matchCount = roleSkills.filter(s =>
      data.skills.some(ds => ds.toLowerCase() === s.toLowerCase())
    ).length;
    if (matchCount >= 2) {
      data.suggestedRoles.push({ role, matchCount });
    }
  }

  // Sort by match count and take TOP 10 roles (minimum 3 if available)
  data.suggestedRoles = data.suggestedRoles
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 10)
    .map(r => r.role);

  console.log("[ResumeParser] Suggested roles:", data.suggestedRoles);

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
