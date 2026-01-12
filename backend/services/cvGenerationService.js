/**
 * CV Generation Service
 * Generates ATS-optimized CVs based on user profile and target roles
 */
import { callAI, parseAIResponse } from "./aiAdapter.js";

const SYSTEM_PROMPT = `You are an expert CV writer specializing in ATS-optimized resumes.
Create a professional CV that:
1. Uses clear section headers (Summary, Experience, Skills, Education)
2. Includes relevant keywords for ATS scanning
3. Uses action verbs and quantifiable achievements
4. Is structured for easy parsing

Return ONLY valid JSON in this format:
{
  "fullName": "Name",
  "title": "Professional Title",
  "email": "email@example.com",
  "phone": "phone",
  "location": "City, Country",
  "linkedin": "linkedin url",
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Date Range",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "Year"
    }
  ],
  "certifications": ["Cert 1"],
  "atsScore": 85,
  "atsKeywords": ["keyword1", "keyword2"],
  "improvements": ["improvement1", "improvement2"]
}`;

function generateMockCV(input) {
  const { profileAnalysis, userInfo } = input;
  const name = userInfo?.fullName || "John Doe";
  const targetRole = profileAnalysis?.suggestedRoles?.[0] || "Professional";
  const skills = profileAnalysis?.coreSkills || ["Communication", "Problem Solving"];
  const level = profileAnalysis?.experienceLevel || "mid";

  const experienceTemplates = {
    entry: [
      {
        title: "Junior " + targetRole,
        company: "Growing Tech Company",
        duration: "2023 - Present",
        bullets: [
          "Collaborated with senior team members on key projects",
          "Learned and applied industry best practices",
          "Contributed to team goals and deliverables",
        ],
      },
    ],
    junior: [
      {
        title: targetRole,
        company: "Tech Startup",
        duration: "2022 - Present",
        bullets: [
          "Developed and maintained core product features",
          "Collaborated with cross-functional teams to deliver projects",
          "Improved process efficiency by 20% through automation",
        ],
      },
      {
        title: "Junior " + targetRole,
        company: "Digital Agency",
        duration: "2021 - 2022",
        bullets: [
          "Supported senior team members on client projects",
          "Built foundational skills in key technologies",
        ],
      },
    ],
    mid: [
      {
        title: "Senior " + targetRole,
        company: "Tech Company",
        duration: "2021 - Present",
        bullets: [
          "Led team of 4 developers on product initiatives",
          "Reduced system latency by 40% through optimization",
          "Mentored junior team members and conducted code reviews",
        ],
      },
      {
        title: targetRole,
        company: "Software Solutions Inc",
        duration: "2018 - 2021",
        bullets: [
          "Delivered 15+ projects on time and within budget",
          "Implemented CI/CD pipelines reducing deployment time by 60%",
        ],
      },
    ],
    senior: [
      {
        title: "Staff " + targetRole,
        company: "Enterprise Corp",
        duration: "2020 - Present",
        bullets: [
          "Architected scalable solutions serving 1M+ users",
          "Led technical strategy for $5M product initiative",
          "Managed team of 8 engineers across multiple time zones",
          "Reduced infrastructure costs by 35% through optimization",
        ],
      },
      {
        title: "Senior " + targetRole,
        company: "Tech Innovators",
        duration: "2016 - 2020",
        bullets: [
          "Drove adoption of modern development practices",
          "Promoted twice for exceptional performance",
        ],
      },
    ],
  };

  return {
    fullName: name,
    title: targetRole,
    email: userInfo?.email || "email@example.com",
    phone: userInfo?.phone || "+1 (555) 000-0000",
    location: userInfo?.location || "San Francisco, CA",
    linkedin: userInfo?.linkedin || "linkedin.com/in/profile",
    summary: `Results-driven ${targetRole} with ${profileAnalysis?.yearsOfExperience || 3}+ years of experience. Skilled in ${skills.slice(0, 3).join(", ")}. Passionate about delivering high-quality solutions and driving business impact.`,
    experience: experienceTemplates[level] || experienceTemplates.mid,
    skills: {
      technical: skills,
      soft: profileAnalysis?.softSkills || ["Leadership", "Communication", "Problem Solving"],
    },
    education: [
      {
        degree: "Bachelor's in Computer Science",
        institution: "University",
        year: "2018",
      },
    ],
    certifications: ["Relevant Certification"],
    atsScore: 82,
    atsKeywords: [...skills.slice(0, 5), targetRole, "results-driven", "team player"],
    improvements: [
      "Add more quantifiable achievements with specific metrics",
      "Include relevant industry keywords for target roles",
      "Tailor summary to specific job descriptions when applying",
    ],
  };
}

