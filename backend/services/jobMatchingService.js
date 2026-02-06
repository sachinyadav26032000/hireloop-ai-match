/**
 * Job Matching Service - AI-ENHANCED
 *
 * Matches user profile to jobs from external APIs with AI-powered analysis:
 * - Real job listings from Adzuna and Jooble APIs
 * - AI-powered fit analysis for each job
 * - Intelligent skills gap identification
 * - Personalized application recommendations
 *
 * When APIs unavailable, provides smart job board links with AI-optimized search queries.
 */
import { searchJobs, isJobApiConfigured, getApiStatus } from "./jobApiAdapter.js";
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";

/**
 * System prompt for AI job fit analysis
 */
const JOB_FIT_ANALYZER_PROMPT = `You are a career advisor who excels at matching candidates to job opportunities.

Analyze how well this candidate fits the job and provide actionable insights.

ANALYSIS CRITERIA:
1. Skills Match - How many required skills does the candidate have?
2. Experience Alignment - Does their experience level match the role?
3. Role Relevance - Is this in their target career direction?
4. Growth Potential - Could this role help their career?

Provide honest, specific feedback - not generic statements.

Return ONLY valid JSON:
{
  "matchScore": 0-100,
  "fitReasons": ["Specific reason 1", "Specific reason 2", "Specific reason 3"],
  "skillsMatched": ["Matched skill 1", "Matched skill 2"],
  "skillsGap": ["Missing skill 1", "Missing skill 2"],
  "recommendation": "Apply now / Worth considering / May not be ideal fit",
  "applicationTip": "Specific advice for applying to this role",
  "salaryFit": "good / moderate / unknown",
  "growthPotential": "High / Medium / Low with explanation"
}`;

/**
 * Calculate match score using rule-based logic (fallback)
 */
function calculateMatchScoreRuleBased(job, profileAnalysis, userSkills) {
  const breakdown = {
    skillMatch: 0,
    experienceMatch: 0,
    roleAlignment: 0,
    totalScore: 0,
    explanation: [],
  };

  const userSkillsLower = (userSkills || []).map(s => s.toLowerCase());
  const jobText = `${job.title} ${job.description}`.toLowerCase();

  // 1. SKILL MATCH (0-40 points)
  let matchedSkills = [];
  for (const skill of userSkillsLower) {
    if (jobText.includes(skill) || skill.split(" ").some(word => word.length > 3 && jobText.includes(word))) {
      matchedSkills.push(skill);
    }
  }

  if (matchedSkills.length >= 5) {
    breakdown.skillMatch = 40;
    breakdown.explanation.push(`Strong skill match: ${matchedSkills.length} of your skills mentioned`);
  } else if (matchedSkills.length >= 3) {
    breakdown.skillMatch = 30;
    breakdown.explanation.push(`Good skill match: ${matchedSkills.length} relevant skills`);
  } else if (matchedSkills.length >= 1) {
    breakdown.skillMatch = 20;
    breakdown.explanation.push(`Partial skill match: ${matchedSkills.length} matching skill(s)`);
  } else {
    breakdown.skillMatch = 10;
    breakdown.explanation.push("Limited skill overlap - may need upskilling");
  }

  // 2. EXPERIENCE MATCH (0-30 points)
  const userExp = profileAnalysis?.yearsOfExperience || 0;
  const jobExpMatch = job.experience_required?.match(/(\d+)/);
  const requiredExp = jobExpMatch ? parseInt(jobExpMatch[1]) : 0;

  if (userExp >= requiredExp && userExp <= requiredExp + 3) {
    breakdown.experienceMatch = 30;
    breakdown.explanation.push(`Experience match: Your ${userExp} years meets requirements`);
  } else if (userExp >= requiredExp - 1) {
    breakdown.experienceMatch = 20;
    breakdown.explanation.push(`Close experience match: ${userExp} years`);
  } else if (userExp < requiredExp) {
    breakdown.experienceMatch = 10;
    breakdown.explanation.push(`Below required experience level`);
  } else {
    breakdown.experienceMatch = 15;
    breakdown.explanation.push(`May be overqualified for this role`);
  }

  // 3. ROLE ALIGNMENT (0-30 points)
  const suggestedRoles = (profileAnalysis?.suggestedRoles || []).map(r => r.toLowerCase());
  const jobTitleLower = job.title.toLowerCase();

  let roleAligned = suggestedRoles.some(role =>
    role.split(" ").filter(w => w.length > 3).some(word => jobTitleLower.includes(word))
  );

  if (roleAligned) {
    breakdown.roleAlignment = 30;
    breakdown.explanation.push("Role matches your career direction");
  } else {
    breakdown.roleAlignment = 15;
    breakdown.explanation.push("Role differs from your target path");
  }

  breakdown.totalScore = Math.min(100, Math.max(40,
    breakdown.skillMatch + breakdown.experienceMatch + breakdown.roleAlignment
  ));

  return {
    score: breakdown.totalScore,
    breakdown,
    matchedSkills: [...new Set(matchedSkills)].slice(0, 5),
  };
}

