import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { fetchNutritionData, getKeyNutrients } from './nutritionService';
import { KeyNutrients } from '../types/nutrition';

// Define equipment available for each garage setup (must match Profile.tsx garage options)
const GARAGE_EQUIPMENT = {
  'Minimal Setup': ['wrench set', 'screwdriver set', 'pliers', 'jack', 'lug wrench'],
  'Home Garage': ['socket set', 'torque wrench', 'jack stands', 'oil drain pan', 'multimeter', 'wrench set', 'screwdriver set'],
  'Mobile Service': ['portable diagnostic scanner', 'cordless impact wrench', 'portable jack', 'multimeter', 'socket set', 'jump starter'],
  'School Lab': ['lift', 'diagnostic scanner', 'brake lathe', 'tire machine', 'alignment rack', 'engine analyzer'],
  'Professional Shop': ['all equipment']
} as const;

// Define equipment associated with each talent tree
const TALENT_TREE_EQUIPMENT = {
  'Engine Specialist': ['engine hoist', 'timing light', 'compression tester', 'bore gauge'],
  'Brake & Suspension Pro': ['brake lathe', 'spring compressor', 'alignment rack', 'strut tool'],
  'Electrical Diagnostics': ['OBD scanner', 'multimeter', 'oscilloscope', 'wiring harness tester']
} as const;

type GarageSetup = keyof typeof GARAGE_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;
const DEFAULT_AUTOMOTIVE_IMAGE = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e';
const AUTOMOTIVE_TAGS = ['Safety Certified', 'Warranty Approved', 'Fuel Efficient', 'Emission Compliant', 'Low Maintenance', 'Performance Tuned', 'Environmentally Friendly', 'Heavy Duty'];
const CULINARY_TERMS = /(recipe|cook|bake|grill|soup|salad|pasta|bread|kitchen|ingredient|meal|oven|crouton|chef|food|dish|sauce|marinade)/i;
const AUTOMOTIVE_TERMS = /(automotive|vehicle|car|truck|engine|brake|suspension|tire|wheel|oil|filter|spark|plug|battery|alternator|starter|sensor|obd|diagnostic|torque|lug|rotor|caliper|pad|belt|hose|coolant|transmission|garage|mechanic|repair|maintenance)/i;

const RECIPE_PROMPTS = {
  new_to_automotive: (numRecipes: number, ingredients: string[]) => 
    `You are Garage Puddy, a patient automotive instructor. Create ${numRecipes} simple beginner automotive repair guides using available parts from the student's garage: ${ingredients.join(", ")}. 
    RULES:
    1. Use only 2-3 required parts per repair
    2. Only basic entry-level repair procedures (oil change, tire rotation, bulb replacement, etc.)
    3. Very detailed step-by-step instructions with safety warnings
    4. Keep estimated repair time under 30 minutes when possible
    5. Include necessary tools for each repair (wrench, jack, etc.)
    6. Add relevant certification tags from: Safety Certified, Warranty Approved, Fuel Efficient, Emission Compliant, Low Maintenance, Performance Tuned, Environmentally Friendly, Heavy Duty`,

  apprentice_technician: (numRecipes: number, ingredients: string[]) => 
    `You are Garage Puddy, a knowledgeable automotive instructor. Create ${numRecipes} intermediate automotive repair guides for someone comfortable with basic maintenance using parts from their garage: ${ingredients.join(", ")}.
    RULES:
    1. Use 3-4 required parts per repair
    2. Standard repair procedures (brake pad replacement, belt changes, fluid flushes, sensor swaps)
    3. Clear step-by-step instructions with torque specs where applicable
    4. Keep estimated repair time under 1 hour when possible
    5. Include necessary tools for each repair
    6. Add relevant certification tags from: Safety Certified, Warranty Approved, Fuel Efficient, Emission Compliant, Low Maintenance, Performance Tuned, Environmentally Friendly, Heavy Duty`,

  certified_technician: (numRecipes: number, ingredients: string[]) => 
    `You are Garage Puddy, an expert automotive instructor. Create ${numRecipes} advanced automotive repair guides for an experienced technician using parts from their shop: ${ingredients.join(", ")}.
    RULES:
    1. Use 4+ required parts per repair
    2. Can include advanced procedures (engine rebuilds, transmission work, suspension overhauls, electrical diagnostics)
    3. Professional-level instructions with specifications and tolerances
    4. Focus on quality workmanship and proper technique
    5. Include necessary tools and specialty equipment for each repair
    6. Add relevant certification tags from: Safety Certified, Warranty Approved, Fuel Efficient, Emission Compliant, Low Maintenance, Performance Tuned, Environmentally Friendly, Heavy Duty`
};

