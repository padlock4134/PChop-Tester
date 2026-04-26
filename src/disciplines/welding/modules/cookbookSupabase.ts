import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RecipeCard } from '../components/PartMatcherModal';

export async function saveSpecBook(userId: string, projects: RecipeCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  const { error } = await supabase
    .from('user_specbook')
    .upsert([{ 
      user_id: userId,
      projects: projects // Stored as JSONB in Supabase
    }], { onConflict: 'user_id' });
  if (error) throw error;
}

export async function fetchSpecBook(userId: string): Promise<RecipeCard[]> {
  if (!userId) return [];

  const sessionValid = await isSessionValid();
  if (!sessionValid) return [];

  const { data, error } = await supabase
    .from('user_specbook')
    .select('projects')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows
  return (data?.projects || []) as RecipeCard[];
}

export async function addProjectToSpecBook(userId: string, project: RecipeCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  // First get existing projects
  const { data, error: fetchError } = await supabase
    .from('user_specbook')
    .select('projects')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  // Add new project if not already present
  const existingProjects = (data?.projects || []) as RecipeCard[];
  if (!existingProjects.some(r => r.id === project.id)) {
    const { error } = await supabase
      .from('user_specbook')
      .upsert([{ 
        user_id: userId, 
        projects: [...existingProjects, project] // Stored as JSONB in Supabase
      }], { onConflict: 'user_id' });
    if (error) throw error;
  }
}

export async function removeProjectFromSpecBook(userId: string, projectId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  
  const { data, error: fetchError } = await supabase
    .from('user_specbook')
    .select('projects')
    .eq('user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  const existingProjects = (data?.projects || []) as RecipeCard[];
  const updatedProjects = existingProjects.filter(r => r.id !== projectId);
  
  const { error } = await supabase
    .from('user_specbook')
    .upsert([{ 
      user_id: userId, 
      projects: updatedProjects
    }], { onConflict: 'user_id' });
  if (error) throw error;
}

// Backward-compatible aliases
export const saveCookbook = saveSpecBook;
export const fetchCookbook = fetchSpecBook;
export const addRecipeToCookbook = addProjectToSpecBook;
export const removeRecipeFromCookbook = removeProjectFromSpecBook;