/**
 * Analyze job fit using AI
 */
async function analyzeJobFitWithAI(job, profileAnalysis, userSkills) {
  if (!isAIAvailable()) {
    return null;
  }

  const prompt = `
CANDIDATE PROFILE:
- Target Role: ${profileAnalysis?.suggestedRoles?.[0] || "Not specified"}
- Experience: ${profileAnalysis?.yearsOfExperience || 0} years (${profileAnalysis?.experienceLevel || "mid"} level)
- Skills: ${userSkills?.join(", ") || "Not specified"}

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Description: ${job.description?.slice(0, 500) || "No description"}
- Experience Required: ${job.experience_required || "Not specified"}
- Salary: ${job.salary_min ? `${job.salary_min} - ${job.salary_max}` : "Not disclosed"}

Analyze how well this candidate fits this job. Be specific and honest.`;

  const response = await callAI(JOB_FIT_ANALYZER_PROMPT, prompt, {
    model: "fast", // Use GPT-4o-mini for speed (many jobs to analyze)
    maxTokens: 500,
    temperature: 0.3
  });

  return parseAIResponse(response, null);
}

/**
 * Generate fit reasons from match result
 */
function generateFitReasons(job, matchResult, profileAnalysis) {
  const reasons = [];

  for (const explanation of matchResult.breakdown.explanation) {
    if (!explanation.includes("Limited") && !explanation.includes("Below") && !explanation.includes("differs")) {
      reasons.push(explanation);
    }
  }

  if (matchResult.score >= 70 && job.company) {
    reasons.push(`Opportunity at ${job.company}`);
  }

  if (reasons.length === 0) {
    reasons.push("This role could help you develop new skills");
  }

  return reasons.slice(0, 3);
}

/**
 * Analyze skills gap for a job
 */
