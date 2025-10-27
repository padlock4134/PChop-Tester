import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, BookOpenIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import StudentProgressDashboard from './StudentProgressDashboard';

interface ModuleButtonProps {
  to: string;
  emoji: string;
  title: string;
  description: string;
  borderColor: string;
}

const ModuleButton: React.FC<ModuleButtonProps> = ({ to, emoji, title, description, borderColor }) => (
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
    
    {/* Module Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
      <ModuleButton
        to="/my-kitchen"
        emoji="🍳"
        title="My Kitchen"
        description="Scan ingredients, find recipes, manage your pantry"
        borderColor="border-maineBlue"
      />
      <ModuleButton
        to="/culinary-school"
        emoji="🎓"
        title="Culinary School"
        description="Learn techniques, watch tutorials, master skills"
        borderColor="border-kelp"
      />
      <ModuleButton
        to="/my-cookbook"
        emoji="📖"
        title="My Cookbook"
        description="Save recipes, track assignments, build collections"
        borderColor="border-lobsterRed"
      />
      <ModuleButton
        to="/chefs-corner"
        emoji="👨‍🍳"
        title="Chef's Corner"
        description="Live sessions, community recipes, market finds"
        borderColor="border-seafoam"
      />
    </div>
  </div>
);

export default Dashboard;
