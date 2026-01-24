/**
 * AI Assistant Routes - PRODUCTION GRADE
 *
 * REQUIREMENTS:
 * 1. Session integrity - each analysis creates a new session
 * 2. Resume uploads override all previous data
 * 3. Name/email mismatch detection
 * 4. Graceful error handling - no "failed" errors to users
 * 5. User profile management by email
 */
import express from "express";
import multer from "multer";
import { analyzeProfile } from "../services/profileAnalysisService.js";
import { generateCV, cvToHTML } from "../services/cvGenerationService.js";
import { optimizeLinkedIn } from "../services/linkedinOptimizationService.js";
import { matchJobs, isJobMatchingAvailable } from "../services/jobMatchingService.js";
import { parseResumeFile, detectDataMismatches, generateResumeSuggestions, generateBasicSuggestions } from "../services/resumeParserService.js";
import { isMockMode, getAIMode } from "../services/aiAdapter.js";
import { getApiStatus } from "../services/jobApiAdapter.js";
import {
  validateProfileInput,
  validateResume,
  formatValidationErrors,
} from "../lib/validation.js";
import {
  createSession,
  getSession,
  updateSession,
  handleResumeUpload as sessionHandleResumeUpload,
  addSessionWarning,
  markStepCompleted,
  saveUserProfile,
  getUserProfiles,
  getSessionStats
} from "../services/sessionService.js";

const router = express.Router();

// Configure multer for file uploads (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    const allowedExtensions = ["pdf", "docx", "doc", "txt"];
    const ext = file.originalname.split(".").pop()?.toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload PDF, DOCX, DOC, or TXT files."));
    }
  },
});

/**
 * Upload and parse resume file
 * POST /assistant/upload-resume
 *
 * PRODUCTION GRADE:
 * - FAIL-SAFE: Always returns success, never blocks user
 * - Extracts text and structured data from uploaded resume
 * - Detects name/email mismatches with form data
 * - Session ID tracking for data integrity
 */
router.post("/upload-resume", upload.single("resume"), async (req, res) => {
  // Default empty result for graceful degradation
  const emptyResult = {
    text: "",
    wordCount: 0,
    extractedData: {
      name: null,
      email: null,
      phone: null,
      linkedin: null,
      skills: [],
      suggestedRoles: [],
    },
  };

  try {
    if (!req.file) {
      return res.json({
        success: true,
        data: emptyResult,
        message: "No file provided. Please upload a resume.",
      });
    }

    const result = await parseResumeFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!result.success || !result.text) {
      console.log("[Assistant] Resume parsing issue (gracefully degrading):", result.error);
      return res.json({
        success: true,
        data: emptyResult,
        message: "Resume uploaded, but text extraction was limited. Please check your file format.",
      });
    }

    // Check for mismatches with form data if provided in request body
    const formData = {
      fullName: req.body?.fullName,
      email: req.body?.email,
      phone: req.body?.phone
    };

    let mismatches = [];
    if (formData.fullName || formData.email) {
      mismatches = detectDataMismatches(formData, result.extractedData);
    }

    // Create or update session if sessionId provided
    const sessionId = req.body?.sessionId;
    if (sessionId) {
      sessionHandleResumeUpload(sessionId, req.file.originalname);
    }

    // Generate AI-powered suggestions (async, don't block)
    let aiSuggestions = null;
    try {
      console.log("[Assistant] Generating suggestions for text length:", result.text?.length);
      aiSuggestions = await generateResumeSuggestions(result.text);
      console.log("[Assistant] AI suggestions result:", aiSuggestions ? "received" : "null");
      if (!aiSuggestions) {
        // Fallback to basic suggestions
        console.log("[Assistant] Using basic suggestions fallback");
        aiSuggestions = generateBasicSuggestions(result.extractedData, result.text);
        console.log("[Assistant] Basic suggestions:", JSON.stringify(aiSuggestions));
      }
    } catch (suggestionError) {
      console.log("[Assistant] Suggestion generation issue:", suggestionError.message);
      aiSuggestions = generateBasicSuggestions(result.extractedData, result.text);
    }

    // Return parsed data with suggestions
    res.json({
      success: true,
      data: {
        text: result.text || "",
        wordCount: result.wordCount || 0,
        extractedData: result.extractedData || emptyResult.extractedData,
      },
      suggestions: aiSuggestions ? {
        skills: aiSuggestions.suggestedSkills || [],
        profileSummary: aiSuggestions.profileSummary || [],
        experienceYears: aiSuggestions.experienceYears,
        primaryDomain: aiSuggestions.primaryDomain,
        aiGenerated: true
      } : undefined,
      message: `Resume processed successfully! ${result.wordCount} words extracted.`,
      warnings: mismatches.length > 0 ? mismatches : undefined,
      sessionCleared: sessionId ? true : undefined,
    });
  } catch (error) {
    console.error("[Assistant] Resume upload error (gracefully degrading):", error);

    res.json({
      success: true,
      data: emptyResult,
      message: "Resume received. We encountered an issue processing it, but you can continue with manual entry.",
    });
  }
});

