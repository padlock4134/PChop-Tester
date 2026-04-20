import React from 'react';
import { useTranslation } from 'react-i18next';

const EventsSection = () => {
  const { t } = useTranslation();
  return (
  <div className="events-section bg-weatheredWhite p-4 rounded shadow mb-6">
    <h3 className="font-bold text-lg mb-2 text-maineBlue">{t('social.upcomingEvents')}</h3>
    <ul className="space-y-2">
      <li className="text-gray-500 italic">{t('social.noEvents')}</li>
    </ul>
  </div>
  );
};

export default EventsSection;

