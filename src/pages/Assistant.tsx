import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  assistantApi,
  ProfileAnalysis,
  CVData,
  LinkedInOptimization,
  JobMatchResult,
  ApiValidationError,
} from "@/lib/api";
import {
  ALL_ROLES,
  ALL_SKILLS,
  LOCATIONS,
  EXPERIENCE_YEARS,
  EXPERIENCE_MONTHS,
  MIN_ROLES,
  MAX_ROLES,
  MAX_SKILLS_AUTO,
  MAX_SKILLS_WARNING,
} from "@/lib/constants";
import {
  validateEmail,
  validateFullName,
  validateLinkedInUrl,
  validateResume,
  validateSelfDescription,
  validateExperience,
  validateLocation,
  validateDesiredRoles,
  validateSkills,
  validateCoreFields,
  validateFullForm,
} from "@/lib/validation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle,
  Download,
  FileText,
  Linkedin,
  MapPin,
  Sparkles,
  Target,
  User,
  Copy,
  TrendingUp,
  AlertCircle,
  Brain,
  Clock,
  ExternalLink,
  Building2,
  Award,
  BookOpen,
  AlertTriangle,
  XCircle,
  Info,
  Wrench,
  Check,
  Upload,
  Loader2,
  Palette,
  Zap,
  FileEdit,
  Users,
  Mail,
  Phone,
  Star,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Resume Builder imports
import { ResumeProvider, useResume } from "@/contexts/ResumeContext";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TemplateSelector } from "@/components/resume/TemplateSelector";

// LinkedIn Profile Component
import { LinkedInProfile, LinkedInProfileData } from "@/components/linkedin/LinkedInProfile";

type TabId = "about" | "analysis" | "cv" | "resume-builder" | "linkedin" | "jobs";

const TABS: { id: TabId; label: string; icon: React.ElementType; step: number }[] = [
  { id: "about", label: "About You", icon: User, step: 1 },
  { id: "analysis", label: "Analysis", icon: Target, step: 2 },
  { id: "cv", label: "Your CV", icon: FileText, step: 3 },
  { id: "resume-builder", label: "Resume Builder", icon: Palette, step: 4 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, step: 5 },
  { id: "jobs", label: "Jobs", icon: Briefcase, step: 6 },
];

// Dark theme Header Component
function Header() {
  const navigate = useNavigate();
  return (
    <header className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              HireLoop
            </button>
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-violet-300 text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI Assistant
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </header>
  );
}

// Field Error Component with animation
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-400 flex items-center gap-1 mt-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
}

// Field Warning Component
function FieldWarning({ warning }: { warning?: string }) {
  if (!warning) return null;
  return (
    <p className="text-sm text-amber-400 flex items-center gap-1 mt-1.5 animate-in fade-in-0 duration-200">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{warning}</span>
    </p>
  );
}