/**
 * Step 1: Analyze user profile
 * POST /assistant/analyze
 *
 * PRODUCTION GRADE:
 * - Creates a new session for each analysis
 * - Validates all required fields
 * - Saves user profile for future reference
 * - Graceful error messages (no technical jargon)
 */
router.post("/analyze", async (req, res) => {
  try {
    const {
      selfDescription,
      resumeText,
      linkedinText,
      linkedinUrl,
      desiredRole,
      desiredRoles,
      location,
      locations,
      fullName,
      email,
      totalExperience,
      selectedSkills,
    } = req.body;

    // Comprehensive validation
    const validationResult = validateProfileInput({
      fullName,
      email,
      selfDescription,
      resumeText,
      desiredRoles: desiredRoles || (desiredRole ? [desiredRole] : []),
      location: location || (locations && locations[0]) || '',
      totalExperience,
      linkedinUrl,
      selectedSkills,
    });

    if (!validationResult.valid) {
      // Return validation errors with user-friendly messages
      return res.status(400).json({
        success: false,
        ...formatValidationErrors(validationResult.errors),
      });
    }

    // Create a new session for this analysis
    const session = createSession(email);

    // Save user input to session
    updateSession(session.id, {
      data: {
        input: {
          selfDescription,
          resumeText,
          linkedinText,
          linkedinUrl,
          desiredRoles: desiredRoles || (desiredRole ? [desiredRole] : []),
          locations: locations || [location],
          fullName,
          email,
          totalExperience,
          selectedSkills,
        }
      }
    });

    const analysis = await analyzeProfile({
      selfDescription,
      resumeText,
      linkedinText,
      desiredRole: desiredRoles || desiredRole,
      locations: locations || [location],
      fullName,
      email,
      totalExperience,
      selectedSkills,
    });

    // Update session with analysis results
    updateSession(session.id, {
      data: { profileAnalysis: analysis },
      completedSteps: ["analysis"]
    });

    // Save user profile for future reference
    saveUserProfile(email, {
      fullName,
      desiredRoles: desiredRoles || (desiredRole ? [desiredRole] : []),
      locations: locations || [location],
      totalExperience,
      selectedSkills,
      resumeText,
      selfDescription
    });

    res.json({
      success: true,
      data: analysis,
      sessionId: session.id,
      aiMode: getAIMode(),
    });
  } catch (error) {
    console.error("[Assistant] Analyze error:", error);
    // User-friendly error message
    res.status(500).json({
      success: false,
      error: "We couldn't complete the analysis right now",
      message: "Please try again. If the problem persists, check that all required fields are filled correctly.",
      technicalDetails: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * Step 2: Generate CV
 * POST /assistant/generate-cv
 *
 * Note: Resume was already validated in step 1 (analyze).
 * We generate CV based on profileAnalysis which contains extracted data.
 */
router.post("/generate-cv", async (req, res) => {
  try {
    const { profileAnalysis, userInfo, existingResume } = req.body;

    if (!profileAnalysis) {
      return res.status(400).json({
        success: false,
        error: "Profile analysis is required. Please complete step 1 first.",
      });
    }

    // Resume validation already done in step 1
    // If we have profile analysis, we can generate CV even without raw resume
    // since profileAnalysis contains all extracted information

    const cvData = await generateCV({
      profileAnalysis,
      userInfo,
      existingResume: existingResume || "",
    });

    res.json({
      success: true,
      data: cvData,
      aiMode: getAIMode(),
    });
  } catch (error) {
    console.error("[Assistant] CV generation error:", error);
    res.status(500).json({
      success: false,
      error: "CV generation failed",
      message: error.message,
    });
  }
});

/**
 * Step 2b: Download CV as HTML
 * POST /assistant/download-cv
 */
router.post("/download-cv", async (req, res) => {
  try {
    const { cvData } = req.body;

    if (!cvData) {
      return res.status(400).json({
        success: false,
        error: "CV data is required",
      });
    }

    if (!cvData.fullName || !cvData.summary) {
      return res.status(400).json({
        success: false,
        error: "Invalid CV data. Please regenerate your CV.",
      });
    }

    const html = cvToHTML(cvData);

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="${cvData.fullName || "resume"}_CV.html"`);
    res.send(html);
  } catch (error) {
    console.error("[Assistant] CV download error:", error);
    res.status(500).json({
      success: false,
      error: "CV download failed",
      message: error.message,
    });
  }
});

/**
 * Step 3: Optimize LinkedIn
 * POST /assistant/optimize-linkedin
 *
 * NOTE: LinkedIn recommendations are generated based on resume and career goals.
 * We do NOT access or scrape LinkedIn profiles.
 */
router.post("/optimize-linkedin", async (req, res) => {
  try {
    const { profileAnalysis, currentLinkedin, userInfo } = req.body;

    if (!profileAnalysis) {
      return res.status(400).json({
        success: false,
        error: "Profile analysis is required. Please complete step 1 first.",
      });
    }

    const linkedinOptimization = await optimizeLinkedIn({
      profileAnalysis,
      currentLinkedin,
      userInfo,
    });

    res.json({
      success: true,
      data: linkedinOptimization,
      aiMode: getAIMode(),
      notice: "LinkedIn recommendations are generated based on your resume and career goals. We do not access your LinkedIn account.",
    });
  } catch (error) {
    console.error("[Assistant] LinkedIn optimization error:", error);
    res.status(500).json({
      success: false,
      error: "LinkedIn optimization failed",
      message: error.message,
    });
  }
});

/**
 * Step 4: Match jobs
 * POST /assistant/match-jobs
 *
 * PRODUCTION MODE: Fetches real jobs from external APIs.
 * Returns error if no job APIs are configured.
 */
router.post("/match-jobs", async (req, res) => {
  try {
    const { profileAnalysis, cvData, filters } = req.body;

    if (!profileAnalysis) {
      return res.status(400).json({
        success: false,
        error: "Profile analysis is required. Please complete step 1 first.",
      });
    }

    const jobMatches = await matchJobs({
      profileAnalysis,
      cvData,
      filters,
    });

    // Check for errors from the job service
    if (jobMatches.error && jobMatches.matches.length === 0) {
      return res.json({
        success: true,
        data: jobMatches,
        warning: jobMatches.error,
        notice: "Jobs are fetched in real time from external job boards. Applications happen on the original source.",
      });
    }

    res.json({
      success: true,
      data: jobMatches,
      notice: "Jobs are fetched in real time from external job boards. Applications happen on the original source.",
    });
  } catch (error) {
    console.error("[Assistant] Job matching error:", error);
    res.status(500).json({
      success: false,
      error: "Job matching failed",
      message: error.message,
    });
  }
});

/**
 * Complete flow: Run all steps at once
 * POST /assistant/complete-flow
 *
 * STRICT VALIDATION: All inputs validated before any processing begins.
 */
router.post("/complete-flow", async (req, res) => {
  try {
    const {
      selfDescription,
      resumeText,
      linkedinText,
      linkedinUrl,
      desiredRole,
      desiredRoles,
      location,
      locations,
      userInfo,
      currentLinkedin,
      fullName,
      email,
      totalExperience,
      selectedSkills,
    } = req.body;

    // Comprehensive validation
    const validationResult = validateProfileInput({
      fullName: fullName || (userInfo && userInfo.name),
      email: email || (userInfo && userInfo.email),
      selfDescription,
      resumeText,
      desiredRoles: desiredRoles || (desiredRole ? [desiredRole] : []),
      location: location || (locations && locations[0]) || '',
      totalExperience,
      linkedinUrl,
      selectedSkills,
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        ...formatValidationErrors(validationResult.errors),
      });
    }

    // Step 1: Analyze profile
    const profileAnalysis = await analyzeProfile({
      selfDescription,
      resumeText,
      linkedinText,
      desiredRole: desiredRoles || desiredRole,
      locations: locations || [location],
      fullName,
      email,
      totalExperience,
      selectedSkills,
    });

    // Step 2: Generate CV
    const cvData = await generateCV({
      profileAnalysis,
      userInfo: { ...userInfo, selfDescription, name: fullName, email },
      existingResume: resumeText,
    });

    // Step 3: Optimize LinkedIn
    const linkedinOptimization = await optimizeLinkedIn({
      profileAnalysis,
      currentLinkedin,
      userInfo: { ...userInfo, name: fullName, email, location },
    });

    // Step 4: Match jobs (uses real APIs)
    const jobMatches = await matchJobs({
      profileAnalysis,
      cvData,
      filters: {
        desiredRole: Array.isArray(desiredRoles) ? desiredRoles[0] : desiredRole,
        location: location || (locations && locations[0]),
        experienceYears: totalExperience,
      },
    });

    res.json({
      success: true,
      data: {
        profileAnalysis,
        cvData,
        linkedinOptimization,
        jobMatches,
      },
      aiMode: getAIMode(),
      notices: {
        linkedin: "LinkedIn recommendations are based on your resume and career goals. We do not access your LinkedIn account.",
        jobs: "Jobs are fetched from external job boards. Applications happen on the original source.",
      },
    });
  } catch (error) {
    console.error("[Assistant] Complete flow error:", error);
    res.status(500).json({
      success: false,
      error: "Assistant flow failed",
      message: error.message,
    });
  }
});

/**
 * Get job API status
 * GET /assistant/jobs
 *
 * PRODUCTION: No mock jobs returned.
 * Shows which job APIs are configured.
 */
router.get("/jobs", (req, res) => {
  const apiStatus = getApiStatus();

  if (!apiStatus.anyConfigured) {
    return res.json({
      success: true,
      data: [],
      jobApiStatus: apiStatus,
      message: "No job APIs configured. Please set ADZUNA_APP_ID + ADZUNA_APP_KEY or JOOBLE_API_KEY in environment variables.",
      notice: "Jobs are fetched in real time from external job boards when properly configured.",
    });
  }

  res.json({
    success: true,
    data: [],
    jobApiStatus: apiStatus,
    message: "Job APIs configured. Jobs will be fetched during the matching process based on your profile.",
    notice: "Jobs are fetched in real time from external job boards. Use /assistant/match-jobs with profile analysis to get matched jobs.",
  });
});

/**
 * Health check
 * GET /assistant/health
 */
router.get("/health", (req, res) => {
  const jobApiStatus = getApiStatus();
  const sessionStats = getSessionStats();

  // Debug: Check env directly
  const openaiKey = process.env.OPENAI_API_KEY;
  const debugInfo = {
    keyExists: !!openaiKey,
    keyLength: openaiKey?.length || 0,
    keyPrefix: openaiKey?.substring(0, 10) || 'none',
    aiModeResult: getAIMode(),
    isMockResult: isMockMode()
  };

  res.json({
    status: "ok",
    mode: "production",
    services: {
      profileAnalysis: "active",
      cvGeneration: "active",
      linkedinOptimization: "active",
      jobMatching: jobApiStatus.anyConfigured ? "active" : "no-api-configured",
      sessionManagement: "active",
    },
    jobApis: jobApiStatus,
    aiMode: getAIMode(),
    debug: debugInfo,
    validation: "strict",
    sessions: sessionStats,
    notices: {
      atsScoring: "Rule-based, explainable scoring (40-100 range)",
      linkedIn: "Recommendations based on resume only - no scraping",
      jobs: "Real-time job API integration required",
      sessions: "Sessions expire after 24 hours",
    },
  });
});

/**
 * Get user's saved profiles
 * GET /assistant/profiles/:email
 *
 * Returns list of saved profiles for resumption
 */
router.get("/profiles/:email", (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const profiles = getUserProfiles(email);

    res.json({
      success: true,
      data: profiles.map(p => ({
        id: p.id,
        name: p.name,
        targetRole: p.targetRole,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      count: profiles.length,
    });
  } catch (error) {
    console.error("[Assistant] Get profiles error:", error);
    res.status(500).json({
      success: false,
      error: "Could not retrieve profiles",
    });
  }
});

/**
 * Get session status
 * GET /assistant/session/:sessionId
 *
 * Returns current session data and completed steps
 */
router.get("/session/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "Session ID is required",
      });
    }

    const session = getSession(sessionId);

    if (!session) {
      return res.json({
        success: false,
        error: "Session not found or expired",
        message: "Please start a new analysis",
      });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        email: session.email,
        status: session.status,
        completedSteps: session.completedSteps,
        warnings: session.warnings,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        resumeUploaded: session.resumeUploaded,
        resumeFileName: session.resumeFileName,
      },
    });
  } catch (error) {
    console.error("[Assistant] Get session error:", error);
    res.status(500).json({
      success: false,
      error: "Could not retrieve session",
    });
  }
});

/**
 * AI Improve Section
 * POST /assistant/improve-section
 *
 * Improves a specific resume section using AI
 * Used by Resume Builder for per-section AI enhancements
 */
router.post("/improve-section", async (req, res) => {
  try {
    const { section, content, context } = req.body;

    if (!section) {
      return res.status(400).json({
        success: false,
        error: "Section name is required",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Content is required to improve",
      });
    }

    // Generate improved content based on section type
    const improved = await generateSectionImprovement(section, content, context);

    res.json({
      success: true,
      data: {
        original: content,
        improved: improved,
        section: section,
      },
    });
  } catch (error) {
    console.error("[Assistant] Section improvement error:", error);
    res.status(500).json({
      success: false,
      error: "Could not improve section",
      message: "Please try again later",
    });
  }
});

/**
 * Generate improved content for a resume section
 * Uses rule-based improvements in mock mode
 */
async function generateSectionImprovement(section, content, context) {
  // In mock mode, provide rule-based improvements
  if (isMockMode()) {
    return generateRuleBasedImprovement(section, content, context);
  }

  // With real AI, send to Claude API (future implementation)
  // For now, use rule-based
  return generateRuleBasedImprovement(section, content, context);
}

/**
 * Rule-based improvement for resume sections
 */
function generateRuleBasedImprovement(section, content, context) {
  const trimmedContent = content.trim();

  switch (section.toLowerCase()) {
    case "summary":
    case "professional_summary":
      return improveSummary(trimmedContent, context);

    case "headline":
      return improveHeadline(trimmedContent, context);

    case "experience_bullets":
    case "experience":
      return improveExperienceBullets(trimmedContent, context);

    case "skills":
      return improveSkills(trimmedContent);

    default:
      // Generic improvement - add power words and polish
      return polishText(trimmedContent);
  }
}

function improveSummary(text, context = {}) {
  let improved = text;
  const { skills = [], currentRole, yearsOfExperience, mode } = context;

  // ATS Mode: Focus on keywords and clean formatting
  if (mode === "ats") {
    // Remove fancy formatting, keep it clean
    improved = improved.replace(/[""'']/g, '"').replace(/[–—]/g, "-");

    // Add role-specific keywords if available
    if (currentRole) {
      const roleKeywords = getRoleKeywords(currentRole);
      const missingKeywords = roleKeywords.filter(kw =>
        !improved.toLowerCase().includes(kw.toLowerCase())
      );
      if (missingKeywords.length > 0) {
        improved += ` Core competencies include ${missingKeywords.slice(0, 3).join(", ")}.`;
      }
    }

    // Add skills if not present
    if (skills.length > 0) {
      const missingSkills = skills.filter(skill =>
        !improved.toLowerCase().includes(skill.toLowerCase())
      );
      if (missingSkills.length > 0) {
        improved += ` Technical proficiencies: ${missingSkills.slice(0, 5).join(", ")}.`;
      }
    }

    return improved;
  }

  // Standard Mode: Strengthen language
  // Check for weak openings and strengthen them
  const weakOpenings = ["i am", "i have", "my name is", "i'm a", "i'm"];
  const strongOpenings = [
    "Results-driven professional",
    "Accomplished specialist",
    "Dynamic professional",
    "Seasoned expert",
    "Strategic leader",
    "Proven professional",
  ];

  const lowerText = text.toLowerCase();
  for (const weak of weakOpenings) {
    if (lowerText.startsWith(weak)) {
      let opener = strongOpenings[Math.floor(Math.random() * strongOpenings.length)];

      // Personalize based on experience level
      if (yearsOfExperience && yearsOfExperience >= 10) {
        opener = "Seasoned professional with " + yearsOfExperience + "+ years of experience";
      } else if (yearsOfExperience && yearsOfExperience >= 5) {
        opener = "Experienced professional with " + yearsOfExperience + "+ years";
      }

      let remainder = text.substring(weak.length).trim();
      remainder = remainder.replace(/^(a|an)\s+/i, "");
      improved = opener + " " + remainder;
      break;
    }
  }

  // Add action-oriented language
  improved = improved
    .replace(/worked on/gi, "spearheaded")
    .replace(/helped with/gi, "contributed to")
    .replace(/responsible for/gi, "drove")
    .replace(/was part of/gi, "collaborated on")
    .replace(/did/gi, "executed")
    .replace(/good at/gi, "expert in")
    .replace(/know how to/gi, "proficient in")
    .replace(/familiar with/gi, "experienced with");

  // Add skills mention if available and not present
  if (skills.length > 0 && !skills.some(skill => improved.toLowerCase().includes(skill.toLowerCase()))) {
    improved += ` Expertise includes ${skills.slice(0, 3).join(", ")}.`;
  }

  // Ensure it ends with impact statement if missing
  if (!improved.includes("result") && !improved.includes("impact") && !improved.includes("achiev") && !improved.includes("success")) {
    improved += " Committed to delivering measurable results and driving organizational success.";
  }

  return improved;
}

// Helper: Get role-specific keywords for ATS optimization
function getRoleKeywords(role) {
  const roleKeywordsMap = {
    "software engineer": ["agile", "scalable", "microservices", "CI/CD", "code review"],
    "product manager": ["roadmap", "stakeholder", "user stories", "KPIs", "go-to-market"],
    "data scientist": ["machine learning", "statistical analysis", "predictive modeling", "Python", "data visualization"],
    "marketing manager": ["campaign", "ROI", "brand awareness", "digital marketing", "analytics"],
    "sales": ["quota", "pipeline", "CRM", "revenue growth", "account management"],
    "project manager": ["stakeholder management", "risk mitigation", "budget", "timeline", "deliverables"],
    "designer": ["user experience", "wireframes", "prototyping", "design systems", "user research"],
    "operations": ["process improvement", "efficiency", "cost reduction", "SLA", "vendor management"],
    "hr": ["talent acquisition", "employee engagement", "performance management", "compliance", "onboarding"],
    "finance": ["financial analysis", "forecasting", "budgeting", "P&L", "compliance"],
  };

  const roleLower = role.toLowerCase();
  for (const [key, keywords] of Object.entries(roleKeywordsMap)) {
    if (roleLower.includes(key)) {
      return keywords;
    }
  }
  return ["strategic planning", "cross-functional collaboration", "process improvement"];
}

function improveHeadline(text, context = {}) {
  const { skills = [], yearsOfExperience, currentRole } = context;

  // Clean up the text
  let parts = text.split("|").map(p => p.trim()).filter(p => p);

  // Determine the primary role
  let primaryRole = parts[0] || currentRole || "Professional";

  // Add seniority prefix if we have years and it's not already there
  const seniorityPrefixes = ["senior", "lead", "principal", "staff", "director", "head", "vp", "chief", "manager"];
  const hasPrefix = seniorityPrefixes.some(prefix => primaryRole.toLowerCase().includes(prefix));

  if (yearsOfExperience && yearsOfExperience >= 8 && !hasPrefix) {
    primaryRole = "Senior " + primaryRole;
  } else if (yearsOfExperience && yearsOfExperience >= 5 && !hasPrefix) {
    primaryRole = "Experienced " + primaryRole;
  }

  // Build enhanced headline parts
  const enhancedParts = [primaryRole];

  // Add skills (either from existing parts or from context)
  const existingSkills = parts.slice(1).filter(p =>
    !p.toLowerCase().includes("year") && !p.toLowerCase().includes("experience")
  );

  if (existingSkills.length > 0) {
    enhancedParts.push(...existingSkills.slice(0, 2));
  } else if (skills.length > 0) {
    enhancedParts.push(...skills.slice(0, 2));
  }

  // Add years experience if available
  const hasYearsInParts = parts.some(p =>
    p.toLowerCase().includes("year") || p.toLowerCase().includes("experience")
  );

  if (!hasYearsInParts && yearsOfExperience) {
    enhancedParts.push(`${yearsOfExperience}+ Years`);
  } else if (hasYearsInParts) {
    const yearsPartIndex = parts.findIndex(p =>
      p.toLowerCase().includes("year") || p.toLowerCase().includes("experience")
    );
    if (yearsPartIndex !== -1) {
      enhancedParts.push(parts[yearsPartIndex]);
    }
  }

  // Capitalize properly
  return enhancedParts
    .map(p => {
      // Keep known acronyms uppercase
      const acronyms = ["AWS", "GCP", "API", "SQL", "HTML", "CSS", "UI", "UX", "CI", "CD", "ML", "AI", "VP", "CTO", "CEO", "CFO"];
      const words = p.split(" ");
      return words.map(word => {
        if (acronyms.includes(word.toUpperCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(" ");
    })
    .join(" | ");
}

function improveExperienceBullets(text, context = {}) {
  const { title, company, skills = [], mode } = context;

  // Split into bullets
  const bullets = text.split("\n").filter(b => b.trim());

  // Strong action verbs categorized by context
  const actionVerbs = {
    leadership: ["Led", "Directed", "Spearheaded", "Orchestrated", "Championed"],
    development: ["Developed", "Built", "Engineered", "Architected", "Created"],
    improvement: ["Optimized", "Enhanced", "Improved", "Streamlined", "Accelerated"],
    management: ["Managed", "Oversaw", "Coordinated", "Supervised", "Administered"],
    delivery: ["Delivered", "Launched", "Deployed", "Released", "Shipped"],
    analysis: ["Analyzed", "Evaluated", "Assessed", "Researched", "Identified"],
    growth: ["Increased", "Expanded", "Grew", "Scaled", "Boosted"],
    reduction: ["Reduced", "Decreased", "Minimized", "Cut", "Eliminated"],
    implementation: ["Implemented", "Executed", "Established", "Introduced", "Integrated"],
    collaboration: ["Collaborated", "Partnered", "Facilitated", "Mentored", "Trained"]
  };

  // Weak verbs to replace with stronger alternatives
  const weakVerbReplacements = [
    { pattern: /^worked on\s+/i, replacement: "Developed " },
    { pattern: /^worked with\s+/i, replacement: "Collaborated with " },
    { pattern: /^helped improve\s+/i, replacement: "Enhanced " },
    { pattern: /^helped build\s+/i, replacement: "Built " },
    { pattern: /^helped with\s+/i, replacement: "Supported " },
    { pattern: /^helped\s+/i, replacement: "Contributed to " },
    { pattern: /^was responsible for\s+/i, replacement: "Managed " },
    { pattern: /^was in charge of\s+/i, replacement: "Led " },
    { pattern: /^did\s+/i, replacement: "Executed " },
    { pattern: /^made\s+/i, replacement: "Created " },
    { pattern: /^got\s+/i, replacement: "Achieved " },
    { pattern: /^had to\s+/i, replacement: "Executed " },
    { pattern: /^used\s+/i, replacement: "Leveraged " },
    { pattern: /^tried\s+/i, replacement: "Implemented " },
    { pattern: /^handled\s+/i, replacement: "Managed " },
    { pattern: /^took care of\s+/i, replacement: "Oversaw " },
    { pattern: /^assisted with\s+/i, replacement: "Supported " },
    { pattern: /^participated in\s+/i, replacement: "Contributed to " }
  ];

  // Sample metrics for "Add Metrics" mode
  const sampleMetrics = {
    leadership: ["team of 5-12 engineers", "cross-functional team of 8+ members"],
    growth: ["25%", "40%", "2x", "3x"],
    reduction: ["30%", "50%", "60%"],
    delivery: ["10,000+ users", "50,000+ daily active users", "$1M+ annual revenue"],
    improvement: ["35%", "45%", "20%"],
  };

  // Improve each bullet
  const improved = bullets.map((bullet, index) => {
    let bulletText = bullet.trim();

    // Remove leading bullet characters
    bulletText = bulletText.replace(/^[-•*▸]\s*/, "");

    // Replace weak verb phrases
    let replaced = false;
    for (const { pattern, replacement } of weakVerbReplacements) {
      if (pattern.test(bulletText)) {
        bulletText = bulletText.replace(pattern, replacement);
        replaced = true;
        break;
      }
    }

    // Check if starts with strong action verb
    const allActionVerbs = Object.values(actionVerbs).flat();
    const startsWithAction = replaced || allActionVerbs.some(verb =>
      bulletText.toLowerCase().startsWith(verb.toLowerCase())
    );

    // If still no action verb, add one based on content
    if (!startsWithAction) {
      let category = "implementation";
      const lowerText = bulletText.toLowerCase();

      if (lowerText.includes("team") || lowerText.includes("lead")) category = "leadership";
      else if (lowerText.includes("build") || lowerText.includes("creat") || lowerText.includes("develop")) category = "development";
      else if (lowerText.includes("improv") || lowerText.includes("optim") || lowerText.includes("enhance")) category = "improvement";
      else if (lowerText.includes("manag") || lowerText.includes("coordin") || lowerText.includes("oversee")) category = "management";
      else if (lowerText.includes("launch") || lowerText.includes("deploy") || lowerText.includes("release")) category = "delivery";
      else if (lowerText.includes("analyz") || lowerText.includes("research") || lowerText.includes("assess")) category = "analysis";
      else if (lowerText.includes("increas") || lowerText.includes("grow") || lowerText.includes("expand")) category = "growth";
      else if (lowerText.includes("reduc") || lowerText.includes("decreas") || lowerText.includes("cut")) category = "reduction";

      const verbs = actionVerbs[category];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      bulletText = verb + " " + bulletText.charAt(0).toLowerCase() + bulletText.slice(1);
    }

    // Add metrics for "metrics" mode
    if (mode === "metrics") {
      const hasMetrics = /\d+%|\d+ percent|\$[\d,]+|\d+[kKmM]?[\s+]users|\d+[\s+]team|\d+x|\d+\+/i.test(bulletText);

      if (!hasMetrics) {
        const lowerText = bulletText.toLowerCase();

        // Determine what type of metric to add
        if (lowerText.includes("led") || lowerText.includes("managed") || lowerText.includes("supervised")) {
          const metric = sampleMetrics.leadership[Math.floor(Math.random() * sampleMetrics.leadership.length)];
          bulletText = bulletText.replace(/(led|managed|supervised)\s+/i, `$1 ${metric} `);
        } else if (lowerText.includes("increased") || lowerText.includes("grew") || lowerText.includes("expanded") || lowerText.includes("boosted")) {
          const metric = sampleMetrics.growth[Math.floor(Math.random() * sampleMetrics.growth.length)];
          bulletText = bulletText + `, resulting in ${metric} improvement`;
        } else if (lowerText.includes("reduced") || lowerText.includes("decreased") || lowerText.includes("cut")) {
          const metric = sampleMetrics.reduction[Math.floor(Math.random() * sampleMetrics.reduction.length)];
          bulletText = bulletText + ` by ${metric}`;
        } else if (lowerText.includes("delivered") || lowerText.includes("launched") || lowerText.includes("shipped")) {
          const metric = sampleMetrics.delivery[Math.floor(Math.random() * sampleMetrics.delivery.length)];
          bulletText = bulletText + `, serving ${metric}`;
        } else if (lowerText.includes("improved") || lowerText.includes("optimized") || lowerText.includes("enhanced")) {
          const metric = sampleMetrics.improvement[Math.floor(Math.random() * sampleMetrics.improvement.length)];
          bulletText = bulletText + `, achieving ${metric} improvement`;
        } else {
          // Generic metric suggestion
          bulletText = bulletText + " (add specific metrics: %, $, team size, or user count)";
        }
      }
    }

    // Add skills reference if appropriate and available
    if (skills.length > 0 && index === 0) {
      const hasSkillMention = skills.some(skill =>
        bulletText.toLowerCase().includes(skill.toLowerCase())
      );
      if (!hasSkillMention) {
        const relevantSkill = skills[0];
        if (!bulletText.toLowerCase().includes(relevantSkill.toLowerCase())) {
          // Only add if it makes contextual sense
          if (bulletText.toLowerCase().includes("using") || bulletText.toLowerCase().includes("leverag")) {
            bulletText = bulletText.replace(/(using|leveraging)\s+/i, `$1 ${relevantSkill} and `);
          }
        }
      }
    }

    // Ensure proper capitalization
    bulletText = bulletText.charAt(0).toUpperCase() + bulletText.slice(1);

    // Ensure no double spaces
    bulletText = bulletText.replace(/\s+/g, " ").trim();

    return "• " + bulletText;
  });

  return improved.join("\n");
}

function improveSkills(text) {
  // Split skills
  const skills = text.split(/[,\n]/).map(s => s.trim()).filter(s => s);

  // Capitalize properly
  const improved = skills.map(skill => {
    // Common acronyms to keep uppercase
    const acronyms = ["API", "REST", "SQL", "HTML", "CSS", "JS", "AWS", "GCP", "CI", "CD", "UI", "UX"];

    for (const acronym of acronyms) {
      if (skill.toUpperCase() === acronym) {
        return acronym;
      }
    }

    // Title case for multi-word skills
    return skill.split(" ").map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ");
  });

  return improved.join(", ");
}

function polishText(text) {
  let improved = text;

  // Replace weak words with strong alternatives
  const replacements = [
    [/helped/gi, "contributed to"],
    [/worked on/gi, "developed"],
    [/was responsible for/gi, "managed"],
    [/did/gi, "executed"],
    [/made/gi, "created"],
    [/got/gi, "achieved"],
    [/very/gi, "significantly"],
    [/really/gi, "substantially"],
    [/a lot/gi, "extensively"],
  ];

  for (const [pattern, replacement] of replacements) {
    improved = improved.replace(pattern, replacement);
  }

  return improved;
}

/**
 * Create new session (start fresh)
 * POST /assistant/session/new
 *
 * Creates a new empty session, clearing any previous data
 */
router.post("/session/new", (req, res) => {
  try {
    const { email } = req.body;

    const session = createSession(email);

    res.json({
      success: true,
      data: {
        id: session.id,
        message: "New session created. Previous data has been cleared.",
      },
    });
  } catch (error) {
    console.error("[Assistant] Create session error:", error);
    res.status(500).json({
      success: false,
      error: "Could not create session",
    });
  }
});

export default router;
