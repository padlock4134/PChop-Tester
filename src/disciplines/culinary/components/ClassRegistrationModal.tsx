import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ClassRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onRegistrationComplete?: (selectedClasses: string[]) => void;
}

const ClassRegistrationModal: React.FC<ClassRegistrationModalProps> = ({ open, onClose, onRegistrationComplete }) => {
  const { t } = useTranslation();
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setSuccessMessage('Registration requests submitted! Check your student portal for confirmation.');
      setIsSubmitting(false);
      
      // Pass selected classes back to parent
      if (onRegistrationComplete) {
        onRegistrationComplete(selectedClasses);
      }
      
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
        setSelectedClasses([]);
      }, 2000);
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold mb-4 text-center text-maineBlue">{t('registration.classRegistration')} - {t('registration.spring2025')}</h2>
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded border border-black">
            {successMessage}
          </div>
        )}
        
        <div className="space-y-3 mb-6">
          {/* CUL 101 - Knife Skills & Safety */}
          <div className="p-4 bg-sand rounded border border-black">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="cul101"
                  checked={selectedClasses.includes('cul101')}
                  onChange={() => toggleClass('cul101')}
                  className="mt-1 h-4 w-4 text-maineBlue"
                />
                <div>
                  <label htmlFor="cul101" className="font-semibold text-maineBlue cursor-pointer">
                    CUL 101 - Knife Skills & Safety
                  </label>
                  <div className="text-sm text-gray-600">Monday 9:00 AM - 11:00 AM • Lab Kitchen A</div>
                  <div className="text-xs text-gray-500">Instructor: Chef Martinez</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">15/20 {t('registration.seatsAvailable')}</div>
                <div className="text-xs text-gray-500">5 {t('registration.available')}</div>
              </div>
            </div>
            <div className="text-xs text-green-600 ml-7">✓ Prerequisites met</div>
          </div>

          {/* CUL 205 - Seafood Preparation (Full) */}
          <div className="p-4 bg-sand rounded border border-black">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="cul205"
                  checked={selectedClasses.includes('cul205')}
                  onChange={() => toggleClass('cul205')}
                  className="mt-1 h-4 w-4 text-maineBlue"
                />
                <div>
                  <label htmlFor="cul205" className="font-semibold text-maineBlue cursor-pointer">
                    CUL 205 - Seafood Preparation
                  </label>
                  <div className="text-sm text-gray-600">Wednesday 1:00 PM - 4:00 PM • Lab Kitchen B</div>
                  <div className="text-xs text-gray-500">Instructor: Chef Thompson</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-orange-600">18/18 seats</div>
                <div className="text-xs text-orange-500">{t('registration.waitlistAvailable')}</div>
              </div>
            </div>
            <div className="text-xs text-green-600 ml-7">✓ Prerequisites met • Will join waitlist</div>
          </div>

          {/* CUL 150 - Pastry Fundamentals */}
          <div className="p-4 bg-sand rounded border border-black">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="cul150"
                  checked={selectedClasses.includes('cul150')}
                  onChange={() => toggleClass('cul150')}
                  className="mt-1 h-4 w-4 text-maineBlue"
                />
                <div>
                  <label htmlFor="cul150" className="font-semibold text-maineBlue cursor-pointer">
                    CUL 150 - Pastry Fundamentals
                  </label>
                  <div className="text-sm text-gray-600">Friday 10:00 AM - 12:00 PM • Baking Lab</div>
                  <div className="text-xs text-gray-500">Instructor: Chef Rodriguez</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">8/16 seats</div>
                <div className="text-xs text-gray-500">8 available</div>
              </div>
            </div>
            <div className="text-xs text-green-600 ml-7">✓ Prerequisites met</div>
          </div>

          {/* CUL 301 - Advanced Sauce Making (Prerequisites not met) */}
          <div className="p-4 bg-gray-100 rounded border border-gray-400 opacity-75">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="cul301"
                  disabled
                  className="mt-1 h-4 w-4 text-gray-400 cursor-not-allowed"
                />
                <div>
                  <label className="font-semibold text-gray-600 cursor-not-allowed">
                    CUL 301 - Advanced Sauce Making
                  </label>
                  <div className="text-sm text-gray-500">Tuesday 2:00 PM - 5:00 PM • Lab Kitchen C</div>
                  <div className="text-xs text-gray-500">Instructor: Chef Williams</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">12/16 seats</div>
                <div className="text-xs text-gray-500">4 available</div>
              </div>
            </div>
            <div className="text-xs text-red-600 ml-7">✗ {t('registration.requires')} CUL 201 (Basic Sauces)</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 transition-colors border border-black"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedClasses.length === 0 || isSubmitting}
            className={`flex-1 py-3 rounded font-semibold transition-colors border border-black ${
              selectedClasses.length === 0 || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-maineBlue text-seafoam hover:bg-seafoam hover:text-maineBlue'
            }`}
          >
            {isSubmitting 
              ? 'Submitting...' 
              : `${t('registration.register')} for ${selectedClasses.length} Class${selectedClasses.length !== 1 ? 'es' : ''}`
            }
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          {t('registration.registrationRequestsAreProcessedWithin')} 24 hours. You'll receive email confirmation once approved.
        </p>
      </div>
    </div>
  );
};

export default ClassRegistrationModal;
