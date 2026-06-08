import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';

// Define equipment available for each dock setup
const DOCK_EQUIPMENT = {
  'Entry Level': ['hand truck', 'pallet jack', 'shrink wrap', 'tape gun'],
  'Small Warehouse': ['pallet jack', 'hand truck', 'dock plate', 'strapping tool', 'scale'],
  'Mid-Size Facility': ['sit-down forklift', 'pallet jack', 'dock leveler', 'RF scanner', 'stretch wrapper'],
  'Cross-Dock Terminal': ['reach truck', 'conveyor', 'RF scanner', 'dock leveler', 'yard jockey'],
  'Full Distribution Center': ['all equipment']
} as const;

// Define equipment associated with each talent tree
const TALENT_TREE_EQUIPMENT = {
  'Freight Handler': ['pallet jack', 'hand truck', 'dock plate', 'strapping tool'],
  'Forklift Operator': ['sit-down forklift', 'reach truck', 'order picker', 'clamp truck'],
  'Dispatch Coordinator': ['TMS software', 'RF scanner', 'route planner', 'load board']
} as const;

type DockSetup = keyof typeof DOCK_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;
const DEFAULT_LOGISTICS_IMAGE = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d';
const CULINARY_TERMS = /(recipe|cook|bake|grill|soup|salad|pasta|bread|kitchen|ingredient|meal|oven|crouton|chef|food|dish|sauce|marinade)/i;
const LOGISTICS_TERMS = /(logistics|freight|truck|trucking|warehouse|dock|shipment|shipping|cargo|pallet|forklift|carrier|route|dispatch|bol|load|ltl|ftl|cross-dock|inventory|supply chain|rf scanner|dock leveler|reefer|hazmat|yard|delivery)/i;

