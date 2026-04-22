/**
 * Profile Analysis Service - AI-POWERED
 *
 * Uses GPT/Claude to provide intelligent career analysis:
 * - Deep understanding of career trajectory
 * - Personalized role suggestions based on actual experience
 * - Contextual skill extraction (not just keyword matching)
 * - Real market insights and actionable recommendations
 *
 * The AI analyzes the candidate holistically, not just pattern matching.
 */
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";

/**
 * System prompt for AI career analysis
 * This prompt instructs the AI to act as a senior career advisor
 */
const CAREER_ANALYST_PROMPT = `You are a world-class career advisor and talent assessor with 20+ years of experience in recruitment, career coaching, and talent acquisition across multiple industries.

Your task is to analyze a candidate's profile and provide deep, personalized career insights.

ANALYSIS APPROACH:
1. Read between the lines - understand implied skills and experience, not just explicit mentions
2. Consider career trajectory - where they've been and where they could go
3. Identify transferable skills that may not be obvious
4. Be honest but constructive - point out gaps without being discouraging
5. Provide specific, actionable advice - not generic tips

IMPORTANT RULES:
- Base ALL analysis on the provided information only
- Do NOT invent or assume facts not present in the input
- If information is missing, acknowledge it and work with what you have
- Be specific to THIS candidate, not generic advice
- Consider the current job market and industry trends

IMPORTANT: Return ONLY a valid JSON object. No text before or after the JSON. No markdown code blocks. Just the raw JSON object.

JSON structure:
{
  "suggestedRoles": ["Most suitable role", "Alternative 1", "Alternative 2"],
  "experienceLevel": "entry|junior|mid|senior|lead|executive",
  "yearsOfExperience": estimated_number,
  "coreSkills": ["Technical skills found or implied"],
  "softSkills": ["Soft skills evidenced by their experience"],
  "industryFit": ["Industries they'd excel in"],
  "careerTrajectory": "Brief assessment of their career path and potential",
  "uniqueStrengths": ["What makes this candidate stand out - be specific to THEIR profile"],
  "weakAreas": ["EXACTLY 5 specific, realistic areas to improve - based on THIS person's resume gaps, missing skills, weak sections, or career blind spots. Be constructive but honest. Example: 'No data/analytics skills despite leadership roles - adding SQL or Tableau would strengthen VP-level candidacy'"],
  "marketGaps": ["EXACTLY 5 realistic market opportunities for THIS person - based on current hiring trends, industry demand, and their transferable skills. Example: 'Customer Experience leaders with AI/chatbot implementation experience are in high demand at Series B+ startups'"],
  "immediateActions": ["Top 3 things they should do right now"],
  "summary": "Compelling 2-3 sentence professional summary for this candidate",
  "confidenceScore": 0-100 based on how much information you had to work with
}`;

/**
 * System prompt for ATS optimization analysis
 */
const ATS_ANALYST_PROMPT = `You are an ATS (Applicant Tracking System) optimization expert who understands how automated systems parse and score resumes.

Analyze the provided resume/profile for ATS compatibility and provide specific scoring.

SCORING CRITERIA (0-100 scale):
1. Keyword Relevance (25%): Does the content contain relevant keywords for the target role?
2. Impact Metrics (25%): Are achievements quantified with numbers, percentages, or specific outcomes?
3. Role Alignment (25%): How well does the experience align with the target role?
4. Format & Clarity (25%): Is the content well-structured and easy to parse?

Return ONLY valid JSON:
{
  "overall": overall_score_40_to_100,
  "keywordRelevance": {
    "score": 0-100,
    "found": ["keywords found"],
    "missing": ["important keywords missing for target role"],
    "feedback": "specific feedback"
  },
  "impactMetrics": {
    "score": 0-100,
    "examples": ["quantified achievements found"],
    "improvements": ["how to add more metrics"],
    "feedback": "specific feedback"
  },
  "roleAlignment": {
    "score": 0-100,
    "strengths": ["alignment strengths"],
    "gaps": ["alignment gaps"],
    "feedback": "specific feedback"
  },
  "formattingClarity": {
    "score": 0-100,
    "positives": ["what's good"],
    "issues": ["what to fix"],
    "feedback": "specific feedback"
  },
  "topImprovements": ["Top 5 specific, actionable improvements ranked by impact"]
}`;

/**
 * Comprehensive skill database for intelligent extraction
 */
