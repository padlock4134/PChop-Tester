import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../disciplines/culinary/api/supabaseClient';
import { useSupabase } from '../disciplines/culinary/components/SupabaseProvider';
import { askChefFreddie } from '../disciplines/culinary/api/chefFreddie';
import { DisciplineKey, DISCIPLINE_CONFIG, loadCustomDisciplines } from '../disciplineConfig';
import { getSkin, loadCustomSkins } from '../disciplineSkinConfig';
import { useAdminToggle } from '../App';
import {
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ArrowUpIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { getIntegrityAlerts, reviewIntegrityAlert, IntegrityAlert } from '../services/integrityMonitoring';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
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

// Base discipline options
const baseDisciplineOptions = [
  { key: 'total' as const, label: 'TOTAL', icon: '📊' },
  ...Object.values(DISCIPLINE_CONFIG).map(d => ({
    key: d.key as DisciplineKey,
    label: d.name,
    icon: d.key === 'culinary' ? '🍳' : d.key === 'plumbing' ? '🔩' : d.key === 'automotive' ? '🔧' : d.key === 'construction' ? '🏗️' : d.key === 'electrical' ? '⚡' : d.key === 'hvac' ? '❄️' : d.key === 'manufacturing' ? '🏭' : d.key === 'logistics' ? '📦' : d.key === 'machining' ? '⚙️' : '📋'
  }))
];

const UnifiedAdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { t: i18nT } = useTranslation();
  const t = (key: string, options?: Record<string, any>) => {
    const fallback =
      key
        .split('.')
        .pop()
        ?.replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, (c) => c.toUpperCase()) || key;

    return i18nT(key, { defaultValue: fallback, ...(options || {}) });
  };
  const navigate = useNavigate();
  const { toggleAdminMode } = useAdminToggle();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'total' | DisciplineKey>(() => {
    const stored = localStorage.getItem('adminSelectedDiscipline');
    return (stored && stored !== 'total') ? stored as DisciplineKey : 'total';
  });
  const skin = useMemo(() => getSkin(selectedDiscipline), [selectedDiscipline]);
  const [disciplineOptions, setDisciplineOptions] = useState(baseDisciplineOptions);
  
  // Load custom disciplines on mount
  useEffect(() => {
    async function fetchCustomDisciplines() {
      try {
        await Promise.all([loadCustomDisciplines(), loadCustomSkins()]);
        
        const { data } = await supabase
          .from('custom_disciplines')
          .select('slug, name, skin_config')
          .eq('is_active', true)
          .order('name');

        if (data && data.length > 0) {
          const customOptions = data.map((d) => ({
            key: d.slug as DisciplineKey,
            label: d.name,
            icon: (d.skin_config as any)?.icon || '📚',
          }));
          
          setDisciplineOptions([...baseDisciplineOptions, ...customOptions]);
        }
        
        // Read stored admin discipline and set it as selected
        const storedDiscipline = localStorage.getItem('adminSelectedDiscipline');
        console.log('Admin Dashboard - Stored discipline from localStorage:', storedDiscipline);
        if (storedDiscipline && storedDiscipline !== 'total') {
          console.log('Admin Dashboard - Setting selected discipline to:', storedDiscipline);
          setSelectedDiscipline(storedDiscipline as DisciplineKey);
        }
      } catch (error) {
        console.error('Error loading custom disciplines:', error);
      }
    }

    fetchCustomDisciplines();
  }, []);

  // Force discipline sync on mount - run immediately after custom disciplines load
  useEffect(() => {
    setTimeout(() => {
      const storedDiscipline = localStorage.getItem('adminSelectedDiscipline');
      console.log('Admin Dashboard - Mount check - Stored discipline:', storedDiscipline);
      if (storedDiscipline && storedDiscipline !== 'total') {
        console.log('Admin Dashboard - Force setting dropdown to:', storedDiscipline);
        setSelectedDiscipline(storedDiscipline as DisciplineKey);
      }
    }, 100); // Small delay to ensure component is fully mounted
  }, []);

  // Listen for discipline changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminSelectedDiscipline') {
        const newDiscipline = e.newValue;
        console.log('Admin Dashboard - Discipline changed to:', newDiscipline);
        if (newDiscipline && newDiscipline !== 'total') {
          setSelectedDiscipline(newDiscipline as DisciplineKey);
        } else {
          setSelectedDiscipline('total');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Force dropdown to match stored discipline on mount and when it changes
  useEffect(() => {
    const storedDiscipline = localStorage.getItem('adminSelectedDiscipline');
    if (storedDiscipline && storedDiscipline !== 'total') {
      console.log('Admin Dashboard - Forcing dropdown to:', storedDiscipline);
      setSelectedDiscipline(storedDiscipline as DisciplineKey);
    }
  }, []);

  // Also update when selectedDiscipline changes to ensure consistency
  useEffect(() => {
    if (selectedDiscipline && selectedDiscipline !== 'total') {
      localStorage.setItem('adminSelectedDiscipline', selectedDiscipline);
    }
  }, [selectedDiscipline]);

  // Admin-route navbar control swap:
  // Replace Weekly Challenge/Profile slots with Exit Admin Mode/WorkBench Connector
  useEffect(() => {
    const navActionContainers = document.querySelectorAll('nav.navbar .flex.items-center.space-x-2');
    const navActions = navActionContainers[navActionContainers.length - 1] as HTMLElement | undefined;
    if (!navActions) return;

    const weeklyChallengeControl = navActions.children[0] as HTMLElement | undefined;
    const profileControl = navActions.children[1] as HTMLElement | undefined;
    if (!weeklyChallengeControl || !profileControl) return;

    const originalWeeklyDisplay = weeklyChallengeControl.style.display;
    const originalProfileDisplay = profileControl.style.display;
    weeklyChallengeControl.style.display = 'none';
    profileControl.style.display = 'none';

    const exitAdminButton = document.createElement('button');
    exitAdminButton.type = 'button';
    exitAdminButton.className = 'relative flex items-center justify-center w-10 h-10 rounded-full shadow cursor-pointer transition-colors border-2 border-black bg-lobsterRed hover:bg-red-700 text-white text-lg';
    exitAdminButton.setAttribute('aria-label', 'Exit Admin Mode');
    exitAdminButton.title = 'Exit Admin Mode';
    exitAdminButton.textContent = '🚪';
    exitAdminButton.onclick = () => {
      const exitPicker = document.querySelector('select[aria-label="Exit Admin Mode Picker"]') as HTMLSelectElement | null;
      if (!exitPicker) return;

      exitPicker.focus();
      if (typeof (exitPicker as any).showPicker === 'function') {
        (exitPicker as any).showPicker();
      } else {
        exitPicker.click();
      }
    };

    const connectorButton = document.createElement('button');
    connectorButton.type = 'button';
    connectorButton.className = 'relative flex items-center justify-center w-10 h-10 rounded-full shadow cursor-pointer transition-colors border-2 border-black bg-seafoam hover:bg-teal-400 text-black text-lg';
    connectorButton.setAttribute('aria-label', 'WorkBench Connector');
    connectorButton.title = 'WorkBench Connector';
    connectorButton.textContent = '🔗';
    connectorButton.onclick = () => setShowLtiIntegrationModal(true);

    navActions.insertBefore(exitAdminButton, weeklyChallengeControl);
    navActions.insertBefore(connectorButton, profileControl);

    return () => {
      exitAdminButton.remove();
      connectorButton.remove();
      weeklyChallengeControl.style.display = originalWeeklyDisplay;
      profileControl.style.display = originalProfileDisplay;
    };
  }, [navigate]);
  
  // Mobile tab state - mimicking Student Dashboard
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'events' | 'actions'>('home');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalContent: 0,
    totalXP: 0,
    subscriptions: { active: 0, trial: 0, cancelled: 0 }
  });
  const [users, setUsers] = useState<User[]>([
    {
      id: 'mock-1',
      email: `sarah.johnson@${skin.people.emailDomain}`,
      username: 'Sarah Johnson',
      xp: 1250,
      level: 3,
      chat_count: 15,
      last_chat_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'mock-2',
      email: `marcus.chen@${skin.people.emailDomain}`,
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
  const [showLtiIntegrationModal, setShowLtiIntegrationModal] = useState(false);
  const [showLtiMappingModal, setShowLtiMappingModal] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  const [selectedLtiProvider, setSelectedLtiProvider] = useState('Canvas');
  const [ltiFieldMappings, setLtiFieldMappings] = useState<Record<string, string>>({
    internal_course_id: 'https://purl.imsglobal.org/spec/lti/claim/context.id',
    internal_user_id: 'sub',
    internal_email: 'email',
    internal_role: 'https://purl.imsglobal.org/spec/lti/claim/roles',
    internal_section: 'https://purl.imsglobal.org/spec/lti/claim/context.label'
  });
  const commonLtiClaimOptions = [
    'https://purl.imsglobal.org/spec/lti/claim/context.id',
    'https://purl.imsglobal.org/spec/lti/claim/context.label',
    'https://purl.imsglobal.org/spec/lti/claim/context.title',
    'https://purl.imsglobal.org/spec/lti/claim/roles',
    'sub',
    'email',
    'name',
    'given_name',
    'family_name',
    'lis.person_sourcedid',
    'lis.course_section_sourcedid'
  ];
  const ltiProviderSpecificOptions: Record<string, string[]> = {
    Canvas: ['custom_canvas_course_id', 'custom_canvas_user_id', 'custom_canvas_section_id'],
    Moodle: ['custom_moodle_courseid', 'custom_moodle_userid', 'custom_moodle_groupid'],
    Blackboard: ['custom_blackboard_course_pk1', 'custom_blackboard_user_pk1', 'custom_blackboard_batch_uid'],
    Other: ['custom.course_id', 'custom.user_id', 'custom.section_code']
  };
  const availableLtiClaimOptions = useMemo(() => {
    const providerOptions = ltiProviderSpecificOptions[selectedLtiProvider] || ltiProviderSpecificOptions.Other;
    return Array.from(new Set([...commonLtiClaimOptions, ...providerOptions]));
  }, [selectedLtiProvider]);
  
  // Integrity monitoring state
  const [integrityAlerts, setIntegrityAlerts] = useState<IntegrityAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [showReviewedAlerts, setShowReviewedAlerts] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<IntegrityAlert | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showChefFreddieModal, setShowChefFreddieModal] = useState(false);
  const [freddieMessages, setFreddieMessages] = useState<Array<{sender: 'freddie' | 'user', text: string, id?: string}>>([]);
  const [freddieInput, setFreddieInput] = useState('');
  const [freddieLoading, setFreddieLoading] = useState(false);
  const [recentCurriculum, setRecentCurriculum] = useState<Array<{id: string, title: string, content: string, type: string, module: string | null, applied: boolean, created_at: string}>>([]);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [curriculumToSave, setCurriculumToSave] = useState<{content: string, messageId: string} | null>(null);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Array<{email: string, name?: string, error?: string}>>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'uploading' | 'complete' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, url: string, type: string, size: number}>>([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [showMappingReviewModal, setShowMappingReviewModal] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<any>(null);
  const [moduleSelection, setModuleSelection] = useState({
    workspace: { item1: false, item2: false, item3: false, item4: false },
    notebook: { assignments: false, rubrics: false, items: false, video: false },
    school: { techniques: false, syllabus: false, lessons: false, objectives: false },
    community: { videos: false, insights: false, sessions: false, partnerships: false }
  });
  const [publishDate, setPublishDate] = useState('');
  const [publishVisibility, setPublishVisibility] = useState('All Students');
  const [publishNotification, setPublishNotification] = useState('Notify Students');
  const [generatingApiKey, setGeneratingApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<Array<{id: string, key: string, name: string, created_at: string}>>([]);
  const [showDownloadSuccessModal, setShowDownloadSuccessModal] = useState(false);
  const [downloadedReportInfo, setDownloadedReportInfo] = useState<{type: string, count: number, filename: string} | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modulePermissions, setModulePermissions] = useState<{[key: string]: {[key: string]: string}}>({
    student: {
      notebook: 'Full Access',
      school: 'Full Access',
      community: 'Read Only',
      workspace: 'Full Access',
      AdminDashboard: 'No Access'
    },
    administrator: {
      notebook: 'Full Access',
      school: 'Full Access',
      community: 'Full Access',
      workspace: 'Full Access',
      AdminDashboard: 'Full Access'
    }
  });
  const [platformConfig, setPlatformConfig] = useState({
    recipeApproval: 'auto-approve',
    assignmentApproval: 'instructor-review',
    aiContentFiltering: true,
    flagInappropriate: true,
    autoModerate: false,
    requireImageApproval: true,
    auditLogging: true,
    encryptData: true,
    allowDataExport: false,
    require2FA: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    inAppNotifications: true,
    autoBackup: 'daily',
    backupRetention: '90-days'
  });
  const [schoolBranding, setSchoolBranding] = useState({
    logoUrl: '',
    schoolName: '',
    tagline: '',
    description: '',
    primaryColor: '#1e40af',
    secondaryColor: '#059669',
    accentColor: '#dc2626',
    backgroundColor: '#f8fafc',
    phone: '',
    email: '',
    address: ''
  });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [addingFaculty, setAddingFaculty] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerStudentsHired, setPartnerStudentsHired] = useState('');
  const [partnerOpenPositions, setPartnerOpenPositions] = useState('');
  const [partnershipYear, setPartnershipYear] = useState('');
  const [addingPartner, setAddingPartner] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
  const [careerEventCohort, setCareerEventCohort] = useState('all_students');
  const [careerEventDate, setCareerEventDate] = useState('');
  const [careerEventDescription, setCareerEventDescription] = useState('');
  const [schedulingCareerEvent, setSchedulingCareerEvent] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('all');
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
  const [selectedReports, setSelectedReports] = useState<{[key: string]: boolean}>({});
  const [showEmploymentDataModal, setShowEmploymentDataModal] = useState(false);
  const [showManagePartnersModal, setShowManagePartnersModal] = useState(false);
  const [showCareerServicesModal, setShowCareerServicesModal] = useState(false);
  const [showAlumniDatabaseModal, setShowAlumniDatabaseModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentProgram, setNewStudentProgram] = useState(skin.people.defaultProgram);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [showEditFacultyModal, setShowEditFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [showEditAlumniModal, setShowEditAlumniModal] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<any | null>(null);
  const [facultyList, setFacultyList] = useState([
    {
      id: 'faculty-1',
      name: skin.people.mockFaculty[0].name,
      email: `${skin.people.mockFaculty[0].name.split(' ').pop()?.toLowerCase()}.instructor@${skin.people.emailDomain}`,
      role: skin.people.mockFaculty[0].role,
      status: 'Active',
      courses: skin.people.mockFaculty[0].courses,
      students: 42,
      lastLogin: 'Today, 9:15 AM',
      initials: skin.people.mockFaculty[0].name.split(' ').filter((_:string, i:number, a:string[]) => i === 0 || i === a.length - 1).map((w:string) => w[0]).join(''),
      color: 'bg-blue-500'
    },
    {
      id: 'faculty-2',
      name: skin.people.mockFaculty[1].name,
      email: `${skin.people.mockFaculty[1].name.split(' ').pop()?.toLowerCase()}.instructor@${skin.people.emailDomain}`,
      role: skin.people.mockFaculty[1].role,
      status: 'Active',
      courses: skin.people.mockFaculty[1].courses,
      students: 28,
      lastLogin: 'Yesterday, 4:30 PM',
      initials: skin.people.mockFaculty[1].name.split(' ').filter((_:string, i:number, a:string[]) => i === 0 || i === a.length - 1).map((w:string) => w[0]).join(''),
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
      position: skin.people.mockAlumniTitles[0],
      employer: 'Top Industry Employer, New York',
      salary: '$85,000/year',
      initials: 'MS',
      color: 'bg-blue-500'
    },
    {
      id: 'alumni-2',
      name: 'James Chen',
      email: 'james.chen@example.com',
      graduationYear: '2021',
      position: skin.people.mockAlumniTitles[1],
      employer: 'Independent Business Owner',
      salary: '$2.1M annually',
      initials: 'JC',
      color: 'bg-green-500'
    },
    {
      id: 'alumni-3',
      name: 'Ashley Rodriguez',
      email: 'ashley.rodriguez@example.com',
      graduationYear: '2023',
      position: skin.people.mockAlumniTitles[2],
      employer: 'Industry Media & Consulting',
      salary: '$120,000/year + endorsements',
      initials: 'AR',
      color: 'bg-purple-500'
    },
    {
      id: 'alumni-4',
      name: 'David Miller',
      email: 'david.miller@example.com',
      graduationYear: '2020',
      position: skin.people.mockAlumniTitles[3],
      employer: 'Corporate Services Division',
      salary: '$95,000/year + benefits',
      initials: 'DM',
      color: 'bg-orange-500'
    }
  ]);
  const [showAddAlumniModal, setShowAddAlumniModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isAlertsPaused, setIsAlertsPaused] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser } = useSupabase();

  // Helper functions for branded modals
  const showWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarningModal(true);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const showSuccess = (message: string) => {
    setDownloadedReportInfo({ type: 'success', count: 0, filename: message });
    setShowDownloadSuccessModal(true);
  };

  const handleGenerateApiKey = async ({ revealKey = true }: { revealKey?: boolean } = {}) => {
    setGeneratingApiKey(true);
    try {
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const apiKey = `pk_porkchop_${timestamp}_${randomPart}`;

      if (!currentUser?.id) {
        if (revealKey) {
          setGeneratedApiKey(apiKey);
          setShowApiKeyModal(true);
        } else {
          showSuccess(`LTI integration token auto-provisioned for ${selectedLtiProvider}.`);
        }
        return;
      }

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          api_key: apiKey,
          name: `${selectedLtiProvider} • LTI 1.3 • ${new Date().toLocaleDateString()}`,
          created_by: currentUser.id,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('API keys table may not exist:', error);
        if (revealKey) {
          setGeneratedApiKey(apiKey);
          setShowApiKeyModal(true);
        } else {
          showSuccess(`LTI integration token auto-provisioned for ${selectedLtiProvider}.`);
        }
      } else {
        setApiKeys(prev => [...prev, data]);
        if (revealKey) {
          setGeneratedApiKey(apiKey);
          setShowApiKeyModal(true);
        } else {
          showSuccess(`LTI integration token auto-provisioned for ${selectedLtiProvider}.`);
        }
      }
    } catch (error: any) {
      console.error('API key generation error:', error);
      showError('Failed to generate API key: ' + error.message);
    } finally {
      setGeneratingApiKey(false);
    }
  };

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

  // Initialize Chef Freddie with welcome message and load recent curriculum
  useEffect(() => {
    if (showChefFreddieModal && freddieMessages.length === 0) {
      setFreddieMessages([{
        sender: 'freddie',
        text: skin.assistant.greeting
      }]);
    }
    if (showChefFreddieModal && currentUser?.id) {
      loadRecentCurriculum();
    }
  }, [showChefFreddieModal, freddieMessages.length, selectedDiscipline]);

  // Load recent curriculum from database
  const loadRecentCurriculum = async () => {
    if (!currentUser?.id) return;
    
    try {
      let query = supabase
        .from('curriculum_items')
        .select('*')
        .eq('user_id', currentUser.id);
      
      // Filter by discipline if not viewing 'total'
      if (selectedDiscipline !== 'total') {
        query = query.eq('discipline', selectedDiscipline);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentCurriculum(data || []);
    } catch (error) {
      console.error('Error loading curriculum:', error);
    }
  };

  // Load integrity alerts (for ticker display)
  useEffect(() => {
    loadIntegrityAlerts();
  }, [selectedDiscipline, showReviewedAlerts]);

  const loadIntegrityAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const alerts = await getIntegrityAlerts(
        selectedDiscipline === 'total' ? undefined : selectedDiscipline,
        showReviewedAlerts ? undefined : false
      );
      setIntegrityAlerts(alerts);
    } catch (error) {
      console.error('Error loading integrity alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleReviewAlert = async (alertId: string) => {
    if (!currentUser?.id) return;
    
    try {
      await reviewIntegrityAlert(alertId, currentUser.id, reviewNotes);
      setSelectedAlert(null);
      setReviewNotes('');
      await loadIntegrityAlerts();
      showSuccess('Alert reviewed successfully');
    } catch (error) {
      showError('Failed to review alert');
    }
  };

  // Quick action handlers to pre-fill chat
  const handleQuickAction = (prompt: string) => {
    setFreddieInput(prompt);
  };

  const assistantQuickActions = [
    skin.assistant.quickActions[0] || `Create a practical ${skin.name} assignment`,
    skin.assistant.quickActions[1] || `Build a weekly ${skin.name} lesson plan`,
    skin.assistant.quickActions[2] || `Design a ${skin.name} skills rubric`,
  ];

  // Save curriculum to database
  const saveCurriculumItem = async (title: string, content: string, type: string, module: string) => {
    if (!currentUser?.id) return;
    
    setSavingCurriculum(true);
    try {
      const { data, error } = await supabase
        .from('curriculum_items')
        .insert({
          user_id: currentUser.id,
          title,
          content,
          type,
          module: module === 'none' ? null : module,
          applied: false,
          discipline: selectedDiscipline === 'total' ? null : selectedDiscipline
        })
        .select()
        .single();
      
      if (error) throw error;
      
      showSuccess(`Curriculum saved successfully to ${selectedDiscipline}!`);
      await loadRecentCurriculum();
      setShowSaveModal(false);
      setCurriculumToSave(null);
    } catch (error: any) {
      showError(`Failed to save curriculum: ${error.message}`);
    } finally {
      setSavingCurriculum(false);
    }
  };

  // Apply curriculum to module
  const applyCurriculumToModule = async (curriculumId: string, module: string) => {
    if (!currentUser?.id) return;
    
    try {
      let query = supabase
        .from('curriculum_items')
        .update({ module, applied: true })
        .eq('id', curriculumId)
        .eq('user_id', currentUser.id);
      
      // Ensure we only update within the current discipline
      if (selectedDiscipline !== 'total') {
        query = query.eq('discipline', selectedDiscipline);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      showSuccess(`Applied to ${module} successfully!`);
      await loadRecentCurriculum();
    } catch (error: any) {
      showError(`Failed to apply curriculum: ${error.message}`);
    }
  };

  // Delete curriculum item
  const deleteCurriculumItem = async (curriculumId: string) => {
    if (!currentUser?.id) return;
    
    try {
      let query = supabase
        .from('curriculum_items')
        .delete()
        .eq('id', curriculumId)
        .eq('user_id', currentUser.id);
      
      // Ensure we only delete within the current discipline
      if (selectedDiscipline !== 'total') {
        query = query.eq('discipline', selectedDiscipline);
      }
      
      const { error } = await query;
      
      if (error) throw error;
      
      showSuccess('Curriculum deleted successfully!');
      await loadRecentCurriculum();
    } catch (error: any) {
      showError(`Failed to delete curriculum: ${error.message}`);
    }
  };

  // Function to send message to Chef Freddie
  const sendFreddieMessage = async (message: string) => {
    if (!message.trim() || !currentUser?.id) return;
    
    // Add user message
    setFreddieMessages(prev => [...prev, { sender: 'user', text: message }]);
    setFreddieInput('');
    setFreddieLoading(true);
    
    try {
      // Create curriculum-focused prompt
      const curriculumPrompt = `${skin.assistant.systemPrompt} Here's the request: ${message}`;
      
      const response = await askChefFreddie(currentUser.id, curriculumPrompt);
      const messageId = `msg_${Date.now()}`;
      setFreddieMessages(prev => [...prev, { sender: 'freddie', text: response, id: messageId }]);
    } catch (error: any) {
      setFreddieMessages(prev => [...prev, { 
        sender: 'freddie', 
        text: error.message || 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setFreddieLoading(false);
    }
  };

  // Handle file upload and AI processing
  const handleFileUpload = async (files: File[]) => {
    if (!currentUser?.id) {
      showWarning('You must be logged in to upload files');
      return;
    }

    setProcessingFiles(true);

    try {
      for (const file of files) {
        // Step 1: Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `curriculum/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('admin_uploads')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          showError(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('admin_uploads')
          .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        // Step 2: Call content processor function
        const processorResponse = await fetch('/.netlify/functions/content-processor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileUrl: fileUrl,
            fileName: file.name,
            fileType: file.type
          })
        });

        if (!processorResponse.ok) {
          const errorText = await processorResponse.text();
          console.error('Processor error:', errorText);
          showError(`Failed to process ${file.name}`);
          continue;
        }

        const processorData = await processorResponse.json();

        // Step 3: Insert into content_staging table
        const { error: stagingError } = await supabase
          .from('content_staging')
          .insert({
            file_url: fileUrl,
            file_name: file.name,
            ai_suggestion: processorData.aiSuggestion,
            status: 'pending',
            uploaded_by: currentUser.id
          });

        if (stagingError) {
          console.error('Staging error:', stagingError);
          showError(`Failed to stage ${file.name}`);
          continue;
        }

        // Step 4: Show mapping review modal
        setCurrentMapping({
          fileName: file.name,
          fileUrl: fileUrl,
          aiSuggestion: processorData.aiSuggestion
        });
        setShowMappingReviewModal(true);
        setShowBrowseFilesModal(false);
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      showError(`Upload failed: ${error.message}`);
    } finally {
      setProcessingFiles(false);
    }
  };

  // Load module permissions from Supabase
  const loadModulePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*');

      if (error) {
        console.error('Error loading permissions:', error);
        return;
      }

      if (data && data.length > 0) {
        const permissions: {[key: string]: {[key: string]: string}} = {
          student: {},
          administrator: {}
        };

        data.forEach((perm: any) => {
          if (!permissions[perm.role]) permissions[perm.role] = {};
          permissions[perm.role][perm.module] = perm.access_level;
        });

        setModulePermissions(permissions);
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  // Load platform configuration from Supabase
  const loadPlatformConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_config')
        .select('config_data')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading platform config:', error);
        return;
      }

      if (data && data.config_data) {
        setPlatformConfig(data.config_data);
      }
    } catch (error) {
      console.error('Failed to load platform config:', error);
    }
  };

  // Save module permissions to Supabase
  const saveModulePermissions = async () => {
    if (!currentUser?.id) {
      showWarning('You must be logged in to save configuration');
      return;
    }

    setUpdatingPermissions(true);
    try {
      // Save module permissions
      await supabase.from('module_permissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const permissionsToInsert: any[] = [];
      
      Object.keys(modulePermissions).forEach(role => {
        Object.keys(modulePermissions[role]).forEach(module => {
          permissionsToInsert.push({
            role: role,
            module: module,
            access_level: modulePermissions[role][module]
          });
        });
      });

      const { error: permError } = await supabase
        .from('module_permissions')
        .insert(permissionsToInsert);

      if (permError) {
        console.error('Error saving permissions:', permError);
        throw new Error('Failed to save module permissions');
      }

      // Save platform configuration
      await supabase.from('platform_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: configError } = await supabase
        .from('platform_config')
        .insert({
          config_data: platformConfig,
          updated_by: currentUser.id,
          updated_at: new Date().toISOString()
        });

      if (configError) {
        console.error('Error saving platform config:', configError);
        throw new Error('Failed to save platform configuration');
      }

      // Show branded success modal
      setDownloadedReportInfo({
        type: 'Configuration Saved',
        count: 1,
        filename: 'Platform settings updated successfully'
      });
      setShowDownloadSuccessModal(true);
      setShowConfigurationModal(false);
    } catch (error: any) {
      console.error('Failed to save configuration:', error);
      showError(`Failed to save: ${error.message}`);
    } finally {
      setUpdatingPermissions(false);
    }
  };

  // Save school branding to Supabase
  const saveSchoolBranding = async () => {
    try {
      await supabase.from('school_branding').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { error } = await supabase
        .from('school_branding')
        .insert([{
          branding_data: schoolBranding,
          updated_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error saving school branding:', error);
        showError('Failed to save school branding');
        return;
      }

      // Show branded success modal
      setDownloadedReportInfo({
        type: 'School Branding Updated',
        count: 1,
        filename: `${schoolBranding.schoolName || 'Your School'} branding settings saved`
      });
      setShowDownloadSuccessModal(true);
      setShowBrandingModal(false);
    } catch (error: any) {
      console.error('Failed to save branding:', error);
      showError(`Failed to save: ${error.message}`);
    }
  };

  // Load school branding from Supabase
  const loadSchoolBranding = async () => {
    try {
      const { data, error } = await supabase
        .from('school_branding')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading school branding:', error);
      } else if (data && data.branding_data) {
        setSchoolBranding(data.branding_data);
      }
    } catch (error) {
      console.error('Failed to load school branding:', error);
    }
  };

  useEffect(() => {
    fetchAdminData();
    loadModulePermissions();
    loadPlatformConfig();
    loadSchoolBranding();

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_sessions' }, () => {
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

  // Auto-scroll effect for integrity alerts ticker
  useEffect(() => {
    const unreviewedAlerts = integrityAlerts.filter(a => !a.reviewed);
    if (unreviewedAlerts.length > 1 && !isAlertsPaused) {
      const interval = setInterval(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % unreviewedAlerts.length);
      }, 4000); // 4 second intervals

      return () => clearInterval(interval);
    }
  }, [integrityAlerts, isAlertsPaused]);

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

      // Fetch content data for currently selected discipline skin
      const { count: totalContentCount, error: contentError } = await supabase
        .from(skin.content.table)
        .select('*', { count: 'exact', head: true });

      if (contentError) throw contentError;

      const totalContent = totalContentCount || 0;

      // Calculate active users (logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = usersData?.filter(user => {
        return user.last_chat_date && new Date(user.last_chat_date) > sevenDaysAgo;
      }).length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        activeUsers,
        totalContent,
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
      
      // Show branded success modal
      setDownloadedReportInfo({
        type: 'XP Updated',
        count: 1,
        filename: `User XP set to ${newXP}`
      });
      setShowDownloadSuccessModal(true);
    } catch (error) {
      console.error('Error updating XP:', error);
      showError('Failed to update XP');
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
      
      // Show branded success modal
      setDownloadedReportInfo({
        type: 'Chat Count Reset',
        count: 1,
        filename: 'User chat count reset to 0'
      });
      setShowDownloadSuccessModal(true);
    } catch (error) {
      console.error('Error resetting chat count:', error);
      showError('Failed to reset chat count');
    }
  };

  // CSV Import Functions
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCsvFile(file);
    } else {
      showWarning('Please upload a valid CSV file');
    }
  };

  const parseCsvFile = (file: File) => {
    setImportStatus('parsing');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showWarning('CSV file must have at least a header row and one student row');
        setImportStatus('error');
        return;
      }
      
      // Parse header
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('full'));
      
      if (emailIndex === -1) {
        showWarning('CSV must have an "email" column');
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
      showError('Error reading CSV file');
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
      showWarning('No valid students to import');
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
      showError('Failed to import students. Please try again.');
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
        <div className="text-maineBlue text-xl">{t('common.loading')}</div>
      </div>
    );
  }

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
          🏫 {t('dashboard.home')}
        </button>
        <button
          onClick={() => setActiveMobileTab('actions')}
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'actions'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⚡ {t('dashboard.quickActions')}
        </button>
        <button
          onClick={() => setActiveMobileTab('events')}
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg ${
            activeMobileTab === 'events'
              ? 'bg-maineBlue text-white border-b-4 border-lobsterRed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📅 {t('admin.events')}
        </button>
      </div>
      
      {/* Main Admin Dashboard - matching student dashboard style */}
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full max-w-6xl mx-auto">
        {/* Home Tab Content */}
        <div className={`${activeMobileTab === 'home' ? 'block' : 'hidden'} lg:block`}>
          {/* Dashboard header - matching student dashboard */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-retro text-maineBlue mb-2">{t('admin.adminDashboard')}</h1>
            <p className="text-gray-600 italic">{t('admin.subtitle')}</p>
            
            {/* Discipline Filter Dropdown with Exit Admin Dropdown */}
            <div className="mt-4 flex flex-col lg:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2 w-full lg:w-auto justify-center">
                <label className="font-retro text-sm text-maineBlue">Program:</label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => {
                    const newDiscipline = e.target.value as 'total' | DisciplineKey;
                    setSelectedDiscipline(newDiscipline);
                    // Store non-total selections for next time
                    if (newDiscipline !== 'total') {
                      localStorage.setItem('adminSelectedDiscipline', newDiscipline);
                    }
                  }}
                  className="border-2 border-maineBlue rounded-lg px-4 py-2 font-retro text-sm bg-white text-maineBlue focus:ring-2 focus:ring-seafoam focus:outline-none cursor-pointer"
                >
                  {disciplineOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Exit Admin Mode Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    localStorage.setItem('adminSelectedDiscipline', e.target.value);
                    navigate(`/${e.target.value}/dashboard`);
                  }
                }}
                defaultValue=""
                aria-label="Exit Admin Mode Picker"
                className="bg-lobsterRed hover:bg-red-700 text-white px-4 py-2 rounded-lg font-retro text-sm transition-colors border-2 border-black shadow cursor-pointer w-full lg:w-auto"
              >
                <option value="" disabled>Exit Admin Mode</option>
                {disciplineOptions.filter(opt => opt.key !== 'total').map((opt) => (
                  <option key={opt.key} value={opt.key} className="bg-white text-black">
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowLtiIntegrationModal(true)}
                className="bg-maineBlue hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-retro text-sm transition-colors border-2 border-black shadow cursor-pointer w-full lg:w-auto"
              >
                🔗 WorkBench Connector
              </button>
            </div>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
          
          {/* Admin Module Navigation - matching student dashboard grid */}
          <div className="mb-4 p-3">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
            <button
              onClick={() => {
                setActiveTab('overview');
                setActiveMobileTab('actions');
              }}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'overview' 
                  ? 'border-seafoam bg-teal-50 scale-105 ring-4 ring-maineBlue' 
                  : 'border-seafoam bg-teal-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]`}
            >
              <div className="mb-3 text-4xl">🌡️</div>
              <h3 className="text-sm font-bold font-retro">{t('admin.overview')}</h3>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('users');
                setActiveMobileTab('actions');
              }}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'users' 
                  ? 'border-blue-400 bg-blue-50 scale-105 ring-4 ring-maineBlue' 
                  : 'border-blue-400 bg-blue-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]`}
            >
              <div className="mb-3 text-4xl">🎓</div>
              <h3 className="text-sm font-bold font-retro">{t('admin.users')}</h3>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('content');
                setActiveMobileTab('actions');
              }}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'content' 
                  ? 'border-red-400 bg-red-50 scale-105 ring-4 ring-maineBlue' 
                  : 'border-red-400 bg-red-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]`}
            >
              <div className="mb-3 text-4xl">📚</div>
              <h3 className="text-sm font-bold font-retro">{t('admin.curriculumContent')}</h3>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('system');
                setActiveMobileTab('actions');
              }}
              className={`flex flex-col items-center p-6 rounded-lg border-4 ${
                activeTab === 'system' 
                  ? 'border-yellow-300 bg-yellow-50 scale-105 ring-4 ring-maineBlue' 
                  : 'border-yellow-300 bg-yellow-50'
              } text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]`}
            >
              <div className="mb-3 text-4xl">🏫</div>
              <h3 className="text-sm font-bold font-retro">{t('admin.schoolSettings')}</h3>
            </button>
          </div>
          </div>
        </div>

        {/* Events Tab Content */}
        <div className={`${activeMobileTab === 'events' ? 'block' : 'hidden'} lg:block`}>
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6 lg:hidden" />

          {/* Integrity Alerts Ticker - Same design as Events */}
          {true && (
            <>
              {/* Mobile: Vertical Stacked Alerts */}
              <div className="lg:hidden mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-orange-700 text-sm">🛡️ Integrity Alerts ({integrityAlerts.filter(a => !a.reviewed).length})</span>
                  </div>
                  
                  {integrityAlerts.filter(a => !a.reviewed).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="bg-orange-50 border-4 border-orange-400 rounded-lg p-3 cursor-pointer hover:bg-orange-100 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">
                            {alert.alert_type === 'fast_completion' ? '⚡' : 
                             alert.alert_type === 'plagiarism' ? '📝' : '🚨'}
                          </span>
                          <div className="flex-1">
                            <div className="font-bold text-orange-900 text-sm">{alert.alert_type.replace('_', ' ').toUpperCase()}</div>
                            <div className="text-orange-800 text-xs">{alert.description}</div>
                            <div className="text-orange-600 text-xs mt-1">{alert.discipline || 'System'}</div>
                          </div>
                        </div>
                        <div className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
                          Review
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Horizontal Carousel */}
              <div className="hidden lg:block">
                {(() => {
                  const unreviewedAlerts = integrityAlerts.filter(a => !a.reviewed);
                  
                  if (unreviewedAlerts.length === 0) {
                    return (
                      <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center mr-3">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                            <span className="font-bold text-orange-700 text-sm">🛡️ Integrity Alerts</span>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm text-orange-800">
                              <span>No integrity alerts • All systems running smoothly</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <div className="bg-green-500 text-white text-xs px-4 py-2 rounded-full font-medium">
                              All Clear
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  const currentAlert = unreviewedAlerts[currentAlertIndex];
                  
                  return (
                    <div 
                      className="bg-orange-50 border-4 border-orange-400 rounded-lg p-3 mb-4 cursor-pointer"
                      onMouseEnter={() => setIsAlertsPaused(true)}
                      onMouseLeave={() => setIsAlertsPaused(false)}
                      onClick={() => setSelectedAlert(currentAlert)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center mr-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="font-bold text-orange-700 text-sm">🛡️ Integrity Alert</span>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-sm text-orange-800 transition-all duration-500">
                            <span>
                              <strong>{currentAlert.alert_type.replace('_', ' ').toUpperCase()}</strong> •{' '}
                              {currentAlert.description} •{' '}
                              {currentAlert.discipline || 'System'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {currentAlert.alert_type === 'fast_completion' ? '⚡' : 
                             currentAlert.alert_type === 'plagiarism' ? '📝' : '🚨'}
                          </span>
                          <div className="bg-orange-500 text-white text-xs px-4 py-2 rounded-full font-medium">
                            Review
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress dots */}
                      {unreviewedAlerts.length > 1 && (
                        <div className="flex justify-center mt-3 gap-1">
                          {unreviewedAlerts.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentAlertIndex ? 'bg-orange-500' : 'bg-orange-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* Mobile: Vertical Stacked Events List */}
          <div className="lg:hidden">
            {upcomingEvents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-blue-700 text-sm">📅 {t('admin.upcomingEvents')} ({upcomingEvents.length})</span>
                </div>
                
                {upcomingEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (event.type === 'alumni') {
                        setSelectedEventId(event.id);
                        setShowViewEventModal(true);
                      } else if (event.type === 'career') {
                        setSelectedCareerEventId(event.id);
                        setShowViewCareerEventModal(true);
                      }
                    }}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{event.emoji}</span>
                        <div className="flex-1">
                          <div className="font-bold text-blue-900 text-sm">{event.name}</div>
                          <div className="text-blue-800 text-xs">{event.date} {t('admin.at')} {event.time}</div>
                          <div className="text-blue-600 text-xs mt-1">{event.registered} {t('admin.registered')}</div>
                        </div>
                      </div>
                      <div className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
                        {t('admin.viewDetails')}
                      </div>
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Horizontal Carousel */}
          <div className="hidden lg:block">
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
                    <span className="font-bold text-blue-700 text-sm">📅 {t('admin.upcoming')}</span>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-sm text-blue-800 transition-all duration-500">
                      <span>
                        <strong>{upcomingEvents[currentEventIndex].name}</strong> •{' '}
                        {upcomingEvents[currentEventIndex].date} {t('admin.at')} {upcomingEvents[currentEventIndex].time} •{' '}
                        {upcomingEvents[currentEventIndex].registered} {t('admin.registered')}
                      </span>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{upcomingEvents[currentEventIndex].emoji}</span>
                    <div className={`bg-${upcomingEvents[currentEventIndex].color}-500 text-white text-xs px-4 py-2 rounded-full font-medium`}>
                      {t('admin.viewDetails')}
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
          </div>
        </div>

        {/* Quick Actions Tab Content */}
        <div className={`${activeMobileTab === 'actions' ? 'block' : 'hidden'} lg:block`}>
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6 lg:hidden" />
          
          {/* Content Area */}
          <div className="px-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Program Health */}
            <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">👥</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.userActivity')}</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">{t('admin.monitorEngagement')}</p>
                  <button 
                    onClick={() => setShowUserActivityModal(true)}
                    className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                  >
                    {t('admin.viewActivity')}
                  </button>
                </div>
                <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">📊</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.programPerformance')}</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">{t('admin.trackCompletion')}</p>
                  <button 
                    onClick={() => setShowProgramPerformanceModal(true)}
                    className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                  >
                    {t('admin.viewPerformance')}
                  </button>
                </div>
                <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                  <div className="mb-3 text-4xl">📈</div>
                  <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.enrollmentHealth')}</h4>
                  <p className="text-sm text-gray-600 mb-3 italic">{t('admin.monitorEnrollment')}</p>
                  <button 
                    onClick={() => setShowEnrollmentHealthModal(true)}
                    className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                  >
                    {t('admin.viewEnrollment')}
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
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.studentManagement')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.trackProgress')}</p>
                <button 
                  onClick={() => setShowStudentManagementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.manageStudents')}
                </button>
              </div>
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">👩‍🏫</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.facultyManagement')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.instructorAccess')}</p>
                <button 
                  onClick={() => setShowFacultyManagementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.manageFaculty')}
                </button>
              </div>
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">📜</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.alumniManagement')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.trackAlumniSuccess')}</p>
                <button 
                  onClick={() => setShowAlumniManagementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.manageAlumni')}
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
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.moduleIntegrationTitle')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.connectModules')}</p>
                <button 
                  onClick={() => setShowModuleIntegrationModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.manageConnections')}
                </button>
              </div>
              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🔍</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.contentAnalyticsTitle')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.monitorContent')}</p>
                <button 
                  onClick={() => setShowContentAnalyticsModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.viewAnalytics')}
                </button>
              </div>
              <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">⚙️</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.crossPlatformConfig')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.configureContent')}</p>
                <button 
                  onClick={() => setShowConfigurationModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.configureSettings')}
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
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.schoolBrandingTitle')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.customizePlatform')}</p>
                <button 
                  onClick={() => setShowBrandingModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.customizeBrandingBtn')}
                </button>
              </div>
              
              <div className="border-4 border-green-300 bg-green-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">🎯</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.jobPlacementServices')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.trackEmployment')}</p>
                <button 
                  onClick={() => setShowJobPlacementModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.managePlacements')}
                </button>
              </div>

              <div className="border-4 border-purple-300 bg-purple-50 rounded-lg p-6 text-center hover:scale-105 transition-transform duration-200">
                <div className="mb-3 text-4xl">📊</div>
                <h4 className="font-semibold text-gray-900 mb-2 font-retro">{t('admin.exportReports')}</h4>
                <p className="text-sm text-gray-600 mb-3 italic">{t('admin.generateReports')}</p>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
                >
                  {t('admin.exportData')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrity' && (
          <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">🛡️ Integrity Monitoring</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showReviewedAlerts}
                    onChange={(e) => setShowReviewedAlerts(e.target.checked)}
                    className="rounded"
                  />
                  Show Reviewed
                </label>
                <button
                  onClick={loadIntegrityAlerts}
                  className="bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro text-sm"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loadingAlerts ? (
              <div className="text-center py-8 text-gray-600">Loading alerts...</div>
            ) : integrityAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-semibold">No integrity alerts</p>
                <p className="text-sm">All systems running smoothly!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {integrityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-4 rounded-lg p-4 ${
                      alert.severity === 'high'
                        ? 'border-red-400 bg-red-50'
                        : alert.severity === 'medium'
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-yellow-400 bg-yellow-50'
                    } ${alert.reviewed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon
                          className={`h-6 w-6 ${
                            alert.severity === 'high'
                              ? 'text-red-600'
                              : alert.severity === 'medium'
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                          }`}
                        />
                        <span className="font-bold text-sm uppercase">
                          {alert.alert_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            alert.severity === 'high'
                              ? 'bg-red-600 text-white'
                              : alert.severity === 'medium'
                              ? 'bg-orange-600 text-white'
                              : 'bg-yellow-600 text-white'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>

                    <p className="text-sm text-gray-800 mb-2">{alert.description}</p>

                    <div className="text-xs text-gray-600 mb-2">
                      <strong>Discipline:</strong> {alert.discipline || 'N/A'} |{' '}
                      <strong>User ID:</strong> {alert.user_id.substring(0, 8)}...
                    </div>

                    {alert.metadata && (
                      <details className="text-xs text-gray-600 mb-2">
                        <summary className="cursor-pointer font-semibold">View Details</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </details>
                    )}

                    {alert.reviewed ? (
                      <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                        <strong>Reviewed by:</strong> {alert.reviewed_by?.substring(0, 8)}... on{' '}
                        {alert.reviewed_at ? new Date(alert.reviewed_at).toLocaleString() : 'N/A'}
                        {alert.review_notes && (
                          <div className="mt-1">
                            <strong>Notes:</strong> {alert.review_notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="bg-maineBlue text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review Alert Modal - Global, not tied to specific tab */}
        {selectedAlert && (
          <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-maineBlue mb-4">Review Alert</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Type:</strong> {selectedAlert.alert_type.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Description:</strong> {selectedAlert.description}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Review Notes:
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 text-sm"
                  rows={4}
                  placeholder="Add notes about your review..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedAlert(null);
                    setReviewNotes('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewAlert(selectedAlert.id)}
                  className="px-4 py-2 bg-maineBlue text-white rounded hover:bg-blue-700"
                >
                  Mark as Reviewed
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.exportSchoolReports')}</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">{t('admin.selectReportsToGenerate')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4 hover:bg-blue-100 cursor-pointer">
                    <input type="checkbox" id="student-progress" className="mr-2 sm:mr-3" />
                    <label htmlFor="student-progress" className="font-semibold cursor-pointer text-xs sm:text-base">📊 {t('admin.studentProgress')}</label>
                    <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6">{t('admin.skillMasteryTracking')}</p>
                  </div>
                  
                  <div className="border-4 border-green-400 bg-green-50 rounded-lg p-3 sm:p-4 hover:bg-green-100 cursor-pointer">
                    <input type="checkbox" id="class-analytics" className="mr-2 sm:mr-3" />
                    <label htmlFor="class-analytics" className="font-semibold cursor-pointer text-xs sm:text-base">👥 {t('admin.classAnalytics')}</label>
                    <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6">{t('admin.performanceMetrics')}</p>
                  </div>
                  
                  <div className="border-4 border-orange-400 bg-orange-50 rounded-lg p-3 sm:p-4 hover:bg-orange-100 cursor-pointer">
                    <input type="checkbox" id="discipline-metrics" className="mr-2 sm:mr-3" />
                    <label htmlFor="discipline-metrics" className="font-semibold cursor-pointer text-xs sm:text-base">{skin.icon} {skin.name} Metrics</label>
                    <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6">{skin.content.metricLabel} performance & analytics</p>
                  </div>
                  
                  <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-3 sm:p-4 hover:bg-purple-100 cursor-pointer">
                    <input type="checkbox" id="operations" className="mr-2 sm:mr-3" />
                    <label htmlFor="operations" className="font-semibold cursor-pointer text-xs sm:text-base">🏪 {t('admin.operations')}</label>
                    <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6">{skin.modules.workspace} management & safety</p>
                  </div>
                  
                  <div className="border-4 border-pink-400 bg-pink-50 rounded-lg p-3 sm:p-4 hover:bg-pink-100 cursor-pointer">
                    <input type="checkbox" id="engagement" className="mr-2 sm:mr-3" />
                    <label htmlFor="engagement" className="font-semibold cursor-pointer text-xs sm:text-base">📱 {t('admin.engagement')}</label>
                    <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6">{t('admin.platformUsage')}</p>
                  </div>
                  
                  <div className="border-4 border-red-400 bg-red-50 rounded-lg p-3 sm:p-4 hover:bg-red-100 cursor-pointer">
                    <input type="checkbox" id="session-reports" className="mr-2 sm:mr-3" />
                    <label htmlFor="session-reports" className="font-semibold cursor-pointer text-xs sm:text-base">🚨 {t('admin.sessionReports')}</label>
                    <p className="text-xs sm:text-sm text-gray-600 ml-5 sm:ml-6">{t('admin.flaggedContent')}</p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Reports Generated',
                        count: Object.values(selectedReports).filter(Boolean).length,
                        filename: 'Downloads will begin shortly'
                      });
                      setShowDownloadSuccessModal(true);
                      setShowExportModal(false);
                    }}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    {t('admin.generateReportsBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Placement Modal */}
      {showJobPlacementModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.jobPlacementCareerServices')}</h2>
                <button
                  onClick={() => setShowJobPlacementModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">{t('admin.trackGraduateEmployment')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  {/* Employment Tracking */}
                  <div className="border-4 border-green-400 bg-green-50 rounded-lg p-3 sm:p-6 text-center hover:scale-105 transition-transform duration-200">
                    <div className="mb-2 sm:mb-3 text-3xl sm:text-4xl">📈</div>
                    <h3 className="font-bold text-gray-900 mb-2 font-retro text-sm sm:text-base">{t('admin.employmentTracking')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{t('admin.monitorGraduateEmployment')}</p>
                    <button 
                      onClick={() => setShowEmploymentDataModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-retro w-full text-xs sm:text-base min-h-[44px]"
                    >
                      {t('admin.viewEmploymentData')}
                    </button>
                  </div>

                  {/* Industry Partnerships */}
                  <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-6 text-center hover:scale-105 transition-transform duration-200">
                    <div className="mb-2 sm:mb-3 text-3xl sm:text-4xl">🤝</div>
                    <h3 className="font-bold text-gray-900 mb-2 font-retro text-sm sm:text-base">{t('admin.industryPartnerships')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{t('admin.manageRelationships')}</p>
                    <button 
                      onClick={() => setShowManagePartnersModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro w-full text-xs sm:text-base min-h-[44px]"
                    >
                      {t('admin.managePartners')}
                    </button>
                  </div>

                  {/* Career Services */}
                  <div className="border-4 border-purple-400 bg-purple-50 rounded-lg p-3 sm:p-6 text-center hover:scale-105 transition-transform duration-200">
                    <div className="mb-2 sm:mb-3 text-3xl sm:text-4xl">💼</div>
                    <h3 className="font-bold text-gray-900 mb-2 font-retro text-sm sm:text-base">{t('admin.careerServices')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{t('admin.coordinateJobFairs')}</p>
                    <button 
                      onClick={() => setShowCareerServicesModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-retro w-full text-xs sm:text-base min-h-[44px]"
                    >
                      {t('admin.manageServices')}
                    </button>
                  </div>

                  {/* Credentialing & Certifications */}
                  <div className="border-4 border-orange-400 bg-orange-50 rounded-lg p-3 sm:p-6 text-center hover:scale-105 transition-transform duration-200">
                    <div className="mb-2 sm:mb-3 text-3xl sm:text-4xl">🏅</div>
                    <h3 className="font-bold text-gray-900 mb-2 font-retro text-sm sm:text-base">{t('admin.credentialingCertifications')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Track certifications and compliance for {skin.name} programs.</p>
                    <button 
                      onClick={() => setShowCredentialingModal(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 font-retro w-full text-xs sm:text-base min-h-[44px]"
                    >
                      {t('admin.manageCredentials')}
                    </button>
                  </div>
                </div>
                
                <div className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4">
                  <h4 className="text-center font-bold text-green-900 mb-2 text-sm sm:text-base">🎯 {t('admin.keyPlacementMetrics')}</h4>
                  <ul className="text-center text-xs sm:text-sm text-green-800 space-y-1">
                    <li>• {t('admin.graduateEmploymentRate')}</li>
                    <li>• {t('admin.averageStartingSalary')}</li>
                    <li>• {t('admin.industrySectorPlacement')}</li>
                    <li>• {t('admin.employerSatisfaction')}</li>
                    <li>• {t('admin.alumniCareerAdvancement')}</li>
                    <li>• {t('admin.internshipConversion')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* School Branding Modal */}
      {showBrandingModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.schoolBrandingIdentity')}</h2>
                <button
                  onClick={() => setShowBrandingModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">{t('admin.customizePorkChop')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* School Logo & Branding */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">🏦 {t('admin.schoolBrandingSection')}</h3>
                  <div className="flex flex-col lg:flex-row gap-3 sm:gap-6">
                    {/* Left Side - Logo Upload */}
                    <div className="flex-1">
                      <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-100 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                          {schoolBranding.logoUrl ? (
                            <img src={schoolBranding.logoUrl} alt="School Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm">{t('admin.logo')}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-center w-full max-w-xs">
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/png,image/jpeg,image/jpg"
                            className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        if (!currentUser?.id) {
                          showWarning('You must be logged in to upload a logo');
                          return;
                        }
                        
                        setUploadingLogo(true);
                        try {
                          // Upload to Supabase Storage
                          const fileExt = file.name.split('.').pop();
                          const fileName = `school-logo-${Date.now()}.${fileExt}`;
                          const filePath = `branding/${fileName}`;
                          
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('admin_uploads')
                            .upload(filePath, file, {
                              cacheControl: '3600',
                              upsert: false
                            });
                          
                          if (uploadError) throw uploadError;
                          
                          // Get public URL
                          const { data: urlData } = supabase.storage
                            .from('admin_uploads')
                            .getPublicUrl(filePath);
                          
                          setSchoolBranding({...schoolBranding, logoUrl: urlData.publicUrl});
                          
                          // Show branded success modal
                          setDownloadedReportInfo({
                            type: 'School Logo Uploaded',
                            count: 1,
                            filename: `Logo saved successfully`
                          });
                          setShowDownloadSuccessModal(true);
                        } catch (error: any) {
                          console.error('Error uploading logo:', error);
                          showError('Failed to upload logo: ' + error.message);
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                          <label
                            htmlFor="logo-upload"
                            className="w-full bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro cursor-pointer inline-block text-sm sm:text-base min-h-[44px] flex items-center justify-center shadow-sm whitespace-nowrap"
                          >
                            {uploadingLogo ? t('admin.uploading') : t('admin.uploadLogo')}
                          </label>
                          <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center">{t('admin.recommendedSize')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Color Scheme */}
                    <div className="flex-1 lg:border-l-2 lg:border-blue-300 lg:pl-6">
                      <h4 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.colorScheme')}</h4>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                          <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.primaryColor')}</label>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="color" 
                              value={schoolBranding.primaryColor}
                              onChange={(e) => setSchoolBranding({...schoolBranding, primaryColor: e.target.value})}
                              className="w-10 h-10 rounded border-4 border-blue-400 cursor-pointer" 
                            />
                            <span className="text-xs sm:text-sm text-gray-600">{schoolBranding.primaryColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.secondaryColor')}</label>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="color" 
                              value={schoolBranding.secondaryColor}
                              onChange={(e) => setSchoolBranding({...schoolBranding, secondaryColor: e.target.value})}
                              className="w-10 h-10 rounded border-4 border-blue-400 cursor-pointer" 
                            />
                            <span className="text-xs sm:text-sm text-gray-600">{schoolBranding.secondaryColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.accentColor')}</label>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="color" 
                              value={schoolBranding.accentColor}
                              onChange={(e) => setSchoolBranding({...schoolBranding, accentColor: e.target.value})}
                              className="w-10 h-10 rounded border-4 border-blue-400 cursor-pointer" 
                            />
                            <span className="text-xs sm:text-sm text-gray-600">{schoolBranding.accentColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.background')}</label>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="color" 
                              value={schoolBranding.backgroundColor}
                              onChange={(e) => setSchoolBranding({...schoolBranding, backgroundColor: e.target.value})}
                              className="w-10 h-10 rounded border-4 border-blue-400 cursor-pointer" 
                            />
                            <span className="text-xs sm:text-sm text-gray-600">{schoolBranding.backgroundColor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>

                {/* School Information & Contact */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">📝 {t('admin.schoolInformationContact')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-center text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.schoolName')}</label>
                      <input
                        type="text"
                        placeholder={t('admin.schoolNamePlaceholder')}
                        value={schoolBranding.schoolName}
                        onChange={(e) => setSchoolBranding({...schoolBranding, schoolName: e.target.value})}
                        className="w-full px-3 py-2 border-4 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-xs sm:text-sm min-h-[44px] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.tagline')}</label>
                      <input
                        type="text"
                        placeholder={t('admin.taglinePlaceholder')}
                        value={schoolBranding.tagline}
                        onChange={(e) => setSchoolBranding({...schoolBranding, tagline: e.target.value})}
                        className="w-full px-3 py-2 border-4 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-xs sm:text-sm min-h-[44px] bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.schoolDescription')}</label>
                      <textarea
                        rows={3}
                        placeholder={t('admin.schoolDescriptionPlaceholder')}
                        value={schoolBranding.description}
                        onChange={(e) => setSchoolBranding({...schoolBranding, description: e.target.value})}
                        className="w-full px-3 py-2 border-4 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-xs sm:text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.phoneNumber')}</label>
                      <input
                        type="tel"
                        placeholder={t('admin.phonePlaceholder')}
                        value={schoolBranding.phone}
                        onChange={(e) => setSchoolBranding({...schoolBranding, phone: e.target.value})}
                        className="w-full px-3 py-2 border-4 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-xs sm:text-sm min-h-[44px] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.emailAddress')}</label>
                      <input
                        type="email"
                        placeholder={t('admin.emailPlaceholder')}
                        value={schoolBranding.email}
                        onChange={(e) => setSchoolBranding({...schoolBranding, email: e.target.value})}
                        className="w-full px-3 py-2 border-4 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-xs sm:text-sm min-h-[44px] bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.address')}</label>
                      <input
                        type="text"
                        placeholder={t('admin.addressPlaceholder')}
                        value={schoolBranding.address}
                        onChange={(e) => setSchoolBranding({...schoolBranding, address: e.target.value})}
                        className="w-full px-3 py-2 border-4 border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-xs sm:text-sm min-h-[44px] bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={saveSchoolBranding}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    {t('admin.saveBranding')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Integration Modal */}
      {showModuleIntegrationModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.contentUploadDistribution')}</h2>
                <button
                  onClick={() => setShowModuleIntegrationModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">{t('admin.uploadCurriculumSyllabus')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* Content Upload Area */}
                <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                  <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📁 {t('admin.uploadCourseMaterials')}</h3>
                  <div className="border-4 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📄</div>
                    <p className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">{t('admin.dragDropFiles')}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{t('admin.syllabusTypes')}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                      <button 
                        onClick={() => setShowBrowseFilesModal(true)}
                        className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                      >
                        {t('admin.browseFiles')}
                      </button>
                      <button 
                        onClick={() => setShowChefFreddieModal(true)}
                        className="w-full sm:w-auto bg-pink-100 text-pink-700 px-6 py-2 rounded-md hover:bg-pink-200 font-retro flex items-center justify-center gap-2 border-2 border-pink-400 text-sm sm:text-base min-h-[44px]"
                      >
                        <img src="logo.png" className="w-5 h-5 border border-gray-400 rounded" />
                        Ask {skin.assistant.name}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{t('admin.supportsFileTypes')}</p>
                  </div>
                </div>

                {/* Content Preview & Mapping */}
                <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">📋 {t('admin.contentDistribution')}</h3>
                  <p className="text-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{t('admin.chooseContentDestination')}</p>
                
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="text-xl sm:text-2xl mr-2">{skin.icon}</div>
                        <h4 className="font-medium text-blue-800 text-sm sm:text-base">{skin.modules.workspace}</h4>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.workspace.item1}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            workspace: { ...moduleSelection.workspace, item1: e.target.checked }
                          })}
                        />
                        <span>{skin.content.table} databases → Feeds matcher algorithm</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.workspace.item2}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            workspace: { ...moduleSelection.workspace, item2: e.target.checked }
                          })}
                        />
                        <span>{t('admin.ingredientLists')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.workspace.item3}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            workspace: { ...moduleSelection.workspace, item3: e.target.checked }
                          })}
                        />
                        <span>Equipment → Setup guides</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.workspace.item4}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            workspace: { ...moduleSelection.workspace, item4: e.target.checked }
                          })}
                        />
                        <span>{t('admin.dietaryRestrictions')}</span>
                      </label>
                      </div>
                    </div>

                    <div className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="text-xl sm:text-2xl mr-2">📖</div>
                        <h4 className="font-medium text-green-800 text-sm sm:text-base">{skin.modules.notebook}</h4>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.notebook.assignments}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            notebook: { ...moduleSelection.notebook, assignments: e.target.checked }
                          })}
                        />
                        <span>{t('admin.assignmentsRubrics')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.notebook.rubrics}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            notebook: { ...moduleSelection.notebook, rubrics: e.target.checked }
                          })}
                        />
                        <span>{t('admin.assignmentsRubrics')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.notebook.items}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            notebook: { ...moduleSelection.notebook, items: e.target.checked }
                          })}
                        />
                        <span>{skin.content.table} collections → Library</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.notebook.video}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            notebook: { ...moduleSelection.notebook, video: e.target.checked }
                          })}
                        />
                        <span>{t('admin.videoTutorials')}</span>
                      </label>
                      </div>
                    </div>

                    <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="text-xl sm:text-2xl mr-2">🏫</div>
                        <h4 className="font-medium text-purple-800 text-sm sm:text-base">{skin.modules.school}</h4>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.school.techniques}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            school: { ...moduleSelection.school, techniques: e.target.checked }
                          })}
                        />
                        <span>{t('admin.techniqueLessons')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.school.syllabus}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            school: { ...moduleSelection.school, syllabus: e.target.checked }
                          })}
                        />
                        <span>{t('admin.courseSyllabus')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.school.lessons}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            school: { ...moduleSelection.school, lessons: e.target.checked }
                          })}
                        />
                        <span>{t('admin.weeklyLessons')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.school.objectives}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            school: { ...moduleSelection.school, objectives: e.target.checked }
                          })}
                        />
                        <span>{t('admin.learningObjectives')}</span>
                      </label>
                      </div>
                    </div>

                    <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-2 sm:mb-3">
                        <div className="text-xl sm:text-2xl mr-2">👥</div>
                        <h4 className="font-medium text-orange-800 text-sm sm:text-base">{skin.modules.community}</h4>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.community.videos}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            community: { ...moduleSelection.community, videos: e.target.checked }
                          })}
                        />
                        <span>{t('admin.instructorVideos')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.community.insights}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            community: { ...moduleSelection.community, insights: e.target.checked }
                          })}
                        />
                        <span>{t('admin.industryInsights')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.community.sessions}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            community: { ...moduleSelection.community, sessions: e.target.checked }
                          })}
                        />
                        <span>{t('admin.liveSessionSchedules')}</span>
                      </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                          checked={moduleSelection.community.partnerships}
                          onChange={(e) => setModuleSelection({
                            ...moduleSelection,
                            community: { ...moduleSelection.community, partnerships: e.target.checked }
                          })}
                        />
                        <span>{t('admin.partnershipOpportunities')}</span>
                      </label>
                      </div>
                    </div>
                </div>
              </div>




                {/* Publishing Controls */}
                <div className="border-4 border-green-400 bg-green-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-green-900 mb-2 sm:mb-3 text-sm sm:text-base">🚀 {t('admin.publishSettings')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.publishDate')}</label>
                      <input 
                        type="date" 
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full px-2 sm:px-3 py-2 border-4 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-sm sm:text-base min-h-[44px]" 
                      />
                    </div>
                    <div>
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.visibility')}</label>
                      <select 
                        value={publishVisibility}
                        onChange={(e) => setPublishVisibility(e.target.value)}
                        className="w-full px-2 sm:px-3 py-2 border-4 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue bg-white text-sm sm:text-base min-h-[44px]"
                      >
                        <option>{t('admin.allStudents')}</option>
                        <option>{t('admin.specificCohorts')}</option>
                        <option>{t('admin.facultyOnly')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('admin.notification')}</label>
                      <select 
                        value={publishNotification}
                        onChange={(e) => setPublishNotification(e.target.value)}
                        className="w-full px-2 sm:px-3 py-2 border-4 border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue bg-white text-sm sm:text-base min-h-[44px]"
                      >
                        <option>Notify Faculty</option>
                        <option>{t('admin.silentPublish')}</option>
                        <option>{t('admin.notifyStudents')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                    <button 
                      onClick={async () => {
                        if (!currentUser?.id || !currentMapping) {
                          showWarning('Please upload and map content first');
                          return;
                        }
                        
                        try {
                          const { fileName } = currentMapping;
                          
                          // Update content_staging status to 'draft'
                          const { error } = await supabase
                            .from('content_staging')
                            .update({ status: 'draft' })
                            .eq('file_name', fileName)
                            .eq('uploaded_by', currentUser.id);
                          
                          if (error) throw error;
                          
                          // Show branded success modal
                          setDownloadedReportInfo({
                            type: 'Draft Saved',
                            count: 1,
                            filename: 'Content saved as draft - publish later'
                          });
                          setShowDownloadSuccessModal(true);
                          setShowModuleIntegrationModal(false);
                          setCurrentMapping(null);
                          setModuleSelection({
                            workspace: { item1: false, item2: false, item3: false, item4: false },
                            notebook: { assignments: false, rubrics: false, items: false, video: false },
                            school: { techniques: false, syllabus: false, lessons: false, objectives: false },
                            community: { videos: false, insights: false, sessions: false, partnerships: false }
                          });
                        } catch (error: any) {
                          console.error('Save draft error:', error);
                          showError('Failed to save draft: ' + error.message);
                        }
                      }}
                      className="w-full sm:w-auto bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 font-retro text-sm sm:text-base min-h-[44px]"
                    >
                      {t('admin.save')}
                    </button>
                  <button 
                    onClick={async () => {
                      if (!currentUser?.id || !currentMapping) {
                        showWarning('Please upload and map content first');
                        return;
                      }
                      
                      try {
                        const { aiSuggestion, fileName } = currentMapping;
                        const { metadata, contentType } = aiSuggestion;

                        // Check if any module is selected
                        const hasSelection = Object.values(moduleSelection).some(module => 
                          Object.values(module).some(value => value === true)
                        );
                        
                        if (!hasSelection) {
                          showWarning('Please select at least one module to publish to');
                          return;
                        }

                        // Distribute to workspace (content items) - based on checkbox state
                        if (moduleSelection.workspace.item1 && contentType === 'content') {
                          const { error: recipeError } = await supabase
                            .from('user_cookbook')
                            .insert({
                              user_id: currentUser.id,
                              title: metadata.title,
                              ingredients: metadata.topics,
                              instructions: `Imported from ${fileName}`,
                              difficulty: metadata.difficulty,
                              created_at: new Date().toISOString()
                            });
                          
                          if (recipeError) {
                            console.error('Recipe insert error:', recipeError);
                          }
                        }

                        // Distribute to notebook (assignments) - based on checkbox state
                        if (moduleSelection.notebook.assignments && (contentType === 'assignment' || contentType === 'lesson')) {
                          const { error: assignmentError } = await supabase
                            .from('assignments')
                            .insert({
                              title: metadata.title,
                              description: `Week ${metadata.weekNumber || 'TBD'}: ${metadata.topics.join(', ')}`,
                              rubric: {
                                criteria: metadata.topics,
                                equipment: metadata.equipment,
                                difficulty: metadata.difficulty
                              },
                              created_at: new Date().toISOString()
                            });
                          
                          if (assignmentError) {
                            console.error('Assignment insert error:', assignmentError);
                          }
                        }

                        // Distribute to school (curriculum content) - based on checkbox state
                        if (moduleSelection.school.techniques || moduleSelection.school.lessons) {
                          const { error: curriculumError } = await supabase
                            .from('curriculum_content')
                            .insert({
                              title: metadata.title,
                              content_type: contentType,
                              content_data: {
                                topics: metadata.topics,
                                equipment: metadata.equipment,
                                difficulty: metadata.difficulty,
                                weekNumber: metadata.weekNumber
                              },
                              week_number: metadata.weekNumber,
                              created_at: new Date().toISOString()
                            });
                          
                          if (curriculumError) {
                            console.error('Curriculum insert error:', curriculumError);
                          }
                        }

                        // Distribute to community (demo videos/insights) - based on checkbox state
                        if (moduleSelection.community.videos && contentType === 'video') {
                          console.log('Community content:', metadata);
                        }

                        // Update content_staging with publish metadata
                        await supabase
                          .from('content_staging')
                          .update({ 
                            status: 'distributed',
                            publish_date: publishDate || new Date().toISOString(),
                            visibility: publishVisibility,
                            notification_type: publishNotification
                          })
                          .eq('file_name', fileName)
                          .eq('uploaded_by', currentUser.id);

                        // Send notification if requested
                        if (publishNotification === 'Notify Students' || publishNotification === 'Email Announcement') {
                          const { data: allUsers } = await supabase
                            .from('profiles')
                            .select('id');
                          
                          if (allUsers && allUsers.length > 0) {
                            const notifications = allUsers.map(user => ({
                              user_id: user.id,
                              message: `New content published: ${metadata.title}`,
                              read: false
                            }));
                            
                            await supabase
                              .from('notifications')
                              .insert(notifications);
                          }
                        }

                        // Show branded success modal
                        setDownloadedReportInfo({
                          type: 'Content Published',
                          count: Object.values(moduleSelection).reduce((acc, mod) => 
                            acc + Object.values(mod).filter(Boolean).length, 0),
                          filename: 'Content distributed to selected modules'
                        });
                        setShowDownloadSuccessModal(true);
                        
                        // Reset state for next upload
                        setShowModuleIntegrationModal(false);
                        setCurrentMapping(null);
                        setModuleSelection({
                          workspace: { item1: false, item2: false, item3: false, item4: false },
                          notebook: { assignments: false, rubrics: false, items: false, video: false },
                          school: { techniques: false, syllabus: false, lessons: false, objectives: false },
                          community: { videos: false, insights: false, sessions: false, partnerships: false }
                        });
                        setPublishDate('');
                        setPublishVisibility('All Students');
                        setPublishNotification('Notify Students');
                        
                      } catch (error: any) {
                        console.error('Distribution error:', error);
                        showError(`Failed to publish content: ${error.message}`);
                      }
                      }}
                      className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-retro text-sm sm:text-base min-h-[44px]"
                    >
                      {t('admin.publishContent')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Management Modal */}
      {showStudentManagementModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center mb-3 sm:mb-4 relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.studentManagementTitle')}</h2>
                <button
                  onClick={() => setShowStudentManagementModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 text-sm sm:text-base">{t('admin.manageStudentProgress')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
              {/* Student Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📊 {t('admin.studentOverview')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">{Math.max(users.length, 2)}</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.totalStudents')}</p>
                    <p className="text-xs text-blue-600">{t('admin.currentlyEnrolled')}</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">{Math.max(users.length, 2)}</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">{t('admin.activeStudents')}</p>
                    <p className="text-xs text-green-600">{t('admin.last7Days')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">1,250</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">{t('admin.avgXPPerStudent')}</p>
                    <p className="text-xs text-purple-600">{t('admin.experiencePoints')}</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">0</div>
                    <p className="text-xs sm:text-sm text-orange-800 font-medium">{t('admin.inactiveStudents')}</p>
                    <p className="text-xs text-orange-600">{t('admin.needAttention')}</p>
                  </div>
                </div>
              </div>

              {/* Student Directory */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <div className="flex justify-center items-center mb-3 sm:mb-4 sm:relative">
                  <h3 className="font-bold text-maineBlue text-sm sm:text-base">📋 {t('admin.studentDirectory')}</h3>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="hidden sm:flex bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro text-sm items-center justify-center gap-2 sm:absolute sm:right-0 min-h-[44px]"
                  >
                    <span className="text-lg">+</span> {t('admin.addStudent')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {users.slice(0, 10).map((user) => {
                    const initials = (user.username || user.email || 'NA')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    
                    return (
                      <div key={user.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{user.username || 'N/A'}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                            Level {user.level || 1}
                          </span>
                          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                            <p>📚 {t('admin.program')}: {skin.people.defaultProgram}</p>
                            <p className="truncate">📧 {user.email}</p>
                            <p>📞 (555) 123-4567</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {((user as any).cohorts || []).map((cohort: string) => {
                            // Format cohort label: convert underscores to spaces and capitalize
                            const formatLabel = (str: string) => {
                              return str.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ');
                            };
                            
                            return (
                              <span 
                                key={cohort}
                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium flex items-center gap-1"
                              >
                                🎓 {formatLabel(cohort)}
                                <button
                                  onClick={() => {
                                    const updatedCohorts = (user as any).cohorts.filter((c: string) => c !== cohort);
                                    setUsers(prev => prev.map(u => 
                                      u.id === user.id ? {...u, cohorts: updatedCohorts} as any : u
                                    ));
                                  }}
                                  className="ml-1 text-purple-600 hover:text-purple-900 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                          {((user as any).cohorts || []).length === 0 && (
                            <span className="text-xs text-gray-400 italic">{t('admin.noCohortsAssigned')}</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setEditingStudent(user);
                              setShowEditStudentModal(true);
                            }}
                            className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                          >
                            {t('admin.edit')}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t('admin.confirmRemoveStudent', { name: user.username || user.email }))) {
                                setUsers(prev => prev.filter(u => u.id !== user.id));
                                alert(t('admin.studentRemovedSuccess'));
                              }
                            }}
                            className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                          >
                            {t('admin.remove')}
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
                
                {/* Add Student Button - Mobile Only (Below Cards) */}
                <div className="mt-4 sm:hidden">
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="w-full bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro text-sm flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span className="text-lg">+</span> {t('admin.addStudent')}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">⚡ {t('admin.quickActions')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <button 
                    onClick={() => setShowAnnouncementModal(true)}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">📧</div>
                    <h4 className="font-medium text-blue-800 text-sm sm:text-base">{t('admin.sendAnnouncement')}</h4>
                    <p className="text-xs text-blue-600">{t('admin.notifyAllStudents')}</p>
                  </button>
                  <button 
                    onClick={() => setShowCsvImportModal(true)}
                    className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">📤</div>
                    <h4 className="font-medium text-green-800 text-sm sm:text-base">{t('admin.importStudentsCSV')}</h4>
                    <p className="text-xs text-green-600">{t('admin.bulkUploadStudentList')}</p>
                  </button>
                  <button 
                    onClick={() => setShowExportDataModal(true)}
                    className="bg-purple-50 border-4 border-purple-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">📄</div>
                    <h4 className="font-medium text-purple-800 text-sm sm:text-base">{t('admin.exportStudentData')}</h4>
                    <p className="text-xs text-purple-600">{t('admin.downloadStudentRecords')}</p>
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Management Modal */}
      {showFacultyManagementModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center mb-3 sm:mb-4 relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.facultyManagementTitle')}</h2>
                <button
                  onClick={() => setShowFacultyManagementModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 text-sm sm:text-base">{t('admin.manageFacultyAccess')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
              {/* Faculty Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">👩‍🏫 {t('admin.facultyOverview')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">12</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.totalFaculty')}</p>
                    <p className="text-xs text-blue-600">{t('admin.activeInstructors')}</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">8</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">{t('admin.fullTime')}</p>
                    <p className="text-xs text-green-600">{t('admin.permanentStaff')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">4</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">{t('admin.partTime')}</p>
                    <p className="text-xs text-purple-600">{t('admin.adjunctInstructors')}</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">95%</div>
                    <p className="text-xs sm:text-sm text-orange-800 font-medium">{t('admin.activeThisWeek')}</p>
                    <p className="text-xs text-orange-600">{t('admin.platformEngagement')}</p>
                  </div>
                </div>
              </div>

              {/* Faculty Directory */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="font-bold text-maineBlue text-center mb-3 sm:mb-4 text-sm sm:text-base">👩‍🏫 {t('admin.facultyDirectory')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{facultyList[0]?.name || skin.people.mockFaculty[0].name}</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                        Active
                      </span>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>📚 Courses: {facultyList[0]?.courses || skin.people.mockFaculty[0].courses}</p>
                        <p>👥 Students: 42 active</p>
                        <p>📅 Last Login: Today, 9:15 AM</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingFaculty(facultyList[0]);
                          setShowEditFacultyModal(true);
                        }}
                        className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmRemoveFaculty', { name: facultyList[0]?.name || skin.people.mockFaculty[0].name }))) {
                            setFacultyList(prev => prev.filter(f => f.id !== facultyList[0].id));
                            alert(t('admin.facultyRemovedSuccess'));
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.remove')}
                      </button>
                      </div>
                    </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{facultyList[1]?.name || skin.people.mockFaculty[1].name}</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                        {t('admin.active')}
                      </span>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>📚 Courses: {facultyList[1]?.courses || skin.people.mockFaculty[1].courses}</p>
                        <p>👥 Students: 28 active</p>
                        <p>📅 Last Login: Yesterday, 4:30 PM</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingFaculty(facultyList[1]);
                          setShowEditFacultyModal(true);
                        }}
                        className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmRemoveFaculty', { name: facultyList[1]?.name || skin.people.mockFaculty[1].name }))) {
                            setFacultyList(prev => prev.filter(f => f.id !== facultyList[1].id));
                            alert(t('admin.facultyRemovedSuccess'));
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.remove')}
                      </button>
                      </div>
                    </div>
                </div>
              </div>

              {/* Faculty Quick Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">⚡ {t('admin.facultyManagementActions')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <button 
                    onClick={() => setShowAddFacultyModal(true)}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">👥</div>
                    <h4 className="font-medium text-blue-800 text-sm sm:text-base">{t('admin.addNewFaculty')}</h4>
                    <p className="text-xs text-blue-600">{t('admin.inviteNewInstructors')}</p>
                  </button>
                  <button 
                    onClick={() => setShowManagePermissionsModal(true)}
                    className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">🔐</div>
                    <h4 className="font-medium text-green-800 text-sm sm:text-base">{t('admin.managePermissions')}</h4>
                    <p className="text-xs text-green-600">{t('admin.updateAccessLevels')}</p>
                  </button>
                  <button 
                    onClick={() => setShowFacultyReportsModal(true)}
                    className="bg-purple-50 border-4 border-purple-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">📊</div>
                    <h4 className="font-medium text-purple-800 text-sm sm:text-base">{t('admin.facultyReports')}</h4>
                    <p className="text-xs text-purple-600">{t('admin.performanceAnalytics')}</p>
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Management Modal */}
      {showAlumniManagementModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center mb-3 sm:mb-4 relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.alumniManagementTitle')}</h2>
                <button
                  onClick={() => setShowAlumniManagementModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 text-sm sm:text-base">{t('admin.trackAlumniSuccessStories')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
              {/* Alumni Overview Stats */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">🎓 {t('admin.alumniOverview')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">342</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.totalAlumni')}</p>
                    <p className="text-xs text-blue-600">{t('admin.programGraduates')}</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">89%</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">{t('admin.employmentRate')}</p>
                    <p className="text-xs text-green-600">{t('admin.within6Months')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">$52K</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">{t('admin.avgStartingSalary')}</p>
                    <p className="text-xs text-purple-600">{t('admin.firstYearPostGrad')}</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">47</div>
                    <p className="text-xs sm:text-sm text-orange-800 font-medium">{t('admin.businessOwners')}</p>
                    <p className="text-xs text-orange-600">Started their own businesses</p>
                  </div>
                </div>
              </div>

              {/* Success Stories */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-center items-center mb-3 sm:mb-4 gap-2 sm:gap-0 relative sm:pl-6">
                  <h3 className="font-bold text-maineBlue text-sm sm:text-base">⭐ {t('admin.successStories')}</h3>
                  <button
                    onClick={() => setShowAddAlumniModal(true)}
                    className="w-full sm:w-auto bg-maineBlue text-white px-4 py-2 rounded-md hover:bg-blue-700 font-retro text-xs sm:text-sm flex items-center justify-center gap-2 sm:absolute sm:right-0 min-h-[44px]"
                  >
                    <span className="text-lg">+</span> {t('admin.addAlumni')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Maria Santos</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs inline-block mb-2">
                        Class of 2022
                      </span>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>🏆 {skin.people.mockAlumniTitles[0]} at top-tier employer</p>
                        <p>📍 Top industry employer</p>
                        <p>💰 Salary: $85,000/year</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAlumni(alumniList[0]);
                          setShowEditAlumniModal(true);
                        }}
                        className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmRemoveAlumni', { name: 'Maria Santos' }))) {
                            setAlumniList(prev => prev.filter(a => a.id !== alumniList[0].id));
                            alert(t('admin.alumniRemovedSuccess'));
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.remove')}
                      </button>
                      </div>
                    </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">James Chen</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs inline-block mb-2">
                        Class of 2021
                      </span>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>🏢 {skin.people.mockAlumniTitles[1]} & Entrepreneur</p>
                        <p>📍 Multi-location industry business</p>
                        <p>💰 Revenue: $2.1M annually</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAlumni(alumniList[1]);
                          setShowEditAlumniModal(true);
                        }}
                        className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmRemoveAlumni', { name: 'James Chen' }))) {
                            setAlumniList(prev => prev.filter(a => a.id !== alumniList[1].id));
                            alert(t('admin.alumniRemovedSuccess'));
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.remove')}
                      </button>
                      </div>
                    </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Ashley Rodriguez</h4>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs inline-block mb-2">
                        Class of 2023
                      </span>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>📺 Food Network Personality</p>
                        <p>📍 Host of "Pastry Perfection"</p>
                        <p>💰 $120,000/year + endorsements</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAlumni(alumniList[2]);
                          setShowEditAlumniModal(true);
                        }}
                        className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmRemoveAlumni', { name: 'Ashley Rodriguez' }))) {
                            setAlumniList(prev => prev.filter(a => a.id !== alumniList[2].id));
                            alert(t('admin.alumniRemovedSuccess'));
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.remove')}
                      </button>
                      </div>
                    </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-4 border-gray-400">
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">David Miller</h4>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs inline-block mb-2">
                        Class of 2020
                      </span>
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p>🍟 Corporate Food Service Director</p>
                        <p>📍 Google Campus Dining</p>
                        <p>💰 $95,000/year + benefits</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAlumni(alumniList[3]);
                          setShowEditAlumniModal(true);
                        }}
                        className="flex-1 text-maineBlue hover:text-white hover:bg-maineBlue px-3 py-2 border border-maineBlue rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmRemoveAlumni', { name: 'David Miller' }))) {
                            setAlumniList(prev => prev.filter(a => a.id !== alumniList[3].id));
                            alert(t('admin.alumniRemovedSuccess'));
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-white hover:bg-red-600 px-3 py-2 border border-red-600 rounded text-xs sm:text-sm transition-colors min-h-[44px]"
                      >
                        {t('admin.remove')}
                      </button>
                      </div>
                    </div>
                </div>
              </div>


              {/* Alumni Network Actions */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">⚡ {t('admin.alumniNetworkManagement')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <button 
                    onClick={() => setShowAlumniNewsletterModal(true)}
                    className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">📧</div>
                    <h4 className="font-medium text-blue-800 text-sm sm:text-base">{t('admin.alumniNewsletter')}</h4>
                    <p className="text-xs text-blue-600">{t('admin.sendUpdatesOpportunities')}</p>
                  </button>
                  <button 
                    onClick={() => setShowPlanEventModal(true)}
                    className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">🎉</div>
                    <h4 className="font-medium text-green-800 text-sm sm:text-base">{t('admin.planAlumniEvent')}</h4>
                    <p className="text-xs text-green-600">{t('admin.networkingReunions')}</p>
                  </button>
                  <button 
                    onClick={() => setShowGiftingDonationsModal(true)}
                    className="bg-purple-50 border-4 border-purple-400 rounded-lg p-3 sm:p-4 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="text-xl sm:text-2xl mb-2">📄</div>
                    <h4 className="font-medium text-purple-800 text-sm sm:text-base">{t('admin.giftingDonations')}</h4>
                    <p className="text-xs text-purple-600">{t('admin.fundraisingStrategy')}</p>
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {showUserActivityModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center mb-3 sm:mb-4 relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.userActivity')}</h2>
                <button
                  onClick={() => setShowUserActivityModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 text-sm sm:text-base">{t('admin.monitorStudentEngagement')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
              {/* Login Patterns */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📅 {t('admin.loginPatterns')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">342</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.dailyLogins')}</p>
                    <p className="text-xs text-blue-600">↑ 8% {t('admin.vsYesterday')}</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">1,847</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">{t('admin.weeklyLogins')}</p>
                    <p className="text-xs text-green-600">↑ 15% {t('admin.vsLastWeek')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">23 min</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">{t('admin.avgSession')}</p>
                    <p className="text-xs text-purple-600">↑ 3 {t('admin.min')} {t('admin.vsLastWeek')}</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">89%</div>
                    <p className="text-xs sm:text-sm text-orange-800 font-medium">{t('admin.weeklyActive')}</p>
                    <p className="text-xs text-orange-600">↑ 4% {t('admin.vsLastWeek')}</p>
                  </div>
                </div>
              </div>

              {/* Module Usage Breakdown */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📊 {t('admin.moduleUsageBreakdown')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-xl sm:text-2xl mr-2">{skin.icon}</div>
                      <h4 className="font-medium text-blue-800 text-sm sm:text-base">{skin.modules.workspace}</h4>
                    </div>
                    <div className="text-center text-xl sm:text-2xl font-bold text-blue-600 mb-1">67%</div>
                    <p className="text-center text-xs text-blue-600">2,340 {t('admin.sessionsThisWeek')}</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-xl sm:text-2xl mr-2">📖</div>
                      <h4 className="font-medium text-green-800 text-sm sm:text-base">{skin.modules.notebook}</h4>
                    </div>
                    <div className="text-center text-xl sm:text-2xl font-bold text-green-600 mb-1">84%</div>
                    <p className="text-center text-xs text-green-600">1,890 {t('admin.assignmentsViewed')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-xl sm:text-2xl mr-2">🏫</div>
                      <h4 className="font-medium text-purple-800 text-sm sm:text-base">{skin.modules.school}</h4>
                    </div>
                    <div className="text-center text-xl sm:text-2xl font-bold text-purple-600 mb-1">72%</div>
                    <p className="text-center text-xs text-purple-600">1,456 {t('admin.techniqueViews')}</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center mb-2">
                      <div className="text-xl sm:text-2xl mr-2">👥</div>
                      <h4 className="font-medium text-orange-800 text-sm sm:text-base">{skin.modules.community}</h4>
                    </div>
                    <div className="text-center text-xl sm:text-2xl font-bold text-orange-600 mb-1">45%</div>
                    <p className="text-center text-xs text-orange-600">234 {t('admin.liveSessionsJoined')}</p>
                  </div>
                </div>
              </div>

              {/* Feature Adoption */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">🚀 {t('admin.featureAdoptionRates')}</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-base sm:text-lg mr-2 sm:mr-3">🔍</span>
                      <span className="font-medium text-xs sm:text-base">Content Matcher</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-blue-600">78%</span>
                      </div>
                    </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-base sm:text-lg mr-2 sm:mr-3">🎥</span>
                      <span className="font-medium text-xs sm:text-base">{t('admin.videoSubmissions')}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-green-600">65%</span>
                      </div>
                    </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-base sm:text-lg mr-2 sm:mr-3">🔴</span>
                      <span className="font-medium text-xs sm:text-base">Live Skills Lab</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                        <div className="bg-orange-600 h-2 rounded-full" style={{width: '42%'}}></div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-orange-600">42%</span>
                      </div>
                    </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-base sm:text-lg mr-2 sm:mr-3">📁</span>
                      <span className="font-medium text-xs sm:text-base">{t('admin.collectionsLibrary')}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '58%'}}></div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-purple-600">58%</span>
                      </div>
                    </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-base sm:text-lg mr-2 sm:mr-3">📊</span>
                      <span className="font-medium text-xs sm:text-base">{t('admin.gradebook')}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2 mr-2 sm:mr-3">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-green-600">73%</span>
                      </div>
                    </div>
                </div>
              </div>

              {/* Inactive Students Alert */}
              <div className="border-4 border-red-400 bg-red-50 rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-red-900 mb-3 sm:mb-4 text-sm sm:text-base">⚠️ {t('admin.inactiveStudentsAlert')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-1">23</div>
                    <p className="text-center text-xs sm:text-sm text-red-800">{t('admin.noLoginIn7Days')}</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-1">8</div>
                    <p className="text-center text-xs sm:text-sm text-red-800">{t('admin.noLoginIn14Days')}</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-1">3</div>
                    <p className="text-center text-xs sm:text-sm text-red-800">{t('admin.noLoginIn30Days')}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Performance Modal */}
      {showProgramPerformanceModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center mb-3 sm:mb-4 relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.programPerformance')}</h2>
                <button
                  onClick={() => setShowProgramPerformanceModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 text-sm sm:text-base">{t('admin.trackProgramCompletion')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
            {/* Program Selector */}
            <div>
              <label className="block text-center text-xs sm:text-sm font-medium text-gray-700 mb-2">📚 {t('admin.selectProgram')}:</label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full max-w-md mx-auto block px-4 py-3 border-2 border-maineBlue rounded-lg focus:outline-none focus:ring-2 focus:ring-maineBlue font-retro text-center"
              >
                <option value="all">{t('admin.allPrograms')}</option>
                <option value="program_1">{skin.people.defaultProgram}</option>
                <option value="program_2">Advanced Program</option>
                <option value="program_3">Specialized Track</option>
                <option value="program_4">Management Program</option>
                <option value="program_5">Industry Fundamentals</option>
                <option value="program_6">Professional Development</option>
              </select>
            </div>
            
              {/* Selected Program Indicator */}
              {selectedProgram !== 'all' && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-xs sm:text-sm text-blue-800">
                    {t('admin.showingDataFor')}: <span className="font-bold text-maineBlue">
                      {selectedProgram === 'program_1' && skin.people.defaultProgram}
                      {selectedProgram === 'program_2' && 'Advanced Program'}
                      {selectedProgram === 'program_3' && 'Specialized Track'}
                      {selectedProgram === 'program_4' && 'Management Program'}
                      {selectedProgram === 'program_5' && 'Industry Fundamentals'}
                      {selectedProgram === 'program_6' && 'Professional Development'}
                    </span>
                  </p>
                </div>
              )}
              
              {/* Program Completion Rates */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">🎓 {t('admin.programCompletionRates')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">87%</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">{t('admin.overallCompletion')}</p>
                    <p className="text-xs text-green-600">↑ 5% {t('admin.vsLastSemester')}</p>
                  </div>
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">92%</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.assignmentCompletion')}</p>
                    <p className="text-xs text-blue-600">↑ 3% {t('admin.vsLastSemester')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">78%</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">{t('admin.videoSubmissions')}</p>
                    <p className="text-xs text-purple-600">↑ 12% {t('admin.vsLastSemester')}</p>
                  </div>
                </div>
              </div>

              {/* Student Satisfaction */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">⭐ {t('admin.studentSatisfactionMetrics')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <div className="bg-yellow-50 border-4 border-yellow-400 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-600">4.2/5</div>
                    <p className="text-xs sm:text-sm text-yellow-800 font-medium">{t('admin.overallProgramRating')}</p>
                    <p className="text-xs text-yellow-600">{t('admin.basedOnStudentReviews', { count: 234 })}</p>
                  </div>
                  <div className="bg-emerald-50 border-4 border-emerald-400 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-600">94%</div>
                    <p className="text-xs sm:text-sm text-emerald-800 font-medium">{t('admin.wouldRecommend')}</p>
                    <p className="text-xs text-emerald-600">{t('admin.studentsWhoRecommend')}</p>
                  </div>
                </div>
              </div>

              {/* Skill Progression Tracking */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📊 {t('admin.skillProgressionTracking')}</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs sm:text-base">{t('admin.knifeSkillsTechniques', { count: 52 })}</span>
                      <span className="text-xs sm:text-sm font-bold text-blue-600">{t('admin.averageCompleted', { completed: 38, total: 52 })}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full" style={{width: '73%'}}></div>
                      </div>
                    </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs sm:text-base">{t('admin.assignmentGrades')}</span>
                      <span className="text-xs sm:text-sm font-bold text-green-600">{t('admin.average')}: 85.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs sm:text-base">{t('admin.videoQualityScores')}</span>
                      <span className="text-xs sm:text-sm font-bold text-purple-600">{t('admin.average')}: 4.1/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-600 h-3 rounded-full" style={{width: '82%'}}></div>
                      </div>
                    </div>
                </div>
              </div>

              {/* Learning Outcomes Achievement */}
              <div className="border-4 border-red-400 bg-red-50 rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-red-900 mb-3 sm:mb-4 text-sm sm:text-base">⚠️ {t('admin.areasNeedingImprovement')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-1">23%</div>
                    <p className="text-center text-xs sm:text-sm text-red-800">{t('admin.studentsStruggling')}</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-1">15%</div>
                    <p className="text-center text-xs sm:text-sm text-red-800">{t('admin.lateAssignmentSubmissions')}</p>
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-red-600 mb-1">8%</div>
                    <p className="text-center text-xs sm:text-sm text-red-800">{t('admin.below70GradeAverage')}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Health Modal */}
      {showEnrollmentHealthModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center mb-3 sm:mb-4 relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.enrollmentHealth')}</h2>
                <button
                  onClick={() => setShowEnrollmentHealthModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 text-sm sm:text-base">{t('admin.monitorEnrollment')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
              {/* Current Enrollment Status */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📊 {t('admin.currentEnrollmentStatus')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">247</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.totalEnrolled')}</p>
                    <p className="text-xs text-blue-600">↑ 12 {t('admin.vsLastMonth')}</p>
                  </div>
                  <div className="bg-green-50 border-4 border-green-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">89%</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">{t('admin.activeStudents')}</p>
                    <p className="text-xs text-green-600">↑ 3% {t('admin.vsLastMonth')}</p>
                  </div>
                  <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">300</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium">{t('admin.licenseCapacity')}</p>
                    <p className="text-xs text-purple-600">82% {t('admin.utilized')}</p>
                  </div>
                  <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-2 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">23</div>
                    <p className="text-xs sm:text-sm text-orange-800 font-medium">{t('admin.newThisMonth')}</p>
                    <p className="text-xs text-orange-600">↑ 5 {t('admin.vsLastMonth')}</p>
                  </div>
                </div>
              </div>

              {/* Retention & Completion Rates */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">🎓 {t('admin.retentionCompletionRates')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                  <div className="bg-emerald-50 border-4 border-emerald-400 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-600">94%</div>
                    <p className="text-xs sm:text-sm text-emerald-800 font-medium">{t('admin.semesterRetention')}</p>
                    <p className="text-xs text-emerald-600">{t('admin.studentsContinuing')}</p>
                  </div>
                  <div className="bg-teal-50 border-4 border-teal-400 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-teal-600">87%</div>
                    <p className="text-xs sm:text-sm text-teal-800 font-medium">{t('admin.programCompletion')}</p>
                    <p className="text-xs text-teal-600">{t('admin.studentsFinishing')}</p>
                  </div>
                  <div className="bg-indigo-50 border-4 border-indigo-400 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-600">6%</div>
                    <p className="text-xs sm:text-sm text-indigo-800 font-medium">{t('admin.dropoutRate')}</p>
                    <p className="text-xs text-indigo-600">{t('admin.studentsLeavingEarly')}</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Trends */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">📈 {t('admin.enrollmentTrends')}</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs sm:text-base">{t('admin.fallSemesterGrowth')}</span>
                      <span className="text-xs sm:text-sm font-bold text-green-600">+15% {t('admin.enrollment')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{width: '78%'}}></div>
                      </div>
                    </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs sm:text-base">{t('admin.springSemesterProjections')}</span>
                      <span className="text-xs sm:text-sm font-bold text-blue-600">+8% {t('admin.projectedGrowth')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-600 h-3 rounded-full" style={{width: '65%'}}></div>
                      </div>
                    </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-xs sm:text-base">{t('admin.summerProgramInterest')}</span>
                      <span className="text-xs sm:text-sm font-bold text-purple-600">42 {t('admin.preRegistrations')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-purple-600 h-3 rounded-full" style={{width: '42%'}}></div>
                      </div>
                    </div>
                </div>
              </div>

              {/* Class Cohort Performance */}
              <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-maineBlue mb-3 sm:mb-4 text-sm sm:text-base">👥 {t('admin.classCohortPerformance')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <h4 className="text-center font-medium text-gray-800 mb-2 sm:mb-3 text-xs sm:text-base">{t('admin.currentCohorts')}</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{skin.people.defaultProgram} - Fall 2024</p>
                          <p className="text-xs sm:text-sm text-gray-600">42 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">95%</p>
                          <p className="text-xs text-gray-500">{t('admin.retention')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">Advanced Program - Fall 2024</p>
                          <p className="text-xs sm:text-sm text-gray-600">28 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-green-600">92%</p>
                          <p className="text-xs text-gray-500">{t('admin.retention')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.hospitalityManagement')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">35 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-purple-600">88%</p>
                          <p className="text-xs text-gray-500">{t('admin.retention')}</p>
                        </div>
                      </div>
                      </div>
                    </div>
                  <div>
                    <h4 className="text-center font-medium text-gray-800 mb-2 sm:mb-3 text-xs sm:text-base">{t('admin.graduationPipeline')}</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-emerald-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.graduatingSpring2025')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">38 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-emerald-600">{t('admin.onTrack')}</p>
                          <p className="text-xs text-gray-500">{t('admin.status')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.atRiskStudents')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">7 students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-yellow-600">{t('admin.support')}</p>
                          <p className="text-xs text-gray-500">{t('admin.needed')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-teal-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.alumniNetwork')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">342 graduates</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-teal-600">{t('admin.active')}</p>
                          <p className="text-xs text-gray-500">{t('admin.network')}</p>
                        </div>
                      </div>
                      </div>
                    </div>
                </div>
              </div>

              {/* License Utilization Alert */}
              <div className="border-4 border-yellow-400 bg-yellow-50 rounded-lg p-3 sm:p-6">
                <h3 className="text-center font-bold text-yellow-900 mb-3 sm:mb-4 text-sm sm:text-base">⚠️ {t('admin.licenseUtilizationStatus')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-white border border-yellow-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-yellow-600 mb-1">82%</div>
                    <p className="text-center text-xs sm:text-sm text-yellow-800">{t('admin.currentUtilization')}</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-yellow-600 mb-1">53</div>
                    <p className="text-center text-xs sm:text-sm text-yellow-800">{t('admin.availableLicenses')}</p>
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-2 sm:p-3">
                    <div className="text-center text-xl sm:text-2xl font-bold text-yellow-600 mb-1">Q2</div>
                    <p className="text-center text-xs sm:text-sm text-yellow-800">{t('admin.projectedCapacity')}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Analytics Modal */}
      {showContentAnalyticsModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.contentAnalyticsDashboard')}</h2>
                <button
                  onClick={() => setShowContentAnalyticsModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">{t('admin.monitorContentPerformance')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* Content Performance Overview */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">📊 {t('admin.contentPerformanceOverview')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">847</div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">Total Content Views</p>
                      <p className="text-xs text-blue-600">↑ 12% {t('admin.thisWeek')}</p>
                    </div>
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">73%</div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.completionRate')}</p>
                      <p className="text-xs text-blue-600">↑ 5% {t('admin.thisWeek')}</p>
                    </div>
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">4.2</div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">{t('admin.avgEngagementScore')}</p>
                      <p className="text-xs text-blue-600">→ {t('admin.noChange')}</p>
                    </div>
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4 text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">28</div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">Active Content ({skin.content.metricLabel})</p>
                      <p className="text-xs text-blue-600">↑ 3 {t('admin.newThisWeek')}</p>
                    </div>
                  </div>
                </div>

                {/* Top Performing Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">🏆 Top Performing Content ({skin.content.metricLabel})</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.frenchKnifeSkills')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{skin.modules.notebook} • {skin.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">94%</p>
                          <p className="text-xs text-gray-500">{t('admin.completion')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">Core Skills Mastery</p>
                          <p className="text-xs sm:text-sm text-gray-600">{skin.modules.notebook}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">89%</p>
                          <p className="text-xs text-gray-500">{t('admin.completion')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.pastaMakingFundamentals')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{skin.modules.notebook}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">76%</p>
                          <p className="text-xs text-gray-500">{t('admin.completion')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                    <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">📉 {t('admin.contentNeedingAttention')}</h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.advancedPlatingTechniques')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{skin.modules.notebook}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">34%</p>
                          <p className="text-xs text-gray-500">{t('admin.completion')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.molecularGastronomyBasics')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{skin.modules.community}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">28%</p>
                          <p className="text-xs text-gray-500">{t('admin.completion')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-base">{t('admin.winePairingFundamentals')}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{skin.modules.school}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-blue-600">52%</p>
                          <p className="text-xs text-gray-500">{t('admin.completion')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module-Specific Analytics */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">📈 {t('admin.moduleSpecificAnalytics')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-blue-900 mb-2 text-xs sm:text-base">📚 {skin.modules.notebook}</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span>{t('admin.activeRecipes')}:</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.avgCompletion')}:</span>
                        <span className="font-medium text-blue-600">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.studentEngagement')}:</span>
                        <span className="font-medium text-blue-600">{t('admin.high')}</span>
                      </div>
                      </div>
                    </div>
                  
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">🏫 {skin.modules.school}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{t('admin.activeLessons')}:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.avgCompletion')}:</span>
                        <span className="font-medium text-blue-600">82%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.studentEngagement')}:</span>
                        <span className="font-medium text-blue-600">{t('admin.high')}</span>
                      </div>
                      </div>
                    </div>
                  
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">👥 {skin.modules.community}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{t('admin.activeContent')}:</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.avgCompletion')}:</span>
                        <span className="font-medium text-blue-600">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.studentEngagement')}:</span>
                        <span className="font-medium text-blue-600">{t('admin.medium')}</span>
                      </div>
                      </div>
                    </div>
                  
                  <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">{skin.icon} {skin.modules.workspace}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>{t('admin.activeSessions')}:</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.avgParticipation')}:</span>
                        <span className="font-medium text-blue-600">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('admin.studentEngagement')}:</span>
                        <span className="font-medium text-blue-600">{t('admin.medium')}</span>
                      </div>
                      </div>
                    </div>
                </div>
              </div>

                {/* Time-Based Analytics */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">🕰️ {t('admin.timeBasedAnalytics')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 text-xs sm:text-base">{t('admin.peakUsageTimes')}</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span>10:00 AM - 12:00 PM:</span>
                        <span className="font-medium text-green-600">{t('admin.high')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2:00 PM - 4:00 PM:</span>
                        <span className="font-medium text-green-600">{t('admin.high')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>6:00 PM - 8:00 PM:</span>
                        <span className="font-medium text-yellow-600">{t('admin.medium')}</span>
                      </div>
                      </div>
                    </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">{t('admin.weeklyTrends')}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Wednesday:</span>
                        <span className="font-medium text-green-600">{t('admin.peak')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thursday - Friday:</span>
                        <span className="font-medium text-yellow-600">{t('admin.moderate')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekend:</span>
                        <span className="font-medium text-red-600">{t('admin.low')}</span>
                      </div>
                      </div>
                    </div>
                  
                    <div>
                      <h4 className="text-center font-medium text-gray-800 mb-2 text-xs sm:text-base">{t('admin.contentFilters')}</h4>
                      <div className="space-y-2">
                        <select className="w-full px-2 sm:px-3 py-2 border-4 border-blue-400 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue bg-white min-h-[44px]">
                          <option>{t('admin.last7Days')}</option>
                          <option>{t('admin.last30Days')}</option>
                          <option>{t('admin.last3Months')}</option>
                          <option>{t('admin.allTime')}</option>
                        </select>
                        <select className="w-full px-2 sm:px-3 py-2 border-4 border-blue-400 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue bg-white min-h-[44px]">
                          <option>{t('admin.allModules')}</option>
                          <option>{skin.modules.notebook}</option>
                          <option>{skin.modules.school}</option>
                          <option>{skin.modules.community}</option>
                          <option>{skin.modules.workspace}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                      try {
                        // Generate analytics report data
                        const analyticsData = [
                          { metric: 'Total Content Views', value: 847, change: '+12%' },
                          { metric: 'Completion Rate', value: '73%', change: '+5%' },
                          { metric: 'Avg Engagement Score', value: 4.2, change: 'No change' },
                          { metric: 'Active Content', value: 28, change: '+3 new' },
                          { metric: `Top ${skin.content.table}`, value: 'Advanced Techniques', completion: '94%' },
                          { metric: 'Needs Attention', value: 'Advanced Plating', completion: '34%' }
                        ];
                        
                        const csv = convertToCSV(analyticsData);
                        const timestamp = new Date().toISOString().split('T')[0];
                        const filename = `content-analytics-${timestamp}.csv`;
                        downloadFile(csv, filename);
                        
                        // Show branded success modal
                        setDownloadedReportInfo({
                          type: 'Content Analytics Report',
                          count: analyticsData.length,
                          filename: filename
                        });
                        setShowDownloadSuccessModal(true);
                        setShowContentAnalyticsModal(false);
                      } catch (error: any) {
                        console.error('Error exporting analytics:', error);
                        alert('Failed to export analytics: ' + error.message);
                      }
                    }}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    📊 {t('admin.exportAnalyticsReport')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Platform Configuration Modal */}
      {showConfigurationModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">{t('admin.crossPlatformConfiguration')}</h2>
                <button
                  onClick={() => setShowConfigurationModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">{t('admin.configureContentPermissions')}</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* Content Approval Workflows */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">✅ {t('admin.contentApprovalWorkflows')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-xs sm:text-base">{skin.content.approvalLabel} Process</h4>
                      <div className="space-y-2 sm:space-y-3">
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="recipe-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.recipeApproval === 'auto-approve'}
                            onChange={() => setPlatformConfig({...platformConfig, recipeApproval: 'auto-approve'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.autoApproveAll')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="recipe-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.recipeApproval === 'instructor-approval'}
                            onChange={() => setPlatformConfig({...platformConfig, recipeApproval: 'instructor-approval'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.requireInstructorApproval')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="recipe-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.recipeApproval === 'admin-approval'}
                            onChange={() => setPlatformConfig({...platformConfig, recipeApproval: 'admin-approval'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.requireAdminApproval')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="recipe-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.recipeApproval === 'multi-level'}
                            onChange={() => setPlatformConfig({...platformConfig, recipeApproval: 'multi-level'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.multiLevelApproval')}</span>
                        </label>
                      </div>
                    </div>
                  
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-xs sm:text-base">{t('admin.assignmentSubmissionProcess')}</h4>
                      <div className="space-y-2 sm:space-y-3">
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="assignment-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.assignmentApproval === 'auto-accept'}
                            onChange={() => setPlatformConfig({...platformConfig, assignmentApproval: 'auto-accept'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.autoAcceptSubmissions')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="assignment-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.assignmentApproval === 'instructor-review'}
                            onChange={() => setPlatformConfig({...platformConfig, assignmentApproval: 'instructor-review'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.requireInstructorReview')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="assignment-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.assignmentApproval === 'peer-review'}
                            onChange={() => setPlatformConfig({...platformConfig, assignmentApproval: 'peer-review'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.peerReviewPlusInstructor')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="radio" 
                            name="assignment-approval" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.assignmentApproval === 'ai-screening'}
                            onChange={() => setPlatformConfig({...platformConfig, assignmentApproval: 'ai-screening'})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.aiPreScreening')}</span>
                        </label>
                      </div>
                    </div>
                </div>
              </div>

                {/* Access Level Management */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">🔐 {t('admin.accessLevelManagement')}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('admin.userRole')}</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{skin.modules.notebook}</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{skin.modules.school}</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{skin.modules.community}</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{skin.modules.workspace}</th>
                          <th className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('admin.adminDashboardAccess')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs sm:text-sm">
                        <tr className="border-b">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium">{t('admin.student')}</td>
                          <td className="text-center py-2 sm:py-3 px-2 sm:px-4">
                            <select 
                              className="px-2 py-1 border-4 border-blue-400 rounded text-xs bg-white min-h-[36px]"
                            value={modulePermissions.student?.notebook || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              student: { ...modulePermissions.student, notebook: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.student?.school || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              student: { ...modulePermissions.student, school: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.student?.community || 'Read Only'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              student: { ...modulePermissions.student, community: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.student?.workspace || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              student: { ...modulePermissions.student, workspace: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.student?.AdminDashboard || 'No Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              student: { ...modulePermissions.student, AdminDashboard: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        </tr>
                        <tr>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium">{t('admin.administrator')}</td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.administrator?.notebook || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              administrator: { ...modulePermissions.administrator, notebook: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.administrator?.school || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              administrator: { ...modulePermissions.administrator, school: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.administrator?.community || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              administrator: { ...modulePermissions.administrator, community: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.administrator?.workspace || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              administrator: { ...modulePermissions.administrator, workspace: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        <td className="text-center py-3 px-4">
                          <select 
                            className="px-2 py-1 border rounded text-xs"
                            value={modulePermissions.administrator?.AdminDashboard || 'Full Access'}
                            onChange={(e) => setModulePermissions({
                              ...modulePermissions,
                              administrator: { ...modulePermissions.administrator, AdminDashboard: e.target.value }
                            })}
                          >
                            <option>{t('admin.fullAccess')}</option>
                            <option>{t('admin.readOnly')}</option>
                            <option>{t('admin.noAccess')}</option>
                          </select>
                        </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Platform-Wide Settings */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">⚙️ {t('admin.platformWideSettings')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-xs sm:text-base">{t('admin.contentModerationSettings')}</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2 min-w-[16px] min-h-[16px]" checked />
                          <span className="text-xs sm:text-sm">{t('admin.enableAIFiltering')}</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2 min-w-[16px] min-h-[16px]" checked />
                          <span className="text-xs sm:text-sm">{t('admin.flagInappropriateContent')}</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2 min-w-[16px] min-h-[16px]" />
                          <span className="text-xs sm:text-sm">{t('admin.autoModeratePosts')}</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2 min-w-[16px] min-h-[16px]" checked />
                          <span className="text-xs sm:text-sm">{t('admin.requireImageApprovalSetting')}</span>
                        </label>
                      </div>
                    </div>
                  
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-xs sm:text-base">{t('admin.securityPrivacySettings')}</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.auditLogging}
                            onChange={(e) => setPlatformConfig({...platformConfig, auditLogging: e.target.checked})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.enableAuditLogging')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.encryptData}
                            onChange={(e) => setPlatformConfig({...platformConfig, encryptData: e.target.checked})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.encryptSensitiveData')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.allowDataExport}
                            onChange={(e) => setPlatformConfig({...platformConfig, allowDataExport: e.target.checked})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.allowStudentDataExport')}</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.require2FA}
                            onChange={(e) => setPlatformConfig({...platformConfig, require2FA: e.target.checked})}
                          />
                          <span className="text-xs sm:text-sm">{t('admin.require2FAAdmins')}</span>
                        </label>
                      </div>
                    </div>
                </div>
              </div>

                {/* Integration Settings */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">🔗 {t('admin.integrationSettings')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 text-xs sm:text-base">{t('admin.externalAPIs')}</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span>Google Vision API:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{t('admin.active')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Anthropic AI:</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{t('admin.active')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>YouTube API:</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">{t('admin.limited')}</span>
                      </div>
                      </div>
                    </div>
                  
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 text-xs sm:text-base">{t('admin.notificationSettings')}</h4>
                      <div className="space-y-2">
                        <label className="flex items-center text-xs sm:text-sm">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.emailNotifications}
                            onChange={(e) => setPlatformConfig({...platformConfig, emailNotifications: e.target.checked})}
                          />
                          <span>{t('admin.emailNotifications')}</span>
                        </label>
                        <label className="flex items-center text-xs sm:text-sm">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.smsNotifications}
                            onChange={(e) => setPlatformConfig({...platformConfig, smsNotifications: e.target.checked})}
                          />
                          <span>{t('admin.smsNotifications')}</span>
                        </label>
                        <label className="flex items-center text-xs sm:text-sm">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.pushNotifications}
                            onChange={(e) => setPlatformConfig({...platformConfig, pushNotifications: e.target.checked})}
                          />
                          <span>{t('admin.pushNotifications')}</span>
                        </label>
                        <label className="flex items-center text-xs sm:text-sm">
                          <input 
                            type="checkbox" 
                            className="mr-2 min-w-[16px] min-h-[16px]" 
                            checked={platformConfig.inAppNotifications}
                            onChange={(e) => setPlatformConfig({...platformConfig, inAppNotifications: e.target.checked})}
                          />
                          <span>{t('admin.inAppNotifications')}</span>
                        </label>
                      </div>
                    </div>
                  
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2 text-xs sm:text-base">{t('admin.backupRecovery')}</h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-center">
                          <span>{t('admin.autoBackup')}:</span>
                          <select 
                            className="px-2 py-1 border-4 border-blue-400 rounded text-xs bg-white min-h-[36px]"
                          value={platformConfig.autoBackup}
                          onChange={(e) => setPlatformConfig({...platformConfig, autoBackup: e.target.value})}
                        >
                          <option value="daily">{t('admin.daily')}</option>
                          <option value="weekly">{t('admin.weekly')}</option>
                          <option value="monthly">{t('admin.monthly')}</option>
                          <option value="disabled">{t('admin.disabled')}</option>
                        </select>
                      </div>
                        <div className="flex justify-between items-center">
                          <span>{t('admin.retentionLabel')}:</span>
                          <select 
                            className="px-2 py-1 border-4 border-blue-400 rounded text-xs bg-white min-h-[36px]"
                            value={platformConfig.backupRetention}
                            onChange={(e) => setPlatformConfig({...platformConfig, backupRetention: e.target.value})}
                          >
                            <option value="30-days">{t('admin.days30')}</option>
                            <option value="90-days">{t('admin.days90')}</option>
                            <option value="1-year">{t('admin.days365')}</option>
                            <option value="indefinite">{t('admin.indefinite')}</option>
                          </select>
                        </div>
                        <button 
                          onClick={() => alert(t('admin.manualBackupInitiated'))}
                          className="w-full px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs min-h-[36px]"
                        >
                          {t('admin.manualBackupNow')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={saveModulePermissions}
                    disabled={updatingPermissions}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                    {updatingPermissions ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browse Files Modal */}
      {showBrowseFilesModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">📁 Browse & Upload Files</h2>
                <button
                  onClick={() => setShowBrowseFilesModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* File Upload Area */}
                <div className="border-4 border-dashed border-maineBlue rounded-lg p-4 sm:p-8 text-center bg-blue-50">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📁</div>
                  <h3 className="text-base sm:text-xl font-bold text-maineBlue mb-2">Select Files to Upload</h3>
                  <p className="text-xs sm:text-base text-gray-600 mb-3 sm:mb-4">Choose curriculum files, projects, assignments, or lesson plans</p>
                  
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    className="hidden" 
                    id="file-upload"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        handleFileUpload(files);
                      }
                    }}
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="bg-maineBlue text-white px-6 sm:px-8 py-2 sm:py-3 rounded-md hover:bg-blue-700 font-retro cursor-pointer inline-block text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                  >
                    Choose Files
                  </label>
                  
                  <p className="text-xs text-gray-500 mt-3 sm:mt-4">
                    Supported formats: PDF, Word, Excel, PowerPoint, Images (JPG, PNG, GIF)
                  </p>
                </div>
              
                {/* Recent Files */}
                <div className="border-4 border-maineBlue rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">📋 Recent Uploads</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                      <div className="flex items-center flex-1">
                        <span className="text-xl sm:text-2xl mr-2 sm:mr-3">📄</span>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-base truncate">{skin.name} Fundamentals Syllabus.pdf</p>
                          <p className="text-xs sm:text-sm text-gray-500">2.4 MB • Uploaded 2 hours ago</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto text-maineBlue hover:text-blue-700 font-medium text-sm sm:text-base min-h-[44px] px-4 border border-maineBlue rounded sm:border-0">Use</button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                      <div className="flex items-center flex-1">
                        <span className="text-xl sm:text-2xl mr-2 sm:mr-3">🍳</span>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-base truncate">Week 3 - {skin.content.table} Materials.docx</p>
                          <p className="text-xs sm:text-sm text-gray-500">1.8 MB • Uploaded yesterday</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto text-maineBlue hover:text-blue-700 font-medium text-sm sm:text-base min-h-[44px] px-4 border border-maineBlue rounded sm:border-0">Use</button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2 sm:gap-0">
                      <div className="flex items-center flex-1">
                        <span className="text-xl sm:text-2xl mr-2 sm:mr-3">📊</span>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-base truncate">Assignment Rubric Template.xlsx</p>
                          <p className="text-xs sm:text-sm text-gray-500">456 KB • Uploaded 3 days ago</p>
                        </div>
                      </div>
                      <button className="w-full sm:w-auto text-maineBlue hover:text-blue-700 font-medium text-sm sm:text-base min-h-[44px] px-4 border border-maineBlue rounded sm:border-0">Use</button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 text-center">
                    Files are processed immediately after selection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LTI Integration Modal */}
      {showLtiIntegrationModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">🔗 LTI 1.3 / Advantage Integration</h2>
                <button
                  onClick={() => setShowLtiIntegrationModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 text-xs sm:text-base">Configure API access and LMS launch settings for your unified dashboard.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
              <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-bold text-blue-900 mb-3 text-sm sm:text-base">LMS Provider</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Blackboard', 'Canvas', 'Moodle', 'Other'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setSelectedLtiProvider(provider)}
                      className={`px-3 py-2 rounded border-2 text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                        selectedLtiProvider === provider
                          ? 'bg-maineBlue text-white border-maineBlue'
                          : 'bg-white text-gray-700 border-blue-300 hover:bg-blue-100'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-4 border-green-400 bg-green-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-bold text-green-900 mb-2 text-sm sm:text-base text-center">Integration Workflow</h3>
                <p className="text-xs sm:text-sm text-green-900 text-center">
                  Connect <strong>{selectedLtiProvider}</strong> via LTI 1.3/Advantage, then hand off to the WorkBench deployment engine for provisioning and sync.
                </p>
              </div>

              <div className="border-4 border-yellow-400 bg-yellow-50 rounded-lg p-3 sm:p-4 text-center">
                <h3 className="font-bold text-yellow-900 mb-2 text-sm sm:text-base">Automated Token Provisioning</h3>
                <p className="text-xs sm:text-sm text-yellow-900 mb-3">
                  Admin access is verified in this dashboard. When you enable LTI, a token is automatically provisioned for deep-linking, roster sync, and grade passback.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowLtiMappingModal(true)}
                    disabled={generatingApiKey}
                    className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-retro border-2 border-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                    Configure Mapping
                  </button>
                </div>
                <a
                  href="https://www.1edtech.org/standards/lti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs sm:text-sm text-maineBlue underline hover:text-blue-700 font-medium"
                >
                  What is LTI 1.3 / Advantage?
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LTI Field Mapping Modal */}
      {showLtiMappingModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">🗺️ {selectedLtiProvider} Field Mapping</h2>
                <button
                  onClick={() => setShowLtiMappingModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 text-xs sm:text-base">
                Map LMS launch claims to your internal fields, then confirm to enable the integration.
              </p>
              <p className="text-center text-gray-500 mt-1 text-xs">
                Claim keys align with 1EdTech LTI 1.3 Core naming.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="border-4 border-blue-300 bg-blue-50 rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { key: 'internal_course_id', label: 'Internal Course ID' },
                    { key: 'internal_user_id', label: 'Internal User ID' },
                    { key: 'internal_email', label: 'Internal Email' },
                    { key: 'internal_role', label: 'Internal Role' },
                    { key: 'internal_section', label: 'Internal Section' }
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <select
                        value={ltiFieldMappings[field.key]}
                        onChange={(e) => setLtiFieldMappings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border-2 border-blue-400 rounded-md bg-white text-sm min-h-[44px]"
                      >
                        {availableLtiClaimOptions.map((claim) => (
                          <option key={claim} value={claim}>{claim}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-blue-800 mt-3">
                  Showing claim keys for <strong>{selectedLtiProvider}</strong> + standard LTI 1.3 claims.
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-6 pt-3 border-t-2 border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => setShowLtiMappingModal(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-md border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-100 font-retro min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleGenerateApiKey({ revealKey: false });
                  setShowLtiMappingModal(false);
                  setShowLtiIntegrationModal(false);
                }}
                disabled={generatingApiKey}
                className="w-full sm:w-auto px-5 py-2 rounded-md border-2 border-green-700 bg-green-600 text-white hover:bg-green-700 font-retro min-h-[44px] disabled:opacity-50"
              >
                {generatingApiKey ? t('admin.generating') : 'Confirm & Enable Integration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-green-700 font-retro">🔑 API Key Generated</h2>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                <div className="bg-green-50 border-4 border-green-400 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">✅ Success! Your API Key has been generated</h3>
                  <p className="text-center text-xs sm:text-sm text-green-700">
                    Keep this key secure and don't share it publicly. You can use this key to integrate with PorkChop's curriculum management system.
                  </p>
                </div>
              
                <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                  <label className="text-center block text-xs sm:text-sm font-medium text-gray-700 mb-2">Your API Key:</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input 
                      type="password" 
                      value={generatedApiKey}
                      readOnly
                      className="flex-1 bg-white border-4 border-blue-400 rounded-md px-2 sm:px-3 py-2 font-mono text-xs sm:text-sm min-h-[44px]"
                      id="api-key-input"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('api-key-input') as HTMLInputElement;
                        if (input) {
                          input.type = input.type === 'password' ? 'text' : 'password';
                        }
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm sm:text-base min-h-[44px]"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedApiKey);
                        alert('API Key copied to clipboard!');
                      }}
                      className="bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 text-sm sm:text-base font-retro min-h-[44px]"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Click the eye icon to show/hide the key. Click Copy to copy to clipboard.
                  </p>
                </div>
              
                <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                  <h4 className="text-center font-bold text-blue-800 mb-2 text-sm sm:text-base">📄 API Documentation</h4>
                  <p className="text-center text-xs sm:text-sm text-blue-700 mb-2 sm:mb-3">
                    Use this key to access PorkChop's curriculum management endpoints:
                  </p>
                  <ul className="text-left sm:text-center text-xs sm:text-sm text-blue-600 space-y-1">
                    <li>• <code className="bg-blue-100 px-1 rounded text-xs">POST /api/curriculum/upload</code> - Upload course materials</li>
                    <li>• <code className="bg-blue-100 px-1 rounded text-xs">GET /api/students/progress</code> - Get student progress data</li>
                    <li>• <code className="bg-blue-100 px-1 rounded text-xs">POST /api/assignments/create</code> - Create new assignments</li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      alert('API Key saved to your account settings!');
                      setShowApiKeyModal(false);
                    }}
                    className="w-full sm:w-auto bg-green-400 text-white px-6 py-2 rounded-md hover:bg-green-500 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chef Freddie Modal */}
      {showChefFreddieModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-red-400 max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-red-700 font-retro flex items-center justify-center gap-2">
                  <span className="text-2xl sm:text-3xl"></span>
                  {skin.assistant.name}: Curriculum Assistant
                </h2>
                <button
                  onClick={() => setShowChefFreddieModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-6">
                {/* Welcome Message */}
                <div className="bg-red-50 border-4 border-red-400 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-red-800 mb-2 text-sm sm:text-base">🎉 {skin.assistant.greeting}</h3>
                  <p className="text-center text-xs sm:text-sm text-red-700">
                    What would you like to work on today?
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="border-4 border-blue-300 bg-blue-50 rounded-lg p-3 sm:p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                    <div className="text-2xl sm:text-3xl mb-2">📝</div>
                    <h4 className="font-bold text-blue-800 mb-2 text-sm sm:text-base">Plan Learning Activity</h4>
                    <p className="text-xs sm:text-sm text-blue-600 mb-2 sm:mb-3">{assistantQuickActions[0]}</p>
                    <button 
                      onClick={() => handleQuickAction(assistantQuickActions[0])}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 font-retro text-xs sm:text-sm min-h-[44px]"
                    >
                      Insert Prompt
                    </button>
                  </div>
                
                  <div className="border-4 border-green-300 bg-green-50 rounded-lg p-3 sm:p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                    <div className="text-2xl sm:text-3xl mb-2">📅</div>
                    <h4 className="font-bold text-green-800 mb-2 text-sm sm:text-base">Build Lesson Sequence</h4>
                    <p className="text-xs sm:text-sm text-green-600 mb-2 sm:mb-3">{assistantQuickActions[1]}</p>
                    <button 
                      onClick={() => handleQuickAction(assistantQuickActions[1])}
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 font-retro text-xs sm:text-sm min-h-[44px]"
                    >
                      Insert Prompt
                    </button>
                  </div>
                
                  <div className="border-4 border-purple-300 bg-purple-50 rounded-lg p-3 sm:p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                    <div className="text-2xl sm:text-3xl mb-2">🏆</div>
                    <h4 className="font-bold text-purple-800 mb-2 text-sm sm:text-base">Create Assessment Rubric</h4>
                    <p className="text-xs sm:text-sm text-purple-600 mb-2 sm:mb-3">{assistantQuickActions[2]}</p>
                    <button 
                      onClick={() => handleQuickAction(assistantQuickActions[2])}
                      className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-200 font-retro text-xs sm:text-sm min-h-[44px]"
                    >
                      Insert Prompt
                    </button>
                  </div>
                
                  <div className="border-4 border-orange-300 bg-orange-50 rounded-lg p-3 sm:p-4 text-center hover:scale-105 transition-transform duration-200 cursor-pointer">
                    <div className="text-2xl sm:text-3xl mb-2">🔄</div>
                    <h4 className="font-bold text-orange-800 mb-2 text-sm sm:text-base">Apply to Modules</h4>
                    <p className="text-xs sm:text-sm text-orange-600 mb-2 sm:mb-3">Distribute curriculum to {skin.modules.workspace}, {skin.modules.notebook}</p>
                    <button 
                      onClick={() => handleQuickAction(`Help me understand how to apply my curriculum content to the different modules (${skin.modules.workspace}, ${skin.modules.notebook}, ${skin.modules.school}, ${skin.modules.community}). What types of content work best for each module?`)}
                      className="bg-orange-100 text-orange-700 px-4 py-2 rounded-md hover:bg-orange-200 font-retro text-xs sm:text-sm min-h-[44px]"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              
                {/* Chat Interface */}
                <div className="border-4 border-blue-400 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">💬 Ask {skin.assistant.name} Anything</h3>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-4 mb-3 sm:mb-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                    <div className="space-y-2 sm:space-y-3">
                      {freddieMessages.map((msg, index) => (
                        <div key={index}>
                          <div className="flex items-start gap-2 sm:gap-3">
                            {msg.sender === 'freddie' && <span className="text-xl sm:text-2xl">👨‍🍳</span>}
                            <div className={`rounded-lg p-2 sm:p-3 flex-1 ${
                              msg.sender === 'freddie' 
                                ? 'bg-pink-100' 
                                : 'bg-blue-100 ml-auto max-w-[80%]'
                            }`}>
                              <p className={`text-xs sm:text-sm ${
                                msg.sender === 'freddie' ? 'text-pink-800' : 'text-blue-800'
                              }`}>
                                {msg.text}
                              </p>
                            </div>
                            {msg.sender === 'user' && <span className="text-xl sm:text-2xl">👤</span>}
                          </div>
                          {msg.sender === 'freddie' && msg.id && index > 0 && (
                            <div className="ml-8 sm:ml-11 mt-2">
                              <button
                                onClick={() => {
                                  setCurriculumToSave({ content: msg.text, messageId: msg.id! });
                                  setShowSaveModal(true);
                                }}
                                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 border border-green-300 min-h-[36px]"
                              >
                                💾 Save as Curriculum
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {freddieLoading && (
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl">👨‍🍳</span>
                          <div className="bg-pink-100 rounded-lg p-2 sm:p-3 flex-1">
                            <p className="text-xs sm:text-sm text-pink-800">
                              {skin.assistant.name} is thinking... 🤔
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      placeholder={`Ask ${skin.assistant.name} to create curriculum...`}
                      value={freddieInput}
                      onChange={(e) => setFreddieInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !freddieLoading) {
                          sendFreddieMessage(freddieInput);
                        }
                      }}
                      disabled={freddieLoading}
                      className="flex-1 border-4 border-blue-400 rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm disabled:opacity-50 min-h-[44px]"
                    />
                    <button 
                      onClick={() => sendFreddieMessage(freddieInput)}
                      disabled={freddieLoading || !freddieInput.trim()}
                      className="w-full sm:w-auto bg-pink-400 text-white px-6 py-2 rounded-md hover:bg-pink-500 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    >
                      {freddieLoading ? 'Thinking...' : 'Ask'}
                    </button>
                  </div>
                </div>
              
                {/* Recent Curriculum */}
                <div className="border-4 border-yellow-300 bg-yellow-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-center font-bold text-yellow-800 mb-3 sm:mb-4 text-sm sm:text-base">📁 Recently Created Curriculum</h3>
                  {recentCurriculum.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-yellow-600">
                      <p className="text-xs sm:text-sm">No curriculum created yet. Start by asking {skin.assistant.name} to create something!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                    {recentCurriculum.map((item) => {
                      const typeEmoji = item.type === 'assignment' ? '📝' : item.type === 'lesson_plan' ? '📅' : item.type === 'rubric' ? '🏆' : '📄';
                      const timeAgo = new Date(item.created_at).toLocaleDateString();
                      const statusText = item.applied && item.module ? `Applied to ${item.module}` : 'Ready to apply';
                      
                        return (
                          <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-yellow-200 gap-2 sm:gap-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full sm:w-auto">
                              <span className="text-lg sm:text-xl">{typeEmoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-yellow-800 text-xs sm:text-base truncate">{item.title}</p>
                                <p className="text-xs sm:text-sm text-yellow-600">Created {timeAgo} • {statusText}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button 
                                onClick={() => {
                                  alert(`Title: ${item.title}\n\nContent:\n${item.content}`);
                                }}
                                className="text-yellow-700 hover:text-yellow-800 font-medium text-xs sm:text-sm px-2 min-h-[36px]"
                              >
                                View
                              </button>
                              {!item.applied && (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      applyCurriculumToModule(item.id, e.target.value);
                                    }
                                  }}
                                  className="text-xs border-4 border-yellow-300 rounded px-2 py-1 bg-yellow-50 min-h-[36px]"
                                  defaultValue=""
                                >
                                  <option value="">Apply to...</option>
                                  <option value="workspace">{skin.modules.workspace}</option>
                                  <option value="notebook">{skin.modules.notebook}</option>
                                  <option value="school">{skin.modules.school}</option>
                                  <option value="community">{skin.modules.community}</option>
                                </select>
                              )}
                              <button 
                                onClick={() => {
                                  if (confirm('Delete this curriculum item?')) {
                                    deleteCurriculumItem(item.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 font-medium text-sm px-2 min-h-[36px]"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Curriculum Modal */}
      {showSaveModal && curriculumToSave && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 p-6 max-w-2xl w-full">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-green-700 font-retro flex items-center justify-center gap-2">
                <span className="text-3xl">💾</span>
                Save Curriculum
              </h2>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setCurriculumToSave(null);
                }}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  id="curriculum-title"
                  placeholder="e.g., Week 5: Core Skills Assignment"
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Type *</label>
                <select
                  id="curriculum-type"
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm"
                  defaultValue="general"
                >
                  <option value="assignment">Assignment</option>
                  <option value="lesson_plan">Lesson Plan</option>
                  <option value="rubric">Rubric</option>
                  <option value="general">General Content</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Apply to Module (Optional)</label>
                <select
                  id="curriculum-module"
                  className="w-full border-2 border-gray-300 rounded-md px-3 py-2 text-sm"
                  defaultValue="none"
                >
                  <option value="none">Don't apply yet</option>
                  <option value="workspace">{skin.modules.workspace}</option>
                  <option value="notebook">{skin.modules.notebook}</option>
                  <option value="school">{skin.modules.school}</option>
                  <option value="community">{skin.modules.community}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content Preview</label>
                <div className="bg-gray-50 border-2 border-gray-300 rounded-md p-3 max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{curriculumToSave.content}</p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setCurriculumToSave(null);
                  }}
                  className="px-6 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-50 font-retro"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const title = (document.getElementById('curriculum-title') as HTMLInputElement)?.value;
                    const type = (document.getElementById('curriculum-type') as HTMLSelectElement)?.value;
                    const module = (document.getElementById('curriculum-module') as HTMLSelectElement)?.value;
                    
                    if (!title || !title.trim()) {
                      showError('Please enter a title');
                      return;
                    }
                    
                    saveCurriculumItem(title, curriculumToSave.content, type, module);
                  }}
                  disabled={savingCurriculum}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCurriculum ? 'Saving...' : 'Save Curriculum'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImportModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">Import Students from CSV</h2>
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
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 sm:p-4">
              <h3 className="font-bold text-blue-800 mb-2 text-xs sm:text-base">📋 CSV Format Requirements:</h3>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Must include an <strong>"email"</strong> column (required)</li>
                <li>Optional: <strong>"name"</strong> or <strong>"full name"</strong> column</li>
                <li>First row must be headers</li>
                <li>Example: <code className="bg-blue-100 px-1 rounded">email,name</code></li>
              </ul>
            </div>

            {/* File Upload */}
            {importStatus === 'idle' && parsedStudents.length === 0 && (
              <div className="border-4 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📤</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">Upload CSV File</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Drag and drop or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="bg-maineBlue text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 inline-block text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                >
                  Choose CSV File
                </label>
              </div>
            )}

            {/* Parsing Status */}
            {importStatus === 'parsing' && (
              <div className="text-center py-4 sm:py-8">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⏳</div>
                <p className="text-gray-600 text-sm sm:text-base">Parsing CSV file...</p>
              </div>
            )}

            {/* Preview Parsed Students */}
            {parsedStudents.length > 0 && importStatus !== 'uploading' && importStatus !== 'complete' && (
              <div>
                <h3 className="font-bold text-maineBlue mb-2 sm:mb-3 text-sm sm:text-base">📊 Preview ({parsedStudents.length} students)</h3>
                <div className="border-4 border-maineBlue rounded-lg overflow-hidden max-h-48 sm:max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedStudents.map((student, index) => (
                        <tr key={index} className={student.error ? 'bg-red-50' : ''}>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900">{student.email}</td>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">{student.name || '-'}</td>
                          <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
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
                <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {parsedStudents.filter(s => !s.error).length} valid students, {parsedStudents.filter(s => s.error).length} errors
                  </p>
                  <button
                    onClick={handleBulkImport}
                    disabled={parsedStudents.filter(s => !s.error).length === 0}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                      Import {parsedStudents.filter(s => !s.error).length} Students
                  </button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {importStatus === 'uploading' && (
              <div className="text-center py-4 sm:py-8">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⬆️</div>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Importing students...</p>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-maineBlue h-4 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">{importProgress}% complete</p>
              </div>
            )}

            {/* Success Message */}
            {importStatus === 'complete' && (
              <div className="text-center py-4 sm:py-8">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✅</div>
                <h3 className="text-lg sm:text-xl font-bold text-green-600 mb-2">Import Complete!</h3>
                <p className="text-gray-600 text-sm sm:text-base">Students have been successfully imported.</p>
              </div>
            )}

            {/* Error Message */}
            {importStatus === 'error' && (
              <div className="text-center py-4 sm:py-8">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">❌</div>
                <h3 className="text-lg sm:text-xl font-bold text-red-600 mb-2">Import Failed</h3>
                <p className="text-gray-600 text-sm sm:text-base">Please check your CSV file and try again.</p>
                <button
                  onClick={() => {
                    setImportStatus('idle');
                    setCsvFile(null);
                    setParsedStudents([]);
                  }}
                  className="mt-3 sm:mt-4 bg-maineBlue text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base min-h-[44px]"
                >
                  Try Again
                </button>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-600 font-retro">📧 Send Announcement</h2>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Subject:</label>
                <input
                  type="text"
                  value={announcementSubject}
                  onChange={(e) => setAnnouncementSubject(e.target.value)}
                  placeholder="Enter announcement subject"
                  className="w-full border-4 border-blue-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Message:</label>
                <textarea
                  rows={6}
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter your announcement message..."
                  className="w-full border-4 border-blue-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-2 text-xs sm:text-base">Recipients:</h3>
                <div className="space-y-2">
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-gray-700 text-xs sm:text-base">All Students ({users.length})</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Active Students Only</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Faculty Members</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!announcementSubject.trim() || !announcementMessage.trim()) {
                      showWarning('Please enter both subject and message');
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
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  {sendingAnnouncement ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Student Data Modal */}
      {showExportDataModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-purple-600 font-retro">📄 Export Student Data</h2>
                <button
                  onClick={() => setShowExportDataModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4 bg-purple-50">
                <h3 className="font-bold text-purple-800 mb-2 text-xs sm:text-base">Export Options:</h3>
                <div className="space-y-2">
                  <label className="flex items-center min-h-[44px]">
                    <input type="radio" name="exportType" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-gray-700 text-xs sm:text-base">All Student Records (CSV)</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="radio" name="exportType" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Active Students Only (CSV)</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="radio" name="exportType" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Student Progress Report (PDF)</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="radio" name="exportType" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Complete Data Export (JSON)</span>
                  </label>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                <h3 className="font-bold text-purple-800 mb-2 text-xs sm:text-base">Data Fields to Include:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-xs sm:text-sm text-gray-700">Name & Email</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-xs sm:text-sm text-gray-700">XP & Level</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-xs sm:text-sm text-gray-700">Subscription Status</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Progress Data</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Last Login</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Achievements</span>
                  </label>
                </div>
              </div>
              <div className="bg-gray-50 border-4 border-gray-300 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  <strong>Total Records:</strong> {users.length} students
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  <strong>Export Format:</strong> CSV (Comma-Separated Values)
                </p>
              </div>
              <div className="flex justify-end">
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
                      const filename = `student-data-${timestamp}.csv`;
                      downloadFile(csv, filename);
                      
                      // Show success modal
                      setDownloadedReportInfo({
                        type: 'Student Data',
                        count: data.length,
                        filename: filename
                      });
                      setShowDownloadSuccessModal(true);
                      setShowExportDataModal(false);
                    } catch (error: any) {
                      console.error('Error exporting data:', error);
                      alert('Failed to export data: ' + error.message);
                    } finally {
                      setExportingData(false);
                    }
                  }}
                  disabled={exportingData}
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  {exportingData ? 'Exporting...' : 'Download Export'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Faculty Modal */}
      {showAddFacultyModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-600 font-retro">👥 Add New Faculty</h2>
                <button
                  onClick={() => setShowAddFacultyModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Full Name:</label>
                <input
                  type="text"
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="Enter instructor's full name"
                  className="w-full border-4 border-blue-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Email Address:</label>
                <input
                  type="email"
                  value={newFacultyEmail}
                  onChange={(e) => setNewFacultyEmail(e.target.value)}
                  placeholder="instructor@example.com"
                  className="w-full border-4 border-blue-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                />
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-2 text-xs sm:text-base">Role & Permissions:</h3>
                <div className="space-y-2">
                  <label className="flex items-center min-h-[44px]">
                    <input 
                      type="radio" 
                      name="role" 
                      className="mr-2 w-5 h-5" 
                      checked={newFacultyRole === 'Instructor'}
                      onChange={() => setNewFacultyRole('Instructor')}
                    />
                    <span className="text-gray-700 text-xs sm:text-base">Instructor - Can teach courses and grade assignments</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input 
                      type="radio" 
                      name="role" 
                      className="mr-2 w-5 h-5" 
                      checked={newFacultyRole === 'Teaching Assistant'}
                      onChange={() => setNewFacultyRole('Teaching Assistant')}
                    />
                    <span className="text-gray-700 text-xs sm:text-base">Teaching Assistant - Limited grading access</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input 
                      type="radio" 
                      name="role" 
                      className="mr-2 w-5 h-5" 
                      checked={newFacultyRole === 'Department Head'}
                      onChange={() => setNewFacultyRole('Department Head')}
                    />
                    <span className="text-gray-700 text-xs sm:text-base">Department Head - Full curriculum management</span>
                  </label>
                </div>
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                <h3 className="font-bold text-blue-800 mb-2 text-xs sm:text-base">Course Assignments:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Core Techniques</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Seafood Safety</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Baking Fundamentals</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-xs sm:text-sm text-gray-700">Core Techniques</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!newFacultyName.trim() || !newFacultyEmail.trim()) {
                      showWarning('Please enter faculty name and email');
                      return;
                    }
                    
                    setAddingFaculty(true);
                    try {
                      // Insert into faculty table
                      const { data, error } = await supabase
                        .from('faculty')
                        .insert({
                          full_name: newFacultyName,
                          email: newFacultyEmail,
                          role: newFacultyRole,
                          status: 'Active',
                          students_count: 0
                        })
                        .select()
                        .single();
                      
                      if (error) throw error;
                      
                      // Update local state for UI
                      const initials = newFacultyName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                      const randomColor = colors[Math.floor(Math.random() * colors.length)];
                      
                      const newFaculty = {
                        id: data.id,
                        name: newFacultyName,
                        email: newFacultyEmail,
                        role: newFacultyRole,
                        status: 'Active',
                        courses: '',
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
                    } catch (error: any) {
                      console.error('Error adding faculty:', error);
                      alert('Failed to add faculty: ' + error.message);
                    } finally {
                      setAddingFaculty(false);
                    }
                  }}
                  disabled={addingFaculty}
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  {addingFaculty ? 'Adding...' : 'Send Invitation'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  <option value={skin.people.defaultProgram}>{skin.people.defaultProgram}</option>
                  <option value="Advanced Program">Advanced Program</option>
                  <option value="Specialized Track">Specialized Track</option>
                  <option value="Management Program">Management Program</option>
                  <option value="Industry Leadership">Industry Leadership</option>
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
                onClick={async () => {
                  if (!newStudentName.trim() || !newStudentEmail.trim()) {
                    showWarning('Please enter student name and email');
                    return;
                  }
                  
                  try {
                    // Insert into profiles table
                    const { data, error } = await supabase
                      .from('profiles')
                      .insert({
                        email: newStudentEmail,
                        username: newStudentName,
                        xp: 0,
                        level: 1,
                        chat_count: 0,
                        created_at: new Date().toISOString()
                      })
                      .select()
                      .single();
                    
                    if (error) throw error;
                    
                    // Add to local state
                    const newStudent = {
                      id: data.id,
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
                    setNewStudentProgram(skin.people.defaultProgram);
                    setShowAddStudentModal(false);
                    
                    alert('Student added successfully!');
                  } catch (error: any) {
                    console.error('Error adding student:', error);
                    alert('Failed to add student: ' + error.message);
                  }
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
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-600 font-retro">✏️ Edit Student</h2>
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
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={editingStudent.username || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, username: e.target.value})}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-sm min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingStudent.email || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  placeholder="student@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-sm min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value="(555) 123-4567"
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-sm min-h-[44px]"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  value={`Bachelor's Degree in ${skin.name}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maineBlue text-sm min-h-[44px]"
                >
                  <option value={`Bachelor's Degree in ${skin.name}`}>{`Bachelor's Degree in ${skin.name}`}</option>
                  <option value={`Associate's Degree in ${skin.name}`}>{`Associate's Degree in ${skin.name}`}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Cohorts (Select Multiple)</label>
                <div className="border border-gray-300 rounded-md">
                  {/* Fixed top section - doesn't scroll */}
                  <div className="p-2 sm:p-3 space-y-2 border-b border-gray-300 bg-gray-50">
                    {/* Add Cohort Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add custom cohort..."
                        className="flex-1 px-2 py-2 border border-gray-300 rounded text-xs sm:text-sm min-h-[44px]"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            const customCohort = input.value.trim();
                            if (customCohort) {
                              const cohorts = (editingStudent as any).cohorts || [];
                              const cohortId = customCohort.toLowerCase().replace(/\s+/g, '_');
                              if (!cohorts.includes(cohortId)) {
                                setEditingStudent({...editingStudent, cohorts: [...cohorts, cohortId]} as any);
                              }
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <span className="text-xs text-gray-500 self-center hidden sm:inline">Press Enter</span>
                    </div>
                    
                    {/* All Students */}
                    <label className="flex items-center cursor-pointer hover:bg-white p-1 rounded min-h-[44px]">
                      <input 
                        type="checkbox" 
                        className="mr-2 w-4 h-4"
                        checked={(editingStudent as any).cohorts?.includes('all_students')}
                        onChange={(e) => {
                          const cohorts = (editingStudent as any).cohorts || [];
                          if (e.target.checked) {
                            setEditingStudent({...editingStudent, cohorts: [...cohorts, 'all_students']} as any);
                          } else {
                            setEditingStudent({...editingStudent, cohorts: cohorts.filter((c: string) => c !== 'all_students')} as any);
                          }
                        }}
                      />
                      <span className="text-xs sm:text-sm font-medium">All Students</span>
                    </label>
                    
                    {/* All Faculty */}
                    <label className="flex items-center cursor-pointer hover:bg-white p-1 rounded min-h-[44px]">
                      <input 
                        type="checkbox" 
                        className="mr-2 w-4 h-4"
                        checked={(editingStudent as any).cohorts?.includes('all_faculty')}
                        onChange={(e) => {
                          const cohorts = (editingStudent as any).cohorts || [];
                          if (e.target.checked) {
                            setEditingStudent({...editingStudent, cohorts: [...cohorts, 'all_faculty']} as any);
                          } else {
                            setEditingStudent({...editingStudent, cohorts: cohorts.filter((c: string) => c !== 'all_faculty')} as any);
                          }
                        }}
                      />
                      <span className="text-xs sm:text-sm font-medium">All Faculty</span>
                    </label>
                    
                    {/* All Alumni */}
                    <label className="flex items-center cursor-pointer hover:bg-white p-1 rounded min-h-[44px]">
                      <input 
                        type="checkbox" 
                        className="mr-2 w-4 h-4"
                        checked={(editingStudent as any).cohorts?.includes('alumni')}
                        onChange={(e) => {
                          const cohorts = (editingStudent as any).cohorts || [];
                          if (e.target.checked) {
                            setEditingStudent({...editingStudent, cohorts: [...cohorts, 'alumni']} as any);
                          } else {
                            setEditingStudent({...editingStudent, cohorts: cohorts.filter((c: string) => c !== 'alumni')} as any);
                          }
                        }}
                      />
                      <span className="text-xs sm:text-sm font-medium">All Alumni</span>
                    </label>
                  </div>
                  
                  {/* Scrollable cohort list */}
                  <div className="p-2 sm:p-3 space-y-2 max-h-40 overflow-y-auto">
                  <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[44px]">
                    <input 
                      type="checkbox" 
                      className="mr-2 w-4 h-4"
                      checked={(editingStudent as any).cohorts?.includes('class_2025')}
                      onChange={(e) => {
                        const cohorts = (editingStudent as any).cohorts || [];
                        if (e.target.checked) {
                          setEditingStudent({...editingStudent, cohorts: [...cohorts, 'class_2025']} as any);
                        } else {
                          setEditingStudent({...editingStudent, cohorts: cohorts.filter((c: string) => c !== 'class_2025')} as any);
                        }
                      }}
                    />
                    <span className="text-xs sm:text-sm">Class of 2025</span>
                  </label>
                  <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[44px]">
                    <input 
                      type="checkbox" 
                      className="mr-2 w-4 h-4"
                      checked={(editingStudent as any).cohorts?.includes('class_2026')}
                      onChange={(e) => {
                        const cohorts = (editingStudent as any).cohorts || [];
                        if (e.target.checked) {
                          setEditingStudent({...editingStudent, cohorts: [...cohorts, 'class_2026']} as any);
                        } else {
                          setEditingStudent({...editingStudent, cohorts: cohorts.filter((c: string) => c !== 'class_2026')} as any);
                        }
                      }}
                    />
                    <span className="text-xs sm:text-sm">Class of 2026</span>
                  </label>
                  <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[44px]">
                    <input 
                      type="checkbox" 
                      className="mr-2 w-4 h-4"
                      checked={(editingStudent as any).cohorts?.includes('class_2027')}
                      onChange={(e) => {
                        const cohorts = (editingStudent as any).cohorts || [];
                        if (e.target.checked) {
                          setEditingStudent({...editingStudent, cohorts: [...cohorts, 'class_2027']} as any);
                        } else {
                          setEditingStudent({...editingStudent, cohorts: cohorts.filter((c: string) => c !== 'class_2027')} as any);
                        }
                      }}
                    />
                    <span className="text-xs sm:text-sm">Class of 2027</span>
                  </label>
                  </div>
                </div>
              </div>
            </div>
            
              <div className="flex justify-end mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    if (!editingStudent.username?.trim() || !editingStudent.email?.trim()) {
                      showWarning('Please enter student name and email');
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
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm min-h-[44px]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showManagePermissionsModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-green-600 font-retro">🔐 Manage Permissions</h2>
                <button
                  onClick={() => setShowManagePermissionsModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div className="border-4 border-green-400 rounded-lg p-3 sm:p-4 bg-green-50">
                <h3 className="font-bold text-green-800 mb-2 sm:mb-3 text-xs sm:text-base">Faculty Members:</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-white border-2 border-green-300 rounded-lg p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{facultyList[0]?.name || skin.people.mockFaculty[0].name}</p>
                        <p className="text-xs text-gray-600">julia.martinez@{skin.people.emailDomain}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block w-fit">{facultyList[0]?.role || skin.people.mockFaculty[0].role}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">Grade Assignments</span>
                      </label>
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">Manage Students</span>
                      </label>
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" />
                        <span className="text-gray-700">Edit Curriculum</span>
                      </label>
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">View Reports</span>
                      </label>
                      </div>
                    </div>
                  <div className="bg-white border-2 border-green-300 rounded-lg p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{facultyList[1]?.name || skin.people.mockFaculty[1].name}</p>
                        <p className="text-xs text-gray-600">marcus.chen@{skin.people.emailDomain}</p>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded inline-block w-fit">{facultyList[1]?.role || skin.people.mockFaculty[1].role}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">Grade Assignments</span>
                      </label>
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">Manage Students</span>
                      </label>
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">Edit Curriculum</span>
                      </label>
                      <label className="flex items-center text-xs sm:text-sm min-h-[44px]">
                        <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                        <span className="text-gray-700">View Reports</span>
                      </label>
                      </div>
                    </div>
                </div>
              </div>
              <div className="flex justify-end">
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
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  {updatingPermissions ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Reports Modal */}
      {showFacultyReportsModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-purple-600 font-retro">📊 Faculty Reports</h2>
                <button
                  onClick={() => setShowFacultyReportsModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4 bg-purple-50 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">5</div>
                  <p className="text-xs sm:text-sm text-purple-800 font-medium mt-1">Active Faculty</p>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4 bg-blue-50 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">142</div>
                  <p className="text-xs sm:text-sm text-blue-800 font-medium mt-1">Students Taught</p>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-3 sm:p-4 bg-green-50 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">4.7</div>
                  <p className="text-xs sm:text-sm text-green-800 font-medium mt-1">Avg. Rating</p>
                </div>
              </div>
              <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                <h3 className="font-bold text-purple-800 mb-2 sm:mb-3 text-xs sm:text-base">Faculty Performance:</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{facultyList[0]?.name || skin.people.mockFaculty[0].name}</p>
                      <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-2 py-1 rounded inline-block w-fit">Excellent</span>
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
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{facultyList[1]?.name || skin.people.mockFaculty[1].name}</p>
                      <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-2 py-1 rounded inline-block w-fit">Excellent</span>
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
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{skin.people.facultyTitle} Sarah Williams</p>
                      <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block w-fit">Good</span>
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
              <div className="flex justify-end">
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
                      const filename = `faculty-report-${timestamp}.csv`;
                      downloadFile(csv, filename);
                      
                      // Show success modal
                      setDownloadedReportInfo({
                        type: 'Faculty Report',
                        count: data.length,
                        filename: filename
                      });
                      setShowDownloadSuccessModal(true);
                    } catch (error: any) {
                      console.error('Error exporting faculty:', error);
                      alert('Failed to export: ' + error.message);
                    } finally {
                      setExportingFaculty(false);
                    }
                  }}
                  disabled={exportingFaculty}
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  {exportingFaculty ? 'Exporting...' : 'Export Report'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Newsletter Modal */}
      {showAlumniNewsletterModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-600 font-retro">📧 Alumni Newsletter</h2>
                <button
                  onClick={() => setShowAlumniNewsletterModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Newsletter Title:</label>
                <input
                  type="text"
                  value={newsletterTitle}
                  onChange={(e) => setNewsletterTitle(e.target.value)}
                  placeholder="e.g., Monthly Alumni Update - January 2025"
                  className="w-full border-4 border-blue-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Content:</label>
                <textarea
                  rows={8}
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  placeholder="Share alumni success stories, upcoming events, job opportunities, and program updates..."
                  className="w-full border-4 border-blue-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4 bg-blue-50">
                <h3 className="font-bold text-blue-800 mb-2 text-xs sm:text-base">Include Sections:</h3>
                <div className="space-y-2">
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-gray-700 text-xs sm:text-base">Alumni Spotlight</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" defaultChecked />
                    <span className="text-gray-700 text-xs sm:text-base">Job Opportunities</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Upcoming Events</span>
                  </label>
                  <label className="flex items-center min-h-[44px]">
                    <input type="checkbox" className="mr-2 w-5 h-5" />
                    <span className="text-gray-700 text-xs sm:text-base">Program Updates</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    if (!newsletterTitle.trim() || !newsletterContent.trim()) {
                      showWarning('Please enter both title and content');
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
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Alumni Newsletter Sent',
                        count: notifications.length,
                        filename: `${notifications.length} alumni notified`
                      });
                      setShowDownloadSuccessModal(true);
                      
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
                  className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                >
                  {sendingNewsletter ? 'Sending...' : 'Send Newsletter'}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alumni Modal */}
      {showEditAlumniModal && editingAlumni && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">✏️ Edit Alumni</h2>
                <button
                  onClick={() => {
                    setShowEditAlumniModal(false);
                    setEditingAlumni(null);
                  }}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Full Name:</label>
                  <input
                    type="text"
                    value={editingAlumni.name}
                    onChange={(e) => setEditingAlumni({...editingAlumni, name: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Email:</label>
                  <input
                    type="email"
                    value={editingAlumni.email}
                    onChange={(e) => setEditingAlumni({...editingAlumni, email: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Graduation Year:</label>
                  <input
                    type="text"
                    value={editingAlumni.graduationYear}
                    onChange={(e) => setEditingAlumni({...editingAlumni, graduationYear: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Current Position:</label>
                  <input
                    type="text"
                    value={editingAlumni.position}
                    onChange={(e) => setEditingAlumni({...editingAlumni, position: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Employer:</label>
                  <input
                    type="text"
                    value={editingAlumni.employer}
                    onChange={(e) => setEditingAlumni({...editingAlumni, employer: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Salary/Revenue:</label>
                  <input
                    type="text"
                    value={editingAlumni.salary}
                    onChange={(e) => setEditingAlumni({...editingAlumni, salary: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      // Update the alumni in the list
                      setAlumniList(prev => prev.map(a => 
                        a.id === editingAlumni.id ? editingAlumni : a
                      ));
                      setShowEditAlumniModal(false);
                      setEditingAlumni(null);
                      alert('Alumni information updated successfully!');
                    }}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditFacultyModal && editingFaculty && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue font-retro">✏️ Edit Faculty</h2>
                <button
                  onClick={() => {
                    setShowEditFacultyModal(false);
                    setEditingFaculty(null);
                  }}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Full Name:</label>
                  <input
                    type="text"
                    value={editingFaculty.name}
                    onChange={(e) => setEditingFaculty({...editingFaculty, name: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Email:</label>
                  <input
                    type="email"
                    value={editingFaculty.email}
                    onChange={(e) => setEditingFaculty({...editingFaculty, email: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Role:</label>
                  <input
                    type="text"
                    value={editingFaculty.role}
                    onChange={(e) => setEditingFaculty({...editingFaculty, role: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Courses:</label>
                  <input
                    type="text"
                    value={editingFaculty.courses}
                    onChange={(e) => setEditingFaculty({...editingFaculty, courses: e.target.value})}
                    placeholder="e.g., Core Techniques, Advanced Systems"
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Status:</label>
                  <select
                    value={editingFaculty.status}
                    onChange={(e) => setEditingFaculty({...editingFaculty, status: e.target.value})}
                    className="w-full border-4 border-maineBlue rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      // Update the faculty in the list
                      setFacultyList(prev => prev.map(f => 
                        f.id === editingFaculty.id ? editingFaculty : f
                      ));
                      setShowEditFacultyModal(false);
                      setEditingFaculty(null);
                      alert('Faculty information updated successfully!');
                    }}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Alumni Event Modal */}
      {showPlanEventModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-green-600 font-retro">🎉 Plan Alumni Event</h2>
                <button
                  onClick={() => setShowPlanEventModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Scheduled Events:</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select 
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="flex-1 border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm sm:text-base min-h-[44px]"
                    >
                      <option value="">-- View Existing Event --</option>
                      <option value="event-1">Class of 2020 Reunion - March 15, 2025</option>
                      <option value="event-2">Spring Networking Event - April 10, 2025</option>
                      <option value="event-3">Annual Gala 2025 - May 20, 2025</option>
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedEventId) {
                          showWarning('Please select an event first');
                          return;
                        }
                        setShowViewEventModal(true);
                      }}
                      className="w-full sm:w-auto bg-green-400 text-white px-6 py-2 rounded-md hover:bg-green-500 font-retro whitespace-nowrap text-sm sm:text-base min-h-[44px]"
                    >
                      View
                    </button>
                  </div>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 sm:pt-4">
                  <h3 className="text-center font-bold text-green-800 mb-3 sm:mb-4 text-xs sm:text-base"></h3>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Event Name:</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Annual Alumni Reunion 2025"
                    className="w-full border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Date:</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Time:</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Location:</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Venue name and address"
                    className="w-full border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Event Type:</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="networking">Networking Event</option>
                    <option value="reunion">Reunion Dinner</option>
                    <option value="career_fair">Career Fair</option>
                    <option value="workshop">Skills Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Event Description:</label>
                  <textarea
                    rows={4}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Describe the event, activities, and what alumni can expect..."
                    className="w-full border-4 border-green-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      if (!eventName.trim() || !eventDate || !eventTime) {
                        showWarning('Please enter event name, date, and time');
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
                        
                        // Show branded success modal
                        setDownloadedReportInfo({
                          type: 'Alumni Event Created',
                          count: 1,
                          filename: `${eventName} on ${eventDate}`
                        });
                        setShowDownloadSuccessModal(true);
                        
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
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                    {creatingEvent ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gifting & Donations Modal */}
      {showGiftingDonationsModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-purple-600 font-retro">📄 Gifting & Donations</h2>
                <button
                  onClick={() => setShowGiftingDonationsModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                  <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4 bg-purple-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">$45,000</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium mt-1">Total Raised</p>
                  </div>
                  <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4 bg-blue-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">127</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium mt-1">Donors</p>
                  </div>
                  <div className="border-4 border-green-400 rounded-lg p-3 sm:p-4 bg-green-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">$354</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium mt-1">Avg. Donation</p>
                  </div>
                </div>
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4 bg-purple-50">
                  <h3 className="font-bold text-purple-800 mb-2 sm:mb-3 text-sm sm:text-base">Active Campaigns:</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-2 sm:p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-900 text-xs sm:text-base">Scholarship Fund 2025</p>
                        <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <p className="text-xs text-gray-600">$22,500 of $30,000 goal</p>
                    </div>
                    <div className="bg-white border-2 border-purple-300 rounded-lg p-2 sm:p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-gray-900 text-xs sm:text-base">New Lab Equipment</p>
                        <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '45%'}}></div>
                      </div>
                      <p className="text-xs text-gray-600">$13,500 of $30,000 goal</p>
                      </div>
                    </div>
                </div>
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-purple-800 mb-2 text-sm sm:text-base">Create New Campaign:</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Campaign name"
                      className="w-full border-4 border-purple-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base min-h-[44px]"
                    />
                    <input
                      type="number"
                      value={campaignGoal}
                      onChange={(e) => setCampaignGoal(e.target.value)}
                      placeholder="Fundraising goal ($)"
                      className="w-full border-4 border-purple-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base min-h-[44px]"
                    />
                    <textarea
                      rows={3}
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      placeholder="Campaign description..."
                      className="w-full border-4 border-purple-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      try {
                        // Generate donor list data
                        const donorData = [
                          { name: 'John Smith', email: 'john.s@email.com', amount: 500, date: '2024-11-15', campaign: 'Scholarship Fund 2025' },
                          { name: 'Mary Johnson', email: 'mary.j@email.com', amount: 250, date: '2024-11-18', campaign: 'Scholarship Fund 2025' },
                          { name: 'Robert Davis', email: 'robert.d@email.com', amount: 1000, date: '2024-11-20', campaign: 'New Lab Equipment' },
                          { name: 'Sarah Wilson', email: 'sarah.w@email.com', amount: 150, date: '2024-11-22', campaign: 'Scholarship Fund 2025' },
                          { name: 'Michael Brown', email: 'michael.b@email.com', amount: 750, date: '2024-11-23', campaign: 'New Lab Equipment' }
                        ];
                        
                        const csv = convertToCSV(donorData);
                        const timestamp = new Date().toISOString().split('T')[0];
                        const filename = `donor-list-${timestamp}.csv`;
                        downloadFile(csv, filename);
                        
                        // Show branded success modal
                        setDownloadedReportInfo({
                          type: 'Donor List',
                          count: donorData.length,
                          filename: filename
                        });
                        setShowDownloadSuccessModal(true);
                        setShowGiftingDonationsModal(false);
                      } catch (error: any) {
                        console.error('Error exporting donor list:', error);
                        alert('Failed to export: ' + error.message);
                      }
                    }}
                    className="w-full sm:w-auto bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    📊 Export Donor List
                  </button>
                  <button
                    onClick={async () => {
                      if (!campaignName.trim() || !campaignGoal) {
                        showWarning('Please enter campaign name and goal');
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
                        
                        // Show branded success modal
                        setDownloadedReportInfo({
                          type: 'Fundraising Campaign Created',
                          count: 1,
                          filename: `${campaignName} - Goal: $${campaignGoal}`
                        });
                        setShowDownloadSuccessModal(true);
                        
                        setCampaignName('');
                        setCampaignGoal('');
                        setCampaignDescription('');
                        setShowGiftingDonationsModal(false);
                      } catch (error: any) {
                        console.error('Error creating campaign:', error);
                        alert('Failed to create campaign: ' + error.message);
                      } finally {
                        setCreatingCampaign(false);
                      }
                    }}
                    disabled={creatingCampaign}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                    {creatingCampaign ? 'Creating...' : 'Launch Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Employment Data Modal */}
      {showEmploymentDataModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-green-600 font-retro">📈 Employment Data</h2>
                <button
                  onClick={() => setShowEmploymentDataModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">Monitor graduate employment rates and job placement statistics.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="border-4 border-green-400 rounded-lg p-2 sm:p-4 bg-green-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">87%</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium mt-1">Employment Rate</p>
                  </div>
                  <div className="border-4 border-blue-400 rounded-lg p-2 sm:p-4 bg-blue-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">156</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium mt-1">Graduates Placed</p>
                  </div>
                  <div className="border-4 border-purple-400 rounded-lg p-2 sm:p-4 bg-purple-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">$52k</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium mt-1">Avg. Starting Salary</p>
                  </div>
                  <div className="border-4 border-orange-400 rounded-lg p-2 sm:p-4 bg-orange-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600">45</div>
                    <p className="text-xs sm:text-sm text-orange-800 font-medium mt-1">Days to Placement</p>
                  </div>
                </div>
                <div className="border-4 border-green-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">Recent Placements:</h3>
                  <div className="space-y-2">
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Sarah Johnson</p>
                        <p className="text-xs text-gray-600 truncate">{skin.people.mockAlumniTitles[0]} • Industry Partner</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">Placed</span>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Michael Chen</p>
                        <p className="text-xs text-gray-600 truncate">{skin.people.mockAlumniTitles[1]} • Industry Partner</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">Placed</span>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Emma Rodriguez</p>
                        <p className="text-xs text-gray-600 truncate">{skin.people.mockAlumniTitles[2]} • Industry Partner</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">Placed</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
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
                      const filename = `employment-report-${timestamp}.csv`;
                      downloadFile(csv, filename);
                      
                      // Show success modal
                      setDownloadedReportInfo({
                        type: 'Employment Report',
                        count: data.length,
                        filename: filename
                      });
                      setShowDownloadSuccessModal(true);
                    } catch (error: any) {
                      console.error('Error exporting employment data:', error);
                      alert('Failed to export: ' + error.message);
                    } finally {
                      setExportingEmployment(false);
                    }
                    }}
                    disabled={exportingEmployment}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                    {exportingEmployment ? 'Exporting...' : 'Export Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Partners Modal */}
      {showManagePartnersModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-blue-400 max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-600 font-retro">🤝 Industry Partners</h2>
                <button
                  onClick={() => setShowManagePartnersModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">Manage relationships with employers and hiring partners across {skin.name} industries.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4 bg-blue-50">
                  <h3 className="font-bold text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">Active Partners (4):</h3>
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-white border-2 border-blue-300 rounded-lg p-3 sm:p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">The French Laundry</p>
                            <p className="text-xs text-gray-600">Yountville, CA</p>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">Active</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-2 sm:mt-3">
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
                        <button
                          onClick={() => {
                            setEditingPartnerId('partner-1');
                            setIsEditMode(true);
                            setPartnerName('The French Laundry');
                            setPartnerLocation('Yountville, CA');
                            setPartnerEmail('contact@frenchlaundry.com');
                            setPartnerPhone('(707) 944-2380');
                            setPartnerStudentsHired('12');
                            setPartnerOpenPositions('3');
                            setPartnershipYear('2020');
                          }}
                          className="mt-2 sm:mt-3 w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-200 font-retro text-xs sm:text-sm border-2 border-yellow-400 min-h-[44px]"
                        >
                          ✏️ Edit Partner
                        </button>
                      </div>
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-base sm:text-lg">{skin.name} Employer Prime</p>
                        <p className="text-xs sm:text-sm text-gray-600">New York, NY</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm mt-3">
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
                    <button
                      onClick={() => {
                        setEditingPartnerId('partner-2');
                        setIsEditMode(true);
                        setPartnerName(`${skin.name} Employer Prime`);
                        setPartnerLocation('New York, NY');
                        setPartnerEmail(`partners@${skin.people.emailDomain}`);
                        setPartnerPhone('(212) 889-0905');
                        setPartnerStudentsHired('8');
                        setPartnerOpenPositions('2');
                        setPartnershipYear('2019');
                      }}
                      className="mt-3 w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-200 font-retro text-sm border-2 border-yellow-400 min-h-[44px]"
                    >
                      ✏️ Edit Partner
                    </button>
                  </div>
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-base sm:text-lg">{skin.name} Employer A</p>
                        <p className="text-xs sm:text-sm text-gray-600">Chicago, IL</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm mt-3">
                      <div>
                        <p className="text-gray-600">Students Hired: <strong>15</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Open Positions: <strong>5</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Partnership Since: <strong>2018</strong></p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPartnerId('partner-3');
                        setIsEditMode(true);
                        setPartnerName(`${skin.name} Employer A`);
                        setPartnerLocation('Chicago, IL');
                        setPartnerEmail(`careers@${skin.people.emailDomain}`);
                        setPartnerPhone('(312) 867-0110');
                        setPartnerStudentsHired('15');
                        setPartnerOpenPositions('5');
                        setPartnershipYear('2018');
                      }}
                      className="mt-3 w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-200 font-retro text-sm border-2 border-yellow-400 min-h-[44px]"
                    >
                      ✏️ Edit Partner
                    </button>
                  </div>
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-base sm:text-lg">{skin.name} Employer B</p>
                        <p className="text-xs sm:text-sm text-gray-600">New York, NY</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm mt-3">
                      <div>
                        <p className="text-gray-600">Students Hired: <strong>10</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Open Positions: <strong>4</strong></p>
                      </div>
                      <div>
                        <p className="text-gray-600">Partnership Since: <strong>2021</strong></p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPartnerId('partner-4');
                        setIsEditMode(true);
                        setPartnerName(`${skin.name} Employer B`);
                        setPartnerLocation('New York, NY');
                        setPartnerEmail(`hiring@${skin.people.emailDomain}`);
                        setPartnerPhone('(212) 554-1515');
                        setPartnerStudentsHired('10');
                        setPartnerOpenPositions('4');
                        setPartnershipYear('2021');
                      }}
                      className="mt-3 w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md hover:bg-yellow-200 font-retro text-sm border-2 border-yellow-400 min-h-[44px]"
                    >
                      ✏️ Edit Partner
                    </button>
                  </div>
                    </div>
                  </div>
                </div>
                <div className="border-4 border-blue-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-blue-800 mb-2 text-sm sm:text-base">{isEditMode ? 'Edit Partner:' : 'Add New Partner:'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Employer/Company Name"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <input
                      type="text"
                      value={partnerLocation}
                      onChange={(e) => setPartnerLocation(e.target.value)}
                      placeholder="Location"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="Contact Email"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <input
                      type="tel"
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <input
                      type="number"
                      value={partnerStudentsHired}
                      onChange={(e) => setPartnerStudentsHired(e.target.value)}
                      placeholder="Students Hired"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <input
                      type="number"
                      value={partnerOpenPositions}
                      onChange={(e) => setPartnerOpenPositions(e.target.value)}
                      placeholder="Open Positions"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <input
                      type="number"
                      value={partnershipYear}
                      onChange={(e) => setPartnershipYear(e.target.value)}
                      placeholder="Partnership Since (Year)"
                      className="border-4 border-blue-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setIsEditMode(false);
                        setEditingPartnerId(null);
                        setPartnerName('');
                        setPartnerLocation('');
                        setPartnerEmail('');
                        setPartnerPhone('');
                        setPartnerStudentsHired('');
                        setPartnerOpenPositions('');
                        setPartnershipYear('');
                      }}
                      className="w-full sm:w-auto bg-gray-400 text-white px-6 py-2 rounded-md hover:bg-gray-500 font-retro text-sm sm:text-base min-h-[44px]"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                  onClick={async () => {
                    if (!partnerName.trim() || !partnerLocation.trim()) {
                      showWarning('Please enter at least partner name and location');
                      return;
                    }
                    
                    if (isEditMode && editingPartnerId) {
                      // Update existing partner
                      setAddingPartner(true);
                      try {
                        const { error } = await supabase
                          .from('industry_partners')
                          .update({
                            name: partnerName,
                            location: partnerLocation,
                            contact_email: partnerEmail || null,
                            contact_phone: partnerPhone || null,
                            students_hired: parseInt(partnerStudentsHired) || 0,
                            open_positions: parseInt(partnerOpenPositions) || 0,
                            partnership_since: parseInt(partnershipYear) || new Date().getFullYear()
                          })
                          .eq('id', editingPartnerId);
                        
                        if (error) throw error;
                        
                        showSuccess(`Partner "${partnerName}" updated successfully!`);
                        
                        setPartnerName('');
                        setPartnerLocation('');
                        setPartnerEmail('');
                        setPartnerPhone('');
                        setPartnerStudentsHired('');
                        setPartnerOpenPositions('');
                        setPartnershipYear('');
                        setIsEditMode(false);
                        setEditingPartnerId(null);
                        setShowManagePartnersModal(false);
                      } catch (error: any) {
                        console.error('Error updating partner:', error);
                        showError('Failed to update partner: ' + error.message);
                      } finally {
                        setAddingPartner(false);
                      }
                      return;
                    }
                    
                    // Add new partner
                    setAddingPartner(true);
                    try {
                      const { error } = await supabase
                        .from('industry_partners')
                        .insert({
                          name: partnerName,
                          location: partnerLocation,
                          contact_email: partnerEmail || null,
                          contact_phone: partnerPhone || null,
                          students_hired: parseInt(partnerStudentsHired) || 0,
                          open_positions: parseInt(partnerOpenPositions) || 0,
                          partnership_since: parseInt(partnershipYear) || new Date().getFullYear()
                        });
                      
                      if (error) throw error;
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Industry Partner Added',
                        count: 1,
                        filename: `${partnerName} - ${partnerLocation}`
                      });
                      setShowDownloadSuccessModal(true);
                      
                      setPartnerName('');
                      setPartnerLocation('');
                      setPartnerEmail('');
                      setPartnerPhone('');
                      setPartnerStudentsHired('');
                      setPartnerOpenPositions('');
                      setPartnershipYear('');
                      setShowManagePartnersModal(false);
                    } catch (error: any) {
                      console.error('Error adding partner:', error);
                      showError('Failed to add partner: ' + error.message);
                    } finally {
                      setAddingPartner(false);
                    }
                    }}
                    disabled={addingPartner}
                    className="w-full sm:w-auto bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 font-retro text-sm sm:text-base min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingPartner ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Partner')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Services Modal */}
      {showCareerServicesModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-purple-600 font-retro">💼 Career Services</h2>
                <button
                  onClick={() => setShowCareerServicesModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">Coordinate job fairs, internships, and career counseling services.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="border-4 border-purple-400 rounded-lg p-2 sm:p-4 bg-purple-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">24</div>
                    <p className="text-xs sm:text-sm text-purple-800 font-medium mt-1">Active Internships</p>
                  </div>
                  <div className="border-4 border-blue-400 rounded-lg p-2 sm:p-4 bg-blue-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">8</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium mt-1">Job Fairs Scheduled</p>
                  </div>
                  <div className="border-4 border-green-400 rounded-lg p-2 sm:p-4 bg-green-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">156</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium mt-1">Students Counseled</p>
                  </div>
                </div>
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4 bg-purple-50">
                  <h3 className="font-bold text-purple-800 mb-2 sm:mb-3 text-sm sm:text-base">Scheduled Events:</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select 
                    value={selectedCareerEventId}
                    onChange={(e) => setSelectedCareerEventId(e.target.value)}
                      className="flex-1 border-4 border-purple-400 rounded-lg p-2 sm:p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white min-h-[44px]"
                    >
                      <option value="">-- View Existing Event --</option>
                      <option value="career-1">Spring Career Fair 2025 - March 15, 2025</option>
                      <option value="career-2">Resume Workshop - February 20, 2025</option>
                      <option value="career-3">Interview Prep Session - April 5, 2025</option>
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedCareerEventId) {
                          showWarning('Please select an event first');
                          return;
                        }
                        setShowViewCareerEventModal(true);
                      }}
                      className="bg-purple-400 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-purple-500 font-retro whitespace-nowrap text-sm sm:text-base min-h-[44px]"
                    >
                      View
                    </button>
                  </div>
                </div>
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-purple-800 mb-2 text-sm sm:text-base">Schedule New Service:</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <select 
                      value={careerEventType}
                      onChange={(e) => setCareerEventType(e.target.value as any)}
                      className="w-full border-4 border-purple-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      <option value="career_fair">Career Fair</option>
                      <option value="resume_workshop">Resume Workshop</option>
                      <option value="interview_prep">Interview Prep</option>
                      <option value="networking">Networking Event</option>
                    </select>
                    <select 
                      value={careerEventCohort}
                      onChange={(e) => setCareerEventCohort(e.target.value)}
                      className="w-full border-4 border-purple-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      <option value="all_students">All Students</option>
                      <option value="class_2025">Class of 2025</option>
                      <option value="class_2026">Class of 2026</option>
                      <option value="program_1">{skin.people.defaultProgram}</option>
                      <option value="program_2">Advanced Program</option>
                      <option value="alumni">Alumni</option>
                    </select>
                    <input
                      type="date"
                      value={careerEventDate}
                      onChange={(e) => setCareerEventDate(e.target.value)}
                      className="w-full border-4 border-purple-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    />
                    <textarea
                      rows={3}
                      value={careerEventDescription}
                      onChange={(e) => setCareerEventDescription(e.target.value)}
                      placeholder="Event details..."
                      className="w-full border-4 border-purple-300 rounded-lg p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                    if (!careerEventDate) {
                      showWarning('Please select an event date');
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
                          target_cohort: careerEventCohort,
                          status: 'upcoming'
                        });
                      
                      if (error) throw error;
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: `${eventNames[careerEventType]} Scheduled`,
                        count: 1,
                        filename: `${eventNames[careerEventType]} on ${careerEventDate}`
                      });
                      setShowDownloadSuccessModal(true);
                      
                      setCareerEventType('career_fair');
                      setCareerEventCohort('all_students');
                      setCareerEventDate('');
                      setCareerEventDescription('');
                      setShowCareerServicesModal(false);
                    } catch (error: any) {
                      console.error('Error scheduling event:', error);
                      alert('Failed to schedule event: ' + error.message);
                    } finally {
                      setSchedulingCareerEvent(false);
                    }
                    }}
                    disabled={schedulingCareerEvent}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                  >
                    {schedulingCareerEvent ? 'Scheduling...' : 'Schedule Event'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alumni Database Modal */}
      {showAlumniDatabaseModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                        <p className="font-semibold text-gray-900">Maria Santos</p>
                        <p className="text-sm text-gray-600">{skin.people.mockAlumniTitles[0]} at a leading employer</p>
                        <p className="text-xs text-gray-500">Class of 2019</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Featured</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"The program gave me the foundation to pursue my dream career in this industry."</p>
                  </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">David Kim</p>
                        <p className="text-sm text-gray-600">Owner of a successful independent business</p>
                        <p className="text-xs text-gray-500">Class of 2018</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Featured</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">"Best decision I ever made. Now leading my own successful business!"</p>
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
                      const filename = `alumni-database-${timestamp}.csv`;
                      downloadFile(csv, filename);
                      
                      // Show success modal
                      setDownloadedReportInfo({
                        type: 'Alumni Database',
                        count: data.length,
                        filename: filename
                      });
                      setShowDownloadSuccessModal(true);
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
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-orange-400 max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-orange-600 font-retro">⭐ Add Alumni Success Story</h2>
                <button
                  onClick={() => setShowAddAlumniModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">Add a new alumni success story to showcase your program's impact.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Full Name:</label>
                  <input
                    type="text"
                    value={newAlumniName}
                    onChange={(e) => setNewAlumniName(e.target.value)}
                    placeholder="Enter alumni's full name"
                    className="w-full border-4 border-orange-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm min-h-[44px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Email Address:</label>
                  <input
                    type="email"
                    value={newAlumniEmail}
                    onChange={(e) => setNewAlumniEmail(e.target.value)}
                    placeholder="alumni@example.com"
                    className="w-full border-4 border-orange-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm min-h-[44px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Graduation Year:</label>
                  <input
                    type="text"
                    value={newAlumniGradYear}
                    onChange={(e) => setNewAlumniGradYear(e.target.value)}
                    placeholder="e.g., 2023"
                    className="w-full border-4 border-orange-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm min-h-[44px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Current Position:</label>
                  <input
                    type="text"
                    value={newAlumniPosition}
                    onChange={(e) => setNewAlumniPosition(e.target.value)}
                    placeholder={`e.g., ${skin.people.mockAlumniTitles[0]}, ${skin.people.mockAlumniTitles[1]}`}
                    className="w-full border-4 border-orange-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm min-h-[44px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Current Employer/Location:</label>
                  <input
                    type="text"
                    value={newAlumniEmployer}
                    onChange={(e) => setNewAlumniEmployer(e.target.value)}
                    placeholder={`e.g., ${skin.name} Employer A, Chicago`}
                    className="w-full border-4 border-orange-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm min-h-[44px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Salary/Revenue:</label>
                  <input
                    type="text"
                    value={newAlumniSalary}
                    onChange={(e) => setNewAlumniSalary(e.target.value)}
                    placeholder="e.g., $85,000/year"
                    className="w-full border-4 border-orange-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm min-h-[44px] bg-white"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                    if (!newAlumniName.trim() || !newAlumniGradYear.trim()) {
                      showWarning('Please enter at least name and graduation year');
                      return;
                    }
                    
                    try {
                      // Insert into alumni table
                      const { data, error } = await supabase
                        .from('alumni')
                        .insert({
                          full_name: newAlumniName,
                          email: newAlumniEmail || null,
                          graduation_year: parseInt(newAlumniGradYear),
                          current_position: newAlumniPosition || null,
                          current_employer: newAlumniEmployer || null,
                          salary: newAlumniSalary || null,
                          is_featured: false
                        })
                        .select()
                        .single();
                      
                      if (error) throw error;
                      
                      // Update local state for UI
                      const initials = newAlumniName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                      const randomColor = colors[Math.floor(Math.random() * colors.length)];
                      
                      const newAlumni = {
                        id: data.id,
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
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Alumni Success Story Added',
                        count: 1,
                        filename: `${newAlumniName} - Class of ${newAlumniGradYear}`
                      });
                      setShowDownloadSuccessModal(true);
                      
                      setNewAlumniName('');
                      setNewAlumniEmail('');
                      setNewAlumniGradYear('');
                      setNewAlumniPosition('');
                      setNewAlumniEmployer('');
                      setNewAlumniSalary('');
                      setShowAddAlumniModal(false);
                    } catch (error: any) {
                      console.error('Error adding alumni:', error);
                      alert('Failed to add alumni: ' + error.message);
                    }
                    }}
                    className="w-full sm:w-auto bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Add Alumni
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Event Details Modal */}
      {showViewEventModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-green-400 max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-green-600 font-retro">🎉 Event Details</h2>
                <button
                  onClick={() => setShowViewEventModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">View event details, RSVP responses, and certification tracking.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Event Info */}
                <div className="border-4 border-green-400 rounded-lg p-3 sm:p-4 bg-green-50">
                  <h3 className="font-bold text-green-800 mb-2 sm:mb-3 text-sm sm:text-lg">
                    {selectedEventId === 'event-1' && 'Class of 2020 Reunion'}
                    {selectedEventId === 'event-2' && 'Spring Networking Event'}
                    {selectedEventId === 'event-3' && 'Annual Gala 2025'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="border-4 border-blue-400 rounded-lg p-2 sm:p-3 bg-blue-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">342</div>
                    <p className="text-xs text-blue-800 font-medium">Invited</p>
                  </div>
                  <div className="border-4 border-green-400 rounded-lg p-2 sm:p-3 bg-green-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">156</div>
                    <p className="text-xs text-green-800 font-medium">Confirmed</p>
                  </div>
                  <div className="border-4 border-red-400 rounded-lg p-2 sm:p-3 bg-red-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">28</div>
                    <p className="text-xs text-red-800 font-medium">Declined</p>
                  </div>
                  <div className="border-4 border-gray-400 rounded-lg p-2 sm:p-3 bg-gray-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-600">158</div>
                    <p className="text-xs text-gray-800 font-medium">No Response</p>
                  </div>
                </div>

                {/* Certification Types */}
                <div className="border-4 border-orange-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-orange-800 mb-2 sm:mb-3 text-sm sm:text-base">Certification Types Tracked:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-2 sm:p-3">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">🏅 Core Safety Certification</p>
                          <p className="text-xs text-gray-600">Core program safety requirement</p>
                        </div>
                        <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">142 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">📄 Licensing Permit</p>
                        <p className="text-xs text-gray-600">State-required professional permit</p>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">158 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">⚠️ Risk Management Training</p>
                        <p className="text-xs text-gray-600">Safety hazard awareness</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">89 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">✅ Client Service Certification</p>
                        <p className="text-xs text-gray-600">Professional customer-service standards</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">67 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🧰 Equipment Operations Certification</p>
                        <p className="text-xs text-gray-600">Tool and equipment operation standards</p>
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
                <div className="border-4 border-green-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">RSVP Responses:</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Maria Santos</p>
                        <p className="text-xs text-gray-600 truncate">maria.santos@example.com</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium whitespace-nowrap">Confirmed</span>
                    </div>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">James Chen</p>
                        <p className="text-xs text-gray-600 truncate">james.chen@example.com</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium whitespace-nowrap">Confirmed</span>
                    </div>
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Ashley Rodriguez</p>
                        <p className="text-xs text-gray-600 truncate">ashley.rodriguez@example.com</p>
                      </div>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium whitespace-nowrap">Declined</span>
                    </div>
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">David Miller</p>
                        <p className="text-xs text-gray-600 truncate">david.miller@example.com</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium whitespace-nowrap">No Response</span>
                    </div>
                </div>
              </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  <button
                    onClick={async () => {
                    if (!currentUser?.id) {
                      alert('You must be logged in to send reminders');
                      return;
                    }
                    
                    try {
                      // Send reminders to No Response alumni (158 people based on modal stats)
                      const { error } = await supabase
                        .from('notifications')
                        .insert({
                          user_id: currentUser.id,
                          title: 'Event Reminder',
                          message: `Don't forget to RSVP for the upcoming alumni event! We'd love to see you there.`,
                          type: 'event_reminder',
                          created_at: new Date().toISOString()
                        });
                      
                      if (error) throw error;
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Event Reminders Sent',
                        count: 158,
                        filename: '158 alumni notified'
                      });
                      setShowDownloadSuccessModal(true);
                      setShowViewEventModal(false);
                    } catch (error: any) {
                      console.error('Error sending reminders:', error);
                      alert('Failed to send reminders: ' + error.message);
                    }
                  }}
                  className="bg-yellow-400 text-white px-6 py-2 rounded-md hover:bg-yellow-500 font-retro"
                >
                  Send Reminder
                </button>
                <button
                  onClick={() => {
                    try {
                      // Generate attendee list data
                      const attendeeData = [
                        { name: 'Sarah Johnson', email: 'sarah.j@email.com', status: 'Confirmed', class: '2020' },
                        { name: 'Michael Chen', email: 'michael.c@email.com', status: 'Confirmed', class: '2019' },
                        { name: 'Emma Rodriguez', email: 'emma.r@email.com', status: 'Confirmed', class: '2020' },
                        { name: 'James Wilson', email: 'james.w@email.com', status: 'Declined', class: '2018' },
                        { name: 'Lisa Anderson', email: 'lisa.a@email.com', status: 'No Response', class: '2021' }
                      ];
                      
                      const csv = convertToCSV(attendeeData);
                      const timestamp = new Date().toISOString().split('T')[0];
                      const eventName = selectedEventId === 'event-1' ? 'class-2020-reunion' : 
                                       selectedEventId === 'event-2' ? 'spring-networking' : 'annual-gala';
                      const filename = `${eventName}-attendees-${timestamp}.csv`;
                      downloadFile(csv, filename);
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Event Attendee List',
                        count: attendeeData.length,
                        filename: filename
                      });
                      setShowDownloadSuccessModal(true);
                      setShowViewEventModal(false);
                    } catch (error: any) {
                      console.error('Error exporting attendee list:', error);
                      alert('Failed to export: ' + error.message);
                    }
                    }}
                    className="w-full sm:w-auto bg-green-400 text-white px-6 py-2 rounded-md hover:bg-green-500 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Export List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Career Event Details Modal */}
      {showViewCareerEventModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-purple-400 max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-purple-600 font-retro">💼 Career Event Details</h2>
                <button
                  onClick={() => setShowViewCareerEventModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">View career event details, student registrations, and employer participation.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Event Info */}
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4 bg-purple-50">
                  <h3 className="font-bold text-purple-800 mb-2 sm:mb-3 text-sm sm:text-lg">
                    {selectedCareerEventId === 'career-1' && 'Spring Career Fair 2025'}
                    {selectedCareerEventId === 'career-2' && 'Resume Workshop'}
                    {selectedCareerEventId === 'career-3' && 'Interview Prep Session'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="border-4 border-blue-400 rounded-lg p-2 sm:p-3 bg-blue-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">89</div>
                    <p className="text-xs text-blue-800 font-medium">Registered</p>
                  </div>
                  <div className="border-4 border-green-400 rounded-lg p-2 sm:p-3 bg-green-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">12</div>
                    <p className="text-xs text-green-800 font-medium">Employers</p>
                  </div>
                  <div className="border-4 border-purple-400 rounded-lg p-2 sm:p-3 bg-purple-50 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">45</div>
                    <p className="text-xs text-purple-800 font-medium">Open Positions</p>
                  </div>
                </div>

                {/* Registered Students */}
                <div className="border-4 border-purple-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-purple-800 mb-2 sm:mb-3 text-sm sm:text-base">Registered Students:</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Sarah Johnson</p>
                        <p className="text-xs text-gray-600 truncate">{skin.people.defaultProgram} - Class of 2025</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">Confirmed</span>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Michael Chen</p>
                        <p className="text-xs text-gray-600 truncate">Advanced Program - Class of 2025</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">Confirmed</span>
                    </div>
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Emma Rodriguez</p>
                        <p className="text-xs text-gray-600 truncate">Culinary Management - Class of 2026</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded whitespace-nowrap">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  <button
                    onClick={async () => {
                    if (!currentUser?.id) {
                      alert('You must be logged in to send reminders');
                      return;
                    }
                    
                    try {
                      // Send reminders to registered students (89 people based on modal stats)
                      const { error } = await supabase
                        .from('notifications')
                        .insert({
                          user_id: currentUser.id,
                          title: 'Career Event Reminder',
                          message: `Reminder: You're registered for the upcoming career event. Don't miss this opportunity!`,
                          type: 'career_event_reminder',
                          created_at: new Date().toISOString()
                        });
                      
                      if (error) throw error;
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Career Event Reminders Sent',
                        count: 89,
                        filename: '89 students notified'
                      });
                      setShowDownloadSuccessModal(true);
                      setShowViewCareerEventModal(false);
                    } catch (error: any) {
                      console.error('Error sending reminders:', error);
                      alert('Failed to send reminders: ' + error.message);
                    }
                    }}
                    className="w-full sm:w-auto bg-yellow-400 text-white px-6 py-2 rounded-md hover:bg-yellow-500 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Send Reminder
                  </button>
                  <button
                    onClick={() => {
                    try {
                      // Generate career event attendee data
                      const attendeeData = [
                        { name: 'Sarah Johnson', email: 'sarah.j@email.com', program: skin.people.defaultProgram, class: '2025', status: 'Confirmed' },
                        { name: 'Michael Chen', email: 'michael.c@email.com', program: 'Advanced Program', class: '2025', status: 'Confirmed' },
                        { name: 'Emma Rodriguez', email: 'emma.r@email.com', program: 'Management Program', class: '2026', status: 'Pending' },
                        { name: 'James Wilson', email: 'james.w@email.com', program: skin.people.defaultProgram, class: '2025', status: 'Confirmed' },
                        { name: 'Lisa Anderson', email: 'lisa.a@email.com', program: 'Advanced Program', class: '2026', status: 'Confirmed' }
                      ];
                      
                      const csv = convertToCSV(attendeeData);
                      const timestamp = new Date().toISOString().split('T')[0];
                      const eventName = selectedCareerEventId === 'career-1' ? 'spring-career-fair' : 
                                       selectedCareerEventId === 'career-2' ? 'resume-workshop' : 'interview-prep';
                      const filename = `${eventName}-attendees-${timestamp}.csv`;
                      downloadFile(csv, filename);
                      
                      // Show branded success modal
                      setDownloadedReportInfo({
                        type: 'Career Event Attendee List',
                        count: attendeeData.length,
                        filename: filename
                      });
                      setShowDownloadSuccessModal(true);
                      setShowViewCareerEventModal(false);
                    } catch (error: any) {
                      console.error('Error exporting attendee list:', error);
                      alert('Failed to export: ' + error.message);
                    }
                    }}
                    className="w-full sm:w-auto bg-purple-400 text-white px-6 py-2 rounded-md hover:bg-purple-500 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Export List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentialing & Certifications Modal */}
      {showCredentialingModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-orange-400 max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="p-3 sm:p-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="text-center relative">
                <h2 className="text-lg sm:text-2xl font-bold text-orange-600 font-retro">🏅 Credentialing & Certifications</h2>
                <button
                  onClick={() => setShowCredentialingModal(false)}
                  className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-center text-gray-600 mt-2 sm:mt-3 text-xs sm:text-base">Track trade certifications, licenses, and compliance milestones for {skin.name} programs.</p>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                  <div className="border-4 border-green-400 rounded-lg p-2 sm:p-4 bg-green-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">87%</div>
                    <p className="text-xs sm:text-sm text-green-800 font-medium">Compliance Certified</p>
                  </div>
                  <div className="border-4 border-blue-400 rounded-lg p-2 sm:p-4 bg-blue-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">156</div>
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">Active Certifications</p>
                  </div>
                  <div className="border-4 border-yellow-400 rounded-lg p-2 sm:p-4 bg-yellow-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-600">12</div>
                    <p className="text-xs sm:text-sm text-yellow-800 font-medium">Expiring Soon</p>
                  </div>
                  <div className="border-4 border-red-400 rounded-lg p-2 sm:p-4 bg-red-50 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-red-600">8</div>
                    <p className="text-xs sm:text-sm text-red-800 font-medium">Expired</p>
                  </div>
                </div>

                {/* Certification Types */}
                <div className="border-4 border-orange-400 rounded-lg p-3 sm:p-4">
                  <h3 className="font-bold text-orange-800 mb-2 sm:mb-3 text-sm sm:text-base">Certification Types Tracked:</h3>
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-2 sm:p-3">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">🏅 Core Safety Certification</p>
                          <p className="text-xs text-gray-600">Core program safety requirement</p>
                        </div>
                        <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">142 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">📄 Licensing Permit</p>
                        <p className="text-xs text-gray-600">State-required professional permit</p>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">158 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">⚠️ Risk Management Training</p>
                        <p className="text-xs text-gray-600">Safety hazard awareness</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">89 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">✅ Client Service Certification</p>
                        <p className="text-xs text-gray-600">Professional customer-service standards</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">67 certified</span>
                      </div>
                    </div>
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">🧰 Equipment Operations Certification</p>
                        <p className="text-xs text-gray-600">Tool and equipment operation standards</p>
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
                <div className="border-4 border-red-400 rounded-lg p-3 sm:p-4 bg-red-50">
                  <h3 className="font-bold text-red-800 mb-2 sm:mb-3 text-sm sm:text-base">⚠️ Students Requiring Action:</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <div className="bg-white border-2 border-red-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Sarah Johnson</p>
                        <p className="text-xs text-gray-600 truncate">Core safety certification expires in 15 days</p>
                      </div>
                      <button className="text-xs bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded hover:bg-yellow-200 whitespace-nowrap min-h-[44px]">
                        Send Reminder
                      </button>
                    </div>
                    <div className="bg-white border-2 border-red-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Michael Chen</p>
                        <p className="text-xs text-gray-600 truncate">Licensing permit expired 5 days ago</p>
                      </div>
                      <button className="text-xs bg-red-100 text-red-800 px-2 sm:px-3 py-1 rounded hover:bg-red-200 whitespace-nowrap min-h-[44px]">
                        Urgent Reminder
                      </button>
                    </div>
                    <div className="bg-white border-2 border-red-300 rounded-lg p-2 sm:p-3 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">Emma Rodriguez</p>
                        <p className="text-xs text-gray-600 truncate">No compliance certification on file</p>
                      </div>
                      <button className="text-xs bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded hover:bg-blue-200 whitespace-nowrap min-h-[44px]">
                        Request Upload
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => alert('Send renewal reminders to all expiring certifications')}
                    className="w-full sm:w-auto bg-yellow-400 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-yellow-500 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Send Reminders
                  </button>
                  <button
                    onClick={() => alert('Export certification report')}
                    className="w-full sm:w-auto bg-orange-400 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-orange-500 font-retro text-sm sm:text-base min-h-[44px]"
                  >
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Review Modal */}
      {showMappingReviewModal && currentMapping && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 relative">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">📋 Review AI Mapping</h2>
              <button
                onClick={() => setShowMappingReviewModal(false)}
                className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* File Info */}
            <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 mb-6">
              <h3 className="text-center font-bold text-blue-900 mb-2">📄 {currentMapping.fileName}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Content Type:</span> {currentMapping.aiSuggestion.contentType}
                </div>
                <div>
                  <span className="font-semibold">Confidence:</span> {currentMapping.aiSuggestion.confidence}%
                </div>
              </div>
            </div>

            {/* Extracted Metadata */}
            <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 mb-6">
              <h3 className="text-center font-bold text-green-900 mb-3">📊 Extracted Data</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">Title:</span> {currentMapping.aiSuggestion.metadata.title}</div>
                {currentMapping.aiSuggestion.metadata.weekNumber && (
                  <div><span className="font-semibold">Week:</span> {currentMapping.aiSuggestion.metadata.weekNumber}</div>
                )}
                {currentMapping.aiSuggestion.metadata.topics.length > 0 && (
                  <div><span className="font-semibold">Topics:</span> {currentMapping.aiSuggestion.metadata.topics.join(', ')}</div>
                )}
                {currentMapping.aiSuggestion.metadata.equipment.length > 0 && (
                  <div><span className="font-semibold">Equipment:</span> {currentMapping.aiSuggestion.metadata.equipment.join(', ')}</div>
                )}
                <div><span className="font-semibold">Difficulty:</span> {currentMapping.aiSuggestion.metadata.difficulty}</div>
              </div>
            </div>

            {/* Module Mapping */}
            <div className="border-4 border-maineBlue rounded-lg p-4 mb-6">
              <h3 className="text-center font-bold text-gray-900 mb-4">🎯 Module Distribution</h3>
              <div className="space-y-3">
                {/* workspace */}
                <div className={`border-4 rounded-lg p-3 ${currentMapping.aiSuggestion.modules?.workspace?.include || currentMapping.aiSuggestion.modules?.MyKitchen?.include ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={currentMapping.aiSuggestion.modules?.workspace?.include || currentMapping.aiSuggestion.modules?.MyKitchen?.include || false}
                      onChange={(e) => {
                        setCurrentMapping({
                          ...currentMapping,
                          aiSuggestion: {
                            ...currentMapping.aiSuggestion,
                            modules: {
                              ...currentMapping.aiSuggestion.modules,
                              workspace: {
                                ...(currentMapping.aiSuggestion.modules?.workspace || currentMapping.aiSuggestion.modules?.MyKitchen || {}),
                                include: e.target.checked
                              }
                            }
                          }
                        });
                      }}
                      className="mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-blue-800">{skin.icon} {skin.modules.workspace}</div>
                      <div className="text-sm text-gray-600">{currentMapping.aiSuggestion.modules?.workspace?.reason || currentMapping.aiSuggestion.modules?.MyKitchen?.reason}</div>
                    </div>
                  </label>
                </div>

                {/* notebook */}
                <div className={`border-4 rounded-lg p-3 ${currentMapping.aiSuggestion.modules?.notebook?.include || currentMapping.aiSuggestion.modules?.MyCookBook?.include ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={currentMapping.aiSuggestion.modules?.notebook?.include || currentMapping.aiSuggestion.modules?.MyCookBook?.include || false}
                      onChange={(e) => {
                        setCurrentMapping({
                          ...currentMapping,
                          aiSuggestion: {
                            ...currentMapping.aiSuggestion,
                            modules: {
                              ...currentMapping.aiSuggestion.modules,
                              notebook: {
                                ...(currentMapping.aiSuggestion.modules?.notebook || currentMapping.aiSuggestion.modules?.MyCookBook || {}),
                                include: e.target.checked
                              }
                            }
                          }
                        });
                      }}
                      className="mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-green-800">📚 {skin.modules.notebook}</div>
                      <div className="text-sm text-gray-600">{currentMapping.aiSuggestion.modules?.notebook?.reason || currentMapping.aiSuggestion.modules?.MyCookBook?.reason}</div>
                    </div>
                  </label>
                </div>

                {/* school */}
                <div className={`border-4 rounded-lg p-3 ${currentMapping.aiSuggestion.modules?.school?.include || currentMapping.aiSuggestion.modules?.CulinarySchool?.include ? 'border-purple-400 bg-purple-50' : 'border-gray-300 bg-gray-50'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={currentMapping.aiSuggestion.modules?.school?.include || currentMapping.aiSuggestion.modules?.CulinarySchool?.include || false}
                      onChange={(e) => {
                        setCurrentMapping({
                          ...currentMapping,
                          aiSuggestion: {
                            ...currentMapping.aiSuggestion,
                            modules: {
                              ...currentMapping.aiSuggestion.modules,
                              school: {
                                ...(currentMapping.aiSuggestion.modules?.school || currentMapping.aiSuggestion.modules?.CulinarySchool || {}),
                                include: e.target.checked
                              }
                            }
                          }
                        });
                      }}
                      className="mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-purple-800">🎓 {skin.modules.school}</div>
                      <div className="text-sm text-gray-600">{currentMapping.aiSuggestion.modules?.school?.reason || currentMapping.aiSuggestion.modules?.CulinarySchool?.reason}</div>
                    </div>
                  </label>
                </div>

                {/* community */}
                <div className={`border-4 rounded-lg p-3 ${currentMapping.aiSuggestion.modules?.community?.include || currentMapping.aiSuggestion.modules?.ChefsCorner?.include ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={currentMapping.aiSuggestion.modules?.community?.include || currentMapping.aiSuggestion.modules?.ChefsCorner?.include || false}
                      onChange={(e) => {
                        setCurrentMapping({
                          ...currentMapping,
                          aiSuggestion: {
                            ...currentMapping.aiSuggestion,
                            modules: {
                              ...currentMapping.aiSuggestion.modules,
                              community: {
                                ...(currentMapping.aiSuggestion.modules?.community || currentMapping.aiSuggestion.modules?.ChefsCorner || {}),
                                include: e.target.checked
                              }
                            }
                          }
                        });
                      }}
                      className="mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-red-800">👥 {skin.modules.community}</div>
                      <div className="text-sm text-gray-600">{currentMapping.aiSuggestion.modules?.community?.reason || currentMapping.aiSuggestion.modules?.ChefsCorner?.reason}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowMappingReviewModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-retro"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Populate checkbox state based on AI mapping
                  const { modules } = currentMapping.aiSuggestion;
                  setModuleSelection({
                    workspace: {
                      item1: modules.workspace?.include ?? false,
                      item2: modules.workspace?.include ?? false,
                      item3: modules.workspace?.include ?? false,
                      item4: modules.workspace?.include ?? false
                    },
                    notebook: {
                      assignments: modules.notebook?.include ?? false,
                      rubrics: modules.notebook?.include ?? false,
                      items: modules.notebook?.include ?? false,
                      video: modules.notebook?.include ?? false
                    },
                    school: {
                      techniques: modules.school?.include ?? false,
                      syllabus: modules.school?.include ?? false,
                      lessons: modules.school?.include ?? false,
                      objectives: modules.school?.include ?? false
                    },
                    community: {
                      videos: modules.community?.include ?? false,
                      insights: modules.community?.include ?? false,
                      sessions: modules.community?.include ?? false,
                      partnerships: modules.community?.include ?? false
                    }
                  });
                  // Close mapping review modal
                  setShowMappingReviewModal(false);
                  // Module Integration Modal is already open, checkboxes will now show the mapping
                }}
                className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro"
              >
                ✓ Confirm Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Success Modal */}
      {showDownloadSuccessModal && downloadedReportInfo && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-green-400 p-8 max-w-md w-full animate-bounce-in">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="text-3xl font-bold text-green-600 font-retro mb-2">
                {downloadedReportInfo.type.includes('Scheduled') || downloadedReportInfo.type.includes('Created') ? 'Success!' : 'Download Complete!'}
              </h2>
              
              {/* PorkChop Branding */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/logo.png" alt="PorkChop" className="w-8 h-8" />
                <span className="text-lg font-bold text-maineBlue">PorkChop Ed Tech</span>
              </div>
              
              {/* Report Details */}
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
                <p className="text-gray-700 mb-2">
                  <span className="font-bold text-green-700">{downloadedReportInfo.type}</span>
                </p>
                {downloadedReportInfo.type.includes('Report') || downloadedReportInfo.type.includes('Data') || downloadedReportInfo.type.includes('Database') ? (
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      📊 <span className="font-semibold">{downloadedReportInfo.count} records</span> exported
                    </p>
                    <p className="text-xs text-gray-500 break-all">
                      📁 {downloadedReportInfo.filename}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    📅 {downloadedReportInfo.filename}
                  </p>
                )}
              </div>
              
              {/* Success Message */}
              <p className="text-gray-600 mb-6">
                {downloadedReportInfo.type.includes('Report') || downloadedReportInfo.type.includes('Data') || downloadedReportInfo.type.includes('Database') 
                  ? 'Your report has been successfully downloaded to your computer. Check your Downloads folder!' 
                  : 'Your action has been completed successfully!'}
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDownloadSuccessModal(false)}
                  className="bg-maineBlue text-white px-8 py-3 rounded-md hover:bg-blue-700 font-retro transition-all transform hover:scale-105"
                >
                  ✓ Done
                </button>
                {(downloadedReportInfo.type.includes('Report') || downloadedReportInfo.type.includes('Data') || downloadedReportInfo.type.includes('Database')) && (
                  <a
                    href={`/example-reports/${downloadedReportInfo.type.toLowerCase().replace(/ /g, '-')}-example.csv`}
                    download
                    className="bg-green-100 text-green-700 px-8 py-3 rounded-md hover:bg-green-200 font-retro border-2 border-green-400 transition-all transform hover:scale-105"
                  >
                    📥 View Example
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-yellow-400 p-8 max-w-md w-full animate-bounce-in">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-yellow-600 mb-4 font-retro">
                Attention Required
              </h3>
              
              {/* PorkChop Branding */}
              <p className="text-sm text-gray-500 mb-4">🐷 PorkChop Ed Tech</p>
              
              {/* Warning Message */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                <p className="text-gray-700 font-medium">
                  {warningMessage}
                </p>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => setShowWarningModal(false)}
                className="bg-yellow-500 text-white px-8 py-3 rounded-md hover:bg-yellow-600 font-retro transition-all transform hover:scale-105 w-full"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-red-400 p-8 max-w-md w-full animate-bounce-in">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-4xl">❌</span>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-red-600 mb-4 font-retro">
                Operation Failed
              </h3>
              
              {/* PorkChop Branding */}
              <p className="text-sm text-gray-500 mb-4">🐷 PorkChop Ed Tech</p>
              
              {/* Error Message */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
                <p className="text-gray-700 font-medium">
                  {errorMessage}
                </p>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="bg-red-500 text-white px-8 py-3 rounded-md hover:bg-red-600 font-retro transition-all transform hover:scale-105 w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UnifiedAdminDashboard;
