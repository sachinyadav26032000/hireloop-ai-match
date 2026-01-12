/**
 * Job Matching Service
 * Matches user profile to relevant jobs and explains fit
 */
import { callAI, parseAIResponse } from "./aiAdapter.js";

const SYSTEM_PROMPT = `You are a job matching expert. Analyze the candidate profile and available jobs.
For each matched job, explain WHY it's a good fit.

Return ONLY valid JSON in this format:
{
  "matches": [
    {
      "jobId": "id",
      "matchScore": 85,
      "fitReasons": ["reason1", "reason2"],
      "skillsMatched": ["skill1", "skill2"],
      "skillsGap": ["missing skill"],
      "salaryFit": "good|stretch|below",
      "recommendation": "Strong match - apply now"
    }
  ],
  "overallInsights": {
    "strongestFitCategory": "category",
    "topSkillsInDemand": ["skill1", "skill2"],
    "suggestedUpskilling": ["skill1"]
  }
}`;

// Mock job database for localhost development
const MOCK_JOBS = [
  {
    id: "job-1",
    title: "Software Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    salary_min: 120000,
    salary_max: 160000,
    job_type: "full_time",
    description: "Build scalable web applications using modern technologies. Work with React, Node.js, and cloud services.",
    requirements: "JavaScript, React, Node.js, 3+ years experience",
    keywords: ["JavaScript", "React", "Node.js", "AWS", "Full Stack"],
  },
  {
    id: "job-2",
    title: "Frontend Developer",
    company: "DesignStudio",
    location: "Remote",
    salary_min: 90000,
    salary_max: 130000,
    job_type: "full_time",
    description: "Create beautiful, responsive user interfaces. Collaborate with designers to implement pixel-perfect designs.",
    requirements: "React, CSS, TypeScript, 2+ years experience",
    keywords: ["React", "TypeScript", "CSS", "UI/UX", "Frontend"],
  },
  {
    id: "job-3",
    title: "Product Manager",
    company: "StartupXYZ",
    location: "New York, NY",
    salary_min: 130000,
    salary_max: 180000,
    job_type: "full_time",
    description: "Lead product strategy and roadmap. Work with engineering and design teams to deliver user value.",
    requirements: "Product management, Agile, 4+ years experience",
    keywords: ["Product Management", "Agile", "Strategy", "Leadership", "Roadmap"],
  },
  {
    id: "job-4",
    title: "Data Analyst",
    company: "DataDriven Inc",
    location: "Chicago, IL",
    salary_min: 80000,
    salary_max: 110000,
    job_type: "full_time",
    description: "Analyze business data to drive insights. Create dashboards and reports for stakeholders.",
    requirements: "SQL, Python, Excel, Tableau, 2+ years experience",
    keywords: ["SQL", "Python", "Data Analysis", "Tableau", "Analytics"],
  },
  {
    id: "job-5",
    title: "UX Designer",
    company: "CreativeAgency",
    location: "Los Angeles, CA",
    salary_min: 95000,
    salary_max: 140000,
    job_type: "full_time",
    description: "Design user experiences for web and mobile applications. Conduct user research and usability testing.",
    requirements: "Figma, User Research, Prototyping, 3+ years experience",
    keywords: ["Figma", "UX", "User Research", "Prototyping", "Design"],
  },
  {
    id: "job-6",
    title: "Backend Developer",
    company: "CloudSystems",
    location: "Seattle, WA",
    salary_min: 130000,
    salary_max: 170000,
    job_type: "full_time",
    description: "Build robust backend services and APIs. Work with microservices architecture and cloud infrastructure.",
    requirements: "Python, Go, PostgreSQL, AWS, 4+ years experience",
    keywords: ["Python", "Go", "PostgreSQL", "AWS", "Backend", "APIs"],
  },
  {
    id: "job-7",
    title: "Marketing Manager",
    company: "GrowthCo",
    location: "Remote",
    salary_min: 85000,
    salary_max: 120000,
    job_type: "full_time",
    description: "Drive marketing strategy and campaigns. Manage digital marketing, content, and brand initiatives.",
    requirements: "Digital Marketing, Analytics, Content Strategy, 3+ years experience",
    keywords: ["Marketing", "Digital Marketing", "Analytics", "Content", "Strategy"],
  },
  {
    id: "job-8",
    title: "DevOps Engineer",
    company: "InfraTech",
    location: "Austin, TX",
    salary_min: 125000,
    salary_max: 165000,
    job_type: "full_time",
    description: "Manage CI/CD pipelines and cloud infrastructure. Ensure system reliability and performance.",
    requirements: "Kubernetes, Docker, AWS, Terraform, 3+ years experience",
    keywords: ["DevOps", "Kubernetes", "Docker", "AWS", "CI/CD", "Terraform"],
  },
];

