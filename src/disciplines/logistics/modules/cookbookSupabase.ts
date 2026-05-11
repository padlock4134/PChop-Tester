import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RouteCard } from '../components/RouteMatcherModal';

export async function saveRunbook(userId: string, routes: RouteCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_runbook')
    .upsert([{ 
      user_id: userId,
      recipes: routes // DB column is 'recipes', stores route data as JSONB
    }], { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchRunbook(userId: string): Promise<RouteCard[]> {
  if (!userId) return [];

  const sessionValid = await isSessionValid();
  if (!sessionValid) return [];

  const { data, error } = await supabase
    .from('user_runbook')
    .select('recipes')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return (data?.recipes || []) as RouteCard[];
}

export async function addRouteToRunbook(userId: string, route: RouteCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  // First get existing routes
  const { data, error: fetchError } = await supabase
    .from('user_runbook')
    .select('recipes')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  // Add new route if not already present
  const existingRoutes = (data?.recipes || []) as RouteCard[];
  if (!existingRoutes.some(r => r.id === route.id)) {
    const { error } = await supabase
      .from('user_runbook')
      .upsert([{ 
        user_id: userId, 
        recipes: [...existingRoutes, route] // DB column is 'recipes'
      }], { onConflict: 'user_id' });
    if (error) throw error;
  }
}

export async function removeRouteFromRunbook(userId: string, routeId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  const { data, error: fetchError } = await supabase
    .from('user_runbook')
    .select('recipes')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  const existingRoutes = (data?.recipes || []) as RouteCard[];
  const updatedRoutes = existingRoutes.filter(r => r.id !== routeId);
  
  const { error } = await supabase
    .from('user_runbook')
    .upsert([{ 
      user_id: userId, 
      recipes: updatedRoutes // DB column is 'recipes'
    }], { onConflict: 'user_id' });
  if (error) throw error;
}
