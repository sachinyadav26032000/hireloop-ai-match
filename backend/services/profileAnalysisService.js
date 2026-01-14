/**
 * Profile Analysis Service
 * Analyzes user input to infer job roles, skills, experience level, and gaps
 * Provides realistic ATS scoring breakdown and recruiter-grade feedback
 */
import { callAI, parseAIResponse } from "./aiAdapter.js";

const SYSTEM_PROMPT = `You are a senior recruiter and career coach with 15+ years of experience in talent acquisition.
Analyze the candidate's background thoroughly and provide honest, actionable insights.
Be conservative with scores - most resumes score 50-70, only exceptional ones score 80+.

Return ONLY valid JSON in this exact format:
{
  "suggestedRoles": ["role1", "role2", "role3"],
  "experienceLevel": "entry|junior|mid|senior|lead",
  "yearsOfExperience": 0,
  "coreSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "industryFit": ["industry1", "industry2"],
  "weakAreas": ["specific actionable feedback 1", "specific actionable feedback 2"],
  "marketGaps": ["market insight 1", "market insight 2"],
  "summary": "Brief professional summary",
  "atsScoreBreakdown": {
    "overall": 65,
    "keywordRelevance": 60,
    "impactMetrics": 55,
    "roleAlignment": 70,
    "formattingClarity": 75
  }
}`;

// Role-specific skill mappings for realistic extraction
const ROLE_SKILL_MAP = {
  // Engineering
  "Software Engineer": ["JavaScript", "Python", "Java", "Git", "REST APIs", "SQL", "Problem Solving"],
  "Frontend Developer": ["React", "JavaScript", "TypeScript", "CSS", "HTML", "Responsive Design", "Git"],
  "Backend Developer": ["Node.js", "Python", "Java", "SQL", "REST APIs", "Microservices", "Docker"],
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "MongoDB", "Git", "AWS"],
  "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Jenkins"],
  "Data Engineer": ["Python", "SQL", "Spark", "ETL", "Airflow", "AWS", "Data Modeling"],
  "Mobile Developer": ["React Native", "Swift", "Kotlin", "Flutter", "REST APIs", "Git"],

  // Data & Analytics
  "Data Analyst": ["SQL", "Excel", "Python", "Tableau", "Power BI", "Statistics", "Data Visualization"],
  "Data Scientist": ["Python", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Data Analysis"],
  "Business Intelligence Analyst": ["SQL", "Tableau", "Power BI", "Excel", "Data Modeling", "Reporting"],

  // Product & Design
  "Product Manager": ["Roadmapping", "Agile", "User Research", "Analytics", "Stakeholder Management", "PRDs"],
  "UX Designer": ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Usability Testing"],
  "Product Designer": ["Figma", "User Research", "UI Design", "Prototyping", "Design Thinking"],

  // Business & Operations
  "Marketing Manager": ["Digital Marketing", "SEO", "Analytics", "Content Strategy", "Campaign Management"],
  "Sales Executive": ["Lead Generation", "CRM", "Negotiation", "B2B Sales", "Pipeline Management"],
  "Business Development": ["Lead Generation", "Partnerships", "Negotiation", "Market Research", "CRM"],
  "Customer Success Manager": ["Account Management", "Customer Retention", "Onboarding", "CRM", "Communication"],
  "HR Manager": ["Recruitment", "Employee Relations", "HRIS", "Performance Management", "Compliance"],
  "Operations Manager": ["Process Improvement", "Vendor Management", "Budgeting", "Team Leadership", "KPIs"],
  "Financial Analyst": ["Financial Modeling", "Excel", "Forecasting", "Reporting", "Budgeting", "SQL"],
};

// Keywords that indicate experience level
const EXPERIENCE_KEYWORDS = {
  senior: ["senior", "lead", "principal", "staff", "director", "head of", "vp", "architect", "10+ years", "8+ years"],
  mid: ["mid-level", "experienced", "5 years", "4 years", "3-5 years", "established"],
  junior: ["junior", "associate", "1-2 years", "2 years", "early career"],
  entry: ["entry", "fresher", "graduate", "intern", "student", "recent grad", "0-1 years"],
};

// Extract skills from resume text
function extractSkillsFromResume(resumeText, desiredRole) {
  if (!resumeText) return [];

  const text = resumeText.toLowerCase();
  const extractedSkills = [];

  // Get relevant skills for the desired role
  const roleSkills = ROLE_SKILL_MAP[desiredRole] || [];

  // Common skill patterns to look for
  const allSkills = [
    ...roleSkills,
    "JavaScript", "Python", "Java", "SQL", "React", "Node.js", "AWS", "Docker",
    "Kubernetes", "Git", "Agile", "Scrum", "Jira", "Excel", "Tableau", "Power BI",
    "Figma", "Photoshop", "Salesforce", "HubSpot", "Google Analytics", "SEO",
    "Machine Learning", "Data Analysis", "Project Management", "Leadership",
    "Communication", "Problem Solving", "Teamwork", "TypeScript", "MongoDB",
    "PostgreSQL", "Redis", "GraphQL", "REST API", "CI/CD", "Linux", "Azure",
    "GCP", "Terraform", "Jenkins", "Spark", "Hadoop", "Kafka", "ETL"
  ];

  // Check for each skill in the resume
  allSkills.forEach(skill => {
    if (text.includes(skill.toLowerCase()) && !extractedSkills.includes(skill)) {
      extractedSkills.push(skill);
    }
  });

  return extractedSkills.slice(0, 10); // Return max 10 skills
}

