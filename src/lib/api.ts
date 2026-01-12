/**
 * API Client for HireLoop AI Assistant
 */

const API_BASE = "http://localhost:5000";

export interface ProfileAnalysis {
  suggestedRoles: string[];
  experienceLevel: string;
  yearsOfExperience: number;
  coreSkills: string[];
  softSkills: string[];
  industryFit: string[];
  weakAreas: string[];
  marketGaps: string[];
  summary: string;
}

export interface CVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  experience: {
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }[];
  skills: {
    technical: string[];
    soft: string[];
  };
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: string[];
  atsScore: number;
  atsKeywords: string[];
  improvements: string[];
}

export interface LinkedInOptimization {
  headline: {
    before: string;
    after: string;
    tips: string[];
  };
  about: {
    before: string;
    after: string;
    tips: string[];
  };
  experienceBullets: {
    role: string;
    before: string[];
    after: string[];
  }[];
  keywords: string[];
  overallScore: number;
  topRecommendations: string[];
}

export interface JobMatch {
  jobId: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_min: number;
    salary_max: number;
    job_type: string;
    description: string;
  };
  matchScore: number;
  fitReasons: string[];
  skillsMatched: string[];
  skillsGap: string[];
  salaryFit: string;
  recommendation: string;
}

export interface JobMatchResult {
  matches: JobMatch[];
  overallInsights: {
    strongestFitCategory: string;
    topSkillsInDemand: string[];
    suggestedUpskilling: string[];
  };
}

export interface AssistantInput {
  selfDescription: string;
  resumeText?: string;
  linkedinText?: string;
  desiredRole?: string;
  locations?: string[];
  userInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  currentLinkedin?: {
    headline?: string;
    about?: string;
    experience?: string;
  };
}

export interface CompleteFlowResult {
  profileAnalysis: ProfileAnalysis;
  cvData: CVData;
  linkedinOptimization: LinkedInOptimization;
  jobMatches: JobMatchResult;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "API request failed");
  }

  return response.json();
}

export const assistantApi = {
  /**
   * Check API health
   */
  async health() {
    return apiCall<{ status: string; mockMode: boolean }>("/assistant/health");
  },

  /**
   * Analyze user profile (Step 1)
   */
  async analyzeProfile(input: AssistantInput) {
    return apiCall<{ success: boolean; data: ProfileAnalysis; mockMode: boolean }>("/assistant/analyze", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Generate CV (Step 2)
   */
  async generateCV(profileAnalysis: ProfileAnalysis, userInfo: AssistantInput["userInfo"], existingResume?: string) {
    return apiCall<{ success: boolean; data: CVData; mockMode: boolean }>("/assistant/generate-cv", {
      method: "POST",
      body: JSON.stringify({ profileAnalysis, userInfo, existingResume }),
    });
  },

  /**
   * Download CV as HTML file
   */
  async downloadCV(cvData: CVData) {
    const response = await fetch(`${API_BASE}/assistant/download-cv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvData }),
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cvData.fullName || "resume"}_CV.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Optimize LinkedIn (Step 3)
   */
  async optimizeLinkedIn(
    profileAnalysis: ProfileAnalysis,
    userInfo: AssistantInput["userInfo"],
    currentLinkedin?: AssistantInput["currentLinkedin"]
  ) {
    return apiCall<{ success: boolean; data: LinkedInOptimization; mockMode: boolean }>("/assistant/optimize-linkedin", {
      method: "POST",
      body: JSON.stringify({ profileAnalysis, userInfo, currentLinkedin }),
    });
  },

  /**
   * Match jobs (Step 4)
   */
  async matchJobs(profileAnalysis: ProfileAnalysis, cvData?: CVData) {
    return apiCall<{ success: boolean; data: JobMatchResult; mockMode: boolean }>("/assistant/match-jobs", {
      method: "POST",
      body: JSON.stringify({ profileAnalysis, cvData }),
    });
  },

  /**
   * Run complete flow at once
   */
  async completeFlow(input: AssistantInput) {
    return apiCall<{ success: boolean; data: CompleteFlowResult; mockMode: boolean }>("/assistant/complete-flow", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Get available jobs
   */
  async getJobs() {
    return apiCall<{ success: boolean; data: JobMatch["job"][] }>("/assistant/jobs");
  },
};
