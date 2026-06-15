import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FireIcon, ShieldCheckIcon, StarIcon, TrophyIcon, SparklesIcon, CakeIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { redirectToLogout } from '@wristband/react-client-auth';
import { useSupabase } from '../components/SupabaseProvider';
import { supabase } from '../api/supabaseClient';
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
  dietary: string[];
  cuisine: string[];
  workshopSetup: string;
  xp: number;
};

// Level titles and icons
const LEVEL_TITLES_AND_ICONS = [
  { title: "Novice Technician", icon: "🔧", level: 1 },
  { title: "Shop Assistant", icon: "⚙️", level: 2 },
  { title: "Technician", icon: "🏭", level: 3 },
  { title: "Expert", icon: "👨‍🏭", level: 4 },
  { title: "Master Engineer", icon: "🏆", level: 5 }
];

// WoW Classic XP table
const WOW_CLASSIC_XP_TABLE = [
  0, 400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500,
  7600, 8700, 9800, 11000, 12300, 13600, 15000, 16500, 18000, 19600
];

// Experience level mapping between UI labels and backend values
const EXPERIENCE_LEVEL_MAPPING = {
  'Beginner': 'new_to_manufacturing',
  'Intermediate': 'experienced_technician', 
  'Advanced': 'manufacturing_expert',
  'Professional': 'manufacturing_expert' // Both Advanced and Professional map to manufacturing_expert
} as const;