// Calculate realistic ATS score breakdown
function calculateATSScore(input, extractedSkills) {
  const { resumeText, desiredRole, selfDescription } = input;
  const combinedText = `${resumeText || ""} ${selfDescription || ""}`.toLowerCase();

  let keywordRelevance = 45; // Base score
  let impactMetrics = 40;
  let roleAlignment = 50;
  let formattingClarity = 60;

  // Keyword Relevance - based on skill matches
  const roleSkills = ROLE_SKILL_MAP[desiredRole] || [];
  const matchedRoleSkills = roleSkills.filter(skill =>
    combinedText.includes(skill.toLowerCase())
  );
  keywordRelevance = Math.min(85, 45 + (matchedRoleSkills.length * 5));

  // Impact Metrics - look for numbers, percentages, achievements
  const hasNumbers = /\d+%|\$\d+|\d+x|increased|decreased|improved|reduced|grew|saved/gi.test(combinedText);
  const hasMetrics = /revenue|growth|efficiency|conversion|retention|roi|kpi/gi.test(combinedText);
  if (hasNumbers) impactMetrics += 20;
  if (hasMetrics) impactMetrics += 15;
  impactMetrics = Math.min(80, impactMetrics);

  // Role Alignment - title matches and experience mentions
  if (desiredRole && combinedText.includes(desiredRole.toLowerCase())) {
    roleAlignment += 25;
  }
  if (combinedText.includes("team") || combinedText.includes("cross-functional")) {
    roleAlignment += 10;
  }
  roleAlignment = Math.min(85, roleAlignment);

  // Formatting Clarity - resume length and structure
  if (resumeText) {
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount > 200) formattingClarity += 10;
    if (wordCount > 400) formattingClarity += 10;
    if (resumeText.includes("•") || resumeText.includes("-")) formattingClarity += 5;
  }
  formattingClarity = Math.min(80, formattingClarity);

  const overall = Math.round((keywordRelevance + impactMetrics + roleAlignment + formattingClarity) / 4);

  return {
    overall,
    keywordRelevance,
    impactMetrics,
    roleAlignment,
    formattingClarity
  };
}

// Generate recruiter-grade weak areas feedback
function generateWeakAreas(input, atsScore, extractedSkills) {
  const weakAreas = [];
  const { resumeText, desiredRole } = input;

  // Based on ATS scores
  if (atsScore.impactMetrics < 60) {
    weakAreas.push("Your resume lacks quantifiable achievements. Add specific metrics (e.g., 'Increased sales by 25%' or 'Reduced load time by 40%')");
  }

  if (atsScore.keywordRelevance < 60) {
    const roleSkills = ROLE_SKILL_MAP[desiredRole] || [];
    const missingSkills = roleSkills.filter(s => !extractedSkills.includes(s)).slice(0, 3);
    if (missingSkills.length > 0) {
      weakAreas.push(`Missing key keywords for ${desiredRole}: ${missingSkills.join(", ")}. Add these if you have the experience`);
    }
  }

  if (atsScore.roleAlignment < 65) {
    weakAreas.push(`Your profile doesn't clearly align with ${desiredRole || "the target role"}. Tailor your summary and experience bullets to match the role`);
  }

  if (!resumeText || resumeText.length < 500) {
    weakAreas.push("Your resume content appears thin. Expand on your responsibilities and achievements for each role");
  }

  // Add generic but useful feedback
  if (weakAreas.length < 2) {
    weakAreas.push("Consider adding a skills section that mirrors job posting keywords");
    weakAreas.push("Ensure each role has 3-5 bullet points starting with action verbs");
  }

  return weakAreas.slice(0, 4);
}

// Generate market-aware recommendations
function generateMarketGaps(desiredRole, experienceLevel) {
  const gapsByRole = {
    "Software Engineer": ["Cloud certifications (AWS/GCP) are increasingly required", "GenAI/LLM experience is a major differentiator in 2024"],
    "Frontend Developer": ["TypeScript is now expected by most companies", "Testing (Jest, Cypress) experience is often missing but valued"],
    "Backend Developer": ["Containerization (Docker/K8s) is table stakes now", "System design knowledge important for mid+ roles"],
    "Data Analyst": ["Python/R skills differentiate analysts from Excel-only candidates", "Cloud data platforms (Snowflake, BigQuery) are in demand"],
    "Product Manager": ["Technical understanding increasingly valued", "Analytics tools (Amplitude, Mixpanel) experience helps"],
    "Marketing Manager": ["Performance marketing skills (paid ads) highly valued", "Marketing automation tools experience expected"],
    "UX Designer": ["Figma proficiency is now essential", "Research and data-driven design skills differentiate candidates"],
  };

  const defaultGaps = [
    "Industry-specific certifications boost credibility",
    "Building a portfolio or case studies helps demonstrate impact",
    "Networking on LinkedIn can surface unadvertised opportunities"
  ];

  return gapsByRole[desiredRole] || defaultGaps;
}

