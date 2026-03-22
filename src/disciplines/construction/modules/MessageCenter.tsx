import React from 'react';
import { useTranslation } from 'react-i18next';

const MessageCenter = () => {
  const { t } = useTranslation();
  return (
  <div className="message-center bg-weatheredWhite p-4 rounded shadow mb-6">
    <h3 className="font-bold text-lg mb-2 text-maineBlue">{t('social.messaging')}</h3>
    <div className="text-gray-500">{t('social.comingSoon')}</div>
  </div>
  );
};

export default MessageCenter;

