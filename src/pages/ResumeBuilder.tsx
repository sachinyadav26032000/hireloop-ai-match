/**
 * Resume Builder Page - Production Grade
 *
 * Zety/Resume.io style resume editor with:
 * - Dark, attractive UI with high contrast
 * - Left panel: Editor with AI enhancements
 * - Right panel: Live preview
 * - Multiple templates
 * - AI suggestions modal
 * - PDF export
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ResumeProvider, useResume, TemplateId } from "@/contexts/ResumeContext";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { TemplateSelector } from "@/components/resume/TemplateSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Save,
  Sparkles,
  Check,
  X,
  Edit3,
  Loader2,
  FileText,
  Palette,
  Zap,
  Eye,
  ChevronDown,
  LayoutTemplate,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// AI Suggestion Modal - Dark Theme
interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  original: string;
  suggested: string;
  onAccept: (text: string) => void;
  onReject: () => void;
}

function SuggestionModal({
  isOpen,
  onClose,
  section,
  original,
  suggested,
  onAccept,
  onReject,
}: SuggestionModalProps) {
  const [editedText, setEditedText] = useState(suggested);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedText(suggested);
    setIsEditing(false);
  }, [suggested]);

  const sectionLabels: Record<string, string> = {
    summary: "Professional Summary",
    headline: "Professional Headline",
    experience_bullets: "Experience Bullets",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Suggestion: {sectionLabels[section] || section}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Review the AI-generated improvement. You can accept as-is, edit, or reject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Original */}
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">
              Original Text
            </label>
            <div className="p-4 bg-zinc-800/50 rounded-lg text-sm text-zinc-400 whitespace-pre-wrap border border-zinc-700/50">
              {original || "(empty)"}
            </div>
          </div>

          {/* Suggested */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                AI Suggestion
              </label>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                {isEditing ? "Preview" : "Edit"}
              </Button>
            </div>
            {isEditing ? (
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={6}
                className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-100 whitespace-pre-wrap">
                {editedText}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={onReject}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button
            onClick={() => onAccept(editedText)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            <Check className="h-4 w-4 mr-1" />
            Accept Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Template Dropdown for Header
function TemplateDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { state, setTemplate } = useResume();
  const templates: { id: TemplateId; name: string; icon: string }[] = [
    { id: "modern", name: "Modern", icon: "🎨" },
    { id: "professional", name: "Professional", icon: "💼" },
    { id: "minimal", name: "Minimal", icon: "✨" },
    { id: "executive", name: "Executive", icon: "👔" },
  ];

  const currentTemplate = templates.find((t) => t.id === state.templateId);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-zinc-300 hover:text-white hover:bg-white/10 gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <LayoutTemplate className="h-4 w-4" />
        <span className="hidden sm:inline">{currentTemplate?.name}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setTemplate(template.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center gap-3 transition-colors",
                  state.templateId === template.id
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <span className="text-lg">{template.icon}</span>
                <span className="font-medium">{template.name}</span>
                {state.templateId === template.id && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Main Resume Builder Content
function ResumeBuilderContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, updateSummary, updateHeadline, updateExperience, loadFromAnalysis } = useResume();
  const previewRef = useRef<HTMLDivElement>(null);

  const [showFullTemplates, setShowFullTemplates] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);

  // AI Suggestion state
  const [suggestion, setSuggestion] = useState<{
    isOpen: boolean;
    section: string;
    original: string;
    suggested: string;
    context?: any;
  }>({
    isOpen: false,
    section: "",
    original: "",
    suggested: "",
  });

  // Load data from Assistant flow if available
  useEffect(() => {
    const analysisData = location.state?.analysisData;
    const userInfo = location.state?.userInfo;
    if (analysisData) {
      loadFromAnalysis(analysisData, userInfo);
    }
  }, [location.state, loadFromAnalysis]);

  // Handle AI improvement request
  const handleAiImprove = useCallback(
    async (section: string, content: string, context?: any) => {
      try {
        const response = await fetch("http://localhost:5001/assistant/improve-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, content, context }),
        });

        const result = await response.json();

        if (result.success && result.data?.improved) {
          setSuggestion({
            isOpen: true,
            section,
            original: content,
            suggested: result.data.improved,
            context,
          });
        } else {
          toast.error("Could not generate improvement. Please try again.");
        }
      } catch (error) {
        console.error("AI improve error:", error);
        toast.error("Failed to connect to AI service.");
      }

      return content;
    },
    []
  );

  // Handle accepting AI suggestion
  const handleAcceptSuggestion = useCallback(
    (text: string) => {
      const { section, context } = suggestion;

      if (section === "summary") {
        updateSummary(text);
      } else if (section === "headline") {
        updateHeadline(text);
      } else if (section === "experience_bullets" && context?.experienceId) {
        const bullets = text
          .split("\n")
          .map((b) => b.replace(/^[•\-*]\s*/, "").trim())
          .filter((b) => b);
        updateExperience(context.experienceId, { bullets });
      }

      setSuggestion({ ...suggestion, isOpen: false });
      toast.success("Changes applied successfully!", {
        icon: <Check className="h-4 w-4 text-emerald-500" />,
      });
    },
    [suggestion, updateSummary, updateHeadline, updateExperience]
  );

  // Handle PDF export
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      if (previewRef.current) {
        const element = previewRef.current;
        const opt = {
          margin: 0,
          filename: `${state.data.contact.fullName || "Resume"}_CV.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        };

        await html2pdf().set(opt).from(element).save();
        toast.success("PDF exported successfully!", {
          icon: <Download className="h-4 w-4 text-emerald-500" />,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [state.data.contact.fullName]);

  // Handle save (placeholder for Supabase integration)
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Implement Supabase save with debounce
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Resume saved!", {
        icon: <Save className="h-4 w-4 text-emerald-500" />,
      });
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header - Dark with gradient accent */}
      <header className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="h-6 w-px bg-zinc-700" />

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm sm:text-base">Resume Builder</h1>
                <p className="text-xs text-zinc-500 hidden sm:block">Create your perfect resume</p>
              </div>
            </div>
          </div>

          {/* Center - Template Selector */}
          <div className="hidden md:flex items-center gap-2">
            <TemplateDropdown />
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-300 hover:text-white hover:bg-white/10"
              onClick={() => setShowFullTemplates(!showFullTemplates)}
            >
              <Palette className="h-4 w-4 mr-1" />
              Browse All
            </Button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-300 hover:text-white hover:bg-white/10"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">Save</span>
            </Button>

            {/* Export Button */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1">Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Full Template Selector Bar */}
        {showFullTemplates && (
          <div className="bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 py-4">
            <div className="max-w-[1920px] mx-auto px-4">
              <TemplateSelector compact={false} />
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Split View */}
      <div className="max-w-[1920px] mx-auto">
        <div className="flex min-h-[calc(100vh-64px)]">
          {/* Left Panel - Editor */}
          <div className="w-full lg:w-[45%] xl:w-[40%] border-r border-zinc-800 bg-zinc-900/50">
            <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
              <div className="p-4 lg:p-6">
                {/* Editor Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-violet-400" />
                      Edit Your Resume
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Fill in your details and let AI enhance your content
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <Wand2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">AI-Powered</span>
                  </div>
                </div>

                <ResumeEditor onAiImprove={handleAiImprove} />
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="hidden lg:block flex-1 bg-zinc-950">
            <div className="sticky top-16 h-[calc(100vh-64px)] overflow-hidden">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-300">Live Preview</span>
                  <span className="text-xs text-zinc-600 px-2 py-0.5 rounded bg-zinc-800">
                    {state.templateId.charAt(0).toUpperCase() + state.templateId.slice(1)} Template
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Zoom</span>
                  <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
                    {[0.4, 0.5, 0.6, 0.75].map((scale) => (
                      <button
                        key={scale}
                        onClick={() => setPreviewScale(scale)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md transition-colors",
                          previewScale === scale
                            ? "bg-zinc-700 text-white"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        {Math.round(scale * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Container */}
              <div className="h-[calc(100%-57px)] overflow-auto p-6">
                <ResumePreview ref={previewRef} scale={previewScale} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Preview Toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white h-14 w-14 p-0"
          onClick={() => {
            // TODO: Implement mobile preview modal
            toast.info("Preview available on larger screens");
          }}
        >
          <Eye className="h-6 w-6" />
        </Button>
      </div>

      {/* AI Suggestion Modal */}
      <SuggestionModal
        isOpen={suggestion.isOpen}
        onClose={() => setSuggestion({ ...suggestion, isOpen: false })}
        section={suggestion.section}
        original={suggestion.original}
        suggested={suggestion.suggested}
        onAccept={handleAcceptSuggestion}
        onReject={() => setSuggestion({ ...suggestion, isOpen: false })}
      />
    </div>
  );
}

// Wrap with Provider
export default function ResumeBuilder() {
  return (
    <ResumeProvider>
      <ResumeBuilderContent />
    </ResumeProvider>
  );
}