function generateMockAnalysis(input) {
  const { selfDescription, resumeText, desiredRole, totalExperience } = input;
  const combinedText = `${selfDescription || ""} ${resumeText || ""}`.toLowerCase();

  // Extract skills from resume
  const extractedSkills = extractSkillsFromResume(resumeText, desiredRole);

  // Determine experience level from provided total experience or keywords
  let experienceLevel = "junior";
  let yearsOfExperience = 1;

  if (totalExperience) {
    const years = parseInt(totalExperience) || 0;
    yearsOfExperience = years;
    if (years >= 8) experienceLevel = "senior";
    else if (years >= 4) experienceLevel = "mid";
    else if (years >= 2) experienceLevel = "junior";
    else experienceLevel = "entry";
  } else {
    // Fallback to keyword detection
    for (const [level, keywords] of Object.entries(EXPERIENCE_KEYWORDS)) {
      if (keywords.some(kw => combinedText.includes(kw))) {
        experienceLevel = level;
        break;
      }
    }

    // Estimate years based on level
    const yearsByLevel = { entry: 0, junior: 2, mid: 4, senior: 8, lead: 10 };
    yearsOfExperience = yearsByLevel[experienceLevel] || 1;
  }

  // Generate suggested roles based on desired role or content analysis
  let suggestedRoles = [];
  if (desiredRole && ROLE_SKILL_MAP[desiredRole]) {
    suggestedRoles = [desiredRole];
    // Add related roles
    const roleFamily = {
      "Software Engineer": ["Full Stack Developer", "Backend Developer"],
      "Frontend Developer": ["Full Stack Developer", "UX Engineer"],
      "Backend Developer": ["Software Engineer", "DevOps Engineer"],
      "Data Analyst": ["Business Intelligence Analyst", "Data Scientist"],
      "Product Manager": ["Technical Product Manager", "Product Owner"],
      "Marketing Manager": ["Growth Manager", "Digital Marketing Specialist"],
      "UX Designer": ["Product Designer", "UI/UX Designer"],
    };
    suggestedRoles.push(...(roleFamily[desiredRole] || ["Related Role 1", "Related Role 2"]));
  } else {
    suggestedRoles = ["Software Engineer", "Product Manager", "Business Analyst"];
  }

  // Use extracted skills or role-specific defaults
  const coreSkills = extractedSkills.length > 0
    ? extractedSkills
    : (ROLE_SKILL_MAP[desiredRole] || ["Communication", "Problem Solving", "Teamwork", "Adaptability"]).slice(0, 6);

  // Calculate ATS score
  const atsScoreBreakdown = calculateATSScore(input, coreSkills);

  // Generate recruiter-grade feedback
  const weakAreas = generateWeakAreas(input, atsScoreBreakdown, coreSkills);
  const marketGaps = generateMarketGaps(desiredRole, experienceLevel);

  return {
    suggestedRoles: suggestedRoles.slice(0, 3),
    experienceLevel,
    yearsOfExperience,
    coreSkills,
    softSkills: ["Communication", "Problem Solving", "Collaboration", "Adaptability"],
    industryFit: ["Technology", "Startups", "Enterprise Software", "Consulting"],
    weakAreas,
    marketGaps,
    summary: `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}-level professional with ${yearsOfExperience}+ years of experience. Strong fit for ${suggestedRoles[0]} roles with demonstrated expertise in ${coreSkills.slice(0, 2).join(" and ")}.`,
    atsScoreBreakdown
  };
}

export async function analyzeProfile(input) {
  const { selfDescription, resumeText, linkedinText, desiredRole, locations, totalExperience, fullName } = input;

  const userPrompt = `
Analyze this candidate's background as a senior recruiter would:

Self-Description: ${selfDescription || "Not provided"}

Resume Content: ${resumeText || "Not provided"}

LinkedIn Profile: ${linkedinText || "Not provided"}

Desired Role: ${desiredRole || "Open to suggestions"}

Total Experience: ${totalExperience || "Not specified"}

Preferred Locations: ${locations?.join(", ") || "Flexible"}

Provide honest, actionable career analysis. Be conservative with ATS scores - only exceptional profiles score above 75.
Focus on specific, actionable improvements rather than generic advice.
Return as JSON.`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt);
  const mockData = generateMockAnalysis(input);

  return parseAIResponse(response, mockData);
}
