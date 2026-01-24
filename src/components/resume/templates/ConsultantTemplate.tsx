/**
 * Consultant Template - Prestigious design for consulting professionals
 * Best for: Management Consultants, Strategy Consultants, Business Advisors
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Briefcase, GraduationCap, Award } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function ConsultantTemplate({ data, scale = 1 }: Props) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-800 font-serif"
      style={{
        width: `${210 * scale}mm`,
        minHeight: `${297 * scale}mm`,
        fontSize: `${10 * scale}pt`,
        lineHeight: 1.5,
      }}
    >
      {/* Header - Classic consulting style */}
      <div className="border-b-4 border-gray-800 p-6 text-center">
        <h1 className="text-3xl font-bold tracking-wide text-gray-900">
          {contact.fullName || "Your Name"}
        </h1>
        {headline && (
          <p className="text-sm text-gray-600 mt-2 font-medium">{headline}</p>
        )}
        <div className="flex justify-center flex-wrap gap-4 mt-3 text-xs text-gray-600">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>|</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span>|</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span>|</span>}
          {contact.linkedin && <span>{contact.linkedin}</span>}
        </div>
      </div>

      <div className="p-6">
        {/* Executive Summary */}
        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> Executive Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed italic">{summary}</p>
          </section>
        )}

        {/* Consulting Experience */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
              Professional Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{exp.company}</h3>
                    <p className="text-sm text-gray-700 italic">{exp.title}</p>
                  </div>
                  <span className="text-xs text-gray-600">{exp.startDate} - {exp.endDate}</span>
                </div>
                {exp.location && <p className="text-xs text-gray-500">{exp.location}</p>}
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-700">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">—</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Key Projects */}
        {projects.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-3">
              Selected Engagements
            </h2>
            {projects.map((project) => (
              <div key={project.id} className="mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">{project.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{project.description}</p>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2 flex items-center gap-2">
              <GraduationCap className="w-3 h-3" /> Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                  <span className="text-xs text-gray-600">{edu.graduationDate}</span>
                </div>
                <p className="text-sm text-gray-700">{edu.degree}</p>
                {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </section>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Skills */}
          {skills.technical.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
                Expertise
              </h2>
              <ul className="text-xs text-gray-700 space-y-1">
                {skills.technical.map((skill, idx) => (
                  <li key={idx}>• {skill}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2 flex items-center gap-2">
                <Award className="w-3 h-3" /> Certifications
              </h2>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-1.5">
                  <p className="text-xs font-medium text-gray-800">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.issuer}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