const SKILL_DATABASE = {
  // Programming Languages
  programming: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Golang", "Rust", "Ruby", "PHP",
    "Swift", "Kotlin", "Scala", "MATLAB", "Perl", "Shell", "Bash", "PowerShell", "Groovy",
    "XML", "JSON", "YAML"
  ],
  // Frontend Technologies
  frontend: [
    "React", "Angular", "Vue", "Next.js", "Nuxt.js", "Svelte", "HTML", "CSS", "SASS", "SCSS",
    "Tailwind", "Bootstrap", "Material UI", "Redux", "MobX", "Webpack", "Vite", "jQuery"
  ],
  // Backend Technologies
  backend: [
    "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Spring Boot", "Rails",
    "ASP.NET", "Laravel", "NestJS", "GraphQL", "REST", "RESTful APIs", "gRPC", "Microservices",
    "API Gateway", "Eureka", "Service Discovery", "Hibernate", "JPA", "MyBatis"
  ],
  // Databases
  databases: [
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase", "DynamoDB", "Cassandra",
    "Oracle", "SQL Server", "SQLite", "Elasticsearch", "Neo4j", "MariaDB"
  ],
  // Cloud & DevOps
  cloud: [
    "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "Terraform",
    "Ansible", "CI/CD", "GitHub Actions", "GitLab CI", "CircleCI", "Nginx", "Apache",
    "Cloud Foundry", "PCF", "Linux", "Unix"
  ],
  // Monitoring & Logging
  monitoring: [
    "Grafana", "Splunk", "AppDynamics", "New Relic", "Datadog", "Prometheus", "ELK Stack",
    "Kibana", "Logstash"
  ],
  // Messaging & Integration
  messaging: [
    "Kafka", "RabbitMQ", "ActiveMQ", "JMS", "Tibco", "SQS", "SNS", "Event-Driven"
  ],
  // Build & Testing
  buildtools: [
    "Maven", "Gradle", "npm", "Yarn", "Webpack", "Babel",
    "JUnit", "Mockito", "Jest", "Mocha", "Cypress", "Selenium", "TestNG", "Postman",
    "Unit Testing", "Integration Testing", "TDD", "BDD"
  ],
  // Security
  security: [
    "OAuth", "OAuth 2.0", "JWT", "SSL", "TLS", "Security", "Authentication"
  ],
  // Data & ML
  data: [
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "Pandas", "NumPy",
    "Scikit-learn", "Data Analysis", "Data Science", "NLP", "Computer Vision", "AI", "MLOps"
  ],
  // Tools & Methodologies
  tools: [
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "Figma", "Sketch", "Adobe XD",
    "Photoshop", "Illustrator", "VS Code", "IntelliJ", "Eclipse", "Postman", "Swagger"
  ],
  // Methodologies
  methodologies: [
    "Agile", "Scrum", "SAFe", "Kanban", "Waterfall", "DevOps"
  ],
  // Soft Skills
  soft: [
    "Leadership", "Communication", "Team Management", "Project Management",
    "Problem Solving", "Critical Thinking", "Collaboration", "Mentoring", "Strategic Planning",
    "Stakeholder Management", "Presentation Skills", "Negotiation", "Time Management"
  ],
  // Business & Management
  business: [
    "Sales", "Marketing", "Business Development", "P&L Management", "Revenue Growth",
    "Operations", "Channel Sales", "Account Management", "Customer Success", "CRM",
    "Salesforce", "HubSpot", "Analytics", "Market Research", "Product Launch", "Go-to-Market",
    "Partnership Development", "Vendor Management", "Budget Management", "KPI Management"
  ],
  // Finance & Insurance
  finance: [
    "Financial Analysis", "Risk Management", "Investment", "Banking", "Insurance",
    "Wealth Management", "Portfolio Management", "Mutual Funds", "Asset Management"
  ],
  // Legal & Compliance
  legal: [
    "Legal", "Compliance", "Corporate Law", "Commercial Law", "Contract Management",
    "Contract Negotiation", "Regulatory Compliance", "Corporate Governance", "Board Advisory",
    "Secretarial", "Company Secretary", "Legal Counsel", "Litigation", "Dispute Resolution",
    "Risk Management", "Due Diligence", "M&A", "Mergers and Acquisitions", "IPR", "Patents",
    "Trademark", "Legal Documentation", "Legal Drafting", "Arbitration", "Mediation"
  ],
  // HR & Talent Acquisition
  hr: [
    "Talent Acquisition", "Recruitment", "Sourcing", "Headhunting", "Technical Recruiting",
    "Campus Recruitment", "Employer Branding", "LinkedIn Recruiter", "ATS", "HRIS",
    "Onboarding", "Employee Engagement", "HR Operations", "Talent Management",
    "Compensation", "Benefits", "Performance Management", "Learning and Development",
    "Workforce Planning", "Succession Planning", "HR Analytics", "People Operations"
  ],
  // Domain Specific
  domain: [
    "Guidewire", "PolicyCenter", "ClaimCenter", "BillingCenter", "SAP", "ServiceNow", "Workday"
  ]
};

/**
 * Role mapping with required skills and typical trajectories
 */
