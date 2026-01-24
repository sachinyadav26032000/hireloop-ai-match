/**
 * Finance Pro Template - Professional design for finance professionals
 * Best for: Financial Analysts, Accountants, CFOs, Auditors, Investment Professionals
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, DollarSign, TrendingUp, PieChart } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function FinanceProTemplate({ data, scale = 1 }: Props) {
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
      {/* Header - Professional navy */}
      <div className="bg-indigo-900 text-white p-6">
        <div className="flex items-center gap-5">
          {contact.photoUrl && (
            <img
              src={contact.photoUrl}
              alt={contact.fullName}
              className="w-20 h-20 object-cover rounded border-2 border-indigo-400"
              style={{ width: `${20 * scale}mm`, height: `${20 * scale}mm` }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{contact.fullName || "Your Name"}</h1>
            {headline && (
              <p className="text-indigo-300 mt-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> {headline}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-indigo-300">
              {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>}
              {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>}
              {contact.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {contact.location}</span>}
              {contact.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {contact.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Professional Summary */}
        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 border-b border-indigo-200 pb-1">
              Professional Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Technical Expertise */}
        {skills.technical.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 border-b border-indigo-200 pb-1 flex items-center gap-1">
              <PieChart className="w-3 h-3" /> Technical Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.technical.map((skill, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3 border-b border-indigo-200 pb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Professional Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-800">{exp.title}</h3>
                  <span className="text-xs text-indigo-600 font-medium">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">{exp.company}{exp.location ? ` | ${exp.location}` : ""}</p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
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
              <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 border-b border-indigo-200 pb-1">
                Education
              </h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{edu.degree}</h3>
                  <p className="text-xs text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.graduationDate}</p>
                  {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 border-b border-indigo-200 pb-1">
                Certifications
              </h2>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-1.5">
                  <p className="text-xs font-medium text-gray-800">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.issuer} | {cert.date}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
