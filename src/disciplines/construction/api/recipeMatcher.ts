import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { RecipeCard } from '../components/TaskMatcherModal';

// Define equipment available for each kitchen setup
const KITCHEN_EQUIPMENT = {
  'Dorm Life': ['microwave', 'kettle', 'toaster', 'mini-fridge'],
  'Minimalist': ['pot', 'pan', 'knife', 'cutting board', 'stove'],
  'Apartment Kitchen': ['oven', 'stove', 'basic utensils', 'baking sheets'],
  'Outdoor Grilling': ['grill', 'tongs', 'grill brush', 'meat thermometer'],
  'Home Chef': ['blender', 'food processor', 'mixer', 'knives', 'oven', 'stove'],
  'Full Chef\'s Kitchen': ['all equipment']
} as const;

// Define equipment associated with each talent tree
const TALENT_TREE_EQUIPMENT = {
  'Cast Iron Champion': ['cast iron', 'dutch oven', 'skillet'],
  'Grilling Heavy Weight': ['grill', 'smoker', 'charcoal', 'gas grill'],
  'Baking Warlock': ['stand mixer', 'baking sheet', 'pastry brush', 'rolling pin']
} as const;

type KitchenSetup = keyof typeof KITCHEN_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;
const DEFAULT_CONSTRUCTION_IMAGE = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd';

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

const CONSTRUCTION_TAGS = ['Safety', 'Precision', 'Efficiency', 'Quality', 'Compliance', 'Documentation'];
const CULINARY_TERMS = /(recipe|cook|bake|grill|soup|salad|pasta|bread|kitchen|ingredient|meal|oven|crouton|chef)/i;

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

export interface RecipeMatchOptions {
  userId: string;
  ingredients: string[];
  numRecipes?: number;
  kitchenSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
}

function isConstructionLikeProject(project: any): boolean {
  const title = String(project?.title || '');
  const ingredients = Array.isArray(project?.ingredients) ? project.ingredients.join(' ') : '';
  const equipment = Array.isArray(project?.equipment) ? project.equipment.join(' ') : '';
  const blob = `${title} ${ingredients} ${equipment}`;
  return !CULINARY_TERMS.test(blob);
}

function normalizeConstructionTags(tags: unknown): string[] {
  const parsed = Array.isArray(tags) ? tags.map(String) : [];
  const valid = parsed.filter(tag => CONSTRUCTION_TAGS.includes(tag));
  return valid.length > 0 ? valid.slice(0, 3) : ['Safety', 'Quality'];
}

