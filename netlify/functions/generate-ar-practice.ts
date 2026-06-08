import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_RECIPE_KEY,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const DISCIPLINE_CONTEXTS: Record<string, string> = {
  welding: 'You are an expert welding instructor. Focus on electrode angles, arc length, travel speed, PPE, joint fit-up, machine settings, and bead quality. Use AR overlays for angle guides, motion paths, and amperage readouts.',
  culinary: 'You are an expert culinary instructor. Focus on knife skills, mise en place, cooking temperatures, timing, plating, and food safety. Use AR overlays for knife angle guides, temperature indicators, and timer overlays.',
  construction: 'You are an expert construction instructor. Focus on measuring, marking, cutting angles, fastener placement, framing layouts, and safety. Use AR overlays for measurement guides, angle indicators, and layout lines.',
  automotive: 'You are an expert automotive technician instructor. Focus on diagnostic procedures, torque specs, fluid identification, component locations, and safety. Use AR overlays for torque values, fluid flow diagrams, and component labels.',
  hvac: 'You are an expert HVAC technician instructor. Focus on refrigerant handling, electrical diagnostics, airflow measurement, system charging, and safety. Use AR overlays for pressure/temperature charts, wiring diagrams, and airflow arrows.',
  plumbing: 'You are an expert plumbing instructor. Focus on pipe fitting, soldering, slope calculations, drain layouts, pressure testing, and code compliance. Use AR overlays for slope indicators, measurement guides, and solder flow visualization.',
  electrical: 'You are an expert electrical instructor. Focus on wire sizing, circuit protection, panel layout, conduit bending, voltage testing, and NEC code compliance. Use AR overlays for circuit diagrams, voltage readings, and wire color coding.',
  manufacturing: 'You are an expert manufacturing instructor. Focus on machine setup, toolpath planning, measurement and inspection, blueprint reading, and process sequences. Use AR overlays for dimension callouts, tolerance indicators, and toolpath visualizations.',
  logistics: 'You are an expert logistics instructor. Focus on picking procedures, load securing, forklift safety zones, inventory scanning, and documentation. Use AR overlays for pick path indicators, weight limit warnings, and safety zone boundaries.',
};

interface AROverlay {
  type: 'line' | 'circle' | 'grid' | 'text' | 'arrow' | 'hand' | 'tool';
  position?: string;
  angle?: number;
  color?: string;
  label?: string;
  size?: string;
  coordinates?: { x: number; y: number; z: number };
}

interface ARStep {
  id: number;
  instruction: string;
  duration: string;
  overlays: AROverlay[];
  tools: string[];
  ingredients: string[];
  keyPoints: string[];
}

interface ARPracticeScene {
  lesson: string;
  setup: {
    workspace: string;
    requiredTools: string[];
    requiredIngredients: string[];
  };
  steps: ARStep[];
  tips: string[];
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { discipline = 'welding', lessonId, lessonTitle, lessonContent } = JSON.parse(event.body);

    if (!lessonTitle) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lesson title required' }),
      };
    }

    const effectiveLessonId = lessonId || lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check cache first — return instantly if already generated
    try {
      const { data: cached } = await supabase
        .from('ar_scenes_cache')
        .select('scene_json')
        .eq('discipline', discipline)
        .eq('lesson_id', effectiveLessonId)
        .single();

      if (cached?.scene_json) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, scene: cached.scene_json, fromCache: true }),
        };
      }
    } catch (_) {
      // Cache miss or table not ready — fall through to generation
    }

    // Generate with discipline-aware prompt
    const disciplineContext = DISCIPLINE_CONTEXTS[discipline] || DISCIPLINE_CONTEXTS.welding;

    const prompt = `${disciplineContext}

Generate a detailed AR practice scene for this lesson:
LESSON: ${lessonTitle}
${lessonContent ? `CONTENT: ${lessonContent}` : ''}

Create a JSON response with this structure:
{
  "lesson": "lesson name",
  "setup": {
    "workspace": "description of virtual workspace setup",
    "requiredTools": ["tool1", "tool2"],
    "requiredIngredients": ["material1", "material2"]
  },
  "steps": [
    {
      "id": 1,
      "instruction": "Clear, detailed instruction",
      "duration": "30s",
      "overlays": [
        {
          "type": "line|circle|grid|text|arrow|hand|tool",
          "position": "center|left|right|top|bottom",
          "angle": 90,
          "color": "#3B82F6",
          "label": "descriptive label",
          "size": "small|medium|large",
          "coordinates": {"x": 0, "y": 0, "z": 0}
        }
      ],
      "tools": ["tools visible in this step"],
      "ingredients": ["materials visible in this step"],
      "keyPoints": ["important things to remember"]
    }
  ],
  "tips": ["mental rehearsal tips", "visualization cues"]
}

REQUIREMENTS:
- Generate 6-10 sequential steps covering the full procedure
- Students have NO physical tools — AR shows virtual environment
- Include sensory details (feel, see, hear) at each step
- Each step must have at least one AR overlay
- Include safety steps where relevant

Generate the complete AR practice scene now:`;

    const message = await (anthropic as any).messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const arScene: ARPracticeScene = JSON.parse(jsonMatch[0]);

    // Save to cache so every subsequent student gets it instantly
    try {
      await supabase.from('ar_scenes_cache').upsert({
        discipline,
        lesson_id: effectiveLessonId,
        lesson_title: lessonTitle,
        scene_json: arScene,
        model_version: 'claude-sonnet-4-5-20250929',
        generated_at: new Date().toISOString(),
      }, { onConflict: 'discipline,lesson_id' });
    } catch (_) {
      // Non-fatal — scene still returns even if cache write fails
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, scene: arScene, fromCache: false }),
    };
  } catch (error: any) {
    console.error('Error generating AR practice:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate AR practice scene',
        details: error.message,
      }),
    };
  }
}
