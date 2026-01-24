/**
 * Creative Template - Bold, modern design for creative professionals
 * Best for: Designers, Marketers, Brand Managers, Content Creators
 */
import { ResumeData } from "@/contexts/ResumeContext";
import { Mail, Phone, MapPin, Linkedin, Globe, Palette, Sparkles } from "lucide-react";

interface Props {
  data: ResumeData;
  scale?: number;
}

export function CreativeTemplate({ data, scale = 1 }: Props) {
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
      {/* Header - Creative gradient */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white p-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {contact.fullName || "Your Name"}
        </h1>
        {headline && (
          <p className="text-pink-100 mt-2 text-lg font-light flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> {headline}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-pink-100">
          {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>}
          {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>}
          {contact.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {contact.location}</span>}
          {contact.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {contact.website}</span>}
          {contact.linkedin && <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {contact.linkedin}</span>}
        </div>
      </div>

      <div className="p-6">
        {/* About Me */}
        {summary && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" /> About Me
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Skills - Colorful tags */}
        {skills.technical.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-3">
              Skills & Tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.technical.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `hsl(${(idx * 37) % 360}, 70%, 90%)`,
                    color: `hsl(${(idx * 37) % 360}, 70%, 35%)`,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-4">
              Experience
            </h2>
            {experience.map((exp, index) => (
              <div key={exp.id} className="mb-4 relative pl-4 border-l-2 border-purple-200">
                <div className="absolute -left-1.5 top-0 w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-gray-800">{exp.title}</h3>
                  <span className="text-xs text-purple-600">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">{exp.company}</p>
                {exp.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {exp.bullets.filter(b => b.trim()).map((bullet, idx) => (
                      <li key={idx}>• {bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-3">
              Featured Projects
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {projects.map((project) => (
                <div key={project.id} className="bg-purple-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-800 text-sm">{project.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">
              Education
            </h2>
            {education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">{edu.degree}</h3>
                <p className="text-xs text-gray-600">{edu.institution} | {edu.graduationDate}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