const ROUTE_PROMPTS = {
  new_to_logistics: (numRoutes: number, items: string[]) => 
    `You are a patient logistics instructor specializing in TRUCKING, FREIGHT, and WAREHOUSE operations. Create ${numRoutes} simple beginner shipping/freight procedures using these available cargo items or materials: ${items.join(", ")}.
    IMPORTANT: All results MUST be about trucking, freight shipping, warehouse operations, or supply chain logistics. Do NOT create cooking recipes, construction projects, or anything outside of logistics.
    RULES:
    1. Use only 2-3 cargo items per shipment procedure
    2. Only basic entry-level freight handling methods (e.g., LTL shipment, basic palletizing, dock receiving)
    3. Very detailed step-by-step instructions covering BOL prep, freight class, loading, and documentation
    4. Keep estimated dock time under 20 minutes when possible
    5. Include necessary dock equipment for each procedure (e.g., pallet jack, hand truck, dock plate, strapping tool)
    6. Add relevant skill tags from: Safety, DOT Compliance, Load Planning, Documentation, Freight Class, Temperature Control`,

  apprentice_dispatcher: (numRoutes: number, items: string[]) => 
    `You are a helpful logistics coach specializing in TRUCKING, FREIGHT, and WAREHOUSE operations. Create ${numRoutes} intermediate shipping/freight procedures for someone comfortable with dock fundamentals using these cargo items or materials: ${items.join(", ")}.
    IMPORTANT: All results MUST be about trucking, freight shipping, warehouse operations, or supply chain logistics. Do NOT create cooking recipes, construction projects, or anything outside of logistics.
    RULES:
    1. Use 3-4 cargo items per shipment procedure
    2. Standard freight methods (e.g., FTL routing, cross-dock transfer, multi-stop consolidation)
    3. Clear instructions covering carrier selection, route optimization, and freight documentation
    4. Keep estimated dock time under 30 minutes when possible
    5. Include necessary equipment for each procedure (e.g., forklift, RF scanner, dock leveler, stretch wrapper)
    6. Add relevant skill tags from: Safety, DOT Compliance, Load Planning, Documentation, Freight Class, Temperature Control`,

  dock_confident: (numRoutes: number, items: string[]) => 
    `You are an expert logistics mentor specializing in TRUCKING, FREIGHT, and WAREHOUSE operations. Create ${numRoutes} advanced shipping/freight procedures for an experienced dock worker using these cargo items or materials: ${items.join(", ")}.
    IMPORTANT: All results MUST be about trucking, freight shipping, warehouse operations, or supply chain logistics. Do NOT create cooking recipes, construction projects, or anything outside of logistics.
    RULES:
    1. Use 4+ cargo items per shipment procedure
    2. Can include advanced logistics techniques (e.g., hazmat routing, reefer load planning, intermodal transfer, cross-border customs)
    3. Professional-style instructions with industry terminology
    4. Focus on efficiency, compliance, and cost optimization
    5. Include necessary equipment for each procedure (e.g., reach truck, yard jockey, TMS software, load board)
    6. Add relevant skill tags from: Safety, DOT Compliance, Load Planning, Documentation, Freight Class, Temperature Control`
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

function routeText(route: any): string {
  const items = Array.isArray(route?.items) ? route.items.join(' ') : '';
  const equipment = Array.isArray(route?.equipment) ? route.equipment.join(' ') : '';
  const instructions = Array.isArray(route?.instructions) ? route.instructions.join(' ') : String(route?.instructions || '');
  return `${route?.title || ''} ${items} ${equipment} ${instructions}`;
}

function isLogisticsRoute(route: any): boolean {
  const text = routeText(route);
  return !CULINARY_TERMS.test(text) && LOGISTICS_TERMS.test(text);
}

function localLogisticsFallback(items: string[], count: number): RouteCard[] {
  const itemPool = items.length > 0 ? items : ['palletized freight', 'shipping labels', 'stretch wrap', 'BOL packet'];
  return Array.from({ length: Math.max(1, count) }).map((_, idx) => {
    const a = itemPool[idx % itemPool.length];
    const b = itemPool[(idx + 1) % itemPool.length];
    return {
      id: `fallback-${Date.now()}-${idx}`,
      title: `Freight Procedure ${idx + 1}: ${a} + ${b}`,
      image: DEFAULT_LOGISTICS_IMAGE,
      items: [a, b],
      instructions: [
        'Verify shipment paperwork, PPE, dock assignment, and trailer condition before handling freight.',
        `Stage ${a} and ${b}, confirm labels, dimensions, weight, and freight class.`,
        'Build and secure the load with proper pallet pattern, wrap, straps, and weight distribution.',
        'Complete BOL/status updates, scan freight, and document exceptions or damage.'
      ].join('\n'),
      equipment: ['pallet jack', 'RF scanner', 'stretch wrapper', 'dock plate'],
      healthTags: ['Safety', 'DOT Compliance', 'Documentation']
    };
  });
}

function getHealthTags(items: string[]): string[] {
  const normalized = items.map(item => item.toLowerCase());
  const tags = new Set<string>();

  if (normalized.some(item => ['hazmat', 'placard', 'spill'].some(k => item.includes(k)))) {
    tags.add('Hazmat');
    tags.add('Safety');
    tags.add('DOT Compliance');
  }

  if (normalized.some(item => ['reefer', 'cold', 'temperature', 'insulated'].some(k => item.includes(k)))) {
    tags.add('Temperature Control');
  }

  if (normalized.some(item => ['bol', 'bill of lading', 'manifest', 'pod', 'label'].some(k => item.includes(k)))) {
    tags.add('Documentation');
  }

  if (normalized.some(item => ['pallet', 'load', 'strapping', 'dock'].some(k => item.includes(k)))) {
    tags.add('Load Planning');
    tags.add('Freight Class');
  }

  if (!tags.size) {
    tags.add('Safety');
    tags.add('Documentation');
  }

  return Array.from(tags);
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
  
  // Get dock setup from profile
  const dockSetup = profile?.dock_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" talent tree. Prioritize projects that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate projects that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${userDockSetup ? `Dock setup: ${userDockSetup}` : ''}
${talentTreePrompt}
CRITICAL: Generate only trucking, freight, warehouse, shipping, or supply-chain logistics procedures. Do NOT generate food, meal, cooking, chef, kitchen, or culinary content.

Return the procedures as a JSON array with the following structure for each procedure:
{
  "title": "Procedure Name (e.g., 'LTL Palletized Shipment - Northeast Corridor')",
  "items": ["cargo item 1", "cargo item 2"],
  "instructions": ["Step 1: ...", "Step 2: ..."],
  "equipment": ["pallet jack", "strapping tool", "dock plate"],
  "healthTags": ["Safety", "DOT Compliance"]
}

For equipment, list all necessary dock and warehouse equipment needed (e.g., "pallet jack", "forklift", "RF scanner", "dock leveler", "stretch wrapper").
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
    return generateFallbackRoutes(userId, items, numRoutes);
  }

  let routes;
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
    
    routes = JSON.parse(jsonText);
    
    if (!Array.isArray(routes)) throw new Error('Response not an array');
  } catch (err: unknown) {
    console.error('Failed to parse routes:', err);
    console.log('Raw content:', anthropicData.content[0].text);
    console.log('Error at position:', err instanceof Error ? err.message : String(err));
    return generateFallbackRoutes(userId, items, numRoutes);
  }

  const logisticsRoutes = routes.filter(isLogisticsRoute);
  if (logisticsRoutes.length === 0) {
    console.warn('Logistics matcher rejected non-logistics/cooking response; using local fallback.');
    return localLogisticsFallback(items, numRoutes);
  }

  // 4. Score and sort routes based on user's inventory, dock setup, and talent tree
  const scoredRoutes = logisticsRoutes
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
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(route.title + ' warehouse logistics')}&client_id=${unsplashKey}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.small || DEFAULT_LOGISTICS_IMAGE;
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return DEFAULT_LOGISTICS_IMAGE;
    }
  });

  const images = await Promise.all(imagePromises);

  // 6. Add logistics tags
  const routesWithTags = scoredRoutes.map(route => ({
    ...route,
    healthTags: getHealthTags(Array.isArray(route.items) ? route.items : [])
  }));

  // 7. Return scored route cards with images
  return routesWithTags.map((route, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: route.title,
    image: images[i],
    items: Array.isArray(route.items) ? route.items : [],
    instructions: Array.isArray(route.instructions) ? route.instructions.join('\n') : '',
    equipment: Array.isArray(route.equipment) ? route.equipment : [],
    healthTags: route.healthTags
  }));
}

