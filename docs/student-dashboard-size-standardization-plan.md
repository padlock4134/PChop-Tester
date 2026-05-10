# Student Progress Dashboard Size Standardization Plan

## What is happening right now

The `StudentProgressDashboard` component is duplicated per discipline, but most disciplines use the same wrapper class strategy while Culinary uses a one-off wrapper.

### Baseline used by most disciplines
Most dashboards (Automotive, Construction, Electrical, HVAC, Logistics, Manufacturing, Plumbing, Welding) use:

- `desktop-dashboard-frame`
- `student-dashboard-frame`

in the main card wrapper, e.g.:

```tsx
<div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full desktop-dashboard-frame student-dashboard-frame">
```

### Culinary divergence
Culinary uses:

- `max-w-[1400px] mx-auto desktop-frame-match`

instead of `desktop-dashboard-frame student-dashboard-frame`:

```tsx
<div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full max-w-[1400px] mx-auto desktop-frame-match">
```

This creates an intentional width/height behavior mismatch versus every other discipline.

## Why this causes visible inconsistency

There are two separate desktop sizing systems in `src/styles/index.css`:

1. `student-dashboard-frame` (current default for most dashboards)
   - width/max-width: `107%`
   - negative side margins (`-3.5%`)
   - height/max-height: `96.3vh` variant

2. `desktop-frame-match` (currently only Culinary dashboard)
   - width/max-width: `min(96.3vw, 1400px)`
   - centered with normal margins
   - height/max-height: `90vh` variant

So Culinary is not failing randomly—it is running a different sizing system by design.

## Plan to make all Student Progress Dashboards the same size

### Phase 1 — Choose single canonical sizing behavior
Pick one and apply everywhere:

- **Option A (recommended):** Keep `desktop-dashboard-frame + student-dashboard-frame` as canonical and remove Culinary special casing.
- **Option B:** Make `desktop-frame-match` canonical and migrate all student dashboards to it.

Recommendation: **Option A** is less risky (fewer file edits).

### Phase 2 — Eliminate one-off component class divergence
For `src/disciplines/culinary/components/StudentProgressDashboard.tsx`, replace the wrapper class list with the canonical one used by other disciplines.

### Phase 3 — Centralize class token to prevent drift
Introduce a shared constant (example in `src/disciplineConfig.tsx` or a new UI constants file), e.g.:

- `STUDENT_DASHBOARD_FRAME_CLASSES`

Then use that constant in every `StudentProgressDashboard.tsx` wrapper. This prevents future copy/paste drift.

### Phase 4 — Add automated consistency guard
Add a script (or Vitest assertion) that checks every `src/disciplines/*/components/StudentProgressDashboard.tsx` file for the same wrapper class token, failing CI if one discipline diverges.

### Phase 5 — Verify in browser at target breakpoints
Manual checks at least on:

- 1280×720
- 1440×900
- 1920×1080

Confirm:

- equal card width across disciplines
- equal visible height and scroll behavior
- no horizontal overflow introduced by sizing class

## Additional cleanup opportunity (optional but advised)

`src/styles/index.css` contains a block of `.admin-dashboard-frame ...` selectors that appear outside media-query scoping around lines ~209 onward. Consider scoping/organizing this file to avoid unintended global cascade side-effects while doing dashboard standardization.

## Quick execution order

1. Decide canonical class strategy (A/B).
2. Patch Culinary wrapper to canonical classes.
3. Add shared class constant.
4. Migrate all student dashboards to consume shared constant.
5. Add CI/test guard.
6. Run UI pass across all disciplines and screen sizes.
