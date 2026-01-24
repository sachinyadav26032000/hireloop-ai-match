/**
 * Sales Leader Template - Results-focused design with metrics emphasis
 * Best for: Sales Managers, Account Executives, Business Development, Revenue Leaders
 * Features: Photo support, Achievement metrics, Impact-focused layout
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, TrendingUp, Award, Target } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function SalesLeaderTemplate({ data, scale = 1 }: Props) {
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
      {/* Header with photo and strong branding */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-6">
        <div className="flex items-center gap-5">
          {/* Photo - prominent for sales/relationship roles */}
          {contact.photoUrl && (
            <img
              src={contact.photoUrl}
              alt={contact.fullName}
              className="w-20 h-20 object-cover rounded-full border-4 border-white/30"
              style={{ width: `${20 * scale}mm`, height: `${20 * scale}mm` }}
            />
          )}

          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {contact.fullName || "Your Name"}
            </h1>
            {headline && (
              <p className="text-amber-100 mt-1 text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                {headline}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-amber-100">
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
      </div>

      <div className="p-6">
        {/* Summary - Value proposition */}
        {summary && (
          <section className="mb-5 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
            <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Value Proposition
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Core Competencies */}
        {skills.technical.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
              Core Competencies
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {skills.technical.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs text-center py-1.5 bg-gray-100 rounded font-medium text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience - Achievement focused */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Award className="w-3 h-3" /> Professional Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{exp.title}</h3>
                    <p className="text-xs text-gray-600 font-medium">{exp.company}{exp.location ? ` | ${exp.location}` : ""}</p>
                  </div>
                  <span className="text-xs text-white bg-amber-500 px-2 py-0.5 rounded-full">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs text-gray-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold mt-0.5">►</span>
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
          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                Education
              </h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm">{edu.degree}</h3>
                  <p className="text-xs text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.graduationDate}</p>
                </div>
              ))}
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                Certifications
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
