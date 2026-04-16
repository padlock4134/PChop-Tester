import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import { Ingredient } from '../types/shared-types';

const DEFAULT_DISCIPLINE_SLUG = 'culinary';

function getActiveDisciplineSlug(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_DISCIPLINE_SLUG;
  }

  const fromSelection = localStorage.getItem('selectedDiscipline');
  const fromPath = window.location.pathname.split('/').filter(Boolean)[0];

  return fromSelection || fromPath || DEFAULT_DISCIPLINE_SLUG;
}

export async function saveKitchen(userId: string, ingredients: Ingredient[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const disciplineSlug = getActiveDisciplineSlug();

  const { error } = await supabase
    .from('user_kitchen')
    .upsert([
      { user_id: userId, discipline_slug: disciplineSlug, ingredients }
    ], { onConflict: 'user_id,discipline_slug' });

  if (error) throw error;
}

export async function fetchKitchen(userId: string): Promise<Ingredient[]> {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const disciplineSlug = getActiveDisciplineSlug();

  const { data, error } = await supabase
    .from('user_kitchen')
    .select('ingredients')
    .eq('user_id', userId)
    .eq('discipline_slug', disciplineSlug)
    .maybeSingle();

  if (error) throw error;

  return data?.ingredients || [];
}
