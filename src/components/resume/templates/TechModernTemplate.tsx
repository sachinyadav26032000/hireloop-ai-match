/**
 * Tech Modern Template - Sleek design for tech professionals
 * Best for: Software Engineers, Data Scientists, DevOps, Product Managers
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function TechModernTemplate({ data, scale = 1 }: Props) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-slate-50 text-slate-800"
      style={{
        width: `${210 * scale}mm`,
        minHeight: `${297 * scale}mm`,
        fontSize: `${10 * scale}pt`,
        lineHeight: 1.5,
      }}
    >
      {/* Header - Gradient accent */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {contact.fullName || "Your Name"}
        </h1>
        {headline && (
          <p className="text-blue-100 mt-1 text-sm font-medium">{headline}</p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-blue-100">
          {contact.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" /> {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {contact.phone}
            </span>
          )}
          {contact.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {contact.location}
            </span>
          )}
          {contact.github && (
            <span className="flex items-center gap-1">
              <Github className="w-3 h-3" /> {contact.github}
            </span>
          )}
          {contact.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="w-3 h-3" /> {contact.linkedin}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Summary */}
        {summary && (
          <section className="mb-5">
            <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Skills - Featured prominently for tech roles */}
        {skills.technical.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Technical Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.technical.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
              Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4 border-l-2 border-blue-200 pl-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-slate-800">{exp.title}</h3>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{exp.company}</p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
              Projects
            </h2>
            {projects.map((project) => (
              <div key={project.id} className="mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">{project.name}</h3>
                <p className="text-xs text-slate-600">{project.description}</p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.technologies.map((tech, idx) => (
                      <span key={idx} className="text-xs text-blue-600">
                        {tech}{idx < project.technologies.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-slate-800 text-sm">{edu.degree}</h3>
                  <span className="text-xs text-slate-500">{edu.graduationDate}</span>
                </div>
                <p className="text-xs text-slate-600">{edu.institution}</p>
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Certifications
            </h2>
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <span key={cert.id} className="text-xs bg-slate-100 px-2 py-1 rounded">
                  {cert.name}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
