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
 * Simpler fallback parser for basic resume formats
 */
function parseResumeForExperience(resumeText) {
  if (!resumeText || resumeText.length < 50) return [];

  const experience = [];

  // Multiple patterns to find job entries
  const jobPatterns = [
    // Pattern: Title at Company (2020 - 2023)
    /([A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Lead|Head|Director|Executive|Specialist|Consultant|Designer|Architect))\s+(?:at|@)\s+([A-Z][a-zA-Z\s&.,]+?)[\s,]*\(?\s*(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/gi,

    // Pattern: Company | Title | Date
    /([A-Z][a-zA-Z\s&.,]+?)\s*[|•]\s*([A-Z][a-zA-Z\s]+)\s*[|•]?\s*(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/gi,

    // Pattern: Title - Company (Date)
    /([A-Z][a-zA-Z\s]+)\s*[-–]\s*([A-Z][a-zA-Z\s&.,]+?)\s*\(?\s*(\d{4})\s*[-–to]+\s*(\d{4}|present|current)\)?/gi,

    // Pattern: Company\nTitle\nDate
    /([A-Z][a-zA-Z\s&.,]+(?:Ltd|Inc|Corp|LLC|Pvt|Limited)?\.?)\s*\n\s*([A-Z][a-zA-Z\s]+)\s*\n?\s*(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/gi,
  ];

  for (const pattern of jobPatterns) {
    let match;
    while ((match = pattern.exec(resumeText)) !== null) {
      const entry = {
        company: match[2]?.trim() || match[1]?.trim() || "",
        title: match[1]?.trim() || match[2]?.trim() || "",
        duration: `${match[3]} - ${match[4] || "Present"}`,
        location: "",
        bullets: []
      };

      // Determine which is title vs company
      const titleWords = ["engineer", "developer", "manager", "analyst", "lead", "head", "director", "specialist", "consultant", "designer", "architect"];
      const companyWords = ["ltd", "inc", "corp", "llc", "pvt", "limited", "solutions", "technologies", "services"];

      if (companyWords.some(w => entry.title.toLowerCase().includes(w))) {
        // Swap title and company
        const temp = entry.title;
        entry.title = entry.company;
        entry.company = temp;
      }

      // Only add if we have either title or company
      if ((entry.title || entry.company) && !experience.some(e =>
        e.title.toLowerCase() === entry.title.toLowerCase() &&
        e.company.toLowerCase() === entry.company.toLowerCase()
      )) {
        experience.push(entry);
      }
    }
  }

  return experience.slice(0, 5);
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

  // Parse experience and education from resume (use detailed parser for better results)
  const parsedExperience = input.parsedExperience || parseExperienceDetailed(existingResume) || parseResumeForExperience(existingResume);
  const parsedEducation = input.parsedEducation || parseResumeForEducation(existingResume);
  const certifications = input.parsedCertifications || [];

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
    model: "fast", // Use 8b for speed on free tier (70b too slow/unreliable)
    maxTokens: 2000,
    temperature: 0.5
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
 * Action verbs for bullet point enhancement
 */
const ACTION_VERBS = {
  leadership: ["Led", "Directed", "Managed", "Oversaw", "Coordinated", "Spearheaded", "Championed"],
  achievement: ["Achieved", "Delivered", "Accomplished", "Exceeded", "Surpassed", "Attained"],
  creation: ["Developed", "Created", "Built", "Designed", "Established", "Launched", "Implemented"],
  improvement: ["Improved", "Enhanced", "Optimized", "Streamlined", "Transformed", "Modernized"],
  analysis: ["Analyzed", "Evaluated", "Assessed", "Identified", "Researched", "Investigated"],
  collaboration: ["Collaborated", "Partnered", "Facilitated", "Negotiated", "Liaised"]
};

/**
 * Enhance bullet points with action verbs
 */
function enhanceBulletPoints(bullets) {
  if (!bullets || bullets.length === 0) return [];

  return bullets.map(bullet => {
    const trimmed = bullet.trim();

    // Already starts with a strong verb
    const allVerbs = Object.values(ACTION_VERBS).flat();
    if (allVerbs.some(v => trimmed.startsWith(v))) {
      return trimmed;
    }

    // Common weak starts to transform
    const weakStarts = [
      { pattern: /^responsible for\s*/i, replacement: "Managed " },
      { pattern: /^worked on\s*/i, replacement: "Developed " },
      { pattern: /^helped with\s*/i, replacement: "Contributed to " },
      { pattern: /^involved in\s*/i, replacement: "Participated in " },
      { pattern: /^assisted\s*/i, replacement: "Supported " },
      { pattern: /^was part of\s*/i, replacement: "Collaborated on " },
      { pattern: /^handled\s*/i, replacement: "Managed " },
      { pattern: /^did\s*/i, replacement: "Executed " },
      { pattern: /^made\s*/i, replacement: "Created " }
    ];

    for (const { pattern, replacement } of weakStarts) {
      if (pattern.test(trimmed)) {
        return trimmed.replace(pattern, replacement);
      }
    }

    // If no weak start found, prepend an appropriate verb
    if (/team|group|department/i.test(trimmed)) {
      return `Led ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`;
    }
    if (/system|application|feature|tool/i.test(trimmed)) {
      return `Developed ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`;
    }
    if (/process|workflow|efficiency/i.test(trimmed)) {
      return `Optimized ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`;
    }

    return trimmed;
  });
}

/**
 * Parse experience from resume text more thoroughly
 * Enhanced to handle various resume formats including:
 * - Multi-column layouts
 * - Different date formats
 * - Various bullet point styles
 */
function parseExperienceDetailed(resumeText) {
  if (!resumeText || resumeText.length < 50) return [];

  const experience = [];
  const lines = resumeText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  // --- Section header detection (broad) ---
  const expSectionPatterns = [
    /^(work\s*)?experience\s*:?$/i,
    /^employment(\s*history)?\s*:?$/i,
    /^professional\s*(experience|background|history)\s*:?$/i,
    /^career\s*(history|summary|overview)\s*:?$/i,
    /^work\s*history\s*:?$/i,
    /^relevant\s*experience\s*:?$/i,
    /^industry\s*experience\s*:?$/i,
  ];

  const endSectionPatterns = [
    /^education(al)?(\s*(background|qualifications?|details?))?\s*:?$/i,
    /^(technical\s*)?skills?\s*:?$/i,
    /^(core\s*)?competenc(ies|y)\s*:?$/i,
    /^certifications?\s*(&\s*licenses?)?\s*:?$/i,
    /^projects?\s*:?$/i,
    /^awards?\s*(&\s*honors?)?\s*:?$/i,
    /^achievements?\s*:?$/i,
    /^languages?\s*:?$/i,
    /^interests?\s*(&\s*hobbies?)?\s*:?$/i,
    /^references?\s*:?$/i,
    /^personal\s*(details?|information|profile)?\s*:?$/i,
    /^(key\s*)?tools?\s*(&|and)?\s*technolog(ies|y)\s*:?$/i,
    /^publications?\s*:?$/i,
    /^volunteer(ing)?\s*(experience)?\s*:?$/i,
    /^(extra[\s-]?curricular\s*)?activities\s*:?$/i,
    /^areas?\s*of\s*expertise\s*:?$/i,
  ];

  // End section must be a short standalone header line (< 50 chars), not embedded in longer text
  function isEndSectionHeader(line) {
    return line.length < 50 && endSectionPatterns.some(p => p.test(line));
  }

  // --- Date patterns (comprehensive) ---
  // Note: [.,\-]? between month and year handles "Feb-2020", "Jun.2020", "Mar,2020"
  const datePatterns = [
    // "2020 - 2023", "2020 – Present", "2020 to 2023", "2020 - tilldate"
    /(\d{4})\s*[-–—to]+\s*(\d{4}|present|current|now|ongoing|till\s*date|tilldate|date)/i,
    // "Jan 2020 - Dec 2023", "June-2022 to Present", "Feb-2020 to Jan-2020", "Mar 2020 - present"
    // [.,\-]? allows period/comma/hyphen between month and year
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,\-]?\s*['']?(\d{2,4})\s*[-–—to]+\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,\-]?\s*)?['']?(\d{2,4}|present|current|now|ongoing|till\s*date|tilldate)/i,
    // "Jul'19 - Dec'22", "Jan'20 - Present", "Sep'17 - Apr'21" (Naukri apostrophe format)
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[''](\d{2,4})\s*[-–—to]+\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)['']?)?(\d{2,4}|present|current|now|ongoing|till\s*date|tilldate)/i,
    // "'19 - '22", "'20 - present" (short apostrophe year format)
    /[''](\d{2})\s*[-–—to]+\s*['']?(\d{2}|present|current|now|tilldate|till\s*date)/i,
    // "(2020 - 2023)", "(Jan 2020 - Present)" (parenthesized dates)
    /\(\s*(?:\w+\s*)?(\d{4})\s*[-–—to]+\s*(?:\w+\s*)?(\d{4}|present|current|now|tilldate|till\s*date)\s*\)/i,
    // "01/2020 - 12/2023", "1/2020 – Present"
    /(\d{1,2}\/\d{2,4})\s*[-–—to]+\s*(\d{1,2}\/\d{2,4}|present|current)/i,
    // "Since 2020", "From 2020"
    /(since|from)\s+['']?(\d{4})/i,
  ];

  function lineHasDate(line) {
    return datePatterns.some(p => p.test(line));
  }

  function extractDateFromLine(line) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) return match[0];
    }
    return "";
  }

  // --- Job title keywords (expanded) ---
  const JOB_TITLE_WORDS = /\b(engineer|developer|programmer|manager|analyst|executive|director|consultant|specialist|lead|head|architect|designer|coordinator|officer|president|vice\s*president|vp|ceo|cto|cfo|coo|intern|trainee|associate|senior|junior|staff|principal|technician|administrator|supervisor|assistant|secretary|accountant|advisor|representative|operator|scientist|researcher|professor|instructor|teacher|nurse|therapist|physician|counsel|advocate|planner|strategist|recruiter|founder|partner|freelancer?)\b/i;

  // --- Company indicator words ---
  const COMPANY_WORDS = /\b(pvt|ltd|inc|corp|llc|llp|limited|solutions|technologies|technology|tech|services|consulting|consultancy|systems|software|group|global|international|ventures|labs?|studio|agency|network|media|digital|infotech|infosys|wipro|tcs|cognizant|accenture|deloitte|amazon|google|microsoft|apple|meta|facebook|flipkart|uber|ola|swiggy|zomato|paytm|razorpay)\b/i;

  function looksLikeJobTitle(text) {
    return JOB_TITLE_WORDS.test(text);
  }
  function looksLikeCompany(text) {
    return COMPANY_WORDS.test(text);
  }
  function isBulletLine(line) {
    return /^[•●○■▪►▸▹→\-\*~]\s+/.test(line) || /^\d+[.)]\s+/.test(line) || /^[➤➢❖✓✔]\s*/.test(line);
  }
  function cleanBullet(line) {
    return line.replace(/^[•●○■▪►▸▹→\-\*~➤➢❖✓✔]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
  }

  // --- PASS 1: Find experience section boundaries ---
  let expStartIndex = -1;
  let expEndIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (expSectionPatterns.some(p => p.test(lines[i]))) {
      expStartIndex = i + 1; // Start AFTER the header
      break;
    }
  }

  // If no explicit header, scan for first line with a date + job indicator
  if (expStartIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (lineHasDate(line) && (looksLikeJobTitle(line) || looksLikeCompany(line) || line.length > 15)) {
        expStartIndex = i;
        break;
      }
      // Check title on this line + date on next
      if (looksLikeJobTitle(line) && i + 1 < lines.length && lineHasDate(lines[i + 1])) {
        expStartIndex = i;
        break;
      }
    }
  }

  if (expStartIndex === -1) {
    console.log("[CV Generation] No experience section found in resume");
    return [];
  }

  // Find where experience section ends (only match short standalone section headers)
  for (let i = expStartIndex; i < lines.length; i++) {
    if (isEndSectionHeader(lines[i])) {
      expEndIndex = i;
      break;
    }
  }

  console.log(`[CV Generation] Experience section: lines ${expStartIndex}-${expEndIndex} of ${lines.length}`);

  // --- PASS 2: Parse job entries within the section ---
  let currentJob = null;
  let bullets = [];

  for (let i = expStartIndex; i < expEndIndex; i++) {
    const line = lines[i];

    // Skip empty-looking lines and section headers
    if (line.length < 3) continue;
    if (expSectionPatterns.some(p => p.test(line))) continue;

    const hasDate = lineHasDate(line);
    const hasJobTitle = looksLikeJobTitle(line);
    const hasCompanyWord = looksLikeCompany(line);
    const nextLine = i + 1 < expEndIndex ? lines[i + 1] : "";
    const nextHasDate = lineHasDate(nextLine);
    const isBullet = isBulletLine(line);

    // --- Detect new job entry ---
    // A new job entry is signaled by: a date on the line, OR a title/company line followed by date on the next line
    // BUT: a date-only line (< 30 chars, just a date range) should attach to previous/next title, not be standalone
    const dateStr = extractDateFromLine(line);
    const lineWithoutDate = dateStr ? line.replace(dateStr, "").trim() : line;
    const isDateOnlyLine = hasDate && lineWithoutDate.length < 5 && line.length < 40;

    // Also check 2 lines ahead for dates (title, company, date on 3 lines)
    const line2Ahead = i + 2 < expEndIndex ? lines[i + 2] : "";
    const twoAheadHasDate = lineHasDate(line2Ahead);

    const isNewJobEntry =
      (hasDate && !isBullet && !isDateOnlyLine && line.length < 200) ||
      (hasJobTitle && (nextHasDate || twoAheadHasDate) && !isBullet && line.length < 150) ||
      (hasCompanyWord && (hasDate || nextHasDate || twoAheadHasDate) && !isBullet && line.length < 150);

    if (isNewJobEntry) {
      // Save previous job
      if (currentJob) {
        currentJob.bullets = enhanceBulletPoints(bullets);
        if (currentJob.title || currentJob.company) {
          experience.push(currentJob);
        }
        bullets = [];
      }

      let title = "";
      let company = "";
      let location = "";
      let duration = extractDateFromLine(line);

      // Remove date from line for parsing
      let lineWithoutDate = line;
      if (duration) {
        lineWithoutDate = line.replace(duration, "").trim();
        // Also clean surrounding parens/brackets
        lineWithoutDate = lineWithoutDate.replace(/^\(|\)$/g, "").replace(/\(\s*\)/, "").trim();
      }

      // Clean trailing/leading separators
      lineWithoutDate = lineWithoutDate.replace(/^[\s•|,\-–]+|[\s•|,\-–]+$/g, "").trim();

      // Handle "with Company as Title" format (common in Naukri resumes)
      // e.g. "with Khazana Jewellery as Business Head-Jewellery"
      const withAsMatch = lineWithoutDate.match(/^(?:with\s+)(.+?)\s+as\s+(.+)$/i);
      if (withAsMatch) {
        company = withAsMatch[1].trim();
        title = withAsMatch[2].trim();
      }

      // Handle "Title, Company" or "Title - Company" if not already parsed
      if (!title && !company) {
        // Split by common delimiters: |, •, " at ", " - " (but not inside words like "Full-Stack")
        const parts = lineWithoutDate
          .split(/\s*[•|]\s*|\s+at\s+|\s+@\s+/)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        if (parts.length >= 2) {
          // Determine which part is title vs company
          if (looksLikeJobTitle(parts[0]) && !looksLikeJobTitle(parts[1])) {
            title = parts[0];
            company = parts[1];
            if (parts[2]) location = parts[2];
          } else if (looksLikeCompany(parts[0])) {
            company = parts[0];
            title = parts[1];
            if (parts[2]) location = parts[2];
          } else if (looksLikeJobTitle(parts[1])) {
            company = parts[0];
            title = parts[1];
            if (parts[2]) location = parts[2];
          } else {
            // Guess: first part is title (shorter often = title)
            title = parts[0];
            company = parts[1];
          }
        } else if (parts.length === 1) {
        const singlePart = parts[0];
        // Check next line for the missing piece (title or company)
        if (looksLikeJobTitle(singlePart)) {
          title = singlePart;
        } else if (looksLikeCompany(singlePart)) {
          company = singlePart;
        } else {
          title = singlePart;
        }

        // Look at subsequent non-bullet, non-date line for company/title
        if (i + 1 < expEndIndex) {
          const peek = lines[i + 1];
          const peekHasDate = lineHasDate(peek);
          const peekIsBullet = isBulletLine(peek);
          if (!peekIsBullet && peek.length < 150) {
            let peekDuration = extractDateFromLine(peek);
            let peekText = peek;
            if (peekDuration) {
              if (!duration) duration = peekDuration;
              peekText = peek.replace(peekDuration, "").replace(/^\(|\)$/g, "").trim();
              peekText = peekText.replace(/^[\s•|,\-–]+|[\s•|,\-–]+$/g, "").trim();
            }
            if (peekText.length > 0 && peekText.length < 120) {
              // Split peek line by separators too
              const peekParts = peekText.split(/\s*[•|]\s*/).map(p => p.trim()).filter(p => p.length > 0);
              if (!company && !title) {
                title = peekParts[0] || "";
                company = peekParts[1] || "";
              } else if (!company) {
                company = peekParts[0] || "";
                if (peekParts[1] && !location) location = peekParts[1];
              } else if (!title) {
                title = peekParts[0] || "";
              }
              // Skip this peeked line
              if (!peekHasDate || peekDuration) i++;
            }
          }
        }
      }
      } // close if (!title && !company)

      // Title-only line (no date on this line), look ahead for company + date
      if (!title && !company && !duration && !hasDate && hasJobTitle) {
        title = line.trim();
        if (i + 1 < expEndIndex) {
          const peek = lines[i + 1];
          duration = extractDateFromLine(peek);
          let peekText = peek;
          if (duration) peekText = peek.replace(duration, "").trim();
          peekText = peekText.replace(/^[\s•|,\-–]+|[\s•|,\-–]+$/g, "").trim();
          if (peekText) company = peekText.split(/\s*[•|]\s*/)[0].trim();
          i++;
        }
      }

      // Clean final values
      title = title.replace(/[•|].*$/, "").replace(/,$/, "").trim();
      company = company.replace(/[•|].*$/, "").replace(/,$/, "").trim();
      // Don't strip company suffixes - keep them for accuracy
      location = location.replace(/[•|].*$/, "").replace(/,$/, "").trim();

      // Swap if title looks like a company and company looks like a title
      if (looksLikeCompany(title) && looksLikeJobTitle(company)) {
        [title, company] = [company, title];
      }

      // Duration normalization
      duration = duration.replace(/[-–—]+/g, " - ").trim();

      currentJob = { title, company, duration, location, bullets: [] };
    } else if (isDateOnlyLine && currentJob && !currentJob.duration) {
      // Date-only line: attach to current job if it doesn't have a date yet
      currentJob.duration = (dateStr || "").replace(/[-–—]+/g, " - ").trim();
    } else if (currentJob) {
      // Collect bullet points
      if (isBullet) {
        const cleaned = cleanBullet(line);
        if (cleaned.length >= 10 && cleaned.length < 500) {
          bullets.push(cleaned);
        }
      } else if (line.length >= 15 && line.length < 300) {
        // Non-bullet descriptive line (some resumes don't use bullet markers)
        const isNotEmail = !line.includes("@");
        const isNotPhone = !/^\+?\d[\d\s\-()]{8,}$/.test(line);
        const isNotUrl = !/^https?:\/\//i.test(line);
        if (isNotEmail && isNotPhone && isNotUrl) {
          // Check if this might be a company name for the current job
          if (!currentJob.company && (looksLikeCompany(line) || line.length < 60) && line.length < 80 && !hasDate && bullets.length === 0) {
            currentJob.company = line.split(/\s*[•|]\s*/)[0].trim();
          } else if (!currentJob.title && looksLikeJobTitle(line) && line.length < 80 && bullets.length === 0) {
            currentJob.title = line.split(/\s*[•|]\s*/)[0].trim();
          } else if (line.length >= 20) {
            // Treat as a descriptive bullet
            bullets.push(line.trim());
          }
        }
      } else if (line.length < 15 && line.length >= 3 && !currentJob.company && bullets.length === 0) {
        // Very short non-bullet line right after job start - likely company or location
        if (!line.includes("@") && !/^\+?\d/.test(line)) {
          currentJob.company = line.trim();
        }
      }
    }
  }

  // Don't forget the last job
  if (currentJob) {
    currentJob.bullets = enhanceBulletPoints(bullets);
    if (currentJob.title || currentJob.company) {
      experience.push(currentJob);
    }
  }

  // Deduplicate and clean
  const uniqueExperience = [];
  const seen = new Set();
  for (const exp of experience) {
    const key = `${(exp.title || "").toLowerCase()}-${(exp.company || "").toLowerCase()}`;
    if (!seen.has(key) && (exp.title || exp.company)) {
      seen.add(key);
      uniqueExperience.push(exp);
    }
  }

  console.log(`[CV Generation] Extracted ${uniqueExperience.length} experience entries (detailed parser)`);
  return uniqueExperience.slice(0, 8); // Max 8 positions
}

