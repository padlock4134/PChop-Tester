const fs = require('fs');
const path = require('path');

const disciplinesDir = path.join(__dirname, '..', 'src', 'disciplines');
const profileFiles = fs.readdirSync(disciplinesDir)
  .map((discipline) => path.join(disciplinesDir, discipline, 'components', 'Profile.tsx'))
  .filter((filePath) => fs.existsSync(filePath));

const issues = [];

for (const filePath of profileFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  if (!source.includes('[i18n.language]')) {
    continue;
  }

  const profileHookMatch = source.match(/const Profile = \(\) => \{\s*const \{([^}]*)\} = useTranslation\(\);/s);

  if (!profileHookMatch) {
    issues.push(`${relativePath}: could not find Profile useTranslation() destructuring`);
    continue;
  }

  const vars = profileHookMatch[1]
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  if (!vars.includes('i18n')) {
    issues.push(`${relativePath}: Profile references [i18n.language] but does not destructure i18n from useTranslation()`);
  }
}

if (issues.length > 0) {
  console.error(`❌ Profile i18n guard check failed (${issues.length} issue(s)):`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('✅ Profile i18n guard check passed.');
