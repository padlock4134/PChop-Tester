import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FireIcon, ShieldCheckIcon, StarIcon, TrophyIcon, SparklesIcon, CakeIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { redirectToLogout } from '@wristband/react-client-auth';
import { useSupabase } from '../../culinary/components/SupabaseProvider';
import { supabase } from '../../culinary/api/supabaseClient';
// Removed external imports that don't exist
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';

// Define UserProfile type
type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  experience: string;
  certifications: string[];
  vehicleType: string[];
  garageSetup: string;
  xp: number;
};

// Level titles and icons
const LEVEL_TITLES_AND_ICONS = [
  { title: "Novice Mechanic", icon: "🔧", level: 1 },
  { title: "Apprentice Technician", icon: "🛠️", level: 2 },
  { title: "Certified Technician", icon: "🚗", level: 3 },
  { title: "Master Technician", icon: "⚙️", level: 4 },
  { title: "Shop Foreman", icon: "🏆", level: 5 }
];

// WoW Classic XP table
const WOW_CLASSIC_XP_TABLE = [
  0, 400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500,
  7600, 8700, 9800, 11000, 12300, 13600, 15000, 16500, 18000, 19600
];

// Experience level mapping between UI labels and backend values
const EXPERIENCE_LEVEL_MAPPING = {
  'Beginner': 'new_to_automotive',
  'Intermediate': 'apprentice_technician', 
  'Advanced': 'certified_technician',
  'Professional': 'master_technician' // Both Advanced and Professional map to certified_technician
} as const;

// Reverse mapping for displaying in UI
const EXPERIENCE_LEVEL_DISPLAY = {
  'new_to_automotive': 'Beginner',
  'apprentice_technician': 'Intermediate',
  'certified_technician': 'Advanced'
} as const;

