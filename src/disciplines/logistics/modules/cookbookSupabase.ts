import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import type { RouteCard } from '../components/RouteMatcherModal';

const RUNBOOK_TABLES = ['user_runbook', 'user_cookbook'] as const;

type RunbookTable = (typeof RUNBOOK_TABLES)[number];

function isMissingTableError(error: any) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '');
}

async function selectRecipes(userId: string) {
  let lastError: any = null;
  for (const table of RUNBOOK_TABLES) {
    const result = await supabase.from(table).select('recipes').eq('user_id', userId).single();
    if (!result.error || result.error.code === 'PGRST116') return { ...result, table };
    if (isMissingTableError(result.error)) {
      lastError = result.error;
      continue;
    }
    throw result.error;
  }
  throw lastError || new Error('No runbook table available');
}

async function upsertRecipes(userId: string, recipes: RouteCard[]) {
  let lastError: any = null;
  for (const table of RUNBOOK_TABLES) {
    const result = await supabase
      .from(table)
      .upsert([{ user_id: userId, recipes }], { onConflict: 'user_id' });
    if (!result.error) return;
    if (isMissingTableError(result.error)) {
      lastError = result.error;
      continue;
    }
    throw result.error;
  }
  throw lastError || new Error('No runbook table available');
}

export async function saveRunbook(userId: string, routes: RouteCard[]) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');
  await upsertRecipes(userId, routes);
}

export async function fetchRunbook(userId: string): Promise<RouteCard[]> {
  if (!userId) return [];
  const sessionValid = await isSessionValid();
  if (!sessionValid) return [];
  const { data } = await selectRecipes(userId);
  return (data?.recipes || []) as RouteCard[];
}

export async function addRouteToRunbook(userId: string, route: RouteCard) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');

  const { data } = await selectRecipes(userId);
  const existingRoutes = (data?.recipes || []) as RouteCard[];
  if (!existingRoutes.some(r => r.id === route.id)) {
    await upsertRecipes(userId, [...existingRoutes, route]);
  }
}

export async function removeRouteFromRunbook(userId: string, routeId: string) {
  const sessionValid = await isSessionValid();
  if (!sessionValid || !userId) throw new Error('Not signed in');

  const { data } = await selectRecipes(userId);
  const existingRoutes = (data?.recipes || []) as RouteCard[];
  const updatedRoutes = existingRoutes.filter(r => r.id !== routeId);
  await upsertRecipes(userId, updatedRoutes);
}