const ROLE_INTELLIGENCE = {
  "Software Engineer": {
    keywords: ["software", "developer", "engineer", "programming", "coding"],
    requiredSkills: ["programming", "frontend", "backend", "databases"],
    trajectory: "Software Developer → Senior Engineer → Staff Engineer → Principal Engineer → Engineering Manager",
    industries: ["Technology", "FinTech", "E-commerce", "Healthcare Tech", "SaaS"]
  },
  "Frontend Developer": {
    keywords: ["frontend", "front-end", "ui", "react", "angular", "vue", "web developer"],
    requiredSkills: ["frontend", "programming"],
    trajectory: "Junior Frontend Dev → Frontend Developer → Senior Frontend → Lead Frontend → Frontend Architect",
    industries: ["Technology", "Digital Agencies", "E-commerce", "Media", "SaaS"]
  },
  "Backend Developer": {
    keywords: ["backend", "back-end", "server", "api", "node", "python", "java"],
    requiredSkills: ["backend", "databases", "programming"],
    trajectory: "Junior Backend Dev → Backend Developer → Senior Backend → Lead Backend → Backend Architect",
    industries: ["Technology", "FinTech", "Enterprise Software", "Cloud Services"]
  },
  "Full Stack Developer": {
    keywords: ["full stack", "fullstack", "full-stack", "mern", "mean"],
    requiredSkills: ["frontend", "backend", "databases", "programming"],
    trajectory: "Full Stack Developer → Senior Full Stack → Tech Lead → Solution Architect",
    industries: ["Startups", "Technology", "Consulting", "Digital Agencies"]
  },
  "Data Scientist": {
    keywords: ["data scientist", "machine learning", "ml", "ai", "analytics"],
    requiredSkills: ["data", "programming"],
    trajectory: "Data Analyst → Data Scientist → Senior Data Scientist → Lead DS → Head of Data Science",
    industries: ["Technology", "Finance", "Healthcare", "E-commerce", "Research"]
  },
  "DevOps Engineer": {
    keywords: ["devops", "sre", "infrastructure", "platform", "cloud engineer"],
    requiredSkills: ["cloud", "tools"],
    trajectory: "DevOps Engineer → Senior DevOps → Platform Engineer → DevOps Architect → Head of Infrastructure",
    industries: ["Technology", "Cloud Services", "Enterprise", "FinTech"]
  },
  "Product Manager": {
    keywords: ["product manager", "product owner", "pm", "product lead"],
    requiredSkills: ["soft", "business"],
    trajectory: "Associate PM → Product Manager → Senior PM → Director of Product → VP Product → CPO",
    industries: ["Technology", "SaaS", "E-commerce", "FinTech", "Consumer Tech"]
  },
  "Project Manager": {
    keywords: ["project manager", "program manager", "delivery manager"],
    requiredSkills: ["soft", "business", "tools"],
    trajectory: "Project Coordinator → Project Manager → Senior PM → Program Manager → PMO Director",
    industries: ["Technology", "Consulting", "Construction", "Manufacturing", "Finance"]
  },
  "Business Development Manager": {
    keywords: ["business development", "bd", "partnerships", "strategic"],
    requiredSkills: ["business", "soft"],
    trajectory: "BD Executive → BD Manager → Senior BD Manager → Director of BD → VP Business Development",
    industries: ["Technology", "Consulting", "Finance", "Manufacturing", "Retail"]
  },
  "Sales Manager": {
    keywords: ["sales", "account executive", "account manager", "revenue"],
    requiredSkills: ["business", "soft"],
    trajectory: "Sales Rep → Account Executive → Sales Manager → Regional Director → VP Sales",
    industries: ["Technology", "SaaS", "Finance", "Retail", "Manufacturing"]
  },
  "Operations Manager": {
    keywords: ["operations", "ops manager", "process", "supply chain"],
    requiredSkills: ["business", "soft"],
    trajectory: "Operations Analyst → Operations Manager → Senior Ops Manager → Director of Ops → COO",
    industries: ["Manufacturing", "Retail", "Logistics", "Technology", "Healthcare"]
  },
  "Marketing Manager": {
    keywords: ["marketing", "digital marketing", "brand", "growth"],
    requiredSkills: ["business", "soft"],
    trajectory: "Marketing Coordinator → Marketing Manager → Senior Manager → Director → VP Marketing → CMO",
    industries: ["Technology", "Consumer Goods", "Retail", "Media", "SaaS"]
  },
  "UX Designer": {
    keywords: ["ux", "user experience", "ui/ux", "product designer", "interaction design"],
    requiredSkills: ["tools", "soft"],
    trajectory: "Junior UX Designer → UX Designer → Senior UX → Lead Designer → Head of Design",
    industries: ["Technology", "Digital Agencies", "E-commerce", "Consumer Tech"]
  },
  "Data Analyst": {
    keywords: ["data analyst", "business analyst", "analytics", "bi"],
    requiredSkills: ["data", "tools"],
    trajectory: "Junior Analyst → Data Analyst → Senior Analyst → Analytics Manager → Head of Analytics",
    industries: ["Technology", "Finance", "Retail", "Healthcare", "Consulting"]
  },
  "Java Developer": {
    keywords: ["java developer", "java engineer", "spring boot", "java backend", "j2ee"],
    requiredSkills: ["programming", "backend", "databases"],
    trajectory: "Junior Java Dev → Java Developer → Senior Java Dev → Tech Lead → Java Architect",
    industries: ["Technology", "FinTech", "Banking", "Insurance", "Enterprise"]
  },
  "Cloud Engineer": {
    keywords: ["cloud engineer", "aws engineer", "azure engineer", "cloud architect"],
    requiredSkills: ["cloud", "tools"],
    trajectory: "Cloud Engineer → Senior Cloud Engineer → Cloud Architect → Principal Architect",
    industries: ["Technology", "Cloud Services", "Enterprise", "FinTech"]
  },
  "Technical Lead": {
    keywords: ["technical lead", "tech lead", "engineering lead", "team lead"],
    requiredSkills: ["programming", "backend", "soft"],
    trajectory: "Senior Engineer → Tech Lead → Engineering Manager → Director of Engineering → VP Engineering",
    industries: ["Technology", "FinTech", "SaaS", "Enterprise"]
  },
  "Solution Architect": {
    keywords: ["solution architect", "enterprise architect", "technical architect"],
    requiredSkills: ["backend", "cloud", "soft"],
    trajectory: "Senior Developer → Solution Architect → Principal Architect → Chief Architect",
    industries: ["Technology", "Consulting", "Enterprise", "Cloud Services"]
  },
  "Investment Analyst": {
    keywords: ["investment", "portfolio", "wealth management", "asset management", "mutual fund"],
    requiredSkills: ["finance", "business"],
    trajectory: "Investment Analyst → Senior Analyst → Portfolio Manager → Fund Manager → CIO",
    industries: ["Finance", "Banking", "Asset Management", "Wealth Management"]
  },
  "Relationship Manager": {
    keywords: ["relationship manager", "client manager", "account manager", "banking"],
    requiredSkills: ["business", "soft", "finance"],
    trajectory: "RM → Senior RM → Team Lead → Regional Manager → Director",
    industries: ["Banking", "Finance", "Insurance", "Wealth Management"]
  },
  "Insurance Professional": {
    keywords: ["insurance", "underwriting", "claims", "policy", "guidewire"],
    requiredSkills: ["domain", "business"],
    trajectory: "Insurance Analyst → Senior Analyst → Manager → Director → VP Insurance",
    industries: ["Insurance", "FinTech", "Banking"]
  },
  "Guidewire Developer": {
    keywords: ["guidewire", "policycenter", "claimcenter", "billingcenter", "insurance developer"],
    requiredSkills: ["programming", "backend", "domain"],
    trajectory: "Guidewire Developer → Senior Guidewire Dev → Tech Lead → Guidewire Architect",
    industries: ["Insurance", "InsurTech", "Consulting"]
  },
  "Legal Counsel": {
    keywords: ["legal", "counsel", "lawyer", "attorney", "advocate", "law", "llb", "compliance", "corporate counsel", "general counsel", "head legal", "company secretary", "secretarial"],
    requiredSkills: ["legal", "soft"],
    trajectory: "Associate → Legal Counsel → Senior Counsel → General Counsel → Chief Legal Officer",
    industries: ["Legal", "Corporate", "Finance", "Technology", "Manufacturing", "Energy"]
  },
  "Compliance Officer": {
    keywords: ["compliance", "regulatory", "governance", "audit", "risk compliance", "compliance manager"],
    requiredSkills: ["legal", "soft", "business"],
    trajectory: "Compliance Analyst → Compliance Officer → Senior Compliance → Head of Compliance → Chief Compliance Officer",
    industries: ["Finance", "Banking", "Insurance", "Healthcare", "Pharma"]
  },
  "Talent Acquisition Manager": {
    keywords: ["talent acquisition", "recruitment", "recruiter", "sourcing", "headhunting", "hiring", "ta manager", "talent partner", "recruiting"],
    requiredSkills: ["hr", "soft"],
    trajectory: "Recruiter → Senior Recruiter → TA Lead → TA Manager → Head of TA → VP Talent",
    industries: ["Technology", "Consulting", "Finance", "Healthcare", "Manufacturing"]
  },
  "HR Manager": {
    keywords: ["human resources", "hr manager", "hr business partner", "hrbp", "people operations", "people manager", "hr head"],
    requiredSkills: ["hr", "soft", "business"],
    trajectory: "HR Executive → HR Manager → Senior HR Manager → HR Director → CHRO",
    industries: ["Technology", "Finance", "Manufacturing", "Retail", "Healthcare"]
  }
};

