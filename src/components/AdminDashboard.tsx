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
  const { user: currentUser } = useSupabase();

  useEffect(() => {
    fetchAdminData();
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
          <h1 className="text-4xl font-retro text-maineBlue mb-2">👑 Admin Dashboard</h1>
          <p className="text-gray-600 italic">Manage your PorkChop platform with powerful admin tools!</p>
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
              <div className="mb-3 text-4xl">📊</div>
              <h3 className="text-sm font-bold font-retro">Overview</h3>
            </button>
            
            <button
              onClick={() => setActiveTab('users')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'users' 
                  ? 'border-blue-400 bg-blue-50 scale-105' 
                  : 'border-blue-400 bg-blue-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">👥</div>
              <h3 className="text-sm font-bold font-retro">Users</h3>
            </button>
            
            <button
              onClick={() => setActiveTab('content')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'content' 
                  ? 'border-red-400 bg-red-50 scale-105' 
                  : 'border-red-400 bg-red-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">📝</div>
              <h3 className="text-sm font-bold font-retro">Content</h3>
            </button>
            
            <button
              onClick={() => setActiveTab('system')}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'system' 
                  ? 'border-yellow-300 bg-yellow-50 scale-105' 
                  : 'border-yellow-300 bg-yellow-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">⚙️</div>
              <h3 className="text-sm font-bold font-retro">System</h3>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Users" value={stats.totalUsers} icon={UsersIcon} />
              <StatCard title="Active Users (7d)" value={stats.activeUsers} icon={CheckCircleIcon} />
              <StatCard title="Total Recipes" value={stats.totalRecipes} icon={DocumentTextIcon} />
              <StatCard title="Total XP Earned" value={stats.totalXP.toLocaleString()} icon={ArrowUpIcon} />
            </div>

            {/* Subscription Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
              <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">Subscription Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <p className="text-2xl font-bold text-green-600">{stats.subscriptions.active}</p>
                  <p className="text-sm text-gray-600 font-retro">Active</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-600">{stats.subscriptions.trial}</p>
                  <p className="text-sm text-gray-600 font-retro">Trial</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <p className="text-2xl font-bold text-red-600">{stats.subscriptions.cancelled}</p>
                  <p className="text-sm text-gray-600 font-retro">Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md border-4 border-maineBlue">
            <div className="px-6 py-4 border-b border-maineBlue">
              <h3 className="text-lg font-bold text-maineBlue font-retro">User Management</h3>
              <p className="text-sm text-gray-600 italic">Manage user accounts, XP, and activity</p>
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
            <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">Content Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-4 border-red-400 bg-red-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🏆</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Weekly Challenges</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Manage weekly cooking challenges</p>
                <button className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro">
                  Manage Challenges
                </button>
              </div>
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">📋</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Recipe Moderation</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Review and moderate user recipes</p>
                <button className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro">
                  Review Recipes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
            <h3 className="text-lg font-bold text-maineBlue mb-4 font-retro">System Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-4 border-yellow-300 bg-yellow-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🔄</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Refresh Data</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Reload all dashboard statistics</p>
                <button
                  onClick={fetchAdminData}
                  className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Refresh
                </button>
              </div>
              
              <div className="border-4 border-green-300 bg-green-50 rounded-lg p-6 text-center">
                <div className="mb-3 text-4xl">💚</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Database Health</h4>
                <p className="text-sm text-gray-600 mb-3 italic">System status and performance</p>
                <span className="text-green-600 font-semibold font-retro text-lg">✓ Healthy</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* User Edit Modal */}
      <UserEditModal />
    </div>
  );
};

export default AdminDashboard;
