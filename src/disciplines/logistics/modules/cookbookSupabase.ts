import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RouteCard } from '../components/RouteMatcherModal';

const DISCIPLINE_SLUG = 'logistics';

export async function saveRunbook(userId: string, routes: RouteCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId,
      discipline_slug: DISCIPLINE_SLUG,
      recipes: routes
    }], { onConflict: 'user_id,discipline_slug' });
  if (error) throw error;
}

export async function fetchRunbook(userId: string): Promise<RouteCard[]> {
  if (!userId) return [];
  const sessionValid = await isSessionValid();
  if (!sessionValid) return [];

  const { data, error } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();
  if (error) throw error;
  return (data?.recipes || []) as RouteCard[];
}

export async function addRouteToRunbook(userId: string, route: RouteCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');

  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const existingRoutes = (data?.recipes || []) as RouteCard[];
  if (!existingRoutes.some(r => r.id === route.id)) {
    const { error } = await supabase
      .from('user_cookbook')
      .upsert([{ 
        user_id: userId, 
        discipline_slug: DISCIPLINE_SLUG,
        recipes: [...existingRoutes, route]
      }], { onConflict: 'user_id,discipline_slug' });
    if (error) throw error;
  }
}

export async function removeRouteFromRunbook(userId: string, routeId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');

  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const existingRoutes = (data?.recipes || []) as RouteCard[];
  const updatedRoutes = existingRoutes.filter(r => r.id !== routeId);

  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId, 
      discipline_slug: DISCIPLINE_SLUG,
      recipes: updatedRoutes
    }], { onConflict: 'user_id,discipline_slug' });
  if (error) throw error;
}