/**
 * Skills that need special matching (case-sensitive or context-aware)
 */
const SPECIAL_SKILLS = {
  // These need exact case or special context
  "Go": /\b(golang|go\s*lang|go\s+programming|written\s+in\s+go|experience\s+(with|in)\s+go|go\s+developer)\b/i,
  "R": /\b(r\s+programming|r\s+language|rstudio|written\s+in\s+r|experience\s+(with|in)\s+r\b|r\s+developer|statistical\s+analysis.*\br\b)/i,
  "C": /\b(c\s+programming|written\s+in\s+c\b|experience\s+(with|in)\s+c\b|c\s+language|c\/c\+\+|c\s+developer)\b/i,
  "C++": /\b(c\+\+|cpp)\b/i,
  "C#": /\b(c#|csharp|c\s*sharp|\.net\s+c#)\b/i,
};

/**
 * Skills that commonly cause false positives and need word boundary matching
 */
const WORD_BOUNDARY_SKILLS = [
  "Java", "SQL", "AWS", "GCP", "Git", "CSS", "PHP", "Scala", "Rust", "Ruby", "REST", "MQ", "SAP"
];

/**
 * Context patterns that indicate HR/Recruitment role
 */
const HR_CONTEXT_PATTERNS = [
  /talent\s+acquisition/i,
  /\brecruit(er|ing|ment)?\b/i,
  /\bsourcing\b/i,
  /\bhiring\b/i,
  /\bheadhunt/i,
  /\bta\s+(lead|manager|head|director)/i,
  /\bhr\s+(manager|director|head|business\s+partner)/i,
  /human\s+resources/i
];

/**
 * Patterns indicating tech skills mentioned in recruiting context (not personal skills)
 */
const RECRUITING_TECH_PATTERNS = [
  /recruit(ed|ing)?\s+(for\s+)?([\w\s,&]+\s+)?(developer|engineer|role|position|team)/i,
  /hiring\s+(for\s+)?([\w\s,&]+\s+)?(developer|engineer|role|position|team)/i,
  /(\w+)\s+(developer|engineer)s?\b/i,  // "Java developers", "Python engineers"
  /sourcing\s+(for\s+)?([\w\s,&]+)/i,
  /(\w+)\s+roles?\b/i,
  /positions?\s+(in|for)\s+(\w+)/i,
  /GCC|B2B|IT\s+(Consulting|Services)/i  // Common TA industry terms
];

/**
 * Filter skills based on context - prevents false positives for HR/TA professionals
 */
function filterSkillsByContext(skills, text, identifiedRoles) {
  const textLower = text.toLowerCase();

  // Check if person is in HR/TA role
  const isHRRole = HR_CONTEXT_PATTERNS.some(pattern => pattern.test(text));
  const identifiedAsHR = identifiedRoles.some(r =>
    r.role === "Talent Acquisition Manager" || r.role === "HR Manager"
  );

  if (!isHRRole && !identifiedAsHR) {
    return skills; // Not HR, no filtering needed
  }

  console.log("[Profile Analysis] HR/TA context detected - filtering tech skills mentioned in recruiting context");

  // Tech skill categories that could be false positives for HR
  const techCategories = ["programming", "frontend", "backend", "databases", "cloud", "monitoring", "messaging", "buildtools"];
  const techSkillsToCheck = techCategories.flatMap(cat => SKILL_DATABASE[cat] || []);

  // Filter out tech skills that appear only in recruiting context
  const filteredTechnical = skills.technical.filter(skill => {
    const skillLower = skill.toLowerCase();

    // Check if this skill is a tech skill
    const isTechSkill = techSkillsToCheck.some(ts => ts.toLowerCase() === skillLower);
    if (!isTechSkill) return true; // Keep non-tech skills

    // Check if skill appears in recruiting context
    // Look for patterns like "Java developers", "recruiting Java", "hiring for Java"
    const recruitingContextPatterns = [
      new RegExp(`recruit(ed|ing)?\\s+(for\\s+)?\\w*\\s*${skill}`, 'i'),
      new RegExp(`hiring\\s+(for\\s+)?\\w*\\s*${skill}`, 'i'),
      new RegExp(`${skill}\\s+(developer|engineer|role|position|team)s?`, 'i'),
      new RegExp(`sourcing\\s+(for\\s+)?\\w*\\s*${skill}`, 'i'),
      new RegExp(`${skill}\\s+(J2EE|.NET|Full\\s*stack)`, 'i'),  // Tech stack mentions
    ];

    const inRecruitingContext = recruitingContextPatterns.some(p => p.test(text));

    // Also check if it's a company name (Shell = oil company, not shell scripting)
    const companyNamePatterns = [
      /\bBP,\s*Shell\b/i,  // Shell the oil company
      /\bShell,\s*\w+,\s*\w+/i,  // Shell in a list of companies
      /Oil\s*&?\s*Gas.*Shell/i,
    ];
    const isCompanyName = skill.toLowerCase() === "shell" &&
      companyNamePatterns.some(p => p.test(text));

    if (inRecruitingContext || isCompanyName) {
      console.log(`[Profile Analysis] Filtered out "${skill}" - appears in recruiting context or is company name`);
      return false;
    }

    return true;
  });

  // Rebuild the all array
  const filteredAll = [...filteredTechnical, ...skills.soft];

  return {
    technical: filteredTechnical,
    soft: skills.soft,
    all: filteredAll
  };
}

/**
 * Check if a skill is present in text using word boundary matching
 */
function skillMatchesText(skill, text, textLower) {
  // Check for special skills that need context-aware matching
  if (SPECIAL_SKILLS[skill]) {
    return SPECIAL_SKILLS[skill].test(text);
  }

  // For short skills or skills that commonly cause false positives, require word boundaries
  if (skill.length <= 4 || WORD_BOUNDARY_SKILLS.includes(skill)) {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    return regex.test(text);
  }

  // For longer skills, simple lowercase includes is fine
  return textLower.includes(skill.toLowerCase());
}

/**
 * Extract comprehensive skills from text
 */
function extractComprehensiveSkills(text) {
  const textLower = text.toLowerCase();
  const foundSkills = {
    technical: [],
    soft: [],
    all: []
  };

  // Search all skill categories
  for (const [category, skills] of Object.entries(SKILL_DATABASE)) {
    for (const skill of skills) {
      // Skip ambiguous short skills that commonly cause false positives
      if (skill === "R" || skill === "Go" || skill === "C") {
        // Only match these if there's clear programming context
        if (skillMatchesText(skill, text, textLower)) {
          if (category === "soft") {
            if (!foundSkills.soft.includes(skill)) foundSkills.soft.push(skill);
          } else {
            if (!foundSkills.technical.includes(skill)) foundSkills.technical.push(skill);
          }
          if (!foundSkills.all.includes(skill)) foundSkills.all.push(skill);
        }
      } else if (skillMatchesText(skill, text, textLower)) {
        if (category === "soft") {
          if (!foundSkills.soft.includes(skill)) foundSkills.soft.push(skill);
        } else {
          if (!foundSkills.technical.includes(skill)) foundSkills.technical.push(skill);
        }
        if (!foundSkills.all.includes(skill)) foundSkills.all.push(skill);
      }
    }
  }

  return foundSkills;
}

/**
 * Analyze resume for achievements and metrics
 */
function analyzeAchievements(text) {
  const achievements = [];

  // Split by sentences and bullet patterns
  const sentences = text.split(/(?:\.\s+|\n|•|●|■|▪|–)/);

  // Patterns for quantified achievements
  const metricsPatterns = [
    /\d+%/,
    /\$[\d,]+[kKmMbB]?/,
    /\d+[kKmMbB]\+?\s*(?:users|customers|clients|revenue|requests|transactions|visits)/i,
    /(?:increased|improved|reduced|grew|boosted|achieved|delivered|saved|led|managed|built|developed|created|launched|scaled)\s+[^.]*\d+/i,
    /\d+\+?\s*(?:team|members|people|engineers|developers|reports|projects)/i,
    /\d+x\s*(?:faster|improvement|increase|growth)/i,
    /serving\s+\d+[kKmMbB]?\+?\s*/i,
    /team\s+of\s+\d+/i,
    /handling\s+\d+[kKmMbB]?\+?\s*/i
  ];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    // Must be reasonable length
    if (trimmed.length >= 20 && trimmed.length <= 300) {
      for (const pattern of metricsPatterns) {
        if (pattern.test(trimmed)) {
          // Clean up the achievement text
          let cleaned = trimmed.replace(/^[•●■▪–\-\*]\s*/, "").trim();
          // Capitalize first letter
          if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          }
          // Add period if missing
          if (cleaned.length >= 20 && !cleaned.endsWith(".") && !cleaned.endsWith("!")) {
            cleaned += ".";
          }
          if (cleaned.length >= 20) {
            achievements.push(cleaned);
          }
          break;
        }
      }
    }
  }

  return [...new Set(achievements)].slice(0, 5);
}

