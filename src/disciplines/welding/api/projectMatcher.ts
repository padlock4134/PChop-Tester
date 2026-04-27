import { ExperienceLevel, DEFAULT_EXPERIENCE_LEVEL } from '../types/userPreferences';
import { getUserPreferences } from './userPreferences';
import { supabase } from './supabaseClient';
import { isSessionValid } from './userSession';

// Define equipment available for each shop setup
const SHOP_EQUIPMENT = {
  'Student Booth': ['stick welder', 'welding helmet', 'chipping hammer', 'wire brush'],
  'Home Garage': ['MIG welder', 'angle grinder', 'clamps', 'welding table', 'helmet'],
  'Fabrication Shop': ['MIG welder', 'TIG welder', 'plasma cutter', 'band saw', 'press brake'],
  'Pipe Welding': ['TIG welder', 'pipe stands', 'beveling machine', 'purge dam', 'pipe clamps'],
  'Full Production Shop': ['all equipment']
} as const;

// Define equipment associated with each talent tree
const TALENT_TREE_EQUIPMENT = {
  'MIG Specialist': ['MIG welder', 'wire feeder', 'shielding gas', 'spatter guard'],
  'TIG Master': ['TIG welder', 'filler rod', 'argon gas', 'tungsten electrode'],
  'Stick Welder': ['stick welder', 'electrode holder', 'welding rods', 'slag hammer']
} as const;

type ShopSetup = keyof typeof SHOP_EQUIPMENT;

const ANTHROPIC_API_URL = '/.netlify/functions/anthropic-proxy';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';
const unsplashKey = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

const PROJECT_PROMPTS = {
  new_to_welding: (numRecipes: number, ingredients: string[]) => 
    `You are a patient welding instructor. Create ${numRecipes} simple beginner welding projects using available materials from: ${ingredients.join(", ")}. 
    RULES:
    1. Use only 2-3 required materials per project
    2. Only basic welding methods (stick welding, simple MIG)
    3. Very detailed step-by-step instructions including safety
    4. Keep completion time under 30 minutes when possible
    5. Include necessary welding tools/equipment for each project
    6. Add relevant skill tags from: Safety, AWS Compliance, Weld Quality, Joint Prep, Heat Control, Inspection`,

  hobbyist_welder: (numRecipes: number, ingredients: string[]) => 
    `You are a helpful welding coach. Create ${numRecipes} intermediate welding projects for someone comfortable with fundamentals using materials from: ${ingredients.join(", ")}.
    RULES:
    1. Use 3-4 required materials per project
    2. Standard welding methods (MIG, TIG, flux-core)
    3. Clear instructions with weld specifications
    4. Keep completion time under 45 minutes when possible
    5. Include necessary welding tools/equipment for each project
    6. Add relevant skill tags from: Safety, AWS Compliance, Weld Quality, Joint Prep, Heat Control, Inspection`,

  shop_confident: (numRecipes: number, ingredients: string[]) => 
    `You are an expert welding mentor. Create ${numRecipes} advanced welding projects for an experienced welder using materials from: ${ingredients.join(", ")}.
    RULES:
    1. Use 4+ required materials per project
    2. Can include advanced techniques (TIG walking the cup, multi-pass, pipe welding)
    3. Professional-style instructions with WPS references
    4. Focus on weld quality and technique
    5. Include necessary welding tools/equipment for each project
    6. Add relevant skill tags from: Safety, AWS Compliance, Weld Quality, Joint Prep, Heat Control, Inspection`
};

