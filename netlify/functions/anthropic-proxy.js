const fetch = require('node-fetch');

const API_KEYS = {
  recipe: process.env.ANTHROPIC_RECIPE_KEY,
  challenge: process.env.ANTHROPIC_CHALLENGE_KEY,
  chef: process.env.ANTHROPIC_CHEF_KEY,
  add_discipline: process.env.ANTHROPIC_ADD_DISCIPLINE_KEY
};

const BLOCKED_DISCIPLINE_TERMS = [
  'porn',
  'pornography',
  'sexual',
  'sex',
  'xxx',
  'nude',
  'escort',
  'onlyfans',
  'fetish',
  'adult content'
];


exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      console.error('JSON parse error:', e);
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const apiKeyIdentifier = requestBody.apiKeyIdentifier;

    if (apiKeyIdentifier === 'add_discipline') {
      const safetyInput = requestBody.safetyInput || {};
      const combinedPromptText = `${safetyInput.disciplineName || ''} ${safetyInput.additionalContext || ''}`.toLowerCase();
      const blockedTermsFound = BLOCKED_DISCIPLINE_TERMS.filter((term) =>
        new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(combinedPromptText)
      );

      if (blockedTermsFound.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Blocked unsafe add-discipline prompt content: ${blockedTermsFound.join(', ')}`
          })
        };
      }
    }
    
    // Remove the identifier from the body before forwarding to Anthropic
    delete requestBody.apiKeyIdentifier;
    delete requestBody.safetyInput;

    // Get the appropriate API key
    const apiKey = API_KEYS[apiKeyIdentifier];

    // Check if we have a valid API key
    if (!apiKey) {
      console.error(`Missing API key for ${apiKeyIdentifier}`);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: `API key not configured for: ${apiKeyIdentifier}`
        })
      };
    }

    // Add timeout handling (25 seconds to stay under Netlify's 30s limit)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
          'anthropic-version': event.headers['anthropic-version'] || '2023-06-01'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Anthropic API error for ${apiKeyIdentifier}:`, errorText);
        return {
          statusCode: response.status,
          body: errorText
        };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error(`Request timeout for ${apiKeyIdentifier}`);
        return { 
          statusCode: 504, 
          body: JSON.stringify({ error: 'Request timeout - please try again' }) 
        };
      }
      
      throw fetchError; // Re-throw other fetch errors
    }
    
  } catch (err) {
    console.error('Error proxying to Anthropic:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
