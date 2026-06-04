// Content processor for curriculum uploads
// Extracts text from files and uses AI to map content to modules

const fetch = require('node-fetch');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { fileUrl, fileName, fileType, discipline } = JSON.parse(event.body);

    if (!fileUrl || !fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileUrl or fileName' })
      };
    }

    // Step 1: Extract text from file
    let extractedText = '';
    
    // Fetch the file as a buffer
    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.buffer();
    
    if (fileType === 'application/pdf') {
      // Extract text from PDF
      try {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to parse PDF file' })
        };
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from DOCX
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to parse DOCX file' })
        };
      }
    } else if (fileType.startsWith('text/')) {
      // Plain text files
      extractedText = fileBuffer.toString('utf-8');
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' })
      };
    }

    // Step 2: Build discipline-aware prompt for AI analysis
    const DISCIPLINE_PROMPTS = {
      hvac: {
        platform: 'an HVAC trade education platform',
        contentTypes: 'service report, assignment, lesson, diagnostic procedure, video',
        modules: {
          workspace: { key: 'workspace', name: 'My Shop', desc: 'Equipment inventories, component knowledge, shop setups, system configurations' },
          notebook: { key: 'notebook', name: 'My Spec Sheets', desc: 'Assignment templates, grading rubrics, spec sheet collections, video requirements' },
          school: { key: 'school', name: 'HVAC School', desc: 'Lessons, techniques, syllabus structures, learning objectives, EPA 608 prep' },
          community: { key: 'community', name: 'Tech Talk', desc: 'Demo videos, industry insights, live sessions, distributor partnerships' }
        }
      },
      culinary: {
        platform: 'a culinary education platform',
        contentTypes: 'recipe, assignment, lesson, technique, video',
        modules: {
          workspace: { key: 'workspace', name: 'My Kitchen', desc: 'Recipe databases, ingredient knowledge, kitchen setups, dietary mappings' },
          notebook: { key: 'notebook', name: 'My CookBook', desc: 'Assignment templates, grading rubrics, recipe collections, video requirements' },
          school: { key: 'school', name: 'Culinary School', desc: 'Lessons, techniques, syllabus structures, learning objectives' },
          community: { key: 'community', name: "Chef's Corner", desc: 'Demo videos, industry insights, live sessions, market partnerships' }
        }
      },
      plumbing: {
        platform: 'a plumbing trade education platform',
        contentTypes: 'service report, assignment, lesson, installation procedure, video',
        modules: {
          workspace: { key: 'workspace', name: 'My Van', desc: 'Tool inventories, fitting knowledge, van setups, code references' },
          notebook: { key: 'notebook', name: 'My PipeBook', desc: 'Assignment templates, grading rubrics, project collections, video requirements' },
          school: { key: 'school', name: 'Plumbing School', desc: 'Lessons, techniques, syllabus structures, learning objectives' },
          community: { key: 'community', name: 'Pipe Lounge', desc: 'Demo videos, industry insights, live sessions, supplier partnerships' }
        }
      }
    };

    // Default to culinary if discipline not provided (backward compat)
    const activeDiscipline = DISCIPLINE_PROMPTS[discipline] || DISCIPLINE_PROMPTS['culinary'];
    const mods = activeDiscipline.modules;

    const aiPrompt = `You are a curriculum mapping assistant for ${activeDiscipline.platform}.

Analyze the following curriculum content and determine:
1. Content type (${activeDiscipline.contentTypes})
2. Is this a SYLLABUS/CURRICULUM document containing multiple lessons, or a SINGLE lesson/document?
3. Which module(s) it belongs to:
   - ${mods.workspace.name}: ${mods.workspace.desc}
   - ${mods.notebook.name}: ${mods.notebook.desc}
   - ${mods.school.name}: ${mods.school.desc}
   - ${mods.community.name}: ${mods.community.desc}
4. Extracted metadata (title, week number, topics, equipment, etc.)
5. Confidence score (0-100)

If this is a SYLLABUS containing multiple lessons (look for patterns like "Week 1", "Lesson 1", "Module 1", chapter headings, or a table of contents), extract ALL lessons as an array.

Return your analysis as a JSON object with this structure:

For SINGLE lesson/document:
{
  "contentType": "${activeDiscipline.contentTypes.split(', ')[0]}" | "${activeDiscipline.contentTypes.split(', ')[1]}" | "lesson" | "technique" | "video",
  "isSyllabus": false,
  "modules": {
    "workspace": { "include": true/false, "reason": "why" },
    "notebook": { "include": true/false, "reason": "why" },
    "school": { "include": true/false, "reason": "why" },
    "community": { "include": true/false, "reason": "why" }
  },
  "metadata": {
    "title": "extracted title",
    "weekNumber": number or null,
    "topics": ["topic1", "topic2"],
    "equipment": ["equipment1", "equipment2"],
    "difficulty": "beginner" | "intermediate" | "advanced"
  },
  "confidence": 0-100
}

For SYLLABUS with multiple lessons:
{
  "contentType": "syllabus",
  "isSyllabus": true,
  "modules": {
    "workspace": { "include": true/false, "reason": "why" },
    "notebook": { "include": true/false, "reason": "why" },
    "school": { "include": true/false, "reason": "why" },
    "community": { "include": true/false, "reason": "why" }
  },
  "lessons": [
    {
      "title": "Lesson 1 title",
      "weekNumber": 1,
      "topics": ["topic1", "topic2"],
      "equipment": ["equipment1", "equipment2"],
      "difficulty": "beginner" | "intermediate" | "advanced"
    },
    {
      "title": "Lesson 2 title",
      "weekNumber": 2,
      "topics": ["topic1", "topic2"],
      "equipment": ["equipment1", "equipment2"],
      "difficulty": "beginner" | "intermediate" | "advanced"
    }
  ],
  "metadata": {
    "title": "Overall syllabus title",
    "totalWeeks": number or null
  },
  "confidence": 0-100
}

IMPORTANT: Use the exact module keys "workspace", "notebook", "school", "community" in your JSON response.

Here is the curriculum content to analyze:

${extractedText.substring(0, 8000)}`;

    // Call Anthropic API via existing proxy
    const anthropicResponse = await fetch(`${event.headers.origin || 'http://localhost:8888'}/.netlify/functions/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        apiKeyIdentifier: 'chef', // Use existing chef key
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: aiPrompt }],
        temperature: 0.3, // Lower temperature for more consistent mapping
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${errorText}`);
    }

    const anthropicData = await anthropicResponse.json();
    const aiResponseText = anthropicData.content?.[0]?.text || '{}';

    // Parse AI response
    let aiSuggestion;
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      aiSuggestion = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponseText);
      // Fallback suggestion using generic module keys
      aiSuggestion = {
        contentType: 'unknown',
        modules: {
          workspace: { include: false, reason: 'Unable to analyze' },
          notebook: { include: false, reason: 'Unable to analyze' },
          school: { include: true, reason: 'Default mapping' },
          community: { include: false, reason: 'Unable to analyze' }
        },
        metadata: {
          title: fileName,
          weekNumber: null,
          topics: [],
          equipment: [],
          difficulty: 'intermediate'
        },
        confidence: 50
      };
    }

    // Step 3: Return mapping suggestion
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        fileName: fileName,
        extractedText: extractedText.substring(0, 500) + '...', // Preview only
        aiSuggestion: aiSuggestion
      })
    };

  } catch (error) {
    console.error('Content processor error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process content',
        message: error.message 
      })
    };
  }
};