function localConstructionFallback(ingredients: string[], count: number): RecipeCard[] {
  const materialPool = ingredients.length > 0 ? ingredients : ['2x4 lumber', 'drywall', 'deck screws', 'level'];
  return Array.from({ length: Math.max(1, count) }).map((_, idx) => {
    const a = materialPool[idx % materialPool.length];
    const b = materialPool[(idx + 1) % materialPool.length];
    const instructions = [
      'Review safety requirements and PPE before starting.',
      `Measure and stage ${a} and ${b} at the work area.`,
      'Execute installation steps per code and verify tolerances.',
      'Document inspection points and final quality checks.'
    ];
    return {
      id: `fallback-${Date.now()}-${idx}`,
      title: `Site Build Plan ${idx + 1}: ${a} + ${b}`,
      image: DEFAULT_CONSTRUCTION_IMAGE,
      ingredients: [a, b],
      instructions: instructions.join('\n'),
      equipment: ['tape measure', 'level', 'drill/driver', 'PPE kit'],
      healthTags: ['Safety', 'Precision', 'Quality'],
      nutrition: undefined
    };
  });
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
  
  // Get profile preferences (mapped to construction context)
  const certificationPrefs = profile?.dietary || [];
  const specializationPrefs = profile?.cuisine || [];
  const kitchenSetup = userKitchenSetup || profile?.kitchen_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" talent tree. Prioritize projects that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate projects that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${specializationPrefs.length > 0 ? `Specialization focus: ${specializationPrefs.join(', ')}` : ''}
${certificationPrefs.length > 0 ? `Certification focus: ${certificationPrefs.join(', ')}` : ''}
${kitchenSetup ? `Workspace setup: ${kitchenSetup}` : ''}
${talentTreePrompt}
CRITICAL: Generate only construction/trades build plans and procedures. Do NOT generate food, meal, cooking, chef, or culinary content.

Return the projects as a JSON array with the following structure for each project:
{
  "title": "Build Plan Name",
  "ingredients": ["material 1", "material 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["tool 1", "tool 2"],
  "healthTags": ["Safety", "Precision"]
}

For equipment, list all necessary tools, machines, or instruments needed to complete the project (e.g., "multimeter", "torque wrench", "drill", "caliper").
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
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500, // Increased to handle equipment field
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', anthropicData);
    return localConstructionFallback(ingredients, numRecipes);
  }

  let recipes;
  try {
    const content = anthropicData.content[0].text;
    
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
    
    console.log('Cleaned JSON text length:', jsonText.length);
    
    recipes = JSON.parse(jsonText);
    
    if (!Array.isArray(recipes)) throw new Error('Response not an array');
  } catch (err: unknown) {
    console.error('Failed to parse recipes:', err);
    console.log('Raw content:', anthropicData.content[0].text);
    console.log('Error at position:', err instanceof Error ? err.message : String(err));
    return localConstructionFallback(ingredients, numRecipes);
  }

  const constructionRecipes = recipes.filter((recipe: any) => isConstructionLikeProject(recipe));
  if (constructionRecipes.length === 0) {
    return localConstructionFallback(ingredients, numRecipes);
  }

  // 4. Score and sort recipes based on user's cupboard, kitchen setup, and talent tree
  const scoredRecipes = constructionRecipes
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
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(`${recipe.title} construction blueprint`)}&client_id=${unsplashKey}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.small || DEFAULT_CONSTRUCTION_IMAGE;
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return DEFAULT_CONSTRUCTION_IMAGE;
    }
  });

  const images = await Promise.all(imagePromises);

  // 6. Return scored recipe cards with images (construction tags only)
  return scoredRecipes.map((recipe, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: recipe.title,
    image: images[i] || DEFAULT_CONSTRUCTION_IMAGE,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : '',
    equipment: Array.isArray(recipe.equipment) ? recipe.equipment : [],
    healthTags: normalizeConstructionTags(recipe.healthTags),
    nutrition: undefined
  }));
}

export async function generateFallbackRecipes(userId: string, ingredients: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, ingredients)}

Format your response as a JSON array of project objects. Each project object MUST have these exact fields:
{
  "title": "Project Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary tools, machines, or instruments needed to complete the project (e.g., "multimeter", "torque wrench", "drill", "caliper").
CRITICAL: Output construction build plans only. Do not output food/cooking recipes.
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
      model: 'claude-3-opus-20240229',
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
    return localConstructionFallback(ingredients, count);
  }

  const anthropicData = await anthropicRes.json();
  
  // Try to extract JSON from Claude's response
  let recipes: any[] = [];
  try {
    if (!anthropicData.content?.[0]?.text) {
      console.error('Invalid Anthropic response format:', anthropicData);
      return localConstructionFallback(ingredients, count);
    }
    const responseText = anthropicData.content[0].text;
    console.log('Raw Anthropic response:', responseText);
    
    // More robust JSON extraction
    const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      recipes = JSON.parse(match[0]);
      console.log('Parsed recipes:', recipes);
    } else {
      console.error('No JSON array found in response:', responseText);
      return localConstructionFallback(ingredients, count);
    }
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    return localConstructionFallback(ingredients, count);
  }

  // Validate recipe format
  recipes = Array.isArray(recipes) ? recipes : [];
  const validRecipes = recipes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.instructions);
    if (!isValid) {
      console.warn('Invalid recipe format:', r);
    }
    return isValid;
  });

  if (validRecipes.length === 0) {
    console.error('No valid recipes found in response');
    return localConstructionFallback(ingredients, count);
  }

  // 3. For each recipe, call Unsplash in parallel
  const imagePromises = validRecipes.map(async (r) => {
    const q = encodeURIComponent(`${r.title || r.ingredients?.[0] || 'construction site plan'} construction blueprint`);
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || DEFAULT_CONSTRUCTION_IMAGE;
  });
  const images = await Promise.all(imagePromises);

  // 4. Return RecipeCards
  return validRecipes
    .filter(isConstructionLikeProject)
    .slice(0, count)
    .map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : [],
    healthTags: normalizeConstructionTags(r.healthTags)
  }));
}
