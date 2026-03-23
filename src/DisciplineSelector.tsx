import React, { useState } from 'react';
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
  const [selectedDiscipline, setSelectedDiscipline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDiscipline) {
      navigate(`/${selectedDiscipline}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Discipline Selection Form - Everything in the box */}
        <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="PorkChop Logo" className="w-32 h-32 mx-auto mb-6" />
            <h1 className="font-retro text-4xl text-maineBlue mb-3">Welcome to PorkChop</h1>
            <p className="text-gray-600 text-lg">What skills are you mastering?</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="discipline" className="block text-sm font-bold text-gray-700 mb-3 text-center">
                
              </label>
              <select
                id="discipline"
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-center focus:border-maineBlue focus:outline-none text-lg font-retro"
                required
              >
                <option value="">-- Select Discipline --</option>
                {disciplines.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.icon} {d.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedDiscipline}
              className="w-full bg-maineBlue text-white font-bold py-3 px-6 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Continue
            </button>
          </form>

          {/* Footer text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Patent Pending
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisciplineSelector;
