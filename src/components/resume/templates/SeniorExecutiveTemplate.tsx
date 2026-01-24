/**
 * Senior Executive Template - Premium design for C-Suite and VP-level professionals
 * Best for: CEO, COO, CFO, VPs, Directors, General Managers
 * Features: Prominent photo, Executive summary, Board-ready presentation
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, Users, TrendingUp } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function SeniorExecutiveTemplate({ data, scale = 1 }: Props) {
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
      {/* Executive Header - Navy blue theme */}
      <div className="bg-slate-900 text-white p-8">
        <div className="flex items-start gap-6">
          {/* Executive Photo - Large and prominent */}
          {contact.photoUrl && (
            <img
              src={contact.photoUrl}
              alt={contact.fullName}
              className="w-28 h-28 object-cover rounded border-4 border-slate-700"
              style={{ width: `${28 * scale}mm`, height: `${28 * scale}mm` }}
            />
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {contact.fullName || "Your Name"}
            </h1>
            {headline && (
              <p className="text-slate-300 mt-2 text-lg font-light tracking-wide">
                {headline}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
              {contact.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {contact.phone}
                </span>
              )}
              {contact.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {contact.location}
                </span>
              )}
              {contact.linkedin && (
                <span className="flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5" /> {contact.linkedin}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Executive Summary */}
        {summary && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-600" />
              Executive Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed border-l-4 border-slate-300 pl-4">
              {summary}
            </p>
          </section>
        )}

        {/* Areas of Expertise */}
        {skills.technical.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
              Areas of Expertise
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {skills.technical.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs text-center py-2 bg-slate-100 rounded text-slate-700 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Leadership Experience */}
        {experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              Leadership Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-5 pb-5 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{exp.title}</h3>
                    <p className="text-sm text-slate-600 font-semibold">{exp.company}</p>
                    {exp.location && <p className="text-xs text-slate-500">{exp.location}</p>}
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.bullets.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-1.5">■</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education & Credentials - Side by side */}
        <div className="grid grid-cols-2 gap-8">
          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
                Education
              </h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-3">
                  <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                  <p className="text-sm text-gray-600">{edu.institution}</p>
                  <p className="text-xs text-gray-500">{edu.graduationDate}</p>
                </div>
              ))}
            </section>
          )}

          {/* Board & Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
                Certifications & Boards
              </h2>
              {certifications.map((cert) => (
                <div key={cert.id} className="mb-2">
                  <p className="font-medium text-gray-800 text-sm">{cert.name}</p>
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
