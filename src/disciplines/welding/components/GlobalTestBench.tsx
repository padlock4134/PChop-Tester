import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayIcon, VideoCameraIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { supabase } from '../api/supabaseClient';
import { useSupabase } from './SupabaseProvider';
// Removed RecordRTC import to improve performance

interface LiveSession {
  id: string;
  hostName: string;
  sessionName: string;
  focusArea: string;
  viewers: number;
  isLive: boolean;
  isEnded?: boolean;
  thumbnail: string;
  description: string;
  materials: string[];
  sessionType?: 'practice' | 'assignment' | 'demo' | 'showcase';
  teacherTag?: string;
}

interface UpcomingSession {
  id: string;
  hostName: string;
  sessionName: string;
  focusArea: string;
  scheduledTime: string;
  description: string;
  sessionType?: 'practice' | 'assignment' | 'demo' | 'showcase';
  teacherTag?: string;
}

interface GlobalTestBenchProps {
  showcaseProject?: any;
}

const GlobalTestBench: React.FC<GlobalTestBenchProps> = ({ showcaseProject }) => {
  const { t } = useTranslation();
  const { user } = useSupabase();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'host'>('live');

  // User activity tracking for admin dashboard
  const logUserActivity = async (action: string, metadata?: any) => {
    if (!user) return;
    
    try {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        action,
        component: 'global_test_bench',
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  };
  const [goLiveModalOpen, setGoLiveModalOpen] = useState(false);
  const [recordingModalOpen, setRecordingModalOpen] = useState(false);
  
  // Project Assistant state
  const [projectAssistantOpen, setProjectAssistantOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [liveSessionModalOpen, setLiveSessionModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [savedVideoTitle, setSavedVideoTitle] = useState('');
  
  
  // Recording states (simplified)
  const [isRecording, setIsRecording] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Video metadata for saving
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoFocusArea, setVideoFocusArea] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Schedule form states
  const [scheduledSessionName, setScheduledSessionName] = useState('');
  const [scheduledFocusArea, setScheduledFocusArea] = useState('');
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
      sessionName: 'Site Layout Calibration',
      focusArea: 'Spanish',
      viewers: 47,
      isLive: false,
      isEnded: true,
      thumbnail: '🧰',
      description: 'Fixture alignment and setup checklist for repeatable weld prep',
      materials: ['Fixture clamps', 'Layout square', 'Scribe', 'Feeler gauges', 'Weld map']
    },
    {
      id: '2',
      hostName: 'Kenji Nakamura',
      sessionName: 'Precision Assembly Practice',
      focusArea: 'Japanese',
      viewers: 23,
      isLive: true,
      thumbnail: '⚙️',
      description: 'Dialing in feed speed, voltage, and travel angle for clean beads',
      materials: ['MIG machine', 'ER70S-6 wire', 'Shielding gas', 'Practice coupons']
    },
    {
      id: '3',
      hostName: 'Fatima Al-Zahra',
      sessionName: 'System Fit Verification',
      focusArea: 'Lebanese',
      viewers: 35,
      isLive: true,
      thumbnail: '🔥',
      description: 'Fit-up verification sequence to reduce distortion and rework',
      materials: ['Tape measure', 'Level', 'Welding magnets', 'Tack plan']
    },
    {
      id: '4',
      hostName: 'Jean-Luc Dubois',
      sessionName: 'Blueprint Readthrough Drill',
      focusArea: 'French',
      viewers: 62,
      isLive: true,
      thumbnail: '📐',
      description: 'Reading symbols, weld callouts, and tolerances before striking an arc',
      materials: ['Blueprint set', 'Weld symbol chart', 'Inspection notes']
    }
  ]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([
    {
      id: '3',
      hostName: 'Priya Sharma',
      sessionName: 'Workflow Timing Challenge',
      focusArea: 'Indian',
      scheduledTime: '2:00 PM EST',
      description: 'Cycle-time drill for fitting, tacking, and final pass sequencing'
    },
    {
      id: '4',
      hostName: 'Ahmed Hassan',
      sessionName: 'Quality Control Walkthrough',
      focusArea: 'Moroccan',
      scheduledTime: '4:30 PM EST',
      description: 'Advanced troubleshooting walkthrough for a real-world field issue'
    },
    {
      id: '5',
      hostName: 'Elena Volkov',
      sessionName: 'Safety Compliance Drill',
      focusArea: 'Russian',
      scheduledTime: '6:00 PM EST',
      description: 'PPE checks and hazard walkthrough for high-heat fabrication bays'
    },
    {
      id: '6',
      hostName: 'Carlos Mendoza',
      sessionName: 'Final Inspection Run',
      focusArea: 'Peruvian',
      scheduledTime: '7:30 PM EST',
      description: 'Final QA pass using visual criteria and acceptance standards'
    }
  ]);
  
  // Report function - now logs to database for admin dashboard
  const handleReport = async (sessionId?: string, reason?: string) => {
    if (!user) {
      alert(t('machinistCorner.globalTestKitchen.pleaseLogInReport'));
      return;
    }

    const reportReason = reason || prompt(t('machinistCorner.globalTestKitchen.describeIssue')) || 'General report';
    
    if (confirm(t('machinistCorner.globalTestKitchen.reportSession'))) {
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
          alert(t('machinistCorner.globalTestKitchen.failedToReport'));
        } else {
          // Log the report activity for admin dashboard
          logUserActivity('session_reported', { 
            session_id: sessionId || currentLiveSession?.id, 
            reason: reportReason 
          });
          alert(t('machinistCorner.globalTestKitchen.thankYouReport'));
        }
      } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report. Please try again.');
      }
    }
  };

  const handleScheduleSession = async () => {
    if (!user) {
      alert(t('machinistCorner.globalTestKitchen.pleaseLogInSchedule'));
      return;
    }

    if (scheduledSessionName.trim() && scheduledFocusArea && scheduledDescription.trim() && scheduledDate && scheduledTime) {
      try {
        // Save to proper schedule_sessions table for admin dashboard reporting
        const { data, error } = await supabase
          .from('schedule_sessions')
          .insert({
            user_id: user.id,
            dish_name: scheduledSessionName,
            cuisine: scheduledFocusArea,
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
          alert(t('machinistCorner.globalTestKitchen.failedToSchedule').replace('{error}', error.message));
          return;
        }

        console.log('Session saved successfully to database:', data);
        
        // Log the scheduling activity for admin dashboard
        logUserActivity('session_scheduled', {
          dish_name: scheduledSessionName,
          cuisine: scheduledFocusArea,
          session_type: scheduledSessionType,
          scheduled_date: scheduledDate
        });
        
        // Add to local state for immediate UI update
        const newSession: UpcomingSession = {
          id: data.id,
          hostName: t('machinistCorner.globalTestKitchen.you'),
          sessionName: scheduledSessionName,
          focusArea: scheduledFocusArea,
          scheduledTime: `${scheduledDate} at ${scheduledTime}`,
          description: scheduledDescription,
          sessionType: scheduledSessionType,
          teacherTag: scheduledTeacher || undefined
        };
        
        setUpcomingSessions(prev => [newSession, ...prev]);
        
        // Clear form
        setScheduledSessionName('');
        setScheduledFocusArea('');
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
        alert(t('machinistCorner.globalTestKitchen.failedToScheduleGeneric'));
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
          .from('schedule_sessions')
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
          hostName: t('machinistCorner.globalTestKitchen.you'),
          sessionName: session.dish_name,
          focusArea: session.cuisine,
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
      // Generate unique filename with user folder
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${user?.id}/${videoTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.webm`;
      
      console.log('Attempting to upload:', filename, 'Size:', recordedBlob.size, 'Public:', isPublic);
      
      // Upload to Supabase Storage with metadata
      const { data, error} = await supabase.storage
        .from('Practice Videos')
        .upload(filename, recordedBlob, {
          contentType: 'video/webm',
          upsert: false,
          metadata: {
            title: videoTitle,
            description: videoDescription,
            cuisine: videoFocusArea,
            isPublic: isPublic.toString(),
            userId: user?.id || ''
          }
        });

      if (error) {
        console.error('Upload error details:', error);
        alert(t('machinistCorner.globalTestKitchen.failedToSaveVideo').replace('{error}', error.message || 'Unknown error'));
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
      setVideoFocusArea('');
      setIsPublic(false);
      
    } catch (error) {
      console.error('Error saving video:', error);
      alert(t('machinistCorner.globalTestKitchen.failedToSaveVideoGeneric'));
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
    setVideoFocusArea('');
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
      const filename = `practice-session-${timestamp}.webm`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('Practice Videos')
        .upload(filename, recordedBlob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        alert(t('machinistCorner.globalTestKitchen.failedToSaveVideoGeneric'));
        return;
      }

      console.log('Video saved successfully:', data);
      alert('Video saved successfully to Practice Videos!');
      
      // End the session after successful save
      handleEndSession();
      
    } catch (error) {
      console.error('Error saving video:', error);
      alert(t('machinistCorner.globalTestKitchen.failedToSaveVideoGeneric'));
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar functions
  const addToCalendar = (session: UpcomingSession) => {
    // Parse "YYYY-MM-DD at HH:MM" format
    const [datePart, timePart] = session.scheduledTime.split(' at ');
    
    if (!datePart || !timePart) {
      alert('Invalid date format. Please reschedule this session.');
      return;
    }
    
    const startDate = new Date(`${datePart}T${timePart}:00`);
    
    // Validate date
    if (isNaN(startDate.getTime())) {
      alert('Invalid date. Please check the scheduled time and try again.');
      return;
    }
    
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${session.sessionName} - Practice Session`);
    const description = encodeURIComponent(`Join ${session.hostName} for a live skills demonstration: ${session.description}`);
    const location = encodeURIComponent('Global Skill Lab - Online');

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
    
    if (!datePart || !timePart) {
      alert('Invalid date format. Please reschedule this session.');
      return;
    }
    
    const startDate = new Date(`${datePart}T${timePart}:00`);
    
    // Validate date
    if (isNaN(startDate.getTime())) {
      alert('Invalid date. Please check the scheduled time and try again.');
      return;
    }
    
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${session.sessionName} - Practice Session`);
    const description = encodeURIComponent(`Join ${session.hostName} for a live skills demonstration: ${session.description}`);
    const location = encodeURIComponent('Global Skill Lab - Online');

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

  return (
    <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full min-h-[800px]">
      <div className="p-4 bg-red-500 text-white font-retro text-center">
        <h2 className="text-xl flex items-center justify-center">
          <span className="text-2xl mr-2">🌍</span>
          {t('machinistCorner.globalTestKitchen.title', { defaultValue: 'Global Weld Lab' })}
        </h2>
      </div>
      
      <div className="p-4">
        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          <button 
            onClick={() => {
              startHostSession();
              setGoLiveModalOpen(true);
            }}
            className="w-full bg-maineBlue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔴 {t('machinistCorner.globalTestKitchen.goLiveNow', { defaultValue: 'Go Live Now' })}
          </button>
          <button 
            onClick={() => setScheduleModalOpen(true)}
            className="w-full border border-maineBlue text-maineBlue py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
          >
            📅 {t('machinistCorner.globalTestKitchen.scheduleSession', { defaultValue: 'Schedule Session' })}
          </button>
        </div>

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
            🔴 {t('machinistCorner.globalTestKitchen.live', { defaultValue: 'Live' })}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-white text-maineBlue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 {t('machinistCorner.globalTestKitchen.upcoming', { defaultValue: 'Upcoming' })}
          </button>
          <button
            onClick={() => setActiveTab('host')}
            className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'host'
                ? 'bg-white text-maineBlue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎥 {t('machinistCorner.globalTestKitchen.host', { defaultValue: 'Host' })}
          </button>
        </div>

      {/* Live Sessions Tab */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {liveSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <VideoCameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>{t('machinistCorner.globalTestKitchen.noLiveSessions', { defaultValue: 'No live weld labs right now.' })}</p>
              <p className="text-sm">{t('machinistCorner.globalTestKitchen.checkBackLater', { defaultValue: 'Check back soon for active sessions.' })}</p>
            </div>
          ) : (
            liveSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{session.thumbnail}</span>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{session.sessionName}</h3>
                      <p className="text-xs text-gray-600">{t('machinistCorner.globalTestKitchen.by')} {session.hostName}</p>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs ${session.isEnded ? 'text-gray-500' : 'text-red-600'}`}>
                    {session.isEnded ? (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                        {t('machinistCorner.globalTestKitchen.ended', { defaultValue: 'Ended' })}
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
                  <span className="text-xs text-gray-500">🌍 {session.focusArea}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      {session.viewers} {t('machinistCorner.globalTestKitchen.watching', { defaultValue: 'watching' })}
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
                      {session.isEnded ? t('machinistCorner.globalTestKitchen.ended', { defaultValue: 'Ended' }) : t('machinistCorner.globalTestKitchen.join', { defaultValue: 'Join' })}
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
                  <h3 className="font-semibold text-sm text-gray-900">{session.sessionName}</h3>
                  <p className="text-xs text-gray-600">{t('machinistCorner.globalTestKitchen.by')} {session.hostName}</p>
                </div>
                <span className="text-xs text-maineBlue font-medium">{session.scheduledTime}</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">{session.description}</p>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">🌍 {session.focusArea}</span>
                  {session.sessionType && (
                    <span className="text-xs bg-maineBlue text-white px-2 py-0.5 rounded-full">
                      {session.sessionType === 'practice' && `🎯 ${t('machinistCorner.globalTestKitchen.practice', { defaultValue: 'Practice' })}`}
                      {session.sessionType === 'assignment' && `📚 ${t('machinistCorner.globalTestKitchen.assignment', { defaultValue: 'Assignment' })}`}
                      {session.sessionType === 'demo' && `👨‍🏫 ${t('machinistCorner.globalTestKitchen.demo', { defaultValue: 'Demo' })}`}
                      {session.sessionType === 'showcase' && `🏆 ${t('machinistCorner.globalTestKitchen.showcase', { defaultValue: 'Showcase' })}`}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => addToCalendar(session)}
                  className="text-xs text-maineBlue hover:underline flex items-center"
                >
                  📅 {t('machinistCorner.globalTestKitchen.addToCalendar', { defaultValue: 'Add to calendar' })}
                </button>
              </div>
              {session.teacherTag && (
                <div className="text-xs text-gray-600 mb-1">
                  👨‍🏫 {t('machinistCorner.globalTestKitchen.for')} {session.teacherTag}
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
            <h3 className="font-semibold text-gray-900 mb-2">Host a Live Trade Session</h3>
            <p className="text-sm text-gray-600 mb-4">
              Teach a proven workflow from your trade and build your leadership skills
            </p>
          </div>
          
          <div className="bg-sand p-3 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">💡 Tips for Success:</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Share the goal behind your workflow</li>
              <li>• Highlight required tools/materials and where to source them</li>
              <li>• Engage with viewers and answer questions</li>
              <li>• Practice your workflow beforehand</li>
            </ul>
          </div>
        </div>
      )}

      </div>

      {/* Go Live Modal */}
      {goLiveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setGoLiveModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
              🔴 {t('machinistCorner.globalTestKitchen.goLiveNow', { defaultValue: 'Go Live Now' })}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What welding skill are you demonstrating today?
                </label>
                <input
                  type="text"
                  placeholder="e.g., 3G vertical-up SMAW root pass walkthrough"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Process / Focus Area
                </label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue">
                  <option>Select</option>
                  <option>SMAW (Stick)</option>
                  <option>GMAW (MIG)</option>
                  <option>GTAW (TIG)</option>
                  <option>FCAW (Flux-Cored)</option>
                  <option>Fit-Up</option>
                  <option>Blueprint Reading</option>
                  <option>Weld Inspection</option>
                  <option>Heat Control</option>
                  <option>Safety</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Scope
                </label>
                <textarea
                  placeholder="Describe joint type, material, position, settings, and key QC checkpoints learners should watch for."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setGoLiveModalOpen(false)}
                  className="w-full sm:flex-1 bg-seafoam text-maineBlue py-2 px-4 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black min-h-[44px]"
                >
                  {t('machinistCorner.globalTestKitchen.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  onClick={() => {
                    setGoLiveModalOpen(false);
                    setLiveSessionModalOpen(true);
                  }}
                  className="w-full sm:flex-1 bg-lobsterRed text-weatheredWhite py-2 px-4 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black min-h-[44px]"
                >
                  🔴 {t('machinistCorner.globalTestKitchen.startRecording')}
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
          <div className="bg-white rounded-lg shadow-lg border-4 border-black overflow-hidden w-full max-h-[85vh] sm:w-5/6 sm:h-auto sm:max-h-[90vh] lg:w-2/3 lg:max-h-[80vh] relative flex flex-col lg:flex-row">
            <button
              onClick={() => setLiveSessionModalOpen(false)}
              className="absolute top-2 right-2 text-white hover:text-white/80 text-2xl font-bold z-30 drop-shadow"
              aria-label="Close"
            >
              ×
            </button>
            
            {/* Left Side - Video */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Title above black screen */}
              <div className="p-4 bg-lobsterRed text-black font-retro text-center sticky top-0 z-20">
                <div className="flex flex-col gap-3 lg:gap-4 items-center">
                  <div className="flex flex-col items-center text-center">
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {isViewer && currentLiveSession ? 
                        `🔴 LIVE: ${currentLiveSession.sessionName}` : 
                        '🔴 LIVE: Practice Session'
                      }
                    </h2>
                    {isViewer && currentLiveSession && (
                      <p className="text-sm sm:text-base mt-1">
                        Hosted by {currentLiveSession.hostName} • {currentLiveSession.focusArea} Track
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    {isViewer ? (
                      <button 
                        onClick={() => {
                          setLiveSessionModalOpen(false);
                          setIsViewer(false);
                          setCurrentLiveSession(null);
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
                      >
                        👋 Leave Session
                      </button>
                    ) : !isRecording ? (
                      <button 
                        onClick={startRecording}
                        className="bg-white text-lobsterRed px-11 py-1.5 text-sm rounded font-bold border-2 border-lobsterRed hover:bg-seafoam hover:text-maineBlue transition-colors"
                      >
                        🔴 Go Live
                      </button>
                    ) : (
                      <button 
                        onClick={stopRecording}
                        className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-600 transition-colors"
                      >
                        ⏹️ End Live
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Scrollable practice area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex">
                {/* Live Video Area */}
                <div className="bg-black rounded-lg flex-1 w-full min-h-[400px] flex items-center justify-center relative overflow-hidden border-4 border-maineBlue mb-4">
                  {isViewer && currentLiveSession ? (
                    // Viewer mode - watching someone else's stream
                    <div className="text-white text-center">
                      <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{currentLiveSession.thumbnail}</div>
                      <p className="text-sm sm:text-lg">Watching {currentLiveSession.hostName}'s live session</p>
                      <p className="text-xs sm:text-sm opacity-75">Live video stream would appear here</p>
                    </div>
                  ) : stream ? (
                    // Host mode - showing your camera feed
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
                    // No stream - show placeholder
                    <div className="text-white text-center">
                      <div className="text-3xl sm:text-4xl mb-2">🎥</div>
                      <p className="text-xs sm:text-sm">Live Practice Session</p>
                      <p className="text-xs opacity-75">{isRecording ? 'You are live!' : 'Click Go Live to start'}</p>
                    </div>
                  )}
                  
                  {/* Live Indicator */}
                  {isRecording && (
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-red-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full flex items-center">
                      <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                      LIVE
                    </div>
                  )}
                  
                  {/* Viewer Count */}
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
                    👥 {isRecording ? `${viewerCount} viewers` : 'Not live'}
                  </div>
                </div>

                {/* Community feed removed */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-md w-full mx-4 relative max-h-[85vh] lg:max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
              📅 Schedule Live Weld Session
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title
                </label>
                <input
                  type="text"
                  value={scheduledSessionName}
                  onChange={(e) => setScheduledSessionName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  placeholder="e.g., 4G overhead weld bead control walkthrough"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weld Process / Focus Area
                </label>
                <select 
                  value={scheduledFocusArea}
                  onChange={(e) => setScheduledFocusArea(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                >
                  <option value="">Select weld focus</option>
                  <option value="SMAW">SMAW (Stick)</option>
                  <option value="GMAW">GMAW (MIG)</option>
                  <option value="GTAW">GTAW (TIG)</option>
                  <option value="FCAW">FCAW (Flux-Cored)</option>
                  <option value="FitUp">Fit-Up</option>
                  <option value="BlueprintReading">Blueprint Reading</option>
                  <option value="WeldInspection">Weld Inspection</option>
                  <option value="HeatControl">Heat Control</option>
                  <option value="Safety">Safety</option>
                  <option value="Troubleshooting">Troubleshooting</option>
                  <option value="CodeCompliance">Code Compliance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Scope
                </label>
                <textarea
                  value={scheduledDescription}
                  onChange={(e) => setScheduledDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  rows={3}
                  placeholder="Include material type/thickness, weld position, machine settings, and what QA checkpoints students should follow."
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
                    placeholder="e.g., Instructor Martinez"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="w-full sm:flex-1 bg-seafoam text-maineBlue py-2 px-4 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleSession}
                  disabled={!scheduledSessionName.trim() || !scheduledFocusArea || !scheduledDescription.trim() || !scheduledDate || !scheduledTime}
                  className="w-full sm:flex-1 bg-lobsterRed text-weatheredWhite py-2 px-4 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  📅 {t('machinistCorner.globalTestKitchen.scheduleSession', { defaultValue: 'Schedule Session' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {saveConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-lg w-full mx-4 relative max-h-[85vh] lg:max-h-[80vh] overflow-y-auto">
            <div className="text-center">
              <div className="text-4xl mb-4">🎥</div>
              <h2 className="text-2xl font-bold mb-4 text-maineBlue font-retro">
                Save Your Practice Session
              </h2>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                Add details to save this video to your <span className="font-semibold text-maineBlue">Practice Videos</span> collection:
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
                    placeholder="e.g., TIG root pass consistency demo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    disabled={isSaving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Area
                  </label>
                  <select 
                    value={videoFocusArea}
                    onChange={(e) => setVideoFocusArea(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    disabled={isSaving}
                  >
                    <option value="">Select focus area</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Safety">Safety</option>
                    <option value="Installation">Installation</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Planning">Planning</option>
                    <option value="QualityControl">Quality Control</option>
                    <option value="Troubleshooting">Troubleshooting</option>
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
                    placeholder="Brief description of what you practiced and any key techniques..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-maineBlue"
                    disabled={isSaving}
                  />
                </div>
                
                {/* Make Public Checkbox */}
                <div className="border-2 border-maineBlue rounded-lg p-4 bg-blue-50">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={isSaving}
                      className="w-5 h-5 text-maineBlue border-2 border-maineBlue rounded focus:ring-2 focus:ring-maineBlue cursor-pointer"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-bold text-maineBlue">🌍 Make this video public</span>
                      <p className="text-xs text-gray-600 mt-1">
                        Public videos can be viewed by all students in the Video Library. Private videos are only visible to you.
                      </p>
                    </div>
                  </label>
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
                  Your practice session has been saved to <span className="font-bold">Practice Videos</span> and is ready to share with students!
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
                  📚 Your video is now available in the Practice Videos collection
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GlobalTestBench;
