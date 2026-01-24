/**
 * Corporate Template - Traditional corporate format with photo support
 * Best for: Banking, Finance, Consulting, Large Enterprises
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Globe, Github } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function CorporateTemplate({ data, scale = 1 }: Props) {
  const { contact, headline, summary, experience, education, skills, certifications, projects } = data;

  return (
    <div
      className="bg-white text-gray-800 font-serif"
      style={{
        width: `${210 * scale}mm`,
        minHeight: `${297 * scale}mm`,
        padding: `${10 * scale}mm`,
        fontSize: `${10 * scale}pt`,
        lineHeight: 1.4,
      }}
    >
      {/* Header with optional photo */}
      <div className="flex items-start gap-6 border-b-2 border-gray-800 pb-4 mb-4">
        {/* Photo (optional - positioned on left) */}
        {contact.photoUrl && (
          <img
            src={contact.photoUrl}
            alt={contact.fullName}
            className="w-24 h-24 object-cover rounded-sm border border-gray-300"
            style={{ width: `${24 * scale}mm`, height: `${24 * scale}mm` }}
          />
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">
            {contact.fullName || "Your Name"}
          </h1>
          {headline && (
            <p className="text-sm text-gray-600 mt-1 font-medium tracking-wide">
              {headline}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
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
            {contact.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin className="w-3 h-3" /> {contact.linkedin}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
            Professional Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-gray-900">{exp.title}</h3>
                <span className="text-xs text-gray-500">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <p className="text-xs text-gray-600 italic">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
              {exp.bullets.length > 0 && (
                <ul className="mt-1 list-disc list-inside text-xs text-gray-700 space-y-0.5">
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
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
            Education
          </h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                <span className="text-xs text-gray-500">{edu.graduationDate}</span>
              </div>
              <p className="text-xs text-gray-600">{edu.institution}{edu.location ? `, ${edu.location}` : ""}</p>
              {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
            Skills
          </h2>
          {skills.technical.length > 0 && (
            <p className="text-xs text-gray-700 mb-1">
              <span className="font-semibold">Technical: </span>
              {skills.technical.join(", ")}
            </p>
          )}
          {skills.soft.length > 0 && (
            <p className="text-xs text-gray-700">
              <span className="font-semibold">Soft Skills: </span>
              {skills.soft.join(", ")}
            </p>
          )}
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-300 pb-1 mb-2">
            Certifications
          </h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="text-xs mb-1">
              <span className="font-medium">{cert.name}</span>
              <span className="text-gray-500"> - {cert.issuer}, {cert.date}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
