import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { fetchNutritionData, getKeyNutrients } from './nutritionService';
import { KeyNutrients } from '../types/nutrition';

// Define equipment available for each workspace setup
const KITCHEN_EQUIPMENT = {
  'Van Kit': ['multimeter', 'screwdriver set', 'adjustable wrench', 'flashlight'],
  'Basic Service': ['multimeter', 'manifold gauges', 'screwdriver set', 'wrench set', 'flashlight'],
  'Residential Service': ['multimeter', 'manifold gauges', 'vacuum pump', 'recovery machine', 'torch kit', 'hand tools'],
  'Commercial Service': ['multimeter', 'manifold gauges', 'vacuum pump', 'recovery machine', 'torch kit', 'hand tools', 'megohmmeter', 'combustion analyzer'],
  'Full Shop': ['all equipment']
} as const;

// Define equipment associated with each talent/specialization tree
const TALENT_TREE_EQUIPMENT = {
  'Climate Systems Master': ['manifold gauges', 'vacuum pump', 'recovery machine', 'torch kit'],
  'Refrigeration Expert': ['manifold gauges', 'temperature clamps', 'superheat calculator', 'leak detector'],
  'Airflow Specialist': ['manometer', 'anemometer', 'duct blaster', 'smoke pen']
} as const;

type KitchenSetup = keyof typeof KITCHEN_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

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

const HVAC_DOMAIN_TERMS = [
  'hvac', 'airflow', 'duct', 'static pressure', 'cfm', 'register', 'diffuser',
  'refrigerant', 'superheat', 'subcool', 'compressor', 'evaporator', 'condenser',
  'thermostat', 'controls', 'sensor', 'setpoint', 'contactor', 'capacitor', 'breaker',
  'heat pump', 'furnace', 'boiler', 'iaq', 'ventilation', 'commissioning', 'service',
  'maintenance', 'diagnostic', 'manifold', 'vacuum pump', 'recovery machine', 'nitrogen'
];

function isHVACProject(recipe: any): boolean {
  const text = `${recipe?.title || ''} ${(recipe?.ingredients || []).join(' ')} ${(recipe?.equipment || []).join(' ')} ${Array.isArray(recipe?.instructions) ? recipe.instructions.join(' ') : recipe?.instructions || ''}`.toLowerCase();
  return HVAC_DOMAIN_TERMS.some(term => text.includes(term));
}

