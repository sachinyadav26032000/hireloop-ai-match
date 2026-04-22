import { parseResumeFile } from './services/resumeParserService.js';
import fs from 'fs';
import path from 'path';

const testDir = 'D:/Hire Loop/hireloop-ai-match/test-resumes';
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.pdf'));

console.log(`Analyzing ${files.length} resumes...\n`);

const allSkills = new Set();
const allRoles = new Set();
const allNames = [];
const resumeTexts = [];

for (const file of files) {
  try {
    const filePath = path.join(testDir, file);
    const buffer = fs.readFileSync(filePath);
    const result = await parseResumeFile(buffer, 'application/pdf', file);

    const name = result.extractedData.name || 'Unknown';
    const skills = result.extractedData.skills || [];
    const roles = result.extractedData.suggestedRoles || [];

    allNames.push({ file, name, skills: skills.length, roles: roles.length });
    skills.forEach(s => allSkills.add(s));
    roles.forEach(r => allRoles.add(r));

    // Store text for additional analysis
    resumeTexts.push(result.text || '');
  } catch (e) {
    console.log(`Error parsing ${file}: ${e.message}`);
  }
}

console.log('\n=== RESUME SUMMARY ===');
allNames.forEach(n => console.log(`${n.name.padEnd(30)} | Skills: ${n.skills} | Roles: ${n.roles}`));

console.log('\n=== ALL DETECTED SKILLS ===');
console.log([...allSkills].sort().join(', '));

console.log('\n=== ALL SUGGESTED ROLES ===');
console.log([...allRoles].sort().join(', '));

// Analyze resume text for common keywords not captured
console.log('\n=== ANALYZING RESUME CONTENT FOR ADDITIONAL SKILLS ===');
const combinedText = resumeTexts.join(' ').toLowerCase();

// Check for common skill patterns
const potentialSkills = [
  // E-Commerce specific
  'gmv', 'arr', 'roas', 'cac', 'cltv', 'ltv', 'aov', 'd2c', 'b2b', 'b2c',
  'omnichannel', 'multi-channel', 'marketplace', 'category management',
  'demand planning', 'supply planning', 'inventory management', 'pricing strategy',
  // Marketing
  'google ads', 'meta ads', 'facebook ads', 'performance marketing', 'seo', 'sem',
  'affiliate marketing', 'influencer marketing', 'content marketing',
  // Analytics
  'power bi', 'tableau', 'google analytics', 'data visualization',
  // Management
  'p&l', 'profit and loss', 'revenue growth', 'team leadership', 'stakeholder management',
  // Tech
  'java', 'python', 'react', 'node.js', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
  'microservices', 'rest api', 'sql', 'mongodb', 'guidewire', 'policycenter', 'claimcenter',
  // HR/Legal
  'talent acquisition', 'recruitment', 'sourcing', 'onboarding',
  'compliance', 'corporate governance', 'contract management', 'due diligence',
  // Finance
  'financial analysis', 'budgeting', 'forecasting', 'investment', 'banking',
  'equity research', 'valuation', 'dcf', 'financial modeling',
  // Certifications
  'pmp', 'csm', 'safe', 'aws certified', 'google certified',
];

console.log('\nSkill presence in resumes:');
potentialSkills.forEach(skill => {
  const count = (combinedText.match(new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  if (count > 0) {
    console.log(`  ${skill}: ${count} mentions`);
  }
});

// Look for job titles in resume text
console.log('\n=== COMMON JOB TITLES IN RESUMES ===');
const titlePatterns = [
  'director', 'manager', 'head', 'lead', 'senior', 'executive', 'analyst',
  'consultant', 'engineer', 'developer', 'architect', 'specialist', 'officer',
  'category head', 'business head', 'growth manager', 'e-commerce', 'ecommerce'
];

titlePatterns.forEach(pattern => {
  const count = (combinedText.match(new RegExp(`\\b${pattern}\\b`, 'gi')) || []).length;
  if (count > 2) {
    console.log(`  ${pattern}: ${count} mentions`);
  }
});
