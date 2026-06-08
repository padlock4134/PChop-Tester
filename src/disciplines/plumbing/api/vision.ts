// Google Vision API integration for PorkChop
// Uses secure server-side proxy

export async function scanImage(base64Image: string): Promise<string[]> {
  try {
    console.log('Scanning image with Vision API...');
    const response = await fetch('/.netlify/functions/vision-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, discipline: 'plumbing' })
    });

    console.log('Vision API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error response text:', errorText);
      
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
        console.error('Vision API error details:', errorObj);
      } catch (e) {
        errorObj = { error: errorText };
      }
      throw new Error(errorObj.error || 'Failed to process image');
    }

    const { results } = await response.json();
    console.log('Vision API results count:', results?.length || 0);
    return results || [];
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
}
