// YouTube Data API integration for PorkChop tutorial videos
// Requires VITE_YOUTUBE_API_KEY in .env

// Helper to build a more specific YouTube query
// type can be 'main_material', 'equipment', or 'fit'
function buildVideoQuery(fitTitle: string, item: string, type: 'main_material' | 'equipment' | 'fit' = 'fit'): string {
  if (type === 'equipment') {
    // Equipment tutorial: 'Fit Name with Equipment'
    return `${fitTitle} using ${item}`;
  }
  if (type === 'main_material') {
    // Main material prep: 'Main Material for Fit Name'
    return `${item} for ${fitTitle}`;
  }
  // Default: 'Fit Name' (possibly with other context)
  return `${fitTitle}${item ? ' ' + item : ''}`;
}

// Helper to filter out irrelevant results (e.g., "plant pot", "garden")
function isRelevantYouTubeResult(result: any, item: string): boolean {
  const badWords = ['plant', 'garden', 'flower', 'decor', 'ornament'];
  const desc = `${result.snippet.title || ''} ${result.snippet.description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  if (item === 'pot' && desc.includes('plant')) return false;
  return true;
}

export async function getTutorialVideoUrl(query: string, fitTitle?: string, type: 'main_material' | 'equipment' | 'fit' = 'fit'): Promise<string | null> {
  // YouTube API disabled to prevent quota issues affecting user's personal account
  console.log(`[YouTube API] Disabled. Query was: ${query}, Fit: ${fitTitle}, Type: ${type}`);
  return null;
}
