import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { useSupabase } from './SupabaseProvider';
import { askChefFreddie } from '../api/chefFreddie';
import {
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRecipes: number;
  totalXP: number;
  subscriptions: {
    active: number;
    trial: number;
    cancelled: number;
  };
}

interface User {
  id: string;
  email: string;
  username?: string;
  xp: number;
  level: number;
  created_at: string;
  last_chat_date?: string;
  chat_count: number;
}

interface AdminDashboardProps {
  onClose?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRecipes: 0,
    totalXP: 0,
    subscriptions: { active: 0, trial: 0, cancelled: 0 }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showJobPlacementModal, setShowJobPlacementModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [showModuleIntegrationModal, setShowModuleIntegrationModal] = useState(false);
  const [showContentAnalyticsModal, setShowContentAnalyticsModal] = useState(false);
  const [showConfigurationModal, setShowConfigurationModal] = useState(false);
  const [showUserActivityModal, setShowUserActivityModal] = useState(false);
  const [showProgramPerformanceModal, setShowProgramPerformanceModal] = useState(false);
  const [showEnrollmentHealthModal, setShowEnrollmentHealthModal] = useState(false);
  const [showStudentManagementModal, setShowStudentManagementModal] = useState(false);
  const [showFacultyManagementModal, setShowFacultyManagementModal] = useState(false);
  const [showAlumniManagementModal, setShowAlumniManagementModal] = useState(false);
  const [showBrowseFilesModal, setShowBrowseFilesModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  const [showChefFreddieModal, setShowChefFreddieModal] = useState(false);
  const [freddieMessages, setFreddieMessages] = useState<Array<{sender: 'freddie' | 'user', text: string}>>([]);
  const [freddieInput, setFreddieInput] = useState('');
  const [freddieLoading, setFreddieLoading] = useState(false);
  const { user: currentUser } = useSupabase();

  // Initialize Chef Freddie with welcome message
  useEffect(() => {
    if (showChefFreddieModal && freddieMessages.length === 0) {
      setFreddieMessages([{
        sender: 'freddie',
        text: "Hi! I'm Chef Freddie, your curriculum assistant. I can help you create assignments, lesson plans, rubrics, and apply curriculum to your modules. Try asking me something like: 'Create a Week 5 assignment for sauce making' or 'Design a rubric for knife skills assessment'"
      }]);
    }
  }, [showChefFreddieModal, freddieMessages.length]);

  // Function to send message to Chef Freddie
  const sendFreddieMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id) return;
    
    // Add user message
    setFreddieMessages(prev => [...prev, { sender: 'user', text: message }]);
    setFreddieInput('');
    setFreddieLoading(true);
    
