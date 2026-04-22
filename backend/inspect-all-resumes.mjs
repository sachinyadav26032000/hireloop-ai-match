/**
 * Deep inspection of every resume - shows actual parsed output for human review
 */
import { parseResumeFile } from './services/resumeParserService.js';
import fs from 'fs';
import path from 'path';

const testDir = 'D:/Hire Loop/hireloop-ai-match/test-resumes';
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.pdf'));

const results = [];

for (const file of files) {
  const filePath = path.join(testDir, file);
  const buffer = fs.readFileSync(filePath);
  const result = await parseResumeFile(buffer, 'application/pdf', file);
  const { text, extractedData, wordCount } = result;
  const { name, email, phone, linkedin, skills, suggestedRoles } = extractedData;

  // Get first 8 content lines (skip empty)
  const contentLines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 8);

  results.push({
    file,
    name: name || '---',
    email: email || '---',
    phone: phone || '---',
    wordCount,
    skillCount: skills.length,
    roleCount: suggestedRoles.length,
    skills,
    roles: suggestedRoles,
    firstLines: contentLines,
  });
}

// Now print detailed results for each resume
for (const r of results) {
  console.log(`\n${'='.repeat(90)}`);
  console.log(`FILE: ${r.file}`);
  console.log(`${'='.repeat(90)}`);
  console.log(`  Name:    ${r.name}`);
  console.log(`  Email:   ${r.email}`);
  console.log(`  Phone:   ${r.phone}`);
  console.log(`  Words:   ${r.wordCount}`);
  console.log(`  Skills (${r.skillCount}): ${r.skills.join(', ')}`);
  console.log(`  Roles  (${r.roleCount}): ${r.roles.join(', ')}`);
  console.log(`  --- First 8 lines of text ---`);
  r.firstLines.forEach((l, i) => {
    // Truncate long lines
    const display = l.length > 120 ? l.substring(0, 117) + '...' : l;
    console.log(`    ${i+1}. ${display}`);
  });
}

console.log(`\n${'='.repeat(90)}`);
console.log(`TOTAL: ${results.length} resumes inspected`);
console.log(`${'='.repeat(90)}`);

process.exit(0);
