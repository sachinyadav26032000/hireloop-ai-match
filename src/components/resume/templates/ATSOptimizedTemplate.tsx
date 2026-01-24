/**
 * ATS Optimized Template - Maximum ATS compatibility
 * Best for: All job seekers, especially when applying through job portals
 * Features: Simple formatting, standard fonts, no columns, keyword-rich
 */
import { ResumeData } from "@/contexts/ResumeContext";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function ATSOptimizedTemplate({ data, scale = 1 }: Props) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-black font-sans"
      style={{
        width: `${210 * scale}mm`,
        minHeight: `${297 * scale}mm`,
        padding: `${15 * scale}mm`,
        fontSize: `${11 * scale}pt`,
        lineHeight: 1.6,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header - Simple, ATS-readable */}
      <header className="text-center mb-4 border-b-2 border-black pb-3">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          {contact.fullName || "YOUR NAME"}
        </h1>
        {headline && (
          <p className="text-sm font-medium mt-1">{headline}</p>
        )}
        <p className="text-xs mt-2">
          {[contact.email, contact.phone, contact.location, contact.linkedin]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs">{summary}</p>
        </section>
      )}

      {/* Skills - Keyword rich section */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Skills
          </h2>
          {skills.technical.length > 0 && (
            <p className="text-xs mb-1">
              <strong>Technical Skills:</strong> {skills.technical.join(", ")}
            </p>
          )}
          {skills.soft.length > 0 && (
            <p className="text-xs mb-1">
              <strong>Soft Skills:</strong> {skills.soft.join(", ")}
            </p>
          )}
          {skills.tools && skills.tools.length > 0 && (
            <p className="text-xs">
              <strong>Tools:</strong> {skills.tools.join(", ")}
            </p>
          )}
        </section>
      )}

      {/* Professional Experience */}
      {experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Professional Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs">{exp.title}</span>
                <span className="text-xs">{exp.startDate} - {exp.endDate}</span>
              </div>
              <p className="text-xs italic">
                {exp.company}{exp.location ? `, ${exp.location}` : ""}
              </p>
              {exp.bullets.length > 0 && (
                <ul className="mt-1 text-xs list-disc ml-4">
                  {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-xs">{edu.degree}</span>
                <span className="text-xs">{edu.graduationDate}</span>
              </div>
              <p className="text-xs">{edu.institution}{edu.location ? `, ${edu.location}` : ""}</p>
              {edu.gpa && <p className="text-xs">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Projects
          </h2>
          {projects.map((project) => (
            <div key={project.id} className="mb-2">
              <p className="font-bold text-xs">{project.name}</p>
              <p className="text-xs">{project.description}</p>
              {project.technologies.length > 0 && (
                <p className="text-xs italic">Technologies: {project.technologies.join(", ")}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            Certifications
          </h2>
          {certifications.map((cert) => (
            <p key={cert.id} className="text-xs">
              {cert.name} - {cert.issuer}, {cert.date}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
