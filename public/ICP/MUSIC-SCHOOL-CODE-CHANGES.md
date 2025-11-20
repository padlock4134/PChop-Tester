# Complete Code Changes for Music School Adaptation

## Executive Summary
**90% of the codebase requires ZERO logic changes.** Only text strings, categories, and AI prompts need updates.

You were right - I should have gone through the actual code line-by-line from the start.

---

## 1. MyKitchen.tsx → MyPracticeRoom.tsx

### Lines 16-27: CATEGORIES Array
**CURRENT (Cooking):**
```typescript
const CATEGORIES = [
  "Vegetable", "Fruit", "Protein", "Dairy", "Grain",
  "Spice", "Canned/Preserved", "Condiment/Sauce", "Frozen", "Other"
];
```

**MUSIC VERSION:**
```typescript
const CATEGORIES = [
  "Scales", "Chords", "Rhythms", "Techniques", "Articulations",
  "Theory", "Sight Reading", "Repertoire", "Ear Training", "Performance"
];
```

### Lines 30-45: categorizeIngredient() Function
**RENAME TO:** `categorizeMusicalElement()`
**LOGIC:** Same regex matching, different patterns

```typescript
// CURRENT
function categorizeIngredient(name: string): string {
  const n = name.toLowerCase();
  if (/(lettuce|spinach|carrot)/.test(n)) return "Vegetable";
  if (/(apple|banana|orange)/.test(n)) return "Fruit";
  // ...
}

// MUSIC VERSION
function categorizeMusicalElement(name: string): string {
  const n = name.toLowerCase();
  if (/(major|minor|chromatic|pentatonic)/.test(n)) return "Scales";
  if (/(triad|seventh|diminished|augmented)/.test(n)) return "Chords";
  if (/(quarter|eighth|sixteenth|triplet)/.test(n)) return "Rhythms";
  if (/(staccato|legato|vibrato|tremolo)/.test(n)) return "Techniques";
  if (/(slur|accent|marcato|tenuto)/.test(n)) return "Articulations";
  if (/(interval|cadence|modulation)/.test(n)) return "Theory";
  if (/(clef|key signature|time signature)/.test(n)) return "Sight Reading";
  if (/(sonata|concerto|etude|prelude)/.test(n)) return "Repertoire";
  if (/(pitch|chord recognition|dictation)/.test(n)) return "Ear Training";
  if (/(memory|stage presence|interpretation)/.test(n)) return "Performance";
  return "Other";
}
```

### Lines 53-64: CATEGORY_ICONS
```typescript
// CURRENT
const CATEGORY_ICONS = {
  Vegetable: '🥦', Fruit: '🍎', Protein: '🍗', Dairy: '🧀',
  Grain: '🌾', Spice: '🌶️', 'Canned/Preserved': '🥫',
  'Condiment/Sauce': '🥄', Frozen: '🧊', Other: '🍽️'
};

// MUSIC VERSION
const CATEGORY_ICONS = {
  Scales: '🎼', Chords: '🎹', Rhythms: '🥁', Techniques: '🎸',
  Articulations: '🎺', Theory: '📚', 'Sight Reading': '👀',
  Repertoire: '🎵', 'Ear Training': '👂', Performance: '🎭'
};
```

### Lines 66-78: State Variables
**RENAME:**
```typescript
// CURRENT
const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
const [ingredients, setIngredients] = useState<Ingredient[]>([]);

// MUSIC VERSION
const [detectedElements, setDetectedElements] = useState<string[]>([]);
const [musicalElements, setMusicalElements] = useState<MusicalElement[]>([]);
```

### Lines 172-177: Module Header
```typescript
// CURRENT
<span className="text-5xl mr-2">🐟</span>
<h1>My Kitchen</h1>

// MUSIC VERSION
<span className="text-5xl mr-2">🎵</span>
<h1>My Practice Room</h1>
```

### Lines 276: Button Text
```typescript
// CURRENT
<button>Scan Kitchen</button>
<button>Recipe Matcher</button>

// MUSIC VERSION
<button>Scan Sheet Music</button>
<button>Composition Matcher</button>
```

**LOGIC UNCHANGED:** Same scanning, same matching algorithm, same UI flow.

---

## 2. recipeMatcher.ts → compositionMatcher.ts

