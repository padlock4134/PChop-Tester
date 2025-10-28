import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, VideoCameraIcon, UserGroupIcon, GlobeAltIcon, HeartIcon, ChatBubbleOvalLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { supabase } from '../api/supabaseClient';
import { useSupabase } from './SupabaseProvider';
// Removed RecordRTC import to improve performance

interface LiveSession {
  id: string;
  hostName: string;
  dishName: string;
  culture: string;
  viewers: number;
  isLive: boolean;
  isEnded?: boolean;
  thumbnail: string;
  description: string;
  ingredients: string[];
  sessionType?: 'practice' | 'assignment' | 'demo' | 'showcase';
  teacherTag?: string;
}

interface UpcomingSession {
  id: string;
  hostName: string;
  dishName: string;
  culture: string;
  scheduledTime: string;
  description: string;
  sessionType?: 'practice' | 'assignment' | 'demo' | 'showcase';
  teacherTag?: string;
}

interface TimelinePost {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  image?: string;
  type: 'recipe' | 'ingredient' | 'story' | 'live' | 'success' | 'market';
  likes: number;
  comments: number;
  isLiked: boolean;
  tags?: string[];
}

const GlobalTestKitchen: React.FC = () => {
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'host'>('live');

  // User activity tracking for admin dashboard
  const logUserActivity = async (action: string, metadata?: any) => {
    if (!user) return;
    
    try {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        action,
        component: 'global_test_kitchen',
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };
  const [goLiveModalOpen, setGoLiveModalOpen] = useState(false);
  const [recordingModalOpen, setRecordingModalOpen] = useState(false);
  const [liveSessionModalOpen, setLiveSessionModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [savedVideoTitle, setSavedVideoTitle] = useState('');
  
  
  // Recording states (simplified)
  const [isRecording, setIsRecording] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [newPost, setNewPost] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Video metadata for saving
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoCuisine, setVideoCuisine] = useState('');
  
  // Schedule form states
  const [scheduledDishName, setScheduledDishName] = useState('');
  const [scheduledCuisine, setScheduledCuisine] = useState('');
  const [scheduledDescription, setScheduledDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledSessionType, setScheduledSessionType] = useState<'practice' | 'assignment' | 'demo' | 'showcase'>('practice');
  const [scheduledTeacher, setScheduledTeacher] = useState('');
  const [currentLiveSession, setCurrentLiveSession] = useState<LiveSession | null>(null);
  const [isViewer, setIsViewer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([
    {
      id: '1',
      hostName: 'Maria Santos',
      dishName: 'Authentic Paella Valenciana',
      culture: 'Spanish',
      viewers: 47,
      isLive: false,
      isEnded: true,
      thumbnail: '🥘',
      description: 'Traditional paella from Valencia with saffron and bomba rice',
      ingredients: ['Bomba rice', 'Saffron', 'Green beans', 'Lima beans', 'Chicken', 'Rabbit']
    },
    {
      id: '2',
      hostName: 'Kenji Nakamura',
      dishName: 'Hand-pulled Ramen',
      culture: 'Japanese',
      viewers: 23,
      isLive: true,
      thumbnail: '🍜',
      description: 'Making ramen noodles from scratch with tonkotsu broth',
      ingredients: ['High-gluten flour', 'Kansui', 'Pork bones', 'Miso paste']
    },
    {
      id: '3',
      hostName: 'Fatima Al-Zahra',
      dishName: 'Lebanese Kibbeh',
      culture: 'Lebanese',
      viewers: 35,
      isLive: true,
      thumbnail: '🧆',
      description: 'Hand-forming traditional kibbeh with bulgur and spiced lamb',
      ingredients: ['Fine bulgur', 'Ground lamb', 'Pine nuts', 'Allspice', 'Cinnamon']
    },
    {
      id: '4',
      hostName: 'Jean-Luc Dubois',
      dishName: 'French Croissants',
      culture: 'French',
      viewers: 62,
      isLive: true,
      thumbnail: '🥐',
      description: 'Mastering the art of laminated dough and butter layers',
      ingredients: ['Bread flour', 'European butter', 'Active dry yeast', 'Milk', 'Sugar']
    }
  ]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([
    {
      id: '3',
      hostName: 'Priya Sharma',
      dishName: 'Hyderabadi Biryani',
      culture: 'Indian',
      scheduledTime: '2:00 PM EST',
      description: 'Layered biryani with aromatic spices and basmati rice'
    },
    {
      id: '4',
      hostName: 'Ahmed Hassan',
      dishName: 'Moroccan Tagine',
      culture: 'Moroccan',
      scheduledTime: '4:30 PM EST',
      description: 'Slow-cooked tagine with preserved lemons and olives'
    },
    {
      id: '5',
      hostName: 'Elena Volkov',
      dishName: 'Russian Borscht',
      culture: 'Russian',
      scheduledTime: '6:00 PM EST',
      description: 'Traditional beetroot soup with sour cream and fresh dill'
    },
    {
      id: '6',
      hostName: 'Carlos Mendoza',
      dishName: 'Peruvian Ceviche',
      culture: 'Peruvian',
      scheduledTime: '7:30 PM EST',
      description: 'Fresh fish cured in lime juice with red onions and aji peppers'
    }
  ]);
  
  // Report function - now logs to database for admin dashboard
  const handleReport = async (sessionId?: string, reason?: string) => {
    if (!user) {
      alert('Please log in to report sessions.');
      return;
    }

    const reportReason = reason || prompt('Please describe the issue (optional):') || 'General report';
    
    if (confirm('Report this session to an administrator?')) {
      try {
        // Log report to database for admin dashboard
        const { error } = await supabase
          .from('session_reports')
          .insert({
            session_id: sessionId || currentLiveSession?.id || 'unknown',
            reported_by: user.id,
            reason: reportReason,
            timestamp: new Date().toISOString(),
            status: 'pending'
          });

        if (error) {
          console.error('Error logging report:', error);
          alert('Failed to submit report. Please try again.');
        } else {
          // Log the report activity for admin dashboard
          logUserActivity('session_reported', { 
            session_id: sessionId || currentLiveSession?.id, 
            reason: reportReason 
          });
          alert('Thank you for your report. An administrator will review this session.');
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report. Please try again.');
      }
    }
  };

  const handlePost = () => {
    if (newPost.trim()) {
      const newPostObj = {
        id: Date.now().toString(),
        author: 'You',
        avatar: '👨‍🍳',
        timestamp: 'now',
        content: newPost,
        type: 'live' as const,
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

  const handleScheduleSession = async () => {
    if (!user) {
      alert('Please log in to schedule sessions.');
      return;
    }

    if (scheduledDishName.trim() && scheduledCuisine && scheduledDescription.trim() && scheduledDate && scheduledTime) {
      try {
        // Save to proper scheduled_sessions table for admin dashboard reporting
        const { data, error } = await supabase
          .from('scheduled_sessions')
          .insert({
            user_id: user.id,
            dish_name: scheduledDishName,
            cuisine: scheduledCuisine,
            description: scheduledDescription,
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            session_type: scheduledSessionType,
            teacher_tag: scheduledTeacher || null
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving session:', error);
          alert(`Failed to schedule session: ${error.message}. Please try again.`);
          return;
        }

        console.log('Session saved successfully to database:', data);
        
        // Log the scheduling activity for admin dashboard
        logUserActivity('session_scheduled', {
          dish_name: scheduledDishName,
          cuisine: scheduledCuisine,
          session_type: scheduledSessionType,
          scheduled_date: scheduledDate
        });
        
        // Add to local state for immediate UI update
        const newSession: UpcomingSession = {
          id: data.id,
          hostName: 'You',
          dishName: scheduledDishName,
          culture: scheduledCuisine,
          scheduledTime: `${scheduledDate} at ${scheduledTime}`,
          description: scheduledDescription,
          sessionType: scheduledSessionType,
          teacherTag: scheduledTeacher || undefined
        };
        
        setUpcomingSessions(prev => [newSession, ...prev]);
        
        // Clear form
        setScheduledDishName('');
        setScheduledCuisine('');
        setScheduledDescription('');
        setScheduledDate('');
        setScheduledTime('');
        setScheduledSessionType('practice');
        setScheduledTeacher('');
        setScheduleModalOpen(false);
        
        // Switch to upcoming tab to show the new session
        setActiveTab('upcoming');
        
      } catch (error) {
        console.error('Error scheduling session:', error);
        alert('Failed to schedule session. Please try again.');
      }
    }
  };

  const joinLiveSession = (session: LiveSession) => {
    setCurrentLiveSession(session);
    setIsViewer(true);
    setIsHost(false);
    setLiveSessionModalOpen(true);
    // Simulate viewer count for the session
    setViewerCount(session.viewers);
  };

  const startHostSession = () => {
    // When user starts their own session (Go Live Now)
    setIsHost(true);
    setIsViewer(false);
    setCurrentLiveSession(null);
  };

  const endHostSession = () => {
    if (currentLiveSession && isHost) {
      // Update the session to ended in the live sessions list
      setLiveSessions(prev => prev.map(session => 
        session.id === currentLiveSession.id 
          ? { ...session, isLive: false, isEnded: true }
          : session
      ));
    }
    
    // Reset states
    setIsHost(false);
    setIsViewer(false);
    setCurrentLiveSession(null);
    setIsRecording(false);
    setViewerCount(0);
  };
  
  // Load user's scheduled sessions on component mount
  useEffect(() => {
    const loadScheduledSessions = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('scheduled_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('scheduled_date', { ascending: true });

        if (error) {
          console.error('Error loading scheduled sessions:', error);
          return;
        }

        if (!data) return;
        
        // Convert database format to component format
        const sessions: UpcomingSession[] = data.map((session: any) => ({
          id: session.id,
          hostName: 'You',
          dishName: session.dish_name,
          culture: session.cuisine,
          scheduledTime: `${session.scheduled_date} at ${session.scheduled_time}`,
          description: session.description,
          sessionType: session.session_type,
          teacherTag: session.teacher || undefined
        }));

        setUpcomingSessions(sessions);
      } catch (error) {
        console.error('Error loading scheduled sessions:', error);
      }
    };

    loadScheduledSessions();
  }, [user]);

  // Simplified viewer count (no intervals to improve performance)
  useEffect(() => {
    if (isRecording) {
      setViewerCount(Math.floor(Math.random() * 30) + 15); // Start with 15-45 viewers
    } else {
      setViewerCount(0);
    }
  }, [isRecording]);

  // Update video element when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting video stream');
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      };
    }
  }, [stream]);

  // Recording functions with camera access
  const startRecording = async () => {
    try {
      // Get camera and microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setStream(mediaStream);
      
      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
      
      // Set up MediaRecorder for video recording
      console.log('Setting up MediaRecorder...');
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('MediaRecorder stopped. Total chunks:', chunks.length);
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('Created blob:', blob.size, 'bytes');
        setRecordedBlob(blob);
      };
      
      recorder.start(1000); // Record in 1-second chunks
      setMediaRecorder(recorder);
      console.log('MediaRecorder started');
      
      setIsRecording(true);
      setViewerCount(Math.floor(Math.random() * 30) + 15);
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    // Stop MediaRecorder if it exists
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    // Show save confirmation modal
    setSaveConfirmModalOpen(true);
  };

  const handleSaveSession = async () => {
    console.log('Save session called. Blob:', recordedBlob);
    if (!recordedBlob) {
      alert('No recording found to save.');
      setSaveConfirmModalOpen(false);
      endRecordingSession();
      return;
    }
    
    if (recordedBlob.size === 0) {
      alert('Recording is empty. Please try recording again.');
      setSaveConfirmModalOpen(false);
      endRecordingSession();
      return;
    }

    if (!videoTitle.trim()) {
      alert('Please enter a title for your video.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${videoTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.webm`;
      
      console.log('Attempting to upload:', filename, 'Size:', recordedBlob.size);
      
      // First, let's list available buckets to debug
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets, 'Error:', bucketsError);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('test-kitchen-videos')
        .upload(filename, recordedBlob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        alert(`Failed to save video: ${error.message || 'Unknown error'}. Please try again.`);
        setIsSaving(false);
        return;
      }

      console.log('Video saved successfully:', data);
      
      // Show branded success modal instead of alert
      setSavedVideoTitle(videoTitle);
      setSuccessModalOpen(true);
      
      // Clear form data
      setVideoTitle('');
      setVideoDescription('');
      setVideoCuisine('');
      
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video. Please try again.');
    } finally {
      setIsSaving(false);
      setSaveConfirmModalOpen(false);
      endRecordingSession();
    }
  };

  const handleDontSave = () => {
    setSaveConfirmModalOpen(false);
    endRecordingSession();
  };

  const endRecordingSession = () => {
    // Stop camera/microphone
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsRecording(false);
    setViewerCount(0);
    setRecordedBlob(null);
    setMediaRecorder(null);
    
    // Clear video metadata
    setVideoTitle('');
    setVideoDescription('');
    setVideoCuisine('');
  };

  const handleEndSession = () => {
    // Reset states
    setIsHost(false);
    setIsViewer(false);
    setCurrentLiveSession(null);
    setIsRecording(false);
    setViewerCount(0);
    setRecordedBlob(null);
    setMediaRecorder(null);
    setSaveConfirmModalOpen(false);
  };

  const saveVideoToSupabase = async () => {
    if (!recordedBlob) {
      alert('No recording found to save.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `test-kitchen-session-${timestamp}.webm`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('Test Kitchen Videos')
        .upload(filename, recordedBlob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        alert('Failed to save video. Please try again.');
        return;
      }

      console.log('Video saved successfully:', data);
      alert('Video saved successfully to Test Kitchen Videos!');
      
      // End the session after successful save
      handleEndSession();
      
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar functions
  const addToCalendar = (session: UpcomingSession) => {
    // Parse "YYYY-MM-DD at HH:MM" format
    const [datePart, timePart] = session.scheduledTime.split(' at ');
    const startDate = new Date(`${datePart}T${timePart}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${session.dishName} - Cooking Session`);
    const description = encodeURIComponent(`Join ${session.hostName} for a live cooking demonstration: ${session.description}`);
    const location = encodeURIComponent('Global Test Kitchen - Online');

    // Detect device/platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMac = /Mac/.test(navigator.userAgent);

    if (isIOS) {
      // iOS Calendar
      const iosUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.href}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
      window.open(iosUrl);
    } else if (isAndroid) {
      // Google Calendar (works on Android)
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${description}&location=${location}`;
      window.open(googleUrl, '_blank');
    } else {
      // Desktop - show options
      showCalendarOptions(session);
    }
  };

  const showCalendarOptions = (session: UpcomingSession) => {
    // Parse "YYYY-MM-DD at HH:MM" format
    const [datePart, timePart] = session.scheduledTime.split(' at ');
    const startDate = new Date(`${datePart}T${timePart}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${session.dishName} - Cooking Session`);
    const description = encodeURIComponent(`Join ${session.hostName} for a live cooking demonstration: ${session.description}`);
    const location = encodeURIComponent('Global Test Kitchen - Online');

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${description}&location=${location}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${formatDate(startDate)}&enddt=${formatDate(endDate)}&body=${description}&location=${location}`;
    
    // Create a simple modal with options
    const options = `
      Choose your calendar app:
      
      Google Calendar: ${googleUrl}
      Outlook: ${outlookUrl}
      
      Or copy this info:
      Title: ${decodeURIComponent(title)}
      Date: ${startDate.toLocaleString()}
      Duration: 1 hour
    `;
    
    if (confirm('Open Google Calendar?')) {
      window.open(googleUrl, '_blank');
    } else {
      window.open(outlookUrl, '_blank');
    }
  };

  // Removed cleanup useEffect to improve performance

  const [posts, setPosts] = useState<TimelinePost[]>([
    {
      id: '1',
      author: 'Sofia Rodriguez',
      avatar: '👩🏽‍🍳',
      timestamp: '2m',
      content: 'Just finished making my abuela\'s mole recipe! The secret is toasting the chiles until they\'re fragrant but not burnt. 🌶️✨',
      image: '🍛',
      type: 'recipe',
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
      content: 'Found the most incredible black garlic at Portland Farmers Market! Perfect for my Korean-fusion experiments 🧄',
      type: 'ingredient',
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
      content: 'Going LIVE in 30 minutes! Teaching how to make proper Nigerian jollof rice. Come through and let\'s settle this debate once and for all! 🍚🔥',
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
      content: 'My nonna always said "La pasta deve ballare" - the pasta must dance in the water. Finally understand what she meant after today\'s class! 💃🍝',
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
      content: 'SUCCESS! Finally nailed the perfect dosa after 47 attempts 😅 The batter fermentation was the key. Persistence pays off!',
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
      content: 'PSA: Eastern Market has fresh za\'atar and sumac! Owner said they get shipments from Lebanon every Tuesday 🌿',
      type: 'market',
      likes: 19,
      comments: 5,
      isLiked: true,
      tags: ['Zaatar', 'Sumac', 'EasternMarket']
    }
  ]);



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
      case 'recipe': return '👨‍🍳';
      case 'ingredient': return '🛒';
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
      case 'ingredient': return 'border-l-blue-500';
      case 'market': return 'border-l-purple-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full min-h-[800px]">
      <div className="p-4 bg-red-500 text-white font-retro text-center">
        <h2 className="text-xl flex items-center justify-center">
          <span className="text-2xl mr-2">🌍</span>
          Global Test Kitchen
        </h2>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-gray-600 text-center mb-4">
          Share your heritage dishes and learn from fellow students worldwide
        </p>

        {/* Tab Navigation */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'live'
                ? 'bg-white text-maineBlue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔴 Live
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-white text-maineBlue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Upcoming
          </button>
          <button
            onClick={() => setActiveTab('host')}
            className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'host'
                ? 'bg-white text-maineBlue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎥 Host
          </button>
        </div>

      {/* Live Sessions Tab */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {liveSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <VideoCameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No live sessions right now</p>
              <p className="text-sm">Check back later or host your own!</p>
            </div>
          ) : (
            liveSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{session.thumbnail}</span>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{session.dishName}</h3>
                      <p className="text-xs text-gray-600">by {session.hostName}</p>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs ${session.isEnded ? 'text-gray-500' : 'text-red-600'}`}>
                    {session.isEnded ? (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                        ENDED
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                        LIVE
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mb-2">{session.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">🌍 {session.culture}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      {session.viewers} watching
                    </div>
                    <button
                      onClick={() => !session.isEnded && joinLiveSession(session)}
                      className={`text-white text-xs px-3 py-1 rounded-full transition-colors ${
                        session.isEnded 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : session.isLive 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-green-500 hover:bg-green-600'
                      }`}
                      disabled={session.isEnded}
                    >
                      {session.isEnded ? 'Ended' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upcoming Sessions Tab */}
      {activeTab === 'upcoming' && (
        <div className="space-y-3">
          {upcomingSessions.map((session) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{session.dishName}</h3>
                  <p className="text-xs text-gray-600">by {session.hostName}</p>
                </div>
                <span className="text-xs text-maineBlue font-medium">{session.scheduledTime}</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">{session.description}</p>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">🌍 {session.culture}</span>
                  {session.sessionType && (
                    <span className="text-xs bg-maineBlue text-white px-2 py-0.5 rounded-full">
                      {session.sessionType === 'practice' && '🎯 Practice'}
                      {session.sessionType === 'assignment' && '📚 Assignment'}
                      {session.sessionType === 'demo' && '👨‍🏫 Demo'}
                      {session.sessionType === 'showcase' && '🏆 Showcase'}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => addToCalendar(session)}
                  className="text-xs text-maineBlue hover:underline flex items-center"
                >
                  📅 Add to Calendar
                </button>
              </div>
              {session.teacherTag && (
                <div className="text-xs text-gray-600 mb-1">
                  👨‍🏫 For: {session.teacherTag}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Host Your Own Tab */}
      {activeTab === 'host' && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <VideoCameraIcon className="h-12 w-12 mx-auto mb-3 text-maineBlue" />
            <h3 className="font-semibold text-gray-900 mb-2">Share Your Heritage Dish</h3>
            <p className="text-sm text-gray-600 mb-4">
              Teach others a recipe from your culture and build your culinary leadership skills
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => {
                startHostSession();
                setGoLiveModalOpen(true);
              }}
              className="w-full bg-maineBlue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔴 Go Live Now
            </button>
            <button 
              onClick={() => setScheduleModalOpen(true)}
              className="w-full border border-maineBlue text-maineBlue py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              📅 Schedule Session
            </button>
          </div>

          <div className="bg-sand p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">💡 Tips for Success:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Share the story behind your dish</li>
              <li>• Highlight unique ingredients and where to find them</li>
              <li>• Engage with viewers and answer questions</li>
              <li>• Practice your recipe beforehand</li>
            </ul>
          </div>
        </div>
      )}

      </div>

      {/* Go Live Modal */}
      {goLiveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setGoLiveModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
              🔴 Go Live Now
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What are you cooking today?
                </label>
                <input
                  type="text"
                  placeholder="e.g., Grandma's Pasta Recipe"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Origin
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue">
                  <option>Select</option>
                  <option>Italian</option>
                  <option>Mexican</option>
                  <option>Thai</option>
                  <option>French</option>
                  <option>Indian</option>
                  <option>Japanese</option>
                  <option>Chinese</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Description
                </label>
                <textarea
                  placeholder="Tell everyone what makes this dish special..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setGoLiveModalOpen(false)}
                  className="flex-1 bg-seafoam text-maineBlue py-2 px-4 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setGoLiveModalOpen(false);
                    setLiveSessionModalOpen(true);
                  }}
                  className="flex-1 bg-lobsterRed text-weatheredWhite py-2 px-4 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black"
                >
                  🔴 Start Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      {recordingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-2xl w-full relative">
            <button
              onClick={() => setRecordingModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
              🎥 Live Recording Session
            </h2>
            
            <div className="space-y-4">
              {/* Video Preview Area */}
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                <div className="text-white text-center">
                  <VideoCameraIcon className="h-16 w-16 mx-auto mb-2" />
                  <p>Camera preview will appear here</p>
                </div>
              </div>
              
              {/* Recording Controls */}
              <div className="flex justify-center space-x-4">
                <button className="bg-maineBlue text-white px-4 py-2 rounded-lg">
                  📹 Start Camera
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg">
                  🔴 Go Live
                </button>
                <button className="bg-gray-500 text-white px-4 py-2 rounded-lg">
                  ⏹️ Stop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Session Modal */}
      {liveSessionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-3 sm:p-4 w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] overflow-y-auto relative flex flex-col lg:flex-row gap-2 sm:gap-4">
            <button
              onClick={() => setLiveSessionModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            
            {/* Left Side - Video */}
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2 text-center text-maineBlue">
                {isViewer && currentLiveSession ? 
                  `🔴 LIVE: ${currentLiveSession.dishName}` : 
                  '🔴 LIVE: Cooking Session'
                }
              </h2>
              {isViewer && currentLiveSession && (
                <p className="text-center text-xs text-gray-600 mb-2">
                  Hosted by {currentLiveSession.hostName} • {currentLiveSession.culture} Cuisine
                </p>
              )}
              {/* Live Video Area */}
              <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
                {stream ? (
                  // Show camera feed when streaming
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadStart={() => console.log('Video load start')}
                    onCanPlay={() => console.log('Video can play')}
                    onPlay={() => console.log('Video playing')}
                    onError={(e) => console.error('Video error:', e)}
                  />
                ) : (
                  // Show placeholder when not streaming
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">👨‍🍳</div>
                    <p className="text-sm">Live Cooking Session</p>
                    <p className="text-xs opacity-75">{isRecording ? 'You are live!' : 'Click Go Live to start'}</p>
                  </div>
                )}
                
                {/* Live Indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                    LIVE
                  </div>
                )}
                
                {/* Viewer Count */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                  👥 {isRecording ? `${viewerCount} viewers` : 'Not live'}
                </div>
              </div>

              {/* Simple Controls */}
              <div className="flex justify-center space-x-2 mt-2 mb-12">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    className="bg-lobsterRed text-weatheredWhite px-4 py-1 text-sm rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black"
                  >
                    🔴 Go Live
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="bg-red-500 text-white px-4 py-1 text-sm rounded-lg"
                  >
                    ⏹️ End Live
                  </button>
                )}
              </div>
              
              {/* Recording Notice */}
              <div className="text-center text-xs text-gray-600 mt-4">
                📹 This session is being recorded
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

      {/* Schedule Session Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
              📅 Schedule Live Session
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dish Name
                </label>
                <input
                  type="text"
                  value={scheduledDishName}
                  onChange={(e) => setScheduledDishName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  placeholder="e.g., Grandma's Pasta Recipe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Origin
                </label>
                <select 
                  value={scheduledCuisine}
                  onChange={(e) => setScheduledCuisine(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                >
                  <option value="">Select</option>
                  <option value="Italian">Italian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Thai">Thai</option>
                  <option value="French">French</option>
                  <option value="Indian">Indian</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={scheduledDescription}
                  onChange={(e) => setScheduledDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  rows={3}
                  placeholder="Tell us about your dish and what makes it special..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type
                  </label>
                  <select 
                    value={scheduledSessionType}
                    onChange={(e) => setScheduledSessionType(e.target.value as 'practice' | 'assignment' | 'demo' | 'showcase')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  >
                    <option value="practice">🎯 Practice</option>
                    <option value="assignment">📚 Assignment</option>
                    <option value="demo">👨‍🏫 Demo</option>
                    <option value="showcase">🏆 Showcase</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher (Optional)
                  </label>
                  <input
                    type="text"
                    value={scheduledTeacher}
                    onChange={(e) => setScheduledTeacher(e.target.value)}
                    placeholder="e.g., Chef Martinez"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 bg-seafoam text-maineBlue py-2 px-4 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleSession}
                  disabled={!scheduledDishName.trim() || !scheduledCuisine || !scheduledDescription.trim() || !scheduledDate || !scheduledTime}
                  className="flex-1 bg-lobsterRed text-weatheredWhite py-2 px-4 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📅 Schedule Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {saveConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-lg w-full mx-4 relative">
            <div className="text-center">
              <div className="text-4xl mb-4">🎥</div>
              <h2 className="text-2xl font-bold mb-4 text-maineBlue font-retro">
                Save Your Cooking Session
              </h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Add details to save this video to your <span className="font-semibold text-maineBlue">Test Kitchen Videos</span> collection:
              </p>
              
              {/* Video Metadata Form */}
              <div className="space-y-4 mb-6 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g., Perfect Pasta Technique Demo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    disabled={isSaving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Type
                  </label>
                  <select 
                    value={videoCuisine}
                    onChange={(e) => setVideoCuisine(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    disabled={isSaving}
                  >
                    <option value="">Select cuisine type</option>
                    <option value="Italian">Italian</option>
                    <option value="French">French</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Asian">Asian</option>
                    <option value="American">American</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Indian">Indian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Brief description of what you cooked and any key techniques..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    disabled={isSaving}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDontSave}
                  disabled={isSaving}
                  className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-600 transition-colors border-2 border-gray-600 disabled:opacity-50"
                >
                  🚫 No, Don't Save
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={isSaving || !videoTitle.trim()}
                  className="flex-1 bg-lobsterRed text-weatheredWhite py-3 px-4 rounded-lg font-bold hover:bg-red-600 transition-colors border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    '💾 Save Video'
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                💡 * Required field. Saved videos can be shared with students and used for future reference
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-500 p-6 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4 text-green-600 font-retro">
                Video Saved Successfully!
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold mb-2">
                  "🎥 {savedVideoTitle}"
                </p>
                <p className="text-green-700 text-sm">
                  Your cooking session has been saved to <span className="font-bold">Test Kitchen Videos</span> and is ready to share with students!
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSuccessModalOpen(false);
                    setSavedVideoTitle('');
                  }}
                  className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-600 transition-colors border-2 border-green-600"
                >
                  👍 Awesome!
                </button>
                
                <p className="text-xs text-gray-500">
                  📚 Your video is now available in the Test Kitchen Videos collection
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GlobalTestKitchen;
