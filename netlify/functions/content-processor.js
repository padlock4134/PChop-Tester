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
    const { fileUrl, fileName, fileType } = JSON.parse(event.body);

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

    // Step 2: Send to Anthropic Claude for analysis
    const aiPrompt = `You are a curriculum mapping assistant for a culinary education platform.

Analyze the following curriculum content and determine:
1. Content type (recipe, assignment, lesson, technique, video, etc.)
2. Which module(s) it belongs to:
   - MyKitchen: Recipe databases, ingredient knowledge, kitchen setups, dietary mappings
   - MyCookBook: Assignment templates, grading rubrics, recipe collections, video requirements
   - CulinarySchool: Lessons, techniques, syllabus structures, learning objectives
   - Chef's Corner: Demo videos, industry insights, live sessions, market partnerships
3. Extracted metadata (title, week number, topics, equipment, etc.)
4. Confidence score (0-100)

Return your analysis as a JSON object with this structure:
{
  "contentType": "lesson" | "assignment" | "recipe" | "technique" | "video",
  "modules": {
    "MyKitchen": { "include": true/false, "reason": "why" },
    "MyCookBook": { "include": true/false, "reason": "why" },
    "CulinarySchool": { "include": true/false, "reason": "why" },
    "ChefsCorner": { "include": true/false, "reason": "why" }
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

Here is the curriculum content to analyze:

${extractedText.substring(0, 4000)}`;

    // Call Anthropic API via existing proxy
    const anthropicResponse = await fetch(`${event.headers.origin || 'http://localhost:8888'}/.netlify/functions/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        apiKeyIdentifier: 'chef', // Use existing chef key
        model: 'claude-3-haiku-20240307',
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
      // Fallback suggestion
      aiSuggestion = {
        contentType: 'unknown',
        modules: {
          MyKitchen: { include: false, reason: 'Unable to analyze' },
          MyCookBook: { include: false, reason: 'Unable to analyze' },
          CulinarySchool: { include: true, reason: 'Default mapping' },
          ChefsCorner: { include: false, reason: 'Unable to analyze' }
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