export async function generateFallbackRoutes(userId: string, items: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = ROUTE_PROMPTS[experienceLevel] || ROUTE_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, items)}

CRITICAL: Generate only trucking, freight, warehouse, shipping, or supply-chain logistics procedures. Do NOT generate food, meal, cooking, chef, kitchen, or culinary content.

Format your response as a JSON array of shipping procedure objects. Each object MUST have these exact fields:
{
  "title": "Procedure Name (e.g., 'FTL Reefer Load - Cold Chain Compliance')",
  "items": ["cargo item 1", "cargo item 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["pallet jack", "forklift", ...],
  "healthTags": ["Safety", "DOT Compliance"]
}

For equipment, list all necessary dock and warehouse equipment needed (e.g., "pallet jack", "forklift", "RF scanner", "dock leveler", "stretch wrapper").
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
    return localLogisticsFallback(items, count);
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
    return localLogisticsFallback(items, count);
  }

  // Validate route format
  routes = Array.isArray(routes) ? routes : [];
  const validRoutes = routes.filter(r => {
    const isValid = r && r.title && Array.isArray(r.items) && Array.isArray(r.instructions) && isLogisticsRoute(r);
    if (!isValid) {
      console.warn('Invalid route format:', r);
    }
    return isValid;
  });

  if (validRoutes.length === 0) {
    console.error('No valid routes found in response');
    return localLogisticsFallback(items, count);
  }

  // 3. For each route, call Unsplash in parallel
  const imagePromises = validRoutes.map(async (r) => {
    const q = encodeURIComponent(r.title || r.items?.[0] || 'freight truck loading dock');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || DEFAULT_LOGISTICS_IMAGE;
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