/**
 * Extract soft skills from text
 */
function extractSoftSkills(text) {
  const textLower = text.toLowerCase();
  const softSkillIndicators = {
    "Leadership": ["led", "leader", "leadership", "managed team", "built team", "directed"],
    "Communication": ["communicated", "presented", "stakeholder", "collaborated with", "liaised"],
    "Problem Solving": ["solved", "resolved", "troubleshoot", "debugged", "fixed"],
    "Mentoring": ["mentored", "coached", "trained", "guided", "onboarded"],
    "Project Management": ["project management", "delivered project", "managed project", "coordinated"],
    "Team Collaboration": ["collaborated", "cross-functional", "worked closely", "partnered"],
    "Strategic Thinking": ["strategic", "strategy", "roadmap", "vision", "planned"],
    "Stakeholder Management": ["stakeholder", "client-facing", "customer", "executive"],
    "Time Management": ["deadline", "on-time", "prioritized", "juggled"],
    "Adaptability": ["adapted", "flexible", "pivoted", "agile environment"]
  };

  const foundSoftSkills = [];
  for (const [skill, indicators] of Object.entries(softSkillIndicators)) {
    if (indicators.some(ind => textLower.includes(ind))) {
      foundSoftSkills.push(skill);
    }
  }

  return foundSoftSkills;
}

/**
 * Detect experience level from resume content
 */
function detectExperienceLevel(text, years) {
  const textLower = text.toLowerCase();

  // Leadership indicators
  const leadershipIndicators = [
    "director", "vp", "vice president", "head of", "chief", "cto", "ceo", "cfo",
    "founded", "co-founder", "built team", "hired", "managed team of"
  ];

  const seniorIndicators = [
    "senior", "lead", "principal", "architect", "staff", "team lead",
    "tech lead", "engineering manager", "10+ years", "15+ years"
  ];

  const midIndicators = [
    "5+ years", "6+ years", "7+ years", "experienced", "specialist"
  ];

  // Check for indicators
  for (const indicator of leadershipIndicators) {
    if (textLower.includes(indicator)) return { level: "lead", confidence: 90 };
  }

  for (const indicator of seniorIndicators) {
    if (textLower.includes(indicator)) return { level: "senior", confidence: 85 };
  }

  for (const indicator of midIndicators) {
    if (textLower.includes(indicator)) return { level: "mid", confidence: 80 };
  }

  // Fall back to years of experience
  if (years >= 12) return { level: "lead", confidence: 75 };
  if (years >= 7) return { level: "senior", confidence: 75 };
  if (years >= 4) return { level: "mid", confidence: 75 };
  if (years >= 1) return { level: "junior", confidence: 70 };
  return { level: "entry", confidence: 65 };
}

/**
 * Identify best-fit roles based on skills
 */
