import React from 'react';
import { useTranslation } from 'react-i18next';
import StudentProgressDashboard from './StudentProgressDashboard';

const ManufacturingStudentProgressDashboard: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="mb-8 mx-auto">
      {/* Mobile Tab Bar - Only visible on mobile */}
      <div className="lg:hidden mb-4 flex gap-1 border-b-2 border-maineBlue max-w-6xl mx-auto">
        <button
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg bg-maineBlue text-white border-b-4 border-lobsterRed`}
        >
          🏠 {t('dashboard.home')}
        </button>
        <button
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg bg-gray-100 text-gray-600 hover:bg-gray-200`}
        >
          🔴 {t('dashboard.live')}
        </button>
        <button
          className={`flex-1 py-3 px-2 font-bold text-xs sm:text-sm transition-colors rounded-t-lg bg-gray-100 text-gray-600 hover:bg-gray-200`}
        >
          📊 {t('dashboard.quickActions')}
        </button>
      </div>
      
      {/* Main Dashboard */}
      <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6 w-full max-w-6xl mx-auto">
        {/* Home Tab Content */}
        <div className="block lg:block">
          {/* Dashboard header - Manufacturing Specific */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-retro text-maineBlue mb-2">Fabricators Dashboard</h1>
            <p className="text-gray-600 italic">{t('dashboard.clickModule')}</p>
          </div>
          
          {/* Separation line */}
          <hr className="border-t-2 border-maineBlue mb-6" />
          
          {/* Use the original StudentProgressDashboard for the rest */}
          <StudentProgressDashboard />
        </div>
      </div>
    </div>
  );
};

export default ManufacturingStudentProgressDashboard;