/**
 * Generate professional summary based on profile
 */
function generateProfessionalSummary(data) {
  const { targetRole, skills, experienceLevel, years, selfDescription, parsedExperience } = data;
  const levelCapitalized = experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1);
  const topSkills = skills.slice(0, 3);

  // Extract any metrics from experience
  const allBullets = parsedExperience?.flatMap(e => e.bullets || []).join(" ") || "";
  const hasMetrics = /\d+%|\$\d|increased|improved|reduced|grew/i.test(allBullets);

  // Use selfDescription as the base when available - it's the user's own words
  if (selfDescription && selfDescription.length > 50) {
    let summary = selfDescription.trim();
    // Append role/skills context if not already present
    const mentionsRole = targetRole && summary.toLowerCase().includes(targetRole.toLowerCase());
    if (!mentionsRole && targetRole) {
      summary += ` Targeting ${targetRole} roles${years ? ` with ${years}+ years of experience` : ""}.`;
    }
    return summary.slice(0, 500);
  }

  if (!targetRole || !topSkills.length) {
    return "Dedicated professional committed to delivering results and continuous improvement.";
  }

  // Generate summary from data
  let summary = `${levelCapitalized}-level ${targetRole}`;
  if (years) {
    summary += ` with ${years}+ years of experience`;
  }
  summary += ` in ${topSkills.slice(0, 2).join(" and ")}. `;

  if (hasMetrics) {
    summary += "Proven track record of delivering measurable results. ";
  }

  summary += `Skilled in ${topSkills.join(", ")}.`;

  return summary;
}

