import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './disciplines/culinary/images/logo.png';

const disciplines = [
  { key: 'culinary', label: 'Culinary', icon: '🍳' },
  { key: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { key: 'automotive', label: 'Automotive', icon: '🔧' },
  { key: 'construction', label: 'Construction', icon: '🏗️' },
  { key: 'electrical', label: 'Electrical', icon: '⚡' },
  { key: 'hvac', label: 'HVAC', icon: '❄️' },
  { key: 'logistics', label: 'Logistics', icon: '📦' },
  { key: 'machining', label: 'Machining', icon: '⚙️' },
  { key: 'plumbing', label: 'Plumbing', icon: '🔩' },
];

const DisciplineSelector: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (discipline: string) => {
    navigate(`/${discipline}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 py-12">
      <img src={logo} alt="PorkChop Logo" className="w-28 h-28 mb-6" />
      <h1 className="font-retro text-3xl text-maineBlue mb-2 text-center">Welcome to PorkChop</h1>
      <p className="text-navy text-lg mb-10 text-center">Select your discipline to get started.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-3xl">
        {disciplines.map((d) => (
          <button
            key={d.key}
            onClick={() => handleSelect(d.key)}
            className="group w-full rounded-2xl border-2 border-maineBlue bg-weatheredWhite p-6 text-center shadow-md hover:shadow-xl hover:border-seafoam transition-all duration-200"
          >
            <span className="block text-4xl mb-3">{d.icon}</span>
            <span className="block font-retro text-lg text-maineBlue group-hover:text-seafoam transition-colors">
              {d.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DisciplineSelector;
