import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectContext } from './PartContext';
import { useNavigate } from 'react-router-dom';

export type ProjectCard = {
  id: string;
  title: string;
  image: string;
  ingredients: string[];
  instructions: string;
  equipment?: string[];
  tutorials?: Array<{
    title: string;
    desc: string;
    videoUrl?: string;
  }>;
  products?: Array<{
    name: string;
    desc: string;
    price: string;
    image: string;
  }>;
  healthTags?: string[];
};


type Props = {
  open: boolean;
  onClose: () => void;
  benchMaterials: string[];
  onLike: (project: ProjectCard) => void;
  saveProjectToSpecBook: (project: ProjectCard) => void;
  projects: ProjectCard[];
  loading: boolean;
  error: string;
};

const ProjectMatcherModal: React.FC<Props> = ({ open, onClose, benchMaterials, onLike, saveProjectToSpecBook, projects, loading, error }) => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const navigate = useNavigate();

  const loadingMessages = [
    'Ironworker Jake Taking A Look...',
    'Matching Welding Projects...',
    'Almost Ready...'
  ];

  // Timer effect for loading steps
  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      const timer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change message every 2 seconds

      return () => clearInterval(timer);
    }
  }, [loading, loadingMessages.length]);

  if (!open) return null;

  const handleLike = async () => {
    try {
      setIsSaving(true);
      // Save project to spec book
      await saveProjectToSpecBook(projects[currentIdx]);
      await onLike(projects[currentIdx]);
      setCurrentIdx(idx => idx + 1);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleSkip = () => setCurrentIdx(idx => idx + 1);
  function generateTutorials(project: ProjectCard) {
  return [
    {
      title: `Equipment needed for ${project.title}`,
      desc: 'Learn how to use the main equipment needed for this project.'
    },
    {
      title: 'Material Prep',
      desc: 'How to prep primary materials for this welding project.'
    },
    {
      title: `Procedure: ${project.title}`,
      desc: project.instructions
    }
  ];
}

  const SKILL_TAGS = [
    { key: 'Safety', label: 'Safety' },
    { key: 'AWS Compliance', label: 'AWS Compliance' },
    { key: 'Weld Quality', label: 'Weld Quality' },
    { key: 'Joint Prep', label: 'Joint Prep' },
    { key: 'Heat Control', label: 'Heat Control' },
    { key: 'Inspection', label: 'Inspection' }
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-weatheredWhite rounded-lg shadow-lg border-4 border-black p-4 lg:p-6 max-w-2xl w-full mx-4 max-h-[85vh] lg:max-h-[80vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-2xl text-lobsterRed hover:text-red-700 focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="font-retro text-xl lg:text-2xl mb-2 text-center flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="Ironworker Jake">👨‍🏭</span>
              <span>{loadingMessages[loadingStep]}</span>
            </div>
          ) : 
           (projects.length > 0 && currentIdx < projects.length ? projects[currentIdx].title : 'Project Matcher')}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maineBlue mb-4"></div>
            <div className="text-lg font-retro mb-2">{'Finding matching projects...'}</div>
          </div>
        ) : error ? (
          <div className="text-lobsterRed text-center">{error}</div>
        ) : projects.length === 0 || currentIdx >= projects.length ? (
          <div className="text-center text-maineBlue font-bold py-10">{'No more suggestions.'}<br/>{'Try updating your bench inventory!'}</div>
        ) : (
          (() => {
            console.log('Project healthTags:', projects[currentIdx].healthTags);
            return (
              <div className="flex flex-col items-center">
                <div className="bg-sand rounded-xl shadow-lg border border-black p-4 w-full max-w-md mb-4 relative">
                  <img src={projects[currentIdx].image} alt={projects[currentIdx].title} className="w-full h-48 object-cover rounded mb-2" />
                  <div className="flex flex-wrap gap-1 mb-3 justify-center">
                    {SKILL_TAGS.map(tag => {
                      const isMatch = projects[currentIdx].healthTags?.includes(tag.key);
                      return (
                        <span 
                          key={tag.key}
                          className={`px-2 py-1 rounded-full text-xs ${
                            isMatch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tag.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('projectCard.materials', { defaultValue: 'Materials' })}:</span> {projects[currentIdx].ingredients.join(', ')}</div>
                  {projects[currentIdx].equipment && projects[currentIdx].equipment!.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 text-center"><span className="font-bold">{t('projectCard.equipment', { defaultValue: 'Tools/Equipment' })}:</span> {projects[currentIdx].equipment!.join(', ')}</div>
                  )}
                </div>
                <div className="flex gap-8 mt-2">
                  <button className="bg-lobsterRed text-weatheredWhite px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" onClick={handleSkip}>
                    Discard
                  </button>
                  <button 
                    className="bg-seafoam text-maineBlue px-6 py-2 rounded-full shadow hover:bg-maineBlue hover:text-seafoam text-xl font-bold" 
                    onClick={handleLike}
                    disabled={isSaving}
                  >
                    {isSaving ? '...' : 'Save'}
                  </button>
                </div>
                <div className="text-xs mt-4 text-center text-gray-500">{'Swipe through welding project options'}</div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default ProjectMatcherModal;


