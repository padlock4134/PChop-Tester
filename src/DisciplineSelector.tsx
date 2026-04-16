import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './disciplines/culinary/images/logo.png';
import { useSupabase } from './components/DisciplineSupabaseProvider';
import { supabase } from './disciplines/culinary/api/supabaseClient';
import { AIGeneratedSkin, generateDisciplineSkin, generateSlug, convertToFullSkin, findCulinaryLeakage } from './services/aiDisciplineGenerator';
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
  const [isSavingDiscipline, setIsSavingDiscipline] = useState(false);
  const [showStudentPreviewModal, setShowStudentPreviewModal] = useState(false);
  const [previewTab, setPreviewTab] = useState<'dashboard' | 'workspace' | 'notebook' | 'community' | 'school'>('dashboard');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSkinPreview, setGeneratedSkinPreview] = useState<AIGeneratedSkin | null>(null);
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [customDisciplines, setCustomDisciplines] = useState<Array<{ key: string; label: string; icon: string; isActive: boolean }>>([]);
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
          .select('slug, name, skin_config, is_active')
          .order('name');

        if (error) {
          console.error('Error loading custom disciplines:', error);
          return;
        }

        const visibleDisciplines = isAdmin
          ? (data || [])
          : (data || []).filter((discipline) => discipline.is_active);

        const customDisciplinesList = visibleDisciplines.map((d) => ({
          key: d.slug,
          label: d.name,
          icon: (d.skin_config as any)?.icon || '📚',
          isActive: d.is_active,
        }));

        setCustomDisciplines(customDisciplinesList);
      } catch (error) {
        console.error('Error fetching custom disciplines:', error);
      } finally {
        setIsLoadingCustom(false);
      }
    }

    fetchCustomDisciplines();
  }, [isAdmin]);

  const resetCreateDisciplineState = () => {
    setShowAddDisciplineModal(false);
    setDisciplineName('');
    setAdditionalContext('');
    setShowStudentPreviewModal(false);
    setPreviewTab('dashboard');
    setGenerationError(null);
    setGeneratedSkinPreview(null);
    setGeneratedSlug('');
  };

  const publishGeneratedDiscipline = async () => {
    if (!generatedSkinPreview) {
      return;
    }

    setIsSavingDiscipline(true);
    setGenerationError(null);

    try {
      const fullSkin = convertToFullSkin(generatedSlug, generatedSkinPreview);
      const { error: insertError } = await supabase
        .from('custom_disciplines')
        .insert({
          name: generatedSkinPreview.name,
          slug: generatedSlug,
          skin_config: fullSkin,
          created_by: user?.id,
          is_active: true,
        });

      if (insertError) {
        throw insertError;
      }

      resetCreateDisciplineState();
      window.location.reload();
    } catch (error: any) {
      console.error('Error publishing discipline:', error);
      setGenerationError(error.message || 'Failed to publish discipline. Please try again.');
      setShowStudentPreviewModal(false);
    } finally {
      setIsSavingDiscipline(false);
    }
  };

  if (isLoading && !user) {
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
        // Admins should land with global visibility, not a single-discipline filter.
        localStorage.setItem('adminSelectedDiscipline', 'total');

        // Trigger storage event to notify admin dashboard
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'adminSelectedDiscipline',
          newValue: 'total',
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
                    {customDisciplines.filter((d) => d.isActive).map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.icon} {d.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                {isAdmin && customDisciplines.some((d) => !d.isActive) && (
                  <optgroup label="Draft Programs (Admin only)">
                    {customDisciplines.filter((d) => !d.isActive).map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.icon} {d.label} (Draft)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border-4 border-maineBlue w-full max-w-2xl max-h-[92vh] flex flex-col p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-2xl font-bold text-maineBlue font-retro">Create New Discipline</h2>
              <button
                onClick={resetCreateDisciplineState}
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

            <form className="overflow-y-auto pr-1" onSubmit={async (e) => {
              e.preventDefault();
              if (generatedSkinPreview) {
                return;
              }

              setIsGenerating(true);
              setGenerationError(null);

              try {
                // Generate slug
                const slug = generateSlug(disciplineName);
                setGeneratedSlug(slug);

                // Check if discipline already exists
                const { data: existing } = await supabase
                  .from('custom_disciplines')
                  .select('id')
                  .eq('slug', slug)
                  .maybeSingle();

                if (existing) {
                  throw new Error('A discipline with this name already exists');
                }

                // Generate skin using AI
                const aiSkin = await generateDisciplineSkin({
                  disciplineName,
                  additionalContext: additionalContext || undefined,
                });

                const leakageTerms = findCulinaryLeakage(aiSkin);
                if (leakageTerms.length > 0) {
                  throw new Error(
                    `Generated skin still includes legacy culinary language (${leakageTerms.join(', ')}). Please regenerate.`
                  );
                }

                setGeneratedSkinPreview(aiSkin);
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
                  disabled={isGenerating || !!generatedSkinPreview}
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
                  disabled={isGenerating || !!generatedSkinPreview}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Guardrails enabled: use professional workforce-training context only.
                </p>
              </div>

              {generatedSkinPreview && (
                <div className="mb-6 border-2 border-seafoam bg-green-50 rounded-lg p-4">
                  <h3 className="font-bold text-maineBlue mb-2">Preview & Final Approval</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Review generated language before publishing. No legacy culinary terms should appear.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-white border rounded p-2"><strong>Slug:</strong> {generatedSlug}</div>
                    <div className="bg-white border rounded p-2"><strong>Icon:</strong> {generatedSkinPreview.icon}</div>
                    <div className="bg-white border rounded p-2"><strong>Workspace:</strong> {generatedSkinPreview.modules.workspace}</div>
                    <div className="bg-white border rounded p-2"><strong>Notebook:</strong> {generatedSkinPreview.modules.notebook}</div>
                    <div className="bg-white border rounded p-2"><strong>Community:</strong> {generatedSkinPreview.modules.community}</div>
                    <div className="bg-white border rounded p-2"><strong>School:</strong> {generatedSkinPreview.modules.school}</div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>{generatedSkinPreview.assistant.name}</strong>: {generatedSkinPreview.assistant.greeting}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Use "See Preview" to open a student-facing preview before publishing.
                  </p>
                </div>
              )}

              <div className={`grid gap-3 ${generatedSkinPreview ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <button
                  type="button"
                  onClick={resetCreateDisciplineState}
                  className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={isGenerating || isSavingDiscipline}
                >
                  Cancel
                </button>
                {generatedSkinPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedSkinPreview(null);
                      setShowStudentPreviewModal(false);
                      setGenerationError(null);
                    }}
                    disabled={isSavingDiscipline}
                    className="bg-white text-maineBlue font-bold py-2 px-4 rounded-lg border-2 border-maineBlue hover:bg-gray-100 transition-colors"
                  >
                    Regenerate
                  </button>
                )}
                {generatedSkinPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewTab('dashboard');
                        setShowStudentPreviewModal(true);
                      }}
                      disabled={isSavingDiscipline}
                      className="bg-white text-maineBlue font-bold py-2 px-4 rounded-lg border-2 border-maineBlue hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      See Preview
                    </button>
                    <button
                      type="button"
                      onClick={publishGeneratedDiscipline}
                      disabled={isSavingDiscipline}
                      className="bg-maineBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-maineBlue disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingDiscipline ? 'Saving...' : 'Approve & Publish'}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={!disciplineName.trim() || isGenerating}
                    className="bg-maineBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-maineBlue disabled:opacity-50 disabled:cursor-not-allowed"
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
                      'Generate Preview'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentPreviewModal && generatedSkinPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border-4 border-maineBlue w-full max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl sm:text-2xl font-retro text-maineBlue">Student Experience Preview</h3>
              <button
                onClick={() => setShowStudentPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Miniature Skinned Dashboard */}
            <div className="overflow-y-auto pr-1">
              <div className="bg-sand rounded-lg border-4 border-maineBlue p-4 sm:p-6 relative">

                {/* Dashboard Header - mirrors real StudentProgressDashboard */}
                <div className="text-center mb-4">
                  <h1 className="text-2xl sm:text-3xl font-retro text-maineBlue mb-1">
                    {generatedSkinPreview.icon} {generatedSkinPreview.name} Dashboard
                  </h1>
                  <p className="text-gray-600 italic text-sm">Click a module to begin your {generatedSkinPreview.name.toLowerCase()} journey!</p>
                </div>

                <hr className="border-t-2 border-maineBlue mb-4" />

                {/* Module Navigation Cards - same color scheme as real dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="flex flex-col items-center p-4 rounded-lg border-4 border-seafoam bg-teal-50 text-center min-h-[90px]">
                    <div className="mb-2 text-3xl">{generatedSkinPreview.icon}</div>
                    <h3 className="text-xs sm:text-sm font-bold font-retro">{generatedSkinPreview.modules.workspace}</h3>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg border-4 border-blue-400 bg-blue-50 text-center min-h-[90px]">
                    <div className="mb-2 text-3xl">📖</div>
                    <h3 className="text-xs sm:text-sm font-bold font-retro">{generatedSkinPreview.modules.notebook}</h3>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg border-4 border-red-400 bg-red-50 text-center min-h-[90px]">
                    <div className="mb-2 text-3xl">🤝</div>
                    <h3 className="text-xs sm:text-sm font-bold font-retro">{generatedSkinPreview.modules.community}</h3>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg border-4 border-yellow-300 bg-yellow-50 text-center min-h-[90px]">
                    <div className="mb-2 text-3xl">🎓</div>
                    <h3 className="text-xs sm:text-sm font-bold font-retro">{generatedSkinPreview.modules.school}</h3>
                  </div>
                </div>

                {/* Mock Live Session Ticker */}
                <div className="bg-red-50 border-4 border-red-400 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center mr-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="font-bold text-red-700 text-xs sm:text-sm">LIVE NOW</span>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs sm:text-sm text-red-800">
                        <strong>{generatedSkinPreview.people.mockFaculty[0]?.name || 'Instructor Demo'}</strong> is presenting live • 23 watching
                      </span>
                    </div>
                    <div className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      🔴 Join
                    </div>
                  </div>
                </div>

                {/* Progress Cards - same 3-card layout as real dashboard */}
                <div className="bg-white rounded-lg shadow-md p-4 border-4 border-maineBlue">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">📚</div>
                      <h4 className="font-semibold text-gray-900 text-sm font-retro mb-1">Learning Progress</h4>
                      <p className="text-xs text-gray-600 italic mb-2">Track your lessons &amp; curriculum</p>
                      <span className="bg-maineBlue text-white px-4 py-1.5 rounded-md text-xs font-retro inline-block">View Details</span>
                    </div>
                    <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">⭐</div>
                      <h4 className="font-semibold text-gray-900 text-sm font-retro mb-1">Skills Development</h4>
                      <p className="text-xs text-gray-600 italic mb-2">Monitor your {generatedSkinPreview.content.metricLabel.toLowerCase()}</p>
                      <span className="bg-maineBlue text-white px-4 py-1.5 rounded-md text-xs font-retro inline-block">View Details</span>
                    </div>
                    <div className="bg-purple-50 border-4 border-purple-400 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🏆</div>
                      <h4 className="font-semibold text-gray-900 text-sm font-retro mb-1">Achievements</h4>
                      <p className="text-xs text-gray-600 italic mb-2">View badges &amp; milestones</p>
                      <span className="bg-maineBlue text-white px-4 py-1.5 rounded-md text-xs font-retro inline-block">View Details</span>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Preview - mini widget in corner */}
                <div className="mt-4 flex justify-end">
                  <div className="bg-white border-4 border-maineBlue rounded-lg shadow-lg p-3 max-w-[220px]">
                    <p className="font-bold text-maineBlue text-xs font-retro mb-1">💬 {generatedSkinPreview.assistant.name}</p>
                    <p className="text-[10px] text-gray-600 leading-tight line-clamp-2">{generatedSkinPreview.assistant.greeting.split('.')[0]}.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setShowStudentPreviewModal(false)}
                className="bg-white text-maineBlue font-bold py-2 px-4 rounded-lg border-2 border-maineBlue hover:bg-gray-100 transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={publishGeneratedDiscipline}
                disabled={isSavingDiscipline}
                className="bg-maineBlue text-white font-bold py-2 px-4 rounded-lg hover:bg-seafoam hover:text-maineBlue transition-colors border-2 border-maineBlue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDiscipline ? 'Publishing...' : 'Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplineSelector;
