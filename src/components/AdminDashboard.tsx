import React, { useState, useEffect, useRef } from 'react';
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
  const [users, setUsers] = useState<User[]>([
    {
      id: 'mock-1',
      email: 'sarah.johnson@culinaryschool.edu',
      username: 'Sarah Johnson',
      xp: 1250,
      level: 3,
      chat_count: 15,
      last_chat_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-2',
      email: 'marcus.chen@culinaryschool.edu',
      username: 'Marcus Chen',
      xp: 2100,
      level: 4,
      chat_count: 28,
      last_chat_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ]);
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
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Array<{email: string, name?: string, error?: string}>>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'uploading' | 'complete' | 'error'>('idle');
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [addingPartner, setAddingPartner] = useState(false);
  const [exportingEmployment, setExportingEmployment] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState<'networking' | 'reunion' | 'career_fair' | 'workshop'>('networking');
  const [eventDescription, setEventDescription] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [careerEventType, setCareerEventType] = useState<'career_fair' | 'resume_workshop' | 'interview_prep' | 'networking'>('career_fair');
  const [careerEventDate, setCareerEventDate] = useState('');
  const [careerEventDescription, setCareerEventDescription] = useState('');
  const [schedulingCareerEvent, setSchedulingCareerEvent] = useState(false);
  const [exportingAlumni, setExportingAlumni] = useState(false);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);
  const [exportingFaculty, setExportingFaculty] = useState(false);
  const [newsletterTitle, setNewsletterTitle] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [showExportDataModal, setShowExportDataModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showManagePermissionsModal, setShowManagePermissionsModal] = useState(false);
  const [showFacultyReportsModal, setShowFacultyReportsModal] = useState(false);
  const [showAlumniNewsletterModal, setShowAlumniNewsletterModal] = useState(false);
  const [showPlanEventModal, setShowPlanEventModal] = useState(false);
  const [showGiftingDonationsModal, setShowGiftingDonationsModal] = useState(false);
  const [showEmploymentDataModal, setShowEmploymentDataModal] = useState(false);
  const [showManagePartnersModal, setShowManagePartnersModal] = useState(false);
  const [showCareerServicesModal, setShowCareerServicesModal] = useState(false);
  const [showAlumniDatabaseModal, setShowAlumniDatabaseModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentProgram, setNewStudentProgram] = useState('Culinary Arts');
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [facultyList, setFacultyList] = useState([
    {
      id: 'faculty-1',
      name: 'Chef Julia Davis',
      email: 'julia.davis@culinaryschool.edu',
      role: 'Head of Culinary Arts',
      status: 'Active',
      courses: 'Advanced Techniques, Sauce Mastery',
      students: 42,
      lastLogin: 'Today, 9:15 AM',
      initials: 'JD',
      color: 'bg-blue-500'
    },
    {
      id: 'faculty-2',
      name: 'Chef Marco Rodriguez',
      email: 'marco.rodriguez@culinaryschool.edu',
      role: 'Pastry Arts Instructor',
      status: 'Active',
      courses: 'Baking Fundamentals, Cake Decoration',
      students: 28,
      lastLogin: 'Yesterday, 4:30 PM',
      initials: 'MR',
      color: 'bg-green-500'
    }
  ]);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyRole, setNewFacultyRole] = useState('Instructor');
  const [alumniList, setAlumniList] = useState([
    {
      id: 'alumni-1',
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      graduationYear: '2022',
      position: 'Executive Chef at Michelin-starred restaurant',
      employer: 'Le Bernardin, New York',
      salary: '$85,000/year',
      initials: 'MS',
      color: 'bg-blue-500'
    },
    {
      id: 'alumni-2',
      name: 'James Chen',
      email: 'james.chen@example.com',
      graduationYear: '2021',
      position: 'Restaurant Owner & Entrepreneur',
      employer: "Chen's Kitchen (3 locations)",
      salary: '$2.1M annually',
      initials: 'JC',
      color: 'bg-green-500'
    },
    {
      id: 'alumni-3',
      name: 'Ashley Rodriguez',
      email: 'ashley.rodriguez@example.com',
      graduationYear: '2023',
      position: 'Food Network Personality',
      employer: 'Host of "Pastry Perfection"',
      salary: '$120,000/year + endorsements',
      initials: 'AR',
      color: 'bg-purple-500'
    },
    {
      id: 'alumni-4',
      name: 'David Miller',
      email: 'david.miller@example.com',
      graduationYear: '2020',
      position: 'Corporate Food Service Director',
      employer: 'Google Campus Dining',
      salary: '$95,000/year + benefits',
      initials: 'DM',
      color: 'bg-orange-500'
    }
  ]);
  const [showAddAlumniModal, setShowAddAlumniModal] = useState(false);
  const [newAlumniName, setNewAlumniName] = useState('');
  const [newAlumniEmail, setNewAlumniEmail] = useState('');
  const [newAlumniGradYear, setNewAlumniGradYear] = useState('');
  const [newAlumniPosition, setNewAlumniPosition] = useState('');
  const [newAlumniEmployer, setNewAlumniEmployer] = useState('');
  const [newAlumniSalary, setNewAlumniSalary] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [showViewEventModal, setShowViewEventModal] = useState(false);
  const [showCredentialingModal, setShowCredentialingModal] = useState(false);
  const [selectedCareerEventId, setSelectedCareerEventId] = useState('');
  const [showViewCareerEventModal, setShowViewCareerEventModal] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isEventsPaused, setIsEventsPaused] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useSupabase();

  // Mock upcoming events data
  const upcomingEvents = [
    {
      id: 'event-1',
      name: 'Class of 2020 Reunion',
      date: 'March 15, 2025',
      time: '6:00 PM',
      type: 'alumni',
      emoji: '🎉',
      registered: 156,
      color: 'green'
    },
    {
      id: 'career-1',
      name: 'Spring Career Fair 2025',
      date: 'March 15, 2025',
      time: '10:00 AM',
      type: 'career',
      emoji: '💼',
      registered: 89,
      color: 'purple'
    },
    {
      id: 'career-2',
      name: 'Resume Workshop',
      date: 'February 20, 2025',
      time: '2:00 PM',
      type: 'career',
      emoji: '📝',
      registered: 45,
      color: 'purple'
    },
    {
      id: 'event-2',
      name: 'Spring Networking Event',
      date: 'April 10, 2025',
      time: '5:00 PM',
      type: 'alumni',
      emoji: '🤝',
      registered: 78,
      color: 'green'
    }
  ];

  // CSV Export Helper Functions
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');
    return csv;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

  // Auto-scroll effect for upcoming events banner
  useEffect(() => {
    if (upcomingEvents.length > 1 && !isEventsPaused) {
      const interval = setInterval(() => {
        setCurrentEventIndex((prev) => (prev + 1) % upcomingEvents.length);
      }, 3000); // 3 second intervals

      return () => clearInterval(interval);
    }
  }, [upcomingEvents.length, isEventsPaused]);

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

  // CSV Import Functions
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const parseCsvFile = (file: File) => {
    setImportStatus('parsing');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one student row');
        setImportStatus('error');
        return;
      }
      
      // Parse header
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('full'));
      
      if (emailIndex === -1) {
        alert('CSV must have an "email" column');
        setImportStatus('error');
        return;
      }
      
      // Parse students
      const students = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const email = values[emailIndex]?.toLowerCase();
        const name = nameIndex !== -1 ? values[nameIndex] : undefined;
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return { email: email || `row-${index + 2}`, name, error: 'Invalid email format' };
        }
        
        return { email, name };
      }).filter(s => s.email);
      
      setParsedStudents(students);
      setImportStatus('idle');
    };
    
    reader.onerror = () => {
      alert('Error reading CSV file');
      setImportStatus('error');
    };
    
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    setImportStatus('uploading');
    setImportProgress(0);
    
    const validStudents = parsedStudents.filter(s => !s.error);
    const total = validStudents.length;
    
    if (total === 0) {
      alert('No valid students to import');
      setImportStatus('error');
      return;
    }
    
    try {
      // Note: This creates profiles in Supabase. Actual Wristband user creation
      // would need to happen via Wristband's API or invite flow
      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        
        // Check if user already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', student.email)
          .single();
        
        if (!existingProfile) {
          // Create profile (user will be created when they log in via Wristband)
          await supabase.from('profiles').insert([{
            email: student.email,
            username: student.name || student.email.split('@')[0],
            created_at: new Date().toISOString()
          }]);
        }
        
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }
      
      setImportStatus('complete');
      fetchAdminData(); // Refresh the student list
      
      setTimeout(() => {
        setShowCsvImportModal(false);
        setImportStatus('idle');
        setCsvFile(null);
        setParsedStudents([]);
      }, 2000);
    } catch (error) {
      console.error('Error importing students:', error);
      setImportStatus('error');
      alert('Failed to import students. Please try again.');
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
          <h1 className="text-4xl font-retro text-maineBlue mb-2">School Admin Dashboard</h1>
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
                  ? 'border-seafoam bg-teal-50 scale-105 ring-4 ring-maineBlue' 
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
                  ? 'border-blue-400 bg-blue-50 scale-105 ring-4 ring-maineBlue' 
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
                  ? 'border-red-400 bg-red-50 scale-105 ring-4 ring-maineBlue' 
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
                  ? 'border-yellow-300 bg-yellow-50 scale-105 ring-4 ring-maineBlue' 
                  : 'border-yellow-300 bg-yellow-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center`}
            >
              <div className="mb-3 text-4xl">🏫</div>
              <h3 className="text-sm font-bold font-retro">School Settings</h3>
            </button>
          </div>
        </div>

        {/* Second separation line between nav and content */}
        <hr className="border-t-2 border-maineBlue my-6" />

        {/* Upcoming Events Banner - Auto-scrolling like Live Now */}
        {upcomingEvents.length > 0 && (
          <div 
            className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 mb-4 cursor-pointer"
            onMouseEnter={() => setIsEventsPaused(true)}
            onMouseLeave={() => setIsEventsPaused(false)}
            onClick={() => {
              const event = upcomingEvents[currentEventIndex];
              if (event.type === 'alumni') {
                setSelectedEventId(event.id);
                setShowViewEventModal(true);
              } else if (event.type === 'career') {
                setSelectedCareerEventId(event.id);
                setShowViewCareerEventModal(true);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center mr-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-bold text-blue-700 text-sm">📅 UPCOMING</span>
              </div>
              <div className="flex-1 text-center">
                <div className="text-sm text-blue-800 transition-all duration-500">
                  <span>
                    <strong>{upcomingEvents[currentEventIndex].name}</strong> •{' '}
                    {upcomingEvents[currentEventIndex].date} at {upcomingEvents[currentEventIndex].time} •{' '}
                    {upcomingEvents[currentEventIndex].registered} registered
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{upcomingEvents[currentEventIndex].emoji}</span>
                <div className={`bg-${upcomingEvents[currentEventIndex].color}-500 text-white text-xs px-4 py-2 rounded-full font-medium`}>
                  View Details
                </div>
              </div>
            </div>
            
            {/* Progress dots */}
            {upcomingEvents.length > 1 && (
              <div className="flex justify-center mt-3 gap-1">
                {upcomingEvents.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentEventIndex ? 'bg-blue-500' : 'bg-blue-200'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separation line */}
        <hr className="border-t-2 border-maineBlue mb-6" />
        
        {/* Content Area */}
        <div className="px-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Program Health */}
            <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">👥</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">User Activity</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">Monitor student engagement, login patterns, and module usage</p>
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
                  <p className="text-sm text-gray-600 mb-3 italic">Track completion rates, job placement success, and effectiveness</p>
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
                  <p className="text-sm text-gray-600 mb-3 italic">Monitor enrollment trends, retention rates, and metrics</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎓</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">Student Management</h4>
                <p className="text-sm text-gray-600 mb-3 italic">Keep track of your student body, notify them of events, and track their progress</p>
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
                <div className="mb-3 text-4xl">📜</div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🤖</div>
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
                <div className="mb-3 text-4xl">🔍</div>
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
                <h4 className="font-semibold text-gray-900 mb-2 font-retro"> Job Placement Services</h4>
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
                <p className="text-sm text-gray-600 ml-6">Performance & content metrics, live session data</p>
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
                <button 
                  onClick={() => setShowEmploymentDataModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-retro w-full"
                >
                  View Employment Data
                </button>
              </div>

              {/* Industry Partnerships */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🤝</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Industry Partnerships</h3>
                <p className="text-sm text-gray-600 mb-4">Manage relationships with restaurants, hotels, and culinary employers</p>
                <button 
                  onClick={() => setShowManagePartnersModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro w-full"
                >
                  Manage Partners
                </button>
              </div>

              {/* Career Services */}
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">💼</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Career Services</h3>
                <p className="text-sm text-gray-600 mb-4">Coordinate job fairs, internships, and career counseling services</p>
                <button 
                  onClick={() => setShowCareerServicesModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-retro w-full"
                >
                  Manage Services
                </button>
              </div>

              {/* Credentialing & Certifications */}
              <div className="border-4 border-orange-400 bg-orange-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🏅</div>
                <h3 className="font-bold text-gray-900 mb-2 font-retro">Credentialing & Certifications</h3>
                <p className="text-sm text-gray-600 mb-4">Track ServSafe, Food Handler permits, and culinary certifications</p>
                <button 
                  onClick={() => setShowCredentialingModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 font-retro w-full"
                >
                  Manage Credentials
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
                      <img src="logo.png" className="w-5 h-5 border border-gray-400 rounded" />
                      Ask Chef Freddie
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Supports: PDF, Word, Excel, PowerPoint, Images</p>
                </div>
              </div>

              {/* Content Preview & Mapping */}
              <div className="border-4 border-maineBlue rounded-lg p-4">
                <h3 className="text-center font-bold text-gray-900 mb-3">📋 Content Distribution</h3>
                <p className="text-center text-sm text-gray-600 mb-4">Choose which parts of your uploaded content go to each module:</p>
                
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
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue" />
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue">
                      <option>All Students</option>
                      <option>Specific Classes</option>
                      <option>Draft (Instructors Only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-center block text-sm font-medium text-gray-700 mb-1">Notification</label>
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

              {/* Student Directory */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <div className="flex justify-center items-center mb-4 relative pl-6">
                  <h3 className="font-bold text-maineBlue">📋 Student Directory</h3>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro text-sm flex items-center gap-2 absolute right-0"
                  >
                    <span className="text-lg">+</span> Add Student
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.slice(0, 10).map((user) => {
                    const initials = (user.username || user.email || 'NA')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    
                    return (
                      <div key={user.id} className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{user.username || 'N/A'}</h4>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                              Level {user.level || 1}
                            </span>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>📚 Program: Culinary Arts</p>
                              <p>📧 Email: {user.email}</p>
                              <p>📞 Phone: (555) 123-4567</p>
                            </div>
                          </div>
                          <div className="w-px h-24 bg-gray-300"></div>
                          <div className="w-20 h-20 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                            {initials}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setEditingStudent(user);
                              setShowEditStudentModal(true);
                            }}
                            className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-1 border border-maineBlue rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove ${user.username || user.email}?`)) {
                                setUsers(prev => prev.filter(u => u.id !== user.id));
                                alert('Student removed successfully!');
                              }
                            }}
                            className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-1 border border-red-600 rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  <button 
                    onClick={() => setShowAnnouncementModal(true)}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">📧</div>
                    <h4 className="font-medium text-blue-800">Send Announcement</h4>
                    <p className="text-xs text-blue-600">Notify all students</p>
                  </button>
                  <button 
                    onClick={() => setShowCsvImportModal(true)}
                    className="bg-green-50 border-4 border-green-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">📤</div>
                    <h4 className="font-medium text-green-800">Import Students (CSV)</h4>
                    <p className="text-xs text-green-600">Bulk upload student list</p>
                  </button>
                  <button 
                    onClick={() => setShowExportDataModal(true)}
                    className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
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
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Faculty Management Dashboard</h2>
              <button
                onClick={() => setShowFacultyManagementModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Manage instructor access, permissions, curriculum responsibilities, and faculty performance.</p>
            
            <div className="space-y-6">
              {/* Faculty Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">👩‍🏫 Faculty Overview</h3>
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
                <h3 className="font-bold text-maineBlue text-center mb-4">👩‍🏫 Faculty Directory</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">Chef Julia Davis</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                          Active
                        </span>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📚 Courses: Advanced Techniques, Sauce Mastery</p>
                          <p>👥 Students: 42 active</p>
                          <p>📅 Last Login: Today, 9:15 AM</p>
                        </div>
                      </div>
                      <div className="w-px h-24 bg-gray-300"></div>
                      <div className="w-20 h-20 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                        JD
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">Chef Marco Rodriguez</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                          Active
                        </span>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📚 Courses: Baking Fundamentals, Cake Decoration</p>
                          <p>👥 Students: 28 active</p>
                          <p>📅 Last Login: Yesterday, 4:30 PM</p>
                        </div>
                      </div>
                      <div className="w-px h-24 bg-gray-300"></div>
                      <div className="w-20 h-20 bg-green-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                        MR
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty Permissions & Access */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">🔐 Faculty Permissions & Access</h3>
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
                <h3 className="text-center font-bold text-maineBlue mb-4">⚡ Faculty Management Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setShowAddFacultyModal(true)}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-medium text-blue-800">Add New Faculty</h4>
                    <p className="text-xs text-blue-600">Invite new instructors</p>
                  </button>
                  <button 
                    onClick={() => setShowManagePermissionsModal(true)}
                    className="bg-green-50 border-4 border-green-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">🔐</div>
                    <h4 className="font-medium text-green-800">Manage Permissions</h4>
                    <p className="text-xs text-green-600">Update access levels</p>
                  </button>
                  <button 
                    onClick={() => setShowFacultyReportsModal(true)}
                    className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
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
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Alumni Management Dashboard</h2>
              <button
                onClick={() => setShowAlumniManagementModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Track graduate success stories, career outcomes, and maintain alumni network connections.</p>
            
            <div className="space-y-6">
              {/* Alumni Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">🎓 Alumni Overview</h3>
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
                <div className="flex justify-center items-center mb-4 relative pl-6">
                  <h3 className="font-bold text-maineBlue">⭐ Success Stories</h3>
                  <button
                    onClick={() => setShowAddAlumniModal(true)}
                    className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro text-sm flex items-center gap-2 absolute right-0"
                  >
                    <span className="text-lg">+</span> Add Alumni
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">Maria Santos</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs inline-block mb-2">
                          Class of 2022
                        </span>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>🏆 Executive Chef at Michelin-starred restaurant</p>
                          <p>📍 Le Bernardin, New York</p>
                          <p>💰 Salary: $85,000/year</p>
                        </div>
                      </div>
                      <div className="w-px h-24 bg-gray-300"></div>
                      <div className="w-20 h-20 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                        MS
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">James Chen</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                          Class of 2021
                        </span>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>🏢 Restaurant Owner & Entrepreneur</p>
                          <p>📍 Chen's Kitchen (3 locations)</p>
                          <p>💰 Revenue: $2.1M annually</p>
                        </div>
                      </div>
                      <div className="w-px h-24 bg-gray-300"></div>
                      <div className="w-20 h-20 bg-green-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                        JC
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">Ashley Rodriguez</h4>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs inline-block mb-2">
                          Class of 2023
                        </span>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>📺 Food Network Personality</p>
                          <p>📍 Host of "Pastry Perfection"</p>
                          <p>💰 $120,000/year + endorsements</p>
                        </div>
                      </div>
                      <div className="w-px h-24 bg-gray-300"></div>
                      <div className="w-20 h-20 bg-purple-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                        AR
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border-4 border-gray-400">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">David Miller</h4>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs inline-block mb-2">
                          Class of 2020
                        </span>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>🍟 Corporate Food Service Director</p>
                          <p>📍 Google Campus Dining</p>
                          <p>💰 $95,000/year + benefits</p>
                        </div>
                      </div>
                      <div className="w-px h-24 bg-gray-300"></div>
                      <div className="w-20 h-20 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 border border-black">
                        DM
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Alumni Network Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-6">
                <h3 className="text-center font-bold text-maineBlue mb-4">⚡ Alumni Network Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setShowAlumniNewsletterModal(true)}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">📧</div>
                    <h4 className="font-medium text-blue-800">Alumni Newsletter</h4>
                    <p className="text-xs text-blue-600">Send updates and opportunities</p>
                  </button>
                  <button 
                    onClick={() => setShowPlanEventModal(true)}
                    className="bg-green-50 border-4 border-green-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">🎉</div>
                    <h4 className="font-medium text-green-800">Plan Alumni Event</h4>
                    <p className="text-xs text-green-600">Networking and reunions</p>
                  </button>
                  <button 
                    onClick={() => setShowGiftingDonationsModal(true)}
                    className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-2xl mb-2">📄</div>
                    <h4 className="font-medium text-purple-800">Gifting & Donations</h4>
                    <p className="text-xs text-purple-600">Fundraising Strategy</p>
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
                    <div className="text-center text-2xl font-bold text-blue-600 mb-1">67%</div>
                    <p className="text-center text-xs text-blue-600">2,340 sessions this week</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">📖</div>
                      <h4 className="font-medium text-green-800">MyCookBook</h4>
                    </div>
                    <div className="text-center text-2xl font-bold text-green-600 mb-1">84%</div>
                    <p className="text-center text-xs text-green-600">1,890 assignments viewed</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">🏫</div>
                      <h4 className="font-medium text-purple-800">CulinarySchool</h4>
                    </div>
                    <div className="text-center text-2xl font-bold text-purple-600 mb-1">72%</div>
                    <p className="text-center text-xs text-purple-600">1,456 technique views</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-2xl mr-2">👨‍🍳</div>
                      <h4 className="font-medium text-orange-800">Chef's Corner</h4>
                    </div>
                    <div className="text-center text-2xl font-bold text-orange-600 mb-1">45%</div>
                    <p className="text-center text-xs text-orange-600">234 live sessions joined</p>
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
                    <div className="text-center text-2xl font-bold text-red-600 mb-1">23</div>
                    <p className="text-center text-sm text-red-800">No login in 7+ days</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-center text-2xl font-bold text-red-600 mb-1">8</div>
                    <p className="text-center text-sm text-red-800">No login in 14+ days</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-center text-2xl font-bold text-red-600 mb-1">3</div>
                    <p className="text-center text-sm text-red-800">No login in 30+ days</p>
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
                    <div className="text-center text-2xl font-bold text-red-600 mb-1">23%</div>
                    <p className="text-center text-sm text-red-800">Students struggling with timing</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-center text-2xl font-bold text-red-600 mb-1">15%</div>
                    <p className="text-center text-sm text-red-800">Late assignment submissions</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <div className="text-center text-2xl font-bold text-red-600 mb-1">8%</div>
                    <p className="text-center text-sm text-red-800">Below 70% grade average</p>
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
                    <h4 className="text-center font-medium text-gray-800 mb-3">Current Cohorts</h4>
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
                    <h4 className="text-center font-medium text-gray-800 mb-3">Graduation Pipeline</h4>
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
                    <div className="text-center text-2xl font-bold text-yellow-600 mb-1">82%</div>
                    <p className="text-center text-sm text-yellow-800">Current utilization</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="text-center text-2xl font-bold text-yellow-600 mb-1">53</div>
                    <p className="text-center text-sm text-yellow-800">Available licenses</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="text-center text-2xl font-bold text-yellow-600 mb-1">Q2</div>
                    <p className="text-center text-sm text-yellow-800">Projected capacity</p>
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
            <div className="text-center mb-6 relative">
              <h2 className="text-center text-2xl font-bold text-maineBlue font-retro">Content Analytics Dashboard</h2>
              <button
                onClick={() => setShowContentAnalyticsModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Monitor content performance, student engagement, and curriculum effectiveness across all modules.</p>
            
            <div className="space-y-6">
              {/* Content Performance Overview */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-blue-900 mb-3">📊 Content Performance Overview</h3>
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
                  <h3 className="text-center font-bold text-blue-900 mb-3">🏆 Top Performing Recipes</h3>
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
                  <h3 className="text-center font-bold text-blue-900 mb-3">📉 Content Needing Attention</h3>
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
                <h3 className="text-center font-bold text-blue-900 mb-3">📈 Module-Specific Analytics</h3>
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
                <h3 className="text-center font-bold text-blue-900 mb-3">🕰️ Time-Based Analytics</h3>
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
                    <h4 className="text-center font-medium text-gray-800 mb-2">Content Filters</h4>
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
          </div>
        </div>
      )}

      {/* Cross-Platform Configuration Modal */}
      {showConfigurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Cross-Platform Configuration</h2>
              <button
                onClick={() => setShowConfigurationModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <p className="text-center text-gray-600 mb-6">Configure content permissions, access levels, and approval workflows across all PorkChop modules.</p>
            
            <div className="space-y-6">
              {/* Content Approval Workflows */}
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                <h3 className="text-center font-bold text-blue-900 mb-3">✅ Content Approval Workflows</h3>
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
                <h3 className="text-center font-bold text-blue-900 mb-3">🔐 Access Level Management</h3>
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
                <h3 className="text-center font-bold text-blue-900 mb-3">⚙️ Platform-Wide Settings</h3>
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
                <h3 className="text-center font-bold text-blue-900 mb-3">🔗 Integration Settings</h3>
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
                <h3 className="text-center font-bold text-gray-900 mb-4">📋 Recent Uploads</h3>
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
                <h3 className="text-center font-bold text-green-800 mb-3">✅ Success! Your API Key has been generated</h3>
                <p className="text-center text-sm text-green-700 mb-4">
                  Keep this key secure and don't share it publicly. You can use this key to integrate with PorkChop's curriculum management system.
                </p>
              </div>
              
              <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                <label className="text-center block text-sm font-medium text-gray-700 mb-2">Your API Key:</label>
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
                <p className="text-center text-xs text-gray-500 mt-2">
                  Click the eye icon to show/hide the key. Click Copy to copy to clipboard.
                </p>
              </div>
              
              <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                <h4 className="text-center font-bold text-blue-800 mb-2">📄 API Documentation</h4>
                <p className="text-center text-sm text-blue-700 mb-3">
                  Use this key to access PorkChop's curriculum management endpoints:
                </p>
                <ul className="text-center text-sm text-blue-600 space-y-1">
                  <li>• <code className="bg-blue-100 px-1 rounded">POST /api/curriculum/upload</code> - Upload course materials</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">GET /api/students/progress</code> - Get student progress data</li>
                  <li>• <code className="bg-blue-100 px-1 rounded">POST /api/assignments/create</code> - Create new assignments</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
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
          <div className="bg-white rounded-lg shadow-lg border-4 border-red-400 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-red-700 font-retro flex items-center justify-center gap-2">
                <span className="text-3xl"></span>
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
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Import Students from CSV</h2>
              <button
                onClick={() => {
                  setShowCsvImportModal(false);
                  setImportStatus('idle');
                  setCsvFile(null);
                  setParsedStudents([]);
                }}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">📋 CSV Format Requirements:</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Must include an <strong>"email"</strong> column (required)</li>
                <li>Optional: <strong>"name"</strong> or <strong>"full name"</strong> column</li>
                <li>First row must be headers</li>
                <li>Example: <code className="bg-blue-100 px-1 rounded">email,name</code></li>
              </ul>
            </div>

            {/* File Upload */}
            {importStatus === 'idle' && parsedStudents.length === 0 && (
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Upload CSV File</h3>
                <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="bg-maineBlue text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 inline-block"
                >
                  Choose CSV File
                </label>
              </div>
            )}

            {/* Parsing Status */}
            {importStatus === 'parsing' && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Parsing CSV file...</p>
              </div>
            )}

            {/* Preview Parsed Students */}
            {parsedStudents.length > 0 && importStatus !== 'uploading' && importStatus !== 'complete' && (
              <div className="mb-6">
                <h3 className="font-bold text-maineBlue mb-3">📊 Preview ({parsedStudents.length} students)</h3>
                <div className="border-4 border-maineBlue rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedStudents.map((student, index) => (
                        <tr key={index} className={student.error ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm text-gray-900">{student.email}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{student.name || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            {student.error ? (
                              <span className="text-red-600">❌ {student.error}</span>
                            ) : (
                              <span className="text-green-600">✅ Valid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {parsedStudents.filter(s => !s.error).length} valid students, {parsedStudents.filter(s => s.error).length} errors
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCsvFile(null);
                        setParsedStudents([]);
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={parsedStudents.filter(s => !s.error).length === 0}
                      className="bg-maineBlue text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Import {parsedStudents.filter(s => !s.error).length} Students
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {importStatus === 'uploading' && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⬆️</div>
                <p className="text-gray-600 mb-4">Importing students...</p>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-maineBlue h-4 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{importProgress}% complete</p>
              </div>
            )}

            {/* Success Message */}
            {importStatus === 'complete' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-600 mb-2">Import Complete!</h3>
                <p className="text-gray-600">Students have been successfully imported.</p>
              </div>
            )}

            {/* Error Message */}
            {importStatus === 'error' && (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Import Failed</h3>
                <p className="text-gray-600">Please check your CSV file and try again.</p>
                <button
                  onClick={() => {
                    setImportStatus('idle');
                    setCsvFile(null);
                    setParsedStudents([]);
                  }}
                  className="mt-4 bg-maineBlue text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">📧 Send Announcement</h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject:</label>
                <input
                  type="text"
                  value={announcementSubject}
                  onChange={(e) => setAnnouncementSubject(e.target.value)}
                  placeholder="Enter announcement subject"
                  className="w-full border-4 border-blue-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message:</label>
                <textarea
                  rows={6}
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter your announcement message..."
                  className="w-full border-4 border-blue-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-2">Recipients:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-gray-700">All Students ({users.length})</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Active Students Only</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Faculty Members</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!announcementSubject.trim() || !announcementMessage.trim()) {
                      alert('Please enter both subject and message');
                      return;
                    }
                    
                    setSendingAnnouncement(true);
                    try {
                      // Create notification for all users
                      const notifications = users.map(user => ({
                        user_id: user.id,
                        message: `${announcementSubject}: ${announcementMessage}`,
                        read: false
                      }));
                      
                      const { error } = await supabase
                        .from('notifications')
                        .insert(notifications);
                      
                      if (error) throw error;
                      
                      alert(`Announcement sent to ${users.length} recipients!`);
                      setAnnouncementSubject('');
                      setAnnouncementMessage('');
                      setShowAnnouncementModal(false);
                    } catch (error: any) {
                      console.error('Error sending announcement:', error);
                      alert('Failed to send announcement: ' + error.message);
                    } finally {
                      setSendingAnnouncement(false);
                    }
                  }}
                  disabled={sendingAnnouncement}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingAnnouncement ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Student Data Modal */}
      {showExportDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600 font-retro">📄 Export Student Data</h2>
              <button
                onClick={() => setShowExportDataModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50">
                <h3 className="font-bold text-purple-800 mb-2">Export Options:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="radio" name="exportType" className="mr-2" defaultChecked />
                    <span className="text-gray-700">All Student Records (CSV)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="exportType" className="mr-2" />
                    <span className="text-gray-700">Active Students Only (CSV)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="exportType" className="mr-2" />
                    <span className="text-gray-700">Student Progress Report (PDF)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="exportType" className="mr-2" />
                    <span className="text-gray-700">Complete Data Export (JSON)</span>
                  </label>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">Data Fields to Include:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">Name & Email</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">XP & Level</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">Subscription Status</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Progress Data</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Last Login</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Achievements</span>
                  </label>
                </div>
              </div>
              <div className="bg-gray-50 border-4 border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <strong>Total Records:</strong> {users.length} students
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Export Format:</strong> CSV (Comma-Separated Values)
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExportDataModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setExportingData(true);
                    try {
                      // Query all student data
                      const { data, error } = await supabase
                        .from('profiles')
                        .select('id, email, username, xp, level, created_at, last_login')
                        .order('created_at', { ascending: false });
                      
                      if (error) throw error;
                      
                      if (!data || data.length === 0) {
                        alert('No student data to export');
                        return;
                      }
                      
                      // Convert to CSV and download
                      const csv = convertToCSV(data);
                      const timestamp = new Date().toISOString().split('T')[0];
                      downloadFile(csv, `student-data-${timestamp}.csv`);
                      
                      alert(`Successfully exported ${data.length} student records!`);
                      setShowExportDataModal(false);
                    } catch (error: any) {
                      console.error('Error exporting data:', error);
                      alert('Failed to export data: ' + error.message);
                    } finally {
                      setExportingData(false);
                    }
                  }}
                  disabled={exportingData}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingData ? 'Exporting...' : 'Download Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Faculty Modal */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">👥 Add New Faculty</h2>
              <button
                onClick={() => setShowAddFacultyModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name:</label>
                <input
                  type="text"
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="Enter instructor's full name"
                  className="w-full border-4 border-blue-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address:</label>
                <input
                  type="email"
                  value={newFacultyEmail}
                  onChange={(e) => setNewFacultyEmail(e.target.value)}
                  placeholder="instructor@example.com"
                  className="w-full border-4 border-blue-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-2">Role & Permissions:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="role" 
                      className="mr-2" 
                      checked={newFacultyRole === 'Instructor'}
                      onChange={() => setNewFacultyRole('Instructor')}
                    />
                    <span className="text-gray-700">Instructor - Can teach courses and grade assignments</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="role" 
                      className="mr-2" 
                      checked={newFacultyRole === 'Teaching Assistant'}
                      onChange={() => setNewFacultyRole('Teaching Assistant')}
                    />
                    <span className="text-gray-700">Teaching Assistant - Limited grading access</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      name="role" 
                      className="mr-2" 
                      checked={newFacultyRole === 'Department Head'}
                      onChange={() => setNewFacultyRole('Department Head')}
                    />
                    <span className="text-gray-700">Department Head - Full curriculum management</span>
                  </label>
                </div>
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">Course Assignments:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Knife Skills</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Seafood Safety</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Baking Fundamentals</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Sauce Making</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddFacultyModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newFacultyName.trim() || !newFacultyEmail.trim()) {
                      alert('Please enter faculty name and email');
                      return;
                    }
                    
                    const initials = newFacultyName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    const newFaculty = {
                      id: `faculty-${Date.now()}`,
                      name: newFacultyName,
                      email: newFacultyEmail,
                      role: newFacultyRole,
                      status: 'Active',
                      courses: 'New Courses',
                      students: 0,
                      lastLogin: 'Never',
                      initials: initials,
                      color: randomColor
                    };
                    
                    setFacultyList(prev => [...prev, newFaculty]);
                    setNewFacultyName('');
                    setNewFacultyEmail('');
                    setNewFacultyRole('Instructor');
                    setShowAddFacultyModal(false);
                    alert('Faculty member added successfully!');
                  }}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 p-6 w-full max-w-md">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">🎓 Add New Student</h2>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="student@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newStudentPhone}
                  onChange={(e) => {
                    const input = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    let formatted = '';
                    
                    if (input.length > 0) {
                      formatted = '(' + input.substring(0, 3);
                    }
                    if (input.length >= 4) {
                      formatted += ') ' + input.substring(3, 6);
                    }
                    if (input.length >= 7) {
                      formatted += '-' + input.substring(6, 10);
                    }
                    
                    setNewStudentPhone(formatted);
                  }}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={newStudentProgram}
                  onChange={(e) => setNewStudentProgram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                >
                  <option value="Culinary Arts">Culinary Arts</option>
                  <option value="Pastry Arts">Pastry Arts</option>
                  <option value="Baking & Pastry">Baking & Pastry</option>
                  <option value="Restaurant Management">Restaurant Management</option>
                  <option value="Hospitality Management">Hospitality Management</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newStudentName.trim() || !newStudentEmail.trim()) {
                    alert('Please enter student name and email');
                    return;
                  }
                  
                  // Add student to list
                  const newStudent = {
                    id: `student-${Date.now()}`,
                    username: newStudentName,
                    email: newStudentEmail,
                    xp: 0,
                    level: 1,
                    chat_count: 0,
                    last_chat_date: new Date().toISOString(),
                    created_at: new Date().toISOString()
                  };
                  
                  setUsers(prev => [...prev, newStudent]);
                  
                  // Reset form
                  setNewStudentName('');
                  setNewStudentEmail('');
                  setNewStudentPhone('');
                  setNewStudentProgram('Culinary Arts');
                  setShowAddStudentModal(false);
                  
                  alert('Student added successfully!');
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 p-6 w-full max-w-md">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">✏️ Edit Student</h2>
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                }}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={editingStudent.username || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, username: e.target.value})}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingStudent.email || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  placeholder="student@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value="(555) 123-4567"
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value="Culinary Arts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue"
                >
                  <option value="Culinary Arts">Culinary Arts</option>
                  <option value="Pastry Arts">Pastry Arts</option>
                  <option value="Baking & Pastry">Baking & Pastry</option>
                  <option value="Restaurant Management">Restaurant Management</option>
                  <option value="Hospitality Management">Hospitality Management</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                }}
                className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editingStudent.username?.trim() || !editingStudent.email?.trim()) {
                    alert('Please enter student name and email');
                    return;
                  }
                  
                  // Update student in list
                  setUsers(prev => prev.map(u => 
                    u.id === editingStudent.id ? editingStudent : u
                  ));
                  
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                  alert('Student updated successfully!');
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showManagePermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-600 font-retro">🔐 Manage Permissions</h2>
              <button
                onClick={() => setShowManagePermissionsModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50">
                <h3 className="font-bold text-green-800 mb-3">Faculty Members:</h3>
                <div className="space-y-3">
                  <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Chef Julia Martinez</p>
                        <p className="text-xs text-gray-600">julia.martinez@culinary.edu</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Instructor</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">Grade Assignments</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">Manage Students</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-gray-700">Edit Curriculum</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">View Reports</span>
                      </label>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-green-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Chef Marcus Chen</p>
                        <p className="text-xs text-gray-600">marcus.chen@culinary.edu</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Dept. Head</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">Grade Assignments</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">Manage Students</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">Edit Curriculum</span>
                      </label>
                      <label className="flex items-center text-sm">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-gray-700">View Reports</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowManagePermissionsModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setUpdatingPermissions(true);
                    try {
                      // In production, this would update specific faculty permissions
                      // For now, just demonstrate it works by simulating the update
                      await new Promise(resolve => setTimeout(resolve, 800));
                      
                      alert('Permissions updated successfully! (In production, this would update faculty roles in the database)');
                      setShowManagePermissionsModal(false);
                    } catch (error: any) {
                      console.error('Error updating permissions:', error);
                      alert('Failed to update permissions: ' + error.message);
                    } finally {
                      setUpdatingPermissions(false);
                    }
                  }}
                  disabled={updatingPermissions}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingPermissions ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Reports Modal */}
      {showFacultyReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600 font-retro">📊 Faculty Reports</h2>
              <button
                onClick={() => setShowFacultyReportsModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50 text-center">
                  <div className="text-3xl font-bold text-purple-600">5</div>
                  <p className="text-sm text-purple-800 font-medium mt-1">Active Faculty</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50 text-center">
                  <div className="text-3xl font-bold text-blue-600">142</div>
                  <p className="text-sm text-blue-800 font-medium mt-1">Students Taught</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50 text-center">
                  <div className="text-3xl font-bold text-green-600">4.7</div>
                  <p className="text-sm text-green-800 font-medium mt-1">Avg. Rating</p>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-3">Faculty Performance:</h3>
                <div className="space-y-3">
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900">Chef Julia Martinez</p>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Excellent</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Students: <strong>45</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Courses: <strong>3</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Rating: <strong>4.9/5</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900">Chef Marcus Chen</p>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Excellent</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Students: <strong>52</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Courses: <strong>4</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Rating: <strong>4.8/5</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900">Chef Sarah Williams</p>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Good</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Students: <strong>38</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Courses: <strong>2</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Rating: <strong>4.5/5</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowFacultyReportsModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setExportingFaculty(true);
                    try {
                      const { data, error } = await supabase
                        .from('faculty')
                        .select('full_name, email, role, students_count, rating, created_at')
                        .order('created_at', { ascending: false });
                      
                      if (error) throw error;
                      
                      if (!data || data.length === 0) {
                        alert('No faculty data to export');
                        return;
                      }
                      
                      const csv = convertToCSV(data);
                      const timestamp = new Date().toISOString().split('T')[0];
                      downloadFile(csv, `faculty-report-${timestamp}.csv`);
                      
                      alert(`Successfully exported ${data.length} faculty records!`);
                    } catch (error: any) {
                      console.error('Error exporting faculty:', error);
                      alert('Failed to export: ' + error.message);
                    } finally {
                      setExportingFaculty(false);
                    }
                  }}
                  disabled={exportingFaculty}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingFaculty ? 'Exporting...' : 'Export Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Newsletter Modal */}
      {showAlumniNewsletterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">📧 Alumni Newsletter</h2>
              <button
                onClick={() => setShowAlumniNewsletterModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Newsletter Title:</label>
                <input
                  type="text"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                  placeholder="e.g., Monthly Alumni Update - January 2025"
                  className="w-full border-4 border-blue-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content:</label>
                <textarea
                  rows={8}
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  placeholder="Share alumni success stories, upcoming events, job opportunities, and program updates..."
                  className="w-full border-4 border-blue-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-2">Include Sections:</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-gray-700">Alumni Spotlight</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-gray-700">Job Opportunities</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Upcoming Events</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Program Updates</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAlumniNewsletterModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newsletterTitle.trim() || !newsletterContent.trim()) {
                      alert('Please enter both title and content');
                      return;
                    }
                    
                    setSendingNewsletter(true);
                    try {
                      // Get all alumni user IDs
                      const { data: alumniData, error: alumniError } = await supabase
                        .from('alumni')
                        .select('user_id');
                      
                      if (alumniError) throw alumniError;
                      
                      if (!alumniData || alumniData.length === 0) {
                        alert('No alumni found to send newsletter to');
                        return;
                      }
                      
                      // Create notifications for all alumni
                      const notifications = alumniData
                        .filter(a => a.user_id)
                        .map(alumni => ({
                          user_id: alumni.user_id,
                          message: `${newsletterTitle}: ${newsletterContent}`,
                          read: false
                        }));
                      
                      const { error } = await supabase
                        .from('notifications')
                        .insert(notifications);
                      
                      if (error) throw error;
                      
                      alert(`Newsletter sent to ${notifications.length} alumni!`);
                      setNewsletterTitle('');
                      setNewsletterContent('');
                      setShowAlumniNewsletterModal(false);
                    } catch (error: any) {
                      console.error('Error sending newsletter:', error);
                      alert('Failed to send newsletter: ' + error.message);
                    } finally {
                      setSendingNewsletter(false);
                    }
                  }}
                  disabled={sendingNewsletter}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingNewsletter ? 'Sending...' : 'Send Newsletter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Alumni Event Modal */}
      {showPlanEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-600 font-retro">🎉 Plan Alumni Event</h2>
              <button
                onClick={() => setShowPlanEventModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Scheduled Events:</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="flex-1 border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">-- View Existing Event --</option>
                    <option value="event-1">Class of 2020 Reunion - March 15, 2025</option>
                    <option value="event-2">Spring Networking Event - April 10, 2025</option>
                    <option value="event-3">Annual Gala 2025 - May 20, 2025</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!selectedEventId) {
                        alert('Please select an event first');
                        return;
                      }
                      setShowViewEventModal(true);
                    }}
                    className="bg-green-400 text-white px-6 py-2 rounded-md hover:bg-green-500 font-retro whitespace-nowrap"
                  >
                    View
                  </button>
                </div>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <h3 className="text-center font-bold text-green-800 mb-4"></h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Name:</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Annual Alumni Reunion 2025"
                  className="w-full border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date:</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Time:</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location:</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Venue name and address"
                  className="w-full border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Type:</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="networking">Networking Event</option>
                  <option value="reunion">Reunion Dinner</option>
                  <option value="career_fair">Career Fair</option>
                  <option value="workshop">Cooking Workshop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Description:</label>
                <textarea
                  rows={4}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Describe the event, activities, and what alumni can expect..."
                  className="w-full border-4 border-green-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPlanEventModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!eventName.trim() || !eventDate || !eventTime) {
                      alert('Please enter event name, date, and time');
                      return;
                    }
                    
                    setCreatingEvent(true);
                    try {
                      const { error } = await supabase
                        .from('alumni_events')
                        .insert({
                          name: eventName,
                          event_type: eventType,
                          event_date: eventDate,
                          event_time: eventTime,
                          location: eventLocation || null,
                          description: eventDescription || null
                        });
                      
                      if (error) throw error;
                      
                      alert(`Event "${eventName}" created successfully!`);
                      setEventName('');
                      setEventDate('');
                      setEventTime('');
                      setEventLocation('');
                      setEventType('networking');
                      setEventDescription('');
                      setShowPlanEventModal(false);
                    } catch (error: any) {
                      console.error('Error creating event:', error);
                      alert('Failed to create event: ' + error.message);
                    } finally {
                      setCreatingEvent(false);
                    }
                  }}
                  disabled={creatingEvent}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingEvent ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gifting & Donations Modal */}
      {showGiftingDonationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600 font-retro">📄 Gifting & Donations</h2>
              <button
                onClick={() => setShowGiftingDonationsModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50 text-center">
                  <div className="text-3xl font-bold text-purple-600">$45,000</div>
                  <p className="text-sm text-purple-800 font-medium mt-1">Total Raised</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50 text-center">
                  <div className="text-3xl font-bold text-blue-600">127</div>
                  <p className="text-sm text-blue-800 font-medium mt-1">Donors</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50 text-center">
                  <div className="text-3xl font-bold text-green-600">$354</div>
                  <p className="text-sm text-green-800 font-medium mt-1">Avg. Donation</p>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50">
                <h3 className="font-bold text-purple-800 mb-3">Active Campaigns:</h3>
                <div className="space-y-3">
                  <div className="bg-white border-2 border-purple-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900">Scholarship Fund 2025</p>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                    <p className="text-xs text-gray-600">$22,500 of $30,000 goal</p>
                  </div>
                  <div className="bg-white border-2 border-purple-300 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-900">New Kitchen Equipment</p>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                    <p className="text-xs text-gray-600">$13,500 of $30,000 goal</p>
                  </div>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">Create New Campaign:</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Campaign name"
                    className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="number"
                    value={campaignGoal}
                    onChange={(e) => setCampaignGoal(e.target.value)}
                    placeholder="Fundraising goal ($)"
                    className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm"
                  />
                  <textarea
                    rows={3}
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Campaign description..."
                    className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowGiftingDonationsModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!campaignName.trim() || !campaignGoal) {
                      alert('Please enter campaign name and goal');
                      return;
                    }
                    
                    setCreatingCampaign(true);
                    try {
                      const { error } = await supabase
                        .from('donation_campaigns')
                        .insert({
                          name: campaignName,
                          goal_amount: parseFloat(campaignGoal),
                          current_amount: 0,
                          status: 'active',
                          description: campaignDescription || null
                        });
                      
                      if (error) throw error;
                      
                      alert(`Campaign "${campaignName}" launched successfully!`);
                      setCampaignName('');
                      setCampaignGoal('');
                      setCampaignDescription('');
                    } catch (error: any) {
                      console.error('Error creating campaign:', error);
                      alert('Failed to create campaign: ' + error.message);
                    } finally {
                      setCreatingCampaign(false);
                    }
                  }}
                  disabled={creatingCampaign}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCampaign ? 'Creating...' : 'Launch Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Employment Data Modal */}
      {showEmploymentDataModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-600 font-retro">📈 Employment Data</h2>
              <button
                onClick={() => setShowEmploymentDataModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50 text-center">
                  <div className="text-3xl font-bold text-green-600">87%</div>
                  <p className="text-sm text-green-800 font-medium mt-1">Employment Rate</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50 text-center">
                  <div className="text-3xl font-bold text-blue-600">156</div>
                  <p className="text-sm text-blue-800 font-medium mt-1">Graduates Placed</p>
                </div>
                <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50 text-center">
                  <div className="text-3xl font-bold text-purple-600">$52k</div>
                  <p className="text-sm text-purple-800 font-medium mt-1">Avg. Starting Salary</p>
                </div>
                <div className="border-4 border-orange-400 rounded-lg p-4 bg-orange-50 text-center">
                  <div className="text-3xl font-bold text-orange-600">45</div>
                  <p className="text-sm text-orange-800 font-medium mt-1">Days to Placement</p>
                </div>
              </div>
              <div className="border-4 border-green-400 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-3">Recent Placements:</h3>
                <div className="space-y-2">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Sarah Johnson</p>
                      <p className="text-xs text-gray-600">Sous Chef at The French Laundry</p>
                    </div>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Placed</span>
                  </div>
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Michael Chen</p>
                      <p className="text-xs text-gray-600">Pastry Chef at Eleven Madison Park</p>
                    </div>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Placed</span>
                  </div>
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Emma Rodriguez</p>
                      <p className="text-xs text-gray-600">Executive Chef at Nobu</p>
                    </div>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Placed</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEmploymentDataModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setExportingEmployment(true);
                    try {
                      const { data, error } = await supabase
                        .from('employment_records')
                        .select(`
                          id,
                          employer,
                          position,
                          start_date,
                          salary,
                          placement_date,
                          created_at,
                          profiles (username, email)
                        `)
                        .order('placement_date', { ascending: false });
                      
                      if (error) throw error;
                      
                      if (!data || data.length === 0) {
                        alert('No employment data to export');
                        return;
                      }
                      
                      // Flatten data for CSV
                      const flatData = data.map((record: any) => {
                        const profile = Array.isArray(record.profiles) ? record.profiles[0] : record.profiles;
                        return {
                          student_name: profile?.username || 'N/A',
                          student_email: profile?.email || 'N/A',
                          employer: record.employer,
                          position: record.position,
                          start_date: record.start_date,
                          salary: record.salary,
                          placement_date: record.placement_date
                        };
                      });
                      
                      const csv = convertToCSV(flatData);
                      const timestamp = new Date().toISOString().split('T')[0];
                      downloadFile(csv, `employment-report-${timestamp}.csv`);
                      
                      alert(`Successfully exported ${data.length} employment records!`);
                    } catch (error: any) {
                      console.error('Error exporting employment data:', error);
                      alert('Failed to export: ' + error.message);
                    } finally {
                      setExportingEmployment(false);
                    }
                  }}
                  disabled={exportingEmployment}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingEmployment ? 'Exporting...' : 'Export Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Partners Modal */}
      {showManagePartnersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600 font-retro">🤝 Industry Partners</h2>
              <button
                onClick={() => setShowManagePartnersModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-3">Active Partners ({3}):</h3>
                <div className="space-y-3">
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">The French Laundry</p>
                        <p className="text-sm text-gray-600">Yountville, CA</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                      <div>
                        <p className="text-gray-600">Students Hired: <strong>12</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Open Positions: <strong>3</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Partnership Since: <strong>2020</strong></p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">Eleven Madison Park</p>
                        <p className="text-sm text-gray-600">New York, NY</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                      <div>
                        <p className="text-gray-600">Students Hired: <strong>8</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Open Positions: <strong>2</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Partnership Since: <strong>2019</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">Add New Partner:</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Restaurant/Company Name"
                    className="border-2 border-blue-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={partnerLocation}
                    onChange={(e) => setPartnerLocation(e.target.value)}
                    placeholder="Location"
                    className="border-2 border-blue-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="Contact Email"
                    className="border-2 border-blue-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="tel"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="border-2 border-blue-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowManagePartnersModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!partnerName.trim() || !partnerLocation.trim()) {
                      alert('Please enter at least partner name and location');
                      return;
                    }
                    
                    setAddingPartner(true);
                    try {
                      const { error } = await supabase
                        .from('industry_partners')
                        .insert({
                          name: partnerName,
                          location: partnerLocation,
                          contact_email: partnerEmail || null,
                          contact_phone: partnerPhone || null,
                          students_hired: 0,
                          open_positions: 0,
                          partnership_since: new Date().getFullYear()
                        });
                      
                      if (error) throw error;
                      
                      alert(`Partner ${partnerName} added successfully!`);
                      setPartnerName('');
                      setPartnerLocation('');
                      setPartnerEmail('');
                      setPartnerPhone('');
                    } catch (error: any) {
                      console.error('Error adding partner:', error);
                      alert('Failed to add partner: ' + error.message);
                    } finally {
                      setAddingPartner(false);
                    }
                  }}
                  disabled={addingPartner}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingPartner ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Services Modal */}
      {showCareerServicesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600 font-retro">💼 Career Services</h2>
              <button
                onClick={() => setShowCareerServicesModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50 text-center">
                  <div className="text-3xl font-bold text-purple-600">24</div>
                  <p className="text-sm text-purple-800 font-medium mt-1">Active Internships</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50 text-center">
                  <div className="text-3xl font-bold text-blue-600">8</div>
                  <p className="text-sm text-blue-800 font-medium mt-1">Job Fairs Scheduled</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50 text-center">
                  <div className="text-3xl font-bold text-green-600">156</div>
                  <p className="text-sm text-green-800 font-medium mt-1">Students Counseled</p>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50">
                <h3 className="font-bold text-purple-800 mb-3">Scheduled Events:</h3>
                <div className="flex gap-2">
                  <select 
                    value={selectedCareerEventId}
                    onChange={(e) => setSelectedCareerEventId(e.target.value)}
                    className="flex-1 border-4 border-purple-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">-- View Existing Event --</option>
                    <option value="career-1">Spring Career Fair 2025 - March 15, 2025</option>
                    <option value="career-2">Resume Workshop - February 20, 2025</option>
                    <option value="career-3">Interview Prep Session - April 5, 2025</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!selectedCareerEventId) {
                        alert('Please select an event first');
                        return;
                      }
                      setShowViewCareerEventModal(true);
                    }}
                    className="bg-purple-400 text-white px-6 py-2 rounded-md hover:bg-purple-500 font-retro whitespace-nowrap"
                  >
                    View
                  </button>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">Schedule New Service:</h3>
                <div className="space-y-3">
                  <select 
                    value={careerEventType}
                    onChange={(e) => setCareerEventType(e.target.value as any)}
                    className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm"
                  >
                    <option value="career_fair">Career Fair</option>
                    <option value="resume_workshop">Resume Workshop</option>
                    <option value="interview_prep">Interview Prep</option>
                    <option value="networking">Networking Event</option>
                  </select>
                  <input
                    type="date"
                    value={careerEventDate}
                    onChange={(e) => setCareerEventDate(e.target.value)}
                    className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm"
                  />
                  <textarea
                    rows={3}
                    value={careerEventDescription}
                    onChange={(e) => setCareerEventDescription(e.target.value)}
                    placeholder="Event details..."
                    className="w-full border-2 border-purple-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCareerServicesModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!careerEventDate) {
                      alert('Please select an event date');
                      return;
                    }
                    
                    setSchedulingCareerEvent(true);
                    try {
                      // Generate event name based on type
                      const eventNames = {
                        career_fair: 'Career Fair',
                        resume_workshop: 'Resume Workshop',
                        interview_prep: 'Interview Prep Session',
                        networking: 'Networking Event'
                      };
                      
                      const { error } = await supabase
                        .from('career_events')
                        .insert({
                          name: eventNames[careerEventType],
                          event_type: careerEventType,
                          event_date: careerEventDate,
                          event_time: null,
                          description: careerEventDescription || null,
                          status: 'upcoming'
                        });
                      
                      if (error) throw error;
                      
                      alert(`${eventNames[careerEventType]} scheduled successfully!`);
                      setCareerEventType('career_fair');
                      setCareerEventDate('');
                      setCareerEventDescription('');
                    } catch (error: any) {
                      console.error('Error scheduling event:', error);
                      alert('Failed to schedule event: ' + error.message);
                    } finally {
                      setSchedulingCareerEvent(false);
                    }
                  }}
                  disabled={schedulingCareerEvent}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {schedulingCareerEvent ? 'Scheduling...' : 'Schedule Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Database Modal */}
      {showAlumniDatabaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-orange-400 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-orange-600 font-retro">🎓 Alumni Database</h2>
              <button
                onClick={() => setShowAlumniDatabaseModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-4 border-orange-400 rounded-lg p-4 bg-orange-50 text-center">
                  <div className="text-3xl font-bold text-orange-600">342</div>
                  <p className="text-sm text-orange-800 font-medium mt-1">Total Alumni</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50 text-center">
                  <div className="text-3xl font-bold text-blue-600">87%</div>
                  <p className="text-sm text-blue-800 font-medium mt-1">Employed</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50 text-center">
                  <div className="text-3xl font-bold text-green-600">45</div>
                  <p className="text-sm text-green-800 font-medium mt-1">Success Stories</p>
                </div>
              </div>
              <div className="border-4 border-orange-400 rounded-lg p-4">
                <h3 className="font-bold text-orange-800 mb-3">Featured Alumni:</h3>
                <div className="space-y-3">
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Chef Maria Santos</p>
                        <p className="text-sm text-gray-600">Executive Chef at Nobu Malibu</p>
                        <p className="text-xs text-gray-500">Class of 2019</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Featured</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"The program gave me the foundation to pursue my dream of becoming an executive chef."</p>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">Chef David Kim</p>
                        <p className="text-sm text-gray-600">Owner of Kim's Kitchen (Michelin Star)</p>
                        <p className="text-xs text-gray-500">Class of 2018</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Featured</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"Best decision I ever made. Now running my own Michelin-starred restaurant!"</p>
                  </div>
                </div>
              </div>
              <div className="border-4 border-orange-400 rounded-lg p-4 bg-orange-50">
                <h3 className="font-bold text-orange-800 mb-2">Search Alumni:</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    className="border-2 border-orange-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Graduation Year"
                    className="border-2 border-orange-300 rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Current Employer"
                    className="border-2 border-orange-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAlumniDatabaseModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    setExportingAlumni(true);
                    try {
                      const { data, error } = await supabase
                        .from('alumni')
                        .select('full_name, graduation_year, current_employer, current_position, is_featured, created_at')
                        .order('graduation_year', { ascending: false });
                      
                      if (error) throw error;
                      
                      if (!data || data.length === 0) {
                        alert('No alumni data to export');
                        return;
                      }
                      
                      const csv = convertToCSV(data);
                      const timestamp = new Date().toISOString().split('T')[0];
                      downloadFile(csv, `alumni-database-${timestamp}.csv`);
                      
                      alert(`Successfully exported ${data.length} alumni records!`);
                    } catch (error: any) {
                      console.error('Error exporting alumni:', error);
                      alert('Failed to export: ' + error.message);
                    } finally {
                      setExportingAlumni(false);
                    }
                  }}
                  disabled={exportingAlumni}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingAlumni ? 'Exporting...' : 'Export Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Alumni Modal */}
      {showAddAlumniModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-orange-400 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-orange-600 font-retro">⭐ Add Alumni Success Story</h2>
              <button
                onClick={() => setShowAddAlumniModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name:</label>
                <input
                  type="text"
                  value={newAlumniName}
                  onChange={(e) => setNewAlumniName(e.target.value)}
                  placeholder="Enter alumni's full name"
                  className="w-full border-4 border-orange-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address:</label>
                <input
                  type="email"
                  value={newAlumniEmail}
                  onChange={(e) => setNewAlumniEmail(e.target.value)}
                  placeholder="alumni@example.com"
                  className="w-full border-4 border-orange-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Graduation Year:</label>
                <input
                  type="text"
                  value={newAlumniGradYear}
                  onChange={(e) => setNewAlumniGradYear(e.target.value)}
                  placeholder="e.g., 2023"
                  className="w-full border-4 border-orange-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Position:</label>
                <input
                  type="text"
                  value={newAlumniPosition}
                  onChange={(e) => setNewAlumniPosition(e.target.value)}
                  placeholder="e.g., Executive Chef, Restaurant Owner"
                  className="w-full border-4 border-orange-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Employer/Location:</label>
                <input
                  type="text"
                  value={newAlumniEmployer}
                  onChange={(e) => setNewAlumniEmployer(e.target.value)}
                  placeholder="e.g., Le Bernardin, New York"
                  className="w-full border-4 border-orange-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Salary/Revenue:</label>
                <input
                  type="text"
                  value={newAlumniSalary}
                  onChange={(e) => setNewAlumniSalary(e.target.value)}
                  placeholder="e.g., $85,000/year"
                  className="w-full border-4 border-orange-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddAlumniModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newAlumniName.trim() || !newAlumniGradYear.trim()) {
                      alert('Please enter at least name and graduation year');
                      return;
                    }
                    
                    const initials = newAlumniName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    const newAlumni = {
                      id: `alumni-${Date.now()}`,
                      name: newAlumniName,
                      email: newAlumniEmail,
                      graduationYear: newAlumniGradYear,
                      position: newAlumniPosition || 'Position not specified',
                      employer: newAlumniEmployer || 'Employer not specified',
                      salary: newAlumniSalary || 'Salary not specified',
                      initials: initials,
                      color: randomColor
                    };
                    
                    setAlumniList(prev => [...prev, newAlumni]);
                    setNewAlumniName('');
                    setNewAlumniEmail('');
                    setNewAlumniGradYear('');
                    setNewAlumniPosition('');
                    setNewAlumniEmployer('');
                    setNewAlumniSalary('');
                    setShowAddAlumniModal(false);
                    alert('Alumni success story added!');
                  }}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  Add Alumni
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Event Details Modal */}
      {showViewEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-600 font-retro">🎉 Event Details</h2>
              <button
                onClick={() => setShowViewEventModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {/* Event Info */}
              <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50">
                <h3 className="font-bold text-green-800 mb-3 text-lg">
                  {selectedEventId === 'event-1' && 'Class of 2020 Reunion'}
                  {selectedEventId === 'event-2' && 'Spring Networking Event'}
                  {selectedEventId === 'event-3' && 'Annual Gala 2025'}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600"><strong>Date:</strong> 
                      {selectedEventId === 'event-1' && ' March 15, 2025'}
                      {selectedEventId === 'event-2' && ' April 10, 2025'}
                      {selectedEventId === 'event-3' && ' May 20, 2025'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Time:</strong> 6:00 PM - 9:00 PM</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Location:</strong> Grand Ballroom, Downtown</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Type:</strong> 
                      {selectedEventId === 'event-1' && ' Reunion Dinner'}
                      {selectedEventId === 'event-2' && ' Networking Event'}
                      {selectedEventId === 'event-3' && ' Fundraising Gala'}
                    </p>
                  </div>
                </div>
              </div>

              {/* RSVP Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="border-4 border-blue-400 rounded-lg p-3 bg-blue-50 text-center">
                  <div className="text-2xl font-bold text-blue-600">342</div>
                  <p className="text-xs text-blue-800 font-medium">Invited</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-3 bg-green-50 text-center">
                  <div className="text-2xl font-bold text-green-600">156</div>
                  <p className="text-xs text-green-800 font-medium">Confirmed</p>
                </div>
                <div className="border-4 border-red-400 rounded-lg p-3 bg-red-50 text-center">
                  <div className="text-2xl font-bold text-red-600">28</div>
                  <p className="text-xs text-red-800 font-medium">Declined</p>
                </div>
                <div className="border-4 border-gray-400 rounded-lg p-3 bg-gray-50 text-center">
                  <div className="text-2xl font-bold text-gray-600">158</div>
                  <p className="text-xs text-gray-800 font-medium">No Response</p>
                </div>
              </div>

              {/* Certification Types */}
              <div className="border-4 border-orange-400 rounded-lg p-4">
                <h3 className="font-bold text-orange-800 mb-3">Certification Types Tracked:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍽️ ServSafe Manager</p>
                        <p className="text-xs text-gray-600">Food safety certification</p>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">142 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">👋 Food Handler Permit</p>
                        <p className="text-xs text-gray-600">State-required permit</p>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">158 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">⚠️ Allergen Training</p>
                        <p className="text-xs text-gray-600">Allergen awareness</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">89 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍷 Alcohol Service (TIPS)</p>
                        <p className="text-xs text-gray-600">Responsible alcohol service</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">67 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍸 Bartending Certification</p>
                        <p className="text-xs text-gray-600">Professional bartending</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">34 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍺 Brewing Certification</p>
                        <p className="text-xs text-gray-600">Craft brewing & beer knowledge</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">18 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">❤️ CPR/First Aid</p>
                        <p className="text-xs text-gray-600">Emergency response</p>
                      </div>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">45 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🎂 Specialized Culinary</p>
                        <p className="text-xs text-gray-600">Pastry, Sommelier, etc.</p>
                      </div>
                      <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">23 certified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RSVP List */}
              <div className="border-4 border-green-400 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-3">RSVP Responses:</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Maria Santos</p>
                      <p className="text-xs text-gray-600">maria.santos@example.com</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Confirmed</span>
                  </div>
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">James Chen</p>
                      <p className="text-xs text-gray-600">james.chen@example.com</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">Confirmed</span>
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Ashley Rodriguez</p>
                      <p className="text-xs text-gray-600">ashley.rodriguez@example.com</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">Declined</span>
                  </div>
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">David Miller</p>
                      <p className="text-xs text-gray-600">david.miller@example.com</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">No Response</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowViewEventModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={() => alert('Send reminder to No Response alumni')}
                  className="bg-yellow-400 text-white px-6 py-2 rounded-md hover:bg-yellow-500 font-retro"
                >
                  Send Reminder
                </button>
                <button
                  onClick={() => alert('Export attendee list')}
                  className="bg-green-400 text-white px-6 py-2 rounded-md hover:bg-green-500 font-retro"
                >
                  Export List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Career Event Details Modal */}
      {showViewCareerEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-600 font-retro">💼 Career Event Details</h2>
              <button
                onClick={() => setShowViewCareerEventModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {/* Event Info */}
              <div className="border-4 border-purple-400 rounded-lg p-4 bg-purple-50">
                <h3 className="font-bold text-purple-800 mb-3 text-lg">
                  {selectedCareerEventId === 'career-1' && 'Spring Career Fair 2025'}
                  {selectedCareerEventId === 'career-2' && 'Resume Workshop'}
                  {selectedCareerEventId === 'career-3' && 'Interview Prep Session'}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600"><strong>Date:</strong> 
                      {selectedCareerEventId === 'career-1' && ' March 15, 2025'}
                      {selectedCareerEventId === 'career-2' && ' February 20, 2025'}
                      {selectedCareerEventId === 'career-3' && ' April 5, 2025'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Time:</strong> 
                      {selectedCareerEventId === 'career-1' && ' 10:00 AM - 4:00 PM'}
                      {selectedCareerEventId === 'career-2' && ' 2:00 PM - 4:00 PM'}
                      {selectedCareerEventId === 'career-3' && ' 1:00 PM - 3:00 PM'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Location:</strong> Main Campus Auditorium</p>
                  </div>
                  <div>
                    <p className="text-gray-600"><strong>Type:</strong> 
                      {selectedCareerEventId === 'career-1' && ' Career Fair'}
                      {selectedCareerEventId === 'career-2' && ' Workshop'}
                      {selectedCareerEventId === 'career-3' && ' Interview Prep'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border-4 border-blue-400 rounded-lg p-3 bg-blue-50 text-center">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <p className="text-xs text-blue-800 font-medium">Registered</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-3 bg-green-50 text-center">
                  <div className="text-2xl font-bold text-green-600">12</div>
                  <p className="text-xs text-green-800 font-medium">Employers</p>
                </div>
                <div className="border-4 border-purple-400 rounded-lg p-3 bg-purple-50 text-center">
                  <div className="text-2xl font-bold text-purple-600">45</div>
                  <p className="text-xs text-purple-800 font-medium">Open Positions</p>
                </div>
              </div>

              {/* Registered Students */}
              <div className="border-4 border-purple-400 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-3">Registered Students:</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Sarah Johnson</p>
                      <p className="text-xs text-gray-600">Culinary Arts - Class of 2025</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Confirmed</span>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Michael Chen</p>
                      <p className="text-xs text-gray-600">Pastry Arts - Class of 2025</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Confirmed</span>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Emma Rodriguez</p>
                      <p className="text-xs text-gray-600">Culinary Management - Class of 2026</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowViewCareerEventModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={() => alert('Send reminder to registered students')}
                  className="bg-yellow-400 text-white px-6 py-2 rounded-md hover:bg-yellow-500 font-retro"
                >
                  Send Reminder
                </button>
                <button
                  onClick={() => alert('Export attendee list')}
                  className="bg-purple-400 text-white px-6 py-2 rounded-md hover:bg-purple-500 font-retro"
                >
                  Export List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentialing & Certifications Modal */}
      {showCredentialingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-orange-400 p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-orange-600 font-retro">🏅 Credentialing & Certifications</h2>
              <button
                onClick={() => setShowCredentialingModal(false)}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border-4 border-green-400 rounded-lg p-4 bg-green-50 text-center">
                  <div className="text-3xl font-bold text-green-600">87%</div>
                  <p className="text-sm text-green-800 font-medium">ServSafe Certified</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-4 bg-blue-50 text-center">
                  <div className="text-3xl font-bold text-blue-600">156</div>
                  <p className="text-sm text-blue-800 font-medium">Active Certifications</p>
                </div>
                <div className="border-4 border-yellow-400 rounded-lg p-4 bg-yellow-50 text-center">
                  <div className="text-3xl font-bold text-yellow-600">12</div>
                  <p className="text-sm text-yellow-800 font-medium">Expiring Soon</p>
                </div>
                <div className="border-4 border-red-400 rounded-lg p-4 bg-red-50 text-center">
                  <div className="text-3xl font-bold text-red-600">8</div>
                  <p className="text-sm text-red-800 font-medium">Expired</p>
                </div>
              </div>

              {/* Certification Types */}
              <div className="border-4 border-orange-400 rounded-lg p-4">
                <h3 className="font-bold text-orange-800 mb-3">Certification Types Tracked:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍽️ ServSafe Manager</p>
                        <p className="text-xs text-gray-600">Food safety certification</p>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">142 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">👋 Food Handler Permit</p>
                        <p className="text-xs text-gray-600">State-required permit</p>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">158 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">⚠️ Allergen Training</p>
                        <p className="text-xs text-gray-600">Allergen awareness</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">89 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍷 Alcohol Service (TIPS)</p>
                        <p className="text-xs text-gray-600">Responsible alcohol service</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">67 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍸 Bartending Certification</p>
                        <p className="text-xs text-gray-600">Professional bartending</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">34 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🍺 Brewing Certification</p>
                        <p className="text-xs text-gray-600">Craft brewing & beer knowledge</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">18 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">❤️ CPR/First Aid</p>
                        <p className="text-xs text-gray-600">Emergency response</p>
                      </div>
                      <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">45 certified</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🎂 Specialized Culinary</p>
                        <p className="text-xs text-gray-600">Pastry, Sommelier, etc.</p>
                      </div>
                      <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">23 certified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Students Needing Attention */}
              <div className="border-4 border-red-400 rounded-lg p-4 bg-red-50">
                <h3 className="font-bold text-red-800 mb-3">⚠️ Students Requiring Action:</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <div className="bg-white border-2 border-red-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Sarah Johnson</p>
                      <p className="text-xs text-gray-600">ServSafe expires in 15 days</p>
                    </div>
                    <button className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200">
                      Send Reminder
                    </button>
                  </div>
                  <div className="bg-white border-2 border-red-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Michael Chen</p>
                      <p className="text-xs text-gray-600">Food Handler Permit expired 5 days ago</p>
                    </div>
                    <button className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200">
                      Urgent Reminder
                    </button>
                  </div>
                  <div className="bg-white border-2 border-red-300 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">Emma Rodriguez</p>
                      <p className="text-xs text-gray-600">No ServSafe certification on file</p>
                    </div>
                    <button className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200">
                      Request Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCredentialingModal(false)}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-100 font-retro"
                >
                  Close
                </button>
                <button
                  onClick={() => alert('Send renewal reminders to all expiring certifications')}
                  className="bg-yellow-400 text-white px-6 py-2 rounded-md hover:bg-yellow-500 font-retro"
                >
                  Send Reminders
                </button>
                <button
                  onClick={() => alert('Export certification report')}
                  className="bg-orange-400 text-white px-6 py-2 rounded-md hover:bg-orange-500 font-retro"
                >
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
