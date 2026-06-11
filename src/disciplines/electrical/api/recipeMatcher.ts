import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { fetchNutritionData, getKeyNutrients } from './nutritionService';
import { KeyNutrients } from '../types/nutrition';

// Define equipment available for each workspace setup
const KITCHEN_EQUIPMENT = {
  'Minimal Setup': ['wire strippers', 'screwdriver', 'voltage tester', 'pliers'],
  'Apartment Workspace': ['multimeter', 'wire strippers', 'pliers', 'screwdrivers', 'fish tape'],
  'Full Workspace': ['conduit bender', 'multimeter', 'drill', 'fish tape', 'wire strippers', 'level'],
  'Field Workspace': ['megger', 'amp clamp', 'conduit bender', 'knockout set', 'hydraulic bender'],
  'Professional Workspace': ['all equipment']
} as const;

// Define equipment associated with each specialization track
const TALENT_TREE_EQUIPMENT = {
  'Residential Pro': ['romex stapler', 'stud finder', 'outlet tester', 'wire nuts'],
  'Commercial Commander': ['conduit bender', 'threading machine', 'cable puller', 'hydraulic bender'],
  'Industrial Expert': ['megger', 'motor analyzer', 'PLC programmer', 'thermal imager']
} as const;

type KitchenSetup = keyof typeof KITCHEN_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;
const DEFAULT_ELECTRICAL_IMAGE = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4';
const ELECTRICAL_TAGS = ['Safety', 'Precision', 'Efficiency', 'Quality', 'Compliance', 'Documentation'];
const CULINARY_TERMS = /(recipe|cook|bake|grill|soup|salad|pasta|bread|kitchen|ingredient|meal|oven|crouton|chef|food|dish|sauce|marinade)/i;
const ELECTRICAL_TERMS = /(electrical|circuit|wire|wiring|breaker|panel|conduit|outlet|receptacle|switch|voltage|current|amp|ground|junction|fixture|multimeter|gfci|afci|load|neutral|hot|romex|emergency stop|motor control|disconnect)/i;

const RECIPE_PROMPTS = {
  new_to_cooking: (numRecipes: number, ingredients: string[]) => 
    `You are a patient trade instructor. Create ${numRecipes} simple beginner projects using available materials/components from: ${ingredients.join(", ")}. 
    RULES:
    1. Use only 2-3 required materials/components per project
    2. Only basic entry-level methods
    3. Very detailed step-by-step instructions
    4. Keep completion time under 20 minutes when possible
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`,

  home_cook: (numRecipes: number, ingredients: string[]) => 
    `You are a helpful trade coach. Create ${numRecipes} intermediate projects for someone comfortable with fundamentals using materials/components from: ${ingredients.join(", ")}.
    RULES:
    1. Use 3-4 required materials/components per project
    2. Standard trade methods
    3. Clear instructions
    4. Keep completion time under 30 minutes when possible
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`,

  kitchen_confident: (numRecipes: number, ingredients: string[]) => 
    `You are an expert trade mentor. Create ${numRecipes} advanced projects for an experienced learner using materials/components from: ${ingredients.join(", ")}.
    RULES:
    1. Use 4+ required materials/components per project
    2. Can include advanced trade techniques
    3. Professional-style instructions
    4. Focus on quality and technique
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`
};

async function getUserProfile(userId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('dietary, cuisine, kitchen_setup')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }

  return data as {
    dietary: string[];
    cuisine: string[];
    kitchen_setup?: string;
  };
}

// Helper function for fuzzy matching ingredients
function fuzzyMatch(ingredient1: string, ingredient2: string): boolean {
  const normalize = (str: string) => str.toLowerCase().trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');    // Normalize whitespace
    
  const norm1 = normalize(ingredient1);
  const norm2 = normalize(ingredient2);
  
  // Check for direct inclusion or common variations
  return norm1.includes(norm2) || 
         norm2.includes(norm1) ||
         norm1.split(' ').some(word => norm2.includes(word)) ||
         norm2.split(' ').some(word => norm1.includes(word));
}