/**
 * Generate professional CV without AI (intelligent fallback)
 */
function generateBasicCV(data) {
  const {
    name, email, phone, location, linkedin, targetRole,
    skills, softSkills, experienceLevel, years,
    parsedExperience, parsedEducation, certifications, selfDescription
  } = data;

  // Generate professional summary
  const summary = generateProfessionalSummary(data);

  // Enhance experience bullets
  const enhancedExperience = (parsedExperience || []).map(job => ({
    ...job,
    bullets: enhanceBulletPoints(job.bullets || [])
  }));

  // Calculate ATS score
  const atsScore = calculateBasicATSScore(data);

  // Generate role-specific keywords
  const roleKeywords = {
    "Software Engineer": ["software development", "programming", "agile", "code review"],
    "Frontend Developer": ["responsive design", "UI/UX", "web performance", "accessibility"],
    "Backend Developer": ["API development", "database design", "scalability", "microservices"],
    "Data Scientist": ["data modeling", "statistical analysis", "machine learning", "visualization"],
    "Product Manager": ["product strategy", "roadmap", "stakeholder management", "user research"],
    "DevOps Engineer": ["CI/CD", "infrastructure", "automation", "monitoring"],
    "Project Manager": ["project delivery", "risk management", "resource planning", "agile/scrum"]
  };

  const additionalKeywords = roleKeywords[targetRole] || ["professional", "results-driven", "collaborative"];
  const atsKeywords = [...skills.slice(0, 6), ...additionalKeywords.slice(0, 2)].filter(Boolean);

  // Generate specific improvements based on data
  const improvements = [];
  if (enhancedExperience.length === 0) {
    improvements.push("Add your work experience with specific achievements and responsibilities");
  } else if (enhancedExperience.every(e => !e.bullets?.length)) {
    improvements.push("Add bullet points describing your key achievements at each position");
  }
  if (skills.length < 5) {
    improvements.push("Include more relevant technical skills for your target role");
  }
  if (!parsedEducation?.length) {
    improvements.push("Add your educational background");
  }
  if (improvements.length === 0) {
    improvements.push("Consider adding certifications relevant to " + (targetRole || "your field"));
    improvements.push("Quantify more achievements with specific numbers and percentages");
  }

  // VALIDATION: Only add default soft skills if there's actual resume content
  // This prevents "hallucinating" skills for empty or very short uploads
  const hasActualContent = (skills.length > 0 || parsedExperience?.length > 0);

  let cvSoftSkills = softSkills || [];
  if (cvSoftSkills.length === 0 && hasActualContent) {
    // Only add default soft skills if we have actual resume content
    cvSoftSkills = ["Communication", "Problem Solving", "Teamwork"];
  }

  return {
    fullName: name,
    title: targetRole || "Professional",
    email,
    phone,
    location,
    linkedin,
    summary,
    experience: enhancedExperience,
    hasExperienceData: enhancedExperience.length > 0,
    skills: {
      technical: skills,
      soft: cvSoftSkills
    },
    education: parsedEducation || [],
    certifications: certifications || [],
    atsScore,
    atsKeywords,
    improvements,
    aiPowered: false,
    generationMethod: "intelligent-rule-based",
    dataSource: {
      note: "CV generated using intelligent analysis of your profile data.",
      aiEnhanced: false
    }
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
