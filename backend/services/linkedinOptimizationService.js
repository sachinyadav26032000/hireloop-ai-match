/**
 * LinkedIn Optimization Service
 * Provides before/after improvements for LinkedIn profiles
 * Includes skill recommendations and certification suggestions
 */
import { callAI, parseAIResponse } from "./aiAdapter.js";

const SYSTEM_PROMPT = `You are a LinkedIn optimization expert and recruiter who knows exactly what hiring managers search for.
Analyze and improve LinkedIn profile sections for maximum recruiter visibility.

Return ONLY valid JSON in this format:
{
  "headline": {
    "before": "original or empty",
    "after": "optimized headline with keywords",
    "tips": ["tip1", "tip2"]
  },
  "about": {
    "before": "original or empty",
    "after": "optimized about section",
    "tips": ["tip1", "tip2"]
  },
  "experienceBullets": [
    {
      "role": "Job Title",
      "before": ["original bullet"],
      "after": ["improved bullet with metrics"]
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "overallScore": 75,
  "topRecommendations": ["recommendation1", "recommendation2"],
  "skillsToAdd": ["skill1", "skill2"],
  "skillsToRemove": ["outdated skill1"],
  "certifications": ["certification recommendation 1", "certification recommendation 2"]
}`;

// Skills to add by role
const ROLE_SKILLS_RECOMMENDATIONS = {
  "Software Engineer": {
    add: ["System Design", "Code Review", "Agile Methodologies", "CI/CD", "Technical Documentation"],
    remove: ["Microsoft Office", "Typing"],
    certifications: [
      "AWS Certified Developer Associate",
      "Google Cloud Professional Developer",
      "Kubernetes Certified Developer (CKAD)"
    ]
  },
  "Frontend Developer": {
    add: ["React.js", "TypeScript", "Responsive Design", "Web Performance", "Accessibility (a11y)"],
    remove: ["Flash", "jQuery (unless needed)", "Table-based layouts"],
    certifications: [
      "Meta Front-End Developer Certificate",
      "AWS Certified Cloud Practitioner",
      "Google UX Design Certificate (for UX understanding)"
    ]
  },
  "Backend Developer": {
    add: ["API Design", "Database Optimization", "Microservices", "Container Orchestration", "Security Best Practices"],
    remove: ["COBOL (unless relevant)", "Legacy frameworks"],
    certifications: [
      "AWS Certified Solutions Architect",
      "MongoDB Certified Developer",
      "Kubernetes Certified Administrator (CKA)"
    ]
  },
  "Data Analyst": {
    add: ["Python", "SQL", "Data Visualization", "Business Intelligence", "Statistical Analysis"],
    remove: ["Basic Excel (upgrade to Advanced Excel)", "Manual data entry"],
    certifications: [
      "Google Data Analytics Certificate",
      "Microsoft Power BI Data Analyst",
      "Tableau Desktop Specialist"
    ]
  },
  "Product Manager": {
    add: ["Product Strategy", "Roadmapping", "User Research", "A/B Testing", "Stakeholder Management"],
    remove: ["Generic project management", "Administrative skills"],
    certifications: [
      "Product School Product Manager Certificate",
      "Pragmatic Institute Product Master",
      "Google Project Management Certificate"
    ]
  },
  "Marketing Manager": {
    add: ["Performance Marketing", "Google Analytics", "Marketing Automation", "Content Strategy", "SEO/SEM"],
    remove: ["Traditional advertising (unless relevant)", "Cold calling"],
    certifications: [
      "Google Analytics Certification",
      "HubSpot Inbound Marketing Certification",
      "Meta Blueprint Certification"
    ]
  },
  "UX Designer": {
    add: ["User Research", "Figma", "Design Systems", "Usability Testing", "Information Architecture"],
    remove: ["Photoshop (unless needed)", "Print design skills"],
    certifications: [
      "Google UX Design Professional Certificate",
      "Nielsen Norman UX Certificate",
      "Interaction Design Foundation Certificate"
    ]
  },
  "Sales Executive": {
    add: ["Salesforce", "Pipeline Management", "Consultative Selling", "Account Management", "Negotiation"],
    remove: ["Cold calling (frame as outbound)", "Door-to-door sales"],
    certifications: [
      "Salesforce Administrator Certification",
      "HubSpot Sales Software Certification",
      "SPIN Selling Certification"
    ]
  },
  "HR Manager": {
    add: ["HRIS Systems", "Talent Acquisition", "Employee Engagement", "Performance Management", "Employment Law"],
    remove: ["Filing", "Data entry"],
    certifications: [
      "SHRM-CP (Certified Professional)",
      "PHR (Professional in Human Resources)",
      "LinkedIn Recruiter Certification"
    ]
  },
  "Business Development": {
    add: ["Partnership Development", "Lead Generation", "Market Research", "CRM Management", "Strategic Planning"],
    remove: ["Telemarketing", "Generic sales"],
    certifications: [
      "Salesforce Certified Sales Professional",
      "HubSpot Sales Enablement Certification",
      "Negotiation from Harvard Business School Online"
    ]
  }
};

