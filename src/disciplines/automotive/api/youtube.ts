// YouTube Data API integration for PorkChop tutorial videos
// Requires VITE_YOUTUBE_API_KEY in .env

// Helper to build a more specific YouTube query
// type can be 'main_part', 'equipment', or 'procedure'
function buildVideoQuery(procedureTitle: string, item: string, type: 'main_part' | 'equipment' | 'procedure' = 'procedure'): string {
  if (type === 'equipment') {
    // Equipment tutorial: 'Procedure Name with Equipment'
    return `${procedureTitle} with a ${item}`;
  }
  if (type === 'main_part') {
    // Main part prep: 'Main Part for Procedure Name'
    return `${item} for ${procedureTitle}`;
  }
  // Default: 'Procedure Name' (possibly with other context)
  return `${procedureTitle}${item ? ' ' + item : ''}`;
}

// Helper to filter out irrelevant results (e.g., "plant pot", "garden")
function isRelevantYouTubeResult(result: any, item: string): boolean {
  const badWords = ['plant', 'garden', 'flower', 'decor', 'ornament'];
  const desc = `${result.snippet.title || ''} ${result.snippet.description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  if (item === 'pot' && desc.includes('plant')) return false;
  return true;
}

export async function getTutorialVideoUrl(query: string, procedureTitle?: string, type: 'main_part' | 'equipment' | 'procedure' = 'procedure'): Promise<string | null> {
  // YouTube API disabled to prevent quota issues affecting user's personal account
  console.log(`[YouTube API] Disabled. Query was: ${query}, Procedure: ${procedureTitle}, Type: ${type}`);
  return null;
}
