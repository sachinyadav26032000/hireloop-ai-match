/**
 * Job Matching Service
 * Matches user profile to relevant jobs and explains fit
 * Simulates realistic job sources (LinkedIn, Naukri, Indeed, etc.)
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

// Comprehensive mock job database categorized by role
const MOCK_JOBS = {
  // Engineering Jobs
  "Software Engineer": [
    {
      id: "se-1",
      title: "Software Engineer",
      company: "Flipkart",
      location: "Bangalore",
      salary_min: 1500000,
      salary_max: 2500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "3-5 years",
      description: "Build scalable e-commerce platforms handling millions of transactions. Work with microservices architecture and modern tech stack.",
      requirements: "Java, Python, Microservices, AWS, 3+ years experience",
      keywords: ["Java", "Python", "Microservices", "AWS", "System Design"],
      source: "LinkedIn Jobs",
      postedDate: "2 days ago",
      applyUrl: "https://linkedin.com/jobs/view/flipkart-se"
    },
    {
      id: "se-2",
      title: "Software Engineer II",
      company: "Google",
      location: "Hyderabad",
      salary_min: 2500000,
      salary_max: 4500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-6 years",
      description: "Work on Google Cloud Platform products serving billions of users globally. Solve complex distributed systems challenges.",
      requirements: "C++, Java, Distributed Systems, 4+ years experience",
      keywords: ["C++", "Java", "Distributed Systems", "Cloud", "Problem Solving"],
      source: "Google Careers",
      postedDate: "5 days ago",
      applyUrl: "https://careers.google.com"
    },
    {
      id: "se-3",
      title: "Software Development Engineer",
      company: "Amazon",
      location: "Chennai",
      salary_min: 2000000,
      salary_max: 3500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "2-4 years",
      description: "Build and operate highly scalable systems for Amazon's e-commerce platform. Drive end-to-end ownership of features.",
      requirements: "Java, AWS, Microservices, 2+ years experience",
      keywords: ["Java", "AWS", "Microservices", "Ownership", "Scalability"],
      source: "Amazon Jobs",
      postedDate: "1 week ago",
      applyUrl: "https://amazon.jobs"
    },
    {
      id: "se-4",
      title: "Senior Software Engineer",
      company: "Swiggy",
      location: "Bangalore",
      salary_min: 2800000,
      salary_max: 4200000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "5-8 years",
      description: "Lead backend development for India's leading food delivery platform. Work on real-time systems handling millions of orders.",
      requirements: "Golang, Kubernetes, System Design, 5+ years experience",
      keywords: ["Golang", "Kubernetes", "System Design", "Real-time Systems", "Leadership"],
      source: "LinkedIn Jobs",
      postedDate: "3 days ago",
      applyUrl: "https://linkedin.com/jobs/view/swiggy-sse"
    }
  ],
  "Frontend Developer": [
    {
      id: "fe-1",
      title: "Frontend Developer",
      company: "Razorpay",
      location: "Bangalore",
      salary_min: 1200000,
      salary_max: 2000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "2-4 years",
      description: "Build beautiful, accessible payment interfaces used by millions of merchants and consumers.",
      requirements: "React, TypeScript, CSS, 2+ years experience",
      keywords: ["React", "TypeScript", "CSS", "JavaScript", "Web Performance"],
      source: "Naukri",
      postedDate: "4 days ago",
      applyUrl: "https://naukri.com/razorpay-fe"
    },
    {
      id: "fe-2",
      title: "Senior Frontend Engineer",
      company: "Zerodha",
      location: "Bangalore",
      salary_min: 2000000,
      salary_max: 3200000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-6 years",
      description: "Build trading platforms that handle massive real-time data. Create responsive, performant UIs for web and mobile.",
      requirements: "JavaScript, React, WebSockets, 4+ years experience",
      keywords: ["JavaScript", "React", "WebSockets", "Performance", "Real-time"],
      source: "LinkedIn Jobs",
      postedDate: "1 week ago",
      applyUrl: "https://linkedin.com/jobs/view/zerodha-sfe"
    },
    {
      id: "fe-3",
      title: "React Developer",
      company: "Freshworks",
      location: "Chennai",
      salary_min: 1400000,
      salary_max: 2400000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "3-5 years",
      description: "Develop enterprise SaaS products used by customers worldwide. Work on component libraries and design systems.",
      requirements: "React, Redux, TypeScript, 3+ years experience",
      keywords: ["React", "Redux", "TypeScript", "SaaS", "Design Systems"],
      source: "Indeed",
      postedDate: "6 days ago",
      applyUrl: "https://indeed.com/freshworks-react"
    }
  ],
  "Backend Developer": [
    {
      id: "be-1",
      title: "Backend Developer",
      company: "Paytm",
      location: "Noida",
      salary_min: 1400000,
      salary_max: 2200000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "3-5 years",
      description: "Build payment processing systems handling millions of transactions daily. Work on fraud detection and security.",
      requirements: "Java, Spring Boot, MySQL, 3+ years experience",
      keywords: ["Java", "Spring Boot", "MySQL", "Payments", "Security"],
      source: "Naukri",
      postedDate: "2 days ago",
      applyUrl: "https://naukri.com/paytm-backend"
    },
    {
      id: "be-2",
      title: "Backend Engineer",
      company: "PhonePe",
      location: "Bangalore",
      salary_min: 1800000,
      salary_max: 3000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "3-6 years",
      description: "Work on India's most used UPI payment app. Build reliable, secure backend services at massive scale.",
      requirements: "Java, Microservices, Kafka, 3+ years experience",
      keywords: ["Java", "Microservices", "Kafka", "High Scale", "Payments"],
      source: "LinkedIn Jobs",
      postedDate: "5 days ago",
      applyUrl: "https://linkedin.com/jobs/view/phonepe-be"
    }
  ],
  "Data Analyst": [
    {
      id: "da-1",
      title: "Data Analyst",
      company: "Myntra",
      location: "Bangalore",
      salary_min: 900000,
      salary_max: 1500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "2-4 years",
      description: "Analyze customer behavior and fashion trends. Build dashboards to drive business decisions.",
      requirements: "SQL, Python, Tableau, 2+ years experience",
      keywords: ["SQL", "Python", "Tableau", "Analytics", "E-commerce"],
      source: "Naukri",
      postedDate: "3 days ago",
      applyUrl: "https://naukri.com/myntra-da"
    },
    {
      id: "da-2",
      title: "Business Analyst",
      company: "Zomato",
      location: "Gurugram",
      salary_min: 1000000,
      salary_max: 1600000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "2-5 years",
      description: "Drive data-backed decisions for restaurant partnerships and delivery operations. Work with cross-functional teams.",
      requirements: "SQL, Excel, Power BI, 2+ years experience",
      keywords: ["SQL", "Excel", "Power BI", "Business Intelligence", "Analytics"],
      source: "LinkedIn Jobs",
      postedDate: "1 week ago",
      applyUrl: "https://linkedin.com/jobs/view/zomato-ba"
    },
    {
      id: "da-3",
      title: "Data Analyst - Growth",
      company: "CRED",
      location: "Bangalore",
      salary_min: 1200000,
      salary_max: 1800000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "2-4 years",
      description: "Analyze user acquisition and engagement metrics. Drive growth initiatives with data insights.",
      requirements: "SQL, Python, Analytics, 2+ years experience",
      keywords: ["SQL", "Python", "Growth Analytics", "User Engagement", "Metrics"],
      source: "Indeed",
      postedDate: "4 days ago",
      applyUrl: "https://indeed.com/cred-growth-analyst"
    }
  ],
  "Product Manager": [
    {
      id: "pm-1",
      title: "Product Manager",
      company: "Ola",
      location: "Bangalore",
      salary_min: 2000000,
      salary_max: 3500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-7 years",
      description: "Own product roadmap for rider experience. Drive product strategy and collaborate with engineering and design teams.",
      requirements: "Product Management, Agile, User Research, 4+ years experience",
      keywords: ["Product Management", "Agile", "User Research", "Strategy", "Roadmap"],
      source: "LinkedIn Jobs",
      postedDate: "5 days ago",
      applyUrl: "https://linkedin.com/jobs/view/ola-pm"
    },
    {
      id: "pm-2",
      title: "Senior Product Manager",
      company: "Meesho",
      location: "Bangalore",
      salary_min: 2800000,
      salary_max: 4500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "5-8 years",
      description: "Lead product development for social commerce features. Drive initiatives impacting millions of resellers.",
      requirements: "Product Strategy, Data Analysis, 5+ years experience",
      keywords: ["Product Strategy", "Social Commerce", "Data-driven", "Leadership", "E-commerce"],
      source: "Naukri",
      postedDate: "3 days ago",
      applyUrl: "https://naukri.com/meesho-spm"
    }
  ],
  "Marketing Manager": [
    {
      id: "mm-1",
      title: "Marketing Manager",
      company: "upGrad",
      location: "Mumbai",
      salary_min: 1500000,
      salary_max: 2500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-6 years",
      description: "Lead marketing campaigns for online education programs. Drive user acquisition through digital and offline channels.",
      requirements: "Digital Marketing, SEO, Analytics, 4+ years experience",
      keywords: ["Digital Marketing", "SEO", "Performance Marketing", "EdTech", "Growth"],
      source: "LinkedIn Jobs",
      postedDate: "1 week ago",
      applyUrl: "https://linkedin.com/jobs/view/upgrad-mm"
    },
    {
      id: "mm-2",
      title: "Growth Marketing Manager",
      company: "Dream11",
      location: "Mumbai",
      salary_min: 1800000,
      salary_max: 3000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-7 years",
      description: "Drive user acquisition and retention for fantasy sports platform. Manage multi-million dollar marketing budgets.",
      requirements: "Performance Marketing, Analytics, 4+ years experience",
      keywords: ["Performance Marketing", "Growth", "Analytics", "Gaming", "User Acquisition"],
      source: "Naukri",
      postedDate: "6 days ago",
      applyUrl: "https://naukri.com/dream11-gmm"
    }
  ],
  "UX Designer": [
    {
      id: "ux-1",
      title: "UX Designer",
      company: "Dunzo",
      location: "Bangalore",
      salary_min: 1200000,
      salary_max: 2000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "3-5 years",
      description: "Design seamless delivery experiences. Conduct user research and create intuitive interfaces for mobile apps.",
      requirements: "Figma, User Research, Mobile Design, 3+ years experience",
      keywords: ["Figma", "User Research", "Mobile Design", "UI/UX", "Prototyping"],
      source: "LinkedIn Jobs",
      postedDate: "4 days ago",
      applyUrl: "https://linkedin.com/jobs/view/dunzo-ux"
    },
    {
      id: "ux-2",
      title: "Senior Product Designer",
      company: "Groww",
      location: "Bangalore",
      salary_min: 2000000,
      salary_max: 3500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "5-8 years",
      description: "Lead design for investment products. Create trust-building experiences for retail investors.",
      requirements: "Figma, Design Systems, FinTech, 5+ years experience",
      keywords: ["Figma", "Design Systems", "FinTech", "Product Design", "Leadership"],
      source: "Naukri",
      postedDate: "2 days ago",
      applyUrl: "https://naukri.com/groww-spd"
    }
  ],
  "Sales Executive": [
    {
      id: "sales-1",
      title: "Business Development Executive",
      company: "OYO",
      location: "Delhi NCR",
      salary_min: 600000,
      salary_max: 1000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "2-4 years",
      description: "Onboard new hotel partners and grow the OYO network. Build relationships and close deals.",
      requirements: "B2B Sales, Negotiation, CRM, 2+ years experience",
      keywords: ["B2B Sales", "Negotiation", "Partner Management", "CRM", "Hospitality"],
      source: "Naukri",
      postedDate: "3 days ago",
      applyUrl: "https://naukri.com/oyo-bde"
    },
    {
      id: "sales-2",
      title: "Enterprise Sales Manager",
      company: "Freshworks",
      location: "Chennai",
      salary_min: 1500000,
      salary_max: 2500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "5-8 years",
      description: "Sell SaaS products to enterprise customers. Manage complex sales cycles and build C-level relationships.",
      requirements: "Enterprise Sales, SaaS, Account Management, 5+ years experience",
      keywords: ["Enterprise Sales", "SaaS", "Account Management", "B2B", "Revenue"],
      source: "LinkedIn Jobs",
      postedDate: "1 week ago",
      applyUrl: "https://linkedin.com/jobs/view/freshworks-esm"
    }
  ],
  "HR Manager": [
    {
      id: "hr-1",
      title: "HR Business Partner",
      company: "Infosys",
      location: "Pune",
      salary_min: 1200000,
      salary_max: 2000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "5-8 years",
      description: "Partner with business leaders on people strategy. Drive employee engagement and talent development initiatives.",
      requirements: "HRBP, Employee Relations, Talent Management, 5+ years experience",
      keywords: ["HRBP", "Employee Relations", "Talent Management", "HR Strategy", "Leadership"],
      source: "LinkedIn Jobs",
      postedDate: "5 days ago",
      applyUrl: "https://linkedin.com/jobs/view/infosys-hrbp"
    },
    {
      id: "hr-2",
      title: "Talent Acquisition Lead",
      company: "Razorpay",
      location: "Bangalore",
      salary_min: 1500000,
      salary_max: 2500000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-7 years",
      description: "Lead recruiting for engineering and product teams. Build employer brand and optimize hiring processes.",
      requirements: "Tech Recruiting, Employer Branding, 4+ years experience",
      keywords: ["Tech Recruiting", "Talent Acquisition", "Employer Branding", "Hiring", "FinTech"],
      source: "Naukri",
      postedDate: "2 days ago",
      applyUrl: "https://naukri.com/razorpay-ta"
    }
  ],
  "Customer Success Manager": [
    {
      id: "csm-1",
      title: "Customer Success Manager",
      company: "Chargebee",
      location: "Chennai",
      salary_min: 1000000,
      salary_max: 1800000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "3-5 years",
      description: "Ensure customer success and retention for SaaS subscription platform. Drive product adoption and expansion.",
      requirements: "Customer Success, SaaS, Account Management, 3+ years experience",
      keywords: ["Customer Success", "SaaS", "Account Management", "Retention", "Onboarding"],
      source: "LinkedIn Jobs",
      postedDate: "4 days ago",
      applyUrl: "https://linkedin.com/jobs/view/chargebee-csm"
    }
  ],
  "DevOps Engineer": [
    {
      id: "devops-1",
      title: "DevOps Engineer",
      company: "Nutanix",
      location: "Bangalore",
      salary_min: 1800000,
      salary_max: 3000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "4-6 years",
      description: "Build and manage cloud infrastructure. Implement CI/CD pipelines and ensure system reliability.",
      requirements: "Kubernetes, AWS, Terraform, 4+ years experience",
      keywords: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Infrastructure"],
      source: "LinkedIn Jobs",
      postedDate: "1 week ago",
      applyUrl: "https://linkedin.com/jobs/view/nutanix-devops"
    },
    {
      id: "devops-2",
      title: "Site Reliability Engineer",
      company: "Atlassian",
      location: "Bangalore",
      salary_min: 2500000,
      salary_max: 4000000,
      currency: "INR",
      job_type: "full_time",
      experience_required: "5-8 years",
      description: "Ensure reliability and scalability of Atlassian products. Drive automation and incident response improvements.",
      requirements: "SRE, Monitoring, Automation, 5+ years experience",
      keywords: ["SRE", "Monitoring", "Automation", "Scalability", "Incident Response"],
      source: "Atlassian Careers",
      postedDate: "3 days ago",
      applyUrl: "https://atlassian.com/careers/sre"
    }
  ],
  // Remote/Global Jobs
  "Remote - Global": [
    {
      id: "remote-1",
      title: "Remote Software Engineer",
      company: "GitLab",
      location: "Remote - Global",
      salary_min: 100000,
      salary_max: 180000,
      currency: "USD",
      job_type: "full_time",
      experience_required: "3-6 years",
      description: "Work on DevOps platform used by millions of developers worldwide. Fully remote role with async-first culture.",
      requirements: "Ruby, Go, DevOps, 3+ years experience",
      keywords: ["Ruby", "Go", "DevOps", "Remote", "Git"],
      source: "GitLab Careers",
      postedDate: "1 week ago",
      applyUrl: "https://gitlab.com/jobs"
    },
    {
      id: "remote-2",
      title: "Full Stack Developer - Remote",
      company: "Toptal",
      location: "Remote - Global",
      salary_min: 80000,
      salary_max: 150000,
      currency: "USD",
      job_type: "contract",
      experience_required: "4-8 years",
      description: "Join the top 3% of freelance talent. Work with Fortune 500 companies and startups on diverse projects.",
      requirements: "Full Stack, React, Node.js, 4+ years experience",
      keywords: ["Full Stack", "React", "Node.js", "Remote", "Freelance"],
      source: "Toptal",
      postedDate: "Ongoing",
      applyUrl: "https://toptal.com/developers/join"
    }
  ]
};

// Location mapping for filtering
const LOCATION_MAPPING = {
  "Bangalore": ["Bangalore", "Karnataka", "Remote - India"],
  "Mumbai": ["Mumbai", "Maharashtra", "Remote - India"],
  "Delhi NCR": ["Delhi NCR", "Noida", "Gurugram", "Delhi", "Remote - India"],
  "Hyderabad": ["Hyderabad", "Telangana", "Remote - India"],
  "Chennai": ["Chennai", "Tamil Nadu", "Remote - India"],
  "Pune": ["Pune", "Maharashtra", "Remote - India"],
  "Remote - India": ["Remote - India", "Remote - Global", "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune"],
  "Remote - Global": ["Remote - Global", "Remote - India"],
};

function getJobsForRole(desiredRole, location, experienceYears) {
  // Get jobs for the specific role
  let roleJobs = MOCK_JOBS[desiredRole] || [];

  // Add some related jobs
  const relatedRoles = {
    "Software Engineer": ["Frontend Developer", "Backend Developer"],
    "Frontend Developer": ["Software Engineer", "UX Designer"],
    "Backend Developer": ["Software Engineer", "DevOps Engineer"],
    "Data Analyst": ["Product Manager"],
    "Product Manager": ["Data Analyst"],
    "Marketing Manager": ["Sales Executive"],
    "UX Designer": ["Frontend Developer", "Product Manager"],
    "Sales Executive": ["Business Development", "Customer Success Manager"],
    "Customer Success Manager": ["Sales Executive", "HR Manager"],
    "HR Manager": ["Customer Success Manager"],
    "DevOps Engineer": ["Software Engineer", "Backend Developer"]
  };

  const related = relatedRoles[desiredRole] || [];
  for (const relRole of related) {
    if (MOCK_JOBS[relRole]) {
      roleJobs = [...roleJobs, ...MOCK_JOBS[relRole].slice(0, 2)];
    }
  }

  // Add global remote jobs if applicable
  if (location?.includes("Remote") || experienceYears >= 5) {
    roleJobs = [...roleJobs, ...(MOCK_JOBS["Remote - Global"] || [])];
  }

  // Filter by location
  if (location) {
    const allowedLocations = LOCATION_MAPPING[location] || [location];
    roleJobs = roleJobs.filter(job =>
      allowedLocations.some(loc =>
        job.location.toLowerCase().includes(loc.toLowerCase()) ||
        loc.toLowerCase().includes(job.location.toLowerCase())
      )
    );
  }

  // If no jobs after filtering, return unfiltered jobs
  if (roleJobs.length === 0) {
    roleJobs = MOCK_JOBS[desiredRole] || [];
    // Add remote options as fallback
    roleJobs = [...roleJobs, ...(MOCK_JOBS["Remote - Global"] || [])];
  }

  return roleJobs;
}

function calculateMatchScore(jobKeywords, userSkills, job, profileAnalysis, experienceYears) {
  if (!jobKeywords?.length || !userSkills?.length) return 45;

  const jobKeywordsLower = jobKeywords.map((k) => k.toLowerCase());
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());

  let matches = 0;
  for (const skill of userSkillsLower) {
    if (jobKeywordsLower.some((k) => k.includes(skill) || skill.includes(k))) {
      matches++;
    }
  }

  // Base score from skill match
  const matchRatio = matches / Math.max(jobKeywords.length, 1);
  let score = Math.round(45 + matchRatio * 35);

  // Experience level adjustment
  const jobExpMatch = job.experience_required?.match(/(\d+)/);
  const jobMinExp = jobExpMatch ? parseInt(jobExpMatch[1]) : 2;

  if (experienceYears >= jobMinExp && experienceYears <= jobMinExp + 3) {
    score += 10; // Good experience match
  } else if (experienceYears >= jobMinExp - 1) {
    score += 5; // Close enough
  }

  // Role alignment boost
  const suggestedRoles = profileAnalysis?.suggestedRoles || [];
  if (suggestedRoles.some(role => job.title.toLowerCase().includes(role.toLowerCase().split(" ")[0]))) {
    score += 8;
  }

  return Math.min(92, score);
}

function generateFitReasons(job, profileAnalysis, matchScore, skillsMatched) {
  const reasons = [];
  const experience = profileAnalysis?.yearsOfExperience || 0;

  // Score-based reasons
  if (matchScore >= 80) {
    reasons.push(`Your profile is a strong match for the ${job.title} requirements`);
  } else if (matchScore >= 70) {
    reasons.push(`Your background aligns well with this ${job.title} position`);
  }

  // Skills-based reasons
  if (skillsMatched.length >= 3) {
    reasons.push(`You have ${skillsMatched.length} of the key skills they're looking for: ${skillsMatched.slice(0, 3).join(", ")}`);
  } else if (skillsMatched.length >= 1) {
    reasons.push(`Your ${skillsMatched[0]} experience is directly relevant to this role`);
  }

  // Experience-based reasons
  const jobExpMatch = job.experience_required?.match(/(\d+)-(\d+)/);
  if (jobExpMatch) {
    const [, minExp, maxExp] = jobExpMatch;
    if (experience >= parseInt(minExp) && experience <= parseInt(maxExp)) {
      reasons.push(`Your ${experience} years of experience is exactly what they're looking for (${minExp}-${maxExp} years)`);
    }
  }

  // Company/opportunity reasons
  reasons.push(`${job.company} is a well-known brand that would strengthen your resume`);

  // Ensure we have at least 2 reasons
  if (reasons.length < 2) {
    reasons.push("This role offers good growth potential in your target domain");
  }

  return reasons.slice(0, 3);
}

function formatSalary(salary_min, salary_max, currency) {
  if (!salary_min || !salary_max) return null;

  const formatter = currency === "USD"
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return {
    display: `${formatter.format(salary_min)} - ${formatter.format(salary_max)}`,
    min: salary_min,
    max: salary_max,
    currency
  };
}

function generateMockMatches(input) {
  const { profileAnalysis, filters } = input;
  const userSkills = profileAnalysis?.coreSkills || [];
  const suggestedRoles = profileAnalysis?.suggestedRoles || [];
  const desiredRole = filters?.desiredRole || suggestedRoles[0] || "Software Engineer";
  const location = filters?.location || "";
  const experienceYears = filters?.experienceYears || profileAnalysis?.yearsOfExperience || 2;

  // Get filtered jobs
  const jobs = getJobsForRole(desiredRole, location, experienceYears);

  // Score and sort jobs
  const scoredJobs = jobs.map((job) => {
    const score = calculateMatchScore(job.keywords, userSkills, job, profileAnalysis, experienceYears);
    return { job, score };
  });

  scoredJobs.sort((a, b) => b.score - a.score);

  // Take top 6 matches
  const matches = scoredJobs.slice(0, 6).map(({ job, score }) => {
    const skillsMatched =
      job.keywords?.filter((k) =>
        userSkills.some((s) => s.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(s.toLowerCase()))
      ) || [];

    const skillsGap =
      job.keywords?.filter(
        (k) => !userSkills.some((s) => s.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(s.toLowerCase()))
      ) || [];

    const salary = formatSalary(job.salary_min, job.salary_max, job.currency);

    return {
      jobId: job.id,
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary_min: salary?.min,
        salary_max: salary?.max,
        salary_display: salary?.display,
        currency: job.currency,
        job_type: job.job_type,
        description: job.description,
        source: job.source,
        postedDate: job.postedDate,
        applyUrl: job.applyUrl,
        experience_required: job.experience_required
      },
      matchScore: score,
      fitReasons: generateFitReasons(job, profileAnalysis, score, skillsMatched),
      skillsMatched: skillsMatched.slice(0, 5),
      skillsGap: skillsGap.slice(0, 4),
      salaryFit: "good",
      recommendation: score >= 80 ? "Strong match - apply now" : score >= 70 ? "Good fit - worth applying" : "Consider applying",
    };
  });

  // Generate insights based on the role
  const roleSkillsMap = {
    "Software Engineer": ["System Design", "Cloud (AWS/GCP)", "Microservices", "Data Structures"],
    "Frontend Developer": ["React/Vue/Angular", "TypeScript", "CSS/Tailwind", "Performance Optimization"],
    "Backend Developer": ["API Design", "Database Optimization", "Containerization", "Security"],
    "Data Analyst": ["Python", "SQL", "Visualization Tools", "Statistical Analysis"],
    "Product Manager": ["Roadmapping", "User Research", "Analytics", "Stakeholder Management"],
    "Marketing Manager": ["Performance Marketing", "SEO/SEM", "Analytics", "Content Strategy"],
    "UX Designer": ["Figma", "User Research", "Prototyping", "Design Systems"],
  };

  return {
    matches,
    overallInsights: {
      strongestFitCategory: desiredRole,
      topSkillsInDemand: roleSkillsMap[desiredRole] || ["Communication", "Problem Solving", "Leadership", "Collaboration"],
      suggestedUpskilling: profileAnalysis?.marketGaps?.slice(0, 3) || ["Cloud certifications", "System design", "Leadership skills"],
    },
  };
}

export async function matchJobs(input) {
  const { profileAnalysis, cvData, availableJobs, filters } = input;

  // For localhost, always use mock matching logic
  // AI can enhance this when API is available
  return generateMockMatches({ profileAnalysis, filters });
}

export function getMockJobs() {
  return Object.values(MOCK_JOBS).flat();
}
