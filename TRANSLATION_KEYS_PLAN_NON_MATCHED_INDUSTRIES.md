# Plan: Translation Keys for Non-Matched Industries

## Goal
Move discipline-specific leveling role names from hardcoded strings to i18n keys so non-culinary industries can use domain-correct titles in both English and Spanish.

## Current State Audit
`LEVEL_TITLES_AND_ICONS` is still hardcoded in both `utils/leveling.ts` and `components/Profile.tsx` per discipline, which makes translation and industry alignment hard to maintain.

### Files with hardcoded leveling titles
- `src/disciplines/automotive/utils/leveling.ts`
- `src/disciplines/construction/utils/leveling.ts`
- `src/disciplines/culinary/utils/leveling.ts`
- `src/disciplines/electrical/utils/leveling.ts`
- `src/disciplines/hvac/utils/leveling.ts`
- `src/disciplines/logistics/utils/leveling.ts`
- `src/disciplines/machining/utils/leveling.ts`
- `src/disciplines/manufacturing/utils/leveling.ts`
- `src/disciplines/plumbing/utils/leveling.ts`
- `src/disciplines/automotive/components/Profile.tsx`
- `src/disciplines/construction/components/Profile.tsx`
- `src/disciplines/culinary/components/Profile.tsx`
- `src/disciplines/electrical/components/Profile.tsx`
- `src/disciplines/hvac/components/Profile.tsx`
- `src/disciplines/logistics/components/Profile.tsx`
- `src/disciplines/machining/components/Profile.tsx`
- `src/disciplines/manufacturing/components/Profile.tsx`
- `src/disciplines/plumbing/components/Profile.tsx`

## Proposed Key Strategy

### 1) Shared key shape
Introduce level keys in locale files under:

- `levels.<discipline>.titles.<index>`
- `levels.<discipline>.icons.<index>` (optional if icons remain code-based)

Example:

```json
{
  "levels": {
    "hvac": {
      "titles": {
        "1": "Apprentice Tech",
        "2": "Apprentice Tech II"
      }
    }
  }
}
```

### 2) Discipline fallback chain
When rendering level titles:
1. Try `levels.<activeDiscipline>.titles.<level>`
2. Fallback to `levels.shared.titles.<level>`
3. Fallback to existing hardcoded `LEVEL_TITLES_AND_ICONS[level - 1].title`

This supports staged rollout without breaking UI.

### 3) Single source helper
Create one helper per discipline module boundary to return the effective level title:

- `getLocalizedLevelTitle(level, discipline, t)`

Then reuse in both:
- Navbar (`utils/leveling.ts` consumption)
- Profile (`components/Profile.tsx`)

## Phased Execution Plan

### Phase 1: Infrastructure (safe)
- Add translation key scaffolding to `src/locales/en.json` and `src/locales/es.json` for one pilot discipline (HVAC).
- Add fallback helper.
- Wire helper into HVAC navbar/profile level display only.

### Phase 2: Expand to all non-culinary industries
Apply same pattern for:
- automotive
- construction
- electrical
- logistics
- machining
- manufacturing
- plumbing

### Phase 3: Cleanup
- Remove duplicated hardcoded title arrays from profile files where possible.
- Keep icons in code unless localization requires icon-level customization.

## Acceptance Criteria
- No UI regressions when keys are missing (fallback works).
- Level title shown in nav and profile comes from i18n when keys exist.
- Non-culinary disciplines display domain-correct naming in both locales.
- Culinary remains unchanged unless explicitly remapped.

## Risks / Notes
- Locale key volume is large (60 levels x disciplines x locales). Consider generating keys programmatically.
- Existing title text differs slightly between files in some disciplines; normalize before migration.
- Introduce tests for fallback behavior to avoid blank titles in runtime.