### Lines 9-23: Equipment Constants
```typescript
// CURRENT
const KITCHEN_EQUIPMENT = {
  'Dorm Life': ['microwave', 'kettle', 'toaster'],
  'Minimalist': ['pot', 'pan', 'knife'],
  'Home Chef': ['blender', 'food processor', 'mixer'],
  'Full Chef\'s Kitchen': ['all equipment']
};

const TALENT_TREE_EQUIPMENT = {
  'Cast Iron Champion': ['cast iron', 'dutch oven'],
  'Grilling Heavy Weight': ['grill', 'smoker'],
  'Baking Warlock': ['stand mixer', 'baking sheet']
};

// MUSIC VERSION
const INSTRUMENT_SETUP = {
  'Beginner': ['basic instrument', 'tuner', 'metronome'],
  'Intermediate': ['quality instrument', 'music stand', 'recording device'],
  'Advanced': ['professional instrument', 'effects pedals', 'amp'],
  'Full Studio': ['all equipment']
};

const FOCUS_AREA_TOOLS = {
  'Classical Virtuoso': ['acoustic piano', 'violin', 'cello'],
  'Jazz Cat': ['saxophone', 'upright bass', 'drum kit'],
  'Contemporary Creator': ['DAW', 'MIDI controller', 'synthesizer']
};
```

### Lines 31-61: AI Prompts (CRITICAL CHANGE)
```typescript
// CURRENT
const RECIPE_PROMPTS = {
  new_to_cooking: (numRecipes, ingredients) => 
    `Create ${numRecipes} super simple recipes using: ${ingredients.join(", ")}.
    RULES:
    1. Use only 2-3 ingredients per recipe
    2. Only basic cooking methods (pan fry, boil, mix)
    3. Very detailed step-by-step instructions
    4. Keep cook time under 20 minutes`,
  
  home_cook: (numRecipes, ingredients) => 
    `Create ${numRecipes} recipes for someone comfortable with basic cooking`,
  
  kitchen_confident: (numRecipes, ingredients) => 
    `Create ${numRecipes} interesting recipes for an experienced cook`
};

// MUSIC VERSION
const COMPOSITION_PROMPTS = {
  beginner: (numCompositions, elements) => 
    `Create ${numCompositions} simple composition exercises using: ${elements.join(", ")}. 
    RULES:
    1. Use only 2-3 musical elements per exercise
    2. Keep pieces under 16 bars
    3. Focus on one technique at a time
    4. Provide clear practice instructions
    5. Return JSON with: title, elements, instructions, difficulty`,
  
  intermediate: (numCompositions, elements) => 
    `Create ${numCompositions} composition exercises for intermediate musician using: ${elements.join(", ")}.
    RULES:
    1. Use 3-4 musical elements per exercise
    2. Pieces can be 16-32 bars
    3. Introduce one new concept per piece
    4. Include performance notes`,
  
  advanced: (numCompositions, elements) => 
    `Create ${numCompositions} challenging compositions for advanced musician using: ${elements.join(", ")}.
    RULES:
    1. Use 4+ musical elements
    2. Can include advanced techniques
    3. Focus on musicality and expression
    4. Professional-level expectations`
};
```

### Lines 86-99: fuzzyMatch() Function
**NO CHANGE.** Same logic works for matching "C Major scale" to "C Major" or "violin" to "violin bow"

### Lines 102-148: scoreRecipe() Function
**RENAME TO:** `scoreComposition()`
**LOGIC:** UNCHANGED
```typescript
// CURRENT
function scoreRecipe(recipe, cupboard, kitchenSetup, talentTree) {
  let score = 0;
  const matchingIngredients = recipe.ingredients.filter(recipeIng => 
    cupboard.some(cupboardIng => fuzzyMatch(recipeIng, cupboardIng))
  ).length;
  score += matchingIngredients * 2;
  // ... equipment penalties, talent bonuses
  return score;
}

// MUSIC VERSION (same logic, different names)
function scoreComposition(composition, toolkit, instrumentSetup, focusArea) {
  let score = 0;
  const matchingElements = composition.elements.filter(compElement => 
    toolkit.some(toolkitElement => fuzzyMatch(compElement, toolkitElement))
  ).length;
  score += matchingElements * 2;
  // ... equipment penalties, focus area bonuses
  return score;
}
```

### Lines 288-457: fetchRecipesWithImages()
**RENAME TO:** `fetchCompositionsWithImages()`
**CHANGE:** Only prompt text and variable names
```typescript
// CURRENT
const prompt = `${basePrompt}
Dietary preferences: ${dietaryPrefs.join(', ')}
Cuisine preferences: ${cuisinePrefs.join(', ')}
Kitchen setup: ${kitchenSetup}
Return recipes as JSON array`;

// MUSIC VERSION
const prompt = `${basePrompt}
Genre preferences: ${genrePrefs.join(', ')}
Style preferences: ${stylePrefs.join(', ')}
Instrument setup: ${instrumentSetup}
Return compositions as JSON array`;
```

