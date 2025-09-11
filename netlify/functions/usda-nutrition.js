const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { ingredient } = event.queryStringParameters;
    const apiKey = process.env.VITE_USDA_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'USDA_API_KEY not configured' })
      };
    }
    
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(ingredient)}`);
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
