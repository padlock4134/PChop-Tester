import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, BookOpenIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import StudentProgressDashboard from './StudentProgressDashboard';

const ModuleButton = ({ to, emoji, title, description, borderColor }) => (
  <Link
    to={to}
    className={`flex flex-col items-center p-6 rounded-lg border-4 ${borderColor} bg-white text-black hover:scale-105 transition-transform duration-200 text-center`}
  >
    <div className="mb-4 text-5xl">
      {emoji}
    </div>
    <h2 className="text-xl font-bold mb-2 font-retro">{title}</h2>
    <p className="text-sm">{description}</p>
  </Link>
);

const Dashboard = () => (
  <div className="max-w-4xl mx-auto mt-6">
    <StudentProgressDashboard />
  </div>
);

export default Dashboard;