function identifyBestRoles(skills, text) {
  const textLower = text.toLowerCase();
  const roleScores = [];

  for (const [role, intelligence] of Object.entries(ROLE_INTELLIGENCE)) {
    let score = 0;

    // Check keywords in text
    for (const keyword of intelligence.keywords) {
      if (textLower.includes(keyword)) score += 15;
    }

    // Check required skill categories
    for (const category of intelligence.requiredSkills) {
      const categorySkills = SKILL_DATABASE[category] || [];
      const matchCount = categorySkills.filter(s =>
        skills.all.some(found => found.toLowerCase() === s.toLowerCase())
      ).length;
      score += matchCount * 5;
    }

    if (score > 10) {
      roleScores.push({ role, score, ...intelligence });
    }
  }

  return roleScores.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Calculate comprehensive ATS score
 */
function calculateATSScore(skills, achievements, experienceLevel, resumeText) {
  let score = 40; // Base score
  const breakdown = {
    keywordRelevance: { score: 40, factors: [], improvements: [] },
    impactMetrics: { score: 40, factors: [], improvements: [] },
    roleAlignment: { score: 40, factors: [], improvements: [] },
    formattingClarity: { score: 50, factors: [], improvements: [] }
  };

  // Keyword Relevance (max +25)
  const skillCount = skills.all.length;
  if (skillCount >= 15) {
    breakdown.keywordRelevance.score = 85;
    breakdown.keywordRelevance.factors.push(`Strong skill coverage (${skillCount} skills identified)`);
  } else if (skillCount >= 10) {
    breakdown.keywordRelevance.score = 75;
    breakdown.keywordRelevance.factors.push(`Good skill coverage (${skillCount} skills)`);
  } else if (skillCount >= 5) {
    breakdown.keywordRelevance.score = 60;
    breakdown.keywordRelevance.factors.push(`Moderate skill coverage (${skillCount} skills)`);
    breakdown.keywordRelevance.improvements.push("Add more relevant technical skills");
  } else {
    breakdown.keywordRelevance.improvements.push("Include more industry-standard keywords");
  }

  // Impact Metrics (max +25)
  if (achievements.length >= 4) {
    breakdown.impactMetrics.score = 90;
    breakdown.impactMetrics.factors.push(`Strong quantified achievements (${achievements.length} found)`);
  } else if (achievements.length >= 2) {
    breakdown.impactMetrics.score = 70;
    breakdown.impactMetrics.factors.push(`Some quantified achievements (${achievements.length} found)`);
    breakdown.impactMetrics.improvements.push("Add more metrics to your achievements");
  } else {
    breakdown.impactMetrics.score = 45;
    breakdown.impactMetrics.improvements.push("Quantify your achievements with numbers, percentages, or dollar amounts");
  }

  // Role Alignment (max +20)
  const levelBonus = { lead: 90, senior: 85, mid: 75, junior: 65, entry: 55 };
  breakdown.roleAlignment.score = levelBonus[experienceLevel] || 60;
  breakdown.roleAlignment.factors.push(`Experience level: ${experienceLevel}`);

  // Formatting (max +15)
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 800) {
    breakdown.formattingClarity.score = 80;
    breakdown.formattingClarity.factors.push("Good resume length");
  } else if (wordCount < 300) {
    breakdown.formattingClarity.score = 55;
    breakdown.formattingClarity.improvements.push("Resume may be too brief - add more details");
  } else {
    breakdown.formattingClarity.score = 60;
    breakdown.formattingClarity.improvements.push("Consider condensing for better readability");
  }

  // Calculate overall
  const overall = Math.round(
    (breakdown.keywordRelevance.score * 0.25) +
    (breakdown.impactMetrics.score * 0.25) +
    (breakdown.roleAlignment.score * 0.25) +
    (breakdown.formattingClarity.score * 0.25)
  );

  // VALIDATION: Ensure ATS score is always in realistic range (40-95)
  // Never perfect (100) - always room for improvement
  // Never below 40 - baseline for any coherent resume
  const validatedScore = Math.min(95, Math.max(40, overall));

  console.log(`[Profile Analysis] ATS Score calculated: ${validatedScore} (raw: ${overall})`);
  return { overall: validatedScore, breakdown };
}

/**
 * Generate intelligent analysis without AI
 */
