import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';
import { fetchNutritionData, getKeyNutrients } from './nutritionService';
import { KeyNutrients } from '../types/nutrition';

// Define equipment available for each dock setup
const DOCK_EQUIPMENT = {
  'Dorm Life': ['microwave', 'kettle', 'toaster', 'mini-fridge'],
  'Minimalist': ['pot', 'pan', 'knife', 'cutting board', 'stove'],
  'Apartment Dock': ['oven', 'stove', 'basic utensils', 'baking sheets'],
  'Outdoor Grilling': ['grill', 'tongs', 'grill brush', 'meat thermometer'],
  'Home Dispatcher': ['blender', 'industrial processor', 'mixer', 'knives', 'oven', 'stove'],
  'Full Dispatcher\'s Dock': ['all equipment']
} as const;

// Define equipment associated with each talent tree
const TALENT_TREE_EQUIPMENT = {
  'Cast Iron Champion': ['cast iron', 'dutch oven', 'skillet'],
  'Grilling Heavy Weight': ['grill', 'smoker', 'charcoal', 'gas grill'],
  'Baking Warlock': ['stand mixer', 'baking sheet', 'pastry brush', 'rolling pin']
} as const;

type DockSetup = keyof typeof DOCK_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

const ROUTE_PROMPTS = {
  new_to_cooking: (numRoutes: number, items: string[]) => 
    `You are a patient trade instructor. Create ${numRoutes} simple beginner projects using available materials/components from: ${items.join(", ")}. 
    RULES:
    1. Use only 2-3 required materials/components per project
    2. Only basic entry-level methods
    3. Very detailed step-by-step instructions
    4. Keep completion time under 20 minutes when possible
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`,

  home_cook: (numRoutes: number, items: string[]) => 
    `You are a helpful trade coach. Create ${numRoutes} intermediate projects for someone comfortable with fundamentals using materials/components from: ${items.join(", ")}.
    RULES:
    1. Use 3-4 required materials/components per project
    2. Standard trade methods
    3. Clear instructions
    4. Keep completion time under 30 minutes when possible
    5. Include necessary tools/equipment for each project
    6. Add relevant skill tags from: Safety, Precision, Efficiency, Quality, Compliance, Documentation`,

  dock_confident: (numRoutes: number, items: string[]) => 
    `You are an expert trade mentor. Create ${numRoutes} advanced projects for an experienced learner using materials/components from: ${items.join(", ")}.
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
    dock_setup?: string;
  };
}

// Helper function for fuzzy matching items
function fuzzyMatch(item1: string, item2: string): boolean {
  const normalize = (str: string) => str.toLowerCase().trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');    // Normalize whitespace
    
  const norm1 = normalize(item1);
  const norm2 = normalize(item2);
  
  // Check for direct inclusion or common variations
  return norm1.includes(norm2) || 
         norm2.includes(norm1) ||
         norm1.split(' ').some(word => norm2.includes(word)) ||
         norm2.split(' ').some(word => norm1.includes(word));
}

// Score a route based on user's inventory, preferences, dock setup, and talent tree
function scoreRoute(
  route: RouteCard, 
  inventory: string[],
  dockSetup?: string,
  talentTree?: string | null,
  talentsEnabled: boolean = false
): number {
  let score = 0;
  
  // 1. Score based on matching items (higher weight)
  const matchingItems = route.items.filter(routeIng => 
    inventory.some(inventoryIng => fuzzyMatch(routeIng, inventoryIng))
  ).length;
  
  score += matchingItems * 2;
  
  // 2. Penalize based on missing equipment
  if (dockSetup && dockSetup in DOCK_EQUIPMENT) {
    const availableEquipment = DOCK_EQUIPMENT[dockSetup as DockSetup];
    const requiredEquipment = route.equipment || [];
    
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
    const hasPreferredEquipment = (route.equipment || []).some(eq => 
      preferredEquipment.some(pref => eq.toLowerCase().includes(pref))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { RouteCard } from '../components/RouteMatcherModal';

export interface RouteMatchOptions {
  userId: string;
  items: string[];
  numRoutes?: number;
  dockSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
}

// Helper to estimate route nutrition
async function calculateRouteNutrition(
  items: string[]
): Promise<KeyNutrients> {
  console.log('Calculating nutrition for items:', items);
  
  try {
    const nutritionData = await Promise.all(
      items.map(item => fetchNutritionData(item))
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
    
    nutritionData.forEach((cargo, index) => {
      if (cargo) {
        console.log(`__PROTECT_CARGO__ ${index}: ${cargo.name}`, cargo.nutrients);
        
        const nutrients = getKeyNutrients(cargo.nutrients);
        console.log(`Key nutrients for ${cargo.name}:`, nutrients);
        
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
    console.error('Error in calculateRouteNutrition:', error);
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

export async function fetchRoutesWithImages({
  userId,
  items,
  numRoutes = 5,
  dockSetup: userDockSetup,
  talentsEnabled = false,
  talentTree = null
}: RouteMatchOptions): Promise<RouteCard[]> {
  // 1. Get user preferences and profile
  const [{ experienceLevel }, profile] = await Promise.all([
    getUserPreferences(userId),
    getUserProfile(userId)
  ]);

  const promptTemplate = ROUTE_PROMPTS[experienceLevel] || ROUTE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  // 2. Build the Anthropic prompt with enhanced instructions
  const basePrompt = promptTemplate(numRoutes, items);
  
  // Get preferences
  const dietaryPrefs = profile?.dietary || [];
  const cuisinePrefs = profile?.cuisine || [];
  const dockSetup = profile?.dock_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" talent tree. Prioritize projects that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate projects that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${dietaryPrefs.length > 0 ? `Dietary preferences: ${dietaryPrefs.join(', ')}` : ''}
${cuisinePrefs.length > 0 ? `Cuisine preferences: ${cuisinePrefs.join(', ')}` : ''}
${userDockSetup ? `Dock setup: ${userDockSetup}` : ''}
${talentTreePrompt}

Return the projects as a JSON array with the following structure for each project:
{
  "title": "Project Name",
  "items": ["item 1", "item 2"],
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
      apiKeyIdentifier: 'route',
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500, // Increased to handle equipment field
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', anthropicData);
    return generateFallbackRoutes(userId, items, numRoutes);
  }

  let routes;
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
    
    routes = JSON.parse(jsonText);
    
    if (!Array.isArray(routes)) throw new Error('Response not an array');
  } catch (err: unknown) {
    console.error('Failed to parse routes:', err);
    console.log('Raw content:', anthropicData.content[0].text);
    console.log('Error at position:', err instanceof Error ? err.message : String(err));
    return generateFallbackRoutes(userId, items, numRoutes);
  }

  // 4. Score and sort routes based on user's inventory, dock setup, and talent tree
  const scoredRoutes = routes
    .map(route => ({
      ...route,
      score: scoreRoute(
        {
          ...route,
          items: Array.isArray(route.items) ? route.items : [],
          equipment: Array.isArray(route.equipment) ? route.equipment : []
        },
        items,
        dockSetup,
        talentTree,
        talentsEnabled
      )
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, numRoutes);

  // 5. Fetch images for top routes
  const imagePromises = scoredRoutes.map(async (route) => {
    try {
      const res = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(route.title)}&client_id=${unsplashKey}`
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
  const routesWithNutrition = await Promise.all(scoredRoutes.map(async route => {
    try {
      const nutrition = await calculateRouteNutrition(route.items);
      const healthTags = getHealthTags(nutrition);
      return {
        ...route,
        nutrition,
        healthTags
      };
    } catch (error) {
      console.error('Error calculating nutrition:', error);
      return {
        ...route,
        healthTags: ['Heart Healthy']
      };
    }
  }));

  // 7. Return scored route cards with images
  return routesWithNutrition.map((route, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: route.title,
    image: images[i],
    items: Array.isArray(route.items) ? route.items : [],
    instructions: Array.isArray(route.instructions) ? route.instructions.join('\n') : '',
    equipment: Array.isArray(route.equipment) ? route.equipment : [],
    healthTags: route.healthTags,
    nutrition: route.nutrition
  }));
}

