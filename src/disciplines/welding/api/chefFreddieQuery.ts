// Netlify Function or API Route for Jake the Welder (Claude Haiku) prompt-to-query
// TODO: Implement Claude Haiku/AI integration logic for production.

// Netlify/Node API handler for Jake the Welder prompt-to-query

// Netlify Function for Jake the Welder prompt-to-query
export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  const reqBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const { prompt } = reqBody;
  const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  const fallbackQuery = 'cnc setup basics';

  return {
    statusCode: 200,
    body: JSON.stringify({ query: normalizedPrompt || fallbackQuery })
  };
}