function extractBasicInfo(input) {
  const { selfDescription, resumeText, selectedSkills, desiredRole, totalExperience, fullName } = input;
  const combinedText = `${selfDescription || ""} ${resumeText || ""}`;
  const combinedLower = combinedText.toLowerCase();

  // Extract comprehensive skills
  const extractedSkills = extractComprehensiveSkills(combinedText);

  // Merge with user-selected skills
  if (selectedSkills?.length > 0) {
    for (const skill of selectedSkills) {
      if (!extractedSkills.all.includes(skill)) {
        extractedSkills.all.push(skill);
        if (SKILL_DATABASE.soft.map(s => s.toLowerCase()).includes(skill.toLowerCase())) {
          extractedSkills.soft.push(skill);
        } else {
          extractedSkills.technical.push(skill);
        }
      }
    }
  }

  // Detect years of experience
  let years = parseInt(totalExperience) || 0;
  if (!years) {
    // Try to extract from text
    const yearsMatch = combinedLower.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/);
    if (yearsMatch) years = parseInt(yearsMatch[1]);
  }

  // Detect experience level
  const { level: experienceLevel, confidence: levelConfidence } = detectExperienceLevel(combinedText, years);

  // Identify best roles
  const normalizedRole = Array.isArray(desiredRole) ? desiredRole[0] : desiredRole;
  const identifiedRoles = identifyBestRoles(extractedSkills, combinedText);

  // Filter skills by context (e.g., remove tech skills that HR recruiters mention but don't have)
  const filteredSkills = filterSkillsByContext(extractedSkills, combinedText, identifiedRoles);
  // Replace extractedSkills with filtered version
  extractedSkills.technical = filteredSkills.technical;
  extractedSkills.all = filteredSkills.all;

  const suggestedRoles = normalizedRole
    ? [normalizedRole, ...identifiedRoles.filter(r => r.role !== normalizedRole).map(r => r.role)]
    : identifiedRoles.map(r => r.role);

  // Get role intelligence for career trajectory
  const primaryRole = identifiedRoles[0] || ROLE_INTELLIGENCE[normalizedRole] || null;

  // Analyze achievements
  const achievements = analyzeAchievements(combinedText);

  // Extract soft skills using advanced detection
  const detectedSoftSkills = extractSoftSkills(combinedText);
  // Merge with any soft skills from SKILL_DATABASE
  for (const skill of detectedSoftSkills) {
    if (!extractedSkills.soft.includes(skill)) {
      extractedSkills.soft.push(skill);
    }
  }

  // Calculate ATS score
  const atsAnalysis = calculateATSScore(extractedSkills, achievements, experienceLevel, combinedText);

  // Identify unique strengths
  const uniqueStrengths = [];
  if (extractedSkills.technical.length >= 10) {
    uniqueStrengths.push("Diverse technical skill set spanning multiple technologies");
  }
  if (achievements.length >= 3) {
    uniqueStrengths.push("Track record of quantifiable achievements and measurable impact");
  }
  if (extractedSkills.soft.length >= 3) {
    uniqueStrengths.push("Strong combination of technical and leadership capabilities");
  }
  if (combinedLower.includes("led") || combinedLower.includes("managed") || combinedLower.includes("built team")) {
    uniqueStrengths.push("Demonstrated experience leading teams and projects");
  }
  if (combinedLower.includes("startup") || combinedLower.includes("founded")) {
    uniqueStrengths.push("Entrepreneurial mindset with startup experience");
  }
  if (uniqueStrengths.length === 0) {
    uniqueStrengths.push(`${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}-level expertise in ${suggestedRoles[0] || "the field"}`);
  }

  // Identify areas to improve (actual gaps, resume-specific, not generic)
  // VALIDATION: weakAreas must ALWAYS have at least 2 actionable suggestions
  const weakAreas = [];

  // Check for achievements/metrics
  if (achievements.length < 2) {
    weakAreas.push("Add quantified achievements to demonstrate impact (e.g., 'Increased sales by 30%', 'Led team of 5')");
  }

  // Check for technical skills depth
  if (extractedSkills.technical.length < 5) {
    weakAreas.push("Expand technical skills section with relevant industry keywords for your target role");
  } else if (extractedSkills.technical.length < 10) {
    weakAreas.push("Consider adding more specific technical skills to improve ATS keyword matching");
  }

  // Check for certifications
  if (!combinedLower.includes("certified") && !combinedLower.includes("certification") && !combinedLower.includes("certificate")) {
    if (suggestedRoles[0]) {
      weakAreas.push(`Consider adding certifications relevant to ${suggestedRoles[0]} roles`);
    } else {
      weakAreas.push("Consider adding industry certifications to strengthen your profile");
    }
  }

  // Check for soft skills
  if (extractedSkills.soft.length < 2) {
    weakAreas.push("Highlight soft skills like leadership, communication, or stakeholder management");
  }

  // Check for project details
  if (!combinedLower.includes("project") && !combinedLower.includes("delivered") && !combinedLower.includes("launched")) {
    weakAreas.push("Include specific project examples with outcomes and your role");
  }

  // Check for education details
  if (!combinedLower.includes("university") && !combinedLower.includes("college") && !combinedLower.includes("degree")) {
    weakAreas.push("Ensure education section is complete with degree, institution, and year");
  }

  // ALWAYS ensure at least 2 suggestions (resume-specific advice)
  const fallbackSuggestions = [
    `Tailor your resume keywords specifically for ${suggestedRoles[0] || "your target"} positions`,
    "Add more action verbs at the start of bullet points (Led, Developed, Achieved, Delivered)",
    "Ensure consistent formatting and clear section headers for better ATS parsing",
    "Include specific technologies, tools, and methodologies you've used",
    "Add LinkedIn profile URL for recruiters to learn more about you"
  ];

  while (weakAreas.length < 2) {
    const suggestion = fallbackSuggestions[weakAreas.length];
    if (!weakAreas.includes(suggestion)) {
      weakAreas.push(suggestion);
    }
  }

  // Market gaps
  const marketGaps = [];
  if (primaryRole) {
    const missingCategories = primaryRole.requiredSkills?.filter(cat => {
      const catSkills = SKILL_DATABASE[cat] || [];
      return !catSkills.some(s => extractedSkills.all.map(e => e.toLowerCase()).includes(s.toLowerCase()));
    });
    if (missingCategories?.length > 0) {
      for (const cat of missingCategories.slice(0, 2)) {
        const suggestions = SKILL_DATABASE[cat]?.slice(0, 3).join(", ");
        if (suggestions) {
          marketGaps.push(`Consider adding ${cat} skills: ${suggestions}`);
        }
      }
    }
  }
  if (marketGaps.length === 0) {
    marketGaps.push("Stay current with emerging technologies in your field");
  }

  // Immediate actions
  const immediateActions = [
    `Tailor your resume for ${suggestedRoles[0] || "target"} positions with relevant keywords`,
    achievements.length < 3 ? "Add 2-3 more quantified achievements to your experience section" : "Highlight your top achievements prominently",
    "Optimize LinkedIn profile to match your resume for recruiter visibility"
  ];

  // Generate professional summary
  const topSkills = extractedSkills.technical.slice(0, 3).join(", ");
  let summary = "";
  if (years > 0 && topSkills) {
    summary = `Results-driven ${experienceLevel}-level ${suggestedRoles[0] || "professional"} with ${years}+ years of experience. Proven expertise in ${topSkills}. ${achievements.length > 0 ? "Track record of delivering measurable business impact." : "Passionate about driving innovation and growth."}`;
  } else if (topSkills) {
    summary = `Motivated ${suggestedRoles[0] || "professional"} with expertise in ${topSkills}. Eager to leverage skills to drive results and contribute to team success.`;
  } else {
    summary = `Dedicated professional seeking opportunities in ${suggestedRoles[0] || "the industry"}. Committed to continuous learning and delivering excellence.`;
  }

  return {
    suggestedRoles: suggestedRoles.slice(0, 3),
    experienceLevel,
    yearsOfExperience: years || null,
    coreSkills: extractedSkills.technical.slice(0, 12),
    softSkills: extractedSkills.soft.slice(0, 6),
    industryFit: primaryRole?.industries || ["Technology", "Business"],
    careerTrajectory: primaryRole?.trajectory || `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} → Senior → Lead → Director`,
    uniqueStrengths,
    weakAreas,
    marketGaps,
    immediateActions,
    summary,
    confidenceScore: Math.min(85, 50 + (extractedSkills.all.length * 2) + (achievements.length * 5)),
    aiPowered: false,
    analysisMethod: "intelligent-rule-based",
    achievements: achievements.slice(0, 3),
    atsScoreBreakdown: {
      overall: atsAnalysis.overall,
      // Flat scores for frontend compatibility
      keywordRelevance: atsAnalysis.breakdown.keywordRelevance?.score || 50,
      impactMetrics: atsAnalysis.breakdown.impactMetrics?.score || 50,
      roleAlignment: atsAnalysis.breakdown.roleAlignment?.score || 50,
      formattingClarity: atsAnalysis.breakdown.formattingClarity?.score || 50,
      // Detailed breakdown with factors and improvements
      breakdown: atsAnalysis.breakdown
    }
  };
}

