import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, ChartBarIcon, FireIcon, LightBulbIcon, VideoCameraIcon, UserGroupIcon, HeartIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const StudentProgressDashboard: React.FC = () => {
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
    <div className={`${bgColor} border-4 ${borderColor} rounded-lg p-4 hover:scale-105 transition-transform duration-200 text-center`}>
      <div className="text-2xl mb-2">{emoji}</div>
      <h4 className={`font-medium ${textColor} mb-2`}>{title}</h4>
      <p className={`text-xs ${textColor} mb-3`}>{description}</p>
      <button 
        onClick={onClick}
        className="bg-maineBlue text-white px-4 py-1.5 rounded-md hover:bg-blue-700 font-retro text-sm"
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
      {/* Main Dashboard */}
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full max-w-6xl mx-auto">
        {/* Dashboard header - moved inside the module */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-retro text-maineBlue mb-2">Welcome to your Student Dashboard</h1>
          <p className="text-gray-600 italic">Click any module below to begin your culinary journey!</p>
        </div>
        
        {/* Separation line */}
        <hr className="border-t-2 border-maineBlue mb-6" />
        
        {/* Module Navigation */}
        <div className="mb-4 p-3">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
            <Link
              to="/my-kitchen"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-seafoam bg-teal-50 text-black hover:scale-105 transition-transform duration-200 text-center"
            >
              <div className="mb-3 text-4xl">🐟</div>
              <h3 className="text-sm font-bold font-retro">My Kitchen</h3>
            </Link>
            
            <Link
              to="/my-cookbook"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-blue-400 bg-blue-50 text-black hover:scale-105 transition-transform duration-200 text-center"
            >
              <div className="mb-3 text-4xl">📖</div>
              <h3 className="text-sm font-bold font-retro">My Cook Book</h3>
            </Link>
            
            <Link
              to="/chefs-corner"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-red-400 bg-red-50 text-black hover:scale-105 transition-transform duration-200 text-center"
            >
              <div className="mb-3 text-4xl">🦐</div>
              <h3 className="text-sm font-bold font-retro">Chefs' Corner</h3>
            </Link>
            
            <Link
              to="/culinary-school"
              className="flex flex-col items-center p-6 rounded-lg border-4 border-yellow-300 bg-yellow-50 text-black hover:scale-105 transition-transform duration-200 text-center"
            >
              <div className="mb-3 text-4xl">🍳</div>
              <h3 className="text-sm font-bold font-retro">Culinary School</h3>
            </Link>
          </div>
        </div>

        {/* Separation line */}
        <hr className="border-t-2 border-maineBlue mb-6" />

      {/* Live Session Notification Banner */}
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
              <span className="font-bold text-red-700 text-sm">LIVE NOW</span>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm text-red-800 transition-all duration-500">
                <span>
                  <strong>{activeLiveSessions[currentSessionIndex].hostName}</strong> is cooking{' '}
                  <strong>{activeLiveSessions[currentSessionIndex].dishName}</strong> • {activeLiveSessions[currentSessionIndex].viewers} watching
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeLiveSessions[currentSessionIndex].thumbnail}</span>
              <div className="bg-red-500 text-white text-xs px-4 py-2 rounded-full font-medium">
                🔴 Join Live
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

      {/* Separation line */}
      <hr className="border-t-2 border-maineBlue mb-6" />

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-3 border-4 border-maineBlue rounded-lg mb-4">
        <ProgressCard
          emoji="📚"
          title="Curriculum Progress"
          description=""
          buttonText="View Progress"
          bgColor="bg-blue-50"
          textColor="text-blue-800"
          borderColor="border-blue-400"
          onClick={() => alert('Curriculum modal coming soon')}
        />

        <ProgressCard
          emoji="⭐"
          title="Skill Development"
          description=""
          buttonText="View Development"
          bgColor="bg-green-50"
          textColor="text-green-800"
          borderColor="border-green-400"
          onClick={() => alert('Skills modal coming soon')}
        />

        <ProgressCard
          emoji="🔥"
          title="My Engagement"
          description=""
          buttonText="View Engagement"
          bgColor="bg-orange-50"
          textColor="text-orange-800"
          borderColor="border-orange-400"
          onClick={() => alert('Engagement modal coming soon')}
        />

        <ProgressCard
          emoji="🏆"
          title="Achievements"
          description=""
          buttonText="View Achievements"
          bgColor="bg-purple-50"
          textColor="text-purple-800"
          borderColor="border-purple-400"
          onClick={() => alert('Achievements modal coming soon')}
        />
      </div>
      </div>

      {/* Live Session Modal */}
      {liveSessionModalOpen && currentLiveSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-3 sm:p-6 w-full max-w-4xl h-full sm:h-auto max-h-[95vh] overflow-y-auto relative flex flex-col lg:flex-row gap-3 sm:gap-6">
            <button
              onClick={() => {
                setLiveSessionModalOpen(false);
                setIsViewer(false);
                setCurrentLiveSession(null);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            
            {/* Left Side - Video */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
                🔴 LIVE: {currentLiveSession.dishName}
              </h2>
              <p className="text-center text-sm text-gray-600 mb-4">
                Hosted by {currentLiveSession.hostName} • {currentLiveSession.culture} Cuisine
              </p>
              
              {/* Main Video Area */}
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">{currentLiveSession.thumbnail}</div>
                  <p className="text-lg">Watching {currentLiveSession.hostName}'s live session</p>
                  <p className="text-sm opacity-75">Live video stream would appear here</p>
                </div>
                
                {/* Live Indicator */}
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  LIVE
                </div>
                
                {/* Viewer Count */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                  👥 {viewerCount} viewers
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex justify-center space-x-4 mt-4">
                <button 
                  onClick={() => {
                    setLiveSessionModalOpen(false);
                    setIsViewer(false);
                    setCurrentLiveSession(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  👋 Leave Session
                </button>
              </div>
            </div>
            
            {/* Right Side - Community Feed */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 pt-6 lg:pt-0 lg:pl-6">
              <h3 className="text-lg font-bold mb-4 text-maineBlue">
                🌍 Community Feed
              </h3>
              
              {/* Quick Post - Mobile Only (moved to top) */}
              <div className="lg:hidden mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">👨‍🍳</span>
                  <input
                    type="text"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what you're cooking..."
                    className="flex-1 text-xs border border-gray-300 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-maineBlue focus:border-transparent"
                  />
                  <button 
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    className="bg-maineBlue text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
              
              {/* Quick Post - Desktop Only (original position) */}
              <div className="hidden lg:block pt-3 border-t border-gray-200 mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">👨‍🍳</span>
                  <input
                    type="text"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share what you're cooking..."
                    className="flex-1 text-xs border border-gray-300 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-maineBlue focus:border-transparent"
                  />
                  <button 
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    className="bg-maineBlue text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
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
