const fs = require('fs');
const path = require('path');

const DISCIPLINES = [
  'automotive',
  'construction',
  'electrical',
  'hvac',
  'logistics',
  'machining',
  'manufacturing',
  'plumbing',
];

const LOCALES = ['en', 'es'];
const LEVEL_MIN = 1;
const LEVEL_MAX = 60;

function readLocale(locale) {
  const filePath = path.join(__dirname, '..', 'src', 'locales', `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validate() {
  const errors = [];

  for (const locale of LOCALES) {
    const json = readLocale(locale);
    const levels = json.levels || {};

    for (const discipline of DISCIPLINES) {
      const titles = levels?.[discipline]?.titles || {};

      for (let level = LEVEL_MIN; level <= LEVEL_MAX; level += 1) {
        const key = String(level);
        if (!Object.prototype.hasOwnProperty.call(titles, key)) {
          errors.push(`${locale}: missing levels.${discipline}.titles.${key}`);
          continue;
        }

        const value = titles[key];
        if (typeof value !== 'string' || value.trim().length === 0) {
          errors.push(`${locale}: empty levels.${discipline}.titles.${key}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Level key validation failed (${errors.length} issues):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('✅ Level key validation passed for all disciplines/locales (1..60).');
}

validate();
