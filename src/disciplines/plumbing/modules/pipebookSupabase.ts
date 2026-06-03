import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RecipeCard } from '../components/FitMatcherModal';

const DISCIPLINE_SLUG = 'plumbing';

export async function savePipeBook(userId: string, fits: RecipeCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId,
      discipline_slug: DISCIPLINE_SLUG,
      recipes: fits
    }], { onConflict: 'user_id,discipline_slug' });
  if (error) throw error;
}

export async function fetchPipeBook(userId: string): Promise<RecipeCard[]> {
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
  return (data?.recipes || []) as RecipeCard[];
}

export async function addRecipeToPipeBook(userId: string, fit: RecipeCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  // First get existing fits
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();
    
  if (fetchError) throw fetchError;
  
  // Add new fit if not already present
  const existingRecipes = (data?.recipes || []) as RecipeCard[];
  if (!existingRecipes.some(r => r.id === fit.id)) {
    const { error } = await supabase
      .from('user_cookbook')
      .upsert([{ 
        user_id: userId, 
        discipline_slug: DISCIPLINE_SLUG,
        recipes: [...existingRecipes, fit]
      }], { onConflict: 'user_id,discipline_slug' });
    if (error) throw error;
  }
}

export async function removeRecipeFromPipeBook(userId: string, recipeId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();
    
  if (fetchError) throw fetchError;
  
  const existingRecipes = (data?.recipes || []) as RecipeCard[];
  const updatedRecipes = existingRecipes.filter(r => r.id !== recipeId);
  
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId, 
      discipline_slug: DISCIPLINE_SLUG,
      recipes: updatedRecipes
    }], { onConflict: 'user_id,discipline_slug' });
  if (error) throw error;
}
