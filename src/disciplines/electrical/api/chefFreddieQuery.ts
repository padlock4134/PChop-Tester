// Netlify Function or API Route for Chef Freddie (Claude Haiku) prompt-to-query
// TODO: Implement Claude Haiku/AI integration logic for production.

// Netlify/Node API handler for Chef Freddie prompt-to-query

// Netlify Function for Chef Freddie prompt-to-query
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
  const fallbackQuery = 'electrical troubleshooting basics';

  return {
    statusCode: 200,
    body: JSON.stringify({ query: normalizedPrompt || fallbackQuery })
  };
}