// Score a recipe based on user's cupboard, preferences, kitchen setup, and talent tree
function scoreRecipe(
  recipe: RecipeCard, 
  cupboard: string[],
  kitchenSetup?: string,
  talentTree?: string | null,
  talentsEnabled: boolean = false
): number {
  let score = 0;
  
  // 1. Score based on matching ingredients (higher weight)
  const matchingIngredients = recipe.ingredients.filter((recipeIng: string) =>
    cupboard.some((cupboardIng: string) => fuzzyMatch(recipeIng, cupboardIng))
  ).length;
  
  score += matchingIngredients * 2;
  
  // 2. Penalize based on missing equipment
  if (kitchenSetup && kitchenSetup in KITCHEN_EQUIPMENT) {
    const availableEquipment = KITCHEN_EQUIPMENT[kitchenSetup as KitchenSetup];
    const requiredEquipment = recipe.equipment || [];
    
    const missingEquipment = requiredEquipment.filter((eq: string) => {
      if (availableEquipment[0] === 'all equipment') return false;
      return !availableEquipment.some((available: string) => 
        eq.toLowerCase().includes(available.toLowerCase())
      );
    });
    
    // Apply penalty for missing equipment
    score -= missingEquipment.length * 1.5;
  }
  
  // 3. Bonus for matching talent tree equipment (if talents are enabled and a tree is selected)
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    const hasPreferredEquipment = (recipe.equipment || []).some((eq: string) => 
      preferredEquipment.some((pref: string) => eq.toLowerCase().includes(pref.toLowerCase()))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { RecipeCard } from '../components/CircuitMatcherModal';

export interface RecipeMatchOptions {
  userId: string;
  ingredients: string[];
  numRecipes?: number;
  kitchenSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
}

function projectText(project: any): string {
  const ingredients = Array.isArray(project?.ingredients) ? project.ingredients.join(' ') : '';
  const equipment = Array.isArray(project?.equipment) ? project.equipment.join(' ') : '';
  const instructions = Array.isArray(project?.instructions) ? project.instructions.join(' ') : String(project?.instructions || '');
  return `${project?.title || ''} ${ingredients} ${equipment} ${instructions}`;
}

function isElectricalProject(project: any): boolean {
  const text = projectText(project);
  return !CULINARY_TERMS.test(text) && ELECTRICAL_TERMS.test(text);
}

function localElectricalFallback(ingredients: string[], count: number): RecipeCard[] {
  const materialPool = ingredients.length > 0 ? ingredients : ['12/2 NM cable', 'single-pole switch', '20A breaker', 'junction box'];
  return Array.from({ length: Math.max(1, count) }).map((_, idx) => {
    const a = materialPool[idx % materialPool.length];
    const b = materialPool[(idx + 1) % materialPool.length];
    return {
      id: `fallback-${Date.now()}-${idx}`,
      title: `Circuit Work Plan ${idx + 1}: ${a} + ${b}`,
      image: DEFAULT_ELECTRICAL_IMAGE,
      ingredients: [a, b],
      instructions: [
        'De-energize the circuit, lock/tag as appropriate, and verify absence of voltage with a meter.',
        `Inspect and stage ${a} and ${b} for the installation or diagnostic task.`,
        'Make terminations per code, torque devices to specification, and maintain grounding/bonding continuity.',
        'Re-energize safely, test operation, document readings, and label the circuit.'
      ].join('\n'),
      equipment: ['multimeter', 'wire strippers', 'screwdriver set', 'PPE kit'],
      healthTags: ['Safety', 'Precision', 'Compliance'],
      nutrition: undefined
    };
  });
}

function normalizeElectricalTags(tags: unknown): string[] {
  const parsed = Array.isArray(tags) ? tags.map(String) : [];
  const valid = parsed.filter(tag => ELECTRICAL_TAGS.includes(tag));
  return valid.length > 0 ? valid.slice(0, 3) : ['Safety', 'Compliance'];
}

// Helper to estimate recipe nutrition
async function calculateRecipeNutrition(
  ingredients: string[]
): Promise<KeyNutrients> {
  try {
    const nutritionData = await Promise.all(
      ingredients.map(ingredient => fetchNutritionData(ingredient))
    );
    
    const totalNutrition: KeyNutrients = {
      carbs: 0,
      sugars: 0,
      fiber: 0,
      protein: 0,
      saturatedFat: 0,
      omega3: 0,
      cholesterol: 0,
      sodium: 0,
      phosphorus: 0
    };
    
    nutritionData.forEach((food, index) => {
      if (food) {
        const nutrients = getKeyNutrients(food.nutrients);
        
        Object.keys(nutrients).forEach(key => {
          const k = key as keyof KeyNutrients;
          totalNutrition[k] += nutrients[k];
        });
      }
    });
    
    return totalNutrition;
  } catch (error) {
    console.error('Error in calculateRecipeNutrition:', error);
    // Return default nutrition data to avoid breaking health tags
    return {
      carbs: 0,
      sugars: 0,
      fiber: 0,
      protein: 0,
      saturatedFat: 0,
      omega3: 0,
      cholesterol: 0,
      sodium: 0,
      phosphorus: 0
    };
  }
}

// Define ideal nutrition profiles for each health tag
const HEALTH_TAG_IDEALS = {
  'Heart Healthy': { saturatedFat: 0, cholesterol: 0, sodium: 0 },
  'Anti Inflammatory': { omega3: 10, saturatedFat: 0 },
  'Low Glycemic': { carbs: 30, sugars: 5, fiber: 10 },
  'Low Cholesterol': { cholesterol: 0, saturatedFat: 0 },
  'Renal Friendly': { phosphorus: 100, sodium: 500 },
  'DASH Diet': { sodium: 500, saturatedFat: 0 },
  'Low Sodium': { sodium: 500 },
  'High Fiber': { fiber: 10 }
};

function getHealthTags(nutrition: KeyNutrients): string[] {
  const tags: string[] = [];
  
  const satFat = nutrition.saturatedFat || 0;
  if (satFat < 5) {
    tags.push('Heart Healthy');
  }
  
  const omega3 = nutrition.omega3 || 0;
  if (omega3 > 0.5) {
    tags.push('Anti Inflammatory');
  }
  
  const cholesterol = nutrition.cholesterol || 0;
  if (cholesterol < 100) {
    tags.push('Low Cholesterol');
  }
  
  const phosphorus = nutrition.phosphorus || 0;
  if (phosphorus < 100) {
    tags.push('Renal Friendly');
  }
  
  const sodium = nutrition.sodium || 0;
  if (sodium < 500) {
    tags.push('DASH Diet');
    tags.push('Low Sodium');
  }
  
  if (nutrition.fiber > 10) {
    tags.push('High Fiber');
  }
  
  const netCarbs = nutrition.carbs - nutrition.fiber;
  if (netCarbs < 20 && nutrition.sugars < 10) {
    tags.push('Low Glycemic');
  }
  
  if (tags.length === 0) {
    tags.push('Heart Healthy');
  }
  
  return tags;
}

export async function fetchRecipesWithImages({
  userId,
  ingredients,
  numRecipes = 5,
  kitchenSetup: userKitchenSetup,
  talentsEnabled = false,
  talentTree = null
}: RecipeMatchOptions): Promise<RecipeCard[]> {
  // 1. Get user preferences and profile
  const [{ experienceLevel }, profile] = await Promise.all([
    getUserPreferences(userId),
    getUserProfile(userId)
  ]);

  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  // 2. Build the Anthropic prompt with enhanced instructions
  const basePrompt = promptTemplate(numRecipes, ingredients);
  
  // Get preferences
  const dietaryPrefs = profile?.dietary || [];
  const cuisinePrefs = profile?.cuisine || [];
  const kitchenSetup = profile?.kitchen_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" talent tree. Prioritize projects that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate projects that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${dietaryPrefs.length > 0 ? `Certification/code focus: ${dietaryPrefs.join(', ')}` : ''}
${cuisinePrefs.length > 0 ? `Electrical specialization focus: ${cuisinePrefs.join(', ')}` : ''}
${userKitchenSetup ? `Workspace setup: ${userKitchenSetup}` : ''}
CRITICAL: Generate only electrical circuit work plans and procedures. Do NOT generate food, meal, cooking, chef, kitchen, or culinary content.
${talentTreePrompt}

Return the projects as a JSON array with the following structure for each project:
{
  "title": "Electrical Work Plan Name",
  "ingredients": ["wire/device/material 1", "wire/device/material 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["equipment 1", "equipment 2"],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary electrical tools or test instruments needed to complete the project (e.g., "multimeter", "wire strippers", "conduit bender", "torque screwdriver").
Return ONLY the JSON array, no other text.`;

  // 3. Call Anthropic API
  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'recipe',
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096, // Generous token limit for full project JSONs
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', anthropicData);
    return generateFallbackRecipes(userId, ingredients, numRecipes);
  }

  let recipes;
  try {
    let content = anthropicData.content[0].text;
    
    // Strip markdown code fences if present
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    
    // Extract JSON array using regex in case there's additional text
    let jsonText = '';
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/); 
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    } else {
      jsonText = content;
    }
    
    // Clean up common JSON issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with regular quotes
      .replace(/[\u2018\u2019]/g, "'");  // Replace smart apostrophes
    
    recipes = JSON.parse(jsonText);
    
    if (!Array.isArray(recipes)) throw new Error('Response not an array');
  } catch (err: unknown) {
    console.error('Failed to parse recipes:', err);
    return generateFallbackRecipes(userId, ingredients, numRecipes);
  }

  const electricalRecipes = recipes.filter(isElectricalProject);
  if (electricalRecipes.length === 0) {
    console.warn('Electrical matcher rejected non-electrical/cooking response; using local fallback.');
    return localElectricalFallback(ingredients, numRecipes);
  }

  // 4. Score and sort recipes based on user's materials bin, workspace setup, and talent tree
  const scoredRecipes = electricalRecipes
    .map(recipe => ({
      ...recipe,
      score: scoreRecipe(
        {
          ...recipe,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          equipment: Array.isArray(recipe.equipment) ? recipe.equipment : []
        },
        ingredients,
        kitchenSetup,
        talentTree,
        talentsEnabled
      )
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, numRecipes);

  // 5. Fetch images for top recipes
  const imagePromises = scoredRecipes.map(async (recipe) => {
    try {
      const res = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(`${recipe.title} electrical wiring`)}&client_id=${unsplashKey}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.small || DEFAULT_ELECTRICAL_IMAGE;
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return DEFAULT_ELECTRICAL_IMAGE;
    }
  });

  const images = await Promise.all(imagePromises);

  // 6. Add nutrition and tags
  const recipesWithNutrition = await Promise.all(scoredRecipes.map(async recipe => {
    try {
      const nutrition = await calculateRecipeNutrition(recipe.ingredients);
      const healthTags = getHealthTags(nutrition);
      return {
        ...recipe,
        nutrition,
        healthTags
      };
    } catch (error) {
      console.error('Error calculating nutrition:', error);
      return {
        ...recipe,
        healthTags: ['Heart Healthy']
      };
    }
  }));

  // 7. Return scored recipe cards with images
  return recipesWithNutrition.map((recipe, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: recipe.title,
    image: images[i],
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : '',
    equipment: Array.isArray(recipe.equipment) ? recipe.equipment : [],
    healthTags: normalizeElectricalTags(recipe.healthTags),
    nutrition: recipe.nutrition
  }));
}

export async function generateFallbackRecipes(userId: string, ingredients: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, ingredients)}

CRITICAL: Generate only electrical circuit work plans and procedures. Do NOT generate food, meal, cooking, chef, kitchen, or culinary content.

Format your response as a JSON array of electrical project objects. Each project object MUST have these exact fields:
{
  "title": "Electrical Work Plan Name",
  "ingredients": ["wire/device/material 1", "wire/device/material 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary electrical tools or test instruments needed to complete the project (e.g., "multimeter", "wire strippers", "conduit bender", "torque screwdriver").
Return ONLY the JSON array, no other text.`;

  // 2. Call Anthropic API
  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'recipe',
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  });
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', {
      status: anthropicRes.status,
      statusText: anthropicRes.statusText,
      body: await anthropicRes.text()
    });
    return localElectricalFallback(ingredients, count);
  }

  const anthropicData = await anthropicRes.json();
  
  // Try to extract JSON from Claude's response
  let recipes: any[] = [];
  try {
    if (!anthropicData.content?.[0]?.text) {
      console.error('Invalid Anthropic response format:', anthropicData);
      throw new Error('Invalid response format from Anthropic API');
    }
    const responseText = anthropicData.content[0].text;
    // More robust JSON extraction
    const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      recipes = JSON.parse(match[0]);
    } else {
      console.error('No JSON array found in response:', responseText);
      throw new Error('No recipe data found in API response');
    }
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    return localElectricalFallback(ingredients, count);
  }

  // Validate recipe format
  recipes = Array.isArray(recipes) ? recipes : [];
  const validRecipes = recipes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.instructions) && isElectricalProject(r);
    if (!isValid) {
      console.warn('Invalid recipe format:', r);
    }
    return isValid;
  });

  if (validRecipes.length === 0) {
    console.error('No valid recipes found in response');
    return localElectricalFallback(ingredients, count);
  }

  // 3. For each recipe, call Unsplash in parallel
  const imagePromises = validRecipes.map(async (r) => {
    const q = encodeURIComponent(`${r.title || r.ingredients?.[0] || 'electrical wiring'} electrical wiring`);
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || DEFAULT_ELECTRICAL_IMAGE;
  });
  const images = await Promise.all(imagePromises);

  // 4. Return RecipeCards
  return validRecipes.slice(0, count).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
