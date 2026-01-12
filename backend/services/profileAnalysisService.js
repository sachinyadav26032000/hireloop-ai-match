/**
 * Profile Analysis Service
 * Analyzes user input to infer job roles, skills, experience level, and gaps
 */
import { callAI, parseAIResponse } from "./aiAdapter.js";

const SYSTEM_PROMPT = `You are a career analysis expert. Analyze the user's background and provide structured career insights.
Return ONLY valid JSON in this exact format:
{
  "suggestedRoles": ["role1", "role2", "role3"],
  "experienceLevel": "entry|junior|mid|senior|lead",
  "yearsOfExperience": 0,
  "coreSkills": ["skill1", "skill2"],
  "softSkills": ["skill1", "skill2"],
  "industryFit": ["industry1", "industry2"],
  "weakAreas": ["area1", "area2"],
  "marketGaps": ["gap1", "gap2"],
  "summary": "Brief professional summary"
}`;

function generateMockAnalysis(input) {
  const { selfDescription, desiredRole, location } = input;
  const desc = (selfDescription || "").toLowerCase();

  // Simple keyword-based mock analysis
  let suggestedRoles = [];
  let coreSkills = [];
  let experienceLevel = "junior";
  let yearsOfExperience = 1;

  if (desc.includes("engineer") || desc.includes("developer") || desc.includes("coding") || desc.includes("programming")) {
    suggestedRoles = ["Software Engineer", "Full Stack Developer", "Backend Developer"];
    coreSkills = ["JavaScript", "Python", "Problem Solving", "Git"];
  } else if (desc.includes("design") || desc.includes("ui") || desc.includes("ux")) {
    suggestedRoles = ["UX Designer", "Product Designer", "UI Developer"];
    coreSkills = ["Figma", "User Research", "Prototyping", "Design Systems"];
  } else if (desc.includes("market") || desc.includes("sales") || desc.includes("business")) {
    suggestedRoles = ["Marketing Manager", "Business Development", "Sales Representative"];
    coreSkills = ["Communication", "Analytics", "Strategy", "CRM"];
  } else if (desc.includes("data") || desc.includes("analyst") || desc.includes("analytics")) {
    suggestedRoles = ["Data Analyst", "Business Analyst", "Data Scientist"];
    coreSkills = ["SQL", "Excel", "Python", "Data Visualization"];
  } else if (desc.includes("manage") || desc.includes("lead") || desc.includes("product")) {
    suggestedRoles = ["Product Manager", "Project Manager", "Team Lead"];
    coreSkills = ["Leadership", "Agile", "Stakeholder Management", "Strategy"];
  } else {
    suggestedRoles = desiredRole ? [desiredRole, "Related Role 1", "Related Role 2"] : ["Analyst", "Coordinator", "Specialist"];
    coreSkills = ["Communication", "Problem Solving", "Teamwork", "Adaptability"];
  }

  // Adjust for experience keywords
  if (desc.includes("senior") || desc.includes("lead") || desc.includes("manager") || desc.includes("10 years") || desc.includes("8 years")) {
    experienceLevel = "senior";
    yearsOfExperience = 8;
  } else if (desc.includes("mid") || desc.includes("5 years") || desc.includes("4 years") || desc.includes("experienced")) {
    experienceLevel = "mid";
    yearsOfExperience = 4;
  } else if (desc.includes("entry") || desc.includes("fresh") || desc.includes("graduate") || desc.includes("student")) {
    experienceLevel = "entry";
    yearsOfExperience = 0;
  }

  return {
    suggestedRoles,
    experienceLevel,
    yearsOfExperience,
    coreSkills,
    softSkills: ["Communication", "Teamwork", "Time Management", "Adaptability"],
    industryFit: ["Technology", "Startups", "Enterprise"],
    weakAreas: ["Could strengthen portfolio", "Consider additional certifications"],
    marketGaps: ["AI/ML skills in high demand", "Cloud certifications valuable"],
    summary: `Professional with ${experienceLevel}-level experience, well-suited for ${suggestedRoles[0]} roles. Strong foundation in ${coreSkills.slice(0, 2).join(" and ")}.`,
  };
}

export async function analyzeProfile(input) {
  const { selfDescription, resumeText, linkedinText, desiredRole, locations } = input;

  const userPrompt = `
Analyze this person's background:

Self-Description: ${selfDescription || "Not provided"}

Resume Content: ${resumeText || "Not provided"}

LinkedIn Content: ${linkedinText || "Not provided"}

Desired Role: ${desiredRole || "Open to suggestions"}

Preferred Locations: ${locations?.join(", ") || "Flexible"}

Provide career analysis as JSON.`;

  const response = await callAI(SYSTEM_PROMPT, userPrompt);
  const mockData = generateMockAnalysis(input);

  return parseAIResponse(response, mockData);
}