// Modal components
const EditProfileModal = ({ 
  open, 
  onClose, 
  user, 
  onProfileUpdated 
}: { 
  open: boolean; 
  onClose: () => void; 
  user: UserProfile; 
  onProfileUpdated: (updatedUser: UserProfile) => void; 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    vehicleType: user?.vehicleType?.[0] || 'Cars',
    certifications: user?.certifications?.[0] || 'None',
    garageSetup: user?.garageSetup || 'Home Garage',
    experienceLevel: user?.experience || 'Beginner',
    program: (user as any)?.program || ''
  });

  if (!open) return null;

  const handleSave = async () => {
    try {
      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          vehicle_type: [formData.vehicleType],
          certifications: [formData.certifications],
          garage_setup: formData.garageSetup,
          automotive_experience: [EXPERIENCE_LEVEL_MAPPING[formData.experienceLevel as keyof typeof EXPERIENCE_LEVEL_MAPPING]],
          program: formData.program
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert(t('profile.failedToSaveProfile'));
        return;
      }

      // Update the local state with the new data
      const updatedUser = {
        ...user,
        name: formData.name,
        vehicle_type: [formData.vehicleType],
        certifications: [formData.certifications],
        garage_setup: formData.garageSetup,
        experience: formData.experienceLevel
      };

      onProfileUpdated(updatedUser);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile changes. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] border-4 border-black flex flex-col">
        {/* Sticky Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-200">
          <div></div>
          <h3 className="text-2xl font-bold text-maineBlue">{t('profile.editProfile')}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
          <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">{t('profile.username')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
              placeholder={t('profile.enterYourName')}
            />
          </div>

          {/* Academic Program */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">{t('profile.academicProgram')}</label>
            <select
              value={formData.program}
              onChange={(e) => setFormData({...formData, program: e.target.value})}
              disabled={(user as any)?.program && (user as any).program !== ''}
              className={`w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center ${
                (user as any)?.program && (user as any).program !== '' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">{t('profile.selectYourProgram')}</option>
              <option value="Bachelors in Automotive Technology">🎓 Bachelors in Automotive Technology</option>
              <option value="Associates in Diesel Mechanics">🎓 Associates in Diesel Mechanics</option>
            </select>
            {(user as any)?.program && (user as any).program !== '' && (
              <p className="text-xs text-gray-500 text-center mt-1">{t('profile.lockedContactAdmin')}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Vehicle Type</label>
            <select
              value={formData.vehicleType}
              onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="Cars">🚗 Cars</option>
              <option value="Trucks">🚚 Trucks</option>
              <option value="Motorcycles">🏍️ Motorcycles</option>
              <option value="Hybrids">🔋 Hybrids</option>
              <option value="Electric">⚡ Electric</option>
            </select>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Certifications</label>
            <select
              value={formData.certifications}
              onChange={(e) => setFormData({...formData, certifications: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="ASE Certified">🔧 ASE Certified</option>
              <option value="EPA 609">🛡️ EPA 609</option>
              <option value="Manufacturer Training">🏭️ Manufacturer Training</option>
              <option value="None">🍽️ None</option>
            </select>
          </div>

          {/* Garage Setup */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Garage Setup</label>
            <select
              value={formData.garageSetup}
              onChange={(e) => setFormData({...formData, garageSetup: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="Home Garage">🏠 Home Garage</option>
              <option value="Professional Shop">🏭️ Professional Shop</option>
              <option value="Mobile Service">🚐 Mobile Service</option>
              <option value="School Lab">🏫 School Lab</option>
              <option value="Minimal Setup">📦 Minimal Setup</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Experience Level</label>
            <select
              value={formData.experienceLevel}
              onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="Advanced">⭐ Advanced</option>
              <option value="Beginner">🌱 Beginner</option>
              <option value="Intermediate">📈 Intermediate</option>
              <option value="Professional">🏭️ Professional</option>
            </select>
          </div>
        </div>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="p-6 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-center">
            <button 
              onClick={handleSave}
              className="bg-maineBlue text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors border border-black"
            >
              {t('profile.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TermsModal = ({ open, onClose, content }: { open: boolean; onClose: () => void; content: string }) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-200">
          <div></div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-maineBlue font-retro">{t('profile.termsOfService')}</h2>
            <p className="text-sm text-gray-500 italic mt-1">Patent Pending</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
          <div className="prose prose-sm max-w-none text-gray-700">
            <div 
              className="prose prose-sm max-w-none text-gray-700 [&_h1]:mb-4 [&_h2]:mb-4 [&_h3]:mb-4"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
        
        {/* Fixed Footer with Button */}
        <div className="p-6 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-center">
            <button 
              onClick={onClose}
              className="bg-maineBlue text-white px-8 py-3 rounded-lg font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black"
            >
              {t('profile.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ open, onClose, userId, plan }: { open: boolean; onClose: () => void; userId: string; plan: string }) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">{t('profile.upgradePlan')}</h3>
        <p className="text-gray-600 mb-4">{t('profile.paymentComingSoon')}</p>
        <button 
          onClick={onClose}
          className="bg-maineBlue text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t('profile.close')}
        </button>
      </div>
    </div>
  );
};

const ClassScheduleModal = ({ open, onClose, onOpenRegistration }: { open: boolean; onClose: () => void; onOpenRegistration: () => void }) => {
  const { t } = useTranslation();
  if (!open) return null;
  
  const currentClasses = [
    { icon: '🔧', name: 'Engine Diagnostics Fundamentals', instructor: 'Mr. Martinez', time: 'Mon/Wed 9:00 AM' },
    { icon: '⚙️', name: 'Brake System Techniques', instructor: 'Mr. Johnson', time: 'Tue/Thu 11:00 AM' },
    { icon: '🚗', name: 'Transmission Repair Basics', instructor: 'Mr. Williams', time: 'Fri 1:00 PM' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-200">
          <div></div>
          <h2 className="text-2xl font-bold text-maineBlue">{t('profile.classSchedule')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
          {/* Classes Section */}
          <div className="mb-8">
          <div className="space-y-3">
            {currentClasses.map((classItem, index) => (
              <div key={index} className="bg-weatheredWhite border-2 border-gray-300 rounded-lg p-4 text-center">
                <div className="flex justify-center items-center mb-2">
                  <span className="text-4xl mr-3">{classItem.icon}</span>
                  <h4 className="font-bold text-gray-800 text-lg">{classItem.name}</h4>
                </div>
                <p className="text-gray-600">{t('profile.instructor')}: {classItem.instructor}</p>
                <p className="text-gray-600">{classItem.time}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
        
        {/* Fixed Footer with Buttons */}
        <div className="p-6 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-center gap-4">
            <button 
              onClick={onOpenRegistration}
              className="bg-lobsterRed text-weatheredWhite px-8 py-3 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-black"
            >
              {t('profile.register')}
            </button>
            <button 
              onClick={() => window.open('mailto:instructors@automotiveinstitute.edu?subject=Class Schedule Inquiry', '_blank')}
              className="bg-seafoam text-maineBlue px-8 py-3 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black"
            >
              {t('profile.contact')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = React.useState('');
  const [requestDetails, setRequestDetails] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);
  
  if (!open) return null;
  
  const requestTypes = [
    { id: 'id_card', name: 'Student ID/Key Card', icon: '🎫', description: 'Request a new or replacement student ID card' },
    { id: 'uniform', name: 'Mechanic Uniform/Tools', icon: '👕', description: 'Request mechanic uniforms or tool kits' },
    { id: 'tool_kit', name: 'Tool Kit Loaner', icon: '🔧', description: 'Request a loaner tool kit or replacement' },
    { id: 'equipment', name: 'Equipment Loaner', icon: '🧰', description: 'Request diagnostic scanners, lifts, or other equipment' },
    { id: 'manuals', name: 'Manuals/Materials', icon: '📚', description: 'Request repair manuals or course materials' },
    { id: 'garage_access', name: 'Garage Access', icon: '🔑', description: 'Request after-hours garage/lab access' },
    { id: 'transcript', name: 'Transcript Request', icon: '📋', description: 'Request official transcripts' },
    { id: 'recommendation', name: 'Letter of Recommendation', icon: '✉️', description: 'Request a letter of recommendation' },
    { id: 'accommodation', name: 'Accommodation Request', icon: '🏥', description: 'Request medical or physical accommodations' },
  ];
  
  const handleSubmit = () => {
    if (!selectedType || !requestDetails.trim()) {
      alert(t('profile.pleaseSelectRequestType'));
      return;
    }
    setShowSuccess(true);
  };
  
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg border-4 border-seafoam p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-maineBlue mb-4 font-retro">{t('profile.requestSubmitted')}</h2>
          <p className="text-gray-700 mb-2">{t('profile.requestSentToAdmin')}</p>
          <p className="text-gray-600 mb-6">{t('profile.emailUpdateOnRequest')}</p>
          <button
            onClick={() => {
              setShowSuccess(false);
              setSelectedType('');
              setRequestDetails('');
              onClose();
            }}
            className="bg-maineBlue text-white px-8 py-3 rounded-lg font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black"
          >
            {t('profile.gotIt')}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-200">
          <div></div>
          <h2 className="text-2xl font-bold text-maineBlue font-retro">{t('profile.submitARequest')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 pt-4">
          <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">{t('profile.selectRequestType')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requestTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedType === type.id
                    ? 'border-maineBlue bg-seafoam'
                    : 'border-gray-300 hover:border-maineBlue'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <h4 className="font-bold text-gray-800 mb-1">{type.name}</h4>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        {selectedType && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-2">{t('profile.requestDetails')}</h3>
            <textarea
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              placeholder={t('profile.provideRequestDetails')}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-maineBlue focus:outline-none min-h-[120px]"
            />
          </div>
        )}
        </div>
        
        {/* Fixed Footer with Buttons */}
        <div className="p-6 pt-4 border-t-2 border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!selectedType || !requestDetails.trim()}
              className="bg-maineBlue text-white px-6 py-2 rounded-md hover:bg-blue-700 font-retro disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('profile.submitRequest')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClassRegistrationModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  if (!open) return null;
  
  const availableClasses = [
    { name: 'Advanced Engine Repair', instructor: 'Mr. Rodriguez', time: 'Mon/Wed 2:00 PM', spots: 8 },
    { name: 'Electrical Systems Diagnostics', instructor: 'Mr. Kim', time: 'Tue/Thu 10:00 AM', spots: 12 },
    { name: 'Hybrid Vehicle Technology', instructor: 'Mr. Anderson', time: 'Fri 3:00 PM', spots: 6 },
    { name: 'ASE Certification Prep', instructor: 'Mr. Thompson', time: 'Sat 9:00 AM', spots: 15 },
    { name: 'Shop Management', instructor: 'Mr. Brown', time: 'Mon/Wed 6:00 PM', spots: 10 }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <h2 className="text-2xl font-bold text-maineBlue">{t('profile.registerForClasses')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableClasses.map((classItem, index) => (
            <div key={index} className="bg-weatheredWhite border-2 border-gray-300 rounded-lg p-4 flex flex-col text-center">
              <div className="flex-1 mb-4">
                <h4 className="font-bold text-gray-800 text-lg mb-2">{classItem.name}</h4>
                <p className="text-gray-600 text-sm">Instructor: {classItem.instructor}</p>
                <p className="text-gray-600 text-sm">{classItem.time}</p>
                <p className="text-sm text-green-600">{t('profile.spotsAvailable').replace('{spots}', classItem.spots.toString())}</p>
              </div>
              <button className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black w-full">
                {t('profile.register')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function useTermsModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const termsContent = `Terms of Service for Porkchop (effective July 2025)

Welcome to Porkchop. By using this app, you agree to be bound by the following terms and conditions.`;
  return { modalOpen, setModalOpen, termsContent };
}

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [talentPoints, setTalentPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [showTalents, setShowTalents] = useState(false);
  const [selectedTalentTree, setSelectedTalentTree] = useState<string | null>(null);
  const [unlockedTalents, setUnlockedTalents] = useState<string[]>([]);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<{name: string, videoUrl: string} | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [garageSetup, setGarageSetup] = useState<string>('Home Garage');
  const [termsContent, setTermsContent] = useState<string>('Loading terms and conditions...');
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{title: string, description: string} | null>(null);
  const [showClassScheduleModal, setShowClassScheduleModal] = useState(false);
  const [showClassRegistrationModal, setShowClassRegistrationModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState('');
  
  // Report filtering states
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30days');
  const [selectedStudentSegment, setSelectedStudentSegment] = useState<string>('all');
  const [selectedUserRole, setSelectedUserRole] = useState<string>('administrator');
  
  const [levelProgress, setLevelProgress] = useState({
    title: LEVEL_TITLES_AND_ICONS[0].title,
    level: 1,
    icon: LEVEL_TITLES_AND_ICONS[0].icon,
    current: 0,
    required: 100,
    progressPercent: 0,
  });

  // Filter options for reports
  const filterOptions = {
    userRoles: [
      { value: 'administrator', label: 'School Administrator', description: 'High-level institutional overview' },
      { value: 'department_head', label: 'Department Head', description: 'Department-specific insights' },
      { value: 'instructor', label: 'Individual Instructor', description: 'Class-specific data only' },
      { value: 'coordinator', label: 'Academic Coordinator', description: 'Cross-department analysis' }
    ],
    departments: [
      { value: 'all', label: 'All Departments' },
      { value: 'culinary_arts', label: 'Culinary Arts' },
      { value: 'baking_pastry', label: 'Baking & Pastry' },
      { value: 'business', label: 'Culinary Business' },
      { value: 'nutrition', label: 'Nutrition & Dietetics' }
    ],
    classes: [
      { value: 'all', label: 'All Classes' },
      { value: 'fundamentals', label: 'Fundamentals of Cooking' },
      { value: 'advanced_techniques', label: 'Advanced Culinary Techniques' },
      { value: 'food_safety', label: 'Food Safety & Sanitation' },
      { value: 'menu_planning', label: 'Menu Planning & Costing' },
      { value: 'baking_basics', label: 'Baking Fundamentals' },
      { value: 'pastry_arts', label: 'Advanced Pastry Arts' }
    ],
    timeRanges: [
      { value: '7days', label: 'Last 7 Days' },
      { value: '30days', label: 'Last 30 Days' },
      { value: 'semester', label: 'Current Semester' },
      { value: 'academic_year', label: 'Academic Year' },
      { value: 'custom', label: 'Custom Range' }
    ],
    studentSegments: [
      { value: 'all', label: 'All Students' },
      { value: 'top_performers', label: 'Top 25% Performers' },
      { value: 'struggling', label: 'Students Needing Support' },
      { value: 'full_time', label: 'Full-Time Students' },
      { value: 'part_time', label: 'Part-Time Students' },
      { value: 'certificate', label: 'Certificate Program' },
      { value: 'diploma', label: 'Diploma Program' }
    ]
  };

  // Load terms from the public/TERMS.md file
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const response = await fetch('/TERMS.md');
        if (!response.ok) {
          throw new Error('Failed to load terms and conditions');
        }
        const text = await response.text();
        setTermsContent(text);
      } catch (error) {
        console.error('Error loading terms:', error);
        setTermsContent('Failed to load terms and conditions. Please try again later.');
      }
    };

    loadTerms();
  }, []);

  const { modalOpen: termsModalOpenState, setModalOpen: setTermsModalOpenState, termsContent: termsContentState } = useTermsModal();

  // 9 talents per tree, unlock at 10, 14, 25, 30, 36, 42, 48, 55, 60
  const talentTrees = {
    'Engine Master': [
      { name: t('profile.talents.engineSavant'), icon: FireIcon, unlockLevel: 10, description: t('profile.talents.engineSavantDesc') },
      { name: t('profile.talents.diagnosticsExpert'), icon: ShieldCheckIcon, unlockLevel: 14, description: t('profile.talents.diagnosticsExpertDesc') },
      { name: t('profile.talents.mechanicalWill'), icon: StarIcon, unlockLevel: 25, description: t('profile.talents.mechanicalWillDesc') },
      { name: t('profile.talents.precisionPro'), icon: StarIcon, unlockLevel: 30, description: t('profile.talents.precisionProDesc') },
      { name: t('profile.talents.toolMaster'), icon: SparklesIcon, unlockLevel: 36, description: t('profile.talents.toolMasterDesc') },
      { name: t('profile.talents.systemSpecialist'), icon: CakeIcon, unlockLevel: 42, description: t('profile.talents.systemSpecialistDesc') },
      { name: t('profile.talents.automotiveGuru'), icon: StarIcon, unlockLevel: 48, description: t('profile.talents.automotiveGuruDesc') },
      { name: t('profile.talents.steelShield'), icon: ShieldCheckIcon, unlockLevel: 55, description: t('profile.talents.steelShieldDesc') },
      { name: t('profile.talents.engineMaster'), icon: TrophyIcon, unlockLevel: 60, description: t('profile.talents.engineMasterDesc') },
    ],
    'Electronics Expert': [
      { name: t('profile.talents.circuitTamer'), icon: FireIcon, unlockLevel: 10, description: t('profile.talents.circuitTamerDesc') },
      { name: t('profile.talents.wireMaster'), icon: SparklesIcon, unlockLevel: 14, description: t('profile.talents.wireMasterDesc') },
      { name: t('profile.talents.voltageChampion'), icon: StarIcon, unlockLevel: 25, description: t('profile.talents.voltageChampionDesc') },
      { name: t('profile.talents.sensorSpecialist'), icon: StarIcon, unlockLevel: 30, description: t('profile.talents.sensorSpecialistDesc') },
      { name: t('profile.talents.diagnosticDynamo'), icon: SparklesIcon, unlockLevel: 36, description: t('profile.talents.diagnosticDynamoDesc') },
      { name: t('profile.talents.ecoExpert'), icon: CakeIcon, unlockLevel: 42, description: t('profile.talents.ecoExpertDesc') },
      { name: t('profile.talents.powerPro'), icon: StarIcon, unlockLevel: 48, description: t('profile.talents.powerProDesc') },
      { name: t('profile.talents.circuitGuardian'), icon: ShieldCheckIcon, unlockLevel: 55, description: t('profile.talents.circuitGuardianDesc') },
      { name: t('profile.talents.electronicsGod'), icon: TrophyIcon, unlockLevel: 60, description: t('profile.talents.electronicsGodDesc') },
    ],
    'Transmission Specialist': [
      { name: t('profile.talents.gearWhisperer'), icon: CakeIcon, unlockLevel: 10, description: t('profile.talents.gearWhispererDesc') },
      { name: t('profile.talents.shiftOracle'), icon: ShieldCheckIcon, unlockLevel: 14, description: t('profile.talents.shiftOracleDesc') },
      { name: t('profile.talents.clutchControl'), icon: StarIcon, unlockLevel: 25, description: t('profile.talents.clutchControlDesc') },
      { name: t('profile.talents.transmissionPro'), icon: StarIcon, unlockLevel: 30, description: t('profile.talents.transmissionProDesc') },
      { name: t('profile.talents.drivetrainDynamo'), icon: CakeIcon, unlockLevel: 36, description: t('profile.talents.drivetrainDynamoDesc') },
      { name: t('profile.talents.fluidFinesse'), icon: SparklesIcon, unlockLevel: 42, description: t('profile.talents.fluidFinesseDesc') },
      { name: t('profile.talents.gearGenius'), icon: CakeIcon, unlockLevel: 48, description: t('profile.talents.gearGeniusDesc') },
      { name: t('profile.talents.transmissionTitan'), icon: AcademicCapIcon, unlockLevel: 55, description: t('profile.talents.transmissionTitanDesc') },
      { name: t('profile.talents.transmissionMaster'), icon: TrophyIcon, unlockLevel: 60, description: t('profile.talents.transmissionMasterDesc') },
    ],
  };

  const handleLogout = async () => {
    redirectToLogout('/.netlify/functions/auth-logout');
  };

  // Report categories with 2 reports each
  const reportCategories = [
    {
      title: 'Student Progress',
      reports: [
        { title: '📊 Skill Mastery Tracking', description: 'Monitor student progress in culinary skills and certifications', metrics: ['Knife skills progression', 'Cooking techniques proficiency', 'Food safety certification', 'Recipe completion rates'], color: 'blue' },
        { title: '📈 Learning Analytics', description: 'Analyze engagement, quiz scores, and knowledge retention', metrics: ['Module time tracking', 'Quiz/test scores', 'Video engagement metrics', 'Knowledge retention rates'], color: 'indigo' }
      ]
    },
    {
      title: 'Class Analytics',
      reports: [
        { title: '👥 Class Performance', description: 'View class scores, completion rates, and knowledge gaps', metrics: ['Average scores by module', 'Completion rates by demographic', 'Common knowledge gaps', 'Assignment submission timeliness'], color: 'green' },
        { title: '🎤 Live Session Metrics', description: 'Track attendance and engagement in live cooking sessions', metrics: ['Attendance rates', 'Participation levels', 'Q&A engagement', 'Session feedback scores'], color: 'teal' }
      ]
    },
    {
      title: 'Culinary Metrics',
      reports: [
        { title: '🍳 Recipe Performance', description: 'Analyze recipe success rates and cooking outcomes', metrics: ['Recipe success rates', 'Common modifications', 'Ingredient substitutions', 'Difficulty ratings'], color: 'orange' },
        { title: '🔪 Technique Analysis', description: 'Track progress on specific culinary techniques and skills', metrics: ['Most challenging techniques', 'Common mistakes by technique', 'Time-to-proficiency metrics', 'Video replay frequency'], color: 'amber' }
      ]
    },
    {
      title: 'Operations',
      reports: [
        { title: '🏪 Kitchen Management', description: 'Monitor equipment usage and operational efficiency', metrics: ['Equipment usage statistics', 'Ingredient waste tracking', 'Inventory management', 'Equipment maintenance'], color: 'purple' },
        { title: '🛡️ Safety & Compliance', description: 'Track food safety violations and compliance metrics', metrics: ['Food safety violations', 'Sanitation check completion', 'Incident reports', 'Allergy compliance tracking'], color: 'red' }
      ]
    },
    {
      title: 'Engagement',
      reports: [
        { title: '📱 Platform Usage', description: 'Analyze student interaction with the learning platform', metrics: ['Peak usage times', 'Feature adoption rates', 'Mobile vs desktop usage', 'Session duration patterns'], color: 'pink' },
        { title: '👥 Community Engagement', description: 'Track social learning and community participation', metrics: ['Forum participation', 'Recipe sharing metrics', 'Peer feedback statistics', 'Social learning interactions'], color: 'purple' }
      ]
    }
  ];

  const nextReport = () => {
    setCurrentReportIndex((prev) => (prev + 1) % reportCategories.length);
  };

  const prevReport = () => {
    setCurrentReportIndex((prev) => (prev - 1 + reportCategories.length) % reportCategories.length);
  };

  const handleGenerateReport = (reportTitle: string, reportDescription: string) => {
    setSelectedReport({ title: reportTitle, description: reportDescription });
    setShowGenerateModal(true);
  };

  // Map report titles to file names
  const getReportFileName = (reportTitle: string) => {
    const titleMap: { [key: string]: string } = {
      '📊 Skill Mastery Tracking': 'skill-mastery-tracking',
      '📈 Learning Analytics': 'learning-analytics',
      '👥 Class Performance': 'class-performance',
      '🎤 Live Session Metrics': 'live-session-metrics',
      '🍳 Recipe Performance': 'recipe-performance',
      '🔪 Technique Analysis': 'technique-analysis',
      '🏪 Kitchen Management': 'kitchen-management',
      '🛡️ Safety & Compliance': 'safety-compliance',
      '📱 Platform Usage': 'platform-usage',
      '👥 Community Engagement': 'community-engagement'
    };
    return titleMap[reportTitle] || 'unknown-report';
  };

  const generatePDF = async (reportTitle: string) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    const fileName = getReportFileName(reportTitle);
    
    // Get filter labels for display
    const userRoleLabel = filterOptions.userRoles.find(r => r.value === selectedUserRole)?.label || 'Administrator';
    const departmentLabel = filterOptions.departments.find(d => d.value === selectedDepartment)?.label || 'All Departments';
    const classLabel = filterOptions.classes.find(c => c.value === selectedClass)?.label || 'All Classes';
    const timeRangeLabel = filterOptions.timeRanges.find(t => t.value === selectedTimeRange)?.label || 'Last 30 Days';
    const segmentLabel = filterOptions.studentSegments.find(s => s.value === selectedStudentSegment)?.label || 'All Students';
    
    // Clean text function to remove problematic characters
    const cleanText = (text: string) => {
      return text
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
        .replace(/•/g, '-') // Replace bullets with dashes
        .replace(/&/g, 'and') // Replace ampersands
        .replace(/[""]/g, '"') // Replace smart quotes
        .replace(/['']/g, "'") // Replace smart apostrophes
        .trim();
    };
    
    // Set background color (light gray like your app)
    doc.setFillColor(248, 250, 252); // Very light gray background
    doc.rect(0, 0, 210, 297, 'F'); // Fill entire page
    
    // Create main rounded card with thick blue border (like your About Us page)
    doc.setFillColor(255, 255, 255); // White card background
    
    // Draw rounded rectangle for main card
    const cardX = 15, cardY = 15, cardW = 180, cardH = 267, radius = 8;
    
    // Main card background with rounded corners
    doc.roundedRect(cardX, cardY, cardW, cardH, radius, radius, 'F');
    
    // Subtle border with rounded corners
    doc.setDrawColor(100, 116, 139); // Muted slate gray border
    doc.setLineWidth(0.8); // Very thin border
    doc.roundedRect(cardX, cardY, cardW, cardH, radius, radius, 'S');
    
    // Header subcard with color
    doc.setFillColor(239, 246, 255); // Light blue background
    doc.roundedRect(25, 25, 160, 40, 6, 6, 'F'); // Header subcard background
    doc.setDrawColor(59, 130, 246); // Blue border
    doc.setLineWidth(0.5); // Very thin border for subcard
    doc.roundedRect(25, 25, 160, 40, 6, 6, 'S'); // Header subcard border
    
    // Load and add the actual logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        logoImg.onload = () => {
          // Add larger logo image centered in header
          doc.addImage(logoImg, 'PNG', 30, 28, 30, 20); // x, y, width, height (larger)
          resolve(true);
        };
        logoImg.onerror = reject;
        logoImg.src = '/logo.png';
      });
    } catch (error) {
      console.log('Logo not found, using text fallback');
      // Fallback - center the report title
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235);
      const titleWidth = doc.getTextWidth(cleanText(reportTitle));
      doc.text(cleanText(reportTitle), 105 - titleWidth/2, 42);
    }
    
    // Report title (main heading) centered in header subcard
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235); // Maine Blue
    doc.setFont('helvetica', 'bold'); // Bold title
    const titleWidth = doc.getTextWidth(cleanText(reportTitle));
    doc.text(cleanText(reportTitle), 105 - titleWidth/2, 38);
    
    doc.setFont('helvetica', 'normal'); // Reset to normal
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const platformWidth = doc.getTextWidth(cleanText('Culinary Education Analytics Platform'));
    doc.text(cleanText('Culinary Education Analytics Platform'), 105 - platformWidth/2, 48);
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const dateWidth = doc.getTextWidth(cleanText(`Generated: ${currentDate} | ${userRoleLabel}`));
    doc.text(cleanText(`Generated: ${currentDate} | ${userRoleLabel}`), 105 - dateWidth/2, 55);
    
    const filterWidth = doc.getTextWidth(cleanText(`${departmentLabel} | ${timeRangeLabel}`));
    doc.text(cleanText(`${departmentLabel} | ${timeRangeLabel}`), 105 - filterWidth/2, 62);
    
    // Executive Summary subcard (Green theme)
    doc.setFillColor(240, 253, 244); // Light green background
    doc.roundedRect(25, 75, 160, 45, 6, 6, 'F'); // Subcard background
    doc.setDrawColor(34, 197, 94); // Green border
    doc.setLineWidth(0.5); // Very thin border for subcard
    doc.roundedRect(25, 75, 160, 45, 6, 6, 'S'); // Subcard border
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold'); // Bold title
    doc.setTextColor(22, 163, 74); // Green for section headers
    const summaryWidth = doc.getTextWidth(cleanText('Executive Summary'));
    doc.text(cleanText('Executive Summary'), 105 - summaryWidth/2, 87);
    doc.setFont('helvetica', 'normal'); // Reset to normal
    
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    
    if (fileName === 'skill-mastery-tracking') {
      const line1Width = doc.getTextWidth(cleanText('This report analyzes student skill development across core culinary competencies.'));
      doc.text(cleanText('This report analyzes student skill development across core culinary competencies.'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('Data reflects performance metrics for knife skills, cooking techniques, food safety,'));
      doc.text(cleanText('Data reflects performance metrics for knife skills, cooking techniques, food safety,'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('and recipe execution during the current academic period.'));
      doc.text(cleanText('and recipe execution during the current academic period.'), 105 - line3Width/2, 111);
    } else if (fileName === 'class-performance') {
      const line1Width = doc.getTextWidth(cleanText('This report provides comprehensive analysis of class-level performance metrics'));
      doc.text(cleanText('This report provides comprehensive analysis of class-level performance metrics'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('including completion rates, knowledge gaps, and instructor effectiveness across'));
      doc.text(cleanText('including completion rates, knowledge gaps, and instructor effectiveness across'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('all culinary program courses for the current semester.'));
      doc.text(cleanText('all culinary program courses for the current semester.'), 105 - line3Width/2, 111);
    } else if (fileName === 'live-session-metrics') {
      const line1Width = doc.getTextWidth(cleanText('This report examines student engagement and participation in live cooking'));
      doc.text(cleanText('This report examines student engagement and participation in live cooking'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('demonstrations and interactive sessions, measuring attendance, participation,'));
      doc.text(cleanText('demonstrations and interactive sessions, measuring attendance, participation,'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('and learning outcomes from real-time culinary instruction.'));
      doc.text(cleanText('and learning outcomes from real-time culinary instruction.'), 105 - line3Width/2, 111);
    } else {
      const line1Width = doc.getTextWidth(cleanText('This report provides detailed analytics and insights for culinary education'));
      doc.text(cleanText('This report provides detailed analytics and insights for culinary education'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('management, offering data-driven recommendations to enhance student'));
      doc.text(cleanText('management, offering data-driven recommendations to enhance student'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('learning outcomes and institutional performance.'));
      doc.text(cleanText('learning outcomes and institutional performance.'), 105 - line3Width/2, 111);
    }
    
    // Key Performance Indicators subcard (Purple theme)
    doc.setFillColor(250, 245, 255); // Light purple background
    doc.roundedRect(25, 130, 160, 55, 6, 6, 'F'); // Subcard background
    doc.setDrawColor(147, 51, 234); // Purple border
    doc.setLineWidth(0.5); // Very thin border for subcard
    doc.roundedRect(25, 130, 160, 55, 6, 6, 'S'); // Subcard border
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold'); // Bold title
    doc.setTextColor(126, 34, 206); // Purple for section headers
    const kpiWidth = doc.getTextWidth(cleanText('Key Performance Indicators'));
    doc.text(cleanText('Key Performance Indicators'), 105 - kpiWidth/2, 142);
    doc.setFont('helvetica', 'normal'); // Reset to normal
    
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    if (fileName === 'skill-mastery-tracking') {
      // Adjust data based on filters
      const avgProficiency = selectedClass === 'fundamentals' ? '73.8%' : selectedClass === 'advanced_techniques' ? '89.4%' : '81.2%';
      const safetyRate = selectedDepartment === 'baking_pastry' ? '92.1%' : '86.7%';
      const completionRate = selectedStudentSegment === 'struggling' ? '67.3%' : selectedStudentSegment === 'top_performers' ? '96.8%' : '85.1%';
      const supportNeeded = selectedClass === 'all' ? '3 of 15' : selectedStudentSegment === 'struggling' ? '8 of 12' : '1 of 8';
      
      doc.text(cleanText('Average Skill Proficiency:'), 35, 153);
      doc.text(cleanText(avgProficiency), 130, 153);
      doc.text(cleanText('Food Safety Certification Rate:'), 35, 163);
      doc.text(cleanText(safetyRate), 130, 163);
      doc.text(cleanText('Recipe Completion Success:'), 35, 173);
      doc.text(cleanText(completionRate), 130, 173);
      doc.text(cleanText('Students Requiring Additional Support:'), 35, 183);
      doc.text(cleanText(supportNeeded), 130, 183);
    } else if (fileName === 'class-performance') {
      doc.text(cleanText('Overall Class Average:'), 35, 153);
      doc.text(cleanText('85.4%'), 130, 153);
      doc.text(cleanText('Course Completion Rate:'), 35, 163);
      doc.text(cleanText('84.9%'), 130, 163);
      doc.text(cleanText('Highest Performing Course:'), 35, 173);
      doc.text(cleanText('Food Safety and Sanitation (94%)'), 130, 173);
      doc.text(cleanText('Course Requiring Attention:'), 35, 183);
      doc.text(cleanText('Menu Planning and Costing (79%)'), 130, 183);
    } else {
      doc.text(cleanText('Overall Performance Score:'), 35, 153);
      doc.text(cleanText('85.4%'), 130, 153);
      doc.text(cleanText('Student Engagement Level:'), 35, 163);
      doc.text(cleanText('88.2%'), 130, 163);
      doc.text(cleanText('Completion Rate:'), 35, 173);
      doc.text(cleanText('84.9%'), 130, 173);
      doc.text(cleanText('Satisfaction Rating:'), 35, 183);
      doc.text(cleanText('92.1%'), 130, 183);
    }
    
    // Analysis and Recommendations subcard (Orange theme)
    doc.setFillColor(255, 247, 237); // Light orange background
    doc.roundedRect(25, 195, 160, 65, 6, 6, 'F'); // Subcard background
    doc.setDrawColor(249, 115, 22); // Orange border
    doc.setLineWidth(0.5); // Very thin border for subcard
    doc.roundedRect(25, 195, 160, 65, 6, 6, 'S'); // Subcard border
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold'); // Bold title
    doc.setTextColor(194, 65, 12); // Orange for section headers
    const analysisWidth = doc.getTextWidth(cleanText('Analysis and Recommendations'));
    doc.text(cleanText('Analysis and Recommendations'), 105 - analysisWidth/2, 207);
    doc.setFont('helvetica', 'normal'); // Reset to normal
    
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    
    if (fileName === 'skill-mastery-tracking') {
      const line1Width = doc.getTextWidth(cleanText('- Knife skills show consistent improvement with 81% average proficiency'));
      doc.text(cleanText('- Knife skills show consistent improvement with 81% average proficiency'), 105 - line1Width/2, 218);
      const line2Width = doc.getTextWidth(cleanText('- Food safety certification maintains high completion rate at 87%'));
      doc.text(cleanText('- Food safety certification maintains high completion rate at 87%'), 105 - line2Width/2, 228);
      const line3Width = doc.getTextWidth(cleanText('- Recipe execution demonstrates strong practical application skills'));
      doc.text(cleanText('- Recipe execution demonstrates strong practical application skills'), 105 - line3Width/2, 238);
      const line4Width = doc.getTextWidth(cleanText('- Recommend additional practice sessions for students below 75% threshold'));
      doc.text(cleanText('- Recommend additional practice sessions for students below 75% threshold'), 105 - line4Width/2, 248);
      const line5Width = doc.getTextWidth(cleanText('- Consider advanced modules for students achieving 90% proficiency'));
      doc.text(cleanText('- Consider advanced modules for students achieving 90% proficiency'), 105 - line5Width/2, 258);
    } else if (fileName === 'class-performance') {
      const line1Width = doc.getTextWidth(cleanText('- Food Safety and Sanitation demonstrates exemplary performance (94%)'));
      doc.text(cleanText('- Food Safety and Sanitation demonstrates exemplary performance (94%)'), 105 - line1Width/2, 218);
      const line2Width = doc.getTextWidth(cleanText('- Baking and Pastry Arts shows strong student engagement (91%)'));
      doc.text(cleanText('- Baking and Pastry Arts shows strong student engagement (91%)'), 105 - line2Width/2, 228);
      const line3Width = doc.getTextWidth(cleanText('- Menu Planning and Costing requires curriculum review and support'));
      doc.text(cleanText('- Menu Planning and Costing requires curriculum review and support'), 105 - line3Width/2, 238);
      const line4Width = doc.getTextWidth(cleanText('- Recommend instructor development for underperforming courses'));
      doc.text(cleanText('- Recommend instructor development for underperforming courses'), 105 - line4Width/2, 248);
      const line5Width = doc.getTextWidth(cleanText('- Implement peer mentoring programs to improve completion rates'));
      doc.text(cleanText('- Implement peer mentoring programs to improve completion rates'), 105 - line5Width/2, 258);
    } else {
      const line1Width = doc.getTextWidth(cleanText('- Performance metrics indicate strong overall program effectiveness'));
      doc.text(cleanText('- Performance metrics indicate strong overall program effectiveness'), 105 - line1Width/2, 218);
      const line2Width = doc.getTextWidth(cleanText('- Student engagement levels exceed industry benchmarks'));
      doc.text(cleanText('- Student engagement levels exceed industry benchmarks'), 105 - line2Width/2, 228);
      const line3Width = doc.getTextWidth(cleanText('- Completion rates demonstrate successful retention strategies'));
      doc.text(cleanText('- Completion rates demonstrate successful retention strategies'), 105 - line3Width/2, 238);
      const line4Width = doc.getTextWidth(cleanText('- Recommend continued monitoring of identified improvement areas'));
      doc.text(cleanText('- Recommend continued monitoring of identified improvement areas'), 105 - line4Width/2, 248);
      const line5Width = doc.getTextWidth(cleanText('- Consider expansion of successful program elements'));
      doc.text(cleanText('- Consider expansion of successful program elements'), 105 - line5Width/2, 258);
    }
    
    // Footer (inside card at bottom)
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const footerWidth1 = doc.getTextWidth(cleanText('PorkChop Ed Tech | Culinary Education Analytics Platform'));
    doc.text(cleanText('PorkChop Ed Tech | Culinary Education Analytics Platform'), 105 - footerWidth1/2, 270);
    const footerWidth2 = doc.getTextWidth(cleanText('This report contains demonstration data for platform capabilities.'));
    doc.text(cleanText('This report contains demonstration data for platform capabilities.'), 105 - footerWidth2/2, 277);
    
    return doc;
  };

  const generateReportContent = (reportTitle: string, format: 'csv' | 'pdf' | 'xlsx') => {
    const fileName = getReportFileName(reportTitle);
    const currentDate = new Date().toLocaleDateString();
    
    if (format === 'csv') {
      // Generate CSV content
      if (fileName === 'skill-mastery-tracking') {
        return `Student ID,Student Name,Knife Skills Score,Cooking Techniques Score,Food Safety Certification,Recipe Completion Rate,Overall Progress
STU001,Alex Johnson,85,78,Certified,80%,81%
STU002,Maria Garcia,92,88,Certified,95%,92%
STU003,David Chen,67,72,In Progress,65%,68%
STU004,Sarah Williams,88,85,Certified,90%,88%
STU005,Michael Brown,75,80,Certified,75%,77%
STU006,Emma Davis,90,87,Certified,85%,87%
STU007,James Wilson,82,79,In Progress,78%,80%
STU008,Lisa Anderson,95,92,Certified,98%,95%
STU009,Robert Taylor,70,75,Certified,70%,72%
STU010,Jennifer Martinez,86,83,Certified,88%,86%`;
      } else if (fileName === 'class-performance') {
        return `Class ID,Class Name,Average Score,Completion Rate,Knowledge Gaps,Assignment Timeliness,Instructor
CLS001,Fundamentals of Cooking,82,85%,Knife Skills,90%,Chef Martinez
CLS002,Advanced Culinary Techniques,88,78%,Sauce Making,85%,Chef Johnson
CLS003,Baking & Pastry Arts,91,92%,Bread Making,95%,Chef Williams
CLS004,International Cuisine,85,80%,Spice Usage,88%,Chef Chen
CLS005,Food Safety & Sanitation,94,96%,Temperature Control,98%,Chef Davis
CLS006,Menu Planning & Costing,79,75%,Cost Analysis,82%,Chef Brown
CLS007,Restaurant Operations,83,82%,Service Flow,87%,Chef Wilson
CLS008,Nutrition & Dietary Planning,87,89%,Macro Calculations,91%,Chef Anderson
CLS009,Culinary Arts Capstone,90,88%,Presentation Skills,93%,Chef Taylor
CLS010,Professional Kitchen Management,86,84%,Team Leadership,89%,Chef Garcia`;
      } else {
        return `Report Type,${reportTitle}
Generated Date,${currentDate}
Sample Data,This is demo data for ${reportTitle}
Metric 1,85%
Metric 2,78%
Metric 3,92%
Status,Active`;
      }
    } else {
      // Generate Excel-compatible CSV
      return `${reportTitle} - Comprehensive Analysis
Generated: ${currentDate}
Report Type: Excel Format Demo

Summary Statistics:
Metric,Value,Target,Status
Overall Performance,85%,80%,Above Target
Completion Rate,78%,75%,Above Target
Student Satisfaction,92%,85%,Excellent
Engagement Level,88%,80%,Above Target

Detailed Data:
ID,Name,Score,Status,Notes
001,Sample Entry 1,85,Good,Demo data
002,Sample Entry 2,92,Excellent,Demo data
003,Sample Entry 3,78,Satisfactory,Demo data
004,Sample Entry 4,88,Good,Demo data
005,Sample Entry 5,91,Excellent,Demo data

Analysis Notes:
This is demonstration data for ${reportTitle}
In production this would contain real student/class data
Charts and pivot tables would be included
Automated calculations and formulas would be present`;
    }
  };

  const handleDownload = async (format: 'csv' | 'pdf' | 'xlsx') => {
    if (!selectedReport) return;
    
    const fileName = getReportFileName(selectedReport.title);
    
    if (format === 'pdf') {
      // Generate and download actual PDF
      const doc = await generatePDF(selectedReport.title);
      doc.save(`${fileName}.pdf`);
      return;
    }
    
    // Handle CSV and Excel formats
    const content = generateReportContent(selectedReport.title, format);
    
    // Create blob with appropriate MIME type
    let mimeType: string;
    let fileExtension: string;
    
    if (format === 'csv') {
      mimeType = 'text/csv;charset=utf-8;';
      fileExtension = 'csv';
    } else {
      mimeType = 'text/csv;charset=utf-8;';
      fileExtension = 'xlsx';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // ReportCard component for the reports modal
  const ReportCard = ({ title, description, metrics, color }: {
    title: string;
    description: string;
    metrics: string[];
    color: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 border-blue-500 text-blue-800',
      indigo: 'bg-indigo-50 border-indigo-500 text-indigo-800',
      green: 'bg-green-50 border-green-500 text-green-800',
      teal: 'bg-teal-50 border-teal-500 text-teal-800',
      orange: 'bg-orange-50 border-orange-500 text-orange-800',
      amber: 'bg-amber-50 border-amber-500 text-amber-800',
      purple: 'bg-purple-50 border-purple-500 text-purple-800',
      pink: 'bg-pink-50 border-pink-500 text-pink-800',
      red: 'bg-red-50 border-red-500 text-red-800',
      gray: 'bg-gray-50 border-gray-500 text-gray-800'
    };

    const buttonClasses = {
      blue: 'bg-blue-600 hover:bg-blue-700',
      indigo: 'bg-indigo-600 hover:bg-indigo-700',
      green: 'bg-green-600 hover:bg-green-700',
      teal: 'bg-teal-600 hover:bg-teal-700',
      orange: 'bg-orange-600 hover:bg-orange-700',
      amber: 'bg-amber-600 hover:bg-amber-700',
      purple: 'bg-purple-600 hover:bg-purple-700',
      pink: 'bg-pink-600 hover:bg-pink-700',
      red: 'bg-red-600 hover:bg-red-700',
      gray: 'bg-gray-600 hover:bg-gray-700'
    };

    return (
      <div className={`${colorClasses[color as keyof typeof colorClasses]} border-4 rounded-lg p-4 text-center`}>
        <h3 className="text-lg font-bold mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2">Includes:</p>
          <ul className="text-xs space-y-1 text-left inline-block">
            {metrics.map((metric, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1 h-1 bg-current rounded-full mr-2"></span>
                {metric}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <button 
            onClick={() => handleGenerateReport(title, description)}
            className={`${buttonClasses[color as keyof typeof buttonClasses]} text-white px-4 py-2 rounded transition-colors text-sm`}
          >
            Generate Report
          </button>
        </div>
      </div>
    );
  };

  // Handle permanent selection of a talent with database persistence
  const handleSelectTalent = async (talentName: string, isRightClick: boolean = false) => {
    if (!userProfile) return;

    let newSelectedTalents: string[];
    
    if (isRightClick && selectedTalents.includes(talentName)) {
      // Right-click: Remove talent (undo)
      newSelectedTalents = selectedTalents.filter(talent => talent !== talentName);
    } else if (!isRightClick && !selectedTalents.includes(talentName)) {
      // Left-click: Add talent (with validation)
      const maxTalents = Math.floor(userProfile.xp / 100); // 1 talent per 100 XP
      if (selectedTalents.length >= maxTalents) {
        alert(`You can only select ${maxTalents} talents at your current level.`);
        return;
      }
      newSelectedTalents = [...selectedTalents, talentName];
    } else {
      return; // No change needed
    }

    // Update local state immediately for responsive UI
    setSelectedTalents(newSelectedTalents);

    // Save to database
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_talents: newSelectedTalents })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error saving talents:', error);
        // Revert local state if save failed
        setSelectedTalents(selectedTalents);
        alert('Failed to save talent selection. Please try again.');
      }
    } catch (error) {
      console.error('Error saving talents:', error);
      // Revert local state if save failed
      setSelectedTalents(selectedTalents);
      alert('Failed to save talent selection. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError('');
      try {
        if (!user) {
          setError('Not authenticated. Please sign in again.');
          setLoading(false);
          return;
        }

        const [profileResponse] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user?.id).single(),
        ]);

        if (profileResponse.error) {
          setError('Could not load your profile: ' + profileResponse.error.message);
          setLoading(false);
          return;
        }

        const profile = profileResponse.data;
        if (!profile) {
          setError('No profile found. Please try signing out and in again.');
          setLoading(false);
          return;
        }

        // Ensure XP is a number and has a default value of 0
        const xp = typeof profile.xp === 'number' ? profile.xp : 0;
        console.log('Profile XP:', profile.xp, 'Parsed XP:', xp);
        
        // Map the database fields to the component's state
        setUserProfile({
          ...profile,
          name: profile.name || 'User',
          xp,
          // Map backend automotive_experience to UI display value
          experience: EXPERIENCE_LEVEL_DISPLAY[profile.automotive_experience as keyof typeof EXPERIENCE_LEVEL_DISPLAY] || 'Beginner',
          garageSetup: profile.garage_setup || 'Home Garage',
          certifications: profile.certifications || [],
          vehicleType: profile.vehicle_type || []
        });

        // Also update the local garageSetup state
        setGarageSetup(profile.garage_setup || 'Home Garage');

        // Load selected talents from database (optional - field might not exist yet)
        if (profile.selected_talents && Array.isArray(profile.selected_talents)) {
          setSelectedTalents(profile.selected_talents);
        } else {
          // Initialize with empty array if field doesn't exist
          setSelectedTalents([]);
        }

        // Calculate talent points based on XP
        const calculatedTalentPoints = Math.floor(xp / 100);
        setTalentPoints(calculatedTalentPoints);
        
        // Calculate level progress based on XP - USE CORRECTED CALCULATION
        const { level, current, required } = getCorrectXPProgress(xp);
        
        // Map level to title index
        const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
        const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
        const progressPercent = (current / required) * 100;
        
        setLevelProgress({
          title,
          level,
          icon,
          current,
          required,
          progressPercent,
        });
        
        // Auto-enable talents at level 10
        if (level >= 10) {
          setShowTalents(true);
        }

      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('An unexpected error occurred while loading your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProfile();
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      const points = Math.floor(userProfile.xp / 100);
      setTalentPoints(points);
      
      // Update level progress when userProfile changes - USE CORRECTED CALCULATION
      const { level, current, required } = getCorrectXPProgress(userProfile.xp);
      const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
      const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
      const progressPercent = (current / required) * 100;
      
      setLevelProgress({
        title,
        level,
        icon,
        current,
        required,
        progressPercent,
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && userProfile.garageSetup) {
      setGarageSetup(userProfile.garageSetup);
    }
  }, [userProfile]);

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userProfile) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      try {
        setAvatarUploading(true);
        console.log('Starting avatar upload process...');
        
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // Don't use nested paths
        
        console.log('Uploading file:', fileName);
        
        // Upload to Supabase Storage using the 'avatarphotos' bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatarphotos')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type // Explicitly set content type
          });
          
        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get the public URL
        const { data } = supabase.storage
          .from('avatarphotos')
          .getPublicUrl(filePath);
          
        const avatarUrl = data?.publicUrl;
        
        console.log('Avatar URL:', avatarUrl);
        
        if (!avatarUrl) {
          throw new Error('Failed to get avatar URL');
        }
        
        // Update the user profile with the new avatar URL
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ avatar: avatarUrl })
          .eq('id', userProfile.id);
          
        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }
        
        console.log('Profile update successful:', updateData);
        
        // Update the local state with proper type safety
        setUserProfile(prevProfile => {
          if (prevProfile) {
            return {
              ...prevProfile,
              avatar: avatarUrl
            };
          }
          return prevProfile;
        });
        
        console.log('Avatar updated successfully');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Failed to upload avatar. Please try again.');
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  // Corrected level calculation function - 6500 XP should be Level 10
  const getCorrectLevel = (totalXP: number) => {
    // For 6500 XP to be Level 10, we need to check if XP >= the requirement for that level
    if (totalXP >= 6500) return 10;
    if (totalXP >= 5400) return 9;
    if (totalXP >= 4500) return 8;
    if (totalXP >= 3600) return 7;
    if (totalXP >= 2800) return 6;
    if (totalXP >= 2100) return 5;
    if (totalXP >= 1400) return 4;
    if (totalXP >= 900) return 3;
    if (totalXP >= 400) return 2;
    return 1;
  };

  // Corrected XP progress calculation
  const getCorrectXPProgress = (totalXP: number) => {
    const level = getCorrectLevel(totalXP);
    
    // Debug the calculation
    console.log('🔧 XP Progress Debug:', {
      totalXP,
      level,
      currentLevelXP: WOW_CLASSIC_XP_TABLE[level],
      nextLevelXP: WOW_CLASSIC_XP_TABLE[level + 1]
    });
    
    const currentLevelXP = WOW_CLASSIC_XP_TABLE[level] || 0;
    const nextLevelXP = WOW_CLASSIC_XP_TABLE[level + 1] || 0;
    
    // For level 10 (6500 XP), we should show 0 progress toward level 11
    if (level === 10 && totalXP === 6500) {
      return { 
        level: 10, 
        current: 0,  // At exactly level 10, no progress toward level 11
        required: 1100  // Need 1100 XP to reach level 11
      };
    }
    
    const current = totalXP - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    
    return { level, current, required };
  };

  // Add a refresh function to reload profile data
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error refreshing profile:', error);
        return;
      }

      if (profile) {
        const xp = typeof profile.xp === 'number' ? profile.xp : 0;
        
        // Update user profile with new data
        setUserProfile({
          ...profile,
          name: profile.name || 'User',
          xp,
          experience: EXPERIENCE_LEVEL_DISPLAY[profile.automotive_experience as keyof typeof EXPERIENCE_LEVEL_DISPLAY] || 'Beginner',
          garageSetup: profile.garage_setup || 'Home Garage',
          certifications: profile.certifications || [],
          vehicleType: profile.vehicle_type || []
        });

        // Use corrected level calculation
        const { level, current, required } = getCorrectXPProgress(xp);
        const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
        const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
        const progressPercent = (current / required) * 100;
        
        console.log('🎯 Corrected Level Debug:', { 
          xp, 
          level, 
          current, 
          required, 
          title, 
          progressPercent,
          expectedLevel10: xp >= 6500 ? 'Should be Level 10+' : 'Below Level 10'
        });
        
        setLevelProgress({
          title,
          level,
          icon,
          current,
          required,
          progressPercent,
        });

        // Auto-enable talents at level 10
        if (level >= 10) {
          console.log(' Level 10+ reached! Enabling talents...');
          setShowTalents(true);
        } else {
          console.log('⏳ Not level 10 yet. Current level:', level);
        }

        // Update talent points
        setTalentPoints(Math.floor(xp / 100));

        console.log('Profile refreshed - New XP:', xp, 'Level:', level);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Auto-refresh profile data every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshProfile();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div className="text-center mt-10">Loading profile...</div>;
  } 

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  } 

  if (!userProfile) {
    return <div className="text-center py-8">No profile data found.</div>;
  } 

  return (
    <div className="max-w-2xl mx-auto bg-weatheredWhite rounded-lg shadow-lg border-4 border-maineBlue max-h-[calc(100vh-80px)] flex flex-col">
      {/* Header: Responsive grid layout - FIXED */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center mb-6 p-4 sm:p-6 pb-0">
        {/* Column 1: Avatar */}
        <div className="flex justify-center" style={{ minWidth: '120px' }}>
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-maineBlue rounded-full flex items-center justify-center text-seafoam font-bold text-lg sm:text-xl overflow-hidden shrink-0 relative group border-2 border-black">
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt="Avatar" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                onLoad={() => console.log('✅ Avatar loaded:', userProfile.avatar)}
                onError={(e) => console.error('❌ Avatar failed:', userProfile.avatar, e)}
              />
            ) : (
              <span>{userProfile.name.slice(0, 2).toUpperCase()}</span>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200 cursor-pointer" style={{ zIndex: 10 }}>
              <label htmlFor="avatar-upload" className="text-white opacity-0 group-hover:opacity-100 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Name */}
        <div className="flex flex-col items-center text-center" style={{ minWidth: '160px' }}>
          <h1 className="text-2xl sm:text-3xl font-retro text-maineBlue mb-2">
            {userProfile.name}
          </h1>
          {(userProfile as any)?.program && (
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-seafoam text-maineBlue rounded-full text-xs font-bold border-2 border-maineBlue">
                🎓 {(userProfile as any).program}
              </span>
            </div>
          )}
        </div>

        {/* Column 3: Level Progress */}
        <div className="flex flex-col items-center text-center" style={{ minWidth: '120px' }}>
          {/* Leveling Display */}
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg sm:text-xl">{levelProgress.icon}</span>
              <span className="font-bold text-xs sm:text-sm">{levelProgress.title} (Lv {levelProgress.level})</span>
            </div>
            <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-seafoam transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, levelProgress.progressPercent))}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {levelProgress.current} / {levelProgress.required} XP
            </div>
          </div>
          
          {/* Show Talents Toggle */}
          <div className="flex flex-col items-center gap-1 mt-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="font-semibold text-xs">{t('profile.showTalents')}</span>
              <span className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  checked={showTalents}
                  onChange={() => setShowTalents(val => !val)}
                  className="sr-only peer"
                  id="talent-toggle"
                />
                <span
                  className={`block w-8 h-5 rounded-full shadow-inner transition-colors duration-200 ${
                    showTalents 
                      ? 'bg-maineBlue' 
                      : 'bg-gray-300'
                  }`}
                ></span>
                <span
                  className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow ${
                    showTalents ? 'translate-x-3' : ''
                  }`}
                ></span>
              </span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Divider line - FIXED */}
      <div className="w-full px-4 sm:px-6 py-3">
        <div className="w-full h-0.5 bg-gray-200 rounded-full"></div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Talent Trees and Action Buttons - Responsive Layout */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
          {/* Left side - Talent Tree Boxes */}
          {showTalents && (
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Engine Master Box */}
            <button
              onClick={() => setSelectedTalentTree('Engine Master')}
              className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-xs sm:text-sm relative group flex flex-col items-center justify-center text-center p-3"
            >
              <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <div>Engine</div>
              <div>Master</div>
              {/* Mobile-friendly tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-40 sm:w-48 border border-gray-300">
                <strong>Engine Master</strong>
                <div className="mt-1">Master engine repair and diagnostics</div>
              </div>
            </button>
            {/* Electronics Expert Box */}
            <button
              onClick={() => setSelectedTalentTree('Electronics Expert')}
              className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-xs sm:text-sm relative group flex flex-col items-center justify-center text-center p-3"
            >
              <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <div>Electronics</div>
              <div>Expert</div>
              {/* Mobile-friendly tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-40 sm:w-48 border border-gray-300">
                <strong>Electronics Expert</strong>
                <div className="mt-1">Specialize in vehicle electronics</div>
              </div>
            </button>
            {/* Transmission Specialist Box */}
            <button
              onClick={() => setSelectedTalentTree('Transmission Specialist')}
              className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-xs sm:text-sm relative group flex flex-col items-center justify-center text-center p-3"
            >
              <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <div>Transmission</div>
              <div>Specialist</div>
              {/* Mobile-friendly tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-40 sm:w-48 border border-gray-300">
                <strong>Transmission Specialist</strong>
                <div className="mt-1">Expert in transmission systems</div>
              </div>
            </button>
          </div>
          )}

          {/* Right side - Action Buttons */}
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full lg:w-auto inline-block bg-sand text-gray-800 px-4 sm:px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600 text-sm sm:text-base"
            >
              {t('profile.editProfile')}
            </button>
            <button
              onClick={() => setShowClassScheduleModal(true)}
              className="w-full lg:w-auto inline-block bg-sand text-gray-800 px-4 sm:px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600 text-sm sm:text-base"
            >
              {t('profile.classScheduleButton')}
            </button>
            <button
              onClick={() => setShowRequestsModal(true)}
              className="w-full lg:w-auto inline-block bg-sand text-gray-800 px-4 sm:px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600 text-sm sm:text-base"
            >
              {t('profile.submitRequestButton')}
            </button>
            <button
              onClick={handleLogout}
              className="w-full lg:w-auto inline-block bg-sand text-gray-800 px-4 sm:px-6 py-2 rounded-full shadow hover:bg-seafoam hover:text-maineBlue font-bold transition-colors border border-gray-600 text-sm sm:text-base"
            >
              {t('profile.signOut')}
            </button>
          </div>
        </div>

        {/* Modals */}
        <EditProfileModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          user={userProfile}
          onProfileUpdated={(updatedUser) => {
            setUserProfile(updatedUser);
            setModalOpen(false);
          }}
        />
        
        <PaymentModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          userId={user?.id || ''}
          plan="monthly"
        />
        
        <ClassScheduleModal
          open={showClassScheduleModal}
          onClose={() => setShowClassScheduleModal(false)}
          onOpenRegistration={() => setShowClassRegistrationModal(true)}
        />
        
        <ClassRegistrationModal
          open={showClassRegistrationModal}
          onClose={() => setShowClassRegistrationModal(false)}
        />
        
        <RequestsModal
          open={showRequestsModal}
          onClose={() => setShowRequestsModal(false)}
        />
        
        <TermsModal
          open={termsModalOpen}
          onClose={() => setTermsModalOpen(false)}
          content={termsContent}
        />

        {/* Talent Tutorial Modal */}
        {tutorialModalOpen && currentTutorial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => {
                  setTutorialModalOpen(false);
                  setCurrentTutorial(null);
                }}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
              
              <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">
                {currentTutorial.name} Tutorial
              </h2>
              
              <div className="aspect-video mb-4">
                <iframe
                  src={currentTutorial.videoUrl}
                  title={`${currentTutorial.name} Tutorial`}
                  className="w-full h-full rounded-lg border border-gray-300"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Master the techniques shown in this tutorial to unlock your full automotive potential!
                </p>
                <button
                  onClick={() => {
                    setTutorialModalOpen(false);
                    setCurrentTutorial(null);
                  }}
                  className="px-6 py-2 bg-maineBlue text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                >
                  {t('profile.close')} Tutorial
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Talent Tree Modal - Responsive */}
        {selectedTalentTree && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div className="flex-1"></div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {selectedTalentTree === 'Engine Master' && <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maineBlue" />}
                  {selectedTalentTree === 'Electronics Expert' && <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maineBlue" />}
                  {selectedTalentTree === 'Transmission Specialist' && <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maineBlue" />}
                  <h2 className="text-lg sm:text-2xl font-bold text-maineBlue text-center">
                    {selectedTalentTree}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTalentTree(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold flex-1 text-right"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {talentTrees[selectedTalentTree as keyof typeof talentTrees]?.map(talent => {
                  const xp = userProfile?.xp || 0;
                  // Use the corrected level calculation instead of the old one
                  const { level } = getCorrectXPProgress(xp);
                  const unlocked = level >= talent.unlockLevel;
                  const selected = selectedTalents.includes(talent.name);
                  const Icon = talent.icon;
                  
                  return (
                    <button
                      key={talent.name}
                      onClick={(e) => handleSelectTalent(talent.name, e.button === 2)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleSelectTalent(talent.name, true);
                      }}
                      disabled={!unlocked}
                      className={`relative group p-3 sm:p-4 rounded-lg transition-all border border-black min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center text-center ${
                        unlocked
                          ? selected
                            ? 'bg-maineBlue text-seafoam shadow-md'
                            : 'bg-gray-50 hover:bg-seafoam hover:text-maineBlue'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                        !unlocked 
                          ? 'opacity-40 grayscale' 
                          : selected
                            ? 'text-seafoam'
                            : selectedTalentTree === 'Engine Master'
                              ? 'text-orange-500'
                              : selectedTalentTree === 'Electronics Expert'
                                ? 'text-blue-500'
                                : 'text-green-500'
                      }`} />
                      <div className="font-bold text-xs sm:text-sm mb-1">{talent.name}</div>
                      <div className="text-xs text-gray-600 mb-1 px-1 leading-tight">{talent.description}</div>
                      {!unlocked && (
                        <div className="text-xs text-red-500">Unlocks at Level {talent.unlockLevel}</div>
                      )}
                      {selected && (
                        <div className="text-xs text-seafoam font-bold mb-1">✓ Selected</div>
                      )}
                      {selected && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add talent to unlocked list
                              if (!unlockedTalents.includes(talent.name)) {
                                setUnlockedTalents([...unlockedTalents, talent.name]);
                                console.log(`Unlocked ${talent.name}`);
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors font-medium ${
                              unlockedTalents.includes(talent.name)
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-yellow-500 text-white hover:bg-yellow-600'
                            }`}
                          >
                            {unlockedTalents.includes(talent.name) ? '✅ Unlocked' : '🔓 Unlock'}
                          </button>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

