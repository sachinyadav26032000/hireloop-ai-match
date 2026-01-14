import { useState, useEffect, useCallback, useMemo } from "react";
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
  MAX_ROLES,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "about" | "analysis" | "cv" | "linkedin" | "jobs";

const TABS: { id: TabId; label: string; icon: React.ElementType; step: number }[] = [
  { id: "about", label: "About You", icon: User, step: 1 },
  { id: "analysis", label: "Analysis", icon: Target, step: 2 },
  { id: "cv", label: "Your CV", icon: FileText, step: 3 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, step: 4 },
  { id: "jobs", label: "Jobs", icon: Briefcase, step: 5 },
];

// Field Error Component with animation
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-600 flex items-center gap-1 mt-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{error}</span>
    </p>
  );
}

// Field Warning Component
function FieldWarning({ warning }: { warning?: string }) {
  if (!warning) return null;
  return (
    <p className="text-sm text-amber-600 flex items-center gap-1 mt-1.5 animate-in fade-in-0 duration-200">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{warning}</span>
    </p>
  );
}

// AI Thinking State Component
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
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
          <Brain className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-sm">🤖</span>
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">{message}{dots}</p>
        <p className="text-sm text-gray-500">This typically takes 3-4 seconds</p>
      </div>
      <div className="flex space-x-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// Blocking Error Component
