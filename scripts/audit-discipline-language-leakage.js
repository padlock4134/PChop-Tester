const fs = require('fs');
const path = require('path');

const DEFAULT_PATTERNS = [
  /culinary/gi,
  /kitchen/gi,
  /recipe/gi,
  /chef/gi,
  /baking/gi,
  /pastry/gi,
  /grilling/gi,
  /cast iron/gi,
  /culinarySchool/gi,
  /recipeMatcher/gi,
];

function getDisciplines(rootDir) {
  if (!fs.existsSync(rootDir)) {
    throw new Error(`Disciplines root not found: ${rootDir}`);
  }

  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }

  return files;
}

function auditLanguageLeakage({ repoRoot = process.cwd(), patterns = DEFAULT_PATTERNS } = {}) {
  const disciplinesRoot = path.join(repoRoot, 'src', 'disciplines');
  const disciplines = getDisciplines(disciplinesRoot);
  const results = [];

  for (const discipline of disciplines) {
    const base = path.join(disciplinesRoot, discipline);
    const files = walk(base);
    let totalHits = 0;
    const fileHits = [];

    for (const file of files) {
      const rel = path.relative(repoRoot, file);
      const content = fs.readFileSync(file, 'utf8');
      let hits = 0;

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) hits += match.length;
      }

      if (hits > 0) {
        totalHits += hits;
        fileHits.push({ file: rel, hits });
      }
    }

    fileHits.sort((a, b) => b.hits - a.hits);
    results.push({ discipline, totalHits, filesWithHits: fileHits.length, topFiles: fileHits.slice(0, 10) });
  }

  results.sort((a, b) => b.totalHits - a.totalHits);
  return results;
}

if (require.main === module) {
  const results = auditLanguageLeakage();
  console.log(JSON.stringify(results, null, 2));
}

module.exports = {
  DEFAULT_PATTERNS,
  getDisciplines,
  walk,
  auditLanguageLeakage,
};
