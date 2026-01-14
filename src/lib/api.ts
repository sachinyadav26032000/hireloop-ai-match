/**
 * API Client for HireLoop AI Assistant
 */

const API_BASE = "http://localhost:5000";

// ATS Score Breakdown interface
export interface ATSScoreBreakdown {
  overall: number;
  keywordRelevance: number;
  impactMetrics: number;
  roleAlignment: number;
  formattingClarity: number;
}

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
  atsScoreBreakdown?: ATSScoreBreakdown;
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
  skillsToAdd?: string[];
  skillsToRemove?: string[];
  certifications?: string[];
}

export interface JobMatch {
  jobId: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
    job_type: string;
    description: string;
    source?: string;
    postedDate?: string;
    applyUrl?: string;
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
  desiredRoles?: string[];
  locations?: string[];
  fullName?: string;
  email?: string;
  totalExperience?: string;
  selectedSkills?: string[];
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
    url?: string;
  };
}

export interface JobMatchFilters {
  desiredRole?: string;
  location?: string;
  experienceYears?: number;
}

export interface CompleteFlowResult {
  profileAnalysis: ProfileAnalysis;
  cvData: CVData;
  linkedinOptimization: LinkedInOptimization;
  jobMatches: JobMatchResult;
}

// Custom error class for validation errors with field details
export class ApiValidationError extends Error {
  details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiValidationError';
    this.details = details;
  }
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));

    // Handle validation errors with specific field details
    if (errorData.details && typeof errorData.details === 'object') {
      const fieldErrors = Object.entries(errorData.details)
        .map(([field, error]) => `${formatFieldName(field)}: ${error}`)
        .join('. ');
      throw new ApiValidationError(fieldErrors || errorData.message || errorData.error, errorData.details);
    }

    throw new Error(errorData.message || errorData.error || "API request failed");
  }

  return response.json();
}

// Helper to format field names for user-friendly display
function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    fullName: 'Full Name',
    email: 'Email',
    resumeText: 'Resume',
    selfDescription: 'About You',
    desiredRoles: 'Desired Roles',
    location: 'Location',
    totalExperience: 'Experience',
    experienceYears: 'Experience',
    linkedinUrl: 'LinkedIn URL',
    selectedSkills: 'Skills',
  };
  return fieldMap[field] || field;
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
  async matchJobs(profileAnalysis: ProfileAnalysis, cvData?: CVData, filters?: JobMatchFilters) {
    return apiCall<{ success: boolean; data: JobMatchResult; mockMode: boolean }>("/assistant/match-jobs", {
      method: "POST",
      body: JSON.stringify({ profileAnalysis, cvData, filters }),
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