function buildDefaultHvacProjects(seedIngredients: string[], count: number) {
  const safe = seedIngredients.length > 0 ? seedIngredients : ['air filter', 'manifold gauge', 'thermostat wire', 'refrigerant line'];
  const defaults = [
    {
      title: 'Airflow Verification & Filter Service',
      ingredients: [safe[0] || 'air filter', 'manometer', 'return grille'],
      instructions: ['Inspect filter condition and fitment.', 'Measure return and supply static pressure.', 'Replace filter and confirm airflow improvement.'],
      equipment: ['manometer', 'screwdriver', 'flashlight'],
      healthTags: ['Safety', 'Maintenance']
    },
    {
      title: 'Thermostat Control Circuit Check',
      ingredients: [safe[1] || 'thermostat wire', 'thermostat', 'control board'],
      instructions: ['Verify R/C power at thermostat terminals.', 'Check call signals for Y, G, and W.', 'Confirm system response and correct setpoint operation.'],
      equipment: ['multimeter', 'insulated screwdriver'],
      healthTags: ['Controls', 'Electrical']
    },
    {
      title: 'Refrigerant Charge Diagnostic',
      ingredients: [safe[2] || 'refrigerant line', 'service port caps', 'coil'],
      instructions: ['Connect gauges and record operating pressures.', 'Measure line temperatures to calculate superheat/subcooling.', 'Document findings and recommended charge adjustment.'],
      equipment: ['manifold gauge set', 'temperature clamps', 'PPE'],
      healthTags: ['Refrigeration', 'Safety']
    },
    {
      title: 'Duct Leakage Quick Audit',
      ingredients: [safe[3] || 'duct section', 'mastic', 'foil tape'],
      instructions: ['Inspect joints and seams for visible leakage.', 'Seal key leakage points with approved materials.', 'Re-check airflow balance at main branches.'],
      equipment: ['smoke pen', 'duct tape measure', 'PPE'],
      healthTags: ['Airflow', 'Quality']
    }
  ];

  return defaults.slice(0, Math.max(1, count));
}

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
  const matchingIngredients = recipe.ingredients.filter(recipeIng => 
    cupboard.some(cupboardIng => fuzzyMatch(recipeIng, cupboardIng))
  ).length;
  
  score += matchingIngredients * 2;
  
  // 2. Penalize based on missing equipment
  if (kitchenSetup && kitchenSetup in KITCHEN_EQUIPMENT) {
    const availableEquipment = KITCHEN_EQUIPMENT[kitchenSetup as KitchenSetup];
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
  
  // 3. Bonus for matching talent tree equipment (if talents are enabled and a tree is selected)
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    const hasPreferredEquipment = (recipe.equipment || []).some(eq => 
      preferredEquipment.some(pref => eq.toLowerCase().includes(pref))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { RecipeCard } from '../components/SystemMatcherModal';

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

// HVAC skill tag classification based on project spec metrics
const SKILL_TAG_THRESHOLDS = {
  'Safety': { saturatedFat: 0 },        // energy draw awareness
  'Precision': { sugars: 0 },            // precision requirement
  'Efficiency': { omega3: 0 },           // system efficiency focus
  'Quality': { fiber: 0 },              // durability/quality focus
  'Compliance': { cholesterol: 0 },      // regulatory/maintenance compliance
  'Diagnostics': { carbs: 0 },           // complexity/diagnostic skill
  'Documentation': { sodium: 0 },        // cost documentation
  'Maintenance': { phosphorus: 0 }       // weight/physical maintenance
};

function getHealthTags(specs: KeyNutrients): string[] {
  const tags: string[] = [];
  
  // Assign HVAC skill tags based on project spec metrics
  if ((specs.saturatedFat || 0) > 0) tags.push('Safety');
  if ((specs.sugars || 0) > 0) tags.push('Precision');
  if ((specs.omega3 || 0) > 0) tags.push('Efficiency');
  if ((specs.fiber || 0) > 0) tags.push('Quality');
  if ((specs.cholesterol || 0) > 0) tags.push('Compliance');
  if ((specs.carbs || 0) > 2) tags.push('Diagnostics');
  
  if (tags.length === 0) {
    tags.push('Safety');
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
  const normalizedIngredients = ingredients.length > 0
    ? ingredients
    : ['air filter', 'thermostat wire', 'refrigerant line', 'duct section', 'contactor'];

  // 2. Build the Anthropic prompt with enhanced instructions
  const basePrompt = promptTemplate(numRecipes, normalizedIngredients);
  
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

${dietaryPrefs.length > 0 ? `Certification preferences: ${dietaryPrefs.join(', ')}` : ''}
${cuisinePrefs.length > 0 ? `Specialization focus: ${cuisinePrefs.join(', ')}` : ''}
${userKitchenSetup ? `Work setup: ${userKitchenSetup}` : ''}
${talentTreePrompt}

Return the projects as a JSON array with the following structure for each project:
{
  "title": "Project Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["equipment 1", "equipment 2"],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary tools, machines, or instruments needed to complete the project (e.g., "multimeter", "manifold gauge", "vacuum pump", "recovery machine").
ABSOLUTE CONSTRAINTS: Results must be HVAC-specific only. Never return cooking, food prep, woodworking, generic DIY crafts, or carpentry projects.
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
    return generateFallbackRecipes(userId, normalizedIngredients, numRecipes);
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
    return generateFallbackRecipes(userId, normalizedIngredients, numRecipes);
  }

  const hvacRecipes = recipes.filter(isHVACProject);
  const candidateRecipes = hvacRecipes.length > 0 ? hvacRecipes : buildDefaultHvacProjects(normalizedIngredients, numRecipes);

  // 4. Score and sort recipes based on user's cupboard, kitchen setup, and talent tree
  const scoredRecipes = candidateRecipes
    .map(recipe => ({
      ...recipe,
      score: scoreRecipe(
        {
          ...recipe,
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          equipment: Array.isArray(recipe.equipment) ? recipe.equipment : []
        },
        normalizedIngredients,
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
        healthTags: ['Safety']
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

For equipment, list all necessary tools, machines, or instruments needed to complete the project (e.g., "multimeter", "manifold gauge", "vacuum pump", "recovery machine").
ABSOLUTE CONSTRAINTS: Results must be HVAC-specific only. Never return cooking, food prep, woodworking, generic DIY crafts, or carpentry projects.
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
    const isValid = r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.instructions) && isHVACProject(r);
    if (!isValid) {
      console.warn('Invalid recipe format:', r);
    }
    return isValid;
  });

  const finalRecipes = validRecipes.length > 0 ? validRecipes : buildDefaultHvacProjects(ingredients, count);

  // 3. For each recipe, call Unsplash in parallel
  const imagePromises = finalRecipes.map(async (r) => {
    const q = encodeURIComponent(r.title || r.ingredients?.[0] || 'hvac service');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758';
  });
  const images = await Promise.all(imagePromises);

  // 4. Return RecipeCards
  return finalRecipes.slice(0, count).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
