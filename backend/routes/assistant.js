/**
 * AI Assistant Routes
 * Unified endpoints for the complete job assistant flow
 * With recruiter-grade validation
 */
import express from "express";
import { analyzeProfile } from "../services/profileAnalysisService.js";
import { generateCV, cvToHTML } from "../services/cvGenerationService.js";
import { optimizeLinkedIn } from "../services/linkedinOptimizationService.js";
import { matchJobs, getMockJobs } from "../services/jobMatchingService.js";
import { isMockMode } from "../services/aiAdapter.js";
import {
  validateProfileInput,
  validateResume,
  validateSelfDescription,
  formatValidationErrors,
} from "../lib/validation.js";

const router = express.Router();

/**
 * Step 1: Analyze user profile
 * POST /assistant/analyze
 *
 * STRICT VALIDATION: All fields must be valid before analysis begins.
 * Resume is MANDATORY - we cannot provide meaningful analysis without it.
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
      return res.status(400).json({
        success: false,
        ...formatValidationErrors(validationResult.errors),
      });
    }

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

    res.json({
      success: true,
      data: analysis,
      mockMode: isMockMode(),
    });
  } catch (error) {
    console.error("[Assistant] Analyze error:", error);
    res.status(500).json({
      success: false,
      error: "Profile analysis failed",
      message: error.message,
    });
  }
});

/**
 * Step 2: Generate CV
 * POST /assistant/generate-cv
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

    // Validate that we have resume content
    const resumeValidation = validateResume(existingResume);
    if (!resumeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: resumeValidation.error,
      });
    }

    const cvData = await generateCV({
      profileAnalysis,
      userInfo,
      existingResume,
    });

    res.json({
      success: true,
      data: cvData,
      mockMode: isMockMode(),
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
      mockMode: isMockMode(),
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
 */
router.post("/match-jobs", async (req, res) => {
  try {
    const { profileAnalysis, cvData, availableJobs, filters } = req.body;

    if (!profileAnalysis) {
      return res.status(400).json({
        success: false,
        error: "Profile analysis is required. Please complete step 1 first.",
      });
    }

    const jobMatches = await matchJobs({
      profileAnalysis,
      cvData,
      availableJobs,
      filters,
    });

    res.json({
      success: true,
      data: jobMatches,
      mockMode: isMockMode(),
      notice: "Job listings are for demonstration purposes. Click external links to find real opportunities.",
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
      userInfo: { ...userInfo, name: fullName, email },
    });

    // Step 4: Match jobs
    const jobMatches = await matchJobs({
      profileAnalysis,
      cvData,
      availableJobs: getMockJobs(),
    });

    res.json({
      success: true,
      data: {
        profileAnalysis,
        cvData,
        linkedinOptimization,
        jobMatches,
      },
      mockMode: isMockMode(),
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
 * Get available mock jobs
 * GET /assistant/jobs
 */
router.get("/jobs", (req, res) => {
  res.json({
    success: true,
    data: getMockJobs(),
    notice: "These are demonstration job listings. Use the external links provided with each job to find real opportunities.",
  });
});

/**
 * Health check
 * GET /assistant/health
 */
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    mockMode: isMockMode(),
    services: ["profileAnalysis", "cvGeneration", "linkedinOptimization", "jobMatching"],
    validation: "strict",
  });
});

export default router;
