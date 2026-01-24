/**
 * ResumeContext - Global state for Resume Editor
 *
 * ARCHITECTURE:
 * - Content is separate from design (templates)
 * - Normalized JSON structure for all resume data
 * - Template switching does NOT regenerate content
 * - Auto-save with debounce support
 */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

// ============================================
// TYPES - Normalized Resume JSON Structure
// ============================================

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  github?: string;
  photoUrl?: string; // Optional profile photo for senior/leadership templates
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string; // "Present" for current
  bullets: string[];
  isCurrentRole?: boolean;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
  honors?: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  bullets?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
}

export interface ResumeData {
  // Contact & Header
  contact: ContactInfo;
  headline: string; // e.g., "Senior Software Engineer | React | Node.js"

  // Professional Summary
  summary: string;

  // Experience
  experience: ExperienceItem[];

  // Education
  education: EducationItem[];

  // Skills (categorized)
  skills: {
    technical: string[];
    soft: string[];
    languages?: string[];
    tools?: string[];
  };

  // Optional sections
  certifications: CertificationItem[];
  projects: ProjectItem[];

  // Metadata
  lastUpdated: string;
  version: number;
}

export type TemplateId =
  | "modern"
  | "professional"
  | "minimal"
  | "executive"
  | "corporate"
  | "tech-modern"
  | "sales-leader"
  | "operations"
  | "finance-pro"
  | "creative"
  | "consultant"
  | "ats-optimized"
  | "senior-executive"
  | "manager"
  | "graduate";

export interface ResumeState {
  // Resume content (separate from design)
  data: ResumeData;

  // Selected template
  templateId: TemplateId;

  // Edit state
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Session
  sessionId: string | null;
}

// ============================================
// DEFAULT VALUES
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const createEmptyResume = (): ResumeData => ({
  contact: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    github: "",
  },
  headline: "",
  summary: "",
  experience: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
    languages: [],
    tools: [],
  },
  certifications: [],
  projects: [],
  lastUpdated: new Date().toISOString(),
  version: 1,
});

export const createEmptyExperience = (): ExperienceItem => ({
  id: generateId(),
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  bullets: [""],
  isCurrentRole: false,
});

export const createEmptyEducation = (): EducationItem => ({
  id: generateId(),
  degree: "",
  institution: "",
  location: "",
  graduationDate: "",
  gpa: "",
  honors: [],
});

export const createEmptyProject = (): ProjectItem => ({
  id: generateId(),
  name: "",
  description: "",
  technologies: [],
  url: "",
  bullets: [],
});

export const createEmptyCertification = (): CertificationItem => ({
  id: generateId(),
  name: "",
  issuer: "",
  date: "",
  expirationDate: "",
  credentialId: "",
  url: "",
});

// ============================================
// CONTEXT
// ============================================

interface ResumeContextValue {
  // State
  state: ResumeState;

  // Resume data operations
  updateContact: (contact: Partial<ContactInfo>) => void;
  updateHeadline: (headline: string) => void;
  updateSummary: (summary: string) => void;

