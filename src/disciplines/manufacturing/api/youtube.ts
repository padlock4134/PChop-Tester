// YouTube Data API integration for PorkChop tutorial videos
// Requires VITE_YOUTUBE_API_KEY in .env

// Helper to build a more specific YouTube query
// type can be 'main_ingredient', 'equipment', or 'recipe'
function buildVideoQuery(recipeTitle: string, item: string, type: 'main_ingredient' | 'equipment' | 'recipe' = 'recipe'): string {
  if (type === 'equipment') {
    // Equipment tutorial: 'Recipe Name with Equipment'
    return `${recipeTitle} with a ${item}`;
  }
  if (type === 'main_ingredient') {
    // Main ingredient prep: 'Main Ingredient for Recipe Name'
    return `${item} for ${recipeTitle}`;
  }
  // Default: 'Recipe Name' (possibly with other context)
  return `${recipeTitle}${item ? ' ' + item : ''}`;
}

// Helper to filter out irrelevant results (e.g., "plant pot", "garden")
function isRelevantYouTubeResult(result: any, item: string): boolean {
  const badWords = ['plant', 'garden', 'flower', 'decor', 'ornament'];
  const desc = `${result.snippet.title || ''} ${result.snippet.description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  if (item === 'pot' && desc.includes('plant')) return false;
  return true;
}

export async function getTutorialVideoUrl(query: string, recipeTitle?: string, type: 'main_ingredient' | 'equipment' | 'recipe' = 'recipe'): Promise<string | null> {
  // YouTube API disabled to prevent quota issues affecting user's personal account
  return null;
}
