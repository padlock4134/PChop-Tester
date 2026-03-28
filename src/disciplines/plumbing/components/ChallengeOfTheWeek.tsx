import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useLevelProgressContext } from './NavBar';
import WeeklyChallengeFitModal from './WeeklyChallengeFitModal';
import type { RecipeCard } from './FitMatcherModal';
import { getWeeklyChallengeRecipe } from '../../culinary/api/anthropicChallenge';
import { getRecipeImage } from '../../culinary/api/unsplash';
import { supabase } from '../../culinary/api/supabaseClient';
import { isSessionValid } from '../../culinary/api/userSession';
import { useSupabase } from '../../culinary/components/SupabaseProvider';

// Pool of weekly challenges
export const WEEKLY_CHALLENGES = [
  {
    title: 'Leak Locator',
    description: 'Complete a leak detection/repair task.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['leak','seal','pressure'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Leak Locator' },
  },
  {
    title: 'Pipefit Pro',
    description: 'Submit a pipe fitting/connection task.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['pipe','fitting','joint'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Pipefit Pro' },
  },
  {
    title: 'Drain Doctor',
    description: 'Complete drainage or flow troubleshooting.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['drain','clog','flow'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Drain Doctor' },
  },
  {
    title: 'Fixture Finish',
    description: 'Log a fixture install/trim-out task.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['fixture','trim','install'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Fixture Finish' },
  },
  {
    title: 'Code Check',
    description: 'Submit plumbing code compliance work.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['code','inspection','permit'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Code Checked' },
  },
  {
    title: 'Pressure Test',
    description: 'Complete pressure testing/validation.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['pressure','test','gauge'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Pressure Pro' },
  },
  {
    title: 'Solder Station',
    description: 'Log solder/press connection work.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['solder','press','braze'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Connection Specialist' },
  },
  {
    title: 'Vent Verify',
    description: 'Complete venting system verification.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['vent','trap','dwv'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Vent Verifier' },
  },
  {
    title: 'Service Saver',
    description: 'Submit maintenance/service workflow task.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['service','maintenance','repair'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'Service Saver' },
  },
  {
    title: 'System Reliability',
    description: 'Complete reliability improvement work.',
    criteria: (recipe: { ingredients: string[] }) => recipe.ingredients.some(i => ['reliability','system','performance'].includes(i.toLowerCase())),
    reward: { xp: 100, badge: 'System Guardian' },
  }
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
              {loading ? t('common.loading') : t('myKitchen.cookMe', { defaultValue: 'Generate Challenge' })}
            </button>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            <button
              className="mt-2 px-4 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 font-semibold shadow border border-black w-full"
              onClick={() => setOpen(false)}
            >{t('modals.close')}</button>
          </div>
        </div>
      )}
      <WeeklyChallengeFitModal
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