// Reverse mapping for displaying in UI
const EXPERIENCE_LEVEL_DISPLAY = {
  'new_to_manufacturing': 'Beginner',
  'experienced_technician': 'Intermediate',
  'manufacturing_expert': 'Advanced'
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
    cuisinePreference: user?.cuisine?.[0] || 'Industrial',
    dietPreference: user?.dietary?.[0] || 'None',
    workshopSetup: user?.workshopSetup || 'Basic Workshop',
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
          cuisine: [formData.cuisinePreference],
          dietary: [formData.dietPreference],
          workshop_setup: formData.workshopSetup,
          manufacturing_experience: [EXPERIENCE_LEVEL_MAPPING[formData.experienceLevel as keyof typeof EXPERIENCE_LEVEL_MAPPING]],
          program: formData.program
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        console.error(t('profile.failedToSaveProfile'));
        return;
      }

      // Update the local state with the new data
      const updatedUser = {
        ...user,
        name: formData.name,
        cuisine_preference: formData.cuisinePreference,
        diet_preference: formData.dietPreference,
        workshop_setup: formData.workshopSetup,
        experience: formData.experienceLevel
      };

      onProfileUpdated(updatedUser);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Failed to save profile changes. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border-4 border-black flex flex-col">
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
              <option value="Bachelors in Advanced Manufacturing">🎓 Bachelors in Advanced Manufacturing</option>
              <option value="Associates in Aquaculture">🎓 {t('profile.associatesAquaculture')}</option>
            </select>
            {(user as any)?.program && (user as any).program !== '' && (
              <p className="text-xs text-gray-500 text-center mt-1">{t('profile.lockedContactAdmin')}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Industry Focus */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Industry Focus</label>
            <select
              value={formData.cuisinePreference}
              onChange={(e) => setFormData({...formData, cuisinePreference: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="Aerospace">✈️ {t('profile.manufacturingFocusOptions.aerospace', { defaultValue: 'Aerospace' })}</option>
              <option value="Automotive">🚗 {t('profile.manufacturingFocusOptions.automotive', { defaultValue: 'Automotive' })}</option>
              <option value="Electronics">🔌 {t('profile.manufacturingFocusOptions.electronics', { defaultValue: 'Electronics' })}</option>
              <option value="Medical Devices">🏥 {t('profile.manufacturingFocusOptions.medicalDevices', { defaultValue: 'Medical Devices' })}</option>
              <option value="Precision Machining">⚙️ {t('profile.manufacturingFocusOptions.precisionMachining', { defaultValue: 'Precision Machining' })}</option>
              <option value="Plastics">🧪 {t('profile.manufacturingFocusOptions.plastics', { defaultValue: 'Plastics' })}</option>
              <option value="Metal Fabrication">🔧 {t('profile.manufacturingFocusOptions.metalFabrication', { defaultValue: 'Metal Fabrication' })}</option>
            </select>
          </div>

          {/* Certification */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Certifications</label>
            <select
              value={formData.dietPreference}
              onChange={(e) => setFormData({...formData, dietPreference: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="None">📋 {t('profile.certificationOptions.none', { defaultValue: 'None' })}</option>
              <option value="OSHA-10">🦺 {t('profile.certificationOptions.osha10', { defaultValue: 'OSHA-10' })}</option>
              <option value="Six Sigma Green Belt">📊 {t('profile.certificationOptions.sixSigmaGreenBelt', { defaultValue: 'Six Sigma Green Belt' })}</option>
              <option value="Lean Manufacturing">⚡ {t('profile.certificationOptions.leanManufacturing', { defaultValue: 'Lean Manufacturing' })}</option>
              <option value="ISO 9001">✅ {t('profile.certificationOptions.iso9001', { defaultValue: 'ISO 9001' })}</option>
              <option value="CNC Programming">💻 {t('profile.certificationOptions.cncProgramming', { defaultValue: 'CNC Programming' })}</option>
              <option value="Quality Inspector">🔍 {t('profile.certificationOptions.qualityInspector', { defaultValue: 'Quality Inspector' })}</option>
            </select>
          </div>

          {/* Workshop Setup */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">Workshop Access</label>
            <select
              value={formData.workshopSetup}
              onChange={(e) => setFormData({...formData, workshopSetup: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="Home Workshop">🏠 {t('profile.workshopOptions.homeWorkshop', { defaultValue: 'Home Workshop' })}</option>
              <option value="School Lab">🏫 {t('profile.workshopOptions.schoolLab', { defaultValue: 'School Lab' })}</option>
              <option value="Shared Makerspace">🔧 {t('profile.workshopOptions.sharedMakerspace', { defaultValue: 'Shared Makerspace' })}</option>
              <option value="Industrial Facility">🏭 {t('profile.workshopOptions.industrialFacility', { defaultValue: 'Industrial Facility' })}</option>
              <option value="Full Machine Shop">⚙️ {t('profile.workshopOptions.fullMachineShop', { defaultValue: 'Full Machine Shop' })}</option>
            </select>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 text-center">{t('profile.experienceLevel')}</label>
            <select
              value={formData.experienceLevel}
              onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none text-center"
            >
              <option value="Advanced">⭐ {t('profile.experienceOptions.advanced', { defaultValue: 'Advanced' })}</option>
              <option value="Beginner">🌱 {t('profile.experienceOptions.beginner', { defaultValue: 'Beginner' })}</option>
              <option value="Intermediate">📈 {t('profile.experienceOptions.intermediate', { defaultValue: 'Intermediate' })}</option>
              <option value="Professional">🏭 {t('profile.experienceOptions.professional', { defaultValue: 'Professional' })}</option>
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
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-200 bg-gray-50">
          <div></div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-maineBlue font-retro">{t('profile.termsOfService')}</h2>
            <p className="text-sm text-gray-500 italic mt-1">Patent Pending</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-8 pt-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <div 
                className="prose prose-lg max-w-none text-gray-700 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-maineBlue [&_h1]:mb-6 [&_h1]:border-b [&_h1]:border-gray-200 [&_h1]:pb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:text-gray-700 [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-maineBlue [&_a]:hover:text-blue-700 [&_a]:underline [&_strong]:font-semibold [&_strong]:text-gray-800"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
        
        {/* Fixed Footer with Button */}
        <div className="p-6 pt-4 border-t-2 border-gray-200 bg-gray-50">
          <div className="flex justify-center">
            <button 
              onClick={onClose}
              className="bg-maineBlue text-white px-8 py-3 rounded-lg font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
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
  
  const currentClasses: any[] = [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col">
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
              onClick={() => window.open('mailto:instructors@manufacturinginstitute.edu?subject=Class Schedule Inquiry', '_blank')}
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
  
  const requestCategories = [
    {
      title: 'Academic Needs',
      items: [
        { id: 'id_card', name: 'Student ID/Key Card', icon: '🎫', description: 'Request a new or replacement student ID card' },
        { id: 'textbook', name: 'Manual/Materials', icon: '📚', description: 'Request technical manuals or course materials' },
        { id: 'transcript', name: 'Transcript Request', icon: '📋', description: 'Request official transcripts' },
        { id: 'recommendation', name: 'Letter of Recommendation', icon: '✉️', description: 'Request a letter of recommendation' }
      ]
    },
    {
      title: 'Equipment & Access',
      items: [
        { id: 'uniform', name: 'Safety Gear/Workwear', icon: '👕', description: 'Request safety vests, hard hats, or work uniforms' },
        { id: 'tool_kit', name: 'Tool Kit Loaner', icon: '🔧', description: 'Request a loaner tool kit or replacement tools' },
        { id: 'equipment', name: 'Equipment Loaner', icon: '🧰', description: 'Request calipers, gauges, or other equipment' },
        { id: 'workshop_access', name: 'Workshop Access', icon: '🔑', description: 'Request after-hours workshop/lab access' }
      ]
    },
    {
      title: 'Support & Other',
      items: [
        { id: 'accommodation', name: 'Accommodation Request', icon: '🏥', description: 'Request medical or accessibility accommodations' },
        { id: 'other', name: 'Other Request', icon: '📝', description: 'Other requests or inquiries' }
      ]
    }
  ];

  const requestTypes = requestCategories.flatMap((category) =>
    category.items.map((item) => ({ ...item, category: category.title }))
  );
  
  const handleSubmit = () => {
    if (!selectedType || !requestDetails.trim()) {
      console.error(t('profile.pleaseSelectRequestType'));
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

  const selectedRequest = requestTypes.find((item) => item.id === selectedType);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-200 bg-gray-50">
          <div></div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-maineBlue font-retro">{t('profile.submitARequest')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('profile.requests.selectTypeHelp', { defaultValue: 'Choose a request type from the list and provide details' })}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              {t('profile.selectRequestType')} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white focus:border-maineBlue focus:outline-none text-gray-700"
            >
              <option value="">{t('profile.pleaseSelectRequestType')}</option>
              {requestCategories.map((category) => (
                <optgroup key={category.title} label={category.title}>
                  {category.items.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedRequest && (
            <div className="bg-seafoam border-2 border-maineBlue rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedRequest.icon}</div>
                <div>
                  <h3 className="font-bold text-maineBlue text-lg">{selectedRequest.name}</h3>
                  <p className="text-sm text-gray-700">{selectedRequest.description}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              {t('profile.requestDetails')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              placeholder={t('profile.provideRequestDetails')}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-maineBlue focus:outline-none min-h-[150px] text-gray-700 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Please provide as much detail as possible to help us process your request efficiently.
            </p>
          </div>
        </div>

        <div className="p-6 pt-4 border-t-2 border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedType || !requestDetails.trim()}
            className="bg-maineBlue text-white px-8 py-3 rounded-lg font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('profile.submitRequest')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ClassRegistrationModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  if (!open) return null;
  
  const availableClasses: any[] = [];
  
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
  const { t, i18n } = useTranslation();
  const { user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedTalents, setSelectedTalents] = useState<string[]>([]);
  const [talentPoints, setTalentPoints] = useState(0);
  const [activeTab, setActiveTab] = useState('');
  const [showTalents, setShowTalents] = useState(true);
  const [selectedTalentTree, setSelectedTalentTree] = useState<string | null>(null);
  const [unlockedTalents, setUnlockedTalents] = useState<string[]>([]);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<{name: string, videoUrl: string} | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [workshopSetup, setWorkshopSetup] = useState<string>('Basic Workshop');
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
  
  const getLocalizedLevelMeta = (level: number) => {
    const titleIndex = Math.max(0, Math.min(level - 1, LEVEL_TITLES_AND_ICONS.length - 1));
    const { title, icon } = LEVEL_TITLES_AND_ICONS[titleIndex];
    return {
      title: t(`levels.manufacturing.titles.${level}`, { defaultValue: title }),
      icon
    };
  };
  const defaultLevelMeta = getLocalizedLevelMeta(1);

  const [levelProgress, setLevelProgress] = useState({
    title: defaultLevelMeta.title,
    level: 1,
    icon: defaultLevelMeta.icon,
    current: 0,
    required: 100,
    progressPercent: 0,
  });

  // Filter options for reports
  const filterOptions = {
    userRoles: [
      { value: 'administrator', label: t('profile.filterOptions.userRoles.administrator.label', { defaultValue: 'School Administrator' }), description: t('profile.filterOptions.userRoles.administrator.description', { defaultValue: 'High-level institutional overview' }) },
      { value: 'department_head', label: t('profile.filterOptions.userRoles.departmentHead.label', { defaultValue: 'Department Head' }), description: t('profile.filterOptions.userRoles.departmentHead.description', { defaultValue: 'Department-specific insights' }) },
      { value: 'instructor', label: t('profile.filterOptions.userRoles.instructor.label', { defaultValue: 'Individual Instructor' }), description: t('profile.filterOptions.userRoles.instructor.description', { defaultValue: 'Class-specific data only' }) },
      { value: 'coordinator', label: t('profile.filterOptions.userRoles.coordinator.label', { defaultValue: 'Academic Coordinator' }), description: t('profile.filterOptions.userRoles.coordinator.description', { defaultValue: 'Cross-department analysis' }) }
    ],
    departments: [
      { value: 'all', label: t('profile.filterOptions.departments.all', { defaultValue: 'All Departments' }) },
      { value: 'precision_machining', label: t('profile.filterOptions.departments.precisionMachining', { defaultValue: 'Precision Machining' }) },
      { value: 'assembly_production', label: t('profile.filterOptions.departments.assemblyProduction', { defaultValue: 'Assembly & Production' }) },
      { value: 'quality_control', label: t('profile.filterOptions.departments.qualityControl', { defaultValue: 'Quality Control' }) },
      { value: 'industrial_automation', label: t('profile.filterOptions.departments.industrialAutomation', { defaultValue: 'Industrial Automation' }) },
      { value: 'welding_fabrication', label: t('profile.filterOptions.departments.weldingFabrication', { defaultValue: 'Welding & Fabrication' }) }
    ],
    classes: [
      { value: 'all', label: t('profile.filterOptions.classes.all', { defaultValue: 'All Classes' }) },
      { value: 'fundamentals', label: t('profile.filterOptions.classes.fundamentalsEngineering', { defaultValue: 'Fundamentals of Engineering' }) },
      { value: 'advanced_techniques', label: t('profile.filterOptions.classes.advancedEngineeringTechniques', { defaultValue: 'Advanced Engineering Techniques' }) },
      { value: 'safety_compliance', label: t('profile.filterOptions.classes.safetyCompliance', { defaultValue: 'Safety & Compliance' }) },
      { value: 'process_optimization', label: t('profile.filterOptions.classes.processOptimization', { defaultValue: 'Process Optimization' }) },
      { value: 'cnc_programming', label: t('profile.filterOptions.classes.cncProgramming', { defaultValue: 'CNC Programming' }) },
      { value: 'quality_assurance', label: t('profile.filterOptions.classes.qualityAssurance', { defaultValue: 'Quality Assurance' }) }
    ],
    timeRanges: [
      { value: '7days', label: t('profile.filterOptions.timeRanges.days7', { defaultValue: 'Last 7 Days' }) },
      { value: '30days', label: t('profile.filterOptions.timeRanges.days30', { defaultValue: 'Last 30 Days' }) },
      { value: 'semester', label: t('profile.filterOptions.timeRanges.semester', { defaultValue: 'Current Semester' }) },
      { value: 'academic_year', label: t('profile.filterOptions.timeRanges.academicYear', { defaultValue: 'Academic Year' }) },
      { value: 'custom', label: t('profile.filterOptions.timeRanges.custom', { defaultValue: 'Custom Range' }) }
    ],
    studentSegments: [
      { value: 'all', label: t('profile.filterOptions.studentSegments.all', { defaultValue: 'All Students' }) },
      { value: 'top_performers', label: t('profile.filterOptions.studentSegments.topPerformers', { defaultValue: 'Top 25% Performers' }) },
      { value: 'struggling', label: t('profile.filterOptions.studentSegments.struggling', { defaultValue: 'Students Needing Support' }) },
      { value: 'full_time', label: t('profile.filterOptions.studentSegments.fullTime', { defaultValue: 'Full-Time Students' }) },
      { value: 'part_time', label: t('profile.filterOptions.studentSegments.partTime', { defaultValue: 'Part-Time Students' }) },
      { value: 'certificate', label: t('profile.filterOptions.studentSegments.certificate', { defaultValue: 'Certificate Program' }) },
      { value: 'diploma', label: t('profile.filterOptions.studentSegments.diploma', { defaultValue: 'Diploma Program' }) }
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
        
        // Convert markdown to basic HTML structure
        const htmlContent = text
          // Convert headers
          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
          // Convert bold text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          // Convert italic text
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          // Convert links
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          // Convert paragraphs (split by double newlines and wrap in p tags)
          .split('\n\n')
          .map(paragraph => {
            const trimmed = paragraph.trim();
            if (!trimmed) return '';
            // Skip if it's already a header
            if (trimmed.startsWith('<h')) return trimmed;
            // Convert list items
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return '<ul>' + trimmed.split('\n').map(item => 
                item.trim().startsWith('- ') || item.trim().startsWith('* ') 
                  ? '<li>' + item.trim().substring(2) + '</li>'
                  : item
              ).join('') + '</ul>';
            }
            // Convert numbered lists
            if (/^\d+\./.test(trimmed)) {
              return '<ol>' + trimmed.split('\n').map(item => 
                /^\d+\./.test(item.trim())
                  ? '<li>' + item.trim().replace(/^\d+\.\s*/, '') + '</li>'
                  : item
              ).join('') + '</ol>';
            }
            // Regular paragraph
            return '<p>' + trimmed + '</p>';
          })
          .filter(Boolean)
          .join('\n');
        
        setTermsContent(htmlContent);
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
    'Precision Machinist': [
      { name: 'Tolerance Master', icon: FireIcon, unlockLevel: 10, description: 'Achieve ±0.001" precision on all measurements' },
      { name: 'Tool Calibration', icon: ShieldCheckIcon, unlockLevel: 14, description: 'Expert at calibrating micrometers and calipers' },
      { name: 'Blueprint Reader', icon: StarIcon, unlockLevel: 25, description: 'Interpret complex technical drawings instantly' },
      { name: 'CNC Operator', icon: TrophyIcon, unlockLevel: 30, description: 'Program and operate CNC machines efficiently' },
      { name: 'Surface Finish Pro', icon: ShieldCheckIcon, unlockLevel: 36, description: 'Achieve mirror-finish surface quality' },
      { name: 'Setup Specialist', icon: FireIcon, unlockLevel: 42, description: 'Reduce machine setup time by 50%' },
      { name: 'Fixture Designer', icon: StarIcon, unlockLevel: 48, description: 'Create custom jigs and fixtures' },
      { name: 'Process Optimizer', icon: ShieldCheckIcon, unlockLevel: 55, description: 'Maximize throughput and minimize waste' },
      { name: 'Master Machinist', icon: TrophyIcon, unlockLevel: 60, description: 'Peak precision expertise' },
    ],
    'Assembly Specialist': [
      { name: 'Torque Control', icon: FireIcon, unlockLevel: 10, description: 'Perfect fastener torque every time' },
      { name: 'Component Handler', icon: SparklesIcon, unlockLevel: 14, description: 'ESD-safe handling of sensitive parts' },
      { name: 'Line Efficiency', icon: StarIcon, unlockLevel: 25, description: 'Increase assembly line throughput 25%' },
      { name: 'Ergonomic Expert', icon: StarIcon, unlockLevel: 30, description: 'Optimize workstation for speed and safety' },
      { name: 'Lean Practitioner', icon: ShieldCheckIcon, unlockLevel: 36, description: 'Eliminate waste in assembly process' },
      { name: 'Team Coordinator', icon: TrophyIcon, unlockLevel: 42, description: 'Lead assembly teams to peak performance' },
      { name: 'Quality Checker', icon: FireIcon, unlockLevel: 48, description: 'Catch defects before they reach QC' },
      { name: 'Process Documenter', icon: ShieldCheckIcon, unlockLevel: 55, description: 'Create clear standard work instructions' },
      { name: 'Assembly Master', icon: TrophyIcon, unlockLevel: 60, description: 'Ultimate assembly line expertise' },
    ],
    'Quality Inspector': [
      { name: 'Visual Inspection', icon: CakeIcon, unlockLevel: 10, description: 'Spot defects invisible to others' },
      { name: 'Gauge Proficiency', icon: ShieldCheckIcon, unlockLevel: 14, description: 'Master all measurement instruments' },
      { name: 'Statistical Sampler', icon: StarIcon, unlockLevel: 25, description: 'Apply SPC and sampling techniques' },
      { name: 'Root Cause Analyst', icon: StarIcon, unlockLevel: 30, description: 'Identify and eliminate defect sources' },
      { name: 'Audit Specialist', icon: CakeIcon, unlockLevel: 36, description: 'Conduct thorough quality audits' },
      { name: 'Documentation Pro', icon: SparklesIcon, unlockLevel: 42, description: 'Maintain perfect quality records' },
      { name: 'Corrective Action', icon: CakeIcon, unlockLevel: 48, description: 'Implement effective CAPA systems' },
      { name: 'ISO Certified', icon: AcademicCapIcon, unlockLevel: 55, description: 'Expert in quality management systems' },
      { name: 'Quality Guardian', icon: TrophyIcon, unlockLevel: 60, description: 'Ultimate quality assurance mastery' },
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
        { title: '📊 Skill Mastery Tracking', description: 'Monitor student progress in skills and certifications', metrics: ['Tool handling progression', 'Techniques proficiency', 'Safety certification', 'SOP completion rates'], color: 'blue' },
        { title: '📈 Learning Analytics', description: 'Analyze engagement, quiz scores, and knowledge retention', metrics: ['Module time tracking', 'Quiz/test scores', 'Video engagement metrics', 'Knowledge retention rates'], color: 'indigo' }
      ]
    },
    {
      title: 'Class Analytics',
      reports: [
        { title: '👥 Class Performance', description: 'View class scores, completion rates, and knowledge gaps', metrics: ['Average scores by module', 'Completion rates by demographic', 'Common knowledge gaps', 'Assignment submission timeliness'], color: 'green' },
        { title: '🎤 Live Session Metrics', description: 'Track attendance and engagement in live workshop sessions', metrics: ['Attendance rates', 'Participation levels', 'Q&A engagement', 'Session feedback scores'], color: 'teal' }
      ]
    },
    {
      title: 'Metrics',
      reports: [
        { title: '⚙️ Process Performance', description: 'Analyze SOP success rates and outcomes', metrics: ['SOP success rates', 'Common modifications', 'Material substitutions', 'Difficulty ratings'], color: 'orange' },
        { title: '🔧 Technique Analysis', description: 'Track progress on specific techniques and skills', metrics: ['Most challenging techniques', 'Common mistakes by technique', 'Time-to-proficiency metrics', 'Video replay frequency'], color: 'amber' }
      ]
    },
    {
      title: 'Operations',
      reports: [
        { title: '🏭 Workshop Management', description: 'Monitor equipment usage and operational efficiency', metrics: ['Equipment usage statistics', 'Material waste tracking', 'Inventory management', 'Equipment maintenance'], color: 'purple' },
        { title: '🛡️ Safety & Compliance', description: 'Track safety violations and compliance metrics', metrics: ['Safety violations', 'Inspection check completion', 'Incident reports', 'Compliance tracking'], color: 'red' }
      ]
    },
    {
      title: 'Engagement',
      reports: [
        { title: '📱 Platform Usage', description: 'Analyze student interaction with the learning platform', metrics: ['Peak usage times', 'Feature adoption rates', 'Mobile vs desktop usage', 'Session duration patterns'], color: 'pink' },
        { title: '👥 Community Engagement', description: 'Track social learning and community participation', metrics: ['Forum participation', 'Project sharing metrics', 'Peer feedback statistics', 'Social learning interactions'], color: 'purple' }
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
      '⚙️ Process Performance': 'process-performance',
      '🔧 Technique Analysis': 'technique-analysis',
      '🏭 Workshop Management': 'workshop-management',
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
    const departmentLabel = filterOptions.departments.find(d => d.value === selectedDepartment)?.label || t('profile.filterOptions.departments.all', { defaultValue: 'All Departments' });
    const classLabel = filterOptions.classes.find(c => c.value === selectedClass)?.label || t('profile.filterOptions.classes.all', { defaultValue: 'All Classes' });
    const timeRangeLabel = filterOptions.timeRanges.find(t => t.value === selectedTimeRange)?.label || 'Last 30 Days';
    const segmentLabel = filterOptions.studentSegments.find(s => s.value === selectedStudentSegment)?.label || t('profile.filterOptions.studentSegments.all', { defaultValue: 'All Students' });
    
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
    const platformWidth = doc.getTextWidth(cleanText('Education Analytics Platform'));
    doc.text(cleanText('Education Analytics Platform'), 105 - platformWidth/2, 48);
    
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
      const line1Width = doc.getTextWidth(cleanText('This report analyzes student skill development across core technical competencies.'));
      doc.text(cleanText('This report analyzes student skill development across core technical competencies.'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('Data reflects performance metrics for technical skills, safety practices, and workflow quality,'));
      doc.text(cleanText('Data reflects performance metrics for technical skills, safety practices, and workflow quality,'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('and task execution during the current academic period.'));
      doc.text(cleanText('and task execution during the current academic period.'), 105 - line3Width/2, 111);
    } else if (fileName === 'class-performance') {
      const line1Width = doc.getTextWidth(cleanText('This report provides comprehensive analysis of class-level performance metrics'));
      doc.text(cleanText('This report provides comprehensive analysis of class-level performance metrics'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('including completion rates, knowledge gaps, and instructor effectiveness across'));
      doc.text(cleanText('including completion rates, knowledge gaps, and instructor effectiveness across'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('all program courses for the current semester.'));
      doc.text(cleanText('all program courses for the current semester.'), 105 - line3Width/2, 111);
    } else if (fileName === 'live-session-metrics') {
      const line1Width = doc.getTextWidth(cleanText('This report examines student engagement and participation in live training'));
      doc.text(cleanText('This report examines student engagement and participation in live training'), 105 - line1Width/2, 97);
      const line2Width = doc.getTextWidth(cleanText('demonstrations and interactive sessions, measuring attendance, participation,'));
      doc.text(cleanText('demonstrations and interactive sessions, measuring attendance, participation,'), 105 - line2Width/2, 104);
      const line3Width = doc.getTextWidth(cleanText('and learning outcomes from real-time technical instruction.'));
      doc.text(cleanText('and learning outcomes from real-time technical instruction.'), 105 - line3Width/2, 111);
    } else {
      const line1Width = doc.getTextWidth(cleanText('This report provides detailed analytics and insights for technical education'));
      doc.text(cleanText('This report provides detailed analytics and insights for technical education'), 105 - line1Width/2, 97);
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
      const safetyRate = selectedDepartment === 'precision_machining' ? '92.1%' : '86.7%';
      const completionRate = selectedStudentSegment === 'struggling' ? '67.3%' : selectedStudentSegment === 'top_performers' ? '96.8%' : '85.1%';
      const supportNeeded = selectedClass === 'all' ? '3 of 15' : selectedStudentSegment === 'struggling' ? '8 of 12' : '1 of 8';
      
      doc.text(cleanText('Average Skill Proficiency:'), 35, 153);
      doc.text(cleanText(avgProficiency), 130, 153);
      doc.text(cleanText('Safety Certification Rate:'), 35, 163);
      doc.text(cleanText(safetyRate), 130, 163);
      doc.text(cleanText('Process Completion Success:'), 35, 173);
      doc.text(cleanText(completionRate), 130, 173);
      doc.text(cleanText('Students Requiring Additional Support:'), 35, 183);
      doc.text(cleanText(supportNeeded), 130, 183);
    } else if (fileName === 'class-performance') {
      doc.text(cleanText('Overall Class Average:'), 35, 153);
      doc.text(cleanText('85.4%'), 130, 153);
      doc.text(cleanText('Course Completion Rate:'), 35, 163);
      doc.text(cleanText('84.9%'), 130, 163);
      doc.text(cleanText('Highest Performing Course:'), 35, 173);
      doc.text(cleanText('Workplace Safety (94%)'), 130, 173);
      doc.text(cleanText('Course Requiring Attention:'), 35, 183);
      doc.text(cleanText('Production Planning & Costing (79%)'), 130, 183);
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
      const line1Width = doc.getTextWidth(cleanText('- Core technical skills show consistent improvement with 81% average proficiency'));
      doc.text(cleanText('- Core technical skills show consistent improvement with 81% average proficiency'), 105 - line1Width/2, 218);
      const line2Width = doc.getTextWidth(cleanText('- Workplace safety certification maintains high completion rate at 87%'));
      doc.text(cleanText('- Workplace safety certification maintains high completion rate at 87%'), 105 - line2Width/2, 228);
      const line3Width = doc.getTextWidth(cleanText('- Task execution demonstrates strong practical application skills'));
      doc.text(cleanText('- Task execution demonstrates strong practical application skills'), 105 - line3Width/2, 238);
      const line4Width = doc.getTextWidth(cleanText('- Recommend additional practice sessions for students below 75% threshold'));
      doc.text(cleanText('- Recommend additional practice sessions for students below 75% threshold'), 105 - line4Width/2, 248);
      const line5Width = doc.getTextWidth(cleanText('- Consider advanced modules for students achieving 90% proficiency'));
      doc.text(cleanText('- Consider advanced modules for students achieving 90% proficiency'), 105 - line5Width/2, 258);
    } else if (fileName === 'class-performance') {
      const line1Width = doc.getTextWidth(cleanText('- Workplace Safety demonstrates exemplary performance (94%)'));
      doc.text(cleanText('- Workplace Safety demonstrates exemplary performance (94%)'), 105 - line1Width/2, 218);
      const line2Width = doc.getTextWidth(cleanText('- Advanced Manufacturing Processes shows strong student engagement (91%)'));
      doc.text(cleanText('- Advanced Manufacturing Processes shows strong student engagement (91%)'), 105 - line2Width/2, 228);
      const line3Width = doc.getTextWidth(cleanText('- Production Planning & Costing requires curriculum review and support'));
      doc.text(cleanText('- Production Planning & Costing requires curriculum review and support'), 105 - line3Width/2, 238);
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
    const footerWidth1 = doc.getTextWidth(cleanText('PorkChop Ed Tech | Technical Education Analytics Platform'));
    doc.text(cleanText('PorkChop Ed Tech | Technical Education Analytics Platform'), 105 - footerWidth1/2, 270);
    
    return doc;
  };

  const generateReportContent = (reportTitle: string, format: 'csv' | 'pdf' | 'xlsx') => {
    const fileName = getReportFileName(reportTitle);
    const currentDate = new Date().toLocaleDateString();
    
    if (format === 'csv') {
      // Generate CSV content
      if (fileName === 'skill-mastery-tracking') {
        return `Student ID,Student Name,Blueprint Interpretation Score,Machining Techniques Score,Shop Safety Certification,Process Completion Rate,Overall Progress
`;
      } else if (fileName === 'class-performance') {
        return `Class ID,Class Name,Average Score,Completion Rate,Knowledge Gaps,Assignment Timeliness,Instructor
`;
      } else {
        return `Report Type,${reportTitle}
Generated Date,${currentDate}`;
      }
    } else {
      // Generate Excel-compatible CSV
      return `${reportTitle}
Generated: ${currentDate}`;
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
        console.error(t('profile.talents.maxSelectionAlert', { defaultValue: 'You can only select {{count}} talents at your current level.', count: maxTalents }));
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
        console.error(t('profile.talents.saveFailed', { defaultValue: 'Failed to save talent selection. Please try again.' }));
      }
    } catch (error) {
      console.error('Error saving talents:', error);
      // Revert local state if save failed
      setSelectedTalents(selectedTalents);
      console.error(t('profile.talents.saveFailed', { defaultValue: 'Failed to save talent selection. Please try again.' }));
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
        
        // Update user profile with new database fields to the component's state
        setUserProfile({
          ...profile,
          name: profile.name || 'User',
          xp,
          // Map backend manufacturing_experience to UI display value
          experience: EXPERIENCE_LEVEL_DISPLAY[profile.manufacturing_experience as keyof typeof EXPERIENCE_LEVEL_DISPLAY] || 'Beginner',
          workshopSetup: profile.workshop_setup || 'Basic Workshop',
          dietary: profile.dietary || [],
          cuisine: profile.cuisine || []
        });

        // Also update the local workshopSetup state
        setWorkshopSetup(profile.workshop_setup || 'Basic Workshop');

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
        const { title, icon } = getLocalizedLevelMeta(level);
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
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && userProfile.workshopSetup) {
      setWorkshopSetup(userProfile.workshopSetup);
    }
  }, [userProfile]);

  useEffect(() => {
    setLevelProgress((prev) => {
      const { title, icon } = getLocalizedLevelMeta(prev.level);
      return {
        ...prev,
        title,
        icon
      };
    });
  }, [i18n.language]);

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && userProfile) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      try {
        setAvatarUploading(true);
        
        // Create a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // Don't use nested paths
        
        
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
        
        
        // Get the public URL
        const { data } = supabase.storage
          .from('avatarphotos')
          .getPublicUrl(filePath);
          
        const avatarUrl = data?.publicUrl;
        
        
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
        
      } catch (error) {
        console.error('Error uploading avatar:', error);
        console.error('Failed to upload avatar. Please try again.');
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  // Corrected level calculation function - 6500 XP should be Level 10
  const getCorrectLevel = (totalXP: number) => {
    // WoW Classic XP: Level 1 starts at 0 XP, Level 2 at 400 XP, etc.
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
    
    // Get the XP requirement for the current level (not the next level)
    const currentLevelXP = WOW_CLASSIC_XP_TABLE[level - 1] || 0;
    const nextLevelXP = WOW_CLASSIC_XP_TABLE[level] || 0;
    
    const current = totalXP - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    
    // Show positive progress from start of current level
    const displayCurrent = Math.max(0, current);
    const displayRequired = required;
    
    return { level, current: displayCurrent, required: displayRequired };
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
          experience: EXPERIENCE_LEVEL_DISPLAY[profile.manufacturing_experience as keyof typeof EXPERIENCE_LEVEL_DISPLAY] || 'Beginner',
          workshopSetup: profile.workshop_setup || 'Basic Workshop',
          dietary: profile.dietary || [],
          cuisine: profile.cuisine || []
        });

        // Update talent points
        setTalentPoints(Math.floor(xp / 100));
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
    <div className="w-[90%] lg:w-[60%] mx-auto mt-4 bg-weatheredWhite rounded-xl shadow-lg border-4 border-maineBlue flex flex-col student-dashboard-height-lock">
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
              <span className="font-bold text-xs sm:text-sm">{levelProgress.title} ({levelProgress.level})</span>
            </div>
            <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (levelProgress.current / levelProgress.required) * 100))}%` }}
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
            {/* Precision Machinist Box */}
            <button
              onClick={() => setSelectedTalentTree('Equipment')}
              className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-xs sm:text-sm relative group flex flex-col items-center justify-center text-center p-3"
            >
              <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <div>Precision</div>
              <div>Machinist</div>
              {/* Mobile-friendly tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-40 sm:w-48 border border-gray-300">
                <strong>{t('profile.talents.precisionMachinist', { defaultValue: 'Precision Machinist' })}</strong>
                <div className="mt-1">Master precision with tight tolerances and advanced machining techniques.</div>
              </div>
            </button>

            {/* Assembly Specialist Box */}
            <button
              onClick={() => setSelectedTalentTree('Techniques')}
              className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-xs sm:text-sm relative group flex flex-col items-center justify-center text-center p-3"
            >
              <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <div>Assembly</div>
              <div>Specialist</div>
              {/* Mobile-friendly tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-40 sm:w-48 border border-gray-300">
                <strong>{t('profile.talents.assemblySpecialist', { defaultValue: 'Assembly Specialist' })}</strong>
                <div className="mt-1">Excel at assembly line operations with lean manufacturing and quality control expertise.</div>
              </div>
            </button>

            {/* Quality Inspector Box */}
            <button
              onClick={() => setSelectedTalentTree('Ingredients')}
              className="w-full sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-seafoam text-maineBlue rounded-lg border border-gray-600 hover:bg-maineBlue hover:text-seafoam transition-colors font-bold text-xs sm:text-sm relative group flex flex-col items-center justify-center text-center p-3"
            >
              <CakeIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
              <div>Quality</div>
              <div>Inspector</div>
              {/* Mobile-friendly tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 hidden group-hover:block bg-white text-black p-2 rounded shadow-lg text-xs w-40 sm:w-48 border border-gray-300">
                <strong>{t('profile.talents.qualityInspector', { defaultValue: 'Quality Inspector' })}</strong>
                <div className="mt-1">Become a quality assurance expert with inspection, auditing, and process improvement skills.</div>
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
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-4xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
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
                Master the techniques shown in this tutorial to unlock your full manufacturing potential!
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
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4 sm:p-6 w-full max-w-4xl max-h-[85vh] lg:max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div className="flex-1"></div>
              <div className="flex items-center gap-2 sm:gap-3">
                {selectedTalentTree === 'Equipment' && <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maineBlue" />}
                {selectedTalentTree === 'Techniques' && <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maineBlue" />}
                {selectedTalentTree === 'Ingredients' && <CakeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-maineBlue" />}
                <h2 className="text-lg sm:text-2xl font-bold text-maineBlue text-center">
                  {selectedTalentTree === 'Equipment'
                    ? t('profile.talents.precisionMachinist', { defaultValue: 'Precision Machinist' })
                    : selectedTalentTree === 'Techniques'
                      ? t('profile.talents.assemblySpecialist', { defaultValue: 'Assembly Specialist' })
                      : t('profile.talents.qualityInspector', { defaultValue: 'Quality Inspector' })}
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
              {talentTrees[selectedTalentTree === 'Equipment'
                ? 'Precision Machinist'
                : selectedTalentTree === 'Techniques'
                  ? 'Assembly Specialist'
                  : 'Quality Inspector']?.map((talent: any) => {
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
                          : selectedTalentTree === 'Equipment'
                            ? 'text-orange-500'
                            : selectedTalentTree === 'Techniques'
                              ? 'text-red-500'
                              : 'text-purple-500'
                    }`} />
                    <div className="font-bold text-xs sm:text-sm mb-1">{talent.name}</div>
                    <div className="text-xs text-gray-600 mb-1 px-1 leading-tight">{talent.description}</div>
                    {!unlocked && (
                      <div className="text-xs text-red-500">{t('profile.talents.unlocksAtLevel', { defaultValue: 'Unlocks at Level {{level}}', level: talent.unlockLevel })}</div>
                    )}
                    {selected && (
                      <div className="text-xs text-seafoam font-bold mb-1">{t('profile.talents.selectedBadge', { defaultValue: '✓ Selected' })}</div>
                    )}
                    {selected && (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add talent to unlocked list
                            if (!unlockedTalents.includes(talent.name)) {
                              setUnlockedTalents([...unlockedTalents, talent.name]);
                            }
                          }}
                          className={`text-xs px-2 py-1 rounded transition-colors font-medium ${
                            unlockedTalents.includes(talent.name)
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          }`}
                        >
                          {unlockedTalents.includes(talent.name) ? t('profile.talents.unlockedBadge', { defaultValue: '✅ Unlocked' }) : t('profile.talents.unlockAction', { defaultValue: '🔓 Unlock' })}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open tutorial modal if unlocked
                            if (unlockedTalents.includes(talent.name)) {
                              setCurrentTutorial({
                                name: talent.name,
                                videoUrl: `https://www.youtube.com/embed/dQw4w9WgXcQ` // Placeholder video
                              });
                              setTutorialModalOpen(true);
                            }
                          }}
                          disabled={!unlockedTalents.includes(talent.name)}
                          className={`text-xs px-2 py-1 rounded transition-colors font-medium ${
                            unlockedTalents.includes(talent.name)
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                        >
                          📹 Tutorial
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
      
      {/* Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <h2 className="text-2xl font-bold text-maineBlue text-center">Technical Education Reports</h2>
              <button
                onClick={() => setShowReportsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevReport}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                <span className="text-lg mr-1">←</span>
                Prev
              </button>
              
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800">{reportCategories[currentReportIndex].title}</h3>
                <p className="text-sm text-gray-500">
                  {currentReportIndex + 1} of {reportCategories.length}
                </p>
              </div>
              
              <button
                onClick={nextReport}
                className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Next
                <span className="text-lg ml-1">→</span>
              </button>
            </div>
            
            {/* Two Reports Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {reportCategories[currentReportIndex].reports.map((report, index) => (
                  <ReportCard
                    key={index}
                    title={report.title}
                    description={report.description}
                    metrics={report.metrics}
                    color={report.color}
                  />
                ))}
              </div>
            </div>
            
            {/* Progress Dots */}
            <div className="flex justify-center mt-3 space-x-2">
              {reportCategories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReportIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentReportIndex ? 'bg-maineBlue' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showGenerateModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg border-4 border-black max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-4 pb-3">
              <div></div>
              <h2 className="text-2xl font-bold text-maineBlue">Generate Report</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Report Info */}
            <div className="px-4 pb-3 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedReport.title}</h3>
              <p className="text-gray-600">{selectedReport.description}</p>
            </div>
            
            {/* Main Content - Side by Side Layout */}
            <div className="px-4 pb-4">
              <div className="flex gap-4 items-start">
                {/* Left Side - Filters */}
                <div className="w-56 bg-white border-4 border-blue-400 rounded-lg p-3 h-full">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm text-center">🎯 Report Filters</h4>
                  <div className="space-y-3 flex-1">
                    {/* User Role Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        👤 User Role
                      </label>
                      <select 
                        value={selectedUserRole}
                        onChange={(e) => setSelectedUserRole(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue"
                      >
                        {filterOptions.userRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📚 Class/Course
                      </label>
                      <select 
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue"
                      >
                        {filterOptions.classes.map(cls => (
                          <option key={cls.value} value={cls.value}>
                            {cls.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Time Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📅 Time Range
                      </label>
                      <select 
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue"
                      >
                        {filterOptions.timeRanges.map(range => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Student Segment Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        👥 Student Segment
                      </label>
                      <select 
                        value={selectedStudentSegment}
                        onChange={(e) => setSelectedStudentSegment(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maineBlue"
                      >
                        {filterOptions.studentSegments.map(segment => (
                          <option key={segment.value} value={segment.value}>
                            {segment.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⚡ Quick Presets
                      </label>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            setSelectedUserRole('administrator');
                            setSelectedClass('all');
                            setSelectedTimeRange('semester');
                            setSelectedStudentSegment('all');
                          }}
                          className="w-full text-left px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 rounded transition-colors border border-blue-300"
                        >
                          📊 Executive Overview
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUserRole('instructor');
                            setSelectedClass('fundamentals');
                            setSelectedTimeRange('30days');
                            setSelectedStudentSegment('struggling');
                          }}
                          className="w-full text-left px-3 py-2 text-xs bg-orange-100 hover:bg-orange-200 rounded transition-colors border border-orange-300"
                        >
                          🎯 At-Risk Students
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Download Options */}
                <div className="flex-1">
                  <div className="space-y-3">
                    {/* CSV Download */}
                    <div className="bg-green-50 border-4 border-green-400 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-2">📊</div>
                      <h4 className="font-bold text-green-800 mb-1 text-sm">CSV Format</h4>
                      <p className="text-xs text-gray-600 mb-3">Raw data for analysis</p>
                      <button 
                        onClick={() => handleDownload('csv')}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-xs w-full border border-black"
                      >
                        Download CSV
                      </button>
                    </div>
                    
                    {/* PDF Download */}
                    <div className="bg-red-50 border-4 border-red-400 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-2">📄</div>
                      <h4 className="font-bold text-red-800 mb-1 text-sm">PDF Report</h4>
                      <p className="text-xs text-gray-600 mb-3">Formatted report</p>
                      <button 
                        onClick={() => handleDownload('pdf')}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-xs w-full border border-black"
                      >
                        Download PDF
                      </button>
                    </div>
                    
                    {/* Excel Download */}
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-2">📈</div>
                      <h4 className="font-bold text-blue-800 mb-1 text-sm">Excel Format</h4>
                      <p className="text-xs text-gray-600 mb-3">Spreadsheet data</p>
                      <button 
                        onClick={() => handleDownload('xlsx')}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-xs w-full border border-black"
                      >
                        Download Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Close Button */}
              <div className="flex justify-end mt-4">
                <button 
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors text-sm border border-black"
                >
                  {t('profile.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Footer with Terms of Service link */}
        <footer className="mt-8 text-center text-sm text-gray-500 py-4 border-t border-gray-200">
          <p>&copy; {new Date().getFullYear()} Porkchop. All rights reserved.</p>
          <button 
            onClick={() => setTermsModalOpen(true)}
            className="text-maineBlue hover:underline mt-1"
          >
            Terms of Service & Privacy Policy
          </button>
        </footer>
      </div>
      {/* END SCROLLABLE CONTENT AREA */}
      
      {/* Terms Modal */}
      <TermsModal 
        open={termsModalOpen} 
        onClose={() => setTermsModalOpen(false)} 
        content={termsContent} 
      />
    </div>
  );
};

export default Profile;
