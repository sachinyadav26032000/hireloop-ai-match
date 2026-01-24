/**
 * Modern Resume Template
 *
 * Features:
 * - Clean, contemporary design
 * - Two-column layout with sidebar
 * - Accent color highlights
 * - Icons for contact info
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from "lucide-react";

interface TemplateProps {
  data: ResumeData;
  scale?: number;
}

export function ModernTemplate({ data, scale = 1 }: TemplateProps) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-900 font-sans"
      style={{
        width: "210mm",
        minHeight: "297mm",
        ...(scale !== 1 && {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }),
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {contact.fullName || "Your Name"}
        </h1>
        {headline && (
          <p className="text-slate-300 text-lg mt-1">{headline}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-300">
          {contact.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{contact.location}</span>
            </div>
          )}
          {contact.linkedin && (
            <div className="flex items-center gap-1.5">
              <Linkedin className="h-4 w-4" />
              <span>{contact.linkedin.replace("https://", "").replace("www.", "")}</span>
            </div>
          )}
          {contact.github && (
            <div className="flex items-center gap-1.5">
              <Github className="h-4 w-4" />
              <span>{contact.github.replace("https://", "").replace("www.", "")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 px-8 py-6">
          {/* Summary */}
          {summary && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Professional Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-900">{exp.title || "Position"}</h3>
                        <p className="text-sm text-slate-600">{exp.company}{exp.location && ` • ${exp.location}`}</p>
                      </div>
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {exp.startDate} - {exp.isCurrentRole ? "Present" : exp.endDate}
                      </span>
                    </div>
                    {exp.bullets.length > 0 && exp.bullets.some(b => b.trim()) && (
                      <ul className="mt-2 space-y-1">
                        {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                          <li key={i} className="text-sm text-gray-700 flex">
                            <span className="mr-2 text-slate-400">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Projects
              </h2>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id}>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-slate-900">{project.name}</h3>
                      {project.url && (
                        <span className="text-sm text-blue-600">{project.url}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.technologies.map((tech, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-slate-50 px-6 py-6">
          {/* Skills */}
          {(skills.technical.length > 0 || skills.soft.length > 0) && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Skills
              </h2>
              {skills.technical.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Technical</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.technical.map((skill, i) => (
                      <span key={i} className="text-xs bg-slate-900 text-white px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.soft.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Soft Skills</h3>
                  <div className="flex flex-wrap gap-1">
                    {skills.soft.map((skill, i) => (
                      <span key={i} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Education
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="font-semibold text-sm text-slate-900">{edu.degree}</h3>
                    <p className="text-sm text-slate-600">{edu.institution}</p>
                    <p className="text-xs text-slate-500">{edu.graduationDate}</p>
                    {edu.gpa && <p className="text-xs text-slate-500">GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                Certifications
              </h2>
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <h3 className="font-semibold text-sm text-slate-900">{cert.name}</h3>
                    <p className="text-xs text-slate-600">{cert.issuer} • {cert.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModernTemplate;
