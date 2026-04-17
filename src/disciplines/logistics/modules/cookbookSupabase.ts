import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RouteCard } from '../components/RouteMatcherModal';

export async function saveRunbook(userId: string, routes: RouteCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId,
      routes: routes // Stored as JSONB in Supabase
    }], { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchRunbook(userId: string): Promise<RouteCard[]> {
  if (!userId) return [];

  const sessionValid = await isSessionValid();
  if (!sessionValid) return [];

  const { data, error } = await supabase
    .from('user_cookbook')
    .select('routes')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return (data?.routes || []) as RouteCard[];
}

export async function addRouteToRunbook(userId: string, route: RouteCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  // First get existing routes
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('routes')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  // Add new route if not already present
  const existingRoutes = (data?.routes || []) as RouteCard[];
  if (!existingRoutes.some(r => r.id === route.id)) {
    const { error } = await supabase
      .from('user_cookbook')
      .upsert([{ 
        user_id: userId, 
        routes: [...existingRoutes, route] // Stored as JSONB in Supabase
      }], { onConflict: 'user_id' });
    if (error) throw error;
  }
}

export async function removeRouteFromRunbook(userId: string, routeId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('routes')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  const existingRoutes = (data?.routes || []) as RouteCard[];
  const updatedRoutes = existingRoutes.filter(r => r.id !== routeId);
  
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId, 
      routes: updatedRoutes
    }], { onConflict: 'user_id' });
  if (error) throw error;
}
