import { DisciplineSkin } from '../disciplineSkinConfig';

/**
 * AI-powered discipline skin generator
 * Takes discipline name and context, returns complete DisciplineSkin configuration
 */

interface GenerateDisciplineSkinParams {
  disciplineName: string;
  additionalContext?: string;
}

const DISALLOWED_PROMPT_TERMS = [
  'porn',
  'pornography',
  'sex',
  'sexual',
  'xxx',
  'nude',
  'escort',
  'onlyfans',
  'fetish',
  'adult content',
];

export interface AIGeneratedSkin {
  name: string;
  icon: string;
  modules: {
    workspace: string;
    notebook: string;
    community: string;
    school: string;
  };
  assistant: {
    name: string;
    greeting: string;
    systemPrompt: string;
    quickActions: string[];
  };
  content: {
    metricLabel: string;
    table: string;
    approvalLabel: string;
  };
  people: {
    facultyTitle: string;
    defaultProgram: string;
    mockFaculty: { name: string; role: string; courses: string }[];
    mockAlumniTitles: string[];
    emailDomain: string;
  };
}

const CULINARY_TERMS = [
  'kitchen',
  'culinary',
  'chef',
  'cookbook',
  'recipe',
  'recipes',
  "chef's corner",
];

/**
 * Returns culinary terms detected anywhere in a generated skin payload.
 * Custom disciplines should avoid legacy culinary language unless intentionally configured.
 */
export function findCulinaryLeakage(payload: unknown): string[] {
  const detected = new Set<string>();

  const visit = (value: unknown) => {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      CULINARY_TERMS.forEach((term) => {
        if (normalized.includes(term)) {
          detected.add(term);
        }
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (value && typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach(visit);
    }
  };

  visit(payload);
  return Array.from(detected);
}

/**
 * Generate a slug from discipline name
 * e.g. "Welding Technology" -> "welding-technology"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the AI prompt for generating discipline skin
 */
function buildAIPrompt(disciplineName: string, additionalContext?: string): string {
  return `You are a curriculum design assistant helping create a new trade education program.

Generate a complete discipline configuration for: "${disciplineName}"
${additionalContext ? `Additional context: ${additionalContext}` : ''}

You must return ONLY valid JSON (no markdown, no explanations) with this exact structure:

{
  "name": "Display name of the discipline",
  "icon": "Single emoji that represents this trade",
  "modules": {
    "workspace": "Name for hands-on practice area (like 'My Kitchen' for culinary)",
    "notebook": "Name for personal learning journal (like 'My Cookbook' for culinary)",
    "community": "Name for peer discussion area (like 'Chef's Corner' for culinary)",
    "school": "Name for formal coursework area (like 'Culinary School' for culinary)"
  },
  "assistant": {
    "name": "Friendly AI assistant name (like 'Chef Freddie' for culinary)",
    "greeting": "Welcoming message introducing the assistant and what it can help with (2-3 sentences)",
    "systemPrompt": "System prompt defining the AI's role as a curriculum assistant for this trade (2-3 sentences, focus on practical skills and industry standards)",
    "quickActions": [
      "Example prompt 1 for creating assignments",
      "Example prompt 2 for lesson planning",
      "Example prompt 3 for assessment rubrics",
      "Example prompt 4 for curriculum mapping"
    ]
  },
  "content": {
    "metricLabel": "What students create (like 'Recipes' for culinary, 'Projects' for construction)",
    "table": "Database table name in snake_case (like 'user_cookbook' for culinary)",
    "approvalLabel": "Label for content approval (like 'Recipe Approval' for culinary)"
  },
  "people": {
    "facultyTitle": "Title for instructors (like 'Chef' for culinary, 'Master Electrician' for electrical)",
    "defaultProgram": "Full program name (like 'Culinary Arts' for culinary)",
    "mockFaculty": [
      {"name": "Realistic instructor name 1", "role": "Senior instructor title", "courses": "Example courses they teach"},
      {"name": "Realistic instructor name 2", "role": "Junior instructor title", "courses": "Example courses they teach"}
    ],
    "mockAlumniTitles": [
      "Realistic job title 1 for graduates",
      "Realistic job title 2 for graduates",
      "Realistic job title 3 for graduates",
      "Realistic job title 4 for graduates"
    ],
    "emailDomain": "realistic-domain.edu (use discipline name in domain)"
  }
}

Important guidelines:
- Use industry-appropriate terminology
- Make module names engaging and relevant to the trade
- Assistant name should be memorable and trade-related
- Quick actions should be specific to this discipline
- Mock data should feel authentic to the industry
- Keep all text professional but friendly
- Keep content safe for students and professional training organizations
- Refuse and avoid sexual, pornographic, violent, hateful, illegal, or exploitative content
- Return ONLY the JSON object, nothing else`;
}

function assertPromptSafety(disciplineName: string, additionalContext?: string): void {
  const joined = `${disciplineName} ${additionalContext || ''}`.toLowerCase();
  const badTerms = DISALLOWED_PROMPT_TERMS.filter((term) => joined.includes(term));

  if (badTerms.length > 0) {
    throw new Error(
      `Discipline request contains blocked content (${badTerms.join(', ')}). Use professional workforce training language only.`
    );
  }
}

/**
 * Call Anthropic API via Netlify proxy to generate discipline skin.
 */
export async function generateDisciplineSkin(
  params: GenerateDisciplineSkinParams
): Promise<AIGeneratedSkin> {
  const { disciplineName, additionalContext } = params;
  assertPromptSafety(disciplineName, additionalContext);

  const prompt = buildAIPrompt(disciplineName, additionalContext);

  try {
    const response = await fetch('/.netlify/functions/anthropic-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKeyIdentifier: 'add_discipline',
        model: 'claude-3-haiku-20240307',
        system: 'You are a curriculum design expert. Return only valid JSON, no markdown formatting.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Anthropic');
    }

    // Parse JSON response (remove markdown code blocks if present)
    let jsonString = aiResponse.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const generatedSkin: AIGeneratedSkin = JSON.parse(jsonString);

    // Validate required fields
    if (!generatedSkin.name || !generatedSkin.icon || !generatedSkin.modules) {
      throw new Error('AI generated incomplete skin configuration');
    }

    return generatedSkin;
  } catch (error) {
    console.error('Error generating discipline skin:', error);
    throw error;
  }
}

/**
 * Convert AI-generated skin to DisciplineSkin format
 */
export function convertToFullSkin(
  slug: string,
  aiSkin: AIGeneratedSkin
): Omit<DisciplineSkin, 'key'> {
  return {
    name: aiSkin.name,
    icon: aiSkin.icon,
    modules: aiSkin.modules,
    assistant: aiSkin.assistant,
    content: aiSkin.content,
    people: aiSkin.people,
  };
}
