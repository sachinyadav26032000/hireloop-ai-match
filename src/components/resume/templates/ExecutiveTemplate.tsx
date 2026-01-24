/**
 * Executive Resume Template
 *
 * Features:
 * - Bold, commanding design
 * - Dark header with contrast
 * - Structured layout for senior professionals
 * - Emphasizes leadership and achievements
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

interface TemplateProps {
  data: ResumeData;
  scale?: number;
}

export function ExecutiveTemplate({ data, scale = 1 }: TemplateProps) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-900"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: "'Georgia', serif",
        ...(scale !== 1 && {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }),
      }}
    >
      {/* Header - Bold executive style */}
      <div className="bg-black text-white px-10 py-8">
        <h1 className="text-4xl font-bold tracking-wide">
          {contact.fullName?.toUpperCase() || "YOUR NAME"}
        </h1>
        {headline && (
          <p className="text-amber-400 text-xl mt-2 font-light">{headline}</p>
        )}
        <div className="flex flex-wrap gap-6 mt-6 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-400" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-amber-400" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>{contact.location}</span>
            </div>
          )}
          {contact.linkedin && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-amber-400" />
              <span>{contact.linkedin.replace("https://", "").replace("www.", "")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-10 py-8">
        {/* Executive Summary */}
        {summary && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-black uppercase tracking-wider border-b-2 border-amber-500 pb-2 mb-4 inline-block">
              Executive Summary
            </h2>
            <p className="text-gray-700 leading-relaxed text-justify">{summary}</p>
          </section>
        )}

        {/* Core Competencies / Skills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-black uppercase tracking-wider border-b-2 border-amber-500 pb-2 mb-4 inline-block">
              Core Competencies
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[...skills.technical, ...skills.soft].map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span className="text-sm text-gray-700">{skill}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-black uppercase tracking-wider border-b-2 border-amber-500 pb-2 mb-4 inline-block">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="border-l-4 border-amber-500 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-black">{exp.title || "Position"}</h3>
                      <p className="text-amber-700 font-semibold">{exp.company}</p>
                      {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                    </div>
                    <span className="text-sm text-gray-600 font-semibold bg-gray-100 px-3 py-1 rounded">
                      {exp.startDate} - {exp.isCurrentRole ? "Present" : exp.endDate}
                    </span>
                  </div>
                  {exp.bullets.length > 0 && exp.bullets.some(b => b.trim()) && (
                    <ul className="mt-3 space-y-2">
                      {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                        <li key={i} className="text-sm text-gray-700 flex">
                          <span className="mr-3 text-amber-500 font-bold">▸</span>
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

        {/* Two Column: Education & Certifications */}
        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider border-b-2 border-amber-500 pb-2 mb-4 inline-block">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="font-bold text-black">{edu.degree}</h3>
                    <p className="text-amber-700">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.graduationDate}</p>
                    {edu.gpa && (
                      <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-black uppercase tracking-wider border-b-2 border-amber-500 pb-2 mb-4 inline-block">
                Certifications
              </h2>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <h3 className="font-bold text-black">{cert.name}</h3>
                    <p className="text-sm text-gray-600">{cert.issuer} • {cert.date}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-black uppercase tracking-wider border-b-2 border-amber-500 pb-2 mb-4 inline-block">
              Key Projects
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold text-black">{project.name}</h3>
                  <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
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
    </div>
  );
}

export default ExecutiveTemplate;