export async function generateCV(input) {
  const { profileAnalysis, userInfo, existingResume } = input;

  const userPrompt = `
Create an ATS-optimized CV for this person:

Name: ${userInfo?.fullName || "Not provided"}
Email: ${userInfo?.email || "Not provided"}
Target Role: ${profileAnalysis?.suggestedRoles?.[0] || "Not specified"}
Experience Level: ${profileAnalysis?.experienceLevel || "Not specified"}
Core Skills: ${profileAnalysis?.coreSkills?.join(", ") || "Not specified"}

Existing Resume Content (if any):
${existingResume || "No existing resume provided"}

Self Description:
${userInfo?.selfDescription || "Not provided"}

Generate a complete, professional CV as JSON.`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, { maxTokens: 3000 });
  const mockData = generateMockCV(input);

  return parseAIResponse(response, mockData);
}

/**
 * Convert CV data to downloadable HTML format
 */
export function cvToHTML(cvData) {
  const { fullName, title, email, phone, location, linkedin, summary, experience, skills, education, certifications } = cvData;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${fullName} - CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 4px; }
    h2 { font-size: 14px; color: #666; font-weight: normal; margin-bottom: 16px; }
    .contact { font-size: 13px; color: #555; margin-bottom: 24px; }
    .contact span { margin-right: 16px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 4px; margin-bottom: 12px; }
    .summary { font-size: 14px; color: #444; }
    .job { margin-bottom: 16px; }
    .job-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .job-title { font-weight: 600; font-size: 14px; }
    .job-company { color: #555; font-size: 13px; }
    .job-duration { color: #777; font-size: 13px; }
    .job-bullets { padding-left: 20px; font-size: 13px; }
    .job-bullets li { margin-bottom: 4px; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill { background: #f0f0f0; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
    .edu-item { margin-bottom: 8px; font-size: 13px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${fullName}</h1>
  <h2>${title}</h2>
  <div class="contact">
    <span>${email}</span>
    <span>${phone}</span>
    <span>${location}</span>
    ${linkedin ? `<span>${linkedin}</span>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p class="summary">${summary}</p>
  </div>

  <div class="section">
    <div class="section-title">Experience</div>
    ${experience
      .map(
        (job) => `
      <div class="job">
        <div class="job-header">
          <div>
            <div class="job-title">${job.title}</div>
            <div class="job-company">${job.company}</div>
          </div>
          <div class="job-duration">${job.duration}</div>
        </div>
        <ul class="job-bullets">
          ${job.bullets.map((b) => `<li>${b}</li>`).join("")}
        </ul>
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-list">
      ${[...(skills.technical || []), ...(skills.soft || [])].map((s) => `<span class="skill">${s}</span>`).join("")}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Education</div>
    ${education
      .map(
        (edu) => `
      <div class="edu-item">
        <strong>${edu.degree}</strong> - ${edu.institution}, ${edu.year}
      </div>
    `
      )
      .join("")}
  </div>

  ${
    certifications?.length
      ? `
  <div class="section">
    <div class="section-title">Certifications</div>
    <div class="skills-list">
      ${certifications.map((c) => `<span class="skill">${c}</span>`).join("")}
    </div>
  </div>
  `
      : ""
  }
</body>
</html>`;
}
