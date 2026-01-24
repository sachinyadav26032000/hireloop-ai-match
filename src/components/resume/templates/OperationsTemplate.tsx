/**
 * Operations Template - Process and efficiency focused design
 * Best for: Operations Managers, Supply Chain, Procurement, Plant Managers
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Settings, BarChart3, CheckCircle } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function OperationsTemplate({ data, scale = 1 }: Props) {
  const { contact, headline, summary, experience, education, skills, certifications } = data;

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
      {/* Header - Industrial green theme */}
      <div className="bg-emerald-700 text-white p-6">
        <div className="flex items-center gap-5">
          {contact.photoUrl && (
            <img
              src={contact.photoUrl}
              alt={contact.fullName}
              className="w-20 h-20 object-cover rounded-lg border-2 border-emerald-500"
              style={{ width: `${20 * scale}mm`, height: `${20 * scale}mm` }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{contact.fullName || "Your Name"}</h1>
            {headline && (
              <p className="text-emerald-200 mt-1 flex items-center gap-2">
                <Settings className="w-4 h-4" /> {headline}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-emerald-200">
              {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>}
              {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>}
              {contact.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {contact.location}</span>}
              {contact.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {contact.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Professional Profile */}
        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Professional Profile
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Core Competencies - Grid layout */}
        {skills.technical.length > 0 && (
          <section className="mb-5 bg-emerald-50 p-4 rounded-lg">
            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
              Core Competencies
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {skills.technical.map((skill, idx) => (
                <span key={idx} className="text-xs flex items-center gap-1 text-gray-700">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
              Professional Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4 border-l-2 border-emerald-300 pl-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-800">{exp.title}</h3>
                  <span className="text-xs text-emerald-700 font-medium">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-xs text-gray-600">{exp.company}{exp.location ? ` | ${exp.location}` : ""}</p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">▸</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        <div className="grid grid-cols-2 gap-6">
          {education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Education</h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{edu.degree}</h3>
                  <p className="text-xs text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.graduationDate}</p>
                </div>
              ))}
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Certifications</h2>
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
