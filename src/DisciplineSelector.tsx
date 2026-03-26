import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './disciplines/culinary/images/logo.png';
import { useSupabase } from './disciplines/culinary/components/SupabaseProvider';
import { supabase } from './disciplines/culinary/api/supabaseClient';
import { generateDisciplineSkin, generateSlug, convertToFullSkin } from './services/aiDisciplineGenerator';
import { loadCustomDisciplines } from './disciplineConfig';
import { loadCustomSkins } from './disciplineSkinConfig';

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
  const { isAdmin, isLoading, user } = useSupabase();
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [showAddDisciplineModal, setShowAddDisciplineModal] = useState(false);
  const [disciplineName, setDisciplineName] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [customDisciplines, setCustomDisciplines] = useState<Array<{ key: string; label: string; icon: string }>>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);

  // Load custom disciplines on mount
  useEffect(() => {
    async function fetchCustomDisciplines() {
      try {
        // Load both config and skins
        await Promise.all([loadCustomDisciplines(), loadCustomSkins()]);
        
        // Fetch custom disciplines for dropdown
        const { data, error } = await supabase
          .from('custom_disciplines')
          .select('slug, name, skin_config')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error loading custom disciplines:', error);
          return;
        }

        const customDisciplinesList = data?.map((d) => ({
          key: d.slug,
          label: d.name,
          icon: (d.skin_config as any)?.icon || '📚',
        })) || [];

        setCustomDisciplines(customDisciplinesList);
      } catch (error) {
        console.error('Error fetching custom disciplines:', error);
      } finally {
        setIsLoadingCustom(false);
      }
    }

    fetchCustomDisciplines();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-maineBlue text-xl">Loading...</div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDiscipline) {
      // ALWAYS save selectedDiscipline to localStorage
      localStorage.setItem('selectedDiscipline', selectedDiscipline);
      
      if (isAdmin) {
        console.log('DisciplineSelector - Storing discipline:', selectedDiscipline);
        localStorage.setItem('adminSelectedDiscipline', selectedDiscipline);
        
        // Trigger storage event to notify admin dashboard
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'adminSelectedDiscipline',
          newValue: selectedDiscipline,
          oldValue: null,
          storageArea: localStorage
        }));
        
        // Routing: Admin -> /admin
        navigate('/admin');
      } else {
        // Routing: User -> /{selectedDiscipline}/dashboard
        navigate(`/${selectedDiscipline}/dashboard`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Discipline Selection Form - Everything in the box */}
        <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-8 overflow-visible">
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
                disabled={isLoadingCustom}
              >
                <option value="">-- Select Discipline --</option>
                {disciplines.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.icon} {d.label}
                  </option>
                ))}
                {customDisciplines.length > 0 && (
                  <optgroup label="Custom Programs">
                    {customDisciplines.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.icon} {d.label}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {isAdmin && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowAddDisciplineModal(true)}
                  className="w-full bg-seafoam text-maineBlue font-bold py-2 px-4 rounded-lg hover:bg-maineBlue hover:text-white transition-colors border-2 border-maineBlue text-sm"
                >
                  ➕ Add Discipline
                </button>
              </div>
            )}

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

      {/* Add Discipline Modal */}
      {showAddDisciplineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border-4 border-maineBlue max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Create New Discipline</h2>
              <button
                onClick={() => {
                  setShowAddDisciplineModal(false);
                  setDisciplineName('');
                  setAdditionalContext('');
                  setGenerationError(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {generationError && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-red-700 text-sm">
                {generationError}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsGenerating(true);
              setGenerationError(null);

              try {
                // Generate slug
                const slug = generateSlug(disciplineName);

                // Check if discipline already exists
                const { data: existing } = await supabase
                  .from('custom_disciplines')
                  .select('id')
                  .eq('slug', slug)
                  .single();

                if (existing) {
                  throw new Error('A discipline with this name already exists');
                }

                // Generate skin using AI
                const aiSkin = await generateDisciplineSkin({
                  disciplineName,
                  additionalContext: additionalContext || undefined,
                });

                // Convert to full skin format
                const fullSkin = convertToFullSkin(slug, aiSkin);

                // Save to database
                const { error: insertError } = await supabase
                  .from('custom_disciplines')
                  .insert({
                    name: aiSkin.name,
                    slug,
                    skin_config: fullSkin,
                    created_by: user?.id,
                    is_active: true,
                  });

                if (insertError) {
                  throw insertError;
                }

                // Success - close modal and refresh
                setShowAddDisciplineModal(false);
                setDisciplineName('');
                setAdditionalContext('');
                
                // Reload page to fetch new disciplines
                window.location.reload();
              } catch (error: any) {
                console.error('Error creating discipline:', error);
                setGenerationError(error.message || 'Failed to create discipline. Please try again.');
              } finally {
                setIsGenerating(false);
              }
            }}>
              <div className="mb-4">
                <label htmlFor="disciplineName" className="block text-sm font-bold text-gray-700 mb-2">
                  Discipline Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="disciplineName"
                  type="text"
                  value={disciplineName}
                  onChange={(e) => setDisciplineName(e.target.value)}
                  placeholder="e.g., Welding, Cosmetology, HVAC"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none"
                  required
                  disabled={isGenerating}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="additionalContext" className="block text-sm font-bold text-gray-700 mb-2">
                  Additional Context <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  id="additionalContext"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any specific details about your program? (e.g., 'Focus on residential welding' or 'Includes advanced color theory'))"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-maineBlue focus:outline-none h-24 resize-none"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDisciplineModal(false);
                    setDisciplineName('');
                    setAdditionalContext('');
                    setGenerationError(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!disciplineName.trim() || isGenerating}
                  className="flex-1 bg-maineBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-maineBlue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Create Discipline'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplineSelector;
