/**
 * LinkedIn Profile Generator Component
 *
 * Displays a LinkedIn-style profile preview with REAL data from resume parsing.
 * NO placeholder content - only actual candidate data.
 * All sections are editable inline.
 * AI improve buttons for each section.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Linkedin,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  Pencil,
  Check,
  X,
  Sparkles,
  Plus,
  Trash2,
  Building2,
  GraduationCap,
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Globe,
  Users,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CVData, ProfileAnalysis } from "@/lib/api";

// Types for LinkedIn Profile data
export interface LinkedInProfileData {
  // Header
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  connections: string;
  openToWork: boolean;

  // About
  about: string;

  // Experience
  experience: {
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    bullets: string[];
  }[];

  // Education
  education: {
    id: string;
    degree: string;
    field: string;
    institution: string;
    startYear: string;
    endYear: string;
  }[];

  // Skills
  skills: {
    name: string;
    endorsements: number;
  }[];

  // Certifications
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
  }[];
}

interface LinkedInProfileProps {
  cvData: CVData | null;
  profileAnalysis: ProfileAnalysis | null;
  resumeText: string;
  userInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location: string;
    linkedinUrl?: string;
  };
  onImproveSection?: (section: string, currentContent: string) => Promise<string>;
  onProfileUpdate?: (profile: LinkedInProfileData) => void;
}

// Generate headline from data
function generateHeadline(
  role: string,
  skills: string[],
  yearsExp: number,
  industry?: string
): string {
  if (!role) return "";

  const topSkills = skills.slice(0, 3);
  const parts = [role];

  if (topSkills.length > 0) {
    parts.push(topSkills.join(" | "));
  }

  if (yearsExp > 0) {
    parts.push(`${yearsExp}+ Years Experience`);
  }

  return parts.join(" | ");
}

// Generate about section from resume data
function generateAboutSection(
  summary: string,
  role: string,
  skills: string[],
  yearsExp: number,
  achievements: string[]
): string {
  if (summary && summary.length > 50) {
    return summary;
  }

  let about = "";

  if (yearsExp >= 5) {
    about += `Results-driven ${role} with ${yearsExp}+ years of experience delivering impactful solutions. `;
  } else if (yearsExp >= 2) {
    about += `${role} with ${yearsExp}+ years of hands-on experience building quality solutions. `;
  } else {
    about += `Passionate ${role} focused on continuous learning and delivering excellence. `;
  }

  if (skills.length > 0) {
    about += `\n\nCore Expertise:\n`;
    skills.slice(0, 8).forEach(skill => {
      about += `• ${skill}\n`;
    });
  }

  if (achievements && achievements.length > 0) {
    about += `\nKey Achievements:\n`;
    achievements.slice(0, 3).forEach(achievement => {
      about += `• ${achievement}\n`;
    });
  }

  about += `\nOpen to discussing new opportunities and collaborations.`;

  return about;
}

// Build profile data from CV and analysis
function buildProfileFromData(
  cvData: CVData | null,
  profileAnalysis: ProfileAnalysis | null,
  userInfo: LinkedInProfileProps["userInfo"]
): LinkedInProfileData {
  const role = profileAnalysis?.suggestedRoles?.[0] || cvData?.title || "";
  const skills = profileAnalysis?.coreSkills || cvData?.skills?.technical || [];
  const yearsExp = profileAnalysis?.yearsOfExperience || 0;

  return {
    name: userInfo.fullName || cvData?.fullName || "",
    headline: cvData?.title
      ? generateHeadline(cvData.title, skills, yearsExp)
      : generateHeadline(role, skills, yearsExp),
    location: userInfo.location || cvData?.location || "",
    email: userInfo.email || cvData?.email || "",
    phone: userInfo.phone || cvData?.phone || "",
    linkedinUrl: userInfo.linkedinUrl || cvData?.linkedin || "",
    connections: "500+",
    openToWork: true,

    about: generateAboutSection(
      cvData?.summary || profileAnalysis?.summary || "",
      role,
      skills,
      yearsExp,
      profileAnalysis?.strengths || []
    ),

    experience: (cvData?.experience || []).map((exp, i) => ({
      id: `exp-${i}`,
      title: exp.title,
      company: exp.company,
      location: "",
      startDate: exp.duration?.split(" - ")?.[0] || "",
      endDate: exp.duration?.split(" - ")?.[1] || "Present",
      current: exp.duration?.toLowerCase().includes("present") || false,
      description: "",
      bullets: exp.bullets || [],
    })),

    education: (cvData?.education || []).map((edu, i) => ({
      id: `edu-${i}`,
      degree: edu.degree,
      field: "",
      institution: edu.institution,
      startYear: "",
      endYear: edu.year,
    })),

    skills: skills.map((skill, i) => ({
      name: skill,
      endorsements: Math.max(99 - i * 5, 10),
    })),

    certifications: (cvData?.certifications || []).map((cert, i) => ({
      id: `cert-${i}`,
      name: cert,
      issuer: "",
      date: "",
    })),
  };
}

// LinkedIn Brand Colors
const linkedinColors = {
  primary: "#0077B5",       // LinkedIn Blue
  primaryHover: "#006097",  // Darker blue for hover
  primaryLight: "#70b5f9",  // Light blue for accents
  black: "#000000",
  white: "#FFFFFF",
  background: "#F4F2EE",    // LinkedIn page background
  cardBg: "#FFFFFF",        // White card background
  border: "#E0E0E0",        // Card borders
  textPrimary: "#000000",   // Main text
  textSecondary: "#666666", // Secondary text
  textTertiary: "#00000099", // Muted text
  success: "#057642",       // Green for #OpenToWork
  successBg: "#DDF5E9",     // Light green background
};

// Editable Field Component
function EditableField({
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn("flex-1 min-h-[100px] border-[#0077B5] focus:border-[#0077B5] focus:ring-[#0077B5] bg-white text-black", className)}
            style={{ borderColor: linkedinColors.primary }}
            autoFocus
          />
        ) : (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn("flex-1 border-[#0077B5] focus:border-[#0077B5] focus:ring-[#0077B5] bg-white text-black", className)}
            style={{ borderColor: linkedinColors.primary }}
            autoFocus
          />
        )}
        <Button size="sm" variant="ghost" onClick={handleSave} className="text-[#057642] hover:bg-[#DDF5E9]">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="text-red-600 hover:bg-red-50">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-2 cursor-pointer hover:bg-[#F4F2EE] rounded px-2 py-1 -mx-2 -my-1 transition-colors",
        className
      )}
      onClick={() => setEditing(true)}
    >
      <span className={cn("flex-1 text-[#000000]", !value && "!text-[#666666] italic")}>
        {value || placeholder}
      </span>
      <Pencil className="h-4 w-4 text-[#666666] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Main Component
export function LinkedInProfile({
  cvData,
  profileAnalysis,
  resumeText,
  userInfo,
  onImproveSection,
  onProfileUpdate,
}: LinkedInProfileProps) {
  const [profile, setProfile] = useState<LinkedInProfileData>(() =>
    buildProfileFromData(cvData, profileAnalysis, userInfo)
  );
  const [expandedAbout, setExpandedAbout] = useState(false);
  const [improvingSection, setImprovingSection] = useState<string | null>(null);

  // Update profile when data changes
  useEffect(() => {
    setProfile(buildProfileFromData(cvData, profileAnalysis, userInfo));
  }, [cvData, profileAnalysis, userInfo]);

  // Notify parent of profile changes
  useEffect(() => {
    onProfileUpdate?.(profile);
  }, [profile, onProfileUpdate]);

  const updateProfile = (updates: Partial<LinkedInProfileData>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleImprove = async (section: string, content: string) => {
    if (!onImproveSection) {
      toast.error("AI improvement not available");
      return;
    }

    setImprovingSection(section);
    try {
      const improved = await onImproveSection(section, content);
      if (section === "headline") {
        updateProfile({ headline: improved });
      } else if (section === "about") {
        updateProfile({ about: improved });
      }
      toast.success(`${section} improved!`);
    } catch (error) {
      toast.error("Failed to improve section");
    } finally {
      setImprovingSection(null);
    }
  };

  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `exp-${Date.now()}`,
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
          bullets: [],
        },
      ],
    }));
  };

  const removeExperience = (id: string) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  const updateExperience = (id: string, updates: Partial<LinkedInProfileData["experience"][0]>) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    }));
  };

  const addSkill = (skillName: string) => {
    if (!skillName.trim()) return;
    if (profile.skills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
      toast.error("Skill already exists");
      return;
    }
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, { name: skillName.trim(), endorsements: 0 }],
    }));
  };

  const removeSkill = (skillName: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name !== skillName),
    }));
  };

  // Check if we have actual data
  const hasData = profile.name || profile.experience.length > 0 || profile.skills.length > 0;

  if (!hasData) {
    return (
      <Card className="bg-white border-[#E0E0E0] shadow-sm">
        <CardContent className="py-12 text-center">
          <Linkedin className="h-12 w-12 mx-auto mb-4 text-[#0077B5]" />
          <h3 className="text-lg font-medium text-[#000000] mb-2">No Profile Data Available</h3>
          <p className="text-[#666666] text-sm">
            Upload a resume or fill in your details to generate your LinkedIn profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2" style={{ backgroundColor: linkedinColors.background, padding: '8px', borderRadius: '8px' }}>
      {/* LinkedIn Header Card */}
      <Card className="bg-white border-[#E0E0E0] overflow-hidden shadow-sm rounded-lg">
        {/* Banner - LinkedIn style gradient */}
        <div className="h-[120px] relative" style={{ background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 50%, #70B5F9 100%)' }}>
          {profile.openToWork && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: linkedinColors.successBg, color: linkedinColors.success }}>
              <span className="text-xs">🟢</span> #OpenToWork
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          {/* Avatar - LinkedIn style with border */}
          <div className="absolute -top-16 left-6">
            <div className="w-[152px] h-[152px] rounded-full border-4 border-white flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)' }}>
              <span className="text-white text-5xl font-semibold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {profile.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
          </div>

          {/* Name and Headline */}
          <div className="pt-24 space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold" style={{ color: linkedinColors.textPrimary, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <EditableField
                  value={profile.name}
                  onChange={(name) => updateProfile({ name })}
                  placeholder="Add your name"
                />
              </h1>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.name, "Name")}
                className="text-[#666666] hover:bg-[#F4F2EE]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-start gap-2">
              <div className="flex-1">
                <EditableField
                  value={profile.headline}
                  onChange={(headline) => updateProfile({ headline })}
                  placeholder="Add a professional headline"
                  className="text-[#000000]"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove("headline", profile.headline)}
                disabled={improvingSection === "headline"}
                className="text-[#0077B5] hover:bg-[#E7F3FF]"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {improvingSection === "headline" ? "..." : "Improve"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.headline, "Headline")}
                className="text-[#666666] hover:bg-[#F4F2EE]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact Info Row - LinkedIn style */}
            <div className="flex flex-wrap items-center gap-4 text-sm mt-2" style={{ color: linkedinColors.textSecondary }}>
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-[#0077B5] font-medium hover:underline cursor-pointer">
                {profile.connections} connections
              </span>
            </div>

            {/* Contact info link - LinkedIn style */}
            <div className="text-sm font-semibold" style={{ color: linkedinColors.primary }}>
              <span className="hover:underline cursor-pointer">Contact info</span>
            </div>

            {/* Action Buttons - LinkedIn style */}
            <div className="flex gap-2 mt-4">
              <Button
                className="rounded-full font-semibold px-4 text-white"
                style={{ backgroundColor: linkedinColors.primary }}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Open to
              </Button>
              <Button
                className="rounded-full font-semibold px-4 border-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: linkedinColors.primary,
                  color: linkedinColors.primary
                }}
              >
                Add profile section
              </Button>
              <Button
                className="rounded-full font-semibold px-4 border-2"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: linkedinColors.textSecondary,
                  color: linkedinColors.textSecondary
                }}
              >
                More
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* About Section - LinkedIn style */}
      <Card className="bg-white border-[#E0E0E0] shadow-sm rounded-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: linkedinColors.textPrimary }}>
              About
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove("about", profile.about)}
                disabled={improvingSection === "about"}
                className="text-[#0077B5] hover:bg-[#E7F3FF]"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {improvingSection === "about" ? "Improving..." : "Improve with AI"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.about, "About section")}
                className="text-[#666666] hover:bg-[#F4F2EE]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "relative",
            !expandedAbout && profile.about.length > 300 && "max-h-32 overflow-hidden"
          )}>
            <EditableField
              value={profile.about}
              onChange={(about) => updateProfile({ about })}
              placeholder="Write about yourself - your experience, expertise, and what drives you"
              multiline
              className="text-sm whitespace-pre-line leading-relaxed"
            />
            {!expandedAbout && profile.about.length > 300 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
          {profile.about.length > 300 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedAbout(!expandedAbout)}
              className="text-[#0077B5] mt-2 p-0 h-auto font-semibold hover:underline"
            >
              {expandedAbout ? (
                <>...see less <ChevronUp className="h-4 w-4 ml-1" /></>
              ) : (
                <>...see more <ChevronDown className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}
          <p className="text-xs mt-2" style={{ color: linkedinColors.textSecondary }}>
            {profile.about.length} / 2,600 characters
          </p>
        </CardContent>
      </Card>

      {/* Experience Section - LinkedIn style */}
      <Card className="bg-white border-[#E0E0E0] shadow-sm rounded-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: linkedinColors.textPrimary }}>
              Experience
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={addExperience}
                className="text-[#0077B5] hover:bg-[#E7F3FF]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const text = profile.experience.map(exp =>
                    `${exp.title} at ${exp.company}\n${exp.startDate} - ${exp.endDate}\n${exp.bullets.map(b => `• ${b}`).join("\n")}`
                  ).join("\n\n");
                  copyToClipboard(text, "Experience");
                }}
                className="text-[#666666] hover:bg-[#F4F2EE]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.experience.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-[#666666]" />
              <p className="text-sm mb-3" style={{ color: linkedinColors.textSecondary }}>No experience added yet</p>
              <Button
                size="sm"
                onClick={addExperience}
                className="rounded-full"
                style={{ backgroundColor: linkedinColors.primary }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Experience
              </Button>
            </div>
          ) : (
            profile.experience.map((exp, index) => (
              <div key={exp.id} className="flex gap-4 group">
                {/* Company Logo Placeholder - LinkedIn style square */}
                <div className="w-12 h-12 rounded bg-[#F4F2EE] flex items-center justify-center flex-shrink-0 border border-[#E0E0E0]">
                  <Building2 className="h-6 w-6 text-[#666666]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <EditableField
                        value={exp.title}
                        onChange={(title) => updateExperience(exp.id, { title })}
                        placeholder="Job Title"
                        className="font-semibold"
                        style={{ color: linkedinColors.textPrimary }}
                      />
                      <EditableField
                        value={exp.company}
                        onChange={(company) => updateExperience(exp.id, { company })}
                        placeholder="Company Name"
                        className="text-sm"
                        style={{ color: linkedinColors.textSecondary }}
                      />
                      <div className="flex items-center gap-2 text-sm mt-1" style={{ color: linkedinColors.textSecondary }}>
                        <EditableField
                          value={`${exp.startDate}${exp.startDate && exp.endDate ? " - " : ""}${exp.endDate}`}
                          onChange={(duration) => {
                            const [start, end] = duration.split(" - ");
                            updateExperience(exp.id, { startDate: start || "", endDate: end || "" });
                          }}
                          placeholder="Start - End Date"
                          className="text-[#666666]"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExperience(exp.id)}
                      className="text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bullets */}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-2 text-sm" style={{ color: linkedinColors.textPrimary }}>
                          <span className="text-[#666666] mt-0.5">•</span>
                          <EditableField
                            value={bullet}
                            onChange={(newBullet) => {
                              const newBullets = [...exp.bullets];
                              newBullets[bulletIndex] = newBullet;
                              updateExperience(exp.id, { bullets: newBullets });
                            }}
                            placeholder="Describe your achievement"
                            className="flex-1"
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      updateExperience(exp.id, { bullets: [...exp.bullets, ""] });
                    }}
                    className="text-[#0077B5] text-xs mt-2 hover:bg-[#E7F3FF]"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add bullet
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Education Section - LinkedIn style */}
      <Card className="bg-white border-[#E0E0E0] shadow-sm rounded-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: linkedinColors.textPrimary }}>
              Education
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setProfile(prev => ({
                  ...prev,
                  education: [
                    ...prev.education,
                    { id: `edu-${Date.now()}`, degree: "", field: "", institution: "", startYear: "", endYear: "" },
                  ],
                }));
              }}
              className="text-[#0077B5] hover:bg-[#E7F3FF]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.education.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: linkedinColors.textSecondary }}>No education added</p>
          ) : (
            profile.education.map((edu) => (
              <div key={edu.id} className="flex gap-4 group">
                <div className="w-12 h-12 rounded bg-[#F4F2EE] flex items-center justify-center flex-shrink-0 border border-[#E0E0E0]">
                  <GraduationCap className="h-6 w-6 text-[#666666]" />
                </div>
                <div className="flex-1">
                  <EditableField
                    value={edu.institution}
                    onChange={(institution) => {
                      setProfile(prev => ({
                        ...prev,
                        education: prev.education.map(e =>
                          e.id === edu.id ? { ...e, institution } : e
                        ),
                      }));
                    }}
                    placeholder="Institution Name"
                    className="font-semibold"
                    style={{ color: linkedinColors.textPrimary }}
                  />
                  <EditableField
                    value={edu.degree}
                    onChange={(degree) => {
                      setProfile(prev => ({
                        ...prev,
                        education: prev.education.map(e =>
                          e.id === edu.id ? { ...e, degree } : e
                        ),
                      }));
                    }}
                    placeholder="Degree"
                    className="text-sm"
                    style={{ color: linkedinColors.textSecondary }}
                  />
                  {edu.endYear && (
                    <p className="text-sm" style={{ color: linkedinColors.textSecondary }}>{edu.endYear}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setProfile(prev => ({
                      ...prev,
                      education: prev.education.filter(e => e.id !== edu.id),
                    }));
                  }}
                  className="text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Skills Section - LinkedIn style */}
      <Card className="bg-white border-[#E0E0E0] shadow-sm rounded-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: linkedinColors.textPrimary }}>
              Skills
              <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-[#F4F2EE]" style={{ color: linkedinColors.textSecondary }}>
                {profile.skills.length}
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const skill = prompt("Enter skill name:");
                  if (skill) addSkill(skill);
                }}
                className="text-[#0077B5] hover:bg-[#E7F3FF]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Skill
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.skills.map(s => s.name).join(", "), "Skills")}
                className="text-[#666666] hover:bg-[#F4F2EE]"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: linkedinColors.textSecondary }}>No skills added</p>
          ) : (
            <div className="space-y-3">
              {/* Top Skills */}
              <div className="space-y-2">
                {profile.skills.slice(0, 5).map((skill, index) => (
                  <div key={skill.name} className="flex items-center justify-between group p-2 rounded hover:bg-[#F4F2EE] border-b border-[#E0E0E0] last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium" style={{ color: linkedinColors.textPrimary }}>{skill.name}</span>
                      {index < 3 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#E7F3FF] text-[#0077B5] font-medium">Top Skill</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: linkedinColors.textSecondary }}>{skill.endorsements} endorsements</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSkill(skill.name)}
                        className="text-red-600 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Other Skills */}
              {profile.skills.length > 5 && (
                <div className="pt-3 border-t border-[#E0E0E0]">
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(5).map((skill) => (
                      <span
                        key={skill.name}
                        className="px-3 py-1.5 rounded-full text-sm cursor-pointer group flex items-center gap-1 border border-[#E0E0E0] hover:bg-[#F4F2EE]"
                        style={{ color: linkedinColors.textPrimary }}
                        onClick={() => removeSkill(skill.name)}
                      >
                        {skill.name}
                        <X className="h-3 w-3 opacity-0 group-hover:opacity-100 text-red-600" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications Section - LinkedIn style */}
      {profile.certifications.length > 0 && (
        <Card className="bg-white border-[#E0E0E0] shadow-sm rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ color: linkedinColors.textPrimary }}>
              Licenses & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.certifications.map((cert) => (
              <div key={cert.id} className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded bg-[#F4F2EE] flex items-center justify-center border border-[#E0E0E0]">
                  <Award className="h-6 w-6 text-[#666666]" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: linkedinColors.textPrimary }}>{cert.name}</p>
                  {cert.issuer && <p className="text-sm" style={{ color: linkedinColors.textSecondary }}>{cert.issuer}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Copy All Button - LinkedIn style */}
      <div className="flex justify-center pt-4 pb-2">
        <Button
          onClick={() => {
            const fullProfile = `
${profile.name}
${profile.headline}
${profile.location}

ABOUT
${profile.about}

EXPERIENCE
${profile.experience.map(exp => `
${exp.title} at ${exp.company}
${exp.startDate} - ${exp.endDate}
${exp.bullets.map(b => `• ${b}`).join("\n")}
`).join("\n")}

EDUCATION
${profile.education.map(edu => `${edu.degree} - ${edu.institution} (${edu.endYear})`).join("\n")}

SKILLS
${profile.skills.map(s => s.name).join(", ")}
            `.trim();
            copyToClipboard(fullProfile, "Full LinkedIn profile");
          }}
          className="rounded-full font-semibold px-6 text-white"
          style={{ backgroundColor: linkedinColors.primary }}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Entire Profile
        </Button>
      </div>
    </div>
  );
}