async function getUserProfile(userId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('certifications, processes, shop_setup')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }

  return data as {
    certifications: string[];
    processes: string[];
    shop_setup?: string;
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

// Score a project based on user's inventory, shop setup, and talent tree
function scoreProject(
  project: ProjectCard, 
  materials: string[],
  shopSetup?: string,
  talentTree?: string | null,
  talentsEnabled: boolean = false
): number {
  let score = 0;
  
  // 1. Score based on matching materials (higher weight)
  const matchingMaterials = project.ingredients.filter(projMat => 
    materials.some(benchMat => fuzzyMatch(projMat, benchMat))
  ).length;
  
  score += matchingMaterials * 2;
  
  // 2. Penalize based on missing equipment
  if (shopSetup && shopSetup in SHOP_EQUIPMENT) {
    const availableEquipment = SHOP_EQUIPMENT[shopSetup as ShopSetup];
    const requiredEquipment = project.equipment || [];
    
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
    const hasPreferredEquipment = (project.equipment || []).some(eq => 
      preferredEquipment.some(pref => eq.toLowerCase().includes(pref))
    );
    
    if (hasPreferredEquipment) {
      // Add a significant bonus for matching talent tree equipment
      score += 5;
    }
  }
  
  return score;
}

import { ProjectCard } from '../components/PartMatcherModal';

export interface ProjectMatchOptions {
  userId: string;
  materials: string[];
  numProjects?: number;
  shopSetup?: string;
  talentsEnabled?: boolean;
  talentTree?: string | null;
}

// Assign welding skill tags based on material/project keywords
function getHealthTags(ingredients: string[]): string[] {
  const tags: string[] = [];
  const joined = ingredients.join(' ').toLowerCase();

  // Safety - always relevant for welding
  tags.push('Safety');

  if (/code|aws|certified|spec|wps|pqr|standard/.test(joined)) tags.push('AWS Compliance');
  if (/bead|penetration|undercut|porosity|fusion|pass|cap|root/.test(joined)) tags.push('Weld Quality');
  if (/bevel|chamfer|prep|fit.?up|tack|gap|root opening|joint/.test(joined)) tags.push('Joint Prep');
  if (/preheat|interpass|heat.?input|cool|temper|stress.?relief/.test(joined)) tags.push('Heat Control');
  if (/inspect|visual|dye.?penetrant|x.?ray|ultrasonic|mag.?particle|ndt/.test(joined)) tags.push('Inspection');

  return tags;
}

export async function fetchProjectsWithImages({
  userId,
  materials,
  numProjects = 5,
  shopSetup: userShopSetup,
  talentsEnabled = false,
  talentTree = null
}: ProjectMatchOptions): Promise<ProjectCard[]> {
  // 1. Get user preferences and profile
  const [{ experienceLevel }, profile] = await Promise.all([
    getUserPreferences(userId),
    getUserProfile(userId)
  ]);

  const promptTemplate = PROJECT_PROMPTS[experienceLevel] || PROJECT_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  // 2. Build the Anthropic prompt with enhanced instructions
  const basePrompt = promptTemplate(numProjects, materials);
  
  // Get shop setup from profile
  const shopSetup = profile?.shop_setup || '';
  
  // Add talent tree equipment preference to prompt
  let talentTreePrompt = '';
  if (talentsEnabled && talentTree && talentTree in TALENT_TREE_EQUIPMENT) {
    const preferredEquipment = TALENT_TREE_EQUIPMENT[talentTree as keyof typeof TALENT_TREE_EQUIPMENT];
    talentTreePrompt = `IMPORTANT: User has selected "${talentTree}" talent tree. Prioritize projects that use these methods/equipment: ${preferredEquipment.join(', ')}. Generate projects that showcase these tools and techniques.`;
  }

  const prompt = `${basePrompt}

${userShopSetup ? `Shop setup: ${userShopSetup}` : ''}
${talentTreePrompt}

Return the projects as a JSON array with the following structure for each project:
{
  "title": "Project Name (e.g., 'T-Joint Fillet Weld - 1/4 Mild Steel')",
  "ingredients": ["material 1", "material 2"],
  "instructions": ["Step 1", "Step 2"],
  "equipment": ["MIG welder", "angle grinder", "welding helmet"],
  "healthTags": ["Safety", "Weld Quality"]
}

For equipment, list all necessary welding tools and equipment needed (e.g., "MIG welder", "TIG torch", "angle grinder", "welding helmet", "clamps").
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
      max_tokens: 4096, // Generous token limit for 5 full project JSONs
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const anthropicData = await anthropicRes.json();
  if (!anthropicRes.ok) {
    console.error('Anthropic API error:', anthropicData);
    return generateFallbackProjects(userId, materials, numProjects);
  }

  let projects;
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
    
    projects = JSON.parse(jsonText);
    
    if (!Array.isArray(projects)) throw new Error('Response not an array');
  } catch (err: unknown) {
    console.error('Failed to parse projects:', err);
    console.log('Raw content:', anthropicData.content[0].text);
    console.log('Error at position:', err instanceof Error ? err.message : String(err));
    return generateFallbackProjects(userId, materials, numProjects);
  }

  // 4. Score and sort projects based on user's inventory, shop setup, and talent tree
  const scoredProjects = projects
    .map((proj: any) => ({
      ...proj,
      score: scoreProject(
        {
          ...proj,
          ingredients: Array.isArray(proj.ingredients) ? proj.ingredients : [],
          equipment: Array.isArray(proj.equipment) ? proj.equipment : []
        },
        materials,
        shopSetup,
        talentTree,
        talentsEnabled
      )
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, numProjects);

  // 5. Fetch images for top projects
  const imagePromises = scoredProjects.map(async (proj: any) => {
    try {
      const res = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(proj.title)}&client_id=${unsplashKey}`
      );
      const data = await res.json();
      return data.results?.[0]?.urls?.small || '';
    } catch (err) {
      console.error('Failed to fetch image:', err);
      return '';
    }
  });

  const images = await Promise.all(imagePromises);

  // 6. Add skill tags based on project keywords
  const projectsWithTags = scoredProjects.map((proj: any) => {
    const healthTags = getHealthTags(Array.isArray(proj.ingredients) ? proj.ingredients : []);
    return {
      ...proj,
      healthTags
    };
  });

  // 7. Return scored project cards with images
  return projectsWithTags.map((proj: any, i: number) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: proj.title,
    image: images[i],
    ingredients: Array.isArray(proj.ingredients) ? proj.ingredients : [],
    instructions: Array.isArray(proj.instructions) ? proj.instructions.join('\n') : '',
    equipment: Array.isArray(proj.equipment) ? proj.equipment : [],
    healthTags: proj.healthTags
  }));
}

