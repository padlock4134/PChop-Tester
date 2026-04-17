import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteContext } from './RouteContext';

interface RunbookImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (route: any) => void;
  existingItems?: string[];
}

const RunbookImportModal: React.FC<RunbookImportModalProps> = ({ 
  open, 
  onClose, 
  onImport,
  existingItems = []
}) => {
  const { t } = useTranslation();
  const { routes } = useRouteContext();
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset selection when modal opens/closes
  useEffect(() => {
    setSelectedRoute(null);
    setIsLoading(false);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleSelectRoute = (route: any) => {
    setSelectedRoute(route);
  };

  const handleImport = async () => {
    if (!selectedRoute) return;
    
    setIsLoading(true);
    try {
      // Call the import function with the selected route
      onImport(selectedRoute);
      
    } catch (error) {
      console.error('Error during import:', error);
      alert('Failed to import route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg shadow-xl border-4 border-black w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('cookbook.selectRecipe')}</h2>
          <p className="text-gray-600 mb-4">
            {t('cookbook.chooseRecipe')}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {routes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('cookbook.noRecipes')}
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route: any) => (
                <div 
                  key={route.id} 
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                    selectedRoute?.id === route.id 
                      ? 'border-maineBlue bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleSelectRoute(route)}
                >
                  <div className="flex items-center p-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{route.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {Array.isArray(route.items) ? route.items.length : 0} {t('cookbook.ingredients')}
                        {route.instructions && ' • ' + t('cookbook.instructionsIncluded')}
                      </p>
                    </div>
                    {selectedRoute?.id === route.id && (
                      <div className="text-maineBlue">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-black rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className={`px-4 py-2 text-sm font-medium text-white bg-maineBlue border border-black rounded-md shadow-sm hover:bg-seafoam hover:text-maineBlue transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || !selectedRoute}
          >
            {isLoading ? t('cookbook.importing') : t('cookbook.showcaseRecipe')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunbookImportModal;