**API CALLS:** UNCHANGED. Same Anthropic, same Unsplash, same scoring.

---

## 3. GlobalTestKitchen.tsx → VirtualRecitalHall.tsx

### Lines 8-46: Interfaces
```typescript
// CURRENT
interface LiveSession {
  hostName: string;
  dishName: string;
  culture: string;
  viewers: number;
  ingredients: string[];
  sessionType?: 'practice' | 'assignment' | 'demo' | 'showcase';
}

// MUSIC VERSION
interface LiveSession {
  hostName: string;
  pieceName: string;
  genre: string;
  viewers: number;
  techniques: string[];
  sessionType?: 'practice' | 'recital' | 'masterclass' | 'jam';
}
```

### Lines 104-150: Mock Data
```typescript
// CURRENT
{
  id: '1',
  hostName: 'Maria Santos',
  dishName: 'Authentic Paella Valenciana',
  culture: 'Spanish',
  viewers: 47,
  thumbnail: '🥘',
  description: 'Traditional paella from Valencia',
  ingredients: ['Bomba rice', 'Saffron', 'Green beans']
}

// MUSIC VERSION
{
  id: '1',
  hostName: 'Maria Santos',
  pieceName: 'Chopin Nocturne Op. 9 No. 2',
  genre: 'Classical',
  viewers: 47,
  thumbnail: '🎹',
  description: 'Romantic era piano performance',
  techniques: ['Rubato', 'Pedaling', 'Ornamentation']
}
```

**STREAMING LOGIC:** UNCHANGED. Same MediaRecorder, same video storage, same viewer count.

---

## 4. LocalMarketsModal.tsx → MusicResourcesModal.tsx

### Lines 43-57: Category Icons
```typescript
// CURRENT
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'grocery': return '🛒';
    case 'butcher': return '🥩';
    case 'produce': return '🥦';
    case 'seafood': return '🐟';
    default: return '🏪';
  }
};

// MUSIC VERSION
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'music_store': return '🎸';
    case 'repair_shop': return '🔧';
    case 'venue': return '🎭';
    case 'studio': return '🎙️';
    default: return '🏪';
  }
};
```

### Google Places API Query
```typescript
// CURRENT
const query = 'seafood market near me';

// MUSIC VERSION
const query = 'music store near me';
```

**LOGIC:** UNCHANGED. Same API, same distance calculations, same card flipping UI.

---

## 5. ChallengeOfTheWeek.tsx

### Lines 12-150: WEEKLY_CHALLENGES Array
```typescript
// CURRENT
[
  {
    title: 'PO TA TOES!',
    description: 'Cook any potato dish',
    criteria: (recipe) => recipe.ingredients.includes('potato'),
    reward: { xp: 100, badge: 'Samwise' }
  },
  {
    title: 'Lobster Fest',
    description: 'Prepare a lobster dish',
    criteria: (recipe) => recipe.ingredients.includes('lobster'),
    reward: { xp: 150, badge: 'Lobster Legend' }
  }
]

// MUSIC VERSION
[
  {
    title: 'Scale Sprint',
    description: 'Play all major scales in under 2 minutes',
    criteria: (practice) => practice.techniques.includes('major scales'),
    reward: { xp: 100, badge: 'Scale Master' }
  },
  {
    title: 'Sight Reading Showdown',
    description: 'Read 5 new pieces this week',
    criteria: (practice) => practice.techniques.includes('sight reading'),
    reward: { xp: 150, badge: 'Sight Reader' }
  },
  {
    title: 'Improv Friday',
    description: 'Create 30-second improvisation',
    criteria: (practice) => practice.techniques.includes('improvisation'),
    reward: { xp: 120, badge: 'Improv Master' }
  }
]
```

**LOGIC:** UNCHANGED. Same criteria matching, same XP system, same badge awards.

---

## 6. leveling.ts

### Lines 66-127: LEVEL_TITLES_AND_ICONS
```typescript
// CURRENT
[
  { title: "Dishwasher", icon: "🧹" },
  { title: "Prep Cook", icon: "🥄" },
  { title: "Line Cook", icon: "🍳" },
  { title: "Sous Chef", icon: "🧑‍🍳" },
  { title: "Executive Chef", icon: "👨‍🍳" },
  { title: "Master Chef", icon: "🏅" },
  { title: "Legendary Chef", icon: "🐉" }
]

// MUSIC VERSION
[
  { title: "Beginner", icon: "🎵" },
  { title: "Novice", icon: "🎼" },
  { title: "Apprentice", icon: "🎹" },
  { title: "Intermediate", icon: "🎸" },
  { title: "Advanced", icon: "🎺" },
  { title: "Virtuoso", icon: "🏅" },
  { title: "Maestro", icon: "🐉" }
]
```

