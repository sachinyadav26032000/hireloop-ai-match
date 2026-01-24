/**
 * Manager Template - Leadership-focused design with team achievements
 * Best for: Team Leads, Department Managers, Project Managers, Supervisors
 * Features: Photo support, Leadership metrics, Team accomplishments
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Users, Target, CheckSquare, Award } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function ManagerTemplate({ data, scale = 1 }: Props) {
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
      {/* Header with photo */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6">
        <div className="flex items-center gap-5">
          {contact.photoUrl && (
            <img
              src={contact.photoUrl}
              alt={contact.fullName}
              className="w-20 h-20 object-cover rounded-lg border-2 border-white/30"
              style={{ width: `${20 * scale}mm`, height: `${20 * scale}mm` }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{contact.fullName || "Your Name"}</h1>
            {headline && (
              <p className="text-teal-100 mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" /> {headline}
              </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-teal-100">
              {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>}
              {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>}
              {contact.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {contact.location}</span>}
              {contact.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {contact.linkedin}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Leadership Summary */}
        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" /> Leadership Profile
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Core Competencies */}
        {skills.technical.length > 0 && (
          <section className="mb-5 bg-teal-50 p-4 rounded-lg">
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
              Management Competencies
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {skills.technical.map((skill, idx) => (
                <span key={idx} className="text-xs flex items-center gap-1 text-gray-700">
                  <CheckSquare className="w-3 h-3 text-teal-600" /> {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience */}
        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Users className="w-3 h-3" /> Leadership Experience
            </h2>
            {experience.map((exp) => (
              <div key={exp.id} className="mb-4 border-l-3 border-teal-300 pl-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-800">{exp.title}</h3>
                  <span className="text-xs text-teal-600 font-medium bg-teal-100 px-2 py-0.5 rounded">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-medium">{exp.company}{exp.location ? ` | ${exp.location}` : ""}</p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs text-gray-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">▸</span>
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
              <h2 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
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
              <h2 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1">
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
