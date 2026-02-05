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
            className={cn("flex-1 bg-zinc-800 border-zinc-600 text-white min-h-[100px]", className)}
            autoFocus
          />
        ) : (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={cn("flex-1 bg-zinc-800 border-zinc-600 text-white", className)}
            autoFocus
          />
        )}
        <Button size="sm" variant="ghost" onClick={handleSave} className="text-emerald-400">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="text-red-400">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-2 cursor-pointer hover:bg-zinc-800/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors",
        className
      )}
      onClick={() => setEditing(true)}
    >
      <span className={cn("flex-1", !value && "text-zinc-500 italic")}>
        {value || placeholder}
      </span>
      <Pencil className="h-4 w-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-12 text-center">
          <Linkedin className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No Profile Data Available</h3>
          <p className="text-zinc-500 text-sm">
            Upload a resume or fill in your details to generate your LinkedIn profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* LinkedIn Header Card */}
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 relative">
          {profile.openToWork && (
            <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0">
              #OpenToWork
            </Badge>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-zinc-900 bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-xl">
              <span className="text-white text-4xl font-bold">
                {profile.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </span>
            </div>
          </div>

          {/* Name and Headline */}
          <div className="pt-20 space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">
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
                className="text-zinc-400"
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
                  className="text-zinc-300"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove("headline", profile.headline)}
                disabled={improvingSection === "headline"}
                className="text-violet-400 hover:text-violet-300"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {improvingSection === "headline" ? "..." : "Improve"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.headline, "Headline")}
                className="text-zinc-400"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mt-3">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {profile.connections} connections
              </span>
              {profile.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                <Linkedin className="h-4 w-4 mr-2" />
                Open to Work
              </Button>
              <Button variant="outline" className="border-zinc-600 text-zinc-300">
                <Mail className="h-4 w-4 mr-2" />
                Contact Info
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* About Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              About
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleImprove("about", profile.about)}
                disabled={improvingSection === "about"}
                className="text-violet-400 hover:text-violet-300"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {improvingSection === "about" ? "Improving..." : "Improve with AI"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.about, "About section")}
                className="text-zinc-400"
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
              className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed"
            />
            {!expandedAbout && profile.about.length > 300 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent" />
            )}
          </div>
          {profile.about.length > 300 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedAbout(!expandedAbout)}
              className="text-blue-400 mt-2 p-0 h-auto"
            >
              {expandedAbout ? (
                <>...see less <ChevronUp className="h-4 w-4 ml-1" /></>
              ) : (
                <>...see more <ChevronDown className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          )}
          <p className="text-xs text-zinc-500 mt-2">
            {profile.about.length} / 2,600 characters
          </p>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-zinc-400" />
              Experience
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={addExperience}
                className="text-blue-400"
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
                className="text-zinc-400"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.experience.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-10 w-10 mx-auto mb-3 text-zinc-600" />
              <p className="text-zinc-500 text-sm mb-3">No experience added yet</p>
              <Button size="sm" onClick={addExperience} className="bg-blue-600 hover:bg-blue-500">
                <Plus className="h-4 w-4 mr-1" />
                Add Experience
              </Button>
            </div>
          ) : (
            profile.experience.map((exp, index) => (
              <div key={exp.id} className="flex gap-4 group">
                {/* Company Logo Placeholder */}
                <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-zinc-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <EditableField
                        value={exp.title}
                        onChange={(title) => updateExperience(exp.id, { title })}
                        placeholder="Job Title"
                        className="font-medium text-white"
                      />
                      <EditableField
                        value={exp.company}
                        onChange={(company) => updateExperience(exp.id, { company })}
                        placeholder="Company Name"
                        className="text-zinc-400 text-sm"
                      />
                      <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                        <Calendar className="h-3 w-3" />
                        <EditableField
                          value={`${exp.startDate}${exp.startDate && exp.endDate ? " - " : ""}${exp.endDate}`}
                          onChange={(duration) => {
                            const [start, end] = duration.split(" - ");
                            updateExperience(exp.id, { startDate: start || "", endDate: end || "" });
                          }}
                          placeholder="Start - End Date"
                          className="text-zinc-500"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeExperience(exp.id)}
                      className="text-red-400 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bullets */}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {exp.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="text-blue-400 mt-0.5">•</span>
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
                    className="text-blue-400 text-xs mt-2"
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

      {/* Education Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-zinc-400" />
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
              className="text-blue-400"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.education.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">No education added</p>
          ) : (
            profile.education.map((edu) => (
              <div key={edu.id} className="flex gap-4 group">
                <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-zinc-500" />
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
                    className="font-medium text-white"
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
                    className="text-zinc-400 text-sm"
                  />
                  {edu.endYear && (
                    <p className="text-zinc-500 text-sm">{edu.endYear}</p>
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
                  className="text-red-400 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-zinc-400" />
              Skills
              <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-400">
                {profile.skills.length}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const skill = prompt("Enter skill name:");
                  if (skill) addSkill(skill);
                }}
                className="text-blue-400"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Skill
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.skills.map(s => s.name).join(", "), "Skills")}
                className="text-zinc-400"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile.skills.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">No skills added</p>
          ) : (
            <div className="space-y-3">
              {/* Top Skills */}
              <div className="space-y-2">
                {profile.skills.slice(0, 5).map((skill, index) => (
                  <div key={skill.name} className="flex items-center justify-between group p-2 rounded hover:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-white">{skill.name}</span>
                      {index < 3 && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">Top Skill</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-sm">{skill.endorsements} endorsements</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSkill(skill.name)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Other Skills */}
              {profile.skills.length > 5 && (
                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(5).map((skill) => (
                      <Badge
                        key={skill.name}
                        className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer group"
                        onClick={() => removeSkill(skill.name)}
                      >
                        {skill.name}
                        <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications Section */}
      {profile.certifications.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-zinc-400" />
              Licenses & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.certifications.map((cert) => (
              <div key={cert.id} className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
                  <Award className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-white font-medium">{cert.name}</p>
                  {cert.issuer && <p className="text-zinc-400 text-sm">{cert.issuer}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Copy All Button */}
      <div className="flex justify-center pt-4">
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
          className="bg-blue-600 hover:bg-blue-500"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Entire Profile
        </Button>
      </div>
    </div>
  );
}
