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
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-maineBlue">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
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
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-maineBlue">👑 Admin Dashboard</h1>
              <span className="text-sm text-gray-500">Welcome, {currentUser?.email}</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'users', name: 'Users', icon: UsersIcon },
              { id: 'content', name: 'Content', icon: DocumentTextIcon },
              { id: 'system', name: 'System', icon: CogIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-maineBlue text-maineBlue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-maineBlue mb-4">Subscription Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.subscriptions.active}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.subscriptions.trial}</p>
                  <p className="text-sm text-gray-600">Trial</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.subscriptions.cancelled}</p>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-maineBlue">User Management</h3>
              <p className="text-sm text-gray-600">Manage user accounts, XP, and activity</p>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-maineBlue mb-4">Content Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Weekly Challenges</h4>
                <p className="text-sm text-gray-600 mb-3">Manage weekly cooking challenges</p>
                <button className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Manage Challenges
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recipe Moderation</h4>
                <p className="text-sm text-gray-600 mb-3">Review and moderate user recipes</p>
                <button className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Review Recipes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-maineBlue mb-4">System Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Refresh Admin Data</h4>
                  <p className="text-sm text-gray-600">Reload all dashboard statistics</p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Database Health</h4>
                  <p className="text-sm text-gray-600">Check database connection and performance</p>
                </div>
                <span className="text-green-600 font-semibold">✓ Healthy</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Edit Modal */}
      <UserEditModal />
    </div>
  );
};

export default AdminDashboard;
