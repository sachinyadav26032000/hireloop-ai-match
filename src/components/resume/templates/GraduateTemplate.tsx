/**
 * Graduate Template - Clean design for entry-level professionals
 * Best for: Fresh Graduates, Interns, Career Changers, Entry-level positions
 * Features: Education-focused, Projects highlighted, Skills prominent
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Github, Globe, GraduationCap, Code, Briefcase } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function GraduateTemplate({ data, scale = 1 }: Props) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-800"
      style={{
        width: `${210 * scale}mm`,
        minHeight: `${297 * scale}mm`,
        fontSize: `${10 * scale}pt`,
        lineHeight: 1.5,
      }}
    >
      {/* Header - Fresh, modern blue */}
      <div className="bg-gradient-to-r from-blue-500 to-violet-500 text-white p-6">
        <h1 className="text-2xl font-bold">{contact.fullName || "Your Name"}</h1>
        {headline && (
          <p className="text-blue-100 mt-1 text-sm">{headline}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-blue-100">
          {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>}
          {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>}
          {contact.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {contact.location}</span>}
          {contact.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {contact.linkedin}</span>}
          {contact.github && <span className="flex items-center gap-1"><Github className="w-3 h-3" /> {contact.github}</span>}
          {contact.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {contact.website}</span>}
        </div>
      </div>

      <div className="p-6">
        {/* Objective/Summary */}
        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Career Objective
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Education - Prominent for graduates */}
        {education.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-3 bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                  <span className="text-xs text-blue-600">{edu.graduationDate}</span>
                </div>
                <p className="text-xs text-gray-600">{edu.institution}{edu.location ? `, ${edu.location}` : ""}</p>
                {edu.gpa && <p className="text-xs text-gray-500 mt-1">GPA: {edu.gpa}</p>}
                {edu.honors && edu.honors.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">Honors: {edu.honors.join(", ")}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Skills - Very prominent for entry-level */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Skills
            </h2>
            {skills.technical.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 font-medium mb-1">Technical</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.technical.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Soft Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.soft.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Projects - Key for graduates without much experience */}
        {projects.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Code className="w-3 h-3" /> Projects
            </h2>
            {projects.map((project) => (
              <div key={project.id} className="mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">{project.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.technologies.map((tech, idx) => (
                      <span key={idx} className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.bullets && project.bullets.length > 0 && (
                  <ul className="mt-1.5 text-xs text-gray-600 space-y-0.5">
                    {project.bullets.filter(b => b).map((bullet, idx) => (
                      <li key={idx}>• {bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Experience - Internships, Part-time work */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-800">{exp.title}</h3>
                  <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-xs text-gray-600">{exp.company}</p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-1 text-xs text-gray-600 space-y-0.5">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx}>• {bullet}</li>
                    ))}
                  </ul>
                )}
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
                <span key={cert.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {cert.name} ({cert.issuer})
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
