const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src', 'disciplines');
const disciplines = ['automotive', 'construction', 'electrical', 'hvac', 'logistics', 'machining', 'manufacturing', 'plumbing'];
const patterns = [
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

const results = [];
for (const discipline of disciplines) {
  const base = path.join(root, discipline);
  const files = walk(base);

  let totalHits = 0;
  const fileHits = [];

  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    let hits = 0;
    for (const pattern of patterns) {
      const m = content.match(pattern);
      if (m) hits += m.length;
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
console.log(JSON.stringify(results, null, 2));
