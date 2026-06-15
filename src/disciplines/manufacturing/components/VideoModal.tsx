import React, { useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { XP_REWARDS } from '../services/xpService';

import { useLevelProgressContext } from './NavBar';

import { supabase } from '../api/supabaseClient';

import { useSupabase } from '../components/SupabaseProvider';

import { isSessionValid } from '../api/userSession';



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
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-maineBlue text-2xl"
          aria-label={t('modals.close')}
        >
          ×
        </button>
        <div className="p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-bold mb-4 text-maineBlue">{title}</h2>
          <div className="aspect-video w-full">
            {videoUrl ? (
              <iframe
                ref={iframeRef}
                src={videoUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-[200px] lg:h-[300px] rounded border border-black"
                onLoad={checkVideoProgress}
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-[200px] lg:h-[300px] bg-gray-100 rounded border border-black text-gray-500 p-4 lg:p-6">
                <div className="text-base lg:text-lg font-semibold text-gray-700 mb-2">🎥 {t('common.loading')}</div>
                <div className="text-center text-sm lg:text-base text-gray-600 mb-4">
                  Video tutorials are temporarily unavailable to prevent API rate limits.
                </div>
                <div className="text-xs lg:text-sm text-gray-500 text-center">
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
    </div>
  );

};



export default VideoModal;

