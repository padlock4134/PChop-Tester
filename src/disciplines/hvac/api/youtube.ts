// YouTube Data API integration for HVAC tutorial videos
// Requires VITE_YOUTUBE_API_KEY in .env

// Helper to build a more specific YouTube query
// type can be 'main_ingredient' (primary component), 'equipment', or 'recipe' (project)
function buildVideoQuery(projectTitle: string, item: string, type: 'main_ingredient' | 'equipment' | 'recipe' = 'recipe'): string {
  if (type === 'equipment') {
    // Equipment tutorial: 'Project using Tool'
    return `HVAC ${projectTitle} using ${item}`;
  }
  if (type === 'main_ingredient') {
    // Primary component tutorial: 'Component for Project'
    return `HVAC ${item} tutorial ${projectTitle}`;
  }
  // Default: project title with HVAC context
  return `HVAC ${projectTitle}${item ? ' ' + item : ''} tutorial`;
}

// Helper to filter out irrelevant results
function isRelevantYouTubeResult(result: any, item: string): boolean {
  const badWords = ['cooking', 'recipe', 'food', 'kitchen', 'baking', 'chef'];
  const desc = `${result.snippet.title || ''} ${result.snippet.description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  return true;
}

export async function getTutorialVideoUrl(query: string, recipeTitle?: string, type: 'main_ingredient' | 'equipment' | 'recipe' = 'recipe'): Promise<string | null> {
  // YouTube API disabled to prevent quota issues affecting user's personal account
  console.log(`[YouTube API] Disabled. Query was: ${query}, Recipe: ${recipeTitle}, Type: ${type}`);
  return null;
}