export async function generateFallbackProjects(userId: string, materials: string[], count: number): Promise<any[]> {
  const { experienceLevel } = await getUserPreferences(userId);
  const promptTemplate = PROJECT_PROMPTS[experienceLevel] || PROJECT_PROMPTS[DEFAULT_EXPERIENCE_LEVEL];
  
  const prompt = `${promptTemplate(count, materials)}

Format your response as a JSON array of project objects. Each project object MUST have these exact fields:
{
  "title": "Project Name",
  "ingredients": ["material 1", "material 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "equipment": ["equipment 1", "equipment 2", ...],
  "healthTags": ["tag 1", "tag 2"]
}

For equipment, list all necessary welding tools and equipment needed (e.g., "MIG welder", "TIG torch", "angle grinder", "welding helmet", "clamps").
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
    throw new Error(`Anthropic API error: ${anthropicRes.status} ${anthropicRes.statusText}`);
  }

  const anthropicData = await anthropicRes.json();
  
  // Try to extract JSON from Claude's response
  let parsedProjects: any[] = [];
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
      parsedProjects = JSON.parse(match[0]);
      console.log('Parsed projects:', parsedProjects);
    } else {
      console.error('No JSON array found in response:', responseText);
      throw new Error('No project data found in API response');
    }
  } catch (error) {
    console.error('Error parsing project data:', error);
    throw new Error('Failed to parse project data from API response');
  }

  // Validate project format
  parsedProjects = Array.isArray(parsedProjects) ? parsedProjects : [];
  const validProjects = parsedProjects.filter(r => {
    const isValid = r && r.title && Array.isArray(r.ingredients) && Array.isArray(r.instructions);
    if (!isValid) {
      console.warn('Invalid project format:', r);
    }
    return isValid;
  });

  if (validProjects.length === 0) {
    console.error('No valid projects found in response');
    throw new Error('No valid projects found in API response');
  }

  // 3. For each project, call Unsplash in parallel
  const imagePromises = validProjects.map(async (r) => {
    const q = encodeURIComponent(r.title || r.ingredients?.[0] || 'welding');
    const res = await fetch(`${UNSPLASH_API_URL}?query=${q}&client_id=${unsplashKey}&orientation=landscape&per_page=1`);
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1';
  });
  const images = await Promise.all(imagePromises);

  // 4. Return ProjectCards
  return validProjects.slice(0, count).map((r, i) => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
    title: r.title,
    image: images[i],
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : '',
    equipment: Array.isArray(r.equipment) ? r.equipment : []
  }));
}