function analyzeSkillsGap(job, userSkills) {
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const userSkillsLower = new Set((userSkills || []).map(s => s.toLowerCase()));

  const technicalKeywords = [
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "sql", "aws", "azure", "gcp", "docker", "kubernetes", "git",
    "agile", "scrum", "jira", "figma", "tableau", "power bi", "excel",
    "machine learning", "ai", "data analysis", "product management"
  ];

  const missingSkills = [];
  for (const keyword of technicalKeywords) {
    if (jobText.includes(keyword) && !userSkillsLower.has(keyword)) {
      let hasRelated = false;
      for (const skill of userSkillsLower) {
        if (skill.includes(keyword) || keyword.includes(skill)) {
          hasRelated = true;
          break;
        }
      }
      if (!hasRelated) {
        missingSkills.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  }

  return missingSkills.slice(0, 4);
}

/**
 * Generate smart job board recommendations
 */
function generateJobBoardRecommendations(profileAnalysis, filters) {
  const role = filters?.desiredRole || profileAnalysis?.suggestedRoles?.[0] || "Software Developer";
  const location = filters?.location || "Remote";
  const skills = profileAnalysis?.coreSkills?.slice(0, 3) || [];
  const level = profileAnalysis?.experienceLevel || "mid";

  const searchTerms = [role, ...skills.slice(0, 2)].filter(Boolean).join(" ");
  const encodedRole = encodeURIComponent(role);
  const encodedLocation = encodeURIComponent(location);
  const encodedSearch = encodeURIComponent(searchTerms);

  const levelKeywords = {
    entry: "entry level junior",
    junior: "junior associate",
    mid: "",
    senior: "senior lead",
    lead: "lead principal staff"
  };
  const levelQuery = levelKeywords[level] || "";

  const jobBoards = [
    {
      id: "linkedin",
      name: "LinkedIn Jobs",
      description: `Top professional network with ${role} opportunities`,
      url: `https://www.linkedin.com/jobs/search/?keywords=${encodedSearch}&location=${encodedLocation}`,
      priority: 1,
      whyRecommended: "Most recruiters start here. Your profile is your brand."
    },
    {
      id: "indeed",
      name: "Indeed",
      description: `Largest job aggregator with thousands of ${role} listings`,
      url: `https://www.indeed.com/jobs?q=${encodedSearch}&l=${encodedLocation}`,
      priority: 2,
      whyRecommended: "Aggregates from company sites. Good for volume."
    },
    {
      id: "glassdoor",
      name: "Glassdoor",
      description: `Find ${role} jobs with salary data and reviews`,
      url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedSearch}`,
      priority: 3,
      whyRecommended: "See salary ranges before applying."
    },
    {
      id: "naukri",
      name: "Naukri",
      description: `India's #1 job site for ${role} positions`,
      url: `https://www.naukri.com/${role.toLowerCase().replace(/\s+/g, '-')}-jobs`,
      priority: location.toLowerCase().includes("india") ? 1 : 4,
      whyRecommended: "Best for India-based opportunities."
    },
    {
      id: "google",
      name: "Google Jobs",
      description: "Search all job boards at once",
      url: `https://www.google.com/search?q=${encodedRole}+jobs+${encodedLocation}`,
      priority: 5,
      whyRecommended: "Aggregates from all sources."
    }
  ];

  // Add tech-specific boards
  const techRoles = ["software", "developer", "engineer", "devops", "data", "frontend", "backend", "full stack"];
  if (techRoles.some(t => role.toLowerCase().includes(t))) {
    jobBoards.push({
      id: "wellfound",
      name: "Wellfound (AngelList)",
      description: `Startup jobs with equity packages`,
      url: `https://wellfound.com/role/${role.toLowerCase().replace(/\s+/g, '-')}`,
      priority: 6,
      whyRecommended: "Best for startup opportunities."
    });
  }

  jobBoards.sort((a, b) => a.priority - b.priority);

  return {
    searchQuery: searchTerms,
    location,
    experienceLevel: level,
    boards: jobBoards.slice(0, 6),
    tips: [
      `Search: "${searchTerms}" for best results`,
      `Include "${levelQuery || level}" for experience-appropriate roles`,
      skills.length > 0 ? `Highlight: ${skills.join(", ")} in applications` : null,
      "Set up alerts on each platform"
    ].filter(Boolean)
  };
}

/**
 * Format salary for display
 */
function formatSalary(salary_min, salary_max, currency) {
  if (!salary_min && !salary_max) return null;

  const symbols = { INR: "₹", USD: "$", GBP: "£", EUR: "€", AUD: "A$", CAD: "C$" };
  const symbol = symbols[currency] || currency || "";

  const format = (num) => {
    if (!num) return null;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    return num.toLocaleString();
  };

  const min = format(salary_min);
  const max = format(salary_max);

  if (min && max) return `${symbol}${min} - ${symbol}${max}`;
  return min ? `${symbol}${min}+` : max ? `Up to ${symbol}${max}` : null;
}

/**
 * Main job matching function with AI enhancement
 * Now supports multiple desired roles - searches for ALL roles and combines results
 */
export async function matchJobs(input) {
  const { profileAnalysis, filters } = input;

  const userSkills = profileAnalysis?.coreSkills || [];
  const suggestedRoles = profileAnalysis?.suggestedRoles || [];

  // Support both single role and array of roles
  let desiredRoles = [];
  if (filters?.desiredRoles && Array.isArray(filters.desiredRoles)) {
    desiredRoles = filters.desiredRoles;
  } else if (filters?.desiredRole) {
    desiredRoles = [filters.desiredRole];
  } else if (suggestedRoles.length > 0) {
    desiredRoles = suggestedRoles.slice(0, 3); // Use top 3 suggested roles
  } else {
    desiredRoles = ["Software Developer"];
  }

  const location = filters?.location || "Bangalore";
  const experienceYears = filters?.experienceYears || profileAnalysis?.yearsOfExperience || 2;

  console.log(`[Job Matching] Searching for ${desiredRoles.length} roles:`, desiredRoles);

  // Check if job APIs are configured
  const apiStatus = getApiStatus();
  if (!apiStatus.anyConfigured) {
    // Generate job board recommendations for ALL roles
    const allJobBoards = [];
    for (const role of desiredRoles.slice(0, 5)) { // Limit to 5 roles
      const recommendations = generateJobBoardRecommendations(profileAnalysis, { ...filters, desiredRole: role });
      allJobBoards.push({
        role,
        boards: recommendations.boards,
        searchQuery: recommendations.searchQuery,
      });
    }

    return {
      matches: [],
      overallInsights: {
        strongestFitCategory: desiredRoles[0],
        searchedRoles: desiredRoles,
        topSkillsInDemand: userSkills.slice(0, 4),
        suggestedUpskilling: profileAnalysis?.marketGaps?.slice(0, 3) || [],
        jobsFound: 0,
        sourcesUsed: [],
      },
      liveJobsUnavailable: true,
      message: "Live job APIs not configured. Use the job boards below to search.",
      apiStatus,
      jobBoardRecommendations: {
        roles: desiredRoles,
        roleSpecificBoards: allJobBoards,
        note: "Search for each role using the links below."
      }
    };
  }

  // Search for jobs for EACH desired role and combine results
  const allJobs = [];
  const allSources = new Set();
  const allErrors = [];

  for (const role of desiredRoles.slice(0, 5)) { // Limit to 5 roles to avoid API abuse
    console.log(`[Job Matching] Searching jobs for: ${role}`);

    const searchResult = await searchJobs({
      role,
      location,
      experienceYears,
      skills: userSkills.slice(0, 5),
    });

    // Add jobs with role tag
    for (const job of searchResult.jobs) {
      job.matchedRole = role; // Tag which role this job matched
      allJobs.push(job);
    }

    searchResult.sources.forEach(s => allSources.add(s));
    allErrors.push(...searchResult.errors);
  }

  // Deduplicate jobs by ID (same job might appear for multiple roles)
  const uniqueJobs = [];
  const seenIds = new Set();
  for (const job of allJobs) {
    if (!seenIds.has(job.id)) {
      seenIds.add(job.id);
      uniqueJobs.push(job);
    }
  }

  console.log(`[Job Matching] Found ${uniqueJobs.length} unique jobs across ${desiredRoles.length} roles`);

  const searchResult = {
    jobs: uniqueJobs,
    sources: [...allSources],
    errors: allErrors,
  };

  if (searchResult.jobs.length === 0) {
    return {
      matches: [],
      overallInsights: null,
      error: searchResult.errors.length > 0
        ? `Search failed: ${searchResult.errors.map(e => e.error).join(", ")}`
        : "No jobs found. Try adjusting your search criteria.",
      apiStatus,
      sources: searchResult.sources,
    };
  }

  // Score and analyze jobs (with optional AI enhancement)
  const useAI = isAIAvailable();
  console.log(`[Job Matching] Analyzing ${searchResult.jobs.length} jobs (AI: ${useAI ? "enabled" : "disabled"})...`);

  const scoredJobs = [];
  for (const job of searchResult.jobs.slice(0, 15)) { // Limit to 15 for API cost management
    // Rule-based scoring (fast, always available)
    const ruleBasedMatch = calculateMatchScoreRuleBased(job, profileAnalysis, userSkills);
    const skillsGap = analyzeSkillsGap(job, userSkills);
    const fitReasons = generateFitReasons(job, ruleBasedMatch, profileAnalysis);

    // Optional AI enhancement for top candidates
    let aiAnalysis = null;
    if (useAI && ruleBasedMatch.score >= 60) {
      aiAnalysis = await analyzeJobFitWithAI(job, profileAnalysis, userSkills);
    }

    scoredJobs.push({
      job,
      matchScore: aiAnalysis?.matchScore || ruleBasedMatch.score,
      matchedSkills: aiAnalysis?.skillsMatched || ruleBasedMatch.matchedSkills,
      skillsGap: aiAnalysis?.skillsGap || skillsGap,
      fitReasons: aiAnalysis?.fitReasons || fitReasons,
      breakdown: ruleBasedMatch.breakdown,
      aiEnhanced: !!aiAnalysis,
      applicationTip: aiAnalysis?.applicationTip || null,
      growthPotential: aiAnalysis?.growthPotential || null,
    });
  }

  // Sort by match score
  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  // Format matches for response (increase limit to 20 for multi-role search)
  const matches = scoredJobs.slice(0, 20).map(item => ({
    jobId: item.job.id,
    job: {
      id: item.job.id,
      title: item.job.title,
      company: item.job.company,
      location: item.job.location,
      salary_display: formatSalary(item.job.salary_min, item.job.salary_max, item.job.currency),
      salary_min: item.job.salary_min,
      salary_max: item.job.salary_max,
      currency: item.job.currency,
      job_type: item.job.job_type,
      description: item.job.description,
      source: item.job.source,
      sourceOriginal: item.job.sourceOriginal,
      postedDate: item.job.postedDate,
      applyUrl: item.job.applyUrl,
      category: item.job.category,
      matchedRole: item.job.matchedRole, // Which desired role this job matched
    },
    matchScore: item.matchScore,
    fitReasons: item.fitReasons,
    skillsMatched: item.matchedSkills,
    skillsGap: item.skillsGap,
    salaryFit: item.job.salary_max >= 1500000 ? "good" : item.job.salary_max ? "moderate" : "unknown",
    recommendation: item.matchScore >= 75
      ? "Strong match - apply now"
      : item.matchScore >= 60
        ? "Good fit - worth applying"
        : "Consider if aligned with goals",
    aiEnhanced: item.aiEnhanced,
    applicationTip: item.applicationTip,
    growthPotential: item.growthPotential,
  }));

  // Generate insights
  const topSkillsInDemand = new Set();
  for (const match of matches.slice(0, 5)) {
    match.skillsGap.forEach(skill => topSkillsInDemand.add(skill));
  }

  // Count jobs per role
  const jobsPerRole = {};
  for (const match of matches) {
    const role = match.job.matchedRole || desiredRoles[0];
    jobsPerRole[role] = (jobsPerRole[role] || 0) + 1;
  }

  return {
    matches,
    overallInsights: {
      strongestFitCategory: desiredRoles[0],
      searchedRoles: desiredRoles,
      jobsPerRole,
      topSkillsInDemand: [...topSkillsInDemand].slice(0, 4),
      suggestedUpskilling: profileAnalysis?.marketGaps?.slice(0, 3) || [...topSkillsInDemand].slice(0, 3),
      jobsFound: searchResult.jobs.length,
      sourcesUsed: searchResult.sources,
      aiEnhanced: useAI,
    },
    apiStatus,
    sources: searchResult.sources,
  };
}

/**
 * Get available jobs - deprecated (use matchJobs)
 */
export function getMockJobs() {
  return [];
}

/**
 * Check if job matching is available
 */
export function isJobMatchingAvailable() {
  return isJobApiConfigured();
}