// Default recommendations for roles not in the map
const DEFAULT_SKILLS_RECOMMENDATIONS = {
  add: ["Project Management", "Data Analysis", "Communication", "Strategic Thinking", "Cross-functional Collaboration"],
  remove: ["Microsoft Word (unless specific)", "Typing speed", "Generic office skills"],
  certifications: [
    "Google Project Management Certificate",
    "LinkedIn Learning Certifications in your field",
    "Industry-specific certifications from professional associations"
  ]
};

function generateMockLinkedInOptimization(input) {
  const { profileAnalysis, currentLinkedin, userInfo } = input;
  const targetRole = profileAnalysis?.suggestedRoles?.[0] || "Professional";
  const skills = profileAnalysis?.coreSkills || ["Problem Solving", "Communication"];
  const level = profileAnalysis?.experienceLevel || "mid";
  const name = userInfo?.fullName?.split(" ")[0] || "Professional";
  const location = userInfo?.location || "";

  // Get role-specific recommendations
  const roleRecommendations = ROLE_SKILLS_RECOMMENDATIONS[targetRole] || DEFAULT_SKILLS_RECOMMENDATIONS;

  const levelTitles = {
    entry: `${targetRole} | ${skills[0]} | ${skills[1] || "Building Great Products"} | Open to Opportunities`,
    junior: `${targetRole} at [Company] | ${skills.slice(0, 2).join(" • ")} | Helping teams ship faster`,
    mid: `Senior ${targetRole} | ${skills[0]} • ${skills[1] || "Leadership"} | Driving Results That Matter`,
    senior: `Staff ${targetRole} | ${skills[0]} Expert | Technical Leader | Previously @[Company]`,
    lead: `Principal ${targetRole} | ${skills[0]} Architect | Building Teams & Systems at Scale`
  };

  const levelAbout = {
    entry: `Early-career ${targetRole} passionate about ${skills[0]} and building products that matter.

Currently focused on:
• Developing expertise in ${skills.slice(0, 3).join(", ")}
• Building a strong foundation in ${profileAnalysis?.industryFit?.[0] || "technology"}
• Collaborating with cross-functional teams to deliver results

What I bring:
${skills.slice(0, 3).map(s => `✓ ${s}`).join("\n")}

I'm actively looking for opportunities where I can contribute, learn, and grow. If you're building something interesting, let's connect.

📩 Best way to reach me: [Email]`,

    junior: `${targetRole} with ${profileAnalysis?.yearsOfExperience || 2}+ years of hands-on experience building products that users love.

What I do:
I specialize in ${skills.slice(0, 3).join(", ")}, with a track record of delivering projects that drive business impact.

Recent wins:
• Delivered features that improved user engagement by 20%+
• Collaborated with product and design to ship 10+ successful releases
• Mentored junior team members on best practices

Core strengths:
${skills.slice(0, 4).map(s => `• ${s}`).join("\n")}

Currently exploring opportunities in ${location ? location : "growth-stage companies"} where I can make a meaningful impact.

Let's connect: [Email]`,

    mid: `Results-driven ${targetRole} with ${profileAnalysis?.yearsOfExperience || 5}+ years leading technical initiatives and delivering measurable business outcomes.

My focus areas:
${skills.slice(0, 4).map(s => `◆ ${s}`).join("\n")}

Career highlights:
→ Led team of 5+ on product launches generating $1M+ revenue
→ Improved system performance by 40%, reducing infrastructure costs
→ Promoted twice for exceeding quarterly objectives

What I look for:
I thrive in environments that value ownership, impact, and continuous learning. Interested in roles where I can lead technical direction and mentor growing teams.

Currently: Open to senior/lead opportunities in ${location || "innovative tech companies"}.

📬 Reach out: [Email] or DM me here`,

    senior: `Technical leader with ${profileAnalysis?.yearsOfExperience || 10}+ years architecting systems at scale and building high-performing teams.

As a ${targetRole}, I've:
→ Led teams of 10-20 engineers across multiple time zones
→ Architected systems serving millions of daily active users
→ Driven technical strategy for multi-million dollar initiatives
→ Saved organizations $500K+ through technical optimization

Expertise:
${skills.slice(0, 5).map(s => `• ${s}`).join("\n")}

I'm passionate about:
1. Building products that scale
2. Developing engineering talent
3. Creating cultures of technical excellence

Currently exploring: ${level === "senior" ? "Staff/Principal" : "Director"} roles in ${location || "high-growth companies"}.

Conference speaker | Technical blogger | Open source contributor

Let's connect if you're tackling interesting problems.`,

    lead: `Engineering leader and ${targetRole} with ${profileAnalysis?.yearsOfExperience || 12}+ years building products and teams at scale.

My impact:
• Built and scaled engineering teams from 5 to 50+ engineers
• Architected platforms processing 100M+ requests daily
• Led digital transformation initiatives saving $2M+ annually
• Established engineering practices adopted company-wide

Areas of expertise:
${skills.slice(0, 5).map(s => `◼ ${s}`).join("\n")}

What I bring to organizations:
✓ Technical vision and strategy
✓ Team building and culture development
✓ Cross-functional leadership
✓ Board and executive communication

Currently exploring opportunities as: VP Engineering, Director of Engineering, CTO

Let's connect: [Email]`
  };

  // Calculate realistic score based on input
  let overallScore = 60; // Base score
  if (profileAnalysis?.coreSkills?.length > 5) overallScore += 10;
  if (level === "mid" || level === "senior") overallScore += 10;
  if (currentLinkedin?.about && currentLinkedin.about.length > 100) overallScore += 5;
  overallScore = Math.min(85, overallScore); // Cap at 85 for mock

  return {
    headline: {
      before: currentLinkedin?.headline || `${targetRole}`,
      after: levelTitles[level] || levelTitles.mid,
      tips: [
        "Include your specialty and 2-3 key skills separated by | or •",
        "Add a value proposition (what you help companies achieve)",
        "Use industry keywords that recruiters search for",
        "Keep it under 120 characters for mobile visibility",
      ],
    },
    about: {
      before: currentLinkedin?.about || "I am a professional looking for new opportunities.",
      after: levelAbout[level] || levelAbout.mid,
      tips: [
        "Start with a strong hook - who you are and what you do",
        "Include 3-5 quantifiable achievements with numbers",
        "Use bullet points and line breaks for scanability",
        "End with a clear call-to-action (email, DM preference)",
        "Include relevant keywords naturally throughout",
      ],
    },
    experienceBullets: [
      {
        role: targetRole,
        before: [
          "Worked on various projects",
          "Responsible for development tasks",
          "Collaborated with team members"
        ],
        after: [
          `Led development of ${skills[0]}-focused features resulting in 30% increase in user engagement`,
          `Optimized ${skills[1] || "core systems"} reducing operational costs by $50K annually`,
          `Mentored 3 junior team members, with 2 receiving promotions within 18 months`
        ],
      },
    ],
    keywords: [
      targetRole,
      ...skills.slice(0, 4),
      level === "senior" ? "Tech Lead" : "Team Collaboration",
      "Results-driven",
      profileAnalysis?.industryFit?.[0] || "Technology"
    ],
    overallScore,
    topRecommendations: [
      "Add a professional headshot — profiles with photos get 21x more views and 36x more messages",
      "List your top 50 skills and get endorsements from colleagues — prioritize role-specific skills",
      "Request 3-5 recommendations from managers and colleagues who can speak to your impact",
      "Post or engage with content weekly — consistent activity boosts profile visibility by 5x",
      "Customize your LinkedIn URL (linkedin.com/in/yourname) for a cleaner, professional look",
      "Turn on 'Open to Work' privately so only recruiters see you're looking",
    ],
    skillsToAdd: roleRecommendations.add,
    skillsToRemove: roleRecommendations.remove,
    certifications: roleRecommendations.certifications
  };
}

