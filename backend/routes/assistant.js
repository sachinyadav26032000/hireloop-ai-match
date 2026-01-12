/**
 * AI Assistant Routes
 * Unified endpoints for the complete job assistant flow
 */
import express from "express";
import { analyzeProfile } from "../services/profileAnalysisService.js";
import { generateCV, cvToHTML } from "../services/cvGenerationService.js";
import { optimizeLinkedIn } from "../services/linkedinOptimizationService.js";
import { matchJobs, getMockJobs } from "../services/jobMatchingService.js";
import { isMockMode } from "../services/aiAdapter.js";

const router = express.Router();

/**
 * Step 1: Analyze user profile
 * POST /assistant/analyze
 */
router.post("/analyze", async (req, res) => {
  try {
    const { selfDescription, resumeText, linkedinText, desiredRole, locations } = req.body;

    if (!selfDescription || selfDescription.trim().length < 10) {
      return res.status(400).json({
        error: "Please provide a self-description (at least 10 characters)",
      });
    }

    const analysis = await analyzeProfile({
      selfDescription,
      resumeText,
      linkedinText,
      desiredRole,
      locations,
    });

    res.json({
      success: true,
      data: analysis,
      mockMode: isMockMode(),
    });
  } catch (error) {
    console.error("[Assistant] Analyze error:", error);
    res.status(500).json({ error: "Profile analysis failed" });
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
        error: "Profile analysis is required. Please complete step 1 first.",
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
    res.status(500).json({ error: "CV generation failed" });
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
      return res.status(400).json({ error: "CV data is required" });
    }

    const html = cvToHTML(cvData);

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="${cvData.fullName || "resume"}_CV.html"`);
    res.send(html);
  } catch (error) {
    console.error("[Assistant] CV download error:", error);
    res.status(500).json({ error: "CV download failed" });
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
    res.status(500).json({ error: "LinkedIn optimization failed" });
  }
});

/**
 * Step 4: Match jobs
 * POST /assistant/match-jobs
 */
router.post("/match-jobs", async (req, res) => {
  try {
    const { profileAnalysis, cvData, availableJobs } = req.body;

    if (!profileAnalysis) {
      return res.status(400).json({
        error: "Profile analysis is required. Please complete step 1 first.",
      });
    }

    const jobMatches = await matchJobs({
      profileAnalysis,
      cvData,
      availableJobs,
    });

    res.json({
      success: true,
      data: jobMatches,
      mockMode: isMockMode(),
    });
  } catch (error) {
    console.error("[Assistant] Job matching error:", error);
    res.status(500).json({ error: "Job matching failed" });
  }
});

/**
 * Complete flow: Run all steps at once
 * POST /assistant/complete-flow
 */
router.post("/complete-flow", async (req, res) => {
  try {
    const { selfDescription, resumeText, linkedinText, desiredRole, locations, userInfo, currentLinkedin } = req.body;

    if (!selfDescription || selfDescription.trim().length < 10) {
      return res.status(400).json({
        error: "Please provide a self-description (at least 10 characters)",
      });
    }

    // Step 1: Analyze profile
    const profileAnalysis = await analyzeProfile({
      selfDescription,
      resumeText,
      linkedinText,
      desiredRole,
      locations,
    });

    // Step 2: Generate CV
    const cvData = await generateCV({
      profileAnalysis,
      userInfo: { ...userInfo, selfDescription },
      existingResume: resumeText,
    });

    // Step 3: Optimize LinkedIn
    const linkedinOptimization = await optimizeLinkedIn({
      profileAnalysis,
      currentLinkedin,
      userInfo,
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
    res.status(500).json({ error: "Assistant flow failed" });
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
  });
});

export default router;
