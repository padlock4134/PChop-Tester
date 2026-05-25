import React, { useState } from 'react';
import { HeartIcon, ChatBubbleOvalLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface TimelinePost {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  image?: string;
  type: 'project' | 'material' | 'story' | 'live' | 'success' | 'market';
  likes: number;
  comments: number;
  isLiked: boolean;
  tags?: string[];
}

const SocialTimeline: React.FC = () => {
  const [posts, setPosts] = useState<TimelinePost[]>([/*
    {
      id: '1',
      author: 'Sofia Rodriguez',
      avatar: '👩🏽‍🍳',
      timestamp: '2m',
      content: 'Just finished a full troubleshooting runbook for a recurring equipment fault. Root cause nailed and documented. 🛠️✅',
      image: '🍛',
      type: 'project',
      likes: 12,
      comments: 3,
      isLiked: false,
      tags: ['Mexican', 'FamilyRecipe', 'Mole']
    },
    {
      id: '2',
      author: 'Marcus Chen',
      avatar: '👨🏻‍🍳',
      timestamp: '15m',
      content: 'Found an excellent local supplier for replacement fittings and calibration tools. Huge win for this week\'s jobs. 📦',
      type: 'material',
      likes: 8,
      comments: 1,
      isLiked: true,
      tags: ['BlackGarlic', 'Portland', 'Korean']
    },
    {
      id: '3',
      author: 'Amara Okafor',
      avatar: '👩🏿‍🍳',
      timestamp: '32m',
      content: 'Going LIVE in 30 minutes! Teaching a preventive maintenance workflow and proper tool setup. Join in and run it with me! 🛠️📋',
      type: 'live',
      likes: 23,
      comments: 7,
      isLiked: false,
      tags: ['Nigerian', 'JollofRice', 'GoingLive']
    },
    {
      id: '4',
      author: 'Giuseppe Rossi',
      avatar: '👨🏻‍🍳',
      timestamp: '1h',
      content: 'Today\'s lab finally made sequencing click: inspect, isolate, test, verify. The workflow just clicked. 🔧',
      type: 'story',
      likes: 15,
      comments: 4,
      isLiked: true,
      tags: ['Italian', 'Pasta', 'Nonna']
    },
    {
      id: '5',
      author: 'Priya Patel',
      avatar: '👩🏽‍🍳',
      timestamp: '2h',
      content: 'SUCCESS! Finally nailed this diagnostic workflow after dozens of attempts 😅 Persistence and repeatable checks paid off!',
      image: '🥞',
      type: 'success',
      likes: 31,
      comments: 9,
      isLiked: false,
      tags: ['Indian', 'Dosa', 'Success']
    },
    {
      id: '6',
      author: 'Ahmed Hassan',
      avatar: '👨🏽‍🍳',
      timestamp: '3h',
      content: 'PSA: Local vendor has fresh stock of fasteners, seals, and meters. New shipment lands every Tuesday. 📦',
      type: 'market',
      likes: 19,
      comments: 5,
      isLiked: true,
      tags: ['Zaatar', 'Sumac', 'EasternMarket']
    }
  */]);

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

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'project': return '🧰';
      case 'material': return '📦';
      case 'story': return '💭';
      case 'live': return '🔴';
      case 'success': return '🎉';
      case 'market': return '🏪';
      default: return '📝';
    }
  };

  const getPostBorderColor = (type: string) => {
    switch (type) {
      case 'live': return 'border-l-red-500';
      case 'success': return 'border-l-green-500';
      case 'material': return 'border-l-blue-500';
      case 'market': return 'border-l-purple-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-retro text-maineBlue flex items-center">
          <span className="mr-2">🌊</span>
          Community Feed
        </h3>
        <p className="text-sm text-gray-600">What's happening in our trade community</p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {posts.map((post) => (
          <div key={post.id} className={`p-4 border-b border-gray-100 border-l-4 ${getPostBorderColor(post.type)} hover:bg-gray-50 transition-colors`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">{post.avatar}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">{post.author}</span>
                  <span className="text-lg">{getPostIcon(post.type)}</span>
                  <span className="text-xs text-gray-500">·</span>
                  <span className="text-xs text-gray-500">{post.timestamp}</span>
                </div>
                
                <p className="text-sm text-gray-800 mb-2 leading-relaxed">{post.content}</p>
                
                {post.image && (
                  <div className="mb-2">
                    <span className="text-4xl">{post.image}</span>
                  </div>
                )}
                
                {post.tags && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-sand text-gray-700 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    {post.isLiked ? (
                      <HeartSolidIcon className="h-4 w-4 text-red-500" />
                    ) : (
                      <HeartIcon className="h-4 w-4" />
                    )}
                    <span>{post.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                    <ChatBubbleOvalLeftIcon className="h-4 w-4" />
                    <span>{post.comments}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-500 transition-colors">
                    <ShareIcon className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🧰</span>
          <input
            type="text"
            placeholder="Share what you're building..."
            className="flex-1 text-sm border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue focus:border-transparent"
          />
          <button className="bg-maineBlue text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialTimeline;

