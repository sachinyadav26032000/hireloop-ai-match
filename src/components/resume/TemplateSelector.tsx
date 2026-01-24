/**
 * Template Selector Component - Dark Theme
 *
 * Shows preview cards for each template
 * Allows switching templates without regenerating content
 */
import { useResume, TemplateId, createEmptyResume } from "@/contexts/ResumeContext";
import { TEMPLATES, TEMPLATE_COMPONENTS } from "./templates";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  className?: string;
  compact?: boolean;
}

export function TemplateSelector({ className, compact = false }: TemplateSelectorProps) {
  const { state, setTemplate } = useResume();
  const currentTemplate = state.templateId;

  // Sample data for preview
  const sampleData = {
    ...createEmptyResume(),
    contact: {
      fullName: "Alex Johnson",
      email: "alex@email.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alexj",
    },
    headline: "Senior Software Engineer",
    summary: "Experienced engineer with 8+ years building scalable applications.",
    experience: [
      {
        id: "1",
        title: "Senior Engineer",
        company: "Tech Corp",
        startDate: "2020",
        endDate: "Present",
        bullets: ["Led team of 5 engineers", "Improved performance by 40%"],
      },
    ],
    skills: {
      technical: ["React", "Node.js", "Python", "AWS"],
      soft: ["Leadership", "Communication"],
    },
    education: [
      {
        id: "1",
        degree: "BS Computer Science",
        institution: "Stanford University",
        graduationDate: "2016",
      },
    ],
  } as any;

  const templateList = Object.values(TEMPLATES);

  // Compact mode for header bar
  if (compact) {
    return (
      <div className={cn("flex gap-2 flex-wrap", className)}>
        {templateList.map((template) => (
          <button
            key={template.id}
            onClick={() => setTemplate(template.id)}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-all font-medium",
              currentTemplate === template.id
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white"
            )}
          >
            {template.name}
          </button>
        ))}
      </div>
    );
  }

  // Full grid view
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {templateList.map((template) => {
        const TemplateComponent = TEMPLATE_COMPONENTS[template.id];
        const isSelected = currentTemplate === template.id;

        return (
          <button
            key={template.id}
            onClick={() => setTemplate(template.id)}
            className={cn(
              "relative group rounded-xl overflow-hidden border-2 transition-all duration-300",
              isSelected
                ? "border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/20"
                : "border-zinc-700 hover:border-zinc-500"
            )}
          >
            {/* Template Preview (scaled down) */}
            <div className="relative h-48 overflow-hidden bg-white">
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  transform: "scale(0.15)",
                  transformOrigin: "top left",
                  width: "210mm",
                }}
              >
                <TemplateComponent data={sampleData} />
              </div>

              {/* Hover overlay with gradient */}
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isSelected
                    ? "bg-gradient-to-t from-violet-900/30 to-transparent"
                    : "bg-gradient-to-t from-zinc-900/0 to-transparent group-hover:from-zinc-900/30"
                )}
              />

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Popular badge for Modern template */}
              {template.id === "modern" && !isSelected && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                  <span className="text-[10px] font-bold text-white">POPULAR</span>
                </div>
              )}
            </div>

            {/* Template info */}
            <div
              className={cn(
                "p-3 border-t transition-colors",
                isSelected
                  ? "bg-zinc-800 border-violet-500/30"
                  : "bg-zinc-900 border-zinc-800 group-hover:bg-zinc-800"
              )}
            >
              <h3
                className={cn(
                  "font-semibold text-sm transition-colors",
                  isSelected ? "text-violet-400" : "text-white"
                )}
              >
                {template.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      isSelected
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default TemplateSelector;
