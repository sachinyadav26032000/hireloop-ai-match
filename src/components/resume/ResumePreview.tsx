/**
 * Resume Preview Component - Dark Theme
 *
 * Right panel - Live preview that renders the selected template
 * Updates instantly when user edits content
 */
import { forwardRef } from "react";
import { useResume } from "@/contexts/ResumeContext";
import { getTemplateComponent } from "./templates";
import { cn } from "@/lib/utils";

interface ResumePreviewProps {
  className?: string;
  scale?: number;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ className, scale = 0.5 }, ref) => {
    const { state } = useResume();
    const { data, templateId } = state;

    const TemplateComponent = getTemplateComponent(templateId);

    // For PDF export (scale=1), render without wrapper styling
    if (scale === 1) {
      return (
        <div ref={ref} className="bg-white" style={{ width: "210mm", minHeight: "297mm" }}>
          <TemplateComponent data={data} scale={1} />
        </div>
      );
    }

    return (
      <div className={cn("rounded-xl overflow-visible", className)}>
        {/* Resume Paper - A4 aspect ratio scaled for preview */}
        <div
          ref={ref}
          className="shadow-2xl shadow-black/50 mx-auto bg-white rounded-sm overflow-hidden"
          style={{
            width: `calc(210mm * ${scale})`,
            minHeight: `calc(297mm * ${scale})`,
          }}
        >
          <TemplateComponent data={data} scale={scale} />
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = "ResumePreview";

export default ResumePreview;
