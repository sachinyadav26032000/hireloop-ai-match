import fs from 'fs';

// Read detected from resumes
const detected = JSON.parse(fs.readFileSync('backend/detected-from-resumes.json', 'utf8'));

// Read constants file and extract roles/skills
const constantsFile = fs.readFileSync('src/lib/constants.ts', 'utf8');

// Extract all roles from JOB_ROLES
const roleMatches = constantsFile.match(/JOB_ROLES = \{[\s\S]*?\n\};/);
const allRolesInConstants = new Set();
if (roleMatches) {
  const matches = roleMatches[0].matchAll(/"([^"]+)"/g);
  for (const m of matches) {
    allRolesInConstants.add(m[1].toLowerCase());
  }
}

// Extract all skills from SKILLS
const skillMatches = constantsFile.match(/SKILLS = \{[\s\S]*?\n\};/);
const allSkillsInConstants = new Set();
if (skillMatches) {
  const matches = skillMatches[0].matchAll(/"([^"]+)"/g);
  for (const m of matches) {
    allSkillsInConstants.add(m[1].toLowerCase());
  }
}

// Find missing roles
const missingRoles = detected.roles.filter(r => !allRolesInConstants.has(r.toLowerCase()));
const missingSkills = detected.skills.filter(s => !allSkillsInConstants.has(s.toLowerCase()));

console.log('=== ROLES IN CONSTANTS: ' + allRolesInConstants.size);
console.log('=== SKILLS IN CONSTANTS: ' + allSkillsInConstants.size);
console.log('');
console.log('=== MISSING ROLES (' + missingRoles.length + '/' + detected.roles.length + ') ===');
console.log(missingRoles.join(', ') || 'None - all roles are in constants!');
console.log('');
console.log('=== MISSING SKILLS (' + missingSkills.length + '/' + detected.skills.length + ') ===');
console.log(missingSkills.join(', ') || 'None - all skills are in constants!');
