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
    characteristics?: string[];
  };
  about: {
    before: string;
    after: string;
    tips: string[];
    characteristics?: string[];
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
  // New: Comprehensive Skills Section (10-20 skills)
  skillsSection?: {
    skills: string[];
    count: number;
    priorityOrder: string;
    note: string;
    characteristics?: string[];
  };
  // New: Categorized Tips
  tips?: {
    keywordOptimization: string[];
    profileCompleteness: string[];
    recruiterVisibility: string[];
  };
  disclaimer?: string;
  dataSource?: {
    basedOn: string[];
    notUsed: string[];
  };
  // NEW: Complete LinkedIn Profile Preview
  profilePreview?: {
    profileHeader: {
      name: string;
      headline: string;
      location: string;
      connections: string;
      openToWork: boolean;
      profilePhoto: string | null;
    };
    intro: {
      currentPosition: string;
      currentCompany: string;
      education: string;
      contactInfo: {
        email: string;
        phone: string;
        linkedin: string;
        location: string;
      };
    };
    about: {
      content: string;
      characterCount: number;
      keywords: string[];
    };
    experience: {
      title: string;
      company: string;
      duration: string;
      location?: string;
      bullets: string[];
    }[];
    education: {
      degree: string;
      institution: string;
      year: string;
      field?: string;
    }[];
    skills: {
      featured: string[];
      technical: string[];
      soft: string[];
      all: string[];
    };
    certifications: string[];
    recommendationPrompt: string;
    seoKeywords: string[];
  };
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

export interface JobBoardRecommendation {
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  priority: number;
  whyRecommended: string;
}

export interface JobMatchResult {
  matches: JobMatch[];
  overallInsights: {
    strongestFitCategory: string;
    topSkillsInDemand: string[];
    suggestedUpskilling: string[];
    jobsFound?: number;
    sourcesUsed?: string[];
  } | null;
  error?: string;
  message?: string;
  liveJobsUnavailable?: boolean;
  apiStatus?: {
    adzunaConfigured: boolean;
    joobleConfigured: boolean;
    anyConfigured: boolean;
  };
  sources?: string[];
  // New: Smart job board recommendations when APIs unavailable
  jobBoardRecommendations?: {
    searchQuery: string;
    location: string;
    experienceLevel: string;
    boards: JobBoardRecommendation[];
    tips: string[];
    note: string;
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
  phone?: string;
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

export interface ResumeUploadResult {
  text: string;
  wordCount: number;
  extractedData: {
    name: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    skills: string[];
    suggestedRoles: string[];
  };
}

// Mismatch warning for name/email differences between form and resume
export interface DataMismatchWarning {
  field: string;
  formValue: string;
  resumeValue: string;
  message: string;
}

// Upload response with warnings
export interface ResumeUploadResponse {
  success: boolean;
  data: ResumeUploadResult;
  message: string;
  warnings?: DataMismatchWarning[];
  sessionCleared?: boolean;
}

// Analysis response with session ID
export interface AnalysisResponse {
  success: boolean;
  data: ProfileAnalysis;
  sessionId?: string;
  aiMode: string;
}

export const assistantApi = {
  /**
   * Check API health
   */
  async health() {
    return apiCall<{ status: string; mockMode: boolean }>("/assistant/health");
  },

  /**
   * Upload and parse resume file
   * Extracts text, skills, and contact info from PDF/DOCX/TXT files
   */
  async uploadResume(file: File): Promise<{ success: boolean; data: ResumeUploadResult; message: string }> {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await fetch(`${API_BASE}/assistant/upload-resume`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || errorData.message || "Failed to upload resume");
    }

    return response.json();
  },

  /**
   * Analyze user profile (Step 1)
   * Returns sessionId for tracking
   */
  async analyzeProfile(input: AssistantInput) {
    return apiCall<{ success: boolean; data: ProfileAnalysis; sessionId?: string; aiMode: string }>("/assistant/analyze", {
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
    currentLinkedin?: AssistantInput["currentLinkedin"],
    cvData?: CVData
  ) {
    return apiCall<{ success: boolean; data: LinkedInOptimization; mockMode: boolean }>("/assistant/optimize-linkedin", {
      method: "POST",
      body: JSON.stringify({ profileAnalysis, userInfo, currentLinkedin, cvData }),
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

  /**
   * Improve a LinkedIn section using AI
   */
  async improveSection(
    section: string,
    content: string,
    context: { role?: string; skills?: string[]; experience?: number }
  ) {
    return apiCall<{ success: boolean; data: { improved: string; original: string } }>("/assistant/improve-section", {
      method: "POST",
      body: JSON.stringify({ section, content, context }),
    });
  },
};
