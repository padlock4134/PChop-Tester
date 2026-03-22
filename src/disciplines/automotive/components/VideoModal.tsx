import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XP_REWARDS } from '../../culinary/services/xpService';
import { useLevelProgressContext } from './NavBar';
import { supabase } from '../../culinary/api/supabaseClient';
import { useSupabase } from '../../culinary/components/SupabaseProvider';
import { isSessionValid } from '../../culinary/api/userSession';

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  videoUrl: string; // YouTube/Vimeo embed URL
  tutorialId?: string; // Unique ID for the tutorial
  recipeId?: string;   // Optional recipe ID if this is a recipe tutorial
}

const VideoModal: React.FC<VideoModalProps> = ({ open, onClose, title, videoUrl, tutorialId, recipeId }) => {
  const { t } = useTranslation();
  const [hasAwardedXP, setHasAwardedXP] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { refreshXP } = useLevelProgressContext();

  const { user } = useSupabase();
  
  // Reset XP award state when modal opens/closes or tutorial changes
  useEffect(() => {
    setHasAwardedXP(false);
  }, [open, tutorialId]);

  // Check if video is completed (for YouTube/other embeds)
  const checkVideoProgress = () => {
    if (!open || hasAwardedXP || !tutorialId) return;
    
    // This is a simplified check - in a real app, you'd use the YouTube/player API
    // to track actual video progress (e.g., 80% watched)
    const videoWatched = true; // Simplified for now
    
    if (videoWatched) {
      awardXpForTutorial();
    }
  };

  const awardXpForTutorial = async () => {
    if (hasAwardedXP || !tutorialId) return;
    
    try {
      const sessionValid = await isSessionValid();
      if (!sessionValid || !user) return;
      
      // Check if XP was already awarded for this tutorial
      const { data: existingLog } = await supabase
        .from('xp_activity_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('activity', `tutorial_${tutorialId}`)
        .maybeSingle();
      
      if (!existingLog) {
        // Award XP for completing a tutorial
        await supabase.rpc('increment_user_xp', {
          user_id: user.id,
          xp_amount: recipeId ? XP_REWARDS.LESSON_COMPLETE : XP_REWARDS.RECIPE_COMPLETE
        });
        
        // Log the XP award
        await supabase.from('xp_activity_log').insert([
          {
            user_id: user.id,
            xp_awarded: recipeId ? XP_REWARDS.LESSON_COMPLETE : XP_REWARDS.RECIPE_COMPLETE,
            activity: `tutorial_${tutorialId}`
          }
        ]);
        
        refreshXP();
        setHasAwardedXP(true);
      }
    } catch (error) {
      console.error('Error awarding XP for tutorial:', error);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black max-w-2xl w-full p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-maineBlue text-2xl"
          aria-label={t('modals.close')}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-maineBlue">{title}</h2>
        <div className="aspect-w-16 aspect-h-9 w-full">
          {videoUrl ? (
            <iframe
              ref={iframeRef}
              src={videoUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-72 rounded border border-black"
              onLoad={checkVideoProgress}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-72 bg-gray-100 rounded border border-black text-gray-500 p-6">
              <div className="text-lg font-semibold text-gray-700 mb-2">🎥 {t('common.loading')}</div>
              <div className="text-center text-gray-600 mb-4">
                Video tutorials are temporarily unavailable to prevent API rate limits.
              </div>
              <div className="text-sm text-gray-500 text-center">
                This feature will be re-enabled with better caching soon!
              </div>
            </div>
          )}
        </div>
        {/* Debug: show the raw videoUrl value */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-400 break-all">
            <span className="font-semibold">Debug videoUrl:</span> {videoUrl ? videoUrl : '(empty)'}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;

