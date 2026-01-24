/**
 * Resume Editor Component - Dark Theme
 *
 * Left panel of the resume builder
 * Contains all editable sections with AI suggestion buttons
 * Features:
 * - Dark, attractive UI
 * - Multiple AI improvement options
 * - Smooth animations
 * - Professional styling
 */
import { useState, useCallback } from "react";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  FolderOpen,
  Plus,
  Trash2,
  Sparkles,
  X,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  Target,
  TrendingUp,
  FileSearch,
  Loader2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeEditorProps {
  onAiImprove?: (section: string, content: string, context?: any) => Promise<string>;
  className?: string;
}

// AI Action Button Component
interface AiActionButtonProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  variant?: "default" | "outline";
}

function AiActionButton({
  label,
  description,
  icon,
  onClick,
  isLoading,
  variant = "default",
}: AiActionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 text-xs gap-1 transition-all",
              variant === "default"
                ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
            )}
            onClick={onClick}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-zinc-800 text-zinc-200 border-zinc-700"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ResumeEditor({ onAiImprove, className }: ResumeEditorProps) {
  const {
    state,
    updateContact,
    updateHeadline,
    updateSummary,
    addExperience,
    updateExperience,
    removeExperience,
    addExperienceBullet,
    updateExperienceBullet,
    removeExperienceBullet,
    addEducation,
    updateEducation,
    removeEducation,
    addSkill,
    removeSkill,
    addCertification,
    updateCertification,
    removeCertification,
    addProject,
    updateProject,
    removeProject,
  } = useResume();

  const { data } = state;
  const [newSkill, setNewSkill] = useState({ technical: "", soft: "" });
  const [loadingSection, setLoadingSection] = useState<string | null>(null);

  // Handle AI improvement for a section
  const handleAiImprove = useCallback(
    async (section: string, content: string, context?: any) => {
      if (!onAiImprove || !content.trim()) return;
      const loadingKey = context?.experienceId
        ? `${section}_${context.experienceId}`
        : section;
      setLoadingSection(loadingKey);
      try {
        const improvedContent = await onAiImprove(section, content, context);

        // Update the context based on section type
        if (improvedContent && improvedContent !== content) {
          switch (section) {
            case "headline":
              updateHeadline(improvedContent);
              break;
            case "summary":
              updateSummary(improvedContent);
              break;
            case "experience_bullets":
              if (context?.experienceId) {
                // Parse improved bullets and update each one
                const improvedBullets = improvedContent
                  .split("\n")
                  .map((b: string) => b.replace(/^[•\-]\s*/, "").trim())
                  .filter((b: string) => b.length > 0);

                // Find the experience and update bullets
                const exp = data.experience.find((e) => e.id === context.experienceId);
                if (exp) {
                  improvedBullets.forEach((bullet: string, index: number) => {
                    if (index < exp.bullets.length) {
                      updateExperienceBullet(exp.id, index, bullet);
                    }
                  });
                }
              }
              break;
          }
        }
      } finally {
        setLoadingSection(null);
      }
    },
    [onAiImprove, updateHeadline, updateSummary, updateExperienceBullet, data.experience]
  );

  // Input class for dark theme
  const inputClass =
    "bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20";
  const labelClass = "text-xs text-zinc-400 font-medium";

  return (
    <div className={cn("space-y-3", className)}>
      <Accordion
        type="multiple"
        defaultValue={["contact", "summary", "experience"]}
        className="space-y-3"
      >
        {/* Contact Information */}
        <AccordionItem
          value="contact"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Contact Information</span>
                <p className="text-xs text-zinc-500 font-normal">Your personal details</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className={labelClass}>Full Name</Label>
                <Input
                  value={data.contact.fullName}
                  onChange={(e) => updateContact({ fullName: e.target.value })}
                  placeholder="John Smith"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <Label className={labelClass}>
                  <Mail className="h-3 w-3 inline mr-1" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={data.contact.email}
                  onChange={(e) => updateContact({ email: e.target.value })}
                  placeholder="john@example.com"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <Label className={labelClass}>
                  <Phone className="h-3 w-3 inline mr-1" />
                  Phone
                </Label>
                <Input
                  value={data.contact.phone}
                  onChange={(e) => updateContact({ phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <Label className={labelClass}>
                  <MapPin className="h-3 w-3 inline mr-1" />
                  Location
                </Label>
                <Input
                  value={data.contact.location}
                  onChange={(e) => updateContact({ location: e.target.value })}
                  placeholder="San Francisco, CA"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <Label className={labelClass}>
                  <Linkedin className="h-3 w-3 inline mr-1" />
                  LinkedIn
                </Label>
                <Input
                  value={data.contact.linkedin || ""}
                  onChange={(e) => updateContact({ linkedin: e.target.value })}
                  placeholder="linkedin.com/in/johnsmith"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <Label className={labelClass}>
                  <Github className="h-3 w-3 inline mr-1" />
                  GitHub
                </Label>
                <Input
                  value={data.contact.github || ""}
                  onChange={(e) => updateContact({ github: e.target.value })}
                  placeholder="github.com/johnsmith"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <Label className={labelClass}>
                  <Globe className="h-3 w-3 inline mr-1" />
                  Website
                </Label>
                <Input
                  value={data.contact.website || ""}
                  onChange={(e) => updateContact({ website: e.target.value })}
                  placeholder="johnsmith.dev"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
            </div>

            {/* Professional Headline */}
            <div className="mt-5 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <Label className={labelClass}>
                  <Target className="h-3 w-3 inline mr-1" />
                  Professional Headline
                </Label>
                {onAiImprove && data.headline && (
                  <AiActionButton
                    label="Enhance"
                    description="Make your headline more impactful"
                    icon={<Sparkles className="h-3 w-3" />}
                    onClick={() => handleAiImprove("headline", data.headline, {
                      skills: data.skills.technical.slice(0, 5),
                      yearsOfExperience: data.experience.length > 0 ? data.experience.length * 2 : undefined,
                      currentRole: data.experience.length > 0 ? data.experience[0].title : undefined,
                    })}
                    isLoading={loadingSection === "headline"}
                  />
                )}
              </div>
              <Input
                value={data.headline}
                onChange={(e) => updateHeadline(e.target.value)}
                placeholder="Senior Software Engineer | React | Node.js | AWS"
                className={inputClass}
              />
              <p className="text-xs text-zinc-600 mt-1">
                Tip: Include your role, key skills, and experience level
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Professional Summary */}
        <AccordionItem
          value="summary"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <FileSearch className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Professional Summary</span>
                <p className="text-xs text-zinc-500 font-normal">Your elevator pitch</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="flex items-center justify-between mb-2">
              <Label className={labelClass}>Summary (2-4 sentences)</Label>
              {onAiImprove && (
                <div className="flex items-center gap-1">
                  <AiActionButton
                    label="Improve"
                    description="Strengthen your summary with impactful language"
                    icon={<Sparkles className="h-3 w-3" />}
                    onClick={() => handleAiImprove("summary", data.summary, {
                      skills: data.skills.technical.slice(0, 8),
                      currentRole: data.experience.length > 0 ? data.experience[0].title : undefined,
                      yearsOfExperience: data.experience.length > 0 ? data.experience.length * 2 : undefined,
                    })}
                    isLoading={loadingSection === "summary"}
                  />
                  <AiActionButton
                    label="ATS"
                    description="Optimize for Applicant Tracking Systems"
                    icon={<FileSearch className="h-3 w-3" />}
                    onClick={() =>
                      handleAiImprove("summary", data.summary, {
                        mode: "ats",
                        skills: data.skills.technical.slice(0, 10),
                        currentRole: data.experience.length > 0 ? data.experience[0].title : undefined,
                      })
                    }
                    isLoading={loadingSection === "summary_ats"}
                    variant="outline"
                  />
                </div>
              )}
            </div>
            <Textarea
              value={data.summary}
              onChange={(e) => updateSummary(e.target.value)}
              placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Expert in React, Node.js, and cloud architecture. Passionate about creating elegant solutions to complex problems."
              rows={4}
              className={cn(inputClass, "resize-none")}
            />
            <p className="text-xs text-zinc-600 mt-2">
              Focus on your key strengths, experience, and what makes you unique
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* Experience */}
        <AccordionItem
          value="experience"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Work Experience</span>
                <p className="text-xs text-zinc-500 font-normal">
                  {data.experience.length} position{data.experience.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div
                  key={exp.id}
                  className="p-4 bg-zinc-800/30 rounded-xl relative group border border-zinc-800/50"
                >
                  {/* Delete Button */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => removeExperience(exp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Position Badge */}
                  <div className="mb-3">
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-700 text-zinc-400"
                    >
                      Position {index + 1}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={labelClass}>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(exp.id, { title: e.target.value })
                        }
                        placeholder="Senior Software Engineer"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(exp.id, { company: e.target.value })
                        }
                        placeholder="Tech Company Inc."
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Start Date</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(exp.id, { startDate: e.target.value })
                        }
                        placeholder="Jan 2020"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>End Date</Label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) =>
                          updateExperience(exp.id, { endDate: e.target.value })
                        }
                        placeholder="Present"
                        disabled={exp.isCurrentRole}
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className={labelClass}>Location (optional)</Label>
                      <Input
                        value={exp.location || ""}
                        onChange={(e) =>
                          updateExperience(exp.id, { location: e.target.value })
                        }
                        placeholder="San Francisco, CA"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <Label className={labelClass}>
                        <ChevronRight className="h-3 w-3 inline mr-1" />
                        Achievements & Responsibilities
                      </Label>
                      {onAiImprove && exp.bullets.some((b) => b.trim()) && (
                        <div className="flex items-center gap-1">
                          <AiActionButton
                            label="Improve"
                            description="Add action verbs and strengthen impact"
                            icon={<Sparkles className="h-3 w-3" />}
                            onClick={() =>
                              handleAiImprove("experience_bullets", exp.bullets.join("\n"), {
                                experienceId: exp.id,
                                title: exp.title,
                                company: exp.company,
                                skills: data.skills.technical.slice(0, 5),
                              })
                            }
                            isLoading={loadingSection === `experience_bullets_${exp.id}`}
                          />
                          <AiActionButton
                            label="Add Metrics"
                            description="Quantify achievements with numbers"
                            icon={<TrendingUp className="h-3 w-3" />}
                            onClick={() =>
                              handleAiImprove("experience_bullets", exp.bullets.join("\n"), {
                                experienceId: exp.id,
                                title: exp.title,
                                company: exp.company,
                                skills: data.skills.technical.slice(0, 5),
                                mode: "metrics",
                              })
                            }
                            isLoading={loadingSection === `experience_metrics_${exp.id}`}
                            variant="outline"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <div key={bulletIndex} className="flex gap-2 items-start">
                          <span className="text-emerald-500 mt-2.5 text-sm">•</span>
                          <Input
                            value={bullet}
                            onChange={(e) =>
                              updateExperienceBullet(exp.id, bulletIndex, e.target.value)
                            }
                            placeholder="Led development of feature that increased user engagement by 40%..."
                            className={cn(inputClass, "flex-1")}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                            onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 w-full mt-2"
                        onClick={() => addExperienceBullet(exp.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Achievement
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10"
                onClick={addExperience}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Work Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Education */}
        <AccordionItem
          value="education"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Education</span>
                <p className="text-xs text-zinc-500 font-normal">
                  {data.education.length} degree{data.education.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div
                  key={edu.id}
                  className="p-4 bg-zinc-800/30 rounded-xl relative group border border-zinc-800/50"
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => removeEducation(edu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className={labelClass}>Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(edu.id, { degree: e.target.value })
                        }
                        placeholder="Bachelor of Science in Computer Science"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(edu.id, { institution: e.target.value })
                        }
                        placeholder="Stanford University"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Graduation Year</Label>
                      <Input
                        value={edu.graduationDate}
                        onChange={(e) =>
                          updateEducation(edu.id, { graduationDate: e.target.value })
                        }
                        placeholder="2020"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>GPA (optional)</Label>
                      <Input
                        value={edu.gpa || ""}
                        onChange={(e) =>
                          updateEducation(edu.id, { gpa: e.target.value })
                        }
                        placeholder="3.8/4.0"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Location (optional)</Label>
                      <Input
                        value={edu.location || ""}
                        onChange={(e) =>
                          updateEducation(edu.id, { location: e.target.value })
                        }
                        placeholder="Stanford, CA"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-orange-400 hover:border-orange-500 hover:bg-orange-500/10"
                onClick={addEducation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem
          value="skills"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Skills</span>
                <p className="text-xs text-zinc-500 font-normal">
                  {data.skills.technical.length + data.skills.soft.length} skills
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            {/* Technical Skills */}
            <div className="mb-5">
              <Label className={cn(labelClass, "flex items-center gap-1 mb-2")}>
                <Zap className="h-3 w-3" />
                Technical Skills
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {data.skills.technical.map((skill) => (
                  <Badge
                    key={skill}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 pr-1 hover:from-violet-500 hover:to-purple-500"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill("technical", skill)}
                      className="ml-1.5 hover:text-red-200 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {data.skills.technical.length === 0 && (
                  <span className="text-xs text-zinc-600">No technical skills added</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill.technical}
                  onChange={(e) => setNewSkill({ ...newSkill, technical: e.target.value })}
                  placeholder="Add skill (e.g., React, Python, AWS)..."
                  className={cn(inputClass, "flex-1")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSkill.technical.trim()) {
                      addSkill("technical", newSkill.technical.trim());
                      setNewSkill({ ...newSkill, technical: "" });
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => {
                    if (newSkill.technical.trim()) {
                      addSkill("technical", newSkill.technical.trim());
                      setNewSkill({ ...newSkill, technical: "" });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Soft Skills */}
            <div>
              <Label className={cn(labelClass, "flex items-center gap-1 mb-2")}>
                <User className="h-3 w-3" />
                Soft Skills
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {data.skills.soft.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-zinc-600 text-zinc-300 pr-1 hover:border-zinc-500"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill("soft", skill)}
                      className="ml-1.5 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {data.skills.soft.length === 0 && (
                  <span className="text-xs text-zinc-600">No soft skills added</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill.soft}
                  onChange={(e) => setNewSkill({ ...newSkill, soft: e.target.value })}
                  placeholder="Add skill (e.g., Leadership, Communication)..."
                  className={cn(inputClass, "flex-1")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSkill.soft.trim()) {
                      addSkill("soft", newSkill.soft.trim());
                      setNewSkill({ ...newSkill, soft: "" });
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => {
                    if (newSkill.soft.trim()) {
                      addSkill("soft", newSkill.soft.trim());
                      setNewSkill({ ...newSkill, soft: "" });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Certifications */}
        <AccordionItem
          value="certifications"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
                <Award className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Certifications</span>
                <p className="text-xs text-zinc-500 font-normal">
                  {data.certifications.length} certification
                  {data.certifications.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="space-y-4">
              {data.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 bg-zinc-800/30 rounded-xl relative group border border-zinc-800/50"
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => removeCertification(cert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className={labelClass}>Certification Name</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) =>
                          updateCertification(cert.id, { name: e.target.value })
                        }
                        placeholder="AWS Certified Solutions Architect"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Issuer</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) =>
                          updateCertification(cert.id, { issuer: e.target.value })
                        }
                        placeholder="Amazon Web Services"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>Date</Label>
                      <Input
                        value={cert.date}
                        onChange={(e) =>
                          updateCertification(cert.id, { date: e.target.value })
                        }
                        placeholder="2023"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-yellow-400 hover:border-yellow-500 hover:bg-yellow-500/10"
                onClick={addCertification}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Projects */}
        <AccordionItem
          value="projects"
          className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-white">Projects</span>
                <p className="text-xs text-zinc-500 font-normal">
                  {data.projects.length} project{data.projects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2">
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 bg-zinc-800/30 rounded-xl relative group border border-zinc-800/50"
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => removeProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={labelClass}>Project Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) =>
                          updateProject(project.id, { name: e.target.value })
                        }
                        placeholder="E-commerce Platform"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div>
                      <Label className={labelClass}>URL (optional)</Label>
                      <Input
                        value={project.url || ""}
                        onChange={(e) =>
                          updateProject(project.id, { url: e.target.value })
                        }
                        placeholder="github.com/user/project"
                        className={cn(inputClass, "mt-1")}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className={labelClass}>Description</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) =>
                          updateProject(project.id, { description: e.target.value })
                        }
                        placeholder="Built a full-stack e-commerce platform using React and Node.js..."
                        rows={2}
                        className={cn(inputClass, "mt-1 resize-none")}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-cyan-500/10"
                onClick={addProject}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default ResumeEditor;
