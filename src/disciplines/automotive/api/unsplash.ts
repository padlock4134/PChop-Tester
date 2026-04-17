// Unsplash API integration for PorkChop
// Requires VITE_UNSPLASH_ACCESS_KEY in .env

// Helper to build a more specific Unsplash query
function buildImageQuery(procedureTitle: string, item: string, type: 'part' | 'equipment' | 'procedure' = 'procedure'): string {
  if (type === 'equipment') {
    return `${procedureTitle} ${item} automotive`;
  }
  if (type === 'part') {
    return `${item} for ${procedureTitle}`;
  }
  return `${procedureTitle} ${item}`;
}

// Helper to filter out irrelevant results (e.g., "plant pot", "garden")
function isRelevantUnsplashResult(result: any, item: string): boolean {
  const badWords = ['plant', 'garden', 'flower', 'decor', 'ornament'];
  const desc = `${result.description || ''} ${result.alt_description || ''}`.toLowerCase();
  if (badWords.some(word => desc.includes(word))) return false;
  if (item === 'pot' && desc.includes('plant')) return false;
  return true;
}

export async function getRecipeImage(query: string, procedureTitle?: string, type: 'part' | 'equipment' | 'procedure' = 'procedure'): Promise<string> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!accessKey) throw new Error('Unsplash API key missing');
  const searchQuery = procedureTitle ? buildImageQuery(procedureTitle, query, type) : query;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&client_id=${accessKey}&orientation=landscape&per_page=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Unsplash API error');
  const data = await res.json();
  const relevant = data.results?.find((r: any) => isRelevantUnsplashResult(r, query));
  return relevant?.urls?.regular || data.results?.[0]?.urls?.regular || '/placeholder.jpg';
}
