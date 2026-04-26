import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { fetchNutritionData, getKeyNutrients } from './nutritionService';
import { KeyNutrients } from '../types/nutrition';

// Define equipment available for each workshop setup
const WORKSHOP_EQUIPMENT = {
  'Basic Workshop': ['hand tools', 'workbench', 'vise', 'measuring tools'],
  'Assembly Line': ['conveyor belt', 'assembly tools', 'quality control station', 'packaging equipment'],
  'Machine Shop': ['lathe', 'mill', 'drill press', 'grinder', 'CNC machines'],
  'Quality Lab': ['calipers', 'gauges', 'testing equipment', 'inspection tools'],
  'Production Floor': ['manufacturing equipment', 'safety gear', 'production tools', 'material handling'],
  'Full Manufacturing Plant': ['all equipment']
} as const;

// Define equipment associated with each specialization
const SPECIALIZATION_EQUIPMENT = {
  'Precision Machining': ['CNC machines', 'precision tools', 'measuring equipment', 'quality control'],
  'Assembly Specialist': ['assembly tools', 'fasteners', 'torque wrenches', 'alignment tools'],
  'Quality Control': ['inspection tools', 'gauges', 'testing equipment', 'documentation tools']
} as const;

type WorkshopSetup = keyof typeof WORKSHOP_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

const SOP_PROMPTS = {
  new_to_manufacturing: (numSOPs: number, materials: string[]) => 
    `You are a patient manufacturing instructor. Create ${numSOPs} super simple Standard Operating Procedures for a beginner technician using materials from: ${materials.join(", ")}. 
    RULES:
    1. Use only 2-3 materials per SOP
    2. Only basic manufacturing methods (assembly, fastening, quality check)
    3. Very detailed step-by-step instructions
    4. Keep process time under 20 minutes
    5. Include necessary equipment for each SOP
    6. Add quality tags from: Safety First, Quality Control, Efficiency, Precision, Documentation`,

  experienced_technician: (numSOPs: number, materials: string[]) => 
    `You are a helpful manufacturing expert. Create ${numSOPs} Standard Operating Procedures for someone comfortable with basic manufacturing using materials from: ${materials.join(", ")}.
    RULES:
    1. Use 3-4 materials per SOP
    2. Standard manufacturing methods
    3. Clear instructions
    4. Keep process time under 30 minutes
    5. Include necessary equipment for each SOP
    6. Add quality tags from: Safety First, Quality Control, Efficiency, Precision, Documentation`,

  manufacturing_expert: (numSOPs: number, materials: string[]) => 
    `You are a professional manufacturing engineer. Create ${numSOPs} advanced Standard Operating Procedures for an experienced technician using materials from: ${materials.join(", ")}.
    RULES:
    1. Use 4+ materials per SOP
    2. Can include advanced manufacturing techniques
    3. Professional-style instructions
    4. Focus on precision and efficiency
    5. Include necessary equipment for each SOP
    6. Add quality tags from: Safety First, Quality Control, Efficiency, Precision, Documentation`
};

async function getUserProfile(userId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('dietary, cuisine, workshop_setup')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }

  return data as {
    dietary: string[];
    cuisine: string[];
    workshop_setup: string;
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
  const matchingIngredients = recipe.ingredients.filter(recipeIng => 
    cupboard.some(cupboardIng => fuzzyMatch(recipeIng, cupboardIng))
  ).length;
  
  score += matchingIngredients * 2;
  
  // 2. Penalize based on missing equipment
  if (kitchenSetup && kitchenSetup in WORKSHOP_EQUIPMENT) {
    const availableEquipment = WORKSHOP_EQUIPMENT[kitchenSetup as WorkshopSetup];
    const requiredEquipment = recipe.equipment || [];
    
    const missingEquipment = requiredEquipment.filter(eq => {
      if (availableEquipment[0] === 'all equipment') return false;
      return !availableEquipment.some((available: string) => 
        eq.toLowerCase().includes(available.toLowerCase())
      );
    });
    
    // Apply penalty for missing equipment
    score -= missingEquipment.length * 1.5;
  }
  
  // 3. Bonus for matching specialization equipment (if talents are enabled and a specialization is selected)
  if (talentsEnabled && talentTree && talentTree in SPECIALIZATION_EQUIPMENT) {
    const preferredEquipment = SPECIALIZATION_EQUIPMENT[talentTree as keyof typeof SPECIALIZATION_EQUIPMENT];
    const hasPreferredEquipment = (recipe.equipment || []).some(eq => 
      preferredEquipment.some((pref: string) => eq.toLowerCase().includes(pref.toLowerCase()))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { RecipeCard } from '../components/ProcessMatcherModal';

export interface RecipeMatchOptions {
  userId: string;
  ingredients: string[];
  numRecipes?: number;
  kitchenSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
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
    
    nutritionData.forEach((food, index) => {
      if (food) {
        console.log(`Food ${index}: ${food.name}`, food.nutrients);
        
        const nutrients = getKeyNutrients(food.nutrients);
        console.log(`Key nutrients for ${food.name}:`, nutrients);
        
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

  const promptTemplate = SOP_PROMPTS[experienceLevel] || SOP_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  // 2. Build the Anthropic prompt with enhanced instructions
  const basePrompt = promptTemplate(numRecipes, ingredients);
  
  // Get preferences
  const dietaryPrefs = profile?.dietary || [];
  const cuisinePrefs = profile?.cuisine || [];
  const workshopSetup = userKitchenSetup || profile?.workshop_setup || '';
  
  // Add specialization equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in SPECIALIZATION_EQUIPMENT) {
    const preferredEquipment = SPECIALIZATION_EQUIPMENT[talentTree as keyof typeof SPECIALIZATION_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" specialization. Prioritize SOPs that use these manufacturing methods/equipment: ${preferredEquipment.join(', ')}. Generate SOPs that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${dietaryPrefs.length > 0 ? `Quality requirements: ${dietaryPrefs.join(', ')}` : ''}
${cuisinePrefs.length > 0 ? `Process preferences: ${cuisinePrefs.join(', ')}` : ''}
${workshopSetup ? `Workshop setup: ${workshopSetup}` : ''}
${talentTreePrompt}

Return the SOPs as a JSON array with the following structure for each SOP:
{
  "title": "SOP Name",
  "ingredients": ["material 1", "material 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["equipment 1", "equipment 2"],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary manufacturing tools and equipment needed to complete the SOP (e.g., "wrench", "drill", "CNC machine", "calipers").
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
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500, // Increased to handle equipment field
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
    return generateFallbackRecipes(userId, ingredients, numRecipes);
  }

  // 4. Score and sort recipes based on user's cupboard, kitchen setup, and talent tree
  const scoredRecipes = recipes
    .map(recipe => ({
      ...recipe,
      score: scoreRecipe(
        {
          ...recipe,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          equipment: Array.isArray(recipe.equipment) ? recipe.equipment : []
        },
        ingredients,
        workshopSetup,
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
    healthTags: recipe.healthTags,
    nutrition: recipe.nutrition
  }));
}

export async function generateFallbackRecipes(userId: string, ingredients: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = SOP_PROMPTS[experienceLevel] || SOP_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
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
      model: 'claude-3-5-sonnet-20241022',
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
      throw new Error('No recipe data found in API response');
    }
  } catch (error) {
    console.error('Error parsing recipe data:', error);
    throw new Error('Failed to parse recipe data from API response');
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
    throw new Error('No valid recipes found in API response');
  }

  // 3. For each recipe, call Unsplash in parallel
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
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