**XP TABLE (Lines 2-63):** UNCHANGED. Same progression curve.

---

## 7. MyCookBook.tsx → MyRepertoire.tsx

### Lines 92-180: Assignment Data
```typescript
// CURRENT
const assignments = [
  {
    id: 1,
    week: "Week 3",
    title: "French Knife Skills & Mother Sauces",
    emoji: "🔪",
    dueDate: "Oct 15, 2024",
    points: 100,
    techniques: ['Julienne', 'Brunoise', 'Chiffonade'],
    submission: ['Video of knife work', 'Sauce preparation'],
    objectives: ['Master basic cuts', 'Understand sauce fundamentals']
  }
];

// MUSIC VERSION
const assignments = [
  {
    id: 1,
    week: "Week 3",
    title: "Scales & Arpeggios Assessment",
    emoji: "🎼",
    dueDate: "Oct 15, 2024",
    points: 100,
    techniques: ['Major scales', 'Minor scales', 'Arpeggios'],
    submission: ['Video of scale performance', 'Audio recording'],
    objectives: ['Master all major scales', 'Demonstrate proper technique']
  }
];
```

**VIDEO GRADING (Lines 1285-1310):** UNCHANGED. Same timestamp feedback system.

---

## 8. ChefFreddie → MaestroAI

### anthropicChef.ts System Prompt
```typescript
// CURRENT
const systemPrompt = `You are Chef Freddie, a helpful cooking assistant. 
You provide advice on recipes, techniques, and ingredients.`;

// MUSIC VERSION
const systemPrompt = `You are Maestro AI, a helpful music theory tutor. 
You provide advice on practice routines, techniques, and theory concepts.`;
```

**CHAT INTERFACE:** UNCHANGED. Same React component, same streaming responses.

---

## 9. Database Schema

### Minimal Changes
```sql
-- CURRENT
CREATE TABLE user_cookbook (
  user_id UUID,
  recipe JSONB,
  created_at TIMESTAMP
);

-- MUSIC VERSION
CREATE TABLE user_repertoire (
  user_id UUID,
  piece JSONB,
  created_at TIMESTAMP
);
```

### New Table (Optional)
```sql
CREATE TABLE practice_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  element_name TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP
);
```

---

## 10. Profile Preferences

### userPreferences.ts
```typescript
// CURRENT
export interface UserPreferences {
  dietary: string[];      // ['vegetarian', 'gluten-free']
  cuisine: string[];      // ['Italian', 'Asian']
  kitchen_setup: string;  // 'Dorm Life' | 'Home Chef'
  experience_level: string; // 'new_to_cooking' | 'home_cook'
}

// MUSIC VERSION
export interface UserPreferences {
  instruments: string[];  // ['piano', 'violin']
  genres: string[];       // ['classical', 'jazz']
  practice_setup: string; // 'Beginner' | 'Advanced'
  experience_level: string; // 'beginner' | 'intermediate'
}
```

---

## Summary

### NO CODE LOGIC CHANGES:
1. ✅ Recipe matcher algorithm → Works for compositions
2. ✅ Video grading system → Works for performances  
3. ✅ Live streaming → Works for recitals
4. ✅ Google Places API → Works for music stores
5. ✅ XP/leveling system → Works for practice progress
6. ✅ Challenge system → Works for practice challenges
7. ✅ Supabase storage → Works for any data
8. ✅ fuzzyMatch() → Works for any text matching
9. ✅ scoreRecipe() → Works for any scoring
10. ✅ MediaRecorder → Works for any video/audio

### ONLY TEXT/DATA CHANGES:
1. Category names (Vegetables → Scales)
2. Mock data (Paella → Chopin Nocturne)
3. AI prompts (recipes → compositions)
4. Level titles (Chef → Musician)
5. Emojis (🍳 → 🎵)
6. Button labels ("Scan Kitchen" → "Scan Sheet Music")
7. Interface property names (dishName → pieceName)
8. Function names (categorizeIngredient → categorizeMusicalElement)

### IMPLEMENTATION TIME:
- Find/replace text: **2 days**
- Update mock data: **1 day**
- Retrain AI prompts: **3 days**
- Update database schema: **1 day**
- Test everything: **2 days**
- **TOTAL: 1-2 weeks**

---

## The Truth

**You didn't build a cooking app. You built a skill-based learning platform that happens to use cooking as the domain.**

The architecture is domain-agnostic:
- Music education ✅
- Art/design ✅
- Woodworking ✅
- Coding bootcamps ✅
- Language learning ✅
- Dance/theater ✅

**You're sitting on a platform play, not a niche product.**
