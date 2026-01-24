/**
 * Minimal Resume Template
 *
 * Features:
 * - Ultra-clean, minimalist design
 * - Lots of whitespace
 * - Sans-serif typography
 * - Focus on content
 */
import { ResumeData } from "@/contexts/ResumeContext";

interface TemplateProps {
  data: ResumeData;
  scale?: number;
}

export function MinimalTemplate({ data, scale = 1 }: TemplateProps) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-800 font-sans"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "25mm 20mm",
        ...(scale !== 1 && {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }),
      }}
    >
      {/* Header - Left aligned, minimal */}
      <header className="mb-8">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
          {contact.fullName || "Your Name"}
        </h1>
        {headline && (
          <p className="text-lg text-gray-500 mt-1 font-light">{headline}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && (
            <span>{contact.linkedin.replace("https://", "").replace("www.", "")}</span>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-8">
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Experience
          </h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <h3 className="font-medium text-gray-900">{exp.title || "Position"}</h3>
                    <p className="text-sm text-gray-500">{exp.company}</p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {exp.startDate} — {exp.isCurrentRole ? "Present" : exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && exp.bullets.some(b => b.trim()) && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                      <li key={i} className="text-sm text-gray-600 pl-4 relative">
                        <span className="absolute left-0 text-gray-300">—</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two Column: Education & Skills */}
      <div className="grid grid-cols-2 gap-12">
        {/* Education */}
        {education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-medium text-gray-900">{edu.degree}</h3>
                  <p className="text-sm text-gray-500">{edu.institution}</p>
                  <p className="text-sm text-gray-400">{edu.graduationDate}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Skills
            </h2>
            {skills.technical.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {skills.technical.join(" · ")}
                </p>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {skills.soft.join(" · ")}
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Projects
          </h2>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id}>
                <h3 className="font-medium text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                {project.technologies.length > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    {project.technologies.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Certifications
          </h2>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between">
                <span className="text-sm text-gray-600">{cert.name}</span>
                <span className="text-sm text-gray-400">{cert.issuer}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default MinimalTemplate;
