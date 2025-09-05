const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { base64Image } = JSON.parse(event.body);
    
    if (!base64Image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing image data' })
      };
    }

    // Try multiple possible environment variable names
    const apiKey = process.env.GOOGLE_VISION_API_KEY || 
                  process.env.Google_Vision_API_Key || 
                  process.env['vision-proxy'] ||
                  process.env.VISION_API_KEY;
                  
    console.log('Environment variables available:', Object.keys(process.env).length);
    console.log('Vision-related env vars:', Object.keys(process.env).filter(k => k.toLowerCase().includes('vision') || k.toLowerCase().includes('google')));
    console.log('API key found:', !!apiKey);
    
    // Validate API key format (should be a non-empty string)
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      console.error('Invalid API key format or missing API key');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server configuration error: Missing or invalid API key',
          debug: {
            envVarsCount: Object.keys(process.env).length,
            visionVars: Object.keys(process.env).filter(k => k.toLowerCase().includes('vision') || k.toLowerCase().includes('google'))
          }
        })
      };
    }

    const body = {
      requests: [{
        image: { content: base64Image },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'LABEL_DETECTION', maxResults: 20 }
        ]
      }]
    };

    let response;
    try {
      console.log('Making Vision API request...');
      response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );
      
      console.log('Vision API response status:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Vision API error response:', error);
        try {
          const errorJson = JSON.parse(error);
          console.error('Vision API error details:', errorJson);
          return {
            statusCode: response.status,
            body: JSON.stringify({ 
              error: `Vision API error: ${errorJson.error?.message || error}`,
              details: errorJson
            })
          };
        } catch (e) {
          return {
            statusCode: response.status,
            body: JSON.stringify({ error: `Vision API error: ${error}` })
          };
        }
      }
    } catch (error) {
      console.error('Request error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Request error: ${error.message}` })
      };
    }

    const data = await response.json();
    
    // Text detection
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
    const textLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    // Label detection
    const labels = data?.responses?.[0]?.labelAnnotations?.map(l => l.description) || [];
    
    // Food-specific terms to enhance detection
    const foodTerms = ['vegetable', 'produce', 'bean', 'legume', 'green'];
    const looseProduceItems = ['green beans', 'string beans', 'snap beans', 'loose produce', 'fresh vegetables'];
    
    // Add specific produce items if general food terms are detected
    const additionalItems = [];
    labels.forEach(item => {
      const lowerItem = item.toLowerCase();
      if (foodTerms.some(term => lowerItem.includes(term))) {
        additionalItems.push(...looseProduceItems);
      }
    });
    
    // Combine and deduplicate all results
    const results = Array.from(new Set([...textLines, ...labels, ...additionalItems]));

    return {
      statusCode: 200,
      body: JSON.stringify({ results })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