    try {
      // Create curriculum-focused prompt
      const curriculumPrompt = `You are Chef Freddie, a curriculum assistant for culinary trade schools. Help create educational content, assignments, lesson plans, and rubrics for culinary education. Focus on practical cooking skills, food safety, kitchen management, and professional culinary techniques. Here's the request: ${message}`;
      
      const response = await askChefFreddie(currentUser.id, curriculumPrompt);
      setFreddieMessages(prev => [...prev, { sender: 'freddie', text: response }]);
    } catch (error: any) {
      setFreddieMessages(prev => [...prev, { 
        sender: 'freddie', 
        text: error.message || 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setFreddieLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    // Set up real-time subscriptions for live admin dashboard updates
    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('Profile data changed, refreshing admin stats...');
        fetchAdminData();
      })
      .subscribe();

    const sessionsSubscription = supabase
      .channel('sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scheduled_sessions' }, () => {
        console.log('Session data changed, refreshing admin stats...');
        fetchAdminData();
      })
      .subscribe();

    const reportsSubscription = supabase
      .channel('reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_reports' }, () => {
        console.log('New reports received, refreshing admin stats...');
        fetchAdminData();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(sessionsSubscription);
      supabase.removeChannel(reportsSubscription);
    };
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users with profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, username, xp, level, created_at, last_chat_date, chat_count')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch total XP
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('xp');
      
      const totalXP = xpData?.reduce((sum, user) => sum + (user.xp || 0), 0) || 0;

      // Fetch subscriptions
      const { data: subsData } = await supabase
        .from('user_subscriptions')
        .select('status');

      const subscriptions = {
        active: subsData?.filter(s => s.status === 'active').length || 0,
        trial: subsData?.filter(s => s.status === 'trialing').length || 0,
        cancelled: subsData?.filter(s => s.status === 'cancelled').length || 0,
      };

      // Fetch cookbook data for recipe count
      const { data: cookbookData } = await supabase
        .from('user_cookbook')
        .select('recipes');
      
      const totalRecipes = cookbookData?.reduce((sum, cookbook) => {
        const recipes = cookbook.recipes || [];
        return sum + (Array.isArray(recipes) ? recipes.length : 0);
      }, 0) || 0;

      // Calculate active users (logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = usersData?.filter(user => {
        return user.last_chat_date && new Date(user.last_chat_date) > sevenDaysAgo;
      }).length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        activeUsers,
        totalRecipes,
        totalXP,
        subscriptions,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserXP = async (userId: string, newXP: number) => {
    try {
      const { error } = await supabase
        .from('user_xp')
        .upsert({ user_id: userId, xp: newXP });
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, xp: newXP } : user
      ));
      
      alert('XP updated successfully!');
    } catch (error) {
      console.error('Error updating XP:', error);
      alert('Failed to update XP');
    }
  };

  const resetUserChatCount = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ chat_count: 0, last_chat_date: null })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, chat_count: 0, last_chat_date: undefined } : user
      ));
      
      alert('Chat count reset successfully!');
    } catch (error) {
      console.error('Error resetting chat count:', error);
      alert('Failed to reset chat count');
    }
  };

  const StatCard = ({ title, value, icon: Icon }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border-4 border-maineBlue">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 font-retro">{title}</p>
          <p className="text-2xl font-bold text-maineBlue">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-maineBlue" />
      </div>
    </div>
  );

  const UserEditModal = () => {
    const [xpValue, setXpValue] = useState(selectedUser?.xp || 0);
    
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-bold text-maineBlue mb-4">
            Edit User: {selectedUser.email}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                XP Points
              </label>
              <input
                type="number"
                value={xpValue}
                onChange={(e) => setXpValue(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateUserXP(selectedUser.id, xpValue);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-maineBlue text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-maineBlue text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="mb-8 mx-auto">
      {/* Main Admin Dashboard - matching student dashboard style */}
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full max-w-6xl mx-auto">
        {/* Dashboard header - matching student dashboard */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-retro text-maineBlue mb-2">👑 School Admin Dashboard</h1>
          <p className="text-gray-600 italic">Manage your school's curriculum delivery and student engagement!</p>
        </div>
        
        {/* Separation line */}
        <hr className="border-t-2 border-maineBlue mb-6" />
        
        {/* Admin Module Navigation - matching student dashboard grid */}
        <div className="mb-4 p-3">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'overview' 
                  ? 'border-seafoam bg-teal-50 scale-105' 
                  : 'border-seafoam bg-teal-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">🌡️</div>
              <h3 className="text-sm font-bold font-retro">Program Health</h3>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'users' 
                  ? 'border-blue-400 bg-blue-50 scale-105' 
                  : 'border-blue-400 bg-blue-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">🎓</div>
              <h3 className="text-sm font-bold font-retro">People Management</h3>
            </button>
            
            <button
              onClick={() => setActiveTab('content')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'content' 
                  ? 'border-red-400 bg-red-50 scale-105' 
                  : 'border-red-400 bg-red-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">📚</div>
              <h3 className="text-sm font-bold font-retro">Curriculum & Content</h3>
            </button>
            
            <button
              onClick={() => setActiveTab('system')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'system' 
                  ? 'border-yellow-300 bg-yellow-50 scale-105' 
                  : 'border-yellow-300 bg-yellow-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">🏫</div>
              <h3 className="text-sm font-bold font-retro">School Settings</h3>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Program Health */}
            <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
              <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">Program Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">👥</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">User Activity</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">Monitor student engagement, login patterns, and module usage across the platform</p>
                  <button 
                    onClick={() => setShowUserActivityModal(true)}
                    className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                  >
                    View Activity
                  </button>
                </div>
                <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">📊</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">Program Performance</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">Track completion rates, job placement success, and overall program effectiveness</p>
                  <button 
                    onClick={() => setShowProgramPerformanceModal(true)}
                    className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                  >
                    View Performance
                  </button>
                </div>
                <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">📈</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">Enrollment Health</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">Monitor enrollment trends, retention rates, and student satisfaction metrics</p>
                  <button 
                    onClick={() => setShowEnrollmentHealthModal(true)}
                    className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                  >
                    View Enrollment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
            <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">People Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎓</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Student Management</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Manage student progress, XP levels, and academic performance tracking</p>
                <button 
                  onClick={() => setShowStudentManagementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Manage Students
                </button>
              </div>
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">👩‍🏫</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Faculty Management</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Manage instructor access, permissions, and curriculum responsibilities</p>
                <button 
                  onClick={() => setShowFacultyManagementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Manage Faculty
                </button>
              </div>
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎓</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Alumni Management</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Track graduate success stories, career outcomes, and maintain alumni network connections</p>
                <button 
                  onClick={() => setShowAlumniManagementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Manage Alumni
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
            <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">Content Integration & Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">�</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Module Integration</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Connect MyCookBook recipes to CulinarySchool curriculum and assignments</p>
                <button 
                  onClick={() => setShowModuleIntegrationModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Manage Connections
                </button>
              </div>
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">�</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Content Analytics</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Monitor content usage, engagement, and curriculum completion across all modules</p>
                <button 
                  onClick={() => setShowContentAnalyticsModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  View Analytics
                </button>
              </div>
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">⚙️</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Cross-Platform Configuration</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Configure content permissions, access levels, and approval workflows</p>
                <button 
                  onClick={() => setShowConfigurationModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Configure Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
            <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">School Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-4 border-blue-300 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎨</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">School Branding</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Customize platform with your school's identity</p>
                <button 
                  onClick={() => setShowBrandingModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Customize Branding
                </button>
              </div>
              
              <div className="border-4 border-green-300 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎯</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Job Placement & Career Services</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Track graduate employment rates and industry partnerships</p>
                <button 
                  onClick={() => setShowJobPlacementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Manage Placements
                </button>
              </div>

              <div className="border-4 border-purple-300 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">📊</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Export Reports</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Generate reports for accreditation and outcomes</p>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Export School Reports</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Select the reports you want to generate and download:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4 hover:bg-blue-100 cursor-pointer">
                <input type="checkbox" id="student-progress" className="mr-3" />
                <label htmlFor="student-progress" className="font-semibold cursor-pointer">📊 Student Progress</label>
                <p className="text-sm text-gray-600 ml-6">Skill mastery tracking, learning analytics</p>
              </div>
              
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-4 hover:bg-green-100 cursor-pointer">
                <input type="checkbox" id="class-analytics" className="mr-3" />
                <label htmlFor="class-analytics" className="font-semibold cursor-pointer">👥 Class Analytics</label>
                <p className="text-sm text-gray-600 ml-6">Performance metrics, live session data</p>
              </div>
              
              <div className="border-4 border-orange-400 bg-orange-50 rounded-lg p-4 hover:bg-orange-100 cursor-pointer">
                <input type="checkbox" id="culinary-metrics" className="mr-3" />
                <label htmlFor="culinary-metrics" className="font-semibold cursor-pointer">🍳 Culinary Metrics</label>
                <p className="text-sm text-gray-600 ml-6">Recipe performance, technique analysis</p>
              </div>
              
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-4 hover:bg-purple-100 cursor-pointer">
                <input type="checkbox" id="operations" className="mr-3" />
                <label htmlFor="operations" className="font-semibold cursor-pointer">🏪 Operations</label>
                <p className="text-sm text-gray-600 ml-6">Kitchen management, safety & compliance</p>
              </div>
              
              <div className="border-4 border-pink-400 bg-pink-50 rounded-lg p-4 hover:bg-pink-100 cursor-pointer">
                <input type="checkbox" id="engagement" className="mr-3" />
                <label htmlFor="engagement" className="font-semibold cursor-pointer">📱 Engagement</label>
                <p className="text-sm text-gray-600 ml-6">Platform usage, community participation</p>
              </div>
              
              <div className="border-4 border-red-400 bg-red-50 rounded-lg p-4 hover:bg-red-100 cursor-pointer">
                <input type="checkbox" id="session-reports" className="mr-3" />
                <label htmlFor="session-reports" className="font-semibold cursor-pointer">🚨 Session Reports</label>
                <p className="text-sm text-gray-600 ml-6">Flagged content, scheduled sessions</p>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Generating selected reports... Downloads will begin shortly.');
                  setShowExportModal(false);
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Generate Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Placement Modal */}
      {showJobPlacementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Job Placement & Career Services</h2>
              <button
                onClick={() => setShowJobPlacementModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Track graduate employment outcomes, manage industry partnerships, and monitor career services effectiveness.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Employment Tracking */}
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">📈</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Employment Tracking</h3>
                <p className="text-sm text-gray-600 mb-4">Monitor graduate employment rates and job placement statistics</p>
                <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-retro w-full">
                  View Employment Data
                </button>
              </div>

              {/* Industry Partnerships */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🤝</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Industry Partnerships</h3>
                <p className="text-sm text-gray-600 mb-4">Manage relationships with restaurants, hotels, and culinary employers</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro w-full">
                  Manage Partners
                </button>
              </div>

              {/* Career Services */}
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">💼</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Career Services</h3>
                <p className="text-sm text-gray-600 mb-4">Coordinate job fairs, internships, and career counseling services</p>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-retro w-full">
                  Manage Services
                </button>
              </div>

              {/* Alumni Network */}
              <div className="border-4 border-orange-400 bg-orange-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎓</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Alumni Network</h3>
                <p className="text-sm text-gray-600 mb-4">Track alumni success stories and maintain graduate connections</p>
                <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 font-retro w-full">
                  Alumni Database
                </button>
              </div>
            </div>
            
            <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 mb-6">
              <h4 className="text-center font-bold text-green-900 mb-2">🎯 Key Placement Metrics:</h4>
              <ul className="text-center text-sm text-green-800 space-y-1">
                <li>• Graduate employment rate within 6 months</li>
                <li>• Average starting salary by program</li>
                <li>• Industry sector placement distribution</li>
                <li>• Employer satisfaction ratings</li>
                <li>• Alumni career advancement tracking</li>
                <li>• Internship to full-time conversion rates</li>
              </ul>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowJobPlacementModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Branding Modal */}
      {showBrandingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">School Branding & Identity</h2>
              <button
                onClick={() => setShowBrandingModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Customize PorkChop's appearance to match your school's brand and identity.</p>
            
            <div className="space-y-6">
              {/* School Logo */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">🏦 School Logo</h3>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className=" text-gray-400 text-sm">Logo</span>
                  </div>
                  <div className="flex-1">
                    <button className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro">
                      Upload Logo
                    </button>
                    <p className="text-sm text-gray-500 mt-1">Recommended: 200x200px, PNG or JPG</p>
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-blue-900 mb-3">📝 School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-center text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="Culinary Institute of Excellence"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      placeholder="Where Culinary Dreams Come True"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">School Description</label>
                    <textarea
                      rows={3}
                      placeholder="Brief description of your culinary program..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-blue-900 mb-3">🎨 Color Scheme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#1e40af" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#1e40af</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#059669" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#059669</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#dc2626" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#dc2626</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Background</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#f8fafc" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#f8fafc</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-blue-900 mb-3">📞 Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="info@culinaryschool.edu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      placeholder="123 Culinary Way, Food City, FC 12345"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowBrandingModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Branding settings saved successfully!');
                  setShowBrandingModal(false);
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Save Branding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module Integration Modal */}
      {showModuleIntegrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Content Upload & Distribution</h2>
              <button
                onClick={() => setShowModuleIntegrationModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Upload your curriculum, syllabus, and course materials, then distribute content to the appropriate modules.</p>
            
            <div className="space-y-6">
              {/* Content Upload Area */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📁 Upload Course Materials</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Drag & drop your files here</p>
                  <p className="text-sm text-gray-500 mb-4">Syllabus, curriculum, recipes, assignments, lesson plans</p>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setShowBrowseFilesModal(true)}
                      className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                    >
                      Browse Files
                    </button>
                    <button 
                      onClick={() => {
                        const mockKey = 'pk_' + Math.random().toString(36).substr(2, 32);
                        setGeneratedApiKey(mockKey);
                        setShowApiKeyModal(true);
                      }}
                      className="bg-green-100 text-green-700 px-6 py-2 rounded-md hover:bg-green-200 font-retro border-2 border-green-400"
                    >
                      Generate API Key
                    </button>
                    <button 
                      onClick={() => setShowChefFreddieModal(true)}
                      className="bg-pink-100 text-pink-700 px-6 py-2 rounded-md hover:bg-pink-200 font-retro flex items-center gap-2 border-2 border-pink-400"
                    >
                      <img src="/images/logo.png" alt="PorkChop Logo" className="w-5 h-5" />
                      Chef Freddie
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Supports: PDF, Word, Excel, PowerPoint, Images</p>
                </div>
              </div>

              {/* Content Preview & Mapping */}
              <div className="border-4 border-maineBlue rounded-lg p-4">
                <h3 className="text-center font-bold text-gray-900 mb-3">📋 Content Distribution</h3>
                <p className="text-sm text-gray-600 mb-4">Choose which parts of your uploaded content go to each module:</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-2">🍳</div>
                      <h4 className="font-medium text-blue-800">MyKitchen</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Recipe databases → Feeds matcher algorithm</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Ingredient knowledge bases → Enhances fuzzy matching</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Kitchen setup configurations → Equipment recommendations</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Dietary restriction mappings → Health tag generation</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-2">📖</div>
                      <h4 className="font-medium text-green-800">MyCookBook</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Assignment templates → Creates new gradebook assignments</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Grading rubrics → Video submission evaluation</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Recipe collections → Organized by curriculum week</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Video requirements → Student demonstration specs</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-2">🏫</div>
                      <h4 className="font-medium text-purple-800">CulinarySchool</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Custom technique sequences → Supplements 52 fundamentals</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Syllabus structures → Maps techniques to curriculum</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Lesson plans → Adds to 6 general lessons</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Learning objectives → Student achievement goals</span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-2">👨‍🍳</div>
                      <h4 className="font-medium text-orange-800">Chef's Corner</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Chef demonstration videos → Global Test Kitchen content</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Industry insights → Professional tips & knowledge</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Live session schedules → Planned cooking demonstrations</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Market partnerships → Local sourcing connections</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>




              {/* Publishing Controls */}
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-green-900 mb-3">🚀 Publish Content</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue">
                      <option>All Students</option>
                      <option>Specific Classes</option>
                      <option>Draft (Instructors Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue">
                      <option>Notify Students</option>
                      <option>Silent Update</option>
                      <option>Email Announcement</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <button className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 font-retro">
                    Save as Draft
                  </button>
                  <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-retro">
                    Publish to Modules
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Management Modal */}
      {showStudentManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Student Management Dashboard</h2>
              <button
                onClick={() => setShowStudentManagementModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Manage student progress, XP levels, academic performance, and individual student records.</p>
            
            <div className="space-y-6">
              {/* Student Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📊 Student Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                    <p className="text-sm text-blue-800 font-medium">Total Students</p>
                    <p className="text-xs text-blue-600">Currently enrolled</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
                    <p className="text-sm text-green-800 font-medium">Active Students</p>
                    <p className="text-xs text-green-600">Last 7 days</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{Math.round(stats.totalXP / Math.max(stats.totalUsers, 1))}</div>
                    <p className="text-sm text-purple-800 font-medium">Avg XP per Student</p>
                    <p className="text-xs text-purple-600">Experience points</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">{users.filter(u => (u.chat_count || 0) === 0).length}</div>
                    <p className="text-sm text-orange-800 font-medium">Inactive Students</p>
                    <p className="text-xs text-orange-600">Need attention</p>
                  </div>
                </div>
              </div>

              {/* Student List Management */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📋 Student Records</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.slice(0, 10).map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.username || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.xp || 0}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.level || 1}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.chat_count || 0} chats</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_chat_date ? new Date(user.last_chat_date).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-maineBlue hover:text-lobsterRed mr-2 px-3 py-1 border border-maineBlue rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => resetUserChatCount(user.id)}
                              className="text-yellow-600 hover:text-yellow-800 px-3 py-1 border border-yellow-600 rounded hover:bg-yellow-50"
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">Showing first 10 students. Total: {users.length} students</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">⚡ Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">📧</div>
                    <h4 className="font-medium text-blue-800">Send Announcement</h4>
                    <p className="text-xs text-blue-600">Notify all students</p>
                  </button>
                  <button className="bg-green-50 border-4 border-green-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">📈</div>
                    <h4 className="font-medium text-green-800">Bulk XP Update</h4>
                    <p className="text-xs text-green-600">Award XP to multiple students</p>
                  </button>
                  <button className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">📄</div>
                    <h4 className="font-medium text-purple-800">Export Student Data</h4>
                    <p className="text-xs text-purple-600">Download student records</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Management Modal */}
      {showFacultyManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Faculty Management Dashboard</h2>
              <button
                onClick={() => setShowFacultyManagementModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Manage instructor access, permissions, curriculum responsibilities, and faculty performance.</p>
            
            <div className="space-y-6">
              {/* Faculty Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">👩‍🏫 Faculty Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">12</div>
                    <p className="text-sm text-blue-800 font-medium">Total Faculty</p>
                    <p className="text-xs text-blue-600">Active instructors</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">8</div>
                    <p className="text-sm text-green-800 font-medium">Full-Time</p>
                    <p className="text-xs text-green-600">Permanent staff</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">4</div>
                    <p className="text-sm text-purple-800 font-medium">Part-Time</p>
                    <p className="text-xs text-purple-600">Adjunct instructors</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">95%</div>
                    <p className="text-sm text-orange-800 font-medium">Active This Week</p>
                    <p className="text-xs text-orange-600">Platform engagement</p>
                  </div>
                </div>
              </div>

              {/* Faculty Directory */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">📋 Faculty Directory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          JD
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Chef Julia Davis</h4>
                          <p className="text-sm text-gray-600">Head of Culinary Arts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📚 Courses: Advanced Techniques, Sauce Mastery</p>
                      <p>👥 Students: 42 active</p>
                      <p>📅 Last Login: Today, 9:15 AM</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          MR
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Chef Marco Rodriguez</h4>
                          <p className="text-sm text-gray-600">Pastry Arts Instructor</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📚 Courses: Baking Fundamentals, Cake Decoration</p>
                      <p>👥 Students: 28 active</p>
                      <p>📅 Last Login: Yesterday, 4:30 PM</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          ST
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Sarah Thompson</h4>
                          <p className="text-sm text-gray-600">Hospitality Management</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Part-Time</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📚 Courses: Restaurant Operations, Service Excellence</p>
                      <p>👥 Students: 35 active</p>
                      <p>📅 Last Login: Monday, 2:15 PM</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          AL
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Chef Antoine Laurent</h4>
                          <p className="text-sm text-gray-600">French Cuisine Specialist</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📚 Courses: Classical French, Wine Pairing</p>
                      <p>👥 Students: 18 active</p>
                      <p>📅 Last Login: Today, 11:45 AM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty Permissions & Access */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">🔐 Faculty Permissions & Access</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Faculty Member</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Admin Panel</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Grade Management</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Content Creation</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Student Reports</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Live Sessions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Chef Julia Davis</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Host</span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Chef Marco Rodriguez</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Limited</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Full</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Host</span>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Sarah Thompson</td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">None</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Limited</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Limited</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Limited</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Host</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Faculty Quick Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">⚡ Faculty Management Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-medium text-blue-800">Add New Faculty</h4>
                    <p className="text-xs text-blue-600">Invite new instructors</p>
                  </button>
                  <button className="bg-green-50 border-4 border-green-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">🔐</div>
                    <h4 className="font-medium text-green-800">Manage Permissions</h4>
                    <p className="text-xs text-green-600">Update access levels</p>
                  </button>
                  <button className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-medium text-purple-800">Faculty Reports</h4>
                    <p className="text-xs text-purple-600">Performance analytics</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Management Modal */}
      {showAlumniManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Alumni Management Dashboard</h2>
              <button
                onClick={() => setShowAlumniManagementModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Track graduate success stories, career outcomes, and maintain alumni network connections.</p>
            
            <div className="space-y-6">
              {/* Alumni Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">🎓 Alumni Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">342</div>
                    <p className="text-sm text-blue-800 font-medium">Total Alumni</p>
                    <p className="text-xs text-blue-600">Program graduates</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">89%</div>
                    <p className="text-sm text-green-800 font-medium">Employment Rate</p>
                    <p className="text-xs text-green-600">Within 6 months</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">$52K</div>
                    <p className="text-sm text-purple-800 font-medium">Avg Starting Salary</p>
                    <p className="text-xs text-purple-600">First year post-grad</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">47</div>
                    <p className="text-sm text-orange-800 font-medium">Business Owners</p>
                    <p className="text-xs text-orange-600">Started own restaurants</p>
                  </div>
                </div>
              </div>

              {/* Success Stories */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">⭐ Success Stories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        MS
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Maria Santos</h4>
                        <p className="text-sm text-gray-600">Class of 2022</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium text-blue-800">🏆 Executive Chef at Michelin-starred restaurant</p>
                      <p>📍 Currently: Le Bernardin, New York</p>
                      <p>💰 Salary: $85,000/year</p>
                      <p className="italic text-gray-600">"The program's focus on classical techniques gave me the foundation to excel in fine dining."</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        JC
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">James Chen</h4>
                        <p className="text-sm text-gray-600">Class of 2021</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium text-green-800">🏢 Restaurant Owner & Entrepreneur</p>
                      <p>📍 Currently: Chen's Kitchen (3 locations)</p>
                      <p>💰 Revenue: $2.1M annually</p>
                      <p className="italic text-gray-600">"The business management courses were just as valuable as the culinary training."</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        AR
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Ashley Rodriguez</h4>
                        <p className="text-sm text-gray-600">Class of 2023</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium text-purple-800">📺 Food Network Personality</p>
                      <p>📍 Currently: Host of "Pastry Perfection"</p>
                      <p>💰 Salary: $120,000/year + endorsements</p>
                      <p className="italic text-gray-600">"The video production skills I learned here launched my media career."</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border-2 border-orange-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        DM
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">David Miller</h4>
                        <p className="text-sm text-gray-600">Class of 2020</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium text-orange-800">🍟 Corporate Food Service Director</p>
                      <p>📍 Currently: Google Campus Dining</p>
                      <p>💰 Salary: $95,000/year + benefits</p>
                      <p className="italic text-gray-600">"Managing large-scale operations was exactly what I wanted to do."</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Outcomes */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">📈 Career Outcomes by Industry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Employment Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">People Management</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{width: '34%'}}></div>
                          </div>
                          <span className="text-sm font-medium">34%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Casual Dining</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '28%'}}></div>
                          </div>
                          <span className="text-sm font-medium">28%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Hotel & Hospitality</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{width: '18%'}}></div>
                          </div>
                          <span className="text-sm font-medium">18%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Own Business</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-orange-500 h-2 rounded-full" style={{width: '14%'}}></div>
                          </div>
                          <span className="text-sm font-medium">14%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Corporate/Other</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-gray-500 h-2 rounded-full" style={{width: '6%'}}></div>
                          </div>
                          <span className="text-sm font-medium">6%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Salary Ranges by Experience</h4>
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">0-2 Years</span>
                          <span className="text-sm font-bold text-green-600">$38K - $55K</span>
                        </div>
                        <p className="text-xs text-gray-600">Entry-level positions, line cooks</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">3-5 Years</span>
                          <span className="text-sm font-bold text-blue-600">$55K - $75K</span>
                        </div>
                        <p className="text-xs text-gray-600">Sous chefs, department heads</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">5+ Years</span>
                          <span className="text-sm font-bold text-purple-600">$75K - $120K+</span>
                        </div>
                        <p className="text-xs text-gray-600">Executive chefs, owners</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alumni Network Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">⚡ Alumni Network Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">📧</div>
                    <h4 className="font-medium text-blue-800">Alumni Newsletter</h4>
                    <p className="text-xs text-blue-600">Send updates and opportunities</p>
                  </button>
                  <button className="bg-green-50 border-4 border-green-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">🎉</div>
                    <h4 className="font-medium text-green-800">Plan Alumni Event</h4>
                    <p className="text-xs text-green-600">Networking and reunions</p>
                  </button>
                  <button className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200">
                    <div className="text-2xl mb-2">📄</div>
                    <h4 className="font-medium text-purple-800">Career Outcomes Report</h4>
                    <p className="text-xs text-purple-600">Generate success metrics</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {showUserActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">User Activity Dashboard</h2>
              <button
                onClick={() => setShowUserActivityModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Monitor student engagement, login patterns, and platform usage across all modules.</p>
            
            <div className="space-y-6">
              {/* Login Patterns */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📅 Login Patterns</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">342</div>
                    <p className="text-sm text-blue-800 font-medium">Daily Logins</p>
                    <p className="text-xs text-blue-600">↑ 8% vs yesterday</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">1,847</div>
                    <p className="text-sm text-green-800 font-medium">Weekly Logins</p>
                    <p className="text-xs text-green-600">↑ 15% vs last week</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">23 min</div>
                    <p className="text-sm text-purple-800 font-medium">Avg Session</p>
                    <p className="text-xs text-purple-600">↑ 3 min vs last week</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">89%</div>
                    <p className="text-sm text-orange-800 font-medium">Weekly Active</p>
                    <p className="text-xs text-orange-600">↑ 4% vs last week</p>
                  </div>
                </div>
              </div>

              {/* Module Usage Breakdown */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📊 Module Usage Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">🍳</div>
                      <h4 className="font-medium text-blue-800">MyKitchen</h4>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">67%</div>
                    <p className="text-xs text-blue-600">2,340 sessions this week</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">📖</div>
                      <h4 className="font-medium text-green-800">MyCookBook</h4>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">84%</div>
                    <p className="text-xs text-green-600">1,890 assignments viewed</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">🏫</div>
                      <h4 className="font-medium text-purple-800">CulinarySchool</h4>
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">72%</div>
                    <p className="text-xs text-purple-600">1,456 technique views</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">👨‍🍳</div>
                      <h4 className="font-medium text-orange-800">Chef's Corner</h4>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">45%</div>
                    <p className="text-xs text-orange-600">234 live sessions joined</p>
                  </div>
                </div>
              </div>

              {/* Feature Adoption */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">🚀 Feature Adoption Rates</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">🔍</span>
                      <span className="font-medium">Recipe Matcher</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                      <span className="text-sm font-bold text-blue-600">78%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">🎥</span>
                      <span className="font-medium">Video Submissions</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                      <span className="text-sm font-bold text-green-600">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">🔴</span>
                      <span className="font-medium">Global Test Kitchen</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-orange-600 h-2 rounded-full" style={{width: '42%'}}></div>
                      </div>
                      <span className="text-sm font-bold text-orange-600">42%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">📁</span>
                      <span className="font-medium">Collections Library</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '58%'}}></div>
                      </div>
                      <span className="text-sm font-bold text-purple-600">58%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">📊</span>
                      <span className="font-medium">Gradebook</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                      <span className="text-sm font-bold text-green-600">73%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inactive Students Alert */}
              <div className="border-4 border-red-400 bg-red-50 rounded-lg p-6">
                <h3 className="text-center font-bold text-red-900 mb-4">⚠️ Inactive Students Alert</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 mb-1">23</div>
                    <p className="text-sm text-red-800">No login in 7+ days</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 mb-1">8</div>
                    <p className="text-sm text-red-800">No login in 14+ days</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 mb-1">3</div>
                    <p className="text-sm text-red-800">No login in 30+ days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Performance Modal */}
      {showProgramPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Culinary Program Performance</h2>
              <button
                onClick={() => setShowProgramPerformanceModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Track program completion rates, student satisfaction, and overall curriculum effectiveness.</p>
            
            <div className="space-y-6">
              {/* Program Completion Rates */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">🎓 Program Completion Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">87%</div>
                    <p className="text-sm text-green-800 font-medium">Overall Completion</p>
                    <p className="text-xs text-green-600">↑ 5% vs last semester</p>
                  </div>
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">92%</div>
                    <p className="text-sm text-blue-800 font-medium">Assignment Completion</p>
                    <p className="text-xs text-blue-600">↑ 3% vs last semester</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">78%</div>
                    <p className="text-sm text-purple-800 font-medium">Video Submissions</p>
                    <p className="text-xs text-purple-600">↑ 12% vs last semester</p>
                  </div>
                </div>
              </div>

              {/* Student Satisfaction */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">⭐ Student Satisfaction Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 border-4 border-yellow-400 rounded-lg p-4 text-center">
                    <div className="text-4xl font-bold text-yellow-600">4.2/5</div>
                    <p className="text-sm text-yellow-800 font-medium">Overall Program Rating</p>
                    <p className="text-xs text-yellow-600">Based on 234 student reviews</p>
                  </div>
                  <div className="bg-emerald-50 border-4 border-emerald-400 rounded-lg p-4 text-center">
                    <div className="text-4xl font-bold text-emerald-600">94%</div>
                    <p className="text-sm text-emerald-800 font-medium">Would Recommend</p>
                    <p className="text-xs text-emerald-600">Students who'd recommend program</p>
                  </div>
                </div>
              </div>

              {/* Skill Progression Tracking */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📊 Skill Progression Tracking</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Knife Skills (52 Techniques)</span>
                      <span className="text-sm font-bold text-blue-600">Average: 38/52 completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full" style={{width: '73%'}}></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Assignment Grades</span>
                      <span className="text-sm font-bold text-green-600">Average: 85.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Video Quality Scores</span>
                      <span className="text-sm font-bold text-purple-600">Average: 4.1/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-600 h-3 rounded-full" style={{width: '82%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Outcomes Achievement */}
              <div className="border-4 border-red-400 bg-red-50 rounded-lg p-6">
                <h3 className="text-center font-bold text-red-900 mb-4">⚠️ Areas Needing Attention</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 mb-1">23%</div>
                    <p className="text-sm text-red-800">Students struggling with timing</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 mb-1">15%</div>
                    <p className="text-sm text-red-800">Late assignment submissions</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600 mb-1">8%</div>
                    <p className="text-sm text-red-800">Below 70% grade average</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Health Modal */}
      {showEnrollmentHealthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Enrollment Health Dashboard</h2>
              <button
                onClick={() => setShowEnrollmentHealthModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Monitor enrollment trends, student retention rates, and license utilization across your culinary program.</p>
            
            <div className="space-y-6">
              {/* Current Enrollment Status */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📊 Current Enrollment Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">247</div>
                    <p className="text-sm text-blue-800 font-medium">Total Enrolled</p>
                    <p className="text-xs text-blue-600">↑ 12 vs last month</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">89%</div>
                    <p className="text-sm text-green-800 font-medium">Active Students</p>
                    <p className="text-xs text-green-600">↑ 3% vs last month</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">300</div>
                    <p className="text-sm text-purple-800 font-medium">License Capacity</p>
                    <p className="text-xs text-purple-600">82% utilized</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">23</div>
                    <p className="text-sm text-orange-800 font-medium">New This Month</p>
                    <p className="text-xs text-orange-600">↑ 5 vs last month</p>
                  </div>
                </div>
              </div>

              {/* Retention & Completion Rates */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">🎓 Retention & Completion Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-50 border-4 border-emerald-400 rounded-lg p-4 text-center">
                    <div className="text-4xl font-bold text-emerald-600">94%</div>
                    <p className="text-sm text-emerald-800 font-medium">Semester Retention</p>
                    <p className="text-xs text-emerald-600">Students continuing program</p>
                  </div>
                  <div className="bg-teal-50 border-4 border-teal-400 rounded-lg p-4 text-center">
                    <div className="text-4xl font-bold text-teal-600">87%</div>
                    <p className="text-sm text-teal-800 font-medium">Program Completion</p>
                    <p className="text-xs text-teal-600">Students finishing program</p>
                  </div>
                  <div className="bg-indigo-50 border-4 border-indigo-400 rounded-lg p-4 text-center">
                    <div className="text-4xl font-bold text-indigo-600">6%</div>
                    <p className="text-sm text-indigo-800 font-medium">Dropout Rate</p>
                    <p className="text-xs text-indigo-600">Students leaving early</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Trends */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">📈 Enrollment Trends</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Fall Semester Growth</span>
                      <span className="text-sm font-bold text-green-600">+15% enrollment</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Spring Semester Projections</span>
                      <span className="text-sm font-bold text-blue-600">+8% projected growth</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Summer Program Interest</span>
                      <span className="text-sm font-bold text-purple-600">42 pre-registrations</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-600 h-3 rounded-full" style={{width: '42%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Cohort Performance */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">👥 Class Cohort Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Current Cohorts</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Culinary Arts - Fall 2024</p>
                          <p className="text-sm text-gray-600">42 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">95%</p>
                          <p className="text-xs text-gray-500">Retention</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Baking & Pastry - Fall 2024</p>
                          <p className="text-sm text-gray-600">28 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">92%</p>
                          <p className="text-xs text-gray-500">Retention</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Hospitality Management</p>
                          <p className="text-sm text-gray-600">35 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">88%</p>
                          <p className="text-xs text-gray-500">Retention</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Graduation Pipeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Graduating Spring 2025</p>
                          <p className="text-sm text-gray-600">38 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">On Track</p>
                          <p className="text-xs text-gray-500">Status</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">At Risk Students</p>
                          <p className="text-sm text-gray-600">7 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-yellow-600">Support</p>
                          <p className="text-xs text-gray-500">Needed</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Alumni Network</p>
                          <p className="text-sm text-gray-600">342 graduates</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-teal-600">Active</p>
                          <p className="text-xs text-gray-500">Network</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Utilization Alert */}
              <div className="border-4 border-yellow-400 bg-yellow-50 rounded-lg p-6">
                <h3 className="text-center font-bold text-yellow-900 mb-4">⚠️ License Utilization Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">82%</div>
                    <p className="text-sm text-yellow-800">Current utilization</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">53</div>
                    <p className="text-sm text-yellow-800">Available licenses</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">Q2</div>
                    <p className="text-sm text-yellow-800">Projected capacity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Analytics Modal */}
      {showContentAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-6xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Content Analytics Dashboard</h2>
              <button
                onClick={() => setShowContentAnalyticsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Monitor content performance, student engagement, and curriculum effectiveness across all modules.</p>
            
            <div className="space-y-6">
              {/* Content Performance Overview */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">📊 Content Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">847</div>
                    <p className="text-sm text-blue-800 font-medium">Total Recipe Views</p>
                    <p className="text-xs text-blue-600">↑ 12% this week</p>
                  </div>
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">73%</div>
                    <p className="text-sm text-blue-800 font-medium">Completion Rate</p>
                    <p className="text-xs text-blue-600">↑ 5% this week</p>
                  </div>
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">4.2</div>
                    <p className="text-sm text-blue-800 font-medium">Avg Engagement Score</p>
                    <p className="text-xs text-blue-600">→ No change</p>
                  </div>
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">28</div>
                    <p className="text-sm text-blue-800 font-medium">Active Recipes</p>
                    <p className="text-xs text-blue-600">↑ 3 new this week</p>
                  </div>
                </div>
              </div>

              {/* Top Performing Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">🏆 Top Performing Recipes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">French Knife Skills</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">94%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Mother Sauces Mastery</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">89%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Pasta Making Fundamentals</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">76%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">📉 Content Needing Attention</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Advanced Plating Techniques</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">34%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Molecular Gastronomy Basics</p>
                        <p className="text-sm text-gray-600">Chef's Corner</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">28%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Wine Pairing Fundamentals</p>
                        <p className="text-sm text-gray-600">CulinarySchool</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">52%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module-Specific Analytics */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">📈 Module-Specific Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📚 MyCookBook</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Recipes:</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Completion:</span>
                        <span className="font-medium text-blue-600">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-blue-600">High</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">🏫 CulinarySchool</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Lessons:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Completion:</span>
                        <span className="font-medium text-blue-600">82%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-blue-600">High</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">👨‍🍳 Chef's Corner</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Content:</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Completion:</span>
                        <span className="font-medium text-blue-600">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-blue-600">Medium</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">🍳 Global Test Kitchen</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Sessions:</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Participation:</span>
                        <span className="font-medium text-blue-600">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-blue-600">Medium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time-Based Analytics */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">🕰️ Time-Based Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Peak Usage Times</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>10:00 AM - 12:00 PM:</span>
                        <span className="font-medium text-green-600">High</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2:00 PM - 4:00 PM:</span>
                        <span className="font-medium text-green-600">High</span>
                      </div>
                      <div className="flex justify-between">
                        <span>6:00 PM - 8:00 PM:</span>
                        <span className="font-medium text-yellow-600">Medium</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Weekly Trends</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Wednesday:</span>
                        <span className="font-medium text-green-600">Peak</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thursday - Friday:</span>
                        <span className="font-medium text-yellow-600">Moderate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekend:</span>
                        <span className="font-medium text-red-600">Low</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Content Filters</h4>
                    <div className="space-y-2">
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 3 months</option>
                        <option>All time</option>
                      </select>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue">
                        <option>All Modules</option>
                        <option>MyCookBook</option>
                        <option>CulinarySchool</option>
                        <option>Chef's Corner</option>
                        <option>Global Test Kitchen</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowContentAnalyticsModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Analytics data exported successfully!');
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Platform Configuration Modal */}
      {showConfigurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Cross-Platform Configuration</h2>
              <button
                onClick={() => setShowConfigurationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Configure content permissions, access levels, and approval workflows across all PorkChop modules.</p>
            
            <div className="space-y-6">
              {/* Content Approval Workflows */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">✅ Content Approval Workflows</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Recipe Approval Process</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="radio" name="recipe-approval" className="mr-2" checked />
                        <span className="text-sm">Auto-approve all recipes</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="recipe-approval" className="mr-2" />
                        <span className="text-sm">Require instructor approval</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="recipe-approval" className="mr-2" />
                        <span className="text-sm">Require admin approval</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="recipe-approval" className="mr-2" />
                        <span className="text-sm">Multi-level approval (Instructor → Admin)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Assignment Submission Process</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="radio" name="assignment-approval" className="mr-2" />
                        <span className="text-sm">Auto-accept submissions</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="assignment-approval" className="mr-2" checked />
                        <span className="text-sm">Require instructor review</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="assignment-approval" className="mr-2" />
                        <span className="text-sm">Peer review + instructor approval</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="assignment-approval" className="mr-2" />
                        <span className="text-sm">AI pre-screening + instructor review</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Level Management */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">🔐 Access Level Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User Role</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">MyCookBook</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">CulinarySchool</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Chef's Corner</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Global Test Kitchen</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Admin Dashboard</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Student</td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Read Only</option>
                            <option>Full Access</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>No Access</option>
                            <option>Read Only</option>
                            <option>Full Access</option>
                          </select>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4 font-medium">Instructor</td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Read Only</option>
                            <option>Full Access</option>
                            <option>No Access</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium">Administrator</td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select className="px-2 py-1 border rounded text-xs">
                            <option>Full Access</option>
                            <option>Read Only</option>
                            <option>No Access</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform-Wide Settings */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">⚙️ Platform-Wide Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Content Moderation</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">Enable AI content filtering</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">Flag inappropriate language</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Auto-moderate chat messages</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">Require image approval</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Data Privacy & Security</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">Enable audit logging</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">Encrypt sensitive data</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Allow data export requests</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" checked />
                        <span className="text-sm">Require 2FA for admins</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integration Settings */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3">🔗 Integration Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">External APIs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Google Vision API:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Anthropic AI:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Stripe Payments:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>YouTube API:</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Limited</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Notification Settings</h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Email notifications</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" />
                        <span>SMS notifications</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" checked />
                        <span>Push notifications</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" checked />
                        <span>In-app notifications</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Backup & Recovery</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Auto Backup:</span>
                        <select className="px-2 py-1 border rounded text-xs">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Retention:</span>
                        <select className="px-2 py-1 border rounded text-xs">
                          <option>30 days</option>
                          <option>90 days</option>
                          <option>1 year</option>
                          <option>Indefinite</option>
                        </select>
                      </div>
                      <button className="w-full px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs">
                        Manual Backup Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowConfigurationModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Configuration settings saved successfully!');
                  setShowConfigurationModal(false);
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Files Modal */}
      {showBrowseFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">📁 Browse & Upload Files</h2>
              <button
                onClick={() => setShowBrowseFilesModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-maineBlue rounded-lg p-8 text-center bg-blue-50">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-bold text-maineBlue mb-2">Select Files to Upload</h3>
                <p className="text-gray-600 mb-4">Choose curriculum files, recipes, assignments, or lesson plans</p>
                
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  className="hidden" 
                  id="file-upload"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    console.log('Selected files:', files);
                    // Handle file upload logic here
                  }}
                />
                <label 
                  htmlFor="file-upload" 
                  className="bg-maineBlue text-white px-8 py-3 rounded-md hover:bg-blue-700 font-retro cursor-pointer inline-block"
                >
                  Choose Files
                </label>
                
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: PDF, Word, Excel, PowerPoint, Images (JPG, PNG, GIF)
                </p>
              </div>
              
              {/* Recent Files */}
              <div className="border-4 border-maineBlue rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-4">📋 Recent Uploads</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📄</span>
                      <div>
                        <p className="font-medium">Culinary Fundamentals Syllabus.pdf</p>
                        <p className="text-sm text-gray-500">2.4 MB • Uploaded 2 hours ago</p>
                      </div>
                    </div>
                    <button className="text-maineBlue hover:text-blue-700 font-medium">Use</button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🍳</span>
                      <div>
                        <p className="font-medium">Week 3 - Knife Skills Recipes.docx</p>
                        <p className="text-sm text-gray-500">1.8 MB • Uploaded yesterday</p>
                      </div>
                    </div>
                    <button className="text-maineBlue hover:text-blue-700 font-medium">Use</button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📊</span>
                      <div>
                        <p className="font-medium">Assignment Rubric Template.xlsx</p>
                        <p className="text-sm text-gray-500">456 KB • Uploaded 3 days ago</p>
                      </div>
                    </div>
                    <button className="text-maineBlue hover:text-blue-700 font-medium">Use</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowBrowseFilesModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Files uploaded successfully! Content will be processed and distributed to selected modules.');
                  setShowBrowseFilesModal(false);
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 max-w-2xl w-full">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-green-700 font-retro">🔑 API Key Generated</h2>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-3">✅ Success! Your API Key has been generated</h3>
                <p className="text-sm text-green-700 mb-4">
                  Keep this key secure and don't share it publicly. You can use this key to integrate with PorkChop's curriculum management system.
                </p>
              </div>
              
              <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="password" 
                    value={generatedApiKey}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 font-mono text-sm"
                    id="api-key-input"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('api-key-input') as HTMLInputElement;
                      if (input) {
                        input.type = input.type === 'password' ? 'text' : 'password';
                      }
                    }}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedApiKey);
                      alert('API Key copied to clipboard!');
                    }}
                    className="bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 text-sm font-retro"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click the eye icon to show/hide the key. Click Copy to copy to clipboard.
                </p>
              </div>
              
              <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2">📄 API Documentation</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Use this key to access PorkChop's curriculum management endpoints:
                </p>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• <code className="bg-blue-100 px-1 rounded">POST /api/curriculum/upload</code> - Upload course materials</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">GET /api/students/progress</code> - Get student progress data</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">POST /api/assignments/create</code> - Create new assignments</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('API Key saved to your account settings!');
                  setShowApiKeyModal(false);
                }}
                className="bg-green-400 text-white px-6 py-2 rounded-md hover:bg-green-500 font-retro"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chef Freddie Modal */}
      {showChefFreddieModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-pink-400 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-pink-700 font-retro flex items-center justify-center gap-2">
                <span className="text-3xl">👨‍🍳</span>
                Chef Freddie: Curriculum Assistant
              </h2>
              <button
                onClick={() => setShowChefFreddieModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-red-50 border-4 border-red-400 rounded-lg p-4">
                <h3 className="text-center font-bold text-red-800 mb-2">🎉 Welcome! I'm here to help with your culinary curriculum</h3>
                <p className="text-center text-sm text-red-700 mb-2">
                  What would you like to work on today?
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-4 border-blue-300 bg-blue-50 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <div className="text-3xl mb-2">📝</div>
                  <h4 className="font-bold text-blue-800 mb-2">Create Assignment</h4>
                  <p className="text-sm text-blue-600 mb-3">Generate practical cooking assignments with rubrics</p>
                  <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 font-retro text-sm">
                    Start Creating
                  </button>
                </div>
                
                <div className="border-4 border-green-300 bg-green-50 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <div className="text-3xl mb-2">📅</div>
                  <h4 className="font-bold text-green-800 mb-2">Build Lesson Plan</h4>
                  <p className="text-sm text-green-600 mb-3">Create structured weekly lesson plans</p>
                  <button className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 font-retro text-sm">
                    Plan Lesson
                  </button>
                </div>
                
                <div className="border-4 border-purple-300 bg-purple-50 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <div className="text-3xl mb-2">🏆</div>
                  <h4 className="font-bold text-purple-800 mb-2">Design Rubric</h4>
                  <p className="text-sm text-purple-600 mb-3">Create assessment rubrics for skills</p>
                  <button className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-200 font-retro text-sm">
                    Design Rubric
                  </button>
                </div>
                
                <div className="border-4 border-orange-300 bg-orange-50 rounded-lg p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                  <div className="text-3xl mb-2">🔄</div>
                  <h4 className="font-bold text-orange-800 mb-2">Apply to Modules</h4>
                  <p className="text-sm text-orange-600 mb-3">Distribute curriculum to MyKitchen, MyCookBook</p>
                  <button className="bg-orange-100 text-orange-700 px-4 py-2 rounded-md hover:bg-orange-200 font-retro text-sm">
                    Apply Now
                  </button>
                </div>
              </div>
              
              {/* Chat Interface */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-blue-900 mb-4">💬 Ask Chef Freddie Anything</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                  <div className="space-y-3">
                    {freddieMessages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-3">
                        {msg.sender === 'freddie' && <span className="text-2xl">👨‍🍳</span>}
                        <div className={`rounded-lg p-3 flex-1 ${
                          msg.sender === 'freddie' 
                            ? 'bg-pink-100' 
                            : 'bg-blue-100 ml-auto max-w-[80%]'
                        }`}>
                          <p className={`text-sm ${
                            msg.sender === 'freddie' ? 'text-pink-800' : 'text-blue-800'
                          }`}>
                            {msg.text}
                          </p>
                        </div>
                        {msg.sender === 'user' && <span className="text-2xl">👤</span>}
                      </div>
                    ))}
                    {freddieLoading && (
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">👨‍🍳</span>
                        <div className="bg-pink-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-pink-800">
                            Chef Freddie is thinking... 🤔
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask Chef Freddie to create curriculum..."
                    value={freddieInput}
                    onChange={(e) => setFreddieInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !freddieLoading) {
                        sendFreddieMessage(freddieInput);
                      }
                    }}
                    disabled={freddieLoading}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <button 
                    onClick={() => sendFreddieMessage(freddieInput)}
                    disabled={freddieLoading || !freddieInput.trim()}
                    className="bg-pink-400 text-white px-6 py-2 rounded-md hover:bg-pink-500 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {freddieLoading ? 'Thinking...' : 'Ask'}
                  </button>
                </div>
              </div>
              
              {/* Recent Curriculum */}
              <div className="border-4 border-yellow-300 bg-yellow-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-yellow-800 mb-4">📁 Recently Created Curriculum</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🔪</span>
                      <div>
                        <p className="font-medium text-yellow-800">Week 3: French Knife Skills Assignment</p>
                        <p className="text-sm text-yellow-600">Created 2 hours ago • Applied to CulinarySchool</p>
                      </div>
                    </div>
                    <button className="text-yellow-700 hover:text-yellow-800 font-medium text-sm">View</button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🍲</span>
                      <div>
                        <p className="font-medium text-yellow-800">Sauce Making Rubric Template</p>
                        <p className="text-sm text-yellow-600">Created yesterday • Ready to apply</p>
                      </div>
                    </div>
                    <button className="text-yellow-700 hover:text-yellow-800 font-medium text-sm">Use</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowChefFreddieModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Chef Freddie is ready to help! This would integrate with your AI curriculum system.');
                }}
                className="bg-pink-400 text-white px-6 py-2 rounded-md hover:bg-pink-500 font-retro"
              >
                Start Creating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      <UserEditModal />
    </div>
  );
};

export default AdminDashboard;
