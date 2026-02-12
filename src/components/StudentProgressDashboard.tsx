import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AcademicCapIcon, ChartBarIcon, FireIcon, LightBulbIcon, VideoCameraIcon, UserGroupIcon, HeartIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const StudentProgressDashboard: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock student progress data
  // Mock live session data
  const activeLiveSessions = [
    {
      id: '2',
      hostName: 'Kenji Nakamura',
      dishName: 'Hand-pulled Ramen',
      culture: 'Japanese',
      viewers: 23,
      thumbnail: '🍜'
    },
    {
      id: '3',
      hostName: 'Fatima Al-Zahra',
      dishName: 'Lebanese Kibbeh',
      culture: 'Lebanese',
      viewers: 35,
      thumbnail: '🧆'
    },
    {
      id: '4',
      hostName: 'Jean-Luc Dubois',
      dishName: 'French Croissants',
      culture: 'French',
      viewers: 62,
      thumbnail: '🥐'
    },
    {
      id: '5',
      hostName: 'Maria Santos',
      dishName: 'Authentic Paella',
      culture: 'Spanish',
      viewers: 28,
      thumbnail: '🥘'
    }
  ];

  // Auto-scroll state
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Live session modal states
  const [liveSessionModalOpen, setLiveSessionModalOpen] = useState(false);
  const [currentLiveSession, setCurrentLiveSession] = useState<any>(null);
  const [isViewer, setIsViewer] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [newPost, setNewPost] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Progress card modal states
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [engagementModalOpen, setEngagementModalOpen] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  
  // Mobile tab state
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'live' | 'actions'>('home');

  // Mock community feed data
  const [posts, setPosts] = useState([
    {
      id: '1',
      author: 'Sofia Rodriguez',
      avatar: '👩🏽‍🍳',
      timestamp: '2m',
      content: 'Just finished making my abuela\'s mole recipe! The secret is toasting the chiles until they\'re fragrant but not burnt. 🌶️✨',
      image: '🍛',
      type: 'recipe' as const,
      likes: 12,
      comments: 3,
      isLiked: false
    },
    {
      id: '2',
      author: 'Marcus Chen',
      avatar: '👨🏻‍🍳',
      timestamp: '15m',
      content: 'Found the most incredible black garlic at Portland Farmers Market! Perfect for my Korean-fusion experiments 🧄',
      type: 'ingredient' as const,
      likes: 8,
      comments: 1,
      isLiked: true
    }
  ]);

  const progressData = {
    curriculum: {
      completedLessons: 12,
      totalLessons: 24,
      currentLesson: "Knife Skills: Julienne Technique",
      timeSpent: "18.5 hours"
    },
    skills: {
      recipesAttempted: 8,
      recipesCompleted: 6,
      currentLevel: "Intermediate",
      nextMilestone: "Advanced Sauces"
    },
    engagement: {
      appUsage: "5 days this week",
      liveSessionsAttended: 3,
      communityPosts: 7,
      recipesSaved: 15
    },
    insights: {
      strongestArea: "Knife Skills",
      improvementArea: "Timing & Multitasking",
      learningVelocity: "Above Average",
      achievements: ["Safety Certified", "Recipe Creator", "Community Helper"]
    }
  };

  interface ProgressCardProps {
    emoji: string;
    title: string;
    description: string;
    buttonText: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    onClick: () => void;
  }

  const ProgressCard: React.FC<ProgressCardProps> = ({ emoji, title, description, buttonText, bgColor, textColor, borderColor, onClick }) => (
    <div className={`${bgColor} border-4 ${borderColor} rounded-lg p-6 hover:scale-105 transition-transform duration-200 text-center`}>
      <div className="text-4xl mb-3">{emoji}</div>
      <h4 className="font-semibold text-gray-900 mb-2 font-retro">{title}</h4>
      <p className="text-sm text-gray-600 mb-3 italic">{description}</p>
      <button 
        onClick={onClick}
        className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
      >
        {buttonText}
      </button>
    </div>
  );

  // Auto-scroll effect
  useEffect(() => {
    if (activeLiveSessions.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        setCurrentSessionIndex((prev) => {
          const nextIndex = (prev + 1) % activeLiveSessions.length;
          console.log('Auto-scrolling to session:', nextIndex, activeLiveSessions[nextIndex]?.hostName);
          return nextIndex;
        });
      }, 3000); // 3 second intervals

      return () => clearInterval(interval);
    }
  }, [activeLiveSessions.length, isPaused]);

  // Initialize auto-scroll on component mount
  useEffect(() => {
    console.log('Live sessions loaded:', activeLiveSessions.length, 'sessions');
    console.log('Current session index:', currentSessionIndex);
    console.log('Is paused:', isPaused);
    
    // Force start auto-scroll immediately
    if (activeLiveSessions.length > 1) {
      console.log('Starting auto-scroll with', activeLiveSessions.length, 'sessions');
    }
  }, []);

  // Debug current session changes
  useEffect(() => {
    if (activeLiveSessions[currentSessionIndex]) {
      console.log('Current session changed to:', currentSessionIndex, '-', activeLiveSessions[currentSessionIndex].hostName, activeLiveSessions[currentSessionIndex].dishName);
    }
  }, [currentSessionIndex]);

  // Join live session function
  const joinLiveSession = (session: any) => {
    console.log('Joining live session:', session);
    setCurrentLiveSession(session);
    setIsViewer(true);
    setViewerCount(session.viewers);
    setLiveSessionModalOpen(true);
  };

  // Handle posting in community feed
  const handlePost = () => {
    if (newPost.trim()) {
      const newPostObj = {
        id: Date.now().toString(),
        author: 'You',
        avatar: '👨‍🍳',
        timestamp: 'now',
        content: newPost,
        type: 'ingredient' as const,
        likes: 0,
        comments: 0,
        isLiked: false
      };
      
      setPosts(prev => [newPostObj, ...prev]);
      setNewPost('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePost();
    }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const getPostBorderColor = (type: string) => {
    switch (type) {
      case 'recipe': return 'border-blue-400';
      case 'ingredient': return 'border-green-400';
      case 'live': return 'border-red-400';
      default: return 'border-gray-400';
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'recipe': return '📝';
      case 'ingredient': return '🛒';
      case 'live': return '🔴';
      default: return '💭';
    }
  };

  return (
    <div className="mb-8 mx-auto">
      {/* Mobile Tab Bar - Only visible on mobile */}
      <div className="lg:hidden mb-4 flex gap-1 border-b-2 border-maineBlue max-w-6xl mx-auto">
        <button
          onClick={() => setActiveMobileTab('home')}
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'home'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🏠 {t('dashboard.home')}
        </button>
        <button
          onClick={() => setActiveMobileTab('live')}
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'live'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔴 {t('dashboard.live')}
        </button>
        <button
          onClick={() => setActiveMobileTab('actions')}
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'actions'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 {t('dashboard.quickActions')}
        </button>
      </div>
      
      {/* Main Dashboard */}
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full max-w-6xl mx-auto">
        {/* Home Tab Content */}
        <div className={`${activeMobileTab === 'home' ? 'block' : 'hidden'} lg:block`}>
          {/* Dashboard header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-retro text-maineBlue mb-2">{t('dashboard.studentView')}</h1>
            <p className="text-gray-600 italic">{t('dashboard.clickModule')}</p>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
          
          {/* Module Navigation */}
          <div className="mb-4 p-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
            <Link
              to="/my-kitchen"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-seafoam bg-teal-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]"
            >
              <div className="mb-3 text-4xl">🐟</div>
              <h3 className="text-sm font-bold font-retro">{t('myKitchen.title')}</h3>
            </Link>
            
            <Link
              to="/my-cookbook"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-blue-400 bg-blue-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]"
            >
              <div className="mb-3 text-4xl">📖</div>
              <h3 className="text-sm font-bold font-retro">{t('myCookBook.title')}</h3>
            </Link>
            
            <Link
              to="/chefs-corner"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-red-400 bg-red-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]"
            >
              <div className="mb-3 text-4xl">🦐</div>
              <h3 className="text-sm font-bold font-retro">{t('chefsCorner.title')}</h3>
            </Link>
            
            <Link
              to="/culinary-school"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-yellow-300 bg-yellow-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]"
            >
              <div className="mb-3 text-4xl">🍳</div>
              <h3 className="text-sm font-bold font-retro">{t('culinarySchool.title')}</h3>
            </Link>
          </div>
          </div>
        </div>

        {/* Live Tab Content */}
        <div className={`${activeMobileTab === 'live' ? 'block' : 'hidden'} lg:block`}>

          {/* Mobile: Vertical Stacked Live Sessions List */}
          <div className="lg:hidden">
            {activeLiveSessions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-red-700 text-sm">{t('dashboard.liveNow')} ({activeLiveSessions.length} {t('dashboard.sessions')})</span>
                </div>
                
                {activeLiveSessions.slice(0, 4).map((session, index) => (
                  <div
                    key={session.id}
                    onClick={() => joinLiveSession(session)}
                    className="bg-red-50 border-4 border-red-400 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{session.thumbnail}</span>
                        <div className="flex-1">
                          <div className="font-bold text-red-900 text-sm">{session.hostName}</div>
                          <div className="text-red-800 text-xs">{session.dishName}</div>
                          <div className="text-red-600 text-xs mt-1">{session.viewers} {t('dashboard.watching')}</div>
                        </div>
                      </div>
                      <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
                        🔴 {t('dashboard.join')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Carousel */}
          <div className="hidden lg:block">
            {activeLiveSessions.length > 0 && (
              <div 
                className="bg-red-50 border-4 border-red-400 rounded-lg p-3 mb-4 cursor-pointer"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onClick={() => joinLiveSession(activeLiveSessions[currentSessionIndex])}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center mr-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    <VideoCameraIcon className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-bold text-red-700 text-sm">{t('dashboard.liveNow')}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-sm text-red-800 transition-all duration-500">
                      <span>
                        <strong>{activeLiveSessions[currentSessionIndex].hostName}</strong> {t('dashboard.isCooking')}{' '}
                        <strong>{activeLiveSessions[currentSessionIndex].dishName}</strong> • {activeLiveSessions[currentSessionIndex].viewers} {t('dashboard.watching')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeLiveSessions[currentSessionIndex].thumbnail}</span>
                    <div className="bg-red-500 text-white text-xs px-4 py-2 rounded-full font-medium">
                      🔴 {t('dashboard.join')}
                    </div>
                  </div>
                </div>
            
                {/* Progress dots */}
                {activeLiveSessions.length > 1 && (
                  <div className="flex justify-center mt-3 gap-1">
                    {activeLiveSessions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentSessionIndex ? 'bg-red-500' : 'bg-red-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Tab Content */}
        <div className={`${activeMobileTab === 'actions' ? 'block' : 'hidden'} lg:block`}>
          {/* Progress Cards Container with Blue Border */}
          <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProgressCard
              emoji="📚"
              title={t('dashboard.learningProgress')}
              description={t('dashboard.trackLessons')}
              buttonText={t('dashboard.viewDetails')}
              bgColor="bg-blue-50"
              textColor="text-blue-800"
              borderColor="border-blue-400"
              onClick={() => setCurriculumModalOpen(true)}
            />

            <ProgressCard
              emoji="⭐"
              title={t('dashboard.skillsDevelopment')}
              description={t('dashboard.monitorSkills')}
              buttonText={t('dashboard.viewDetails')}
              bgColor="bg-green-50"
              textColor="text-green-800"
              borderColor="border-green-400"
              onClick={() => setSkillsModalOpen(true)}
            />

            <ProgressCard
              emoji="🏆"
              title={t('dashboard.achievements')}
              description={t('dashboard.viewBadges')}
              buttonText={t('dashboard.viewDetails')}
              bgColor="bg-purple-50"
              textColor="text-purple-800"
              borderColor="border-purple-400"
              onClick={() => setAchievementsModalOpen(true)}
            />
            </div>
          </div>
        </div>
      </div>
      
      {/* Curriculum Progress Modal */}
      {curriculumModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">📚 {t('dashboard.learningProgress')}</h2>
              <button
                onClick={() => setCurriculumModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                <div className="text-4xl font-bold text-blue-600 text-center">
                  {progressData.curriculum.completedLessons}/{progressData.curriculum.totalLessons}
                </div>
                <p className="text-center text-blue-800 font-medium mt-2">{t('dashboard.lessonsCompleted')}</p>
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">{t('dashboard.currentLesson')}</h3>
                <p className="text-gray-700">{progressData.curriculum.currentLesson}</p>
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">{t('dashboard.timeSpentLearning')}</h3>
                <p className="text-gray-700">{progressData.curriculum.timeSpent}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills Development Modal */}
      {skillsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-600 font-retro">⭐ {t('dashboard.skillsDevelopment')}</h2>
              <button
                onClick={() => setSkillsModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4">
                <div className="text-4xl font-bold text-green-600 text-center">
                  {progressData.skills.currentLevel}
                </div>
                <p className="text-center text-green-800 font-medium mt-2">{t('dashboard.currentSkillLevel')}</p>
              </div>
              <div className="border-4 border-green-400 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">{t('dashboard.recipesCompleted')}</h3>
                <p className="text-gray-700">{progressData.skills.recipesCompleted} {t('dashboard.outOf')} {progressData.skills.recipesAttempted} {t('dashboard.attempted')}</p>
              </div>
              <div className="border-4 border-green-400 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">{t('dashboard.nextMilestone')}</h3>
                <p className="text-gray-700">{progressData.skills.nextMilestone}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {achievementsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600 font-retro">🏆 {t('dashboard.achievements')}</h2>
              <button
                onClick={() => setAchievementsModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4">
                <div className="text-4xl font-bold text-purple-600 text-center">
                  {progressData.insights.achievements.length}
                </div>
                <p className="text-center text-purple-800 font-medium mt-2">Achievements Earned</p>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">Your Achievements:</h3>
                <div className="space-y-2">
                  {progressData.insights.achievements.map((achievement, index) => (
                    <div key={index} className="bg-purple-50 rounded p-3 text-gray-700 flex items-center">
                      <span className="text-2xl mr-3">🏅</span>
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">{t('dashboard.strongestArea')}</h3>
                <p className="text-gray-700">{progressData.insights.strongestArea}</p>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">{t('dashboard.areaForImprovement')}</h3>
                <p className="text-gray-700">{progressData.insights.improvementArea}</p>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">{t('dashboard.learningVelocity')}</h3>
                <p className="text-gray-700">{progressData.insights.learningVelocity}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Session Modal */}
      {liveSessionModalOpen && currentLiveSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black overflow-hidden w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] relative flex flex-col lg:flex-row">
            {/* Header */}
            <div className="p-4 bg-lobsterRed text-black font-retro text-center sticky top-0 z-20">
              <div className="text-center relative">
                <h2 className="text-xl sm:text-2xl font-bold">🔴 LIVE: {currentLiveSession.dishName}</h2>
                <button
                  onClick={() => {
                    setLiveSessionModalOpen(false);
                    setIsViewer(false);
                    setCurrentLiveSession(null);
                  }}
                  className="absolute top-0 right-0 text-white hover:text-white/80 text-2xl font-bold drop-shadow"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-black mt-2 sm:mt-3 text-xs sm:text-sm">
                Hosted by {currentLiveSession.hostName} • {currentLiveSession.culture} Cuisine
              </p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-6">
                {/* Left Side - Video */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Main Video Area */}
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue w-full">
                    <div className="text-white text-center">
                      <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{currentLiveSession.thumbnail}</div>
                      <p className="text-sm sm:text-lg">Watching {currentLiveSession.hostName}'s live session</p>
                      <p className="text-xs sm:text-sm opacity-75">Live video stream would appear here</p>
                    </div>
                    
                    {/* Live Indicator */}
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-red-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                      LIVE
                    </div>
                    
                    {/* Viewer Count */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
                      👥 {viewerCount} viewers
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex justify-center mt-3 sm:mt-4 mb-8 sm:mb-12">
                    <button 
                      onClick={() => {
                        setLiveSessionModalOpen(false);
                        setIsViewer(false);
                        setCurrentLiveSession(null);
                      }}
                      className="w-full sm:w-auto bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base min-h-[44px]"
                    >
                      👋 Leave Session
                    </button>
                  </div>
                </div>
                
                {/* Right Side - Community Feed (sidebar on desktop, hidden on mobile) */}
                <div className="hidden lg:flex lg:w-80 border-l-4 border-gray-200 flex-col overflow-hidden">
                  <h3 className="text-base sm:text-lg font-bold text-center text-black bg-lobsterRed py-3 px-2">
                    🌍 Community Feed
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                    {posts.slice(0, 5).map((post) => (
                      <div key={post.id} className={`p-3 border-b border-gray-100 border-l-4 ${getPostBorderColor(post.type)} hover:bg-gray-50 transition-colors`}>
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <span className="text-sm">{post.avatar}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-1">
                              <span className="font-semibold text-xs text-gray-900">{post.author}</span>
                              <span className="text-sm">{getPostIcon(post.type)}</span>
                              <span className="text-xs text-gray-500">·</span>
                              <span className="text-xs text-gray-500">{post.timestamp}</span>
                            </div>
                            
                            <p className="text-xs text-gray-800 mb-2 leading-relaxed">{post.content}</p>
                            
                            {post.image && (
                              <div className="mb-2">
                                <span className="text-lg">{post.image}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3 mt-1">
                              <button
                                onClick={() => handleLike(post.id)}
                                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                              >
                                {post.isLiked ? (
                                  <HeartSolidIcon className="h-3 w-3 text-red-500" />
                                ) : (
                                  <HeartIcon className="h-3 w-3" />
                                )}
                                <span>{post.likes}</span>
                              </button>
                              
                              <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                                <ChatBubbleOvalLeftIcon className="h-3 w-3" />
                                <span>{post.comments}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Feed below controls */}
              <div className="lg:hidden mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-base sm:text-lg font-bold text-center text-black bg-lobsterRed py-3 px-2">
                  🌍 Community Feed
                </h3>
                <div className="mt-3 space-y-3 max-h-72 overflow-y-auto pb-16">
                  {posts.slice(0, 5).map((post) => (
                    <div key={post.id} className={`p-3 border-b border-gray-100 border-l-4 ${getPostBorderColor(post.type)} hover:bg-gray-50 transition-colors`}>
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          <span className="text-sm">{post.avatar}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="font-semibold text-xs text-gray-900">{post.author}</span>
                            <span className="text-sm">{getPostIcon(post.type)}</span>
                            <span className="text-xs text-gray-500">·</span>
                            <span className="text-xs text-gray-500">{post.timestamp}</span>
                          </div>
                          <p className="text-xs text-gray-800 mb-2 leading-relaxed">{post.content}</p>
                          {post.image && (
                            <div className="mb-2">
                              <span className="text-lg">{post.image}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-3 mt-1">
                            <button
                              onClick={() => handleLike(post.id)}
                              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                            >
                              {post.isLiked ? (
                                <HeartSolidIcon className="h-3 w-3 text-red-500" />
                              ) : (
                                <HeartIcon className="h-3 w-3" />
                              )}
                              <span>{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                              <ChatBubbleOvalLeftIcon className="h-3 w-3" />
                              <span>{post.comments}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile post input fixed within feed */}
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 pt-3 pb-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">👨‍🍳</span>
                    <input
                      type="text"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share what you're cooking..."
                      className="flex-1 text-xs border-4 border-gray-300 rounded-full px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-maineBlue focus:border-transparent min-h-[44px]"
                    />
                    <button 
                      onClick={handlePost}
                      disabled={!newPost.trim()}
                      className="bg-maineBlue text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgressDashboard;