  // Experience operations
  addExperience: () => void;
  updateExperience: (id: string, data: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;
  addExperienceBullet: (experienceId: string) => void;
  updateExperienceBullet: (experienceId: string, bulletIndex: number, text: string) => void;
  removeExperienceBullet: (experienceId: string, bulletIndex: number) => void;

  // Education operations
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;

  // Skills operations
  updateSkills: (category: keyof ResumeData["skills"], skills: string[]) => void;
  addSkill: (category: keyof ResumeData["skills"], skill: string) => void;
  removeSkill: (category: keyof ResumeData["skills"], skill: string) => void;

  // Certifications operations
  addCertification: () => void;
  updateCertification: (id: string, data: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;

  // Projects operations
  addProject: () => void;
  updateProject: (id: string, data: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;

  // Template operations
  setTemplate: (templateId: TemplateId) => void;

  // Bulk operations
  setResumeData: (data: ResumeData) => void;
  resetResume: () => void;
  loadFromAnalysis: (analysisData: any, userInfo: any) => void;

  // Save operations
  markAsSaved: () => void;
  setIsSaving: (isSaving: boolean) => void;

  // Session
  setSessionId: (sessionId: string) => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ResumeState>({
    data: createEmptyResume(),
    templateId: "modern",
    isDirty: false,
    isSaving: false,
    lastSavedAt: null,
    sessionId: null,
  });

  // Mark as dirty on any change
  const markDirty = useCallback(() => {
    setState(prev => ({ ...prev, isDirty: true }));
  }, []);

  // Contact operations
  const updateContact = useCallback((contact: Partial<ContactInfo>) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        contact: { ...prev.data.contact, ...contact },
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const updateHeadline = useCallback((headline: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: { ...prev.data, headline, lastUpdated: new Date().toISOString() },
    }));
  }, []);

  const updateSummary = useCallback((summary: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: { ...prev.data, summary, lastUpdated: new Date().toISOString() },
    }));
  }, []);

  // Experience operations
  const addExperience = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        experience: [...prev.data.experience, createEmptyExperience()],
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const updateExperience = useCallback((id: string, data: Partial<ExperienceItem>) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        experience: prev.data.experience.map(exp =>
          exp.id === id ? { ...exp, ...data } : exp
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const removeExperience = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        experience: prev.data.experience.filter(exp => exp.id !== id),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const reorderExperience = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newExperience = [...prev.data.experience];
      const [removed] = newExperience.splice(fromIndex, 1);
      newExperience.splice(toIndex, 0, removed);
      return {
        ...prev,
        isDirty: true,
        data: { ...prev.data, experience: newExperience, lastUpdated: new Date().toISOString() },
      };
    });
  }, []);

  const addExperienceBullet = useCallback((experienceId: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        experience: prev.data.experience.map(exp =>
          exp.id === experienceId ? { ...exp, bullets: [...exp.bullets, ""] } : exp
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const updateExperienceBullet = useCallback((experienceId: string, bulletIndex: number, text: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        experience: prev.data.experience.map(exp =>
          exp.id === experienceId
            ? { ...exp, bullets: exp.bullets.map((b, i) => (i === bulletIndex ? text : b)) }
            : exp
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const removeExperienceBullet = useCallback((experienceId: string, bulletIndex: number) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        experience: prev.data.experience.map(exp =>
          exp.id === experienceId
            ? { ...exp, bullets: exp.bullets.filter((_, i) => i !== bulletIndex) }
            : exp
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Education operations
  const addEducation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        education: [...prev.data.education, createEmptyEducation()],
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const updateEducation = useCallback((id: string, data: Partial<EducationItem>) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        education: prev.data.education.map(edu =>
          edu.id === id ? { ...edu, ...data } : edu
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const removeEducation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        education: prev.data.education.filter(edu => edu.id !== id),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Skills operations
  const updateSkills = useCallback((category: keyof ResumeData["skills"], skills: string[]) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        skills: { ...prev.data.skills, [category]: skills },
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const addSkill = useCallback((category: keyof ResumeData["skills"], skill: string) => {
    setState(prev => {
      const currentSkills = prev.data.skills[category] || [];
      if (currentSkills.includes(skill)) return prev;
      return {
        ...prev,
        isDirty: true,
        data: {
          ...prev.data,
          skills: { ...prev.data.skills, [category]: [...currentSkills, skill] },
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  }, []);

  const removeSkill = useCallback((category: keyof ResumeData["skills"], skill: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        skills: {
          ...prev.data.skills,
          [category]: (prev.data.skills[category] || []).filter(s => s !== skill),
        },
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Certifications operations
  const addCertification = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        certifications: [...prev.data.certifications, createEmptyCertification()],
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const updateCertification = useCallback((id: string, data: Partial<CertificationItem>) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        certifications: prev.data.certifications.map(cert =>
          cert.id === id ? { ...cert, ...data } : cert
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const removeCertification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        certifications: prev.data.certifications.filter(cert => cert.id !== id),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Projects operations
  const addProject = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        projects: [...prev.data.projects, createEmptyProject()],
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const updateProject = useCallback((id: string, data: Partial<ProjectItem>) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        projects: prev.data.projects.map(proj =>
          proj.id === id ? { ...proj, ...data } : proj
        ),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: {
        ...prev.data,
        projects: prev.data.projects.filter(proj => proj.id !== id),
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Template operations
  const setTemplate = useCallback((templateId: TemplateId) => {
    setState(prev => ({ ...prev, templateId }));
    // Note: NOT marking as dirty - template change doesn't affect content
  }, []);

  // Bulk operations
  const setResumeData = useCallback((data: ResumeData) => {
    setState(prev => ({
      ...prev,
      isDirty: true,
      data: { ...data, lastUpdated: new Date().toISOString() },
    }));
  }, []);

  const resetResume = useCallback(() => {
    setState({
      data: createEmptyResume(),
      templateId: "modern",
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      sessionId: null,
    });
  }, []);

  // Load resume data from AI analysis
  const loadFromAnalysis = useCallback((analysisData: any, userInfo: any) => {
    const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Extract experience data if available
    const experience: ExperienceItem[] = (analysisData?.experience || []).map((exp: any) => ({
      id: generateId(),
      title: exp.title || "",
      company: exp.company || "",
      location: exp.location || "",
      startDate: exp.startDate || exp.duration?.split(" - ")[0] || "",
      endDate: exp.endDate || exp.duration?.split(" - ")[1] || "Present",
      bullets: Array.isArray(exp.bullets) ? exp.bullets.filter((b: string) => b?.trim()) : [],
      isCurrentRole: (exp.endDate || exp.duration?.split(" - ")[1])?.toLowerCase()?.includes("present"),
    }));

    // Extract education data if available
    const education: EducationItem[] = (analysisData?.education || []).map((edu: any) => ({
      id: generateId(),
      degree: edu.degree || "",
      institution: edu.institution || "",
      location: edu.location || "",
      graduationDate: edu.year || edu.graduationDate || "",
      gpa: edu.gpa || "",
      honors: edu.honors || [],
    }));

    // Extract certifications if available
    const certifications: CertificationItem[] = (analysisData?.certifications || [])
      .filter((cert: any) => cert && (typeof cert === 'string' || cert.name))
      .map((cert: any) => ({
        id: generateId(),
        name: typeof cert === 'string' ? cert : cert.name || "",
        issuer: cert.issuer || "",
        date: cert.date || cert.year || "",
        expirationDate: cert.expirationDate || "",
        credentialId: cert.credentialId || "",
        url: cert.url || "",
      }));

    // Build headline from suggested roles
    const headline = analysisData?.title ||
      analysisData?.suggestedRoles?.[0] ||
      (experience[0]?.title ? experience[0].title : "");

    const newData: ResumeData = {
      contact: {
        fullName: userInfo?.fullName || analysisData?.fullName || "",
        email: userInfo?.email || analysisData?.email || "",
        phone: userInfo?.phone || analysisData?.phone || "",
        location: userInfo?.location || analysisData?.location || "",
        linkedin: userInfo?.linkedin || analysisData?.linkedin || "",
        website: userInfo?.website || "",
        github: userInfo?.github || "",
        photoUrl: userInfo?.photoUrl || "",
      },
      headline,
      summary: analysisData?.summary || "",
      experience: experience.length > 0 ? experience : [],
      education: education.length > 0 ? education : [],
      skills: {
        technical: analysisData?.coreSkills || analysisData?.skills?.technical || [],
        soft: analysisData?.softSkills || analysisData?.skills?.soft || [],
        languages: analysisData?.languages || [],
        tools: analysisData?.tools || [],
      },
      certifications,
      projects: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    setState(prev => ({
      ...prev,
      data: newData,
      isDirty: true,
    }));
  }, []);

  // Save operations
  const markAsSaved = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDirty: false,
      isSaving: false,
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  const setIsSaving = useCallback((isSaving: boolean) => {
    setState(prev => ({ ...prev, isSaving }));
  }, []);

  // Session
  const setSessionId = useCallback((sessionId: string) => {
    setState(prev => ({ ...prev, sessionId }));
  }, []);

  const value: ResumeContextValue = {
    state,
    updateContact,
    updateHeadline,
    updateSummary,
    addExperience,
    updateExperience,
    removeExperience,
    reorderExperience,
    addExperienceBullet,
    updateExperienceBullet,
    removeExperienceBullet,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    addSkill,
    removeSkill,
    addCertification,
    updateCertification,
    removeCertification,
    addProject,
    updateProject,
    removeProject,
    setTemplate,
    setResumeData,
    resetResume,
    loadFromAnalysis,
    markAsSaved,
    setIsSaving,
    setSessionId,
  };

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}

export default ResumeContext;
