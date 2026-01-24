/**
 * Professional Resume Template
 *
 * Features:
 * - Classic, traditional design
 * - Single column layout
 * - Clean typography
 * - ATS-friendly format
 */
import { ResumeData } from "@/contexts/ResumeContext";

interface TemplateProps {
  data: ResumeData;
  scale?: number;
}

export function ProfessionalTemplate({ data, scale = 1 }: TemplateProps) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-900 font-serif"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        ...(scale !== 1 && {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }),
      }}
    >
      {/* Header - Centered */}
      <header className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-wide">
          {contact.fullName || "Your Name"}
        </h1>
        {headline && (
          <p className="text-gray-600 text-lg mt-1 italic">{headline}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-3 text-sm text-gray-600">
          {contact.email && <span>{contact.email}</span>}
          {contact.email && contact.phone && <span>|</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.phone && contact.location && <span>|</span>}
          {contact.location && <span>{contact.location}</span>}
        </div>
        {(contact.linkedin || contact.github || contact.website) && (
          <div className="flex flex-wrap justify-center gap-3 mt-1 text-sm text-gray-600">
            {contact.linkedin && (
              <span>{contact.linkedin.replace("https://", "").replace("www.", "")}</span>
            )}
            {contact.github && (
              <span>{contact.github.replace("https://", "").replace("www.", "")}</span>
            )}
            {contact.website && (
              <span>{contact.website.replace("https://", "").replace("www.", "")}</span>
            )}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900">{exp.title || "Position"}</h3>
                  <span className="text-sm text-gray-600 italic">
                    {exp.startDate} - {exp.isCurrentRole ? "Present" : exp.endDate}
                  </span>
                </div>
                <p className="text-sm text-gray-700 italic">
                  {exp.company}{exp.location && `, ${exp.location}`}
                </p>
                {exp.bullets.length > 0 && exp.bullets.some(b => b.trim()) && (
                  <ul className="mt-2 space-y-1">
                    {exp.bullets.filter(b => b.trim()).map((bullet, i) => (
                      <li key={i} className="text-sm text-gray-700 flex">
                        <span className="mr-2">•</span>
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

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                  <p className="text-sm text-gray-700 italic">{edu.institution}{edu.location && `, ${edu.location}`}</p>
                  {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                </div>
                <span className="text-sm text-gray-600 italic">{edu.graduationDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            Skills
          </h2>
          {skills.technical.length > 0 && (
            <div className="mb-2">
              <span className="font-semibold text-sm text-gray-900">Technical: </span>
              <span className="text-sm text-gray-700">{skills.technical.join(", ")}</span>
            </div>
          )}
          {skills.soft.length > 0 && (
            <div className="mb-2">
              <span className="font-semibold text-sm text-gray-900">Soft Skills: </span>
              <span className="text-sm text-gray-700">{skills.soft.join(", ")}</span>
            </div>
          )}
          {skills.languages && skills.languages.length > 0 && (
            <div className="mb-2">
              <span className="font-semibold text-sm text-gray-900">Languages: </span>
              <span className="text-sm text-gray-700">{skills.languages.join(", ")}</span>
            </div>
          )}
          {skills.tools && skills.tools.length > 0 && (
            <div>
              <span className="font-semibold text-sm text-gray-900">Tools: </span>
              <span className="text-sm text-gray-700">{skills.tools.join(", ")}</span>
            </div>
          )}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900">{project.name}</h3>
                  {project.url && (
                    <span className="text-sm text-gray-600 italic">{project.url}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                {project.technologies.length > 0 && (
                  <p className="text-sm text-gray-600 italic mt-1">
                    Technologies: {project.technologies.join(", ")}
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
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            Certifications
          </h2>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-gray-900">{cert.name}</span>
                  <span className="text-sm text-gray-600"> - {cert.issuer}</span>
                </div>
                <span className="text-sm text-gray-600 italic">{cert.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProfessionalTemplate;
