import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectContext } from './PartContext';

interface SpecBookImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (project: any) => void;
  existingIngredients?: string[];
}

const SpecBookImportModal: React.FC<SpecBookImportModalProps> = ({ 
  open, 
  onClose, 
  onImport,
  existingIngredients = []
}) => {
  const { t } = useTranslation();
  const wt = (key: string, defaultValue: string) =>
    t(`machinistCorner.${key}`, { defaultValue });
  const { projects } = useProjectContext();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset selection when modal opens/closes
  useEffect(() => {
    setSelectedProject(null);
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

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
  };

  const handleImport = async () => {
    if (!selectedProject) return;
    
    setIsLoading(true);
    try {
      // Call the import function with the selected project
      onImport(selectedProject);
      
    } catch (error) {
      console.error('Error during import:', error);
      console.error(wt('failedToImport', 'Failed to import spec. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg shadow-xl border-4 border-black w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto flex flex-col"
      >
        <div className="p-4 lg:p-6 pb-0">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">
            {wt('selectSpecToShowcase', 'Select Spec to Showcase')}
          </h2>
          <p className="text-sm lg:text-base text-gray-600 mb-4">
            {wt('chooseSpec', 'Choose a spec from your Spec Book to showcase in Welders Hub.')}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pt-2">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {wt('noSpecs', 'No specs found in your Spec Book.')}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((spec: any) => (
                <div 
                  key={spec.id} 
                  className={`border-2 border rounded-lg overflow-hidden cursor-pointer transition-colors min-h-[44px] ${
                    selectedProject?.id === spec.id 
                      ? 'border-maineBlue bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleSelectProject(spec)}
                >
                  <div className="flex items-center p-3 lg:p-4">
                    <div className="flex-1">
                      <h3 className="text-sm lg:text-base font-medium text-gray-900">{spec.title}</h3>
                      <p className="text-xs lg:text-sm text-gray-500 mt-1">
                        {Array.isArray(spec.ingredients) ? spec.ingredients.length : 0} {wt('materials', 'materials')}
                        {spec.instructions && ' • ' + wt('stepsIncluded', 'steps included')}
                      </p>
                    </div>
                    {selectedProject?.id === spec.id && (
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
        
        <div className="p-4 lg:p-6 bg-gray-50 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-black rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {wt('cancel', 'Cancel')}
          </button>
          <button
            onClick={handleImport}
            className={`min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-maineBlue border border-black rounded-md shadow-sm hover:bg-seafoam hover:text-maineBlue transition-colors ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading || !selectedProject}
          >
            {isLoading ? wt('importingSpec', 'Importing Spec...') : wt('showcaseSpecButton', 'Showcase Spec')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecBookImportModal;

// Backward-compatible alias
export { SpecBookImportModal as CookBookImportModal };
