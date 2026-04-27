import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLevelProgressContext } from './NavBar';
import WeeklyChallengeProcessModal from './WeeklyChallengeProcessModal';
import type { RecipeCard } from './ProcessMatcherModal';
import { getWeeklyChallengeRecipe } from '../api/anthropicChallenge';
import { getRecipeImage } from '../api/unsplash';
import { supabase } from '../api/supabaseClient';
import { isSessionValid } from '../api/userSession';
import { useSupabase } from './SupabaseProvider';

// Pool of weekly challenges
export const WEEKLY_CHALLENGES = [
  {
    title: '5S Starter',
    description: 'Organize your workspace using 5S principles (Sort, Set in Order, Shine, Standardize, Sustain).',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 100, badge: '5S Champion' },
  },
  {
    title: 'Safety Check',
    description: 'Complete a safety inspection checklist for bonus XP.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['safety','glove','goggle','helmet'].includes(i.toLowerCase())),
    reward: { xp: 120, badge: 'Safety First' },
  },
  {
    title: 'Quality First',
    description: 'Perform quality control on any manufactured part.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 110, badge: 'Quality Champion' },
  },
  {
    title: 'Tool Time',
    description: 'Properly maintain and calibrate a tool.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['wrench','drill','saw','hammer','tool'].includes(i.toLowerCase())),
    reward: { xp: 80, badge: 'Tool Master' },
  },
  {
    title: 'Lean Basics',
    description: 'Identify and eliminate one source of waste in your process.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 100, badge: 'Lean Thinker' },
  },
  {
    title: 'Standard Work',
    description: 'Follow a Standard Operating Procedure (SOP) exactly.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 90, badge: 'SOP Pro' },
  },
  {
    title: 'Preventive Care',
    description: 'Complete a preventive maintenance task.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['oil','grease','lubricant','filter'].includes(i.toLowerCase())),
    reward: { xp: 85, badge: 'Maintenance Master' },
  },
  {
    title: 'Clean Sweep',
    description: 'Deep clean and organize a work area.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['cleaner','degreaser','rag','wipe'].includes(i.toLowerCase())),
    reward: { xp: 70, badge: 'Clean Machine' },
  },
  {
    title: 'Measure Twice',
    description: 'Use precision measuring tools correctly.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['caliper','micrometer','gauge','ruler'].includes(i.toLowerCase())),
    reward: { xp: 95, badge: 'Precision Pro' },
  },
  {
    title: 'Team Builder',
    description: 'Collaborate on a manufacturing process with your team.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 80, badge: 'Team Player' },
  },
  {
    title: 'Documentation Day',
    description: 'Properly document a work process or procedure.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 75, badge: 'Documentation Expert' },
  },
  {
    title: 'Material Master',
    description: 'Correctly identify and sort raw materials.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['steel','aluminum','plastic','wood','metal'].includes(i.toLowerCase())),
    reward: { xp: 85, badge: 'Material Expert' },
  },
  {
    title: 'Assembly Ace',
    description: 'Complete an assembly operation efficiently.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['bolt','screw','fastener','assembly'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Assembly Pro' },
  },
  {
    title: 'Continuous Improvement',
    description: 'Suggest one process improvement (Kaizen).',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.length > 0,
    reward: { xp: 120, badge: 'Kaizen Champion' },
  },
];

// Helper to get the current week number (ISO week)
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1)/7);
}

// Get the current weekly challenge based on the current week number
function getCurrentWeeklyChallenge() {
  const now = new Date();
  const week = getWeekNumber(now);
  return WEEKLY_CHALLENGES[week % WEEKLY_CHALLENGES.length];
}

const ChallengeOfTheWeek: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const discipline = location.pathname.split('/').filter(Boolean)[0] || 'culinary';
  const ct = (key: string) => t(`challenge.disciplineCopy.${discipline}.${key}`, { defaultValue: t(`challenge.${key}`) });
  const [open, setOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [modalRecipe, setModalRecipe] = useState<RecipeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState(getWeekNumber(new Date()));
  const [challenge, setChallenge] = useState(getCurrentWeeklyChallenge());
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const { refreshXP } = useLevelProgressContext();

  const { user } = useSupabase();

  // Fetch claim status for this user/week
  async function fetchClaimStatus() {
    const sessionValid = await isSessionValid();
    if (!sessionValid || !user) return;
    const { data } = await supabase
      .from('weekly_challenge_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_number', weekNumber)
      .maybeSingle();
    setAlreadyClaimed(!!data);
  }

  useEffect(() => {
    fetchClaimStatus();
  }, [weekNumber]);

  useEffect(() => {
    const fetchRecipeAndImage = async () => {
      try {
        const challenge = getCurrentWeeklyChallenge();
        const prompt = `${challenge.title}: ${challenge.description}`;
        const recipeData = await getWeeklyChallengeRecipe(prompt);
        const image = await getRecipeImage(recipeData.title || challenge.title, recipeData.title || challenge.title, 'recipe');
        const recipe: RecipeCard = {
          id: `weekly-${challenge.title.replace(/\s+/g, '-').toLowerCase()}`,
          title: recipeData.title || challenge.title,
          image,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || '',
          equipment: recipeData.equipment || [],
        };
        setModalRecipe(recipe);
      } catch (e: any) {
        setError(e.message || 'Failed to generate challenge');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipeAndImage();
  }, [weekNumber]);

  function handleCookMe() {
    setRecipeModalOpen(true);
    setOpen(false);
  }

  return (
    <>
      {!alreadyClaimed ? (
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 hover:bg-yellow-200 shadow text-2xl cursor-pointer transition-colors border-2 border-black"
          title={ct('challengeOfTheWeek') + ": " + challenge.title}
          aria-label={ct('challengeOfTheWeek') + ": " + challenge.title}
          onClick={() => setOpen(true)}
        >
          <span role="img" aria-label="Trophy">🏆</span>
        </button>
      ) : (
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 cursor-not-allowed text-2xl border-2 border-black"
          title={ct('completed')}
          aria-label={ct('completed')}
          disabled
          style={{ outline: 'none', border: 'none' }}
        >
          <span role="img" aria-label="Trophy">🏆</span>
        </button>
      )}
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-sm w-full relative z-50 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-3xl mb-2">🏆</span>
            <span className="font-bold text-xl text-yellow-800 mb-1">{challenge.title}</span>
            <span className="text-gray-800 mb-2 text-center">{challenge.description}</span>
            <span className="text-sm text-gray-500">{ct('viewDetails')}: <b>{challenge.reward.xp} XP</b> and <b>{challenge.reward.badge}</b> badge</span>
            <button
              className="mt-4 px-4 py-2 rounded bg-maineBlue hover:bg-seafoam text-seafoam hover:text-maineBlue font-bold shadow border border-black w-full"
              onClick={handleCookMe}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('myFloor.cookMe', { defaultValue: 'Try This' })}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            <button
              className="mt-2 px-4 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold shadow border border-black w-full"
              onClick={() => setOpen(false)}
            >{t('modals.close')}</button>
          </div>
        </div>
      )}
      <WeeklyChallengeProcessModal
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        recipe={modalRecipe}
        loading={loading}
        error={error}
        challengeId={modalRecipe?.id || ''}
        weekNumber={getWeekNumber(new Date())}
        xp={challenge.reward.xp}
        badge={challenge.reward.badge}
      />
    </>
  );
};

export default ChallengeOfTheWeek;
