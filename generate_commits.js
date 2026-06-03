const fs = require('fs');
const { execSync } = require('child_process');

const START_DATE = new Date('2022-08-23T12:00:00Z');
const END_DATE = new Date('2026-06-03T12:00:00Z');
const COMMITS_PER_DAY = 70;
const AUTHOR_NAME = 'srj';
const AUTHOR_EMAIL = '111846916+SRJ-ai@users.noreply.github.com';

let fastImportData = '';
let commitCount = 0;
const branch = 'refs/heads/main';

console.log('Generating commits...');

const currentHead = execSync('git rev-parse HEAD').toString().trim().replace(/\r/g, '');
let parentCommit = currentHead;

for (let d = new Date(START_DATE); d <= END_DATE; d.setDate(d.getDate() + 1)) {
  for (let i = 0; i < COMMITS_PER_DAY; i++) {
    commitCount++;
    const timestamp = Math.floor(d.getTime() / 1000) + i;
    const dateStr = `${timestamp} +0000`;

    fastImportData += `commit ${branch}\n`;
    fastImportData += `mark :${commitCount}\n`;
    fastImportData += `author ${AUTHOR_NAME} <${AUTHOR_EMAIL}> ${dateStr}\n`;
    fastImportData += `committer ${AUTHOR_NAME} <${AUTHOR_EMAIL}> ${dateStr}\n`;
    const msg = `chore: daily update #${commitCount}\n`;
    fastImportData += `data ${Buffer.byteLength(msg)}\n`;
    fastImportData += msg;
    
    if (commitCount === 1 && parentCommit) {
        fastImportData += `from ${parentCommit}\n`;
    } else if (commitCount > 1) {
        fastImportData += `from :${commitCount - 1}\n`;
    }

    fastImportData += `M 100644 inline commit_marker.txt\n`;
    const fileData = `marker ${commitCount}\n\n`;
    fastImportData += `data ${Buffer.byteLength(fileData)}\n`;
    fastImportData += fileData;
  }
}

fs.writeFileSync('fast_import.txt', fastImportData);
console.log(`Generated ${commitCount} commits. Importing...`);

try {
  execSync('git fast-import < fast_import.txt', { stdio: 'inherit' });
  console.log('Done! Pushing to origin...');
  execSync('git push origin main --force', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (e) {
  console.error('Error during git fast-import or push:', e);
}

fs.unlinkSync('fast_import.txt');