// AI Thinking State Component - Dark Theme
function AIThinkingState({ message }: { message: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in-0 duration-500">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 flex items-center justify-center animate-pulse shadow-2xl shadow-violet-500/30">
          <Brain className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {/* Orbiting particles */}
        <div className="absolute inset-0 -m-4 animate-spin" style={{ animationDuration: "3s" }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-violet-400 rounded-full" />
        </div>
        <div className="absolute inset-0 -m-6 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-semibold bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">
          {message}{dots}
        </p>
        <p className="text-sm text-zinc-500">Analyzing your profile with AI</p>
      </div>
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full animate-bounce shadow-lg shadow-violet-500/30"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// Blocking Error Component - Dark Theme
function BlockingError({ title, message, onAction, actionLabel }: {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in-0 duration-300">
      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-zinc-400">{message}</p>
      </div>
      {onAction && actionLabel && (
        <Button onClick={onAction} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Progress Indicator Component - Dark Theme
function ProgressIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<TabId> }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {TABS.map((tab, index) => {
        const isCompleted = completedSteps.has(tab.id);
        const isCurrent = tab.step === currentStep;
        const isPast = tab.step < currentStep;

        return (
          <div key={tab.id} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                isCompleted
                  ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30"
                  : isCurrent
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white ring-4 ring-violet-500/30 shadow-lg shadow-violet-500/30"
                  : isPast
                  ? "bg-violet-500/20 text-violet-300"
                  : "bg-zinc-800 text-zinc-500"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                tab.step
              )}
            </div>
            {index < TABS.length - 1 && (
              <div
                className={cn(
                  "w-6 h-1 mx-1 rounded transition-all duration-300",
                  isCompleted || isPast ? "bg-gradient-to-r from-violet-500 to-purple-500" : "bg-zinc-800"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Section Header Component - Dark Theme
function SectionHeader({ icon: Icon, title, description, required = false }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
        <Icon className="h-5 w-5 text-violet-400" />
      </div>
      <div>
        <h3 className="font-semibold text-white flex items-center gap-2">
          {title}
          {required && <span className="text-red-400 text-sm">*</span>}
        </h3>
        {description && (
          <p className="text-sm text-zinc-300 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// Resume Builder Tab Content Component
function ResumeBuilderTabContent({ cvData, profileAnalysis, userInfo }: {
  cvData: CVData | null;
  profileAnalysis: ProfileAnalysis | null;
  userInfo: { fullName: string; email: string; location: string };
}) {
  const resumeRef = useRef<HTMLDivElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);
  const { state, loadFromAnalysis } = useResume();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load CV data into resume context ONLY ONCE when first available
  useEffect(() => {
    if (cvData && profileAnalysis && !dataLoaded) {
      // Transform CV data for resume context - pass ALL data
      loadFromAnalysis(
        {
          // Basic info
          fullName: cvData.fullName,
          email: cvData.email,
          phone: cvData.phone,
          location: cvData.location,
          linkedin: cvData.linkedin,
          title: cvData.title,
          summary: cvData.summary,
          // Experience and education from CV
          experience: cvData.experience || [],
          education: cvData.education || [],
          certifications: cvData.certifications || [],
          // Skills
          skills: cvData.skills,
          coreSkills: cvData.skills?.technical || profileAnalysis.coreSkills,
          softSkills: cvData.skills?.soft || profileAnalysis.softSkills || [],
          // Suggested roles from analysis
          suggestedRoles: profileAnalysis.suggestedRoles,
        },
        {
          fullName: cvData.fullName || userInfo.fullName,
          email: cvData.email || userInfo.email,
          phone: cvData.phone || "",
          location: cvData.location || userInfo.location,
          linkedin: cvData.linkedin || "",
        }
      );
      setDataLoaded(true);
    }
  }, [cvData, profileAnalysis, userInfo.fullName, userInfo.email, userInfo.location, loadFromAnalysis, dataLoaded]);

  const handleExportPDF = async () => {
    if (!pdfExportRef.current) return;
    setIsExporting(true);

    try {
      // Dynamic import of html2pdf
      const html2pdf = (await import("html2pdf.js")).default;

      // Use the hidden full-scale element for PDF export
      const element = pdfExportRef.current;

      const opt = {
        margin: 0,
        filename: `${state.data.contact.fullName || "Resume"}_Resume.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();

      toast.success("Resume exported as PDF!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAiImprove = async (section: string, content: string, context?: any) => {
    try {
      const response = await fetch("http://localhost:5000/assistant/improve-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, content, context }),
      });

      if (!response.ok) throw new Error("Failed to improve section");

      const result = await response.json();
      return result.data?.improved || content;
    } catch (error) {
      console.error("AI improvement failed:", error);
      toast.error("AI improvement temporarily unavailable");
      return content;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Palette className="h-6 w-6 text-white" />
            </div>
            Resume Builder
          </h2>
          <p className="text-zinc-400 mt-1">Customize your resume with AI-powered suggestions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Palette className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Template Selector (collapsible) */}
      {showTemplateSelector && (
        <Card className="bg-zinc-900/50 border-zinc-800 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="pt-4">
            <TemplateSelector compact />
            <div className="flex justify-end mt-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTemplateSelector(false)}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Editor Panel - 2 columns */}
        <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-zinc-800 py-3 px-4 flex-shrink-0">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <FileEdit className="h-4 w-4 text-violet-400" />
              Edit Resume
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-y-auto">
            <ResumeEditor onAiImprove={handleAiImprove} />
          </CardContent>
        </Card>

        {/* Preview Panel - 3 columns for larger preview */}
        <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-zinc-800 py-3 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-emerald-400" />
                Live Preview
              </CardTitle>
              <span className="text-xs text-zinc-500">
                {state.templateId.charAt(0).toUpperCase() + state.templateId.slice(1)} Template
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 overflow-auto flex items-start justify-center bg-zinc-800/30">
            <ResumePreview ref={resumeRef} scale={0.65} className="my-2" />
          </CardContent>
        </Card>
      </div>

      {/* Hidden full-scale render for PDF export */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm",
          minHeight: "297mm",
          background: "white",
        }}
      >
        <ResumePreview ref={pdfExportRef} scale={1} />
      </div>
    </div>
  );
}

// Main Assistant Component (wrapped with ResumeProvider)
function AssistantContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("about");
  const [loading, setLoading] = useState(false);
  const [aiThinkingMessage, setAiThinkingMessage] = useState("");

  // Form state
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [experienceMonths, setExperienceMonths] = useState("0");

  // Field errors and warnings
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Resume upload state
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [resumeAutoFilled, setResumeAutoFilled] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [showRawResume, setShowRawResume] = useState(false);

  // Results state
  const [profileAnalysis, setProfileAnalysis] = useState<ProfileAnalysis | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [linkedinOptimization, setLinkedinOptimization] = useState<LinkedInOptimization | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatchResult | null>(null);
  const [linkedinProfileData, setLinkedinProfileData] = useState<LinkedInProfileData | null>(null);

  // Completed steps tracking
  const [completedSteps, setCompletedSteps] = useState<Set<TabId>>(new Set());

  // Get current step
  const currentStep = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab);
    return tab?.step || 1;
  }, [activeTab]);

  // Check if core fields are valid (for proceeding)
  const coreFieldsValid = useMemo(() => {
    const result = validateCoreFields({
      fullName,
      email,
      desiredRoles: selectedRoles,
      location,
      experienceYears,
    });
    return result.valid;
  }, [fullName, email, selectedRoles, location, experienceYears]);

  // Scroll to top whenever the active tab changes so the user always
  // lands at the top of the new step instead of the bottom of the previous one.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  // Check if full form is valid (for AI analysis)
  const fullFormValidation = useMemo(() => {
    return validateFullForm({
      fullName,
      email,
      desiredRoles: selectedRoles,
      location,
      experienceYears,
      resumeText,
      selfDescription,
      linkedinUrl,
      selectedSkills,
    });
  }, [fullName, email, selectedRoles, location, experienceYears, resumeText, selfDescription, linkedinUrl, selectedSkills]);

  // Compute if form is ready for analysis
  const isFormReady = useMemo(() => {
    const hasFullName = fullName.trim().length > 0 && fullName.trim().split(/\s+/).length >= 2;
    const hasEmail = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasRoles = selectedRoles.length > 0;
    const hasLocation = location.trim().length > 0;
    const hasExperience = experienceYears !== '';
    const hasResume = resumeText.trim().split(/\s+/).length >= 50;
    const hasSkills = selectedSkills.length > 0;

    return hasFullName && hasEmail && hasRoles && hasLocation && hasExperience && hasResume && hasSkills;
  }, [fullName, email, selectedRoles, location, experienceYears, resumeText, selectedSkills]);

  // Get list of missing requirements
  const getMissingRequirements = useCallback((): string[] => {
    const missing: string[] = [];

    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) {
      missing.push("Full name (first and last)");
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      missing.push("Valid email address");
    }
    if (selectedRoles.length === 0) {
      missing.push("At least one desired role");
    }
    if (!location.trim()) {
      missing.push("Preferred location");
    }
    if (experienceYears === '') {
      missing.push("Total experience");
    }
    if (resumeText.trim().split(/\s+/).length < 50) {
      missing.push("Resume content (minimum 50 words)");
    }
    if (selectedSkills.length === 0) {
      missing.push("At least one skill");
    }

    return missing;
  }, [fullName, email, selectedRoles, location, experienceYears, resumeText, selectedSkills]);

  const missingRequirements = useMemo(() => getMissingRequirements(), [getMissingRequirements]);

  // Real-time field validation
  const validateField = useCallback((field: string, value: string | string[]) => {
    let result;
    switch (field) {
      case 'fullName':
        result = validateFullName(value as string);
        break;
      case 'email':
        result = validateEmail(value as string);
        break;
      case 'selfDescription':
        result = validateSelfDescription(value as string);
        break;
      case 'linkedinUrl':
        result = validateLinkedInUrl(value as string);
        break;
      case 'experienceYears':
        result = validateExperience(value as string);
        break;
      case 'location':
        result = validateLocation(value as string);
        break;
      case 'resumeText':
        result = validateResume(value as string);
        break;
      case 'selectedRoles':
        result = validateDesiredRoles(value as string[]);
        break;
      case 'selectedSkills':
        result = validateSkills(value as string[]);
        break;
      default:
        return;
    }

    const optionalFields = ['linkedinUrl', 'selfDescription'];
    if (optionalFields.includes(field)) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      if (result.valid) {
        if (result.warning) {
          setWarnings(prev => ({ ...prev, [field]: result.warning! }));
        } else {
          setWarnings(prev => {
            const newWarnings = { ...prev };
            delete newWarnings[field];
            return newWarnings;
          });
        }
      } else if (touched[field]) {
        setWarnings(prev => ({ ...prev, [field]: result.error! }));
      }
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      if (result.valid) {
        delete newErrors[field];
      } else if (touched[field]) {
        newErrors[field] = result.error!;
      }
      return newErrors;
    });

    if (result.warning) {
      setWarnings(prev => ({ ...prev, [field]: result.warning! }));
    } else {
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[field];
        return newWarnings;
      });
    }
  }, [touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Reset all form state to start fresh
  const handleStartFresh = useCallback(() => {
    // Clear all form fields
    setFullName("");
    setEmail("");
    setSelfDescription("");
    setResumeText("");
    setLinkedinUrl("");
    setSelectedRoles([]);
    setSelectedSkills([]);
    setLocation("");
    setExperienceYears("");
    setExperienceMonths("0");

    // Clear validation state
    setErrors({});
    setWarnings({});
    setTouched({});

    // Clear results
    setProfileAnalysis(null);
    setCvData(null);
    setLinkedinOptimization(null);
    setJobMatches(null);

    // Reset progress
    setCompletedSteps(new Set());
    setActiveTab("about");

    // Clear upload state
    setUploadedFileName(null);
    setIsUploadingResume(false);
    setResumeAutoFilled(false);
    setAutoFilledFields([]);

    toast.success("Form cleared! Start fresh.");
  }, []);

  const validateAllFields = (): boolean => {
    const result = fullFormValidation;

    const allTouched: Record<string, boolean> = {};
    Object.keys(result.errors).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(prev => ({ ...prev, ...allTouched }));

    setErrors(result.errors);
    setWarnings(result.warnings);

    return result.valid;
  };

  const handleAnalyze = async () => {
    if (!validateAllFields()) {
      const firstError = document.querySelector('[class*="border-red"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setAiThinkingMessage("AI analyzing your profile");

    await new Promise(resolve => setTimeout(resolve, 3500));

    try {
      const totalExperience = `${experienceYears} years${experienceMonths !== "0" ? ` ${experienceMonths} months` : ""}`;

      const result = await assistantApi.analyzeProfile({
        selfDescription,
        resumeText,
        linkedinText: linkedinUrl,
        desiredRole: selectedRoles.join(", "),
        locations: location ? [location] : undefined,
        fullName,
        email,
        phone,
        totalExperience,
        selectedSkills,
      });

      setProfileAnalysis(result.data);
      setCompletedSteps(prev => new Set([...prev, "about"]));
      setActiveTab("analysis");
      toast.success("Profile analyzed successfully!");
    } catch (error: unknown) {
      console.error("[Analyze] Failed:", error);

      if (error instanceof ApiValidationError && error.details) {
        const fieldMapping: Record<string, string> = {
          totalExperience: 'experienceYears',
          resumeText: 'resumeText',
          fullName: 'fullName',
          email: 'email',
          desiredRoles: 'selectedRoles',
          location: 'location',
          linkedinUrl: 'linkedinUrl',
          selectedSkills: 'selectedSkills',
          selfDescription: 'selfDescription',
        };

        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};

        Object.entries(error.details).forEach(([field, message]) => {
          const frontendField = fieldMapping[field] || field;
          newErrors[frontendField] = message as string;
          newTouched[frontendField] = true;
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        setTouched(prev => ({ ...prev, ...newTouched }));

        toast("Some fields had issues - analysis may be limited", { icon: "⚠️" });
      } else {
        // Network error (TypeError: Failed to fetch) → backend is down
        const isNetworkError =
          error instanceof TypeError ||
          (error instanceof Error && /fetch|network|load failed/i.test(error.message));

        if (isNetworkError) {
          toast.error("Can't reach the server. Make sure the backend is running on port 5000.", {
            duration: 6000,
          });
        } else {
          const msg = error instanceof Error ? error.message : "Unknown error";
          toast.error(`Analysis failed: ${msg}`);
        }
      }
    } finally {
      setLoading(false);
      setAiThinkingMessage("");
    }
  };

  const handleGenerateCV = async () => {
    if (!profileAnalysis) return;

    setLoading(true);
    setAiThinkingMessage("AI generating your CV");

    await new Promise(resolve => setTimeout(resolve, 4000));

    try {
      const result = await assistantApi.generateCV(
        profileAnalysis,
        { fullName, email, phone, location, linkedinUrl, selfDescription },
        resumeText
      );

      setCvData(result.data);
      setCompletedSteps(prev => new Set([...prev, "analysis"]));
      setActiveTab("cv");
      toast.success("CV generated!");
    } catch {
      toast("Using basic CV generation (AI unavailable)", { icon: "⚠️" });
    } finally {
      setLoading(false);
      setAiThinkingMessage("");
    }
  };

  const handleDownloadCV = async () => {
    if (!cvData) return;
    try {
      await assistantApi.downloadCV(cvData);
      toast.success("CV downloaded!");
    } catch {
      toast.error("Failed to download CV. Please try again.");
    }
  };

  const handleOptimizeLinkedIn = async () => {
    if (!profileAnalysis) return;

    setLoading(true);
    setAiThinkingMessage("AI optimizing your LinkedIn");

    await new Promise(resolve => setTimeout(resolve, 3500));

    try {
      const result = await assistantApi.optimizeLinkedIn(
        profileAnalysis,
        { fullName, email, phone, location, linkedinUrl, selfDescription, resumeText },
        { url: linkedinUrl },
        cvData || undefined // Pass CV data for experience, education, etc.
      );

      setLinkedinOptimization(result.data);
      setCompletedSteps(prev => new Set([...prev, "cv", "resume-builder"]));
      setActiveTab("linkedin");
      toast.success("LinkedIn optimized!");
    } catch {
      toast("Using basic LinkedIn optimization (AI unavailable)", { icon: "⚠️" });
    } finally {
      setLoading(false);
      setAiThinkingMessage("");
    }
  };

  const handleMatchJobs = async () => {
    if (!profileAnalysis) return;

    setLoading(true);
    setAiThinkingMessage("AI finding best job matches");

    await new Promise(resolve => setTimeout(resolve, 4000));

    try {
      const result = await assistantApi.matchJobs(profileAnalysis, cvData || undefined, {
        desiredRoles: selectedRoles, // Pass ALL selected roles
        location,
        experienceYears: parseInt(experienceYears) || 0,
      });

      setJobMatches(result.data);
      setCompletedSteps(prev => new Set([...prev, "linkedin"]));
      setActiveTab("jobs");
      toast.success("Jobs matched!");
    } catch {
      toast("Using basic job matching (AI unavailable)", { icon: "⚠️" });
    } finally {
      setLoading(false);
      setAiThinkingMessage("");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Handle LinkedIn section AI improvement
  const handleImproveLinkedInSection = async (section: string, content: string): Promise<string> => {
    try {
      const result = await assistantApi.improveSection(section, content, {
        role: profileAnalysis?.suggestedRoles?.[0] || "",
        skills: profileAnalysis?.coreSkills || [],
        experience: profileAnalysis?.yearsOfExperience || 0,
      });
      return result.data?.improved || content;
    } catch (error) {
      console.error("Failed to improve section:", error);
      throw error;
    }
  };

  // Handle resume file upload
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setUploadedFileName(file.name);
    setResumeAutoFilled(false);
    setAutoFilledFields([]);
    setShowRawResume(false);

    try {
      const result = await assistantApi.uploadResume(file) as {
        success: boolean;
        data: {
          text: string;
          wordCount: number;
          extractedData: {
            name: string | null;
            email: string | null;
            phone: string | null;
            linkedin: string | null;
            skills: string[];
            suggestedRoles: string[];
            rawSkillTokens?: string[];
          };
        };
        suggestions?: {
          skills: string[];
          profileSummary: string[];
          experienceYears: number | null;
          primaryDomain: string | null;
          aiGenerated: boolean;
        };
        message?: string;
      };

      console.log('[Resume Upload] Full API response:', JSON.stringify(result, null, 2));

      if (result?.success && result?.data) {
        const { text, extractedData } = result.data;
        const suggestions = result.suggestions;
        const filledFields: string[] = [];

        // AUTO-FILL RESUME TEXT (PRIMARY)
        if (text && text.trim().length > 0) {
          setResumeText(text);
          setTouched(prev => ({ ...prev, resumeText: true }));
          filledFields.push("Resume Content");
        }

        // AUTO-FILL FULL NAME
        if (extractedData?.name) {
          setFullName(extractedData.name);
          setTouched(prev => ({ ...prev, fullName: true }));
          filledFields.push("Full Name");
        }

        // AUTO-FILL EMAIL
        if (extractedData?.email) {
          setEmail(extractedData.email);
          setTouched(prev => ({ ...prev, email: true }));
          filledFields.push("Email");
        }

        // AUTO-FILL PHONE
        if (extractedData?.phone) {
          setPhone(extractedData.phone);
          setTouched(prev => ({ ...prev, phone: true }));
          filledFields.push("Phone");
        }

        // AUTO-FILL LINKEDIN URL
        if (extractedData?.linkedin) {
          setLinkedinUrl(extractedData.linkedin);
          setTouched(prev => ({ ...prev, linkedinUrl: true }));
          filledFields.push("LinkedIn URL");
        }

        // AUTO-SELECT SKILLS (TOP 10 from resume)
        // Merge backend-detected skills with raw skill tokens from resume's skills sections
        const backendSkills = (suggestions?.skills && suggestions.skills.length > 0)
          ? suggestions.skills
          : extractedData?.skills || [];
        const rawTokens = extractedData?.rawSkillTokens || [];
        // Deduplicate: backend skills first, then raw tokens (case-insensitive)
        const seenLower = new Set(backendSkills.map(s => s.toLowerCase()));
        const mergedSkills = [...backendSkills];
        for (const token of rawTokens) {
          if (!seenLower.has(token.toLowerCase())) {
            seenLower.add(token.toLowerCase());
            mergedSkills.push(token);
          }
        }
        const skillsToUse = mergedSkills;

        console.log('[Resume Upload] Skills from backend:', backendSkills.length, '+ raw tokens:', rawTokens.length, '= merged:', skillsToUse.length);

        if (skillsToUse.length > 0) {
          // Match skills against our predefined skill list (ALL_SKILLS is array of {value, label, category})
          const normalizedSkills: string[] = [];

          for (const skill of skillsToUse) {
            const skillLower = skill.toLowerCase();
            // Find exact or close match in our skill list
            const match = ALL_SKILLS.find(s =>
              s.value.toLowerCase() === skillLower ||
              s.value.toLowerCase().includes(skillLower) ||
              skillLower.includes(s.value.toLowerCase())
            );
            if (match && !normalizedSkills.includes(match.value)) {
              normalizedSkills.push(match.value);
            }
          }

          console.log('[Resume Upload] Matched skills:', normalizedSkills);

          // Auto-select TOP 10 skills (MAX_SKILLS_AUTO)
          const uniqueSkills = normalizedSkills.slice(0, MAX_SKILLS_AUTO);
          if (uniqueSkills.length > 0) {
            setSelectedSkills(uniqueSkills);
            setTouched(prev => ({ ...prev, selectedSkills: true }));
            filledFields.push(`${uniqueSkills.length} Skills`);
            console.log('[Resume Upload] Auto-selected skills:', uniqueSkills);
          }
        }

        // AUTO-FILL SELF-DESCRIPTION from AI summary
        if (suggestions?.profileSummary && suggestions.profileSummary.length > 0) {
          const summaryText = suggestions.profileSummary.join(' ');
          setSelfDescription(summaryText);
          setTouched(prev => ({ ...prev, selfDescription: true }));
          filledFields.push("About You");
        }

        // AUTO-SELECT TOP 3 ROLES from resume
        console.log('[Resume Upload] Suggested roles from backend:', extractedData?.suggestedRoles);

        if (extractedData?.suggestedRoles && extractedData.suggestedRoles.length > 0) {
          // ALL_ROLES is array of {value, label, category} - fuzzy match against value
          const matchedRoles: string[] = [];
          const stopWords = new Set(["and", "the", "of", "in", "a", "an", "for", "to", "with", "at", "on", "by"]);
          const getSignificantWords = (str: string) =>
            str.toLowerCase().split(/[\s/&-]+/).filter(w => w.length > 1 && !stopWords.has(w));

          for (const role of extractedData.suggestedRoles) {
            const roleLower = role.toLowerCase();

            // Tier 1: Exact case-insensitive match
            let match = ALL_ROLES.find(r => r.value.toLowerCase() === roleLower);

            // Tier 2: Substring contains (e.g. "Backend Developer" in "Senior Backend Developer")
            if (!match) {
              match = ALL_ROLES.find(r =>
                r.value.toLowerCase().includes(roleLower) ||
                roleLower.includes(r.value.toLowerCase())
              );
            }

            // Tier 3: Word overlap (2+ significant words match)
            if (!match) {
              const roleWords = getSignificantWords(role);
              match = ALL_ROLES.find(r => {
                const candidateWords = getSignificantWords(r.value);
                const overlap = roleWords.filter(w => candidateWords.includes(w)).length;
                return overlap >= 2;
              });
            }

            if (match && !matchedRoles.includes(match.value)) {
              matchedRoles.push(match.value);
            }
          }

          console.log('[Resume Upload] Matched roles:', matchedRoles);

          if (matchedRoles.length > 0) {
            // Select roles: minimum 3, maximum 10 (or all if fewer than 3)
            const rolesToSelect = matchedRoles.slice(0, Math.max(MIN_ROLES, Math.min(matchedRoles.length, MAX_ROLES)));
            setSelectedRoles(rolesToSelect);
            setTouched(prev => ({ ...prev, selectedRoles: true }));
            filledFields.push(`${rolesToSelect.length} Roles`);
            console.log('[Resume Upload] Auto-selected roles:', rolesToSelect);
          }
        }

        // AUTO-FILL EXPERIENCE YEARS (if detected)
        if (suggestions?.experienceYears !== null && suggestions?.experienceYears !== undefined) {
          const years = Math.min(Math.max(0, Math.round(suggestions.experienceYears)), 20);
          setExperienceYears(years.toString());
          setTouched(prev => ({ ...prev, experienceYears: true }));
          filledFields.push("Experience");
        }

        // Mark as auto-filled if we filled anything
        if (filledFields.length > 0) {
          setResumeAutoFilled(true);
          setAutoFilledFields(filledFields);
        }

        // Show success with details
        if (filledFields.length > 0) {
          const aiIndicator = suggestions?.aiGenerated ? " with AI" : "";
          toast.success(`Resume analyzed${aiIndicator}! Auto-filled: ${filledFields.slice(0, 3).join(", ")}${filledFields.length > 3 ? ` +${filledFields.length - 3} more` : ""}`);
        } else {
          toast("Resume received - please fill in the details manually", { icon: "📝" });
        }
      } else {
        toast("Resume received - please fill in the details manually", { icon: "📝" });
      }
    } catch {
      toast("Resume uploaded - please fill in the details manually", { icon: "📝" });
    } finally {
      setIsUploadingResume(false);
      event.target.value = "";
    }
  };

  // Check if tab is accessible
  const isTabAccessible = (tabId: TabId): boolean => {
    if (tabId === "about") return true;
    if (tabId === "analysis") return completedSteps.has("about") || profileAnalysis !== null;
    if (tabId === "cv") return completedSteps.has("analysis") || cvData !== null;
    if (tabId === "resume-builder") return completedSteps.has("analysis") || cvData !== null;
    if (tabId === "linkedin") return completedSteps.has("cv") || linkedinOptimization !== null;
    if (tabId === "jobs") return completedSteps.has("linkedin") || jobMatches !== null;
    return false;
  };

  const handleTabChange = (tabId: string) => {
    if (isTabAccessible(tabId as TabId)) {
      setActiveTab(tabId as TabId);
    }
  };

  // Dark theme input classes
  const inputClass = "bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20";
  const labelClass = "text-white";

  // Extract up to 10 meaningful highlight lines from the raw resume text
  const resumeHighlights = useMemo(() => {
    if (!resumeText) return [];
    const seen = new Set<string>();
    const HEADER_WORDS = /^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|SUMMARY|OBJECTIVE|PROFILE|CONTACT|LANGUAGES|INTERESTS|AWARDS|PUBLICATIONS|REFERENCES|WORK HISTORY|PROFESSIONAL EXPERIENCE|TECHNICAL SKILLS|CORE COMPETENCIES)[\s:]*$/i;

    const lines = resumeText
      .split(/\r?\n/)
      .map((l) => l.replace(/^[\s•●▪◦·\-–—*→]+/, "").trim())
      .filter((l) => {
        if (l.length < 20 || l.length > 300) return false;
        if (HEADER_WORDS.test(l)) return false;
        // Skip lines that are mostly contact info (email, phone, URL on its own)
        if (/^\S+@\S+\.\S+$/.test(l)) return false;
        if (/^[\d+()\s-]{7,}$/.test(l)) return false;
        if (/^(https?:|www\.|linkedin\.com)/i.test(l)) return false;
        // Skip lines that are ALL CAPS very short (likely section headers)
        if (l === l.toUpperCase() && l.length < 40 && !/\d/.test(l)) return false;
        const key = l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    // Prefer lines with strong signal: metrics, action verbs, role words, years
    const ACTION = /\b(led|built|managed|designed|developed|launched|scaled|grew|drove|delivered|implemented|optimized|increased|reduced|created|founded|architected|directed|improved|pioneered|established|transformed|headed|spearheaded)\b/i;
    const ROLE = /\b(manager|engineer|director|lead|founder|ceo|cto|cfo|vp|president|analyst|consultant|architect|specialist|scientist|designer|developer|officer|head|principal)\b/i;
    const METRIC = /(\d+%|\d+[kKmMbB]\b|\$\d|\d+\+|\d+ ?(years?|months?|million|billion|clients?|users?|projects?|teams?))/;

    const scored = lines.map((line) => {
      let score = 0;
      if (ACTION.test(line)) score += 3;
      if (METRIC.test(line)) score += 3;
      if (ROLE.test(line)) score += 2;
      if (/\b(19|20)\d{2}\b/.test(line)) score += 1; // has a year
      if (line.length > 60 && line.length < 160) score += 1; // ideal length
      return { line, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map((s) => s.line);
  }, [resumeText]);

  // Show AI thinking state when loading
  if (loading && aiThinkingMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />
          <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl shadow-violet-500/5">
            <CardContent className="pt-6">
              <AIThinkingState message={aiThinkingMessage} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Header />

      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content with Tabs */}
      <div className="relative max-w-6xl mx-auto px-4 py-6">
        <ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-zinc-900/80 border border-zinc-800 p-1">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={!isTabAccessible(tab.id)}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/20",
                  "text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
                {completedSteps.has(tab.id) && (
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab 1: About You */}
          <TabsContent value="about" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl shadow-violet-500/5">
              <CardHeader className="pb-4 border-b border-zinc-800">
                <CardTitle className="flex items-center gap-3 text-xl text-white">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  Get Started in Seconds
                </CardTitle>
                <CardDescription className="text-white">
                  Upload your resume and we'll do the rest. AI extracts your details automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {/* STEP 1: RESUME UPLOAD - PRIMARY CTA AT TOP */}
                <div className="space-y-4">
                  <div className={cn(
                    "relative p-6 rounded-2xl border-2 border-dashed transition-all duration-300",
                    isUploadingResume
                      ? "border-violet-500 bg-violet-500/10"
                      : resumeAutoFilled
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-zinc-700 bg-zinc-800/30 hover:border-violet-500/50 hover:bg-zinc-800/50"
                  )}>
                    {/* Upload Area */}
                    <div className="text-center">
                      {isUploadingResume ? (
                        // Loading State
                        <div className="py-4 animate-in fade-in-0 duration-300">
                          <div className="relative mx-auto w-16 h-16 mb-4">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 animate-pulse" />
                            <div className="absolute inset-2 rounded-full bg-zinc-900 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                            </div>
                          </div>
                          <p className="text-lg font-medium text-violet-300">Analyzing your resume...</p>
                          <p className="text-sm text-zinc-300 mt-1">Extracting skills, experience, and contact info</p>
                        </div>
                      ) : resumeAutoFilled ? (
                        // Success State
                        <div className="py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-lg font-medium text-emerald-400">Resume analyzed successfully!</p>
                          <p className="text-sm text-zinc-200 mt-1">
                            Your details have been auto-filled. You can edit anything below.
                          </p>
                          {autoFilledFields.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center mt-3">
                              {autoFilledFields.map((field, i) => (
                                <Badge key={i} variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                  <Check className="h-3 w-3 mr-1" />
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-4 text-zinc-500 hover:text-zinc-300"
                            onClick={() => document.getElementById('resume-upload-main')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload a different resume
                          </Button>
                        </div>
                      ) : (
                        // Default Upload State
                        <div className="py-6">
                          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                            <Upload className="h-10 w-10 text-violet-400" />
                          </div>
                          <p className="text-xl font-semibold text-white mb-2">Upload Your Resume</p>
                          <p className="text-zinc-200 mb-4">
                            Drop your resume here or click to browse
                          </p>
                          <Button
                            type="button"
                            size="lg"
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30"
                            onClick={() => document.getElementById('resume-upload-main')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File (PDF, DOCX, TXT)
                          </Button>
                          <p className="text-xs text-zinc-300 mt-3">
                            Max 5MB • Your resume will auto-fill all fields below
                          </p>
                        </div>
                      )}

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id="resume-upload-main"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleResumeUpload}
                        className="hidden"
                        disabled={isUploadingResume}
                      />
                    </div>
                  </div>

                  {/* Divider with "or" */}
                  {!resumeAutoFilled && !isUploadingResume && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900 px-4 text-zinc-300">or fill manually</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={User}
                    title="Personal Information"
                    description={resumeAutoFilled ? "Auto-filled from your resume • Edit if needed" : "Basic details for your profile"}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-11">
                    <div className="space-y-2">
                      <Label htmlFor="name" className={labelClass}>
                        Full Name *
                        {autoFilledFields.includes("Full Name") && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            Auto-filled
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="name"
                        autoComplete="off"
                        placeholder={resumeAutoFilled && !fullName ? "Add your full name" : "First Last (e.g., Rahul Sharma)"}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (touched.fullName) validateField('fullName', e.target.value);
                        }}
                        onBlur={() => {
                          handleBlur('fullName');
                          validateField('fullName', fullName);
                        }}
                        className={cn(
                          inputClass,
                          "transition-all duration-200",
                          errors.fullName && touched.fullName ? 'border-red-500 focus:ring-red-500/20' : '',
                          autoFilledFields.includes("Full Name") && fullName ? 'border-emerald-500/30' : ''
                        )}
                      />
                      <FieldError error={touched.fullName ? errors.fullName : undefined} />
                      {resumeAutoFilled && !fullName && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Add missing detail
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className={labelClass}>
                        Email *
                        {autoFilledFields.includes("Email") && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            Auto-filled
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="off"
                        placeholder={resumeAutoFilled && !email ? "Add your email address" : "your.email@gmail.com"}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (touched.email) validateField('email', e.target.value);
                        }}
                        onBlur={() => {
                          handleBlur('email');
                          validateField('email', email);
                        }}
                        className={cn(
                          inputClass,
                          "transition-all duration-200",
                          errors.email && touched.email ? 'border-red-500 focus:ring-red-500/20' : '',
                          autoFilledFields.includes("Email") && email ? 'border-emerald-500/30' : ''
                        )}
                      />
                      <FieldError error={touched.email ? errors.email : undefined} />
                      {resumeAutoFilled && !email && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Add missing detail
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className={labelClass}>
                        Phone
                        {autoFilledFields.includes("Phone") && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            Auto-filled
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="off"
                        placeholder={resumeAutoFilled && !phone ? "Add your phone number" : "+91 98765 43210"}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={cn(
                          inputClass,
                          "transition-all duration-200",
                          autoFilledFields.includes("Phone") && phone ? 'border-emerald-500/30' : ''
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Career Preferences Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Briefcase}
                    title="Career Preferences"
                    description={resumeAutoFilled ? "Auto-selected from your resume • Edit if needed" : "Your target roles and experience"}
                    required
                  />
                  <div className="space-y-4 pl-11">
                    {/* Desired Roles */}
                    <div className="space-y-2">
                      <Label className={labelClass}>
                        Desired Roles * (Select {MIN_ROLES}-{MAX_ROLES})
                        {autoFilledFields.some(f => f.includes("Roles")) && selectedRoles.length > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            Auto-selected
                          </Badge>
                        )}
                      </Label>
                      <MultiSelect
                        options={ALL_ROLES}
                        selected={selectedRoles}
                        onChange={(roles) => {
                          setSelectedRoles(roles);
                          setTouched(prev => ({ ...prev, selectedRoles: true }));
                          validateField('selectedRoles', roles);
                        }}
                        placeholder="Search and select roles..."
                        searchPlaceholder="Search roles (e.g., Frontend Developer, Product Manager)..."
                        maxItems={MAX_ROLES}
                        maxItemsMessage={`You can select up to ${MAX_ROLES} roles for focused job matching`}
                        showCategories={true}
                        className={cn(
                          "[&_button]:bg-zinc-800/50 [&_button]:border-zinc-700 [&_button]:text-white [&_button]:hover:bg-zinc-700",
                          errors.selectedRoles && touched.selectedRoles ? '[&_button]:border-red-500' : '',
                          autoFilledFields.some(f => f.includes("Roles")) && selectedRoles.length > 0 ? '[&_button]:border-emerald-500/30' : ''
                        )}
                      />
                      <FieldError error={touched.selectedRoles ? errors.selectedRoles : undefined} />
                      {resumeAutoFilled && selectedRoles.length === 0 && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Select at least {MIN_ROLES} roles
                        </p>
                      )}
                    </div>

                    {/* Location and Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location" className={labelClass}>Preferred Location *</Label>
                        <Select
                          value={location}
                          onValueChange={(val) => {
                            setLocation(val);
                            setTouched(prev => ({ ...prev, location: true }));
                            validateField('location', val);
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              inputClass,
                              "transition-all duration-200",
                              errors.location && touched.location ? 'border-red-500' : ''
                            )}
                          >
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {Object.entries(LOCATIONS).map(([region, locations]) => (
                              <SelectGroup key={region}>
                                <SelectLabel className="text-violet-400 font-semibold">{region}</SelectLabel>
                                {locations.map((loc) => (
                                  <SelectItem key={loc} value={loc} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                                    {loc}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError error={touched.location ? errors.location : undefined} />
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>
                          Total Experience *
                          {autoFilledFields.includes("Experience") && experienceYears && (
                            <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                              Auto-detected
                            </Badge>
                          )}
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={experienceYears}
                            onValueChange={(val) => {
                              setExperienceYears(val);
                              setTouched(prev => ({ ...prev, experienceYears: true }));
                              validateField('experienceYears', val);
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                inputClass,
                                "transition-all duration-200",
                                errors.experienceYears && touched.experienceYears ? 'border-red-500' : '',
                                autoFilledFields.includes("Experience") && experienceYears ? 'border-emerald-500/30' : ''
                              )}
                            >
                              <SelectValue placeholder="Years" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              {EXPERIENCE_YEARS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={experienceMonths} onValueChange={setExperienceMonths}>
                            <SelectTrigger className={inputClass}>
                              <SelectValue placeholder="Months" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700">
                              {EXPERIENCE_MONTHS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FieldError error={touched.experienceYears ? errors.experienceYears : undefined} />
                        {resumeAutoFilled && !experienceYears && (
                          <p className="text-xs text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Select your experience level
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Wrench}
                    title="Your Skillset"
                    description={resumeAutoFilled ? "Auto-extracted from your resume • Add or remove skills" : "Select your key skills - helps with job matching and resume optimization"}
                    required
                  />
                  <div className="pl-11">
                    <div className="space-y-2">
                      <Label className={labelClass}>
                        Skills *
                        {autoFilledFields.some(f => f.includes("Skills")) && selectedSkills.length > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            {selectedSkills.length} auto-selected
                          </Badge>
                        )}
                      </Label>
                      <MultiSelect
                        options={ALL_SKILLS}
                        selected={selectedSkills}
                        onChange={(skills) => {
                          setSelectedSkills(skills);
                          setTouched(prev => ({ ...prev, selectedSkills: true }));
                          validateField('selectedSkills', skills);
                        }}
                        placeholder="Search and select your skills..."
                        searchPlaceholder="Search skills (e.g., React, Python, Sales)..."
                        showCategories={true}
                        warnAfter={MAX_SKILLS_WARNING}
                        warnMessage="Consider focusing on your top skills for better job matching"
                        className={cn(
                          "[&_button]:bg-zinc-800/50 [&_button]:border-zinc-700 [&_button]:text-white [&_button]:hover:bg-zinc-700",
                          errors.selectedSkills && touched.selectedSkills ? '[&_button]:border-red-500' : '',
                          autoFilledFields.some(f => f.includes("Skills")) && selectedSkills.length > 0 ? '[&_button]:border-emerald-500/30' : ''
                        )}
                      />
                    </div>
                    <FieldError error={touched.selectedSkills ? errors.selectedSkills : undefined} />
                    {resumeAutoFilled && selectedSkills.length === 0 && (
                      <p className="text-xs text-amber-400 flex items-center gap-1 mt-2">
                        <AlertTriangle className="h-3 w-3" />
                        Select at least one skill
                      </p>
                    )}
                    <p className="text-xs text-zinc-300 mt-2">
                      {resumeAutoFilled
                        ? "These skills were extracted from your resume. Feel free to add or remove any."
                        : "AI will cross-check your resume skills with your selections to flag inconsistencies."}
                    </p>
                  </div>
                </div>

                {/* Resume Content Section - Collapsed if auto-filled, expandable */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={FileText}
                    title="Resume Highlights"
                    description={resumeAutoFilled ? "Key points extracted from your resume" : "Paste your resume content for AI analysis"}
                    required
                  />
                  <div className="pl-11 space-y-4">
                    {/* Highlights Card - shown when auto-filled with content */}
                    {resumeAutoFilled && resumeHighlights.length > 0 && !showRawResume && (
                      <div className="relative rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-zinc-900/40 to-purple-500/5 p-4 sm:p-5 shadow-lg shadow-violet-500/5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex-shrink-0">
                              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                            </div>
                            <span className="text-sm font-semibold text-white">
                              Top {resumeHighlights.length} {resumeHighlights.length === 1 ? "Highlight" : "Highlights"}
                            </span>
                            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                              Auto-extracted
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRawResume(true)}
                            className="h-8 text-xs text-violet-300 hover:text-white hover:bg-violet-500/10"
                          >
                            <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                            Edit raw text
                          </Button>
                        </div>

                        <ul className="space-y-2.5">
                          {resumeHighlights.map((highlight, idx) => (
                            <li
                              key={idx}
                              className="group flex items-start gap-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3 transition-all duration-200 hover:border-violet-500/30 hover:bg-zinc-900/70"
                            >
                              <div
                                aria-hidden="true"
                                className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-[11px] font-bold text-violet-200"
                              >
                                {idx + 1}
                              </div>
                              <p className="text-sm leading-relaxed text-zinc-200 group-hover:text-white break-words">
                                {highlight.length > 220 ? `${highlight.slice(0, 217)}…` : highlight}
                              </p>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-4 flex items-start gap-2 rounded-lg bg-zinc-900/40 border border-zinc-800 px-3 py-2">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-zinc-400">
                            Your full resume is preserved and used for CV generation — these are just the most important lines.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Raw Text Editor - shown when not auto-filled OR when user wants to edit */}
                    {(!resumeAutoFilled || showRawResume || resumeHighlights.length === 0) && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="resume" className="text-sm text-white flex items-center gap-2">
                            Resume Text *
                            {autoFilledFields.includes("Resume Content") && resumeText && (
                              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                Auto-extracted
                              </Badge>
                            )}
                          </Label>
                          {resumeAutoFilled && resumeHighlights.length > 0 && showRawResume && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowRawResume(false)}
                              className="h-8 text-xs text-violet-300 hover:text-white hover:bg-violet-500/10"
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              View highlights
                            </Button>
                          )}
                        </div>
                        <Textarea
                          id="resume"
                          autoComplete="off"
                          placeholder={resumeAutoFilled ? "Resume content extracted from your file" : "Paste your complete resume content here. Include your work experience, education, skills, projects, and achievements..."}
                          value={resumeText}
                          onChange={(e) => {
                            setResumeText(e.target.value);
                            if (touched.resumeText && e.target.value.length > 20) {
                              validateField('resumeText', e.target.value);
                            }
                          }}
                          onBlur={() => {
                            handleBlur('resumeText');
                            validateField('resumeText', resumeText);
                          }}
                          className={cn(
                            inputClass,
                            "transition-all duration-200",
                            resumeAutoFilled ? "min-h-[160px]" : "min-h-[180px]",
                            errors.resumeText && touched.resumeText ? 'border-red-500 focus:ring-red-500/20' : '',
                            autoFilledFields.includes("Resume Content") && resumeText ? 'border-emerald-500/30' : ''
                          )}
                        />
                        <FieldError error={touched.resumeText ? errors.resumeText : undefined} />
                        <FieldWarning warning={warnings.resumeText} />
                        <p className="text-xs text-zinc-400">
                          {resumeAutoFilled
                            ? "Edits here are saved automatically and used for CV & LinkedIn generation."
                            : "AI extracts skills and generates your CV from this content. The more detailed your resume, the better the analysis."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Linkedin}
                    title="Additional Information"
                    description={resumeAutoFilled ? "Auto-filled where possible • Edit or add more" : "Optional but recommended for better optimization"}
                  />
                  <div className="space-y-4 pl-11">
                    <div className="space-y-2">
                      <Label htmlFor="self" className={labelClass}>
                        About You (Optional)
                        {autoFilledFields.includes("About You") && selfDescription && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            AI-generated
                          </Badge>
                        )}
                      </Label>
                      <Textarea
                        id="self"
                        autoComplete="off"
                        placeholder="Describe your professional background, key achievements, and career goals in a few sentences..."
                        value={selfDescription}
                        onChange={(e) => {
                          setSelfDescription(e.target.value);
                          if (touched.selfDescription) validateField('selfDescription', e.target.value);
                        }}
                        onBlur={() => {
                          handleBlur('selfDescription');
                          validateField('selfDescription', selfDescription);
                        }}
                        className={cn(
                          inputClass,
                          "min-h-[100px] transition-all duration-200",
                          autoFilledFields.includes("About You") && selfDescription ? 'border-emerald-500/30' : ''
                        )}
                      />
                      <FieldWarning warning={touched.selfDescription ? warnings.selfDescription : undefined} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className={labelClass}>
                        LinkedIn Profile URL (Optional)
                        {autoFilledFields.includes("LinkedIn URL") && linkedinUrl && (
                          <Badge variant="outline" className="ml-2 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                            Auto-filled
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="linkedin"
                        autoComplete="off"
                        placeholder="https://www.linkedin.com/in/yourprofile"
                        value={linkedinUrl}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          if (touched.linkedinUrl) {
                            validateField('linkedinUrl', e.target.value);
                          }
                        }}
                        onBlur={() => {
                          handleBlur('linkedinUrl');
                          validateField('linkedinUrl', linkedinUrl);
                        }}
                        className={cn(
                          inputClass,
                          "transition-all duration-200",
                          autoFilledFields.includes("LinkedIn URL") && linkedinUrl ? 'border-emerald-500/30' : ''
                        )}
                      />
                      <FieldWarning warning={touched.linkedinUrl ? warnings.linkedinUrl : undefined} />
                    </div>
                  </div>
                </div>

                {/* Error Summary */}
                {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in-0 duration-200">
                    <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Please fix the errors above before proceeding
                    </p>
                  </div>
                )}

                {/* Missing Requirements Hint */}
                {!isFormReady && missingRequirements.length > 0 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-in fade-in-0 duration-200">
                    <p className="text-sm text-amber-400 font-medium flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      {resumeAutoFilled ? "Almost there! Complete these fields:" : "Complete these to enable analysis:"}
                    </p>
                    <ul className="text-sm text-amber-300/80 space-y-1 ml-6">
                      {missingRequirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Submit Button */}
                <div className="space-y-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!isFormReady || loading}
                    className={cn(
                      "w-full transition-all duration-200",
                      isFormReady
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.01]"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    )}
                    size="lg"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {isFormReady ? "Analyze My Profile" : resumeAutoFilled ? "Complete Missing Fields" : "Upload Resume to Start"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {isFormReady && (
                    <p className="text-xs text-center text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {resumeAutoFilled ? "Resume analyzed - Ready for AI analysis" : "All required fields completed - Ready to analyze"}
                    </p>
                  )}
                  {/* Start Fresh Button */}
                  {(resumeAutoFilled || uploadedFileName) && (
                    <Button
                      onClick={handleStartFresh}
                      variant="ghost"
                      className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear Form & Start Fresh
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Analysis */}
          <TabsContent value="analysis" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!profileAnalysis ? (
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                <CardContent className="pt-6">
                  <BlockingError
                    title="Analysis Not Available"
                    message="Please complete the About You section first to run AI analysis."
                    onAction={() => setActiveTab("about")}
                    actionLabel="Go to About You"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                  <CardHeader className="border-b border-zinc-800">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      Your Career Analysis
                    </CardTitle>
                    <CardDescription className="text-zinc-400">{profileAnalysis.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* ATS Score */}
                    {profileAnalysis.atsScoreBreakdown && (
                      <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2 text-white">
                            <Award className="h-5 w-5 text-violet-400" />
                            ATS Compatibility Score
                          </h4>
                          <Badge className={cn(
                            profileAnalysis.atsScoreBreakdown.overall >= 70
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : profileAnalysis.atsScoreBreakdown.overall >= 55
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          )}>
                            {profileAnalysis.atsScoreBreakdown.overall >= 70
                              ? "Strong"
                              : profileAnalysis.atsScoreBreakdown.overall >= 55
                              ? "Moderate"
                              : "Needs Improvement"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Skill Coverage", value: profileAnalysis.atsScoreBreakdown.keywordRelevance, color: "emerald" },
                            { label: "Impact Metrics", value: profileAnalysis.atsScoreBreakdown.impactMetrics, color: "violet" },
                            { label: "Role Alignment", value: profileAnalysis.atsScoreBreakdown.roleAlignment, color: "purple" },
                            { label: "Resume Quality", value: profileAnalysis.atsScoreBreakdown.formattingClarity, color: "amber" },
                          ].map((item) => (
                            <div key={item.label} className="text-center p-3 bg-zinc-800/50 rounded-xl">
                              <div className={`text-2xl font-bold text-${item.color}-400`}>
                                {item.value}%
                              </div>
                              <div className="text-xs text-zinc-500 mt-1">{item.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 bg-zinc-800/30 rounded-xl">
                        <h4 className="font-medium flex items-center gap-2 text-white">
                          <Briefcase className="h-4 w-4 text-violet-400" />
                          Suggested Roles
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profileAnalysis.suggestedRoles.map((role) => (
                            <Badge key={role} className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-zinc-800/30 rounded-xl">
                        <h4 className="font-medium flex items-center gap-2 text-white">
                          <Clock className="h-4 w-4 text-emerald-400" />
                          Experience Level
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 capitalize">
                            {profileAnalysis.experienceLevel}
                          </Badge>
                          <span className="text-sm text-zinc-400">
                            ~{profileAnalysis.yearsOfExperience} years
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 bg-zinc-800/30 rounded-xl">
                      <h4 className="font-medium text-white">Skills Extracted from Resume</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileAnalysis.coreSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="border-zinc-600 text-zinc-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <h4 className="font-medium flex items-center gap-2 text-orange-400">
                          <AlertCircle className="h-4 w-4" />
                          Areas to Improve
                        </h4>
                        <ul className="text-sm space-y-2 text-zinc-300">
                          {(profileAnalysis.weakAreas && profileAnalysis.weakAreas.length > 0) ? (
                            profileAnalysis.weakAreas.map((area, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>{area}</span>
                              </li>
                            ))
                          ) : (
                            // Fallback improvements - should never happen but prevents empty UI
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>Add quantifiable achievements with metrics (%, $, numbers)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>Use strong action verbs at the start of each bullet point</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>Include industry-specific keywords for better ATS ranking</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>Tailor your resume to each specific job description</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-3 p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
                        <h4 className="font-medium flex items-center gap-2 text-violet-400">
                          <TrendingUp className="h-4 w-4" />
                          Market Opportunities
                        </h4>
                        <ul className="text-sm space-y-2 text-zinc-300">
                          {(profileAnalysis.marketGaps && profileAnalysis.marketGaps.length > 0) ? (
                            profileAnalysis.marketGaps.map((gap, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">•</span>
                                <span>{gap}</span>
                              </li>
                            ))
                          ) : (
                            // Fallback market insights
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">•</span>
                                <span>Industry certifications boost credibility with employers</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">•</span>
                                <span>Building a portfolio demonstrates practical skills</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">•</span>
                                <span>Continuous learning signals adaptability to employers</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("about")}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Edit Info
                  </Button>
                  <Button
                    onClick={handleGenerateCV}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate My CV
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: CV */}
          <TabsContent value="cv" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!cvData ? (
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                <CardContent className="pt-6">
                  <BlockingError
                    title="CV Not Generated"
                    message="Please complete profile analysis first to generate your CV."
                    onAction={() => setActiveTab("analysis")}
                    actionLabel="Go to Analysis"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                  <CardHeader className="border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          Your Professional CV
                        </CardTitle>
                        <CardDescription className="text-zinc-400">Generated from your profile analysis</CardDescription>
                      </div>
                      <Button
                        onClick={handleDownloadCV}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download HTML
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="border border-zinc-700 rounded-xl p-6 bg-white text-gray-900 space-y-6">
                      {/* CV Content */}
                      <div className="border-b border-gray-200 pb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{cvData.fullName}</h2>
                        <p className="text-gray-600">{cvData.title}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span>{cvData.email}</span>
                          <span>{cvData.location}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 text-gray-900">Professional Summary</h3>
                        <p className="text-sm text-gray-700">{cvData.summary}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3 text-gray-900">Experience</h3>
                        {cvData.experience.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{exp.title}</p>
                                <p className="text-sm text-gray-600">{exp.company}</p>
                              </div>
                              <span className="text-sm text-gray-500">{exp.duration}</span>
                            </div>
                            <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                              {exp.bullets.map((bullet, j) => (
                                <li key={j}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2 text-gray-900">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {[...cvData.skills.technical, ...cvData.skills.soft].map((skill) => (
                            <Badge key={skill} variant="outline" className="border-gray-300 text-gray-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("analysis")}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveTab("resume-builder")}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Customize in Resume Builder
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 4: Resume Builder */}
          <TabsContent value="resume-builder" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!cvData ? (
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                <CardContent className="pt-6">
                  <BlockingError
                    title="Resume Builder Not Available"
                    message="Please generate your CV first to customize it in the Resume Builder."
                    onAction={() => setActiveTab("cv")}
                    actionLabel="Go to CV"
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <ResumeBuilderTabContent
                  cvData={cvData}
                  profileAnalysis={profileAnalysis}
                  userInfo={{ fullName, email, location }}
                />
                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("cv")}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to CV
                  </Button>
                  <Button
                    onClick={handleOptimizeLinkedIn}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    Optimize LinkedIn
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab 5: LinkedIn */}
          <TabsContent value="linkedin" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <div className="space-y-6">
              {/* LinkedIn Profile Component - Uses REAL data from resume */}
              <LinkedInProfile
                cvData={cvData}
                profileAnalysis={profileAnalysis}
                resumeText={resumeText}
                userInfo={{
                  fullName,
                  email,
                  phone,
                  location,
                  linkedinUrl,
                }}
                onImproveSection={handleImproveLinkedInSection}
                onProfileUpdate={setLinkedinProfileData}
              />

              {/* Navigation */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("resume-builder")}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleMatchJobs}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Find Matching Jobs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Jobs */}
          <TabsContent value="jobs" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!jobMatches ? (
              <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                <CardContent className="pt-6">
                  <BlockingError
                    title="Job Matches Not Available"
                    message="Please complete LinkedIn optimization first to find matching jobs."
                    onAction={() => setActiveTab("linkedin")}
                    actionLabel="Go to LinkedIn"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {!jobMatches.liveJobsUnavailable && (
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center gap-2">
                    <Info className="h-4 w-4 text-violet-400" />
                    <p className="text-sm text-violet-300">
                      Jobs are fetched in real time from external job boards.
                    </p>
                  </div>
                )}

                <Card className="bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl">
                  <CardHeader className="border-b border-zinc-800">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      Jobs Matched For You
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Searching {selectedRoles.length} role{selectedRoles.length > 1 ? 's' : ''}: {selectedRoles.slice(0, 3).join(", ")}{selectedRoles.length > 3 ? ` +${selectedRoles.length - 3} more` : ''} in {location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {jobMatches.matches.length === 0 && jobMatches.liveJobsUnavailable && (
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-violet-500/20 rounded-full">
                              <Briefcase className="h-5 w-5 text-violet-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">Top Recommended Job Boards</h3>
                              <p className="text-sm text-zinc-400">
                                AI-optimized search for {jobMatches.jobBoardRecommendations?.roles?.length || selectedRoles.length} role{(jobMatches.jobBoardRecommendations?.roles?.length || selectedRoles.length) > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Show searched roles */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {(jobMatches.jobBoardRecommendations?.roles || selectedRoles).map((role: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Role-specific job board links */}
                        {jobMatches.jobBoardRecommendations?.roleSpecificBoards ? (
                          <div className="space-y-6">
                            {jobMatches.jobBoardRecommendations.roleSpecificBoards.map((roleBoards: {
                              role: string;
                              boards: { id: string; name: string; description: string; url: string; whyRecommended: string }[];
                              searchQuery: string;
                            }, roleIdx: number) => (
                              <div key={roleIdx} className="space-y-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <Target className="h-4 w-4 text-violet-400" />
                                  {roleBoards.role}
                                </h4>
                                <div className="grid gap-2 pl-6">
                                  {roleBoards.boards.slice(0, 3).map((board) => (
                                    <div key={board.id} className="flex justify-between items-center border border-zinc-700 rounded-lg p-3 hover:border-violet-500/50 transition-all bg-zinc-800/30">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-white">{board.name}</span>
                                        {board.id === "linkedin" && <Linkedin className="h-3 w-3 text-blue-400" />}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                        asChild
                                      >
                                        <a href={board.url} target="_blank" rel="noopener noreferrer">
                                          Search
                                          <ExternalLink className="h-3 w-3 ml-1" />
                                        </a>
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {jobMatches.jobBoardRecommendations?.boards?.map((board: {
                              id: string;
                              name: string;
                              description: string;
                              url: string;
                              whyRecommended: string;
                            }) => (
                              <div key={board.id} className="border border-zinc-700 rounded-xl p-4 hover:border-violet-500/50 transition-all bg-zinc-800/30">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white flex items-center gap-2">
                                      {board.name}
                                      {board.id === "linkedin" && <Linkedin className="h-4 w-4 text-blue-400" />}
                                    </h4>
                                    <p className="text-sm text-zinc-400 mt-1">{board.description}</p>
                                    <p className="text-xs text-violet-400 mt-2 flex items-center gap-1">
                                      <Info className="h-3 w-3" />
                                      {board.whyRecommended}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="ml-4 bg-gradient-to-r from-violet-600 to-purple-600"
                                    asChild
                                  >
                                    <a href={board.url} target="_blank" rel="noopener noreferrer">
                                      Apply
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {jobMatches.matches.length > 0 && (
                      <div className="space-y-4">
                        {/* Show searched roles summary */}
                        {jobMatches.overallInsights?.searchedRoles && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-sm text-zinc-500">Jobs for:</span>
                            {jobMatches.overallInsights.searchedRoles.map((role: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="border-violet-500/30 text-violet-400 bg-violet-500/10">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {jobMatches.matches.map((job: {
                          title: string;
                          company: string;
                          location: string;
                          fitScore?: number;
                          matchScore?: number;
                          whyFit?: string;
                          fitReasons?: string[];
                          applyLink?: string;
                          job?: { applyUrl?: string; matchedRole?: string };
                        }, i: number) => (
                          <div key={i} className="border border-zinc-700 rounded-xl p-4 hover:border-violet-500/50 transition-all bg-zinc-800/30">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-white">{job.title || job.job?.title}</h4>
                                  {/* Show which role this job matched */}
                                  {job.job?.matchedRole && (
                                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                      {job.job.matchedRole}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                                  <Building2 className="h-4 w-4" />
                                  {job.company || job.job?.company}
                                </p>
                                <p className="text-sm text-zinc-500 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {job.location || job.job?.location}
                                </p>
                              </div>
                              <Badge className={cn(
                                "ml-2",
                                (job.fitScore || job.matchScore || 0) >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                (job.fitScore || job.matchScore || 0) >= 60 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                              )}>
                                {job.fitScore || job.matchScore || 70}% fit
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-400 mt-3">
                              {job.whyFit || job.fitReasons?.join(". ") || "Good match based on your skills and experience"}
                            </p>
                            <div className="flex justify-end mt-3">
                              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600" asChild>
                                <a href={job.applyLink || job.job?.applyUrl || "#"} target="_blank" rel="noopener noreferrer">
                                  Apply Now
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("linkedin")}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete - Return Home
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Main export with ResumeProvider wrapper
export default function Assistant() {
  return (
    <ResumeProvider>
      <AssistantContent />
    </ResumeProvider>
  );
}
