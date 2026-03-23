import React from 'react';
import StudentProgressDashboard from './StudentProgressDashboard';

const FloorDashboard = () => (
  <div className="max-w-4xl mx-auto mt-6">
    {/* Manufacturing-specific header override */}
    <div className="text-center mb-6">
      <h1 className="text-4xl font-retro text-maineBlue mb-2">Fabricators Dashboard</h1>
      <p className="text-gray-600 italic">Click a module to begin your journey!</p>
    </div>
    <StudentProgressDashboard showHeader={false} />
  </div>
);

export default FloorDashboard;
