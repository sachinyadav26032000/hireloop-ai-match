/**
 * LinkedIn Optimization Service - AI-POWERED
 *
 * Uses GPT to create recruiter-optimized LinkedIn content:
 * - Personalized headlines that get found in searches
 * - Compelling About sections that tell your story
 * - Experience bullets that showcase impact
 * - SEO-optimized keywords for visibility
 *
 * CRITICAL: Only uses provided data - never invents facts.
 */
import { callAI, parseAIResponse, isAIAvailable } from "./aiAdapter.js";

/**
 * System prompt for LinkedIn headline optimization
 */
const HEADLINE_OPTIMIZER_PROMPT = `You are a LinkedIn optimization expert who has helped thousands of professionals increase their profile visibility and land interviews.

Your task is to create an OPTIMAL LinkedIn headline for this candidate.

HEADLINE BEST PRACTICES:
- 120 characters max (LinkedIn truncates beyond this)
- Front-load with searchable job title
- Include 2-3 high-demand skills separated by |
- Add credibility markers (years experience, certifications, notable companies)
- Use keywords recruiters actually search for

HEADLINE FORMULAS THAT WORK:
1. [Role] | [Skill] | [Skill] | [Credibility]
2. [Role] at [Company Type] | [Specialty] | [Result]
3. Senior [Role] | Helping [audience] achieve [outcome]

Examples:
- "Senior Software Engineer | React | Node.js | AWS | 8+ Years Building Scalable Systems"
- "Product Manager | B2B SaaS | Data-Driven Growth | Ex-Google, Ex-Stripe"
- "Data Scientist | ML/AI | Python | Turning Data Into Business Decisions"

Return ONLY a JSON object:
{
  "headline": "The optimized headline",
  "reasoning": "Why this headline works for this candidate",
  "keywords": ["searchable", "keywords", "included"],
  "alternativeHeadlines": ["Alternative option 1", "Alternative option 2"]
}`;

/**
 * System prompt for LinkedIn About section
 */
const ABOUT_SECTION_PROMPT = `You are a professional storyteller and LinkedIn expert who crafts compelling About sections that convert profile views into opportunities.

Write a powerful LinkedIn About section for this candidate.

ABOUT SECTION STRUCTURE (2000-2600 characters optimal):

PARAGRAPH 1 - THE HOOK (2-3 sentences)
Start with a compelling statement that establishes who they are and their unique value.
Not "I am a..." but rather lead with impact or passion.

PARAGRAPH 2 - EXPERTISE (bullet points)
List 6-8 key skills and competencies in bullet format.
Use • character for bullets.
These should be searchable keywords.

PARAGRAPH 3 - ACHIEVEMENTS (2-3 bullets)
Highlight quantified achievements from their experience.
Use metrics where available.
Show impact, not responsibilities.

PARAGRAPH 4 - WHAT DRIVES THEM (1-2 sentences)
Add personality - what excites them about their work.
This builds connection with readers.

PARAGRAPH 5 - CALL TO ACTION (1-2 sentences)
What are they looking for?
How can people connect?

WRITING RULES:
- Write in first person (I, my, me)
- Be specific to THIS person - no generic filler
- Include keywords naturally for SEO
- Keep paragraphs short for mobile readability
- Sound confident but authentic, not arrogant

Return ONLY a JSON object:
{
  "about": "The complete About section with proper formatting and line breaks",
  "wordCount": number,
  "keywordsIncluded": ["list", "of", "keywords"],
  "structureUsed": "Brief description of the structure"
}`;

/**
 * System prompt for comprehensive LinkedIn optimization
 */
const LINKEDIN_OPTIMIZER_PROMPT = `You are a LinkedIn profile optimization expert and recruiter who understands exactly what makes profiles stand out and get found.

Provide comprehensive LinkedIn optimization recommendations for this candidate.

Analyze their profile and provide:

1. HEADLINE - Optimized headline (120 chars max)
2. ABOUT - Compelling About section (2000-2600 chars)
3. EXPERIENCE TIPS - How to improve their experience section
4. SKILLS - Which skills to prioritize and add
5. KEYWORDS - SEO keywords they should include
6. ACTIONABLE TIPS - Specific improvements they can make today

IMPORTANT:
- Base everything on the information provided
- Don't invent achievements or experience
- Be specific to their role and industry
- Focus on what recruiters search for

Return ONLY valid JSON:
{
  "headline": {
    "suggested": "The optimized headline",
    "reasoning": "Why this works",
    "keywords": ["included", "keywords"]
  },
  "about": {
    "suggested": "The complete About section",
    "structure": "How it's organized",
    "keyHighlights": ["Key points included"]
  },
  "experienceTips": [
    {
      "tip": "Specific tip",
      "example": "How to apply it",
      "impact": "Why it matters"
    }
  ],
  "skillsRecommendations": {
    "topSkillsToFeature": ["Skills to pin to top"],
    "skillsToAdd": ["Missing skills for their role"],
    "orderingAdvice": "How to order skills"
  },
  "keywordsToInclude": ["searchable", "keywords", "for", "their", "role"],
  "actionableTips": [
    "Specific action 1",
    "Specific action 2",
    "Specific action 3"
  ],
  "overallScore": 0-100,
  "scoreExplanation": "Why this score"
}`;

