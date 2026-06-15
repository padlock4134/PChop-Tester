const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!prompt || typeof prompt !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt' }) };
  }

  const apiKey = process.env.ANTHROPIC_CHEF_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
    }

    const data = await response.json();
    const query = data.content?.[0]?.text?.trim() || '';
    return { statusCode: 200, body: JSON.stringify({ query }) };

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { statusCode: 504, body: JSON.stringify({ error: 'Request timeout' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
