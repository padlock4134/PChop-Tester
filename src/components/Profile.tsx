import React, { useState, useEffect } from 'react';
import { FireIcon, ShieldCheckIcon, StarIcon, TrophyIcon, SparklesIcon, CakeIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { redirectToLogout } from '@wristband/react-client-auth';

import { supabase } from '../api/supabaseClient';
import { useSupabase } from '../components/SupabaseProvider';
import { verifySubscription } from '../api/userSubscription';
import { Subscription } from '../types/shared-types';
import PaymentModal from './PaymentModal';
import { isSessionValid } from '../api/userSession';
import ReactMarkdown from 'react-markdown';
import { LEVEL_TITLES_AND_ICONS, getXPProgress } from '../utils/leveling';

// Define a simple hook for TermsModal since the original import is incorrect
function useTermsModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const termsContent = `Terms of Service for Porkchop (effective July 2025)

Welcome to Porkchop. By using this app, you agree to be bound by the following terms and conditions.`;
  return { modalOpen, setModalOpen, termsContent };
}

// Define UserProfile type to resolve missing type error
type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  experience: string;
  dietary: string[];
  cuisine: string[];
  kitchenSetup: string;
  xp: number;
};

// Experience level mapping between UI labels and backend values
const EXPERIENCE_LEVEL_MAPPING = {
  'Beginner': 'new_to_cooking',
  'Intermediate': 'home_cook', 
  'Advanced': 'kitchen_confident',
  'Professional': 'kitchen_confident' // Both Advanced and Professional map to kitchen_confident
} as const;

// Reverse mapping for displaying in UI
const EXPERIENCE_LEVEL_DISPLAY = {
  'new_to_cooking': 'Beginner',
  'home_cook': 'Intermediate',
  'kitchen_confident': 'Advanced'
} as const;