async function getUserProfile(userId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('vehicle_type, certifications, garage_setup')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }

  return data as {
    vehicle_type: string[];
    certifications: string[];
    garage_setup?: string;
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

// Score a repair guide based on user's parts bin, preferences, garage setup, and talent tree
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
  if (kitchenSetup && kitchenSetup in GARAGE_EQUIPMENT) {
    const availableEquipment = GARAGE_EQUIPMENT[kitchenSetup as GarageSetup];
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
      preferredEquipment.some((pref: string) => eq.toLowerCase().includes(pref))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { RecipeCard } from '../components/RepairMatcherModal';

export interface RecipeMatchOptions {
  userId: string;
  ingredients: string[];
  numRecipes?: number;
  kitchenSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
}

function repairText(repair: any): string {
  const ingredients = Array.isArray(repair?.ingredients) ? repair.ingredients.join(' ') : '';
  const equipment = Array.isArray(repair?.equipment) ? repair.equipment.join(' ') : '';
  const instructions = Array.isArray(repair?.instructions) ? repair.instructions.join(' ') : String(repair?.instructions || '');
  return `${repair?.title || ''} ${ingredients} ${equipment} ${instructions}`;
}

function isAutomotiveRepair(repair: any): boolean {
  const text = repairText(repair);
  return !CULINARY_TERMS.test(text) && AUTOMOTIVE_TERMS.test(text);
}

function localAutomotiveFallback(ingredients: string[], count: number): RecipeCard[] {
  const partPool = ingredients.length > 0 ? ingredients : ['oil filter', 'brake pads', 'spark plugs', 'battery terminals'];
  return Array.from({ length: Math.max(1, count) }).map((_, idx) => {
    const a = partPool[idx % partPool.length];
    const b = partPool[(idx + 1) % partPool.length];
    return {
      id: `fallback-${Date.now()}-${idx}`,
      title: `Automotive Repair Guide ${idx + 1}: ${a} + ${b}`,
      image: DEFAULT_AUTOMOTIVE_IMAGE,
      ingredients: [a, b],
      instructions: [
        'Park on level ground, set the parking brake, disconnect power if needed, and confirm PPE/support points.',
        `Inspect and stage ${a} and ${b}, then verify fitment against the vehicle application.`,
        'Remove affected components, install replacements to specification, and torque fasteners in sequence.',
        'Run functional checks, clear or document diagnostic codes, and road-test or leak-check as appropriate.'
      ].join('\n'),
      equipment: ['torque wrench', 'socket set', 'jack stands', 'PPE kit'],
      healthTags: ['Safety Certified', 'Warranty Approved', 'Low Maintenance'],
      nutrition: undefined
    };
  });
}

function normalizeAutomotiveTags(tags: unknown): string[] {
  const parsed = Array.isArray(tags) ? tags.map(String) : [];
  const valid = parsed.filter(tag => AUTOMOTIVE_TAGS.includes(tag));
  return valid.length > 0 ? valid.slice(0, 3) : ['Safety Certified', 'Warranty Approved'];
}

// Helper to estimate recipe nutrition
async function calculateRecipeNutrition(
  ingredients: string[]
): Promise<KeyNutrients> {
  console.log('Calculating nutrition for ingredients:', ingredients);
  
  try {
    const nutritionData = await Promise.all(
      ingredients.map(ingredient => fetchNutritionData(ingredient))
    );
    
    console.log('Nutrition data:', nutritionData);
    
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
    
    nutritionData.forEach((item, index) => {
      if (item) {
        console.log(`Item ${index}: ${item.name}`, item.nutrients);
        
        const nutrients = getKeyNutrients(item.nutrients);
        console.log(`Key nutrients for ${item.name}:`, nutrients);
        
        Object.keys(nutrients).forEach(key => {
          const k = key as keyof KeyNutrients;
          totalNutrition[k] += nutrients[k];
        });
        
        console.log('Updated total nutrition:', totalNutrition);
      }
    });
    
    console.log('Total nutrition:', totalNutrition);
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
  console.log('Nutrition data for health tags:', nutrition);
  const tags: string[] = [];
  
  const satFat = nutrition.saturatedFat || 0;
  if (satFat < 5) {
    console.log(`Qualifies for Heart Healthy: saturatedFat=${satFat} < 5`);
    tags.push('Heart Healthy');
  }
  
  const omega3 = nutrition.omega3 || 0;
  if (omega3 > 0.5) {
    console.log(`Qualifies for Anti Inflammatory: omega3=${omega3} > 0.5`);
    tags.push('Anti Inflammatory');
  }
  
  const cholesterol = nutrition.cholesterol || 0;
  if (cholesterol < 100) {
    console.log(`Qualifies for Low Cholesterol: cholesterol=${cholesterol} < 100`);
    tags.push('Low Cholesterol');
  }
  
  const phosphorus = nutrition.phosphorus || 0;
  if (phosphorus < 100) {
    console.log(`Qualifies for Renal Friendly: phosphorus=${phosphorus} < 100`);
    tags.push('Renal Friendly');
  }
  
  const sodium = nutrition.sodium || 0;
  if (sodium < 500) {
    console.log(`Qualifies for DASH Diet and Low Sodium: sodium=${sodium} < 500`);
    tags.push('DASH Diet');
    tags.push('Low Sodium');
  }
  
  if (nutrition.fiber > 10) {
    console.log(`Qualifies for High Fiber: fiber=${nutrition.fiber} > 10`);
    tags.push('High Fiber');
  }
  
  const netCarbs = nutrition.carbs - nutrition.fiber;
  if (netCarbs < 20 && nutrition.sugars < 10) {
    console.log(`Qualifies for Low Glycemic: netCarbs=${netCarbs} < 20 and sugars=${nutrition.sugars} < 10`);
    tags.push('Low Glycemic');
  }
  
  if (tags.length === 0) {
    console.log('No tags qualified, using fallback: Heart Healthy');
    tags.push('Heart Healthy');
  }
  
  console.log('Selected health tags:', tags);
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
  
  // Get automotive profile preferences
  const vehicleType = profile?.vehicle_type || [];
  const certifications = profile?.certifications || [];
  const garageSetup = profile?.garage_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" specialization. Prioritize repairs that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate repair guides that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${vehicleType.length > 0 ? `Vehicle type focus: ${vehicleType.join(', ')}. Tailor repair guides to this vehicle type.` : ''}
${certifications.length > 0 && certifications[0] !== 'None' ? `Certifications: ${certifications.join(', ')}. Reference relevant certification standards in procedures.` : ''}
${garageSetup ? `Garage setup: ${garageSetup}. Only suggest tools/equipment available in this type of setup.` : ''}
${userKitchenSetup ? `Override setup: ${userKitchenSetup}` : ''}
${talentTreePrompt}
CRITICAL: Generate only automotive repair and maintenance guides. Do NOT generate food, meal, cooking, chef, kitchen, or culinary content.

Return the repair guides as a JSON array with the following structure for each guide:
{
  "title": "Repair Guide Name",
  "ingredients": ["part 1", "part 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["tool 1", "tool 2"],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary tools needed to complete the repair (e.g., "torque wrench", "OBD scanner", "jack stands", "multimeter").
For ingredients, list the actual automotive parts needed (e.g., "brake pads", "oil filter", "spark plugs").
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
    
    console.log('Cleaned JSON text length:', jsonText.length);
    
    recipes = JSON.parse(jsonText);
    
    if (!Array.isArray(recipes)) throw new Error('Response not an array');
  } catch (err: unknown) {
    console.error('Failed to parse recipes:', err);
    console.log('Raw content:', anthropicData.content[0].text);
    console.log('Error at position:', err instanceof Error ? err.message : String(err));
    return generateFallbackRecipes(userId, ingredients, numRecipes);
  }

  const automotiveRepairs = recipes.filter(isAutomotiveRepair);
  if (automotiveRepairs.length === 0) {
    console.warn('Automotive matcher rejected non-automotive/cooking response; using local fallback.');
    return localAutomotiveFallback(ingredients, numRecipes);
  }

  // 4. Score and sort repair guides based on user's garage parts, garage setup, and talent tree
  const scoredRecipes = automotiveRepairs
    .map(recipe => ({
      ...recipe,
      score: scoreRecipe(
        {
          ...recipe,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          equipment: Array.isArray(recipe.equipment) ? recipe.equipment : []
        },
        ingredients,
        garageSetup,
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
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(recipe.title + ' automotive repair')}&client_id=${unsplashKey}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.small || DEFAULT_AUTOMOTIVE_IMAGE;
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return DEFAULT_AUTOMOTIVE_IMAGE;
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
    healthTags: normalizeAutomotiveTags(recipe.healthTags),
    nutrition: recipe.nutrition
  }));
}

export async function generateFallbackRecipes(userId: string, ingredients: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, ingredients)}

CRITICAL: Generate only automotive repair and maintenance guides. Do NOT generate food, meal, cooking, chef, kitchen, or culinary content.

Format your response as a JSON array of automotive repair guide objects. Each object MUST have these exact fields:
{
  "title": "Repair Guide Name",
  "ingredients": ["part 1", "part 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary automotive tools, machines, or diagnostic instruments needed to complete the repair (e.g., "OBD scanner", "torque wrench", "jack stands", "multimeter").
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
    return localAutomotiveFallback(ingredients, count);
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
    console.log('Raw Anthropic response:', responseText);
    
    // More robust JSON extraction
    const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      recipes = JSON.parse(match[0]);
      console.log('Parsed recipes:', recipes);
    } else {
      console.error('No JSON array found in response:', responseText);
      throw new Error('No recipe data found in API response');
    }
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    return localAutomotiveFallback(ingredients, count);
  }

  // Validate recipe format
  recipes = Array.isArray(recipes) ? recipes : [];
  const validRecipes = recipes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.instructions) && isAutomotiveRepair(r);
    if (!isValid) {
      console.warn('Invalid recipe format:', r);
    }
    return isValid;
  });

  if (validRecipes.length === 0) {
    console.error('No valid recipes found in response');
    return localAutomotiveFallback(ingredients, count);
  }

  // 3. For each recipe, call Unsplash in parallel
  const imagePromises = validRecipes.map(async (r) => {
    const q = encodeURIComponent((r.title || r.ingredients?.[0] || 'auto repair') + ' automotive mechanic');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || DEFAULT_AUTOMOTIVE_IMAGE;
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
