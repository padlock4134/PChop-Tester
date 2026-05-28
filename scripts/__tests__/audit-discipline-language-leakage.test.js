const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { getDisciplines, walk, auditLanguageLeakage } = require('../audit-discipline-language-leakage');

function mkTmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'discipline-audit-'));
  fs.mkdirSync(path.join(dir, 'src', 'disciplines'), { recursive: true });
  return dir;
}

test('getDisciplines returns sorted discipline directories', () => {
  const repo = mkTmpRepo();
  const root = path.join(repo, 'src', 'disciplines');
  fs.mkdirSync(path.join(root, 'welding'));
  fs.mkdirSync(path.join(root, 'automotive'));
  fs.writeFileSync(path.join(root, 'README.md'), 'not a dir');

  assert.deepEqual(getDisciplines(root), ['automotive', 'welding']);
});

test('walk returns nested ts/tsx files only', () => {
  const repo = mkTmpRepo();
  const d = path.join(repo, 'src', 'disciplines', 'welding');
  fs.mkdirSync(path.join(d, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(d, 'a.ts'), 'const a = 1;');
  fs.writeFileSync(path.join(d, 'nested', 'b.tsx'), 'export const B = () => null;');
  fs.writeFileSync(path.join(d, 'notes.md'), '# ignore');

  const files = walk(d).map((f) => path.basename(f)).sort();
  assert.deepEqual(files, ['a.ts', 'b.tsx']);
});

test('auditLanguageLeakage counts pattern hits and sorts results', () => {
  const repo = mkTmpRepo();
  const disciplinesRoot = path.join(repo, 'src', 'disciplines');
  const automotive = path.join(disciplinesRoot, 'automotive');
  const welding = path.join(disciplinesRoot, 'welding');
  fs.mkdirSync(automotive, { recursive: true });
  fs.mkdirSync(welding, { recursive: true });

  fs.writeFileSync(path.join(automotive, 'one.tsx'), 'recipe recipe kitchen');
  fs.writeFileSync(path.join(welding, 'two.ts'), 'chef');

  const results = auditLanguageLeakage({ repoRoot: repo, patterns: [/recipe/gi, /kitchen/gi, /chef/gi] });

  assert.equal(results[0].discipline, 'automotive');
  assert.equal(results[0].totalHits, 3);
  assert.equal(results[1].discipline, 'welding');
  assert.equal(results[1].totalHits, 1);
});
