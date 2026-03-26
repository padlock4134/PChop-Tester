# Translation Keys Remaining Audit (Non-Culinary)

## Snapshot
- Disciplines in scope: automotive, construction, electrical, hvac, logistics, machining, manufacturing, plumbing
- Locale coverage today:
  - `en`: 5 level-title keys per discipline (`levels.<discipline>.titles.1..5`)
  - `es`: 5 level-title keys per discipline (`levels.<discipline>.titles.1..5`)
- Target implied by current level systems: 60 levels.

## What is still left

### 1) Complete locale coverage from levels 6–60
For each non-culinary discipline, both locales currently have 5/60 keys.

- Remaining per discipline per locale: 55
- Remaining total keys:
  - 8 disciplines × 55 levels × 2 locales = **880 keys**

### 2) Reduce fallback dependence
`getLocalizedLevelMeta(level)` currently falls back to `LEVEL_TITLES_AND_ICONS[titleIndex]`.
That fallback is still required for levels without i18n keys (currently 6+).

### 3) Optional deduplication pass
There is repeated helper logic in each NavBar/Profile pair. A shared helper can reduce drift:
- `getLocalizedLevelMeta(level, discipline, t, fallbackArray)`

## Current implementation status (safe)
- NavBar localization helper wired for all non-culinary disciplines.
- Profile localization helper wired for all non-culinary disciplines.
- Language-change refresh effect in profiles is in place.
- Existing hardcoded arrays remain as safety fallback.

## Suggested next execution order
1. Generate `levels.<discipline>.titles.6..60` keys for `en.json` and `es.json`.
2. Validate no missing level keys via a quick script/assertion.
3. (Optional) Refactor repeated helper logic into a shared utility.

## Risk notes
- Full key expansion will produce a large locale diff; script generation is recommended to avoid manual errors.
- Keep fallback path until full locale coverage is verified in both languages.