export async function generateFallbackRoutes(userId: string, items: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = ROUTE_PROMPTS[experienceLevel] || ROUTE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, items)}

Format your response as a JSON array of project objects. Each project object MUST have these exact fields:
{
  "title": "Project Name",
  "items": ["item 1", "item 2", ...],
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
      apiKeyIdentifier: 'route',
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
  let routes: any[] = [];
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
      routes = JSON.parse(match[0]);
      console.log('Parsed routes:', routes);
    } else {
      console.error('No JSON array found in response:', responseText);
      throw new Error('No route data found in API response');
    }
  } catch (error) {
    console.error('Error parsing route data:', error);
    throw new Error('Failed to parse route data from API response');
  }

  // Validate route format
  routes = Array.isArray(routes) ? routes : [];
  const validRoutes = routes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.items) && Array.isArray(r.instructions);
    if (!isValid) {
      console.warn('Invalid route format:', r);
    }
    return isValid;
  });

  if (validRoutes.length === 0) {
    console.error('No valid routes found in response');
    throw new Error('No valid routes found in API response');
  }

  // 3. For each route, call Unsplash in parallel
  const imagePromises = validRoutes.map(async (r) => {
    const q = encodeURIComponent(r.title || r.items?.[0] || 'shipment');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';
  });
  const images = await Promise.all(imagePromises);

  // 4. Return RouteCards
  return validRoutes.slice(0, count).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    items: Array.isArray(r.items) ? r.items : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