/**
 * Analyze user profile using AI
 *
 * @param {Object} input - User profile data
 * @returns {Promise<Object>} - Comprehensive profile analysis
 */
export async function analyzeProfile(input) {
  const {
    selfDescription,
    resumeText,
    linkedinText,
    desiredRole,
    locations,
    totalExperience,
    fullName,
    selectedSkills
  } = input;

  // Normalize desiredRole (handle array or string)
  const normalizedRole = Array.isArray(desiredRole) ? desiredRole[0] : desiredRole;

  // Check if AI is available
  if (!isAIAvailable()) {
    console.log("[Profile Analysis] Using intelligent rule-based analysis");
    const intelligentAnalysis = extractBasicInfo(input);
    return intelligentAnalysis;
  }

  // Build comprehensive user prompt with all available data
  const userPrompt = `
CANDIDATE PROFILE TO ANALYZE:

Name: ${fullName || "Not provided"}

Self-Description:
${selfDescription || "Not provided"}

Resume/CV Content:
${resumeText || "No resume provided"}

LinkedIn Profile:
${linkedinText || "Not provided"}

Target Role: ${normalizedRole || "Open to suggestions"}
Total Experience: ${totalExperience ? `${totalExperience} years` : "Not specified"}
Skills Listed: ${selectedSkills?.join(", ") || "Not specified"}
Preferred Locations: ${locations?.join(", ") || "Flexible"}

Please provide a thorough career analysis for this candidate. Be specific to THEIR situation - avoid generic advice. If limited information is provided, acknowledge this and do the best analysis possible with available data.`;

  // Run career analysis + ATS analysis in PARALLEL for speed
  console.log("[Profile Analysis] Calling AI for career analysis + ATS in parallel...");

  const atsPrompt = `
Analyze this profile for ATS (Applicant Tracking System) optimization:

Target Role: ${normalizedRole || "General"}

Resume/Profile Content:
${resumeText || selfDescription || "Limited content provided"}

Skills: ${selectedSkills?.join(", ") || "Not specified"}
Experience: ${totalExperience || 0} years

Provide specific ATS scoring and actionable improvements.`;

  const [analysisResponse, atsResponse] = await Promise.all([
    callAI(CAREER_ANALYST_PROMPT, userPrompt, {
      model: "fast",
      maxTokens: 2000,
      temperature: 0.4
    }),
    callAI(ATS_ANALYST_PROMPT, atsPrompt, {
      model: "fast",
      maxTokens: 1500,
      temperature: 0.3
    })
  ]);

  // Parse AI responses with fallbacks
  const fallbackAnalysis = extractBasicInfo(input);
  let analysis = parseAIResponse(analysisResponse, fallbackAnalysis);
  analysis.aiPowered = analysisResponse !== null;

  const atsAnalysis = parseAIResponse(atsResponse, {
    overall: 55,
    keywordRelevance: { score: 50, feedback: "AI analysis in progress" },
    impactMetrics: { score: 50, feedback: "AI analysis in progress" },
    roleAlignment: { score: 55, feedback: "AI analysis in progress" },
    formattingClarity: { score: 60, feedback: "AI analysis in progress" },
    topImprovements: analysis.weakAreas || []
  });

  // Combine analyses - AI weakAreas/marketGaps take priority (real insights)
  const aiWeakAreas = analysis.weakAreas;
  const aiMarketGaps = analysis.marketGaps;

  const result = {
    ...analysis,
    atsScoreBreakdown: {
      overall: atsAnalysis.overall || 55,
      keywordRelevance: atsAnalysis.keywordRelevance?.score || 50,
      impactMetrics: atsAnalysis.impactMetrics?.score || 50,
      roleAlignment: atsAnalysis.roleAlignment?.score || 55,
      formattingClarity: atsAnalysis.formattingClarity?.score || 60,
      breakdown: {
        keywordRelevance: {
          score: atsAnalysis.keywordRelevance?.score || 50,
          factors: atsAnalysis.keywordRelevance?.found || [],
          improvements: atsAnalysis.keywordRelevance?.missing || []
        },
        impactMetrics: {
          score: atsAnalysis.impactMetrics?.score || 50,
          factors: atsAnalysis.impactMetrics?.examples || [],
          improvements: atsAnalysis.impactMetrics?.improvements || []
        },
        roleAlignment: {
          score: atsAnalysis.roleAlignment?.score || 55,
          factors: atsAnalysis.roleAlignment?.strengths || [],
          improvements: atsAnalysis.roleAlignment?.gaps || []
        },
        formattingClarity: {
          score: atsAnalysis.formattingClarity?.score || 60,
          factors: atsAnalysis.formattingClarity?.positives || [],
          improvements: atsAnalysis.formattingClarity?.issues || []
        }
      },
      topImprovements: atsAnalysis.topImprovements || aiWeakAreas || []
    },
    // Use AI-generated weakAreas and marketGaps (real insights, not hardcoded)
    weakAreas: (aiWeakAreas?.length >= 3) ? aiWeakAreas : (atsAnalysis.topImprovements || aiWeakAreas || []),
    marketGaps: (aiMarketGaps?.length >= 3) ? aiMarketGaps : (aiMarketGaps || [])
  };

  console.log(`[Profile Analysis] weakAreas: ${result.weakAreas?.length} items, marketGaps: ${result.marketGaps?.length} items`);
  return result;
}
