import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RecipeCard } from '../components/CircuitMatcherModal';

const DISCIPLINE_SLUG = 'electrical';

export async function saveCookbook(userId: string, recipes: RecipeCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_cookbook')
    .upsert([{ 
      user_id: userId,
      discipline_slug: DISCIPLINE_SLUG,
      recipes: recipes
    }], { onConflict: 'user_id,discipline_slug' });
  if (error) throw error;
}

export async function fetchCookbook(userId: string): Promise<RecipeCard[]> {
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

export async function addRecipeToCookbook(userId: string, recipe: RecipeCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  // First get existing recipes
  const { data, error: fetchError } = await supabase
    .from('user_cookbook')
    .select('recipes')
    .eq('user_id', userId)
    .eq('discipline_slug', DISCIPLINE_SLUG)
    .maybeSingle();
    
  if (fetchError) throw fetchError;
  
  // Add new recipe if not already present
  const existingRecipes = (data?.recipes || []) as RecipeCard[];
  if (!existingRecipes.some(r => r.id === recipe.id)) {
    const { error } = await supabase
      .from('user_cookbook')
      .upsert([{ 
        user_id: userId, 
        discipline_slug: DISCIPLINE_SLUG,
        recipes: [...existingRecipes, recipe]
      }], { onConflict: 'user_id,discipline_slug' });
    if (error) throw error;
  }
}

export async function removeRecipeFromCookbook(userId: string, recipeId: string) {
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
