import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { fetchNutritionData, getKeyNutrients } from './nutritionService';
import { KeyNutrients } from '../types/nutrition';

// Define equipment available for each workspace setup
const KITCHEN_EQUIPMENT = {
  'Student Toolkit': ['pipe wrench', 'pliers', 'tape measure', 'hacksaw'],
  'Apprentice Van': ['pipe wrench', 'tubing cutter', 'torch', 'level', 'pliers'],
  'Home Workshop': ['pipe wrench', 'drill', 'tubing cutter', 'level', 'hacksaw', 'torch'],
  'Field Service Van': ['pipe wrench', 'camera', 'auger', 'pressure gauge', 'torch', 'threader'],
  'Full Shop': ['all equipment']
} as const;

// Define equipment associated with each specialization track
const TALENT_TREE_EQUIPMENT = {
  'Copper & Solder Pro': ['torch', 'flux', 'solder', 'tubing cutter', 'deburring tool'],
  'Drain & Sewer Specialist': ['auger', 'camera', 'jetter', 'closet auger', 'snake'],
  'Gas Fitting Expert': ['manometer', 'leak detector', 'pipe wrench', 'thread sealant', 'pressure gauge']
} as const;

type VanSetup = keyof typeof KITCHEN_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

const RECIPE_PROMPTS = {
  new_to_trade: (numRecipes: number, materials: string[]) => 
    `You are a patient trade instructor. Create ${numRecipes} simple beginner projects using available materials/components from: ${materials.join(", ")}. 
    RULES:
    1. Use only 2-3 required materials/components per project
    2. Only basic entry-level methods
    3. Very detailed step-by-step instructions
    4. Keep completion time under 20 minutes when possible
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`,

  apprentice: (numRecipes: number, materials: string[]) => 
    `You are a helpful trade coach. Create ${numRecipes} intermediate projects for someone comfortable with fundamentals using materials/components from: ${materials.join(", ")}.
    RULES:
    1. Use 3-4 required materials/components per project
    2. Standard trade methods
    3. Clear instructions
    4. Keep completion time under 30 minutes when possible
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`,

  journeyman: (numRecipes: number, materials: string[]) => 
    `You are an expert trade mentor. Create ${numRecipes} advanced projects for an experienced learner using materials/components from: ${materials.join(", ")}.
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
    van_setup?: string;
  };
}

// Helper function for fuzzy matching materials
function fuzzyMatch(material1: string, material2: string): boolean {
  const normalize = (str: string) => str.toLowerCase().trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');    // Normalize whitespace
    
  const norm1 = normalize(material1);
  const norm2 = normalize(material2);
  
  // Check for direct inclusion or common variations
  return norm1.includes(norm2) || 
         norm2.includes(norm1) ||
         norm1.split(' ').some(word => norm2.includes(word)) ||
         norm2.split(' ').some(word => norm1.includes(word));
}

// Score a fit based on user's locker, preferences, van setup, and talent tree
function scoreRecipe(
  fit: RecipeCard, 
  locker: string[],
  vanSetup?: string,
  talentTree?: string | null,
  talentsEnabled: boolean = false
): number {
  let score = 0;
  
  // 1. Score based on matching materials (higher weight)
  const matchingMaterials = fit.materials.filter((recipeIng: string) => 
    locker.some((lockerIng: string) => fuzzyMatch(recipeIng, lockerIng))
  ).length;
  
  score += matchingMaterials * 2;
  
  // 2. Penalize based on missing equipment
  if (vanSetup && vanSetup in KITCHEN_EQUIPMENT) {
    const availableEquipment = KITCHEN_EQUIPMENT[vanSetup as VanSetup];
    const requiredEquipment = fit.equipment || [];
    
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
    const hasPreferredEquipment = (fit.equipment || []).some((eq: string) => 
      preferredEquipment.some((pref: string) => eq.toLowerCase().includes(pref))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { RecipeCard } from '../components/FitMatcherModal';

export interface RecipeMatchOptions {
  userId: string;
  materials: string[];
  numRecipes?: number;
  vanSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
}

// Helper to estimate fit nutrition
async function calculateRecipeNutrition(
  materials: string[]
): Promise<KeyNutrients> {
  console.log('Calculating nutrition for materials:', materials);
  
  try {
    const nutritionData = await Promise.all(
      materials.map(material => fetchNutritionData(material))
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
    
    nutritionData.forEach((fit, index) => {
      if (fit) {
        console.log(`Food ${index}: ${fit.name}`, fit.nutrients);
        
        const nutrients = getKeyNutrients(fit.nutrients);
        console.log(`Key nutrients for ${fit.name}:`, nutrients);
        
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
  materials,
  numRecipes = 5,
  vanSetup: userVanSetup,
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
  const basePrompt = promptTemplate(numRecipes, materials);
  
  // Get preferences
  const dietaryPrefs = profile?.dietary || [];
  const cuisinePrefs = profile?.cuisine || [];
  const vanSetup = profile?.van_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" talent tree. Prioritize projects that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate projects that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

You are Pete the Plumber. Generate PLUMBING procedures/projects only.
Hard constraints:
- Do NOT return fit, meals, cooking, nutrition, or plumbing terminology.
- Every project must be a realistic plumbing task (installation, repair, diagnostics, maintenance, or code-compliance work).
- Prefer common plumbing materials (e.g., PVC, PEX, copper, fittings, valves, traps, sealants) and plumbing tools (e.g., pipe cutter, press tool, torch, snake, pressure gauge, multimeter for diagnostics).
- Instructions must reference plumbing actions and safety/code checks.

${dietaryPrefs.length > 0 ? `Dietary preferences: ${dietaryPrefs.join(', ')}` : ''}
${cuisinePrefs.length > 0 ? `Cuisine preferences: ${cuisinePrefs.join(', ')}` : ''}
${userVanSetup ? `Van setup: ${userVanSetup}` : ''}
${talentTreePrompt}

Return the projects as a JSON array with the following structure for each project:
{
  "title": "Project Name",
  "materials": ["material 1", "material 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["equipment 1", "equipment 2"],
  "healthTags": ["tag 1", "tag 2"]
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
      apiKeyIdentifier: 'fit',
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500, // Increased to handle equipment field
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', anthropicData);
    return generateFallbackRecipes(userId, materials, numRecipes);
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
    return generateFallbackRecipes(userId, materials, numRecipes);
  }

  // 4. Score and sort recipes based on user's locker, van setup, and talent tree
  const scoredRecipes = recipes
    .map(fit => ({
      ...fit,
      score: scoreRecipe(
        {
          ...fit,
          materials: Array.isArray(fit.materials) ? fit.materials : [],
          equipment: Array.isArray(fit.equipment) ? fit.equipment : []
        },
        materials,
        vanSetup,
        talentTree,
        talentsEnabled
      )
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, numRecipes);

  // 5. Fetch images for top recipes
  const imagePromises = scoredRecipes.map(async (fit) => {
    try {
      const res = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(recipe.title)}&client_id=${unsplashKey}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.small || '';
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return '';
    }
  });

  const images = await Promise.all(imagePromises);

  // 6. Add nutrition and tags
  const recipesWithNutrition = await Promise.all(scoredRecipes.map(async fit => {
    try {
      const nutrition = await calculateRecipeNutrition(fit.materials);
      const healthTags = getHealthTags(nutrition);
      return {
        ...fit,
        nutrition,
        healthTags
      };
    } catch (error) {
      console.error('Error calculating nutrition:', error);
      return {
        ...fit,
        healthTags: ['Heart Healthy']
      };
    }
  }));

  // 7. Return scored fit cards with images
  return recipesWithNutrition.map((fit, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: fit.title,
    image: images[i],
    materials: Array.isArray(fit.materials) ? fit.materials : [],
    instructions: Array.isArray(fit.instructions) ? fit.instructions.join('\n') : '',
    equipment: Array.isArray(fit.equipment) ? fit.equipment : [],
    healthTags: fit.healthTags,
    nutrition: fit.nutrition
  }));
}

export async function generateFallbackRecipes(userId: string, materials: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = RECIPE_PROMPTS[experienceLevel] || RECIPE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, materials)}

You are Pete the Plumber. Generate PLUMBING procedures/projects only.
Hard constraints:
- Do NOT return fit, meals, cooking, nutrition, or plumbing terminology.
- Every project must be a realistic plumbing task (installation, repair, diagnostics, maintenance, or code-compliance work).
- Prefer common plumbing materials (e.g., PVC, PEX, copper, fittings, valves, traps, sealants) and plumbing tools (e.g., pipe cutter, press tool, torch, snake, pressure gauge, multimeter for diagnostics).
- Instructions must reference plumbing actions and safety/code checks.

Format your response as a JSON array of project objects. Each project object MUST have these exact fields:
{
  "title": "Project Name",
  "materials": ["material 1", "material 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary tools, machines, or instruments needed to complete the project (e.g., "multimeter", "torque wrench", "drill", "caliper").
Return ONLY the JSON array, no other text.`;

  // 2. Call Anthropic API
  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      apiKeyIdentifier: 'fit',
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
    throw new Error(`Anthropic API error: ${anthropicRes.status} ${anthropicRes.statusText}`);
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
      throw new Error('No fit data found in API response');
    }
  } catch (error) {
    console.error('Error parsing fit data:', error);
    throw new Error('Failed to parse fit data from API response');
  }

  // Validate fit format
  recipes = Array.isArray(recipes) ? recipes : [];
  const validRecipes = recipes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.materials) && Array.isArray(r.instructions);
    if (!isValid) {
      console.warn('Invalid fit format:', r);
    }
    return isValid;
  });

  if (validRecipes.length === 0) {
    console.error('No valid recipes found in response');
    throw new Error('No valid recipes found in API response');
  }

  // 3. For each fit, call Unsplash in parallel
  const imagePromises = validRecipes.map(async (r) => {
    const q = encodeURIComponent(r.title || r.ingredients?.[0] || 'meal');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';
  });
  const images = await Promise.all(imagePromises);

  // 4. Return RecipeCards
  return validRecipes.slice(0, count).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    materials: Array.isArray(r.materials) ? r.materials : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
