// Unsplash API integration for HVAC image search
// Requires VITE_UNSPLASH_ACCESS_KEY in .env

// Helper to build a more specific Unsplash query
function buildImageQuery(projectTitle: string, item: string, type: 'ingredient' | 'equipment' | 'recipe' = 'recipe'): string {
  if (type === 'equipment') {
    return `${projectTitle} ${item} HVAC`;
  }
  if (type === 'ingredient') {
    return `${item} HVAC component`;
  }
  return `${projectTitle} ${item} HVAC`;
}

// Helper to filter out irrelevant results
function isRelevantUnsplashResult(result: any, item: string): boolean {
  const badWords = ['cooking', 'recipe', 'food', 'kitchen', 'restaurant', 'meal'];
  const desc = `${result.description || ''} ${result.alt_description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  return true;
}

export async function getRecipeImage(query: string, recipeTitle?: string, type: 'ingredient' | 'equipment' | 'recipe' = 'recipe'): Promise<string> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error('Unsplash API key missing');
  const searchQuery = recipeTitle ? buildImageQuery(recipeTitle, query, type) : query;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&client_id=${accessKey}&orientation=landscape&per_page=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Unsplash API error');
  const data = await res.json();
  const relevant = data.results?.find((r: any) => isRelevantUnsplashResult(r, query));
  return relevant?.urls?.regular || data.results?.[0]?.urls?.regular || '/placeholder.jpg';
}
