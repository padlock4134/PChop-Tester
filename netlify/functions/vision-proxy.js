const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Debug: Log all environment variables (safely)
  console.log('Environment variables:', Object.keys(process.env).sort());
  console.log('GOOGLE_APPLICATION_CREDENTIALS exists:', 'GOOGLE_APPLICATION_CREDENTIALS' in process.env);
  
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

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    console.log('API key found:', !!apiKey);
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          debug: {
            availableVars: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('KEY'))
          }
        })
      };
    }

    const body = {
      requests: [{
        image: { content: base64Image },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'LABEL_DETECTION', maxResults: 20, model: 'builtin/latest' },
          { type: 'OBJECT_LOCALIZATION', maxResults: 15 }
        ],
        imageContext: {
          languageHints: ['en']
        }
      }]
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Vision API error:', error);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Vision API error: ${error}` })
      };
    }

    const data = await response.json();
    
    // Base detection
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
    const textLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    // Process object localization results - these are the most specific
    const objects = data?.responses?.[0]?.localizedObjectAnnotations
      ?.filter(obj => obj.score > 0.5) // Lowered confidence threshold
      ?.map(obj => obj.name) || [];
    
    // Process labels with adjusted confidence threshold
    const labels = data?.responses?.[0]?.labelAnnotations
      ?.filter(label => label.score > 0.7) // Lowered confidence threshold
      ?.map(label => label.description) || [];
    
    // Combine text, labels, and objects
    const allRawResults = [...textLines, ...labels, ...objects];
    
    // Filter out generic terms and non-food items
    const genericTerms = ['food', 'dish', 'cuisine', 'meal', 'delicacy', 'art', 'product', 'buffet', 'close up', 'photography', 'table', 'plate', 'box', 'container', 'bento', 'wicker', 'basket', 'fruit', 'ingredient', 'produce', 'natural foods', 
                          'carton', 'glass', 'bottle', 'jar', 'can', 'tin', 'package', 'packaging', 'wrapper', 'bag', 'tub', 'tube',
                          'culinary arts', 'garnish', 'dessert', 'tableware'];
    const specificResults = allRawResults.filter(item => {
      const text = item.toLowerCase();
      // Only filter if the term is exactly generic or part of a longer phrase
      return !genericTerms.some(term => 
        text === term || 
        new RegExp(`\\b${term}\\b`).test(text)
      );
    });
    
    // Start with basic results
    let results = Array.from(new Set(specificResults));
    
    // Enhanced food detection - only add if base detection worked
    if (results.length > 0) {
      try {
        const foodTerms = ['vegetable', 'produce', 'bean', 'legume', 'green', 'fresh'];
        const looseProduceItems = [];
        
        // Add loose produce if food terms detected
        results.forEach(item => {
          const lowerItem = item.toLowerCase();
          if (foodTerms.some(term => lowerItem.includes(term))) {
            looseProduceItems.push(...[
              'loose produce', 
              'fresh vegetables',
              item
            ]);
          }
        });
        
        // Add to results if we found any
        if (looseProduceItems.length > 0) {
          results = Array.from(new Set([...results, ...looseProduceItems]));
        }
      } catch (enhanceError) {
        console.error('Enhanced detection failed:', enhanceError);
        // Continue with basic results
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ results })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