const Profile = () => {
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Store selected talents in state; permanent for this session
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [talentPoints, setTalentPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [showTalents, setShowTalents] = useState(false);
  const [selectedTalentTree, setSelectedTalentTree] = useState<string | null>(null);
  const [talentTreeModalOpen, setTalentTreeModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [kitchenSetup, setKitchenSetup] = useState<string>('Apartment Kitchen');
  const [termsContent, setTermsContent] = useState<string>('Loading terms and conditions...');
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [levelProgress, setLevelProgress] = useState({
    title: LEVEL_TITLES_AND_ICONS[0].title,
    level: 1,
    icon: LEVEL_TITLES_AND_ICONS[0].icon,
    current: 0,
    required: 100,
    progressPercent: 0,
  });

  // Load terms from the public/TERMS.md file
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const response = await fetch('/TERMS.md');
        if (!response.ok) {
          throw new Error('Failed to load terms and conditions');
        }
        const text = await response.text();
        setTermsContent(text);
      } catch (error) {
        console.error('Error loading terms:', error);
        setTermsContent('Failed to load terms and conditions. Please try again later.');
      }
    };

    loadTerms();
  }, []);

  const { modalOpen: termsModalOpenState, setModalOpen: setTermsModalOpenState, termsContent: termsContentState } = useTermsModal();

  // 9 talents per tree, unlock at 10, 14, 25, 30, 36, 42, 48, 55, 60
  const talentTrees = {
    'Cast Iron Champion': [
      { name: 'Sear Savant', icon: FireIcon, unlockLevel: 10, description: 'Perfect searing technique for meats and veggies.' },
      { name: 'Heat Control', icon: ShieldCheckIcon, unlockLevel: 14, description: 'Master even heat for flawless results.' },
      { name: 'Iron Will', icon: StarIcon, unlockLevel: 25, description: 'Reduces chance of burning food.' },
      { name: 'Seasoned Veteran', icon: TrophyIcon, unlockLevel: 30, description: 'Enhances seasoning absorption.' },
      { name: 'Rustproof', icon: ShieldCheckIcon, unlockLevel: 36, description: 'Prevents cast iron from rusting.' },
      { name: 'Heavy Hitter', icon: FireIcon, unlockLevel: 42, description: 'Extra sear power for thick cuts.' },
      { name: 'Surface Sage', icon: StarIcon, unlockLevel: 48, description: 'Non-stick mastery for delicate foods.' },
      { name: 'Ironclad', icon: ShieldCheckIcon, unlockLevel: 55, description: 'Cast iron lasts a lifetime.' },
      { name: 'Iron Chef', icon: TrophyIcon, unlockLevel: 60, description: 'Ultimate cast iron mastery (Capstone).' },
    ],
    'Grilling Heavy Weight': [
      { name: 'Flame Tamer', icon: FireIcon, unlockLevel: 10, description: 'Control over open flames.' },
      { name: 'Smoke Master', icon: SparklesIcon, unlockLevel: 14, description: 'Perfect smoky flavors every time.' },
      { name: 'Char Champion', icon: StarIcon, unlockLevel: 25, description: 'Expert in char marks and crust.' },
      { name: 'Grill Marks', icon: StarIcon, unlockLevel: 30, description: 'Signature grill patterns.' },
      { name: 'BBQ Buff', icon: ShieldCheckIcon, unlockLevel: 36, description: 'Increased BBQ efficiency.' },
      { name: 'Pit Boss', icon: TrophyIcon, unlockLevel: 42, description: 'Command any grill with ease.' },
      { name: 'Coal Whisperer', icon: FireIcon, unlockLevel: 48, description: 'Perfect coal management.' },
      { name: 'Grill Guardian', icon: ShieldCheckIcon, unlockLevel: 55, description: 'Grill never fails.' },
      { name: 'BBQ God', icon: TrophyIcon, unlockLevel: 60, description: 'Legendary grilling skills (Capstone).' },
    ],
    'Baking Warlock': [
      { name: 'Dough Whisperer', icon: CakeIcon, unlockLevel: 10, description: 'Perfect dough consistency.' },
      { name: 'Oven Oracle', icon: ShieldCheckIcon, unlockLevel: 14, description: 'Precise baking timing.' },
      { name: 'Proofing Pro', icon: StarIcon, unlockLevel: 25, description: 'Expert in proofing dough.' },
      { name: 'Pastry Pro', icon: StarIcon, unlockLevel: 30, description: 'Expert in pastries.' },
      { name: 'Crust Conjurer', icon: CakeIcon, unlockLevel: 36, description: 'Flawless crusts every time.' },
      { name: 'Bake Sense', icon: SparklesIcon, unlockLevel: 42, description: 'Sense when baking is perfect.' },
      { name: 'Filling Fiend', icon: CakeIcon, unlockLevel: 48, description: 'Master of sweet and savory fillings.' },
      { name: 'Bread Buffoon', icon: AcademicCapIcon, unlockLevel: 55, description: 'Master of all baked goods.' },
      { name: 'Baking Warlock', icon: TrophyIcon, unlockLevel: 60, description: 'Legendary baking magic (Capstone).' },
    ],
  };

  const handleLogout = async () => {
    redirectToLogout('/.netlify/functions/auth-logout');
  };

  // Handle permanent selection of a talent (cannot be undone)
  const handleSelectTalent = (talentName: string, isRightClick: boolean = false) => {
    if (isRightClick && selectedTalents.includes(talentName)) {
      // Right-click: Remove talent (undo)
      setSelectedTalents(prev => prev.filter(talent => talent !== talentName));
    } else if (!isRightClick && !selectedTalents.includes(talentName)) {
      // Left-click: Add talent
      setSelectedTalents(prev => [...prev, talentName]);
    }
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError('');
      try {
        if (!user) {
          setError('Not authenticated. Please sign in again.');
          setLoading(false);
          return;
        }

        const [profileResponse] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user?.id).single(),
        ]);

        if (profileResponse.error) {
          setError('Could not load your profile: ' + profileResponse.error.message);
          setLoading(false);
          return;
        }

        const profile = profileResponse.data;
        if (!profile) {
          setError('No profile found. Please try signing out and in again.');
          setLoading(false);
          return;
        }

        // Ensure XP is a number and has a default value of 0
        const xp = typeof profile.xp === 'number' ? profile.xp : 0;
        console.log('Profile XP:', profile.xp, 'Parsed XP:', xp);
        
        // Map the database fields to the component's state
        setUserProfile({
          ...profile,
          name: profile.name || 'User',
          xp,
          // Map backend cooking_experience to UI display value
          experience: EXPERIENCE_LEVEL_DISPLAY[profile.cooking_experience as keyof typeof EXPERIENCE_LEVEL_DISPLAY] || 'Beginner',
          kitchenSetup: profile.kitchen_setup || 'Apartment Kitchen',
          dietary: profile.dietary || [],
          cuisine: profile.cuisine || []
        });

        // Also update the local kitchenSetup state
        setKitchenSetup(profile.kitchen_setup || 'Apartment Kitchen');

        // Calculate talent points based on XP
        const calculatedTalentPoints = Math.floor(xp / 100);
        setTalentPoints(calculatedTalentPoints);
        
        // Calculate level progress based on XP
        const { level, current, required } = getXPProgress(xp);
        
        // Map level to title index
        const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
        const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
        const progressPercent = (current / required) * 100;
        
        setLevelProgress({
          title,
          level,
          icon,
          current,
          required,
          progressPercent,
        });
        
        // Auto-enable talents at level 10
        if (level >= 10) {
          setShowTalents(true);
        }

        // Fetch subscription information
        try {
          const subscriptionData = await verifySubscription(user?.id || '');
          setSubscription(subscriptionData.subscription);
        } catch (subError) {
          console.error('Error fetching subscription:', subError);
          // Don't set error state here to avoid blocking profile display
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An unexpected error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      const points = Math.floor(userProfile.xp / 100);
      setTalentPoints(points);
      
      // Update level progress when userProfile changes
      const { level, current, required } = getXPProgress(userProfile.xp);
      const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
      const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
      const progressPercent = (current / required) * 100;
      
      setLevelProgress({
        title,
        level,
        icon,
        current,
        required,
        progressPercent,
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && userProfile.kitchenSetup) {
      setKitchenSetup(userProfile.kitchenSetup);
    }
  }, [userProfile]);

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userProfile) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      try {
        setAvatarUploading(true);
        console.log('Starting avatar upload process...');
        
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // Don't use nested paths
        
        console.log('Uploading file:', fileName);
        
        // Upload to Supabase Storage using the 'avatarphotos' bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatarphotos')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type // Explicitly set content type
          });
          
        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get the public URL
        const { data } = supabase.storage
          .from('avatarphotos')
          .getPublicUrl(filePath);
          
        const avatarUrl = data?.publicUrl;
        
        console.log('Avatar URL:', avatarUrl);
        
        if (!avatarUrl) {
          throw new Error('Failed to get avatar URL');
        }
        
        // Update the user profile with the new avatar URL
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ avatar: avatarUrl })
          .eq('id', userProfile.id);
          
        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }
        
        console.log('Profile update successful:', updateData);
        
        // Update the local state with proper type safety
        setUserProfile(prevProfile => {
          if (prevProfile) {
            return {
              ...prevProfile,
              avatar: avatarUrl
            };
          }
          return prevProfile;
        });
        
        console.log('Avatar updated successfully');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Failed to upload avatar. Please try again.');
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading profile...</div>;
  } 

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  } 

  if (!userProfile) {
    return <div className="text-center py-8">No profile data found.</div>;
  } 

  return (
    <div className="max-w-2xl mx-auto p-6 bg-weatheredWhite rounded-lg shadow-lg">
      {/* Header: Aligned with buttons below */}
      <div className="flex justify-center gap-4 items-center mb-6">
        {/* Column 1: Avatar (aligned with Edit Profile) */}
        <div className="flex justify-center" style={{ minWidth: '140px' }}>
          <div className="w-20 h-20 bg-maineBlue rounded-full flex items-center justify-center text-seafoam font-bold text-xl overflow-hidden shrink-0 relative group">
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover absolute inset-0" 
                style={{ objectPosition: 'center' }}
              />
            ) : (
              <span>{userProfile.name.slice(0, 2).toUpperCase()}</span>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 cursor-pointer">
              <label htmlFor="avatar-upload" className="text-white opacity-0 group-hover:opacity-100 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Name + Subscription (aligned with Manage Subscription) */}
        <div className="flex flex-col items-center" style={{ minWidth: '180px' }}>
          <h1 className="text-3xl font-retro text-maineBlue mb-2">
            {userProfile.name}
          </h1>
          {subscription && (
            <span className={`px-2 py-0.5 rounded-full border font-bold text-xs bg-amber-100 text-amber-800 border-amber-300`}>
              {subscription.plan === 'yearly' ? 'Yearly' : 'Monthly'}
            </span>
          )}
        </div>

        {/* Column 3: Level Progress (aligned with Sign Out) */}
        <div className="flex flex-col items-center" style={{ minWidth: '120px' }}>
          {/* Leveling Display */}
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">{levelProgress.icon}</span>
              <span className="font-bold text-sm">{levelProgress.title} (Lv {levelProgress.level})</span>
            </div>
            <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-seafoam transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, levelProgress.progressPercent))}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {levelProgress.current} / {levelProgress.required} XP
            </div>
          </div>
          
          {/* Show Talents Toggle - Moved here between XP counter and gray line */}
          <div className="flex flex-col items-center gap-1 mt-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="font-semibold text-xs">Show Talents</span>
              <span className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  checked={showTalents}
                  onChange={() => setShowTalents(val => !val)}
                  className="sr-only peer"
                  id="talent-toggle"
                />
                <span
                  className="block w-8 h-5 bg-gray-300 rounded-full shadow-inner peer-checked:bg-maineBlue transition-colors duration-200"
                ></span>
                <span
                  className="dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 peer-checked:translate-x-3 shadow"
                ></span>
              </span>
            </label>
            {levelProgress.level < 10 && (
              <div className="text-xs text-red-500 text-center">
                Available at Level 10
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Soft divider line */}
      <div className="w-full h-0.5 bg-gray-200 mb-6 rounded-full"></div>

      {/* Action Buttons and Show Talents Row */}
      <div className="flex justify-between items-start mb-6">
        {/* Left side - Action Buttons (stacked vertically) */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-block bg-sand text-gray-800 px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600"
          >
            Edit Profile
          </button>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="inline-block bg-sand text-gray-800 px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600"
          >
            Manage Subscription
          </button>
          <button
            onClick={handleLogout}
            className="inline-block bg-sand text-gray-800 px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600"
          >
            Sign Out
          </button>
        </div>

        {/* Right side - Square Talent Tree Boxes (1x3 Row) */}
        {showTalents && (
          <div className="flex gap-3 justify-end">
            {/* Cast Iron Champion Box */}
            <button
              onClick={() => setSelectedTalentTree('Equipment')}
              className="w-32 h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-sm relative group flex flex-col items-center justify-center text-center"
            >
              <FireIcon className="w-8 h-8 mb-2" />
              <div>Cast Iron</div>
              <div>Champion</div>
              {/* Mouseover tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-48 border border-gray-300">
                <strong>Cast Iron Champion</strong>
                <div className="mt-1">Master the art of cast iron cooking with heat control, seasoning, and searing techniques.</div>
              </div>
            </button>

            {/* Grilling Heavyweight Box */}
            <button
              onClick={() => setSelectedTalentTree('Techniques')}
              className="w-32 h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-sm relative group flex flex-col items-center justify-center text-center"
            >
              <ShieldCheckIcon className="w-8 h-8 mb-2" />
              <div>Grilling</div>
              <div>Heavyweight</div>
              {/* Mouseover tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-48 border border-gray-300">
                <strong>Grilling Heavyweight</strong>
                <div className="mt-1">Become a grilling master with advanced techniques, temperature control, and flavor enhancement.</div>
              </div>
            </button>

            {/* Baking Warlock Box */}
            <button
              onClick={() => setSelectedTalentTree('Ingredients')}
              className="w-32 h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-sm relative group flex flex-col items-center justify-center text-center"
            >
              <CakeIcon className="w-8 h-8 mb-2" />
              <div>Baking</div>
              <div>Warlock</div>
              {/* Mouseover tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-48 border border-gray-300">
                <strong>Baking Warlock</strong>
                <div className="mt-1">Unlock the secrets of baking with ingredient mastery, precision timing, and magical results.</div>
              </div>
            </button>
          </div>
        )}
      </div>
      
      {/* Details Row */}
      <div className="flex items-start mb-6">
        <div className="flex-1">
          {/* Active Talents - Compact and Centered Buttons */}
          <div className="mb-4">
            <div className="flex flex-wrap justify-center gap-1.5 mb-1.5">
              {selectedTalents.length > 0 &&
                selectedTalents.slice(0, 3).map(talent => (
                  <span
                    key={talent}
                    className="px-2 py-0.5 rounded-full border font-bold text-xs bg-maineBlue text-seafoam border-maineBlue"
                  >
                    {talent}
                  </span>
                ))}
              {selectedTalents.length > 3 && (
                <span className="px-2 py-0.5 rounded-full border font-bold text-xs text-gray-500">+{selectedTalents.length - 3} more</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <EditProfileModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        user={userProfile}
        onProfileUpdated={(updatedUser) => {
          setUserProfile(updatedUser);
          setModalOpen(false);
        }}
      />
      
      <PaymentModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={user?.id || ''}
        plan="monthly"
      />
      
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        content={termsContent}
      />
      
      {/* Talent Tree Modal */}
      {selectedTalentTree && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1"></div>
              <div className="flex items-center gap-3">
                {selectedTalentTree === 'Equipment' && <FireIcon className="w-8 h-8 text-maineBlue" />}
                {selectedTalentTree === 'Techniques' && <ShieldCheckIcon className="w-8 h-8 text-maineBlue" />}
                {selectedTalentTree === 'Ingredients' && <CakeIcon className="w-8 h-8 text-maineBlue" />}
                <h2 className="text-2xl font-bold text-maineBlue text-center">
                  {selectedTalentTree === 'Equipment' ? 'Cast Iron Champion' : 
                   selectedTalentTree === 'Techniques' ? 'Grilling Heavy Weight' : 'Baking Warlock'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTalentTree(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-1 text-right"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {talentTrees[selectedTalentTree === 'Equipment' ? 'Cast Iron Champion' : 
                           selectedTalentTree === 'Techniques' ? 'Grilling Heavy Weight' : 'Baking Warlock']?.map(talent => {
                const xp = userProfile?.xp || 0;
                const level = Math.floor(xp / 100) + 1;
                const unlocked = level >= talent.unlockLevel;
                const selected = selectedTalents.includes(talent.name);
                const Icon = talent.icon;
                
                return (
                  <button
                    key={talent.name}
                    onClick={(e) => handleSelectTalent(talent.name, e.button === 2)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleSelectTalent(talent.name, true);
                    }}
                    disabled={!unlocked}
                    className={`relative group p-4 rounded-lg transition-all border min-h-[120px] flex flex-col items-center justify-center text-center ${
                      unlocked
                        ? selected
                          ? 'bg-maineBlue text-seafoam shadow-md border-maineBlue'
                          : 'bg-gray-50 hover:bg-seafoam hover:text-maineBlue border-gray-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mb-2 ${!unlocked ? 'opacity-40 grayscale' : ''}`} />
                    <div className="font-bold text-sm mb-1">{talent.name}</div>
                    {!unlocked && (
                      <div className="text-xs text-red-500">Unlocks at Level {talent.unlockLevel}</div>
                    )}
                    {selected && (
                      <div className="text-xs text-green-600 font-bold">✓ Selected</div>
                    )}
                    
                    {/* Hover/Click Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 hidden group-hover:block bg-white text-black p-3 rounded shadow-lg text-sm w-48 border border-gray-300">
                      <strong>{talent.name}</strong>
                      <div className="mt-1 text-xs">{talent.description}</div>
                      <div className="mt-1 text-xs text-gray-500">Unlocks at level {talent.unlockLevel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedTalentTree(null)}
                className="px-6 py-2 bg-maineBlue text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer with Terms of Service link */}
      <footer className="mt-8 text-center text-sm text-gray-500 py-4 border-t border-gray-200">
        <p> {new Date().getFullYear()} Porkchop. All rights reserved.</p>
        <button 
          onClick={() => setTermsModalOpen(true)}
          className="text-maineBlue hover:underline mt-1"
        >
          Terms of Service & Privacy Policy
        </button>
      </footer>
    </div>
  );
};

// EditProfileModal component moved outside of Profile component
function EditProfileModal({ 
  open, 
  onClose, 
  user,
  onProfileUpdated 
}: {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [experience, setExperience] = useState(user.experience || 'Beginner');
  const [dietary, setDietary] = useState<string[]>(user.dietary || []);
  const [cuisine, setCuisine] = useState<string[]>(user.cuisine || []);
  const [kitchenSetup, setKitchenSetup] = useState<string>(user.kitchenSetup || 'Apartment Kitchen');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(user.name);
      setEmail(user.email);
      setExperience(user.experience || 'Beginner');
      setDietary(user.dietary || []);
      setCuisine(user.cuisine || []);
      setKitchenSetup(user.kitchenSetup || 'Apartment Kitchen');
    }
  }, [open, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = {
        name,
        email,
        cooking_experience: EXPERIENCE_LEVEL_MAPPING[experience as keyof typeof EXPERIENCE_LEVEL_MAPPING] || 'new_to_cooking',  // Convert UI value to backend value
        dietary,                         // Array of selected dietary preferences
        cuisine,                         // Array of selected cuisine preferences  
        kitchen_setup: kitchenSetup     // String value from dropdown
      };

      console.log('Attempting to save just name:', updatedProfile);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully!');
      // Add this: Fetch the data back to see what actually saved
      const { data: savedData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('Data in database after save:', savedData);

      // ADD THIS: Update the local UI state with the saved data
      if (savedData) {
        onProfileUpdated({
          ...user,
          name: savedData.name,
          email: savedData.email,
          experience: EXPERIENCE_LEVEL_DISPLAY[savedData.cooking_experience as keyof typeof EXPERIENCE_LEVEL_DISPLAY] || 'Beginner', // Map backend value to UI display
          dietary: savedData.dietary || [],
          cuisine: savedData.cuisine || [],
          kitchenSetup: savedData.kitchen_setup
        });
      }

      onClose(); // Close the modal
      setIsSaving(false); // Reset saving state
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg mx-auto p-6 bg-weatheredWhite rounded shadow-lg">
      <h2 className="text-2xl font-retro mb-4 text-maineBlue">Edit Profile</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Your Name"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Your Email"
        />
      </div>
      
      {/* Preferences Section - Directly under Cooking Experience */}
      <h3 className="text-lg font-retro mb-2 text-maineBlue">Preferences</h3>
      {/* Cooking Experience - Single-Select Dropdown */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Experience</label>
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Professional">Professional</option>
        </select>
      </div>
      {/* Dietary Preferences - Single-Select Dropdown */}
      <div className="mb-3">
        <span className="block mb-1 font-semibold text-sm">Dietary</span>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-weatheredWhite text-maineBlue"
          value={dietary.length > 0 ? dietary[0] : ''}
          onChange={(e) => {
            setDietary(e.target.value ? [e.target.value] : []);
          }}
        >
          <option value="">None</option>
          {[
            'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Low-Carb', 'Keto', 'Paleo', 'Nut-Free', 'Halal', 'Kosher'
          ].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Cuisine Preferences - Single-Select Dropdown */}
      <div className="mb-3">
        <span className="block mb-1 font-semibold text-sm">Cuisine</span>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-weatheredWhite text-maineBlue"
          value={cuisine.length > 0 ? cuisine[0] : ''}
          onChange={(e) => {
            setCuisine(e.target.value ? [e.target.value] : []);
          }}
        >
          <option value="">None</option>
          {[
            'Italian', 'Thai', 'Seafood', 'Mexican', 'Japanese', 'Chinese', 'Indian', 'French', 'Greek', 'American', 'Spanish', 'Middle Eastern', 'Korean'
          ].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Kitchen Setup - Single-Select Dropdown */}
      <div className="mb-3">
        <span className="block mb-1 font-semibold text-sm">Kitchen Setup</span>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-weatheredWhite text-maineBlue"
          value={kitchenSetup}
          onChange={(e) => {
            setKitchenSetup(e.target.value);
          }}
          title={
            kitchenSetup === 'Apartment Kitchen' ? 'Basic stovetop and oven' :
            kitchenSetup === 'Outdoor Grilling' ? 'Grill and basic prep tools' :
            kitchenSetup === 'Home Chef' ? 'Standard equipment + some specialty tools' :
            kitchenSetup === 'Minimalist' ? 'Just the basics' :
            kitchenSetup === 'Dorm Life' ? 'Microwave, mini-fridge, and basic appliances' :
            'Professional setup with all equipment'
          }
        >
          {[
            'Apartment Kitchen',
            'Outdoor Grilling',
            'Home Chef',
            'Minimalist',
            'Dorm Life',
            'Full Chef\'s Kitchen'
          ].map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {kitchenSetup === 'Apartment Kitchen' && 'Basic stovetop and oven'}
          {kitchenSetup === 'Outdoor Grilling' && 'Grill and basic prep tools'}
          {kitchenSetup === 'Home Chef' && 'Standard equipment + some specialty tools'}
          {kitchenSetup === 'Minimalist' && 'Just the basics'}
          {kitchenSetup === 'Dorm Life' && 'Microwave, mini-fridge, and basic appliances'}
          {kitchenSetup === 'Full Chef\'s Kitchen' && 'Professional setup with all equipment'}
        </p>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-2 bg-seafoam text-maineBlue rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors ${
            isSaving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

// Modal component
type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`relative ${className || ''}`}>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// TermsModal component
interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
}

const TermsModal = ({ open, onClose, content }: TermsModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose} 
      className="max-w-4xl mx-auto p-6 bg-weatheredWhite rounded shadow-lg max-h-[80vh] overflow-auto"
    >
      <div className="prose max-w-none">
        <ReactMarkdown components={{
          p: ({node, ...props}) => <p className="markdown-content" {...props} />
        }}>
          {content}
        </ReactMarkdown>
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-maineBlue text-white rounded hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default Profile;