/**
 * Generate basic optimization without AI
 */
function generateBasicOptimization(input) {
  const { profileAnalysis, userInfo, resumeText } = input;
  const targetRole = profileAnalysis?.suggestedRoles?.[0] || "Professional";
  const skills = profileAnalysis?.coreSkills || [];
  const years = profileAnalysis?.yearsOfExperience || 0;
  const level = profileAnalysis?.experienceLevel || "mid";

  // Basic headline
  const topSkills = skills.slice(0, 2);
  let headline = targetRole;
  if (topSkills.length > 0) {
    headline += ` | ${topSkills.join(" | ")}`;
  }
  if (years > 0) {
    headline += ` | ${years}+ Years`;
  }

  // Basic about
  const levelText = level.charAt(0).toUpperCase() + level.slice(1);
  let about = `${levelText}-level ${targetRole} with ${years > 0 ? `${years}+ years of experience` : "a passion for the field"}.`;
  if (skills.length > 0) {
    about += `\n\nCore competencies:\n${skills.slice(0, 6).map(s => `• ${s}`).join("\n")}`;
  }
  about += "\n\nOpen to new opportunities and connections.";

  return {
    headline: {
      suggested: headline,
      reasoning: "Basic headline generated without AI. Configure OPENAI_API_KEY for personalized optimization.",
      keywords: skills.slice(0, 5),
      hasActualData: skills.length > 0
    },
    about: {
      suggested: about,
      structure: "Basic structure",
      keyHighlights: []
    },
    experienceTips: [
      { tip: "Add quantified achievements", example: "Increased X by Y%", impact: "Shows measurable impact" },
      { tip: "Start bullets with action verbs", example: "Led, Developed, Achieved", impact: "More impactful" },
      { tip: "Include relevant keywords", example: "Add industry terms", impact: "Better ATS matching" }
    ],
    skillsRecommendations: {
      topSkillsToFeature: skills.slice(0, 3),
      skillsToAdd: [],
      orderingAdvice: "Order by relevance to target role"
    },
    keywordsToInclude: skills.slice(0, 8),
    actionableTips: [
      "Configure OPENAI_API_KEY for AI-powered LinkedIn optimization",
      "Add a professional headshot",
      "Enable 'Open to Work' for recruiters",
      "Get 2-3 recommendations from colleagues"
    ],
    overallScore: 45,
    scoreExplanation: "Limited analysis without AI. Set OPENAI_API_KEY for comprehensive optimization.",
    aiPowered: false,
    warning: "Basic optimization generated without AI."
  };
}

/**
 * Optimize LinkedIn profile using AI
 *
 * @param {Object} input - Profile data
 * @returns {Promise<Object>} - Comprehensive LinkedIn optimization
 */
