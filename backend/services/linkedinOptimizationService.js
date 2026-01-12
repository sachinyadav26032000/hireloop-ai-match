/**
 * LinkedIn Optimization Service
 * Provides before/after improvements for LinkedIn profiles
 */
import { callAI, parseAIResponse } from "./aiAdapter.js";

const SYSTEM_PROMPT = `You are a LinkedIn optimization expert focused on recruiter visibility.
Analyze and improve LinkedIn profile sections.

Return ONLY valid JSON in this format:
{
  "headline": {
    "before": "original or empty",
    "after": "optimized headline",
    "tips": ["tip1", "tip2"]
  },
  "about": {
    "before": "original or empty",
    "after": "optimized about section",
    "tips": ["tip1", "tip2"]
  },
  "experienceBullets": [
    {
      "role": "Job Title",
      "before": ["original bullet"],
      "after": ["improved bullet with metrics"]
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "overallScore": 85,
  "topRecommendations": ["recommendation1", "recommendation2"]
}`;

function generateMockLinkedInOptimization(input) {
  const { profileAnalysis, currentLinkedin, userInfo } = input;
  const targetRole = profileAnalysis?.suggestedRoles?.[0] || "Professional";
  const skills = profileAnalysis?.coreSkills || ["Problem Solving", "Communication"];
  const level = profileAnalysis?.experienceLevel || "mid";
  const name = userInfo?.fullName?.split(" ")[0] || "Professional";

  const levelTitles = {
    entry: `${targetRole} | ${skills[0]} | Open to Opportunities`,
    junior: `${targetRole} | ${skills.slice(0, 2).join(" & ")} | Building Great Products`,
    mid: `Senior ${targetRole} | ${skills.slice(0, 2).join(" & ")} | Driving Results`,
    senior: `Staff ${targetRole} | ${skills[0]} Expert | Tech Leader | Speaker`,
  };

  const levelAbout = {
    entry: `Passionate ${targetRole} eager to make an impact in the tech industry.

I specialize in ${skills.slice(0, 3).join(", ")}, with a focus on delivering quality work and continuous learning.

What drives me:
- Building solutions that solve real problems
- Collaborating with talented teams
- Growing my skills every day

Currently seeking opportunities where I can contribute and learn. Let's connect!`,

    junior: `${targetRole} with ${profileAnalysis?.yearsOfExperience || 2}+ years of experience building products users love.

I specialize in ${skills.slice(0, 3).join(", ")}, with a track record of delivering projects on time and exceeding expectations.

Highlights:
- Delivered 10+ successful projects
- Improved team productivity by 25%
- Mentored 2 junior team members

Open to connecting with fellow professionals and exploring new opportunities.`,

    mid: `Results-driven ${targetRole} with ${profileAnalysis?.yearsOfExperience || 5}+ years of experience leading technical initiatives and mentoring teams.

I've helped companies scale their products and teams, with expertise in ${skills.slice(0, 3).join(", ")}.

Key achievements:
- Led team of 5 engineers on $2M product launch
- Reduced system latency by 40%
- Promoted twice for exceptional performance

I'm passionate about building great products and developing talent. Always happy to connect!`,

    senior: `Tech leader with ${profileAnalysis?.yearsOfExperience || 10}+ years of experience architecting solutions at scale.

As a ${targetRole}, I've led teams across multiple time zones, driven technical strategy for multi-million dollar initiatives, and built systems serving millions of users.

Impact:
- Architected platform processing 10M+ requests/day
- Led technical transformation saving $500K annually
- Grew and mentored teams from 3 to 15 engineers
- Speaker at industry conferences

Let's connect if you're working on interesting problems in ${profileAnalysis?.industryFit?.[0] || "tech"}.`,
  };

  return {
    headline: {
      before: currentLinkedin?.headline || `${targetRole}`,
      after: levelTitles[level] || levelTitles.mid,
      tips: [
        "Include your specialty and key skills",
        "Add a value proposition or unique angle",
        "Use industry keywords recruiters search for",
      ],
    },
    about: {
      before: currentLinkedin?.about || "I am a professional looking for opportunities.",
      after: levelAbout[level] || levelAbout.mid,
      tips: [
        "Start with a strong hook statement",
        "Include quantifiable achievements",
        "End with a call to action",
        "Use line breaks for readability",
      ],
    },
    experienceBullets: [
      {
        role: targetRole,
        before: ["Worked on various projects", "Responsible for development tasks"],
        after: [
          "Led development of core features resulting in 30% user engagement increase",
          "Optimized performance reducing load time by 50%, improving user retention",
        ],
      },
    ],
    keywords: [...skills.slice(0, 5), targetRole, "leadership", "results-driven", "team player"],
    overallScore: level === "senior" ? 90 : level === "mid" ? 82 : 75,
    topRecommendations: [
      "Add a professional headshot (profiles with photos get 21x more views)",
      "Include relevant skills and get endorsements",
      "Request recommendations from colleagues",
      "Engage with content in your industry",
      "Customize your LinkedIn URL",
    ],
  };
}

export async function optimizeLinkedIn(input) {
  const { profileAnalysis, currentLinkedin, userInfo } = input;

  const userPrompt = `
Optimize this LinkedIn profile:

Name: ${userInfo?.fullName || "Not provided"}
Target Role: ${profileAnalysis?.suggestedRoles?.[0] || "Not specified"}
Experience Level: ${profileAnalysis?.experienceLevel || "Not specified"}
Core Skills: ${profileAnalysis?.coreSkills?.join(", ") || "Not specified"}

Current LinkedIn Headline: ${currentLinkedin?.headline || "Not provided"}

Current LinkedIn About: ${currentLinkedin?.about || "Not provided"}

Current Experience: ${currentLinkedin?.experience || "Not provided"}

Provide optimized content as JSON.`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt, { maxTokens: 2500 });
  const mockData = generateMockLinkedInOptimization(input);

  return parseAIResponse(response, mockData);
}
