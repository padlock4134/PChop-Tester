// YouTube Data API integration for PorkChop tutorial videos
// Requires VITE_YOUTUBE_API_KEY in .env

// Helper to build a more specific YouTube query
// type can be 'main_item', 'equipment', or 'route'
function buildVideoQuery(routeTitle: string, item: string, type: 'main_item' | 'equipment' | 'route' = 'route'): string {
  if (type === 'equipment') {
    // Equipment tutorial: 'Route Name with Equipment'
    return `${routeTitle} with a ${item}`;
  }
  if (type === 'main_item') {
    // Main item prep: 'Main Item for Route Name'
    return `${item} for ${routeTitle}`;
  }
  // Default: 'Route Name' (possibly with other context)
  return `${routeTitle}${item ? ' ' + item : ''}`;
}

// Helper to filter out irrelevant results (e.g., "plant pot", "garden")
function isRelevantYouTubeResult(result: any, item: string): boolean {
  const badWords = ['plant', 'garden', 'flower', 'decor', 'ornament'];
  const desc = `${result.snippet.title || ''} ${result.snippet.description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  if (item === 'pot' && desc.includes('plant')) return false;
  return true;
}

export async function getTutorialVideoUrl(query: string, routeTitle?: string, type: 'main_item' | 'equipment' | 'route' = 'route'): Promise<string | null> {
  // YouTube API disabled to prevent quota issues affecting user's personal account
  return null;
}