export async function optimizeLinkedIn(input) {
  const { profileAnalysis, currentLinkedin, userInfo } = input;

  // Extract all available data
  const resumeText = input.resumeText ||
                     userInfo?.resumeText ||
                     input.existingResume || "";
  const selfDescription = input.selfDescription ||
                          userInfo?.selfDescription || "";
  const targetRole = profileAnalysis?.suggestedRoles?.[0] || "";
  const skills = profileAnalysis?.coreSkills || [];
  const softSkills = profileAnalysis?.softSkills || [];
  const years = profileAnalysis?.yearsOfExperience || 0;
  const level = profileAnalysis?.experienceLevel || "mid";
  const location = userInfo?.location || userInfo?.locations?.[0] || "";
  const industryFit = profileAnalysis?.industryFit || [];
  const uniqueStrengths = profileAnalysis?.uniqueStrengths || [];
  const careerTrajectory = profileAnalysis?.careerTrajectory || "";

  // Check if AI is available
  if (!isAIAvailable()) {
    console.warn("[LinkedIn Optimization] AI not available - returning basic optimization");
    return generateBasicOptimization(input);
  }

  // Build comprehensive prompt
  const userPrompt = `
CANDIDATE PROFILE FOR LINKEDIN OPTIMIZATION:

Target Role: ${targetRole || "Open to opportunities"}
Experience Level: ${level} (${years} years)
Location: ${location || "Not specified"}

Self-Description:
${selfDescription || "Not provided"}

Resume/Experience:
${resumeText?.slice(0, 2000) || "No resume provided"}

Current LinkedIn Summary (if any):
${currentLinkedin || "Not provided"}

Skills Identified:
Technical: ${skills.join(", ") || "Not specified"}
Soft Skills: ${softSkills.join(", ") || "Not specified"}

Industries: ${industryFit.join(", ") || "Not specified"}

Career Assessment:
${careerTrajectory || "Not available"}

Unique Strengths:
${uniqueStrengths.join(", ") || "Not identified"}

Please provide comprehensive LinkedIn optimization that will help this candidate:
1. Get found by recruiters searching for ${targetRole || "relevant roles"}
2. Stand out from other candidates at the ${level} level
3. Convert profile views into connection requests and opportunities

Be specific to THIS candidate - avoid generic advice.`;

  console.log("[LinkedIn Optimization] Calling AI for comprehensive optimization...");
  const optimizationResponse = await callAI(LINKEDIN_OPTIMIZER_PROMPT, userPrompt, {
    model: "fast", // Use GPT-4o-mini (cost-effective)
    maxTokens: 3000,
    temperature: 0.7
  });

  // Parse response with fallback
  const fallback = generateBasicOptimization(input);
  const optimization = parseAIResponse(optimizationResponse, fallback);

  // Mark as AI-powered
  optimization.aiPowered = optimizationResponse !== null;

  // Ensure all expected fields exist
  if (!optimization.headline) {
    optimization.headline = fallback.headline;
  }
  if (!optimization.about) {
    optimization.about = fallback.about;
  }
  if (!optimization.experienceTips) {
    optimization.experienceTips = fallback.experienceTips;
  }
  if (!optimization.skillsRecommendations) {
    optimization.skillsRecommendations = fallback.skillsRecommendations;
  }
  if (!optimization.actionableTips) {
    optimization.actionableTips = fallback.actionableTips;
  }

  // Add metadata
  optimization.dataSource = {
    note: "Recommendations based on your provided profile information.",
    aiEnhanced: optimizationResponse !== null
  };

  // Add certification recommendations based on role
  optimization.certifications = {
    recommended: getCertificationsForRole(targetRole),
    role: targetRole,
    tip: "Certifications boost credibility and help you rank higher in recruiter searches."
  };

  // Add general tips that are always relevant
  optimization.generalTips = {
    profileCompleteness: [
      "Add a professional headshot - profiles with photos get 21x more views",
      "Customize your LinkedIn URL (linkedin.com/in/yourname)",
      "Add Featured section to showcase work samples or achievements",
      "Request 2-3 recommendations from colleagues or managers"
    ],
    recruiterVisibility: [
      "Enable 'Open to Work' with 'Recruiters Only' option for discreet job searching",
      `Follow companies hiring for ${targetRole || "your target"} roles`,
      "Engage with content weekly - comment on 3-5 posts",
      "Join 3-5 relevant industry groups"
    ],
    profileSEO: [
      "Include your target job title in headline, summary, and current position",
      "Use industry-standard terminology (React not ReactJS)",
      "Include both acronyms and full terms (SEO and Search Engine Optimization)",
      "Mirror keywords from job descriptions you're targeting"
    ]
  };

  return optimization;
}

/**
 * Get relevant certifications for a role
 */
function getCertificationsForRole(role) {
  const roleLower = (role || "").toLowerCase();

  const certMap = {
    "software": ["AWS Certified Developer", "Google Cloud Professional", "Kubernetes Administrator"],
    "frontend": ["Meta Front-End Developer", "AWS Cloud Practitioner", "Google UX Design"],
    "backend": ["AWS Solutions Architect", "MongoDB Developer", "Docker Certified Associate"],
    "data": ["Google Data Analytics", "AWS Data Analytics", "Databricks Certified"],
    "product": ["Product School Certification", "Pragmatic Institute", "Scrum Product Owner"],
    "devops": ["AWS DevOps Engineer", "Kubernetes CKA", "HashiCorp Terraform"],
    "ux": ["Google UX Design", "Nielsen Norman UX", "Interaction Design Foundation"],
    "manager": ["PMP", "Scrum Master CSM", "Six Sigma Green Belt"],
    "marketing": ["Google Ads", "HubSpot Inbound", "Meta Blueprint"],
    "sales": ["Salesforce Administrator", "HubSpot Sales", "Sandler Training"],
    "analyst": ["Google Data Analytics", "Microsoft Power BI", "Tableau Desktop"],
    "security": ["CISSP", "CompTIA Security+", "AWS Security Specialty"],
    "cloud": ["AWS Solutions Architect", "Google Cloud Architect", "Azure Administrator"],
  };

  for (const [key, certs] of Object.entries(certMap)) {
    if (roleLower.includes(key)) {
      return certs;
    }
  }

  return ["Industry-relevant certifications", "Leadership certifications"];
}
