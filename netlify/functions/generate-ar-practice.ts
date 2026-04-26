import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_RECIPE_KEY,
});

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
    const { lessonTitle, lessonContent } = JSON.parse(event.body);

    if (!lessonTitle) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Lesson title required' }),
      };
    }

    const prompt = `You are an expert culinary instructor creating an AR (Augmented Reality) practice session for students who don't have access to a kitchen or tools.

Generate a detailed AR practice scene for this lesson:
LESSON: ${lessonTitle}
${lessonContent ? `CONTENT: ${lessonContent}` : ''}

SPECIAL INSTRUCTIONS FOR KNIFE SHARPENING:
- Focus on the 20-degree angle (this is critical)
- Include sensory details (feel of the stone, sound of the blade, visual of water)
- Emphasize the sweeping motion (heel to tip)
- Include the burr detection step
- Make it old-school and traditional (water stone, no gadgets)
- Use AR overlays for angle guides, motion paths, and stroke counters

Create a JSON response with this structure:
{
  "lesson": "lesson name",
  "setup": {
    "workspace": "description of virtual workspace setup",
    "requiredTools": ["tool1", "tool2"],
    "requiredIngredients": ["ingredient1", "ingredient2"]
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
          "label": "90° angle",
          "size": "small|medium|large",
          "coordinates": {"x": 0, "y": 0, "z": 0}
        }
      ],
      "tools": ["tools visible in this step"],
      "ingredients": ["ingredients visible in this step"],
      "keyPoints": ["important things to remember"]
    }
  ],
  "tips": ["mental rehearsal tips", "visualization cues"]
}

IMPORTANT:
- This is for students WITHOUT physical tools
- AR will show virtual kitchen, tools, and ingredients
- Focus on visualization and mental rehearsal
- Include sensory details (feel, see, hear)
- Make it accessible and encouraging
- Keep steps clear and sequential
- Include proper technique details

Generate the complete AR practice scene now:`;

    const message = await (anthropic as any).messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the JSON response from Claude
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const arScene: ARPracticeScene = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        scene: arScene,
      }),
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
