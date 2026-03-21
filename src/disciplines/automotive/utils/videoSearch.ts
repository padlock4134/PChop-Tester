// Utility to search for tutorial videos using YouTube API
// Add your API key to .env

export interface TutorialVideoResult {
  title: string;
  url: string; // embed URL
  source: 'youtube' | 'manual' | 'none';
  thumbnail?: string;
}

// YouTube Search
interface ImportMetaEnv {
  readonly VITE_YOUTUBE_API_KEY: string;
}

// Add this to make TypeScript recognize import.meta.env
declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// API Key rotation system
class YouTubeAPIRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;
  private keyUsage: Map<string, number> = new Map();
  private keyErrors: Map<string, number> = new Map();
  
  constructor() {
    // Load all available API keys from environment
    const keyVars = [
      'VITE_YOUTUBE_API_KEY',      // Your existing key
      'VITE_YOUTUBE_API_KEY_1',
      'VITE_YOUTUBE_API_KEY_2', 
      'VITE_YOUTUBE_API_KEY_3',
      'VITE_YOUTUBE_API_KEY_4',
      'VITE_YOUTUBE_API_KEY_5'
    ];
    
    console.log('[YouTubeAPIRotator] Looking for keys:', keyVars);
    console.log('[YouTubeAPIRotator] Environment values:', keyVars.map(varName => ({
      name: varName,
      present: !!(import.meta.env as any)[varName],
      value: (import.meta.env as any)[varName] ? 'PRESENT' : 'MISSING'
    })));
    
    this.keys = keyVars
      .map(varName => (import.meta.env as any)[varName])
      .filter(key => key && key.length > 0);
      
    console.log(`[YouTubeAPIRotator] Loaded ${this.keys.length} API keys`);
    console.log('[YouTubeAPIRotator] Keys loaded:', this.keys.map(key => key ? key.substring(0, 10) + '...' : 'undefined'));
    
    // Initialize usage tracking
    this.keys.forEach(key => {
      this.keyUsage.set(key, 0);
      this.keyErrors.set(key, 0);
    });
  }
  
  getCurrentKey(): string | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex];
  }
  
  rotateToNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`[YouTubeAPIRotator] Rotated to key index ${this.currentIndex}`);
  }
  
  markKeyAsUsed(key: string): void {
    const current = this.keyUsage.get(key) || 0;
    this.keyUsage.set(key, current + 1);
  }
  
  markKeyAsErrored(key: string): void {
    const current = this.keyErrors.get(key) || 0;
    this.keyErrors.set(key, current + 1);
    
    // If a key has too many errors, skip it for a while
    if (current >= 3) {
      console.log(`[YouTubeAPIRotator] Key has ${current} errors, rotating`);
      this.rotateToNext();
    }
  }
  
  getStats(): object {
    return {
      totalKeys: this.keys.length,
      currentIndex: this.currentIndex,
      usage: Object.fromEntries(this.keyUsage),
      errors: Object.fromEntries(this.keyErrors)
    };
  }
}

// Global rotator instance
const apiRotator = new YouTubeAPIRotator();

export async function searchYouTube(query: string): Promise<TutorialVideoResult | null> {
  console.log('[VideoSearch] Starting search for:', query);
  console.log('[VideoSearch] Available keys:', apiRotator.keys?.length);
  console.log('[VideoSearch] API key stats:', apiRotator.getStats());
  
  const maxRetries = apiRotator.keys?.length || 1;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = apiRotator.getCurrentKey();
    
    if (!apiKey) {
      console.log('[VideoSearch] No YouTube API keys available');
      console.log('[VideoSearch] Environment check:', {
        main_key: !!(import.meta.env as any).VITE_YOUTUBE_API_KEY,
        key1: !!(import.meta.env as any).VITE_YOUTUBE_API_KEY_1,
        key2: !!(import.meta.env as any).VITE_YOUTUBE_API_KEY_2,
        key3: !!(import.meta.env as any).VITE_YOUTUBE_API_KEY_3,
        main_key_value: (import.meta.env as any).VITE_YOUTUBE_API_KEY ? 'PRESENT' : 'MISSING',
        all_env_keys: Object.keys(import.meta.env).filter(key => key.includes('YOUTUBE'))
      });
      return null;
    }
    
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;
    
         try {
       console.log(`[VideoSearch] Attempt ${attempt + 1}/${maxRetries} with key index ${apiRotator.currentIndex}`);
       
       // Add random delay to look more human (2-5 seconds)
       const delay = 2000 + Math.random() * 3000;
       await new Promise(resolve => setTimeout(resolve, delay));
       
       const res = await fetch(endpoint);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} - ${data.error?.message || 'Unknown error'}`);
      }
      
      if (!data.items || !data.items.length) {
        console.log('[VideoSearch] No results found');
        return null;
      }
      
      // Success! Mark key as used and return result
      apiRotator.markKeyAsUsed(apiKey);
      
      const video = data.items[0];
      return {
        title: video.snippet.title,
        url: `https://www.youtube.com/embed/${video.id.videoId}`,
        source: 'youtube',
        thumbnail: video.snippet.thumbnails?.high?.url
      };
      
    } catch (error) {
      console.error(`[VideoSearch] Error with key index ${apiRotator.currentIndex}:`, error);
      apiRotator.markKeyAsErrored(apiKey);
      
      // Check if it's a quota error
      if (error.message.includes('quotaExceeded') || error.message.includes('403')) {
        console.log('[VideoSearch] Quota exceeded, rotating to next key');
        apiRotator.rotateToNext();
      } else {
        // For other errors, still try next key but don't rotate permanently
        apiRotator.rotateToNext();
      }
    }
  }
  
  console.log('[VideoSearch] All API keys failed');
  console.log('[VideoSearch] API Stats:', apiRotator.getStats());
  return null;
}


// Main function to get tutorial video
export async function getTutorialVideo(query: string): Promise<TutorialVideoResult> {
  const result = await searchYouTube(query);
  if (result) return result;

  return {
    title: 'No tutorial video found',
    url: '',
    source: 'none'
  };
}