function BlockingError({ title, message, onAction, actionLabel }: {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in-0 duration-300">
      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-orange-600" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{message}</p>
      </div>
      {onAction && actionLabel && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Progress Indicator Component
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
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : isPast
                  ? "bg-blue-200 text-blue-700"
                  : "bg-gray-200 text-gray-500"
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
                  "w-8 h-1 mx-1 rounded transition-all duration-300",
                  isCompleted || isPast ? "bg-blue-400" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Section Header Component
function SectionHeader({ icon: Icon, title, description, required = false }: {
  icon: React.ElementType;
  title: string;
  description?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {title}
          {required && <span className="text-red-500 text-sm">*</span>}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function Assistant() {
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
  const [experienceYears, setExperienceYears] = useState("");
  const [experienceMonths, setExperienceMonths] = useState("0");

  // Field errors and warnings
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Results state
  const [profileAnalysis, setProfileAnalysis] = useState<ProfileAnalysis | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [linkedinOptimization, setLinkedinOptimization] = useState<LinkedInOptimization | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatchResult | null>(null);

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

  // Compute if form is ready for analysis (all required fields filled and valid)
  const isFormReady = useMemo(() => {
    // Required fields check
    const hasFullName = fullName.trim().length > 0 && fullName.trim().split(/\s+/).length >= 2;
    const hasEmail = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const hasRoles = selectedRoles.length > 0;
    const hasLocation = location.trim().length > 0;
    const hasExperience = experienceYears !== '';
    const hasResume = resumeText.trim().split(/\s+/).length >= 50;
    const hasSkills = selectedSkills.length > 0;

    return hasFullName && hasEmail && hasRoles && hasLocation && hasExperience && hasResume && hasSkills;
  }, [fullName, email, selectedRoles, location, experienceYears, resumeText, selectedSkills]);

  // Get list of missing requirements for tooltip
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

  // Real-time field validation (only show errors after field is touched)
  // LinkedIn is OPTIONAL - its validation failures go to warnings, not errors
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

    // LinkedIn is OPTIONAL - put validation failures in warnings, not errors
    // This ensures invalid LinkedIn URLs don't block form submission
    if (field === 'linkedinUrl') {
      // Clear any existing error for LinkedIn (it should never block)
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['linkedinUrl'];
        return newErrors;
      });
      // Handle LinkedIn as warning
      if (result.valid) {
        if (result.warning) {
          setWarnings(prev => ({ ...prev, linkedinUrl: result.warning! }));
        } else {
          setWarnings(prev => {
            const newWarnings = { ...prev };
            delete newWarnings['linkedinUrl'];
            return newWarnings;
          });
        }
      } else if (touched[field]) {
        // Invalid LinkedIn goes to warnings, not errors
        setWarnings(prev => ({ ...prev, linkedinUrl: result.error! }));
      }
      return;
    }

    // For all other fields (required fields), use errors
    setErrors(prev => {
      const newErrors = { ...prev };
      if (result.valid) {
        delete newErrors[field];
      } else if (touched[field]) {
        newErrors[field] = result.error!;
      }
      return newErrors;
    });

    // Handle warnings
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

  // Mark field as touched on blur
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Validate all fields before submission
  const validateAllFields = (): boolean => {
    const result = fullFormValidation;

    // Mark all fields as touched
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
    // Double-check validation (button should be disabled, but this is a safety check)
    if (!validateAllFields()) {
      // Scroll to first error
      const firstError = document.querySelector('[class*="border-red"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setAiThinkingMessage("AI analyzing your profile");

    // Realistic thinking time
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
        totalExperience,
        selectedSkills,
      });

      setProfileAnalysis(result.data);
      setCompletedSteps(prev => new Set([...prev, "about"]));
      setActiveTab("analysis");
      toast.success("Profile analyzed successfully!");
    } catch (error: unknown) {
      // Handle validation errors with field-specific feedback
      if (error instanceof ApiValidationError && error.details) {
        // Map backend field names to frontend field names and set errors
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

        toast.error("Please fix the highlighted fields");
      } else {
        const errorMessage = error instanceof Error ? error.message : "Analysis failed";
        toast.error(errorMessage || "Analysis failed. Is the backend running?");
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
        { fullName, email, location },
        resumeText
      );

      setCvData(result.data);
      setCompletedSteps(prev => new Set([...prev, "analysis"]));
      setActiveTab("cv");
      toast.success("CV generated!");
    } catch (error: any) {
      toast.error(error.message || "CV generation failed");
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
    } catch (error: any) {
      toast.error("Download failed");
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
        { fullName, email, location },
        { about: linkedinUrl, url: linkedinUrl }
      );

      setLinkedinOptimization(result.data);
      setCompletedSteps(prev => new Set([...prev, "cv"]));
      setActiveTab("linkedin");
      toast.success("LinkedIn optimized!");
    } catch (error: any) {
      toast.error(error.message || "LinkedIn optimization failed");
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
        desiredRole: selectedRoles[0] || "",
        location,
        experienceYears: parseInt(experienceYears) || 0,
      });

      setJobMatches(result.data);
      setCompletedSteps(prev => new Set([...prev, "linkedin"]));
      setActiveTab("jobs");
      toast.success("Jobs matched!");
    } catch (error: any) {
      toast.error(error.message || "Job matching failed");
    } finally {
      setLoading(false);
      setAiThinkingMessage("");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // Check if tab is accessible
  const isTabAccessible = (tabId: TabId): boolean => {
    if (tabId === "about") return true;
    if (tabId === "analysis") return completedSteps.has("about") || profileAnalysis !== null;
    if (tabId === "cv") return completedSteps.has("analysis") || cvData !== null;
    if (tabId === "linkedin") return completedSteps.has("cv") || linkedinOptimization !== null;
    if (tabId === "jobs") return completedSteps.has("linkedin") || jobMatches !== null;
    return false;
  };

  // Handle tab change with validation
  const handleTabChange = (tabId: string) => {
    if (isTabAccessible(tabId as TabId)) {
      setActiveTab(tabId as TabId);
    } else {
      toast.error("Please complete the previous steps first");
    }
  };

  // Show AI thinking state when loading
  if (loading && aiThinkingMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <AIThinkingState message={aiThinkingMessage} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      {/* Main Content with Tabs */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <ProgressIndicator currentStep={currentStep} completedSteps={completedSteps} />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={!isTabAccessible(tab.id)}
                className="flex items-center gap-2 transition-all duration-200"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {completedSteps.has(tab.id) && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab 1: About You */}
          <TabsContent value="about" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-blue-600" />
                  Tell us about yourself
                </CardTitle>
                <CardDescription>
                  Fill in your details to get personalized career guidance. Fields marked with <span className="text-red-500">*</span> are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={User}
                    title="Personal Information"
                    description="Basic details for your profile"
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="First Last (e.g., Rahul Sharma)"
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
                          "transition-all duration-200",
                          errors.fullName && touched.fullName ? 'border-red-500 focus:ring-red-200' : ''
                        )}
                      />
                      <FieldError error={touched.fullName ? errors.fullName : undefined} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@gmail.com"
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
                          "transition-all duration-200",
                          errors.email && touched.email ? 'border-red-500 focus:ring-red-200' : ''
                        )}
                      />
                      <FieldError error={touched.email ? errors.email : undefined} />
                    </div>
                  </div>
                </div>

                {/* Career Preferences Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Briefcase}
                    title="Career Preferences"
                    description="Your target roles and experience"
                    required
                  />
                  <div className="space-y-4 pl-11">
                    {/* Desired Roles */}
                    <div className="space-y-2">
                      <Label>Desired Roles * (Select 1-{MAX_ROLES})</Label>
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
                          errors.selectedRoles && touched.selectedRoles ? '[&_button]:border-red-500' : ''
                        )}
                      />
                      <FieldError error={touched.selectedRoles ? errors.selectedRoles : undefined} />
                    </div>

                    {/* Location and Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Preferred Location *</Label>
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
                              "transition-all duration-200",
                              errors.location && touched.location ? 'border-red-500' : ''
                            )}
                          >
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {Object.entries(LOCATIONS).map(([region, locations]) => (
                              <SelectGroup key={region}>
                                <SelectLabel className="text-blue-600 font-semibold">{region}</SelectLabel>
                                {locations.map((loc) => (
                                  <SelectItem key={loc} value={loc}>
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
                        <Label>Total Experience *</Label>
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
                                "transition-all duration-200",
                                errors.experienceYears && touched.experienceYears ? 'border-red-500' : ''
                              )}
                            >
                              <SelectValue placeholder="Years" />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPERIENCE_YEARS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={experienceMonths} onValueChange={setExperienceMonths}>
                            <SelectTrigger>
                              <SelectValue placeholder="Months" />
                            </SelectTrigger>
                            <SelectContent>
                              {EXPERIENCE_MONTHS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FieldError error={touched.experienceYears ? errors.experienceYears : undefined} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Wrench}
                    title="Your Skillset"
                    description="Select your key skills - helps with job matching and resume optimization"
                    required
                  />
                  <div className="pl-11">
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
                        errors.selectedSkills && touched.selectedSkills ? '[&_button]:border-red-500' : ''
                      )}
                    />
                    <FieldError error={touched.selectedSkills ? errors.selectedSkills : undefined} />
                    <p className="text-xs text-gray-500 mt-2">
                      AI will cross-check your resume skills with your selections to flag inconsistencies.
                    </p>
                  </div>
                </div>

                {/* Resume Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={FileText}
                    title="Resume Content"
                    description="Paste your resume for AI analysis and CV generation"
                    required
                  />
                  <div className="pl-11">
                    <Textarea
                      id="resume"
                      placeholder="Paste your complete resume content here. Include your work experience, education, skills, projects, and achievements..."
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
                        "min-h-[180px] transition-all duration-200",
                        errors.resumeText && touched.resumeText ? 'border-red-500 focus:ring-red-200' : ''
                      )}
                    />
                    <FieldError error={touched.resumeText ? errors.resumeText : undefined} />
                    <FieldWarning warning={warnings.resumeText} />
                    <p className="text-xs text-gray-500 mt-2">
                      AI extracts skills and generates your CV from this content. Without a resume, analysis cannot proceed.
                    </p>
                  </div>
                </div>

                {/* Optional Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Linkedin}
                    title="Additional Information"
                    description="Optional but recommended for better optimization"
                  />
                  <div className="space-y-4 pl-11">
                    {/* About You */}
                    <div className="space-y-2">
                      <Label htmlFor="self">About You (Optional)</Label>
                      <Textarea
                        id="self"
                        placeholder="Describe your professional background, key achievements, and career goals in a few sentences..."
                        value={selfDescription}
                        onChange={(e) => {
                          setSelfDescription(e.target.value);
                          if (touched.selfDescription) validateField('selfDescription', e.target.value);
                        }}
                        onBlur={() => {
                          handleBlur('selfDescription');
                          if (selfDescription) validateField('selfDescription', selfDescription);
                        }}
                        className={cn(
                          "min-h-[100px] transition-all duration-200",
                          errors.selfDescription && touched.selfDescription ? 'border-red-500 focus:ring-red-200' : ''
                        )}
                      />
                      <FieldError error={touched.selfDescription ? errors.selfDescription : undefined} />
                    </div>

                    {/* LinkedIn - OPTIONAL field, validation issues shown as warnings */}
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn Profile URL (Optional)</Label>
                      <Input
                        id="linkedin"
                        placeholder="https://www.linkedin.com/in/yourprofile"
                        value={linkedinUrl}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          // Always validate if field has been touched to update warnings
                          if (touched.linkedinUrl) {
                            validateField('linkedinUrl', e.target.value);
                          }
                        }}
                        onBlur={() => {
                          handleBlur('linkedinUrl');
                          // Always validate on blur to properly set or clear warnings
                          validateField('linkedinUrl', linkedinUrl);
                        }}
                        className="transition-all duration-200"
                      />
                      {/* LinkedIn uses FieldWarning instead of FieldError - invalid URLs don't block submission */}
                      <FieldWarning warning={touched.linkedinUrl ? warnings.linkedinUrl : undefined} />
                    </div>
                  </div>
                </div>

                {/* Error Summary */}
                {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in-0 duration-200">
                    <p className="text-sm text-red-800 flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Please fix the errors above before proceeding
                    </p>
                  </div>
                )}

                {/* Missing Requirements Hint */}
                {!isFormReady && missingRequirements.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in-0 duration-200">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      Complete these to enable analysis:
                    </p>
                    <ul className="text-sm text-amber-700 space-y-1 ml-6">
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
                <div className="space-y-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!isFormReady || loading}
                    className={cn(
                      "w-full transition-all duration-200",
                      isFormReady ? "hover:scale-[1.01]" : "opacity-60 cursor-not-allowed"
                    )}
                    size="lg"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {isFormReady ? "Analyze My Profile" : "Complete Required Fields"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  {isFormReady && (
                    <p className="text-xs text-center text-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      All required fields completed - Ready to analyze
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Analysis */}
          <TabsContent value="analysis" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!profileAnalysis ? (
              <Card className="shadow-lg">
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
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Your Career Analysis
                    </CardTitle>
                    <CardDescription>{profileAnalysis.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Analysis Confidence Indicator */}
                    {profileAnalysis.atsScoreBreakdown && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            Profile Analysis Confidence
                          </h4>
                          {profileAnalysis.atsScoreBreakdown.overall >= 60 ? (
                            <Badge className="bg-green-100 text-green-800">
                              Sufficient Data
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              Limited Data
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-xl font-semibold text-green-600">
                              {profileAnalysis.atsScoreBreakdown.keywordRelevance}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Skill Coverage</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-xl font-semibold text-blue-600">
                              {profileAnalysis.atsScoreBreakdown.impactMetrics}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Impact Metrics</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-xl font-semibold text-purple-600">
                              {profileAnalysis.atsScoreBreakdown.roleAlignment}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Role Alignment</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-xl font-semibold text-orange-600">
                              {profileAnalysis.atsScoreBreakdown.formattingClarity}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Resume Quality</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Scores are computed from your resume content. Improve your resume to increase scores.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Suggested Roles
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {profileAnalysis.suggestedRoles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Experience Level
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge className="capitalize">{profileAnalysis.experienceLevel}</Badge>
                          <span className="text-sm text-gray-500">
                            ~{profileAnalysis.yearsOfExperience} years
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Skills Extracted from Resume</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileAnalysis.coreSkills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      {profileAnalysis.coreSkills.length === 0 && (
                        <p className="text-sm text-orange-600 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          No specific skills could be extracted. Please update your resume with clear skill mentions.
                        </p>
                      )}
                    </div>

                    {/* Areas to Improve - Grounded feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <h4 className="font-medium flex items-center gap-2 text-orange-700">
                          <AlertCircle className="h-4 w-4" />
                          Areas to Improve
                        </h4>
                        <ul className="text-sm space-y-2 text-gray-700">
                          {profileAnalysis.weakAreas.map((area, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-medium flex items-center gap-2 text-blue-700">
                          <TrendingUp className="h-4 w-4" />
                          Market Opportunities
                        </h4>
                        <ul className="text-sm space-y-2 text-gray-700">
                          {profileAnalysis.marketGaps.map((gap, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setActiveTab("about")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Edit Info
                  </Button>
                  <Button onClick={handleGenerateCV} disabled={loading} className="flex-1">
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
              <Card className="shadow-lg">
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
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Your Professional CV
                        </CardTitle>
                        <CardDescription>Generated from your profile analysis</CardDescription>
                      </div>
                      <Button onClick={handleDownloadCV}>
                        <Download className="h-4 w-4 mr-2" />
                        Download HTML
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-6 bg-white space-y-6">
                      {/* CV Content */}
                      <div className="border-b pb-4">
                        <h2 className="text-2xl font-bold">{cvData.fullName}</h2>
                        <p className="text-gray-600">{cvData.title}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span>{cvData.email}</span>
                          <span>{cvData.location}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Professional Summary</h3>
                        <p className="text-sm text-gray-700">{cvData.summary}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Experience</h3>
                        {cvData.experience.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{exp.title}</p>
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
                        <h3 className="font-semibold mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {[...cvData.skills.technical, ...cvData.skills.soft].map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setActiveTab("analysis")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleOptimizeLinkedIn} disabled={loading} className="flex-1">
                    <Linkedin className="h-4 w-4 mr-2" />
                    Optimize LinkedIn
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 4: LinkedIn */}
          <TabsContent value="linkedin" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!linkedinOptimization ? (
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <BlockingError
                    title="LinkedIn Analysis Not Available"
                    message="Please generate your CV first, then we can optimize your LinkedIn profile."
                    onAction={() => setActiveTab("cv")}
                    actionLabel="Go to CV"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Linkedin className="h-5 w-5 text-blue-600" />
                          LinkedIn Optimization
                        </CardTitle>
                        <CardDescription>
                          Suggestions based on your profile analysis
                          <span className="ml-2 text-orange-600 text-xs">
                            (Mock mode - LinkedIn scraping not available)
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="headline" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="headline">Headline</TabsTrigger>
                        <TabsTrigger value="about">About</TabsTrigger>
                        <TabsTrigger value="skills">Skills</TabsTrigger>
                        <TabsTrigger value="tips">Tips</TabsTrigger>
                      </TabsList>

                      <TabsContent value="headline" className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-green-600 font-medium">Suggested Headline</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(linkedinOptimization.headline.after, "Headline")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {linkedinOptimization.headline.after}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Tips:</strong> {linkedinOptimization.headline.tips.join(" • ")}
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="about" className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm text-green-600 font-medium">Suggested About Section</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(linkedinOptimization.about.after, "About section")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-gray-900 text-sm whitespace-pre-line">
                            {linkedinOptimization.about.after}
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="skills" className="space-y-4">
                        {linkedinOptimization.skillsToAdd && linkedinOptimization.skillsToAdd.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              Skills to Add
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {linkedinOptimization.skillsToAdd.map((skill) => (
                                <Badge key={skill} className="bg-green-100 text-green-800">
                                  + {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {linkedinOptimization.certifications && linkedinOptimization.certifications.length > 0 && (
                          <div className="space-y-3 mt-4">
                            <h4 className="font-medium flex items-center gap-2 text-blue-700">
                              <BookOpen className="h-4 w-4" />
                              Recommended Certifications
                            </h4>
                            <div className="space-y-2">
                              {linkedinOptimization.certifications.map((cert, i) => (
                                <div key={i} className="p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-blue-800">{cert}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="tips" className="space-y-4">
                        <div className="space-y-3">
                          {linkedinOptimization.topRecommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setActiveTab("cv")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleMatchJobs} disabled={loading} className="flex-1">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Find Matching Jobs
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 5: Jobs */}
          <TabsContent value="jobs" className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {!jobMatches ? (
              <Card className="shadow-lg">
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
                {/* Mock Data Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    <strong>Sample jobs</strong> - Real job API integration pending. Links redirect to external job boards.
                  </p>
                </div>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Jobs Matched For You
                    </CardTitle>
                    <CardDescription>
                      Based on {selectedRoles[0] || "your profile"} in {location} with {experienceYears}+ years experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {jobMatches.matches.map((match) => (
                      <div key={match.jobId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{match.job.title}</h3>
                            <p className="text-gray-600 flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {match.job.company}
                            </p>
                          </div>
                          <Badge
                            variant={match.matchScore >= 75 ? "default" : "secondary"}
                            className="text-lg px-3"
                          >
                            {match.matchScore}% Match
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {match.job.location}
                          </span>
                          {match.job.source && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <ExternalLink className="h-3 w-3" />
                              {match.job.source}
                            </span>
                          )}
                          {match.job.postedDate && (
                            <span className="text-gray-400">
                              Posted {match.job.postedDate}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-3">{match.job.description}</p>

                        <div className="bg-green-50 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-green-800 mb-1">Why this is a good fit:</p>
                          <ul className="text-sm text-green-700">
                            {match.fitReasons.map((reason, i) => (
                              <li key={i}>• {reason}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">{match.recommendation}</Badge>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(match.job.title)}&location=${encodeURIComponent(match.job.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                LinkedIn
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={`https://www.naukri.com/${match.job.title.toLowerCase().replace(/\s+/g, '-')}-jobs`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Naukri
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              asChild
                            >
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(match.job.title + ' ' + match.job.company + ' jobs')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Search Jobs
                                <ExternalLink className="h-4 w-4 ml-1" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setActiveTab("linkedin")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab("about")} variant="outline" className="flex-1">
                    Start Over
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

// Header Component
function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Job Assistant</h1>
              <p className="text-sm text-gray-500">Get job-ready with AI-powered analysis</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
      </div>
    </header>
  );
}
