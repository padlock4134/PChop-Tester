// Netlify Function or API Route for Gus the Mechanic (Claude Haiku) prompt-to-query
// TODO: Implement Claude Haiku/AI integration logic for production.

// Netlify/Node API handler for Gus the Mechanic prompt-to-query

// Netlify Function for Gus the Mechanic prompt-to-query
export const askGusTheMechanic = async (event: any, context: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  const reqBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  const { prompt } = reqBody;
  const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  const fallbackQuery = 'automotive diagnostics basics';

  return {
    statusCode: 200,
    body: JSON.stringify({ query: normalizedPrompt || fallbackQuery })
  };
}