function calculateMatchScore(jobKeywords, userSkills) {
  if (!jobKeywords?.length || !userSkills?.length) return 50;

  const jobKeywordsLower = jobKeywords.map((k) => k.toLowerCase());
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());

  let matches = 0;
  for (const skill of userSkillsLower) {
    if (jobKeywordsLower.some((k) => k.includes(skill) || skill.includes(k))) {
      matches++;
    }
  }

  const matchRatio = matches / jobKeywords.length;
  return Math.min(95, Math.round(50 + matchRatio * 45));
}

function generateFitReasons(job, profileAnalysis, matchScore) {
  const reasons = [];
  const skills = profileAnalysis?.coreSkills || [];

  if (matchScore >= 80) {
    reasons.push(`Strong skill alignment with ${job.title} requirements`);
  }

  const matchedSkills = job.keywords?.filter((k) =>
    skills.some((s) => s.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(s.toLowerCase()))
  );

  if (matchedSkills?.length >= 2) {
    reasons.push(`Your ${matchedSkills.slice(0, 2).join(" and ")} skills are in high demand for this role`);
  }

  if (profileAnalysis?.experienceLevel === "senior" && job.title.includes("Senior")) {
    reasons.push("Experience level matches senior-level expectations");
  }

  if (reasons.length === 0) {
    reasons.push("Good opportunity to grow into this role");
    reasons.push("Transferable skills from your background apply here");
  }

  return reasons;
}

function generateMockMatches(input) {
  const { profileAnalysis, userInfo, availableJobs } = input;
  const jobs = availableJobs?.length ? availableJobs : MOCK_JOBS;
  const userSkills = profileAnalysis?.coreSkills || [];
  const suggestedRoles = profileAnalysis?.suggestedRoles || [];

  // Score and sort jobs
  const scoredJobs = jobs.map((job) => {
    let score = calculateMatchScore(job.keywords, userSkills);

    // Boost score if job title matches suggested roles
    if (suggestedRoles.some((role) => job.title.toLowerCase().includes(role.toLowerCase().split(" ")[0]))) {
      score = Math.min(95, score + 10);
    }

    return { job, score };
  });

  scoredJobs.sort((a, b) => b.score - a.score);

  const matches = scoredJobs.slice(0, 5).map(({ job, score }) => {
    const skillsMatched =
      job.keywords?.filter((k) =>
        userSkills.some((s) => s.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(s.toLowerCase()))
      ) || [];

    const skillsGap =
      job.keywords?.filter(
        (k) => !userSkills.some((s) => s.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(s.toLowerCase()))
      ) || [];

    return {
      jobId: job.id,
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        job_type: job.job_type,
        description: job.description,
      },
      matchScore: score,
      fitReasons: generateFitReasons(job, profileAnalysis, score),
      skillsMatched: skillsMatched.slice(0, 4),
      skillsGap: skillsGap.slice(0, 3),
      salaryFit: "good",
      recommendation: score >= 80 ? "Strong match - apply now" : score >= 65 ? "Good fit - worth applying" : "Consider if interested in role",
    };
  });

  return {
    matches,
    overallInsights: {
      strongestFitCategory: suggestedRoles[0] || "Technology",
      topSkillsInDemand: ["JavaScript", "Python", "React", "Leadership", "Communication"],
      suggestedUpskilling: profileAnalysis?.marketGaps?.slice(0, 2) || ["Cloud certifications", "AI/ML basics"],
    },
  };
}

export async function matchJobs(input) {
  const { profileAnalysis, cvData, availableJobs } = input;

  // For localhost, always use mock matching logic
  // AI can enhance this when API is available
  return generateMockMatches(input);
}

export function getMockJobs() {
  return MOCK_JOBS;
}
