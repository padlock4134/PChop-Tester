import React, { useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';
import { useSupabase } from './SupabaseProvider';
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
  const { user: currentUser } = useSupabase();

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
              <h3 className="text-sm font-bold font-retro">Students & Faculty</h3>
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
              <h3 className="text-sm font-bold font-retro">School Curriculum</h3>
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
              <h3 className="text-sm font-bold font-retro">School Operations</h3>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 border border-black rounded-lg p-6 text-center">
                <UsersIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-700 font-retro">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <div className="bg-green-50 border border-black rounded-lg p-6 text-center">
                <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="text-lg font-semibold text-green-700 font-retro">Active Users (7d)</h3>
                <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <div className="bg-orange-50 border border-black rounded-lg p-6 text-center">
                <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-700 font-retro">Total Recipes</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.totalRecipes}</p>
              </div>
              <div className="bg-purple-50 border border-black rounded-lg p-6 text-center">
                <ArrowUpIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-700 font-retro">Total XP Earned</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalXP.toLocaleString()}</p>
              </div>
            </div>

            {/* Program Health Metrics */}
            <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
              <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">Culinary Program Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border-4 border-green-400">
                  <p className="text-2xl font-bold text-green-600">87%</p>
                  <p className="text-sm text-gray-600 font-retro">Program Completion Rate</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border-4 border-blue-400">
                  <p className="text-2xl font-bold text-blue-600">92%</p>
                  <p className="text-sm text-gray-600 font-retro">Job Placement Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border-4 border-purple-400">
                  <p className="text-2xl font-bold text-purple-600">4.2/5</p>
                  <p className="text-sm text-gray-600 font-retro">Student Satisfaction</p>
                </div>
              </div>
            </div>
            
            {/* Enrollment Health */}
            <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
              <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">Enrollment Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg border-4 border-emerald-400">
                  <p className="text-2xl font-bold text-emerald-600">{stats.subscriptions.active}</p>
                  <p className="text-sm text-gray-600 font-retro">Active Enrollments</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border-4 border-yellow-400">
                  <p className="text-2xl font-bold text-yellow-600">{stats.subscriptions.trial}</p>
                  <p className="text-sm text-gray-600 font-retro">Trial Students</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border-4 border-red-400">
                  <p className="text-2xl font-bold text-red-600">{Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%</p>
                  <p className="text-sm text-gray-600 font-retro">Weekly Engagement</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md border-4 border-maineBlue">
            <div className="px-6 py-4 border-b border-maineBlue">
              <h3 className="text-lg font-bold text-maineBlue font-retro">Students & Faculty Management</h3>
              <p className="text-sm text-gray-600 italic">Manage student progress and faculty access to your school's curriculum</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.xp || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.level || 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.chat_count || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_chat_date ? new Date(user.last_chat_date).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-maineBlue hover:text-lobsterRed mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resetUserChatCount(user.id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Reset Chat Count"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">School Operations</h3>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Export School Reports</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Select the reports you want to generate and download:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-50 cursor-pointer">
                <input type="checkbox" id="student-progress" className="mr-3" />
                <label htmlFor="student-progress" className="font-semibold cursor-pointer">📊 Student Progress</label>
                <p className="text-sm text-gray-600 ml-6">Skill mastery tracking, learning analytics</p>
              </div>
              
              <div className="border-2 border-green-200 rounded-lg p-4 hover:bg-green-50 cursor-pointer">
                <input type="checkbox" id="class-analytics" className="mr-3" />
                <label htmlFor="class-analytics" className="font-semibold cursor-pointer">👥 Class Analytics</label>
                <p className="text-sm text-gray-600 ml-6">Performance metrics, live session data</p>
              </div>
              
              <div className="border-2 border-orange-200 rounded-lg p-4 hover:bg-orange-50 cursor-pointer">
                <input type="checkbox" id="culinary-metrics" className="mr-3" />
                <label htmlFor="culinary-metrics" className="font-semibold cursor-pointer">🍳 Culinary Metrics</label>
                <p className="text-sm text-gray-600 ml-6">Recipe performance, technique analysis</p>
              </div>
              
              <div className="border-2 border-purple-200 rounded-lg p-4 hover:bg-purple-50 cursor-pointer">
                <input type="checkbox" id="operations" className="mr-3" />
                <label htmlFor="operations" className="font-semibold cursor-pointer">🏪 Operations</label>
                <p className="text-sm text-gray-600 ml-6">Kitchen management, safety & compliance</p>
              </div>
              
              <div className="border-2 border-pink-200 rounded-lg p-4 hover:bg-pink-50 cursor-pointer">
                <input type="checkbox" id="engagement" className="mr-3" />
                <label htmlFor="engagement" className="font-semibold cursor-pointer">📱 Engagement</label>
                <p className="text-sm text-gray-600 ml-6">Platform usage, community participation</p>
              </div>
              
              <div className="border-2 border-red-200 rounded-lg p-4 hover:bg-red-50 cursor-pointer">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Job Placement & Career Services</h2>
              <button
                onClick={() => setShowJobPlacementModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Track graduate employment outcomes, manage industry partnerships, and monitor career services effectiveness.</p>
            
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
            
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-green-900 mb-2">🎯 Key Placement Metrics:</h4>
              <ul className="text-sm text-green-800 space-y-1">
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">School Branding & Identity</h2>
              <button
                onClick={() => setShowBrandingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Customize PorkChop's appearance to match your school's brand and identity.</p>
            
            <div className="space-y-6">
              {/* School Logo */}
              <div className="border-4 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🏫 School Logo</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Logo</span>
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
              <div className="border-4 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📝 School Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input
                      type="text"
                      placeholder="Culinary Institute of Excellence"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                    <input
                      type="text"
                      placeholder="Where Culinary Dreams Come True"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Description</label>
                    <textarea
                      rows={3}
                      placeholder="Brief description of your culinary program..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="border-4 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🎨 Color Scheme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#1e40af" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#1e40af</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#059669" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#059669</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#dc2626" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#dc2626</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                    <div className="flex items-center space-x-2">
                      <input type="color" value="#f8fafc" className="w-8 h-8 rounded border" />
                      <span className="text-sm text-gray-600">#f8fafc</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-4 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📞 Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="info@culinaryschool.edu"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Content Upload & Distribution</h2>
              <button
                onClick={() => setShowModuleIntegrationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">Upload your curriculum, syllabus, and course materials, then distribute content to the appropriate modules.</p>
            
            <div className="space-y-6">
              {/* Content Upload Area */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="font-bold text-maineBlue mb-4">📁 Upload Course Materials</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Drag & drop your files here</p>
                  <p className="text-sm text-gray-500 mb-4">Syllabus, curriculum, recipes, assignments, lesson plans</p>
                  <div className="flex justify-center gap-4">
                    <button className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro">
                      Browse Files
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 font-retro">
                      Upload from URL
                    </button>
                    <button className="bg-green-100 text-green-700 px-6 py-2 rounded-md hover:bg-green-200 font-retro">
                      Generate API Key
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Supports: PDF, Word, Excel, PowerPoint, Images</p>
                </div>
              </div>

              {/* Content Preview & Mapping */}
              <div className="border-4 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📋 Content Distribution</h3>
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
              <div className="border-4 border-green-200 bg-green-50 rounded-lg p-4">
                <h3 className="font-bold text-green-900 mb-3">🚀 Publish Content</h3>
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
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📊 Content Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">847</div>
                    <p className="text-sm text-blue-800 font-medium">Total Recipe Views</p>
                    <p className="text-xs text-blue-600">↑ 12% this week</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">73%</div>
                    <p className="text-sm text-green-800 font-medium">Completion Rate</p>
                    <p className="text-xs text-green-600">↑ 5% this week</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">4.2</div>
                    <p className="text-sm text-purple-800 font-medium">Avg Engagement Score</p>
                    <p className="text-xs text-purple-600">→ No change</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">28</div>
                    <p className="text-sm text-orange-800 font-medium">Active Recipes</p>
                    <p className="text-xs text-orange-600">↑ 3 new this week</p>
                  </div>
                </div>
              </div>

              {/* Top Performing Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">🏆 Top Performing Recipes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">French Knife Skills</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">94%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Mother Sauces Mastery</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">89%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Pasta Making Fundamentals</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-600">76%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">📉 Content Needing Attention</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Advanced Plating Techniques</p>
                        <p className="text-sm text-gray-600">MyCookBook</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">34%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Molecular Gastronomy Basics</p>
                        <p className="text-sm text-gray-600">Chef's Corner</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">28%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Wine Pairing Fundamentals</p>
                        <p className="text-sm text-gray-600">CulinarySchool</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">52%</p>
                        <p className="text-xs text-gray-500">Completion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module-Specific Analytics */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">📈 Module-Specific Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📚 MyCookBook</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Recipes:</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Completion:</span>
                        <span className="font-medium text-green-600">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-blue-600">High</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">🏫 CulinarySchool</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Lessons:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Completion:</span>
                        <span className="font-medium text-green-600">82%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-green-600">High</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">👨‍🍳 Chef's Corner</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Content:</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Completion:</span>
                        <span className="font-medium text-yellow-600">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-yellow-600">Medium</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">🍳 Global Test Kitchen</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Active Sessions:</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Participation:</span>
                        <span className="font-medium text-orange-600">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student Engagement:</span>
                        <span className="font-medium text-orange-600">Medium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time-Based Analytics */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🕰️ Time-Based Analytics</h3>
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
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">✅ Content Approval Workflows</h3>
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
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🔐 Access Level Management</h3>
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
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">⚙️ Platform-Wide Settings</h3>
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
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">🔗 Integration Settings</h3>
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

      {/* User Edit Modal */}
      <UserEditModal />
    </div>
  );
};

export default AdminDashboard;
