import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import { Item } from '../types/shared-types';

const DISCIPLINE_SLUG = 'logistics';

export async function saveDock(userId: string, items: Item[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');

  const { error } = await supabase
    .from('user_kitchen')
    .upsert([
      { user_id: userId, discipline_slug: DISCIPLINE_SLUG, ingredients: items }
    ], { onConflict: 'user_id,discipline_slug' });

  if (error) throw error;
}

export async function fetchDock(userId: string): Promise<Item[]> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('user_kitchen')
    .select('ingredients')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();

  if (error) throw error;

  return data?.ingredients || [];
}
