# PorkChop Discipline Isolation Rules — CODEX PROMPT

## CRITICAL CONTEXT

PorkChop is a multi-discipline education platform. Each discipline lives in its own folder under `src/disciplines/<slug>/`. Disciplines are **fully self-contained** — they have their own `api/`, `components/`, `modules/`, `services/`, `types/`, `utils/`, `hooks/`, `data/`, and `images/` subfolders.

The ONLY shared code lives in the root `src/components/` and `src/utils/` folders (e.g., `DisciplineSupabaseProvider.tsx`, `DisciplineContext`). Those are fine to import.

---

## ABSOLUTE RULES — DO NOT VIOLATE

### 1. NEVER import across disciplines
```
❌ WRONG:  import { anything } from '../../culinary/api/supabaseClient';
❌ WRONG:  import { anything } from '../../electrical/services/xpService';
❌ WRONG:  await import('../../culinary/services/xpService')

✅ RIGHT:  import { anything } from '../api/supabaseClient';
✅ RIGHT:  import { anything } from '../services/xpService';
✅ RIGHT:  await import('../services/xpService')
```

**Every import inside `src/disciplines/<slug>/` must be either:**
- A relative path within the SAME discipline (`../api/`, `../components/`, `./`, etc.)
- A shared root import (`../../../components/`, `../../../utils/`)
- A node_module (`react`, `react-router-dom`, etc.)

**NEVER use `../../culinary/`, `../../electrical/`, `../../<other-discipline>/` in any import path.**

### 2. NEVER copy culinary terminology into other disciplines
When creating or modifying a non-culinary discipline, replace ALL culinary terms:

| Culinary Term | Replace With (use discipline-appropriate term) |
|---|---|
| recipe | route / project / circuit / procedure |
| ingredient | item / component / material / part |
| kitchen | dock / workshop / bench / lab |
| cookbook | runbook / portfolio / logbook |
| chef | dispatcher / technician / operator |
| cooking | operations / procedures / assembly |
| cuisine | category / specialty / sector |
| dish | task / assignment / build |
| new_to_cooking | new_to_<discipline> |
| home_cook | apprentice_<discipline-role> |
| kitchen_confident | <discipline>_confident |
| MyCookBook | MyRunbook / MyPortfolio / MyLogbook |
| MyKitchen | MyDock / MyWorkshop / MyBench |
| CulinarySchool | LogisticsSchool / ElectricalSchool |
| Chef's Corner | Dispatch Lounge / Wire Lounge |
| Global Test Kitchen | Global Test Dock / Global Test Bench |
| chefFreddie | dockFreddie / benchFreddie |
| FreddieContext | DockFreddieContext / BenchFreddieContext |
| getRecipeImage | getRouteImage / getProjectImage |
| getWeeklyChallengeRecipe | getWeeklyChallengeRoute |
| calculateRecipeNutrition | calculateRouteNutrition |
| fetchRecipesWithImages | fetchRoutesWithImages |

### 3. NEVER copy culinary mock data
Each discipline must have its own domain-appropriate:
- Weekly techniques list
- Lesson/syllabus content
- Challenge definitions
- AR practice scenes
- Quote/inspiration data
- Equipment/setup options
- Experience level names

### 4. ALWAYS use the discipline's own Supabase client
Each discipline has `api/supabaseClient.ts`. Use it. Do NOT import Supabase from another discipline.

### 5. ALWAYS use the discipline's own context providers
Each discipline has its own:
- `SupabaseProvider.tsx` — use `useSupabase` from THIS discipline
- `DockFreddieContext.tsx` (or equivalent) — use `useFreddieContext` from THIS discipline
- `RouteContext.tsx` (or equivalent) — use from THIS discipline
- `NavBar.tsx` — use `useLevelProgressContext` from THIS discipline

### 6. Database column names stay as-is
The Supabase tables use generic column names (`recipes`, `ingredients`, `user_cookbook`, `user_kitchen`). These are SHARED database tables. Do NOT rename database columns or table names — only rename the TypeScript variables, interfaces, and UI text.

### 7. Translation keys must be discipline-specific
```
❌ WRONG:  t('culinarySchool.charcuterieBoard.title')
✅ RIGHT:  t('logisticsSchool.dockPractice.title')
```

---

## EXISTING DISCIPLINES

| Slug | Folder | AI Assistant | Main Modules |
|---|---|---|---|
| culinary | `src/disciplines/culinary/` | Chef Freddie | MyKitchen, MyCookBook, CulinarySchool, Chef's Corner |
| logistics | `src/disciplines/logistics/` | Dock Freddie (Lou the Dispatcher) | MyDock, MyRunbook, LogisticsSchool, Dispatch Lounge |
| electrical | `src/disciplines/electrical/` | Bench Freddie | MyPanel, MyLogbook, ElecSchool, Wire Lounge |

---

## HOW TO ADD A NEW DISCIPLINE

1. Copy the culinary folder structure (NOT the content)
2. Create all subfolders: `api/`, `components/`, `modules/`, `services/`, `types/`, `utils/`, `hooks/`, `data/`, `images/`
3. Copy each file from culinary as a TEMPLATE
4. For EVERY file:
   - Replace ALL imports to use local paths (never `../../culinary/`)
   - Replace ALL culinary terminology with discipline-appropriate terms
   - Replace ALL mock data with discipline-appropriate content
   - Replace ALL translation key prefixes
   - Update experience levels in `types/userPreferences.ts`
   - Update equipment/setup options in `api/recipeMatcher.ts`
   - Update AR scenes in `data/defaultARScenes.ts`
   - Update challenges in `components/ChallengeOfTheWeek.tsx`
5. Register the new discipline in `src/DisciplineContext.tsx`
6. Add routes in `src/App.tsx`

---

## VERIFICATION CHECKLIST

After making changes to ANY discipline, run these checks:

```bash
# Check for cross-discipline imports (should return ZERO results)
grep -r "from '../../culinary/" src/disciplines/logistics/
grep -r "from '../../electrical/" src/disciplines/logistics/
grep -r "from '../../logistics/" src/disciplines/culinary/
grep -r "import('../../culinary/" src/disciplines/logistics/

# Check for culinary terms in non-culinary disciplines
grep -r "new_to_cooking" src/disciplines/logistics/
grep -r "home_cook" src/disciplines/logistics/
grep -r "culinarySchool\." src/disciplines/logistics/
grep -r "charcuterieBoard" src/disciplines/logistics/
```

ALL of these must return zero results.

---

## WHAT HAPPENED LAST TIME (DO NOT REPEAT)

Codex copied culinary files into the logistics discipline but left:
- ~20 static imports pointing to `../../culinary/`
- 3 dynamic imports pointing to `../../culinary/`
- Experience level types still using `new_to_cooking` and `home_cook`
- `cookbookSupabase.ts` selecting wrong database column (`.select('recipes')` instead of `.select('routes')`)
- `DockPracticeModal` with culinary lesson content (Knife Skills, Egg Cookery, etc.)
- AR scenes about knife sharpening instead of dock operations
- Mock data with food descriptions instead of logistics content
- Translation keys using `culinarySchool.charcuterieBoard.*`

This broke ALL logistics APIs and made the discipline non-functional. DO NOT repeat this.
