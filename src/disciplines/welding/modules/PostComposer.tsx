import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabaseClient';
import { XP_REWARDS } from '../services/xpService';
import { useLevelProgressContext } from '../components/NavBar';
import { useSupabase } from '../components/SupabaseProvider';
import { isSessionValid } from '../api/userSession';

const PostComposer = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshXP } = useLevelProgressContext();

  const { user } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const sessionValid = await isSessionValid();
      if (!sessionValid || !user) {
        throw new Error('Not authenticated');
      }
      
      // Check if this is a project share (simplified check for project keywords)
      const isProjectShare = /project|materials?|instructions?|method|steps|specs|setup time|weld time/i.test(input);
      
      // In a real app, you would upload the image and create the post here
      // For now, we'll just simulate a successful post
      
      if (isProjectShare) {
        // Award XP for sharing a project
        const { error } = await supabase.rpc('increment_user_xp', {
          user_id: user.id,
          xp_amount: XP_REWARDS.PROJECT_SHARE
        });
        
        if (!error) {
          // Log the XP award
          await supabase.from('xp_activity_log').insert([
            {
              user_id: user.id,
              xp_awarded: XP_REWARDS.PROJECT_SHARE,
              activity: 'project_share'
            }
          ]);
          
          refreshXP();
        }
      }
      
      // Reset form
      setInput('');
      setImage(null);
      
      // Show success message or update UI
      alert('Post shared successfully!' + (isProjectShare ? ' +' + XP_REWARDS.PROJECT_SHARE + ' XP for sharing a project!' : ''));
      
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="welders-corner-composer bg-weatheredWhite p-4 rounded shadow mb-6">
      <textarea
        className="w-full border rounded p-2 mb-2"
        placeholder={t('social.share')}
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={isSubmitting}
      />
      <div className="flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const files = e.target.files;
            if (files && files[0]) {
              setImage(files[0]);
            } else {
              setImage(null);
            }
          }}
          disabled={isSubmitting}
        />
        <button 
          type="submit"
          className={`px-4 py-2 rounded font-bold transition-colors ${
            isSubmitting 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('social.posting') : t('social.post')}
        </button>
      </div>
    </form>
  );
};

export default PostComposer;