export async function optimizeLinkedIn(input) {
  const { profileAnalysis, currentLinkedin, userInfo } = input;

  const userPrompt = `
Optimize this LinkedIn profile for a ${profileAnalysis?.experienceLevel || "mid-level"} professional:

Name: ${userInfo?.fullName || "Not provided"}
Target Role: ${profileAnalysis?.suggestedRoles?.[0] || "Not specified"}
Experience Level: ${profileAnalysis?.experienceLevel || "Not specified"}
Years of Experience: ${profileAnalysis?.yearsOfExperience || "Not specified"}
Core Skills: ${profileAnalysis?.coreSkills?.join(", ") || "Not specified"}
Location: ${userInfo?.location || "Not specified"}

Current LinkedIn URL/Profile: ${currentLinkedin?.url || "Not provided"}
Current LinkedIn Headline: ${currentLinkedin?.headline || "Not provided"}
Current LinkedIn About: ${currentLinkedin?.about || "Not provided"}
Current Experience: ${currentLinkedin?.experience || "Not provided"}

Provide:
1. Optimized headline with keywords recruiters search for
2. Compelling About section with achievements and metrics
3. Skills to add and remove
4. Relevant certifications to pursue
5. Actionable recommendations

Be realistic with scoring - most profiles score 60-75, only exceptional ones score 80+.
Return as JSON.`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, { maxTokens: 2500 });
  const mockData = generateMockLinkedInOptimization(input);

  return parseAIResponse(response, mockData);
}
