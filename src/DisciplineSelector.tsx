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
  const [previewTab, setPreviewTab] = useState<'dashboard' | 'workspace' | 'notebook' | 'community' | 'school' | 'admin'>('dashboard');
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

      {showStudentPreviewModal && generatedSkinPreview && (() => {
        const s = generatedSkinPreview;
        const facultyTitle = s.people.facultyTitle;
        const dashTitle = `${facultyTitle}'s Desk`;
        const tabs: { key: typeof previewTab; label: string }[] = [
          { key: 'dashboard', label: dashTitle },
          { key: 'workspace', label: s.modules.workspace },
          { key: 'notebook', label: s.modules.notebook },
          { key: 'community', label: s.modules.community },
          { key: 'school', label: s.modules.school },
          { key: 'admin', label: 'Admin Dashboard' },
        ];
        return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl border-4 border-maineBlue w-full max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="text-lg sm:text-2xl font-retro text-maineBlue">Live Preview</h3>
              <button
                onClick={() => setShowStudentPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Tab Arrow Navigation */}
            {(() => {
              const currentIdx = tabs.findIndex((t) => t.key === previewTab);
              const prevIdx = (currentIdx - 1 + tabs.length) % tabs.length;
              const nextIdx = (currentIdx + 1) % tabs.length;
              return (
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewTab(tabs[prevIdx].key)}
                    className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-maineBlue text-maineBlue hover:bg-maineBlue hover:text-white transition-colors text-lg font-bold"
                    aria-label="Previous tab"
                  >
                    ‹
                  </button>
                  <div className="text-center">
                    <span className="font-retro text-maineBlue text-sm sm:text-base font-bold">{tabs[currentIdx]?.label}</span>
                    <span className="block text-[10px] text-gray-500">{currentIdx + 1} / {tabs.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewTab(tabs[nextIdx].key)}
                    className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-maineBlue text-maineBlue hover:bg-maineBlue hover:text-white transition-colors text-lg font-bold"
                    aria-label="Next tab"
                  >
                    ›
                  </button>
                </div>
              );
            })()}

            {/* Tab Content */}
            <div className="overflow-y-auto pr-1 flex-1">

              {/* ===== TAB 1: STUDENT DASHBOARD ===== */}
              {previewTab === 'dashboard' && (
                <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6">
                  <div className="text-center mb-6">
                    <h1 className="text-4xl font-retro text-maineBlue mb-2">{s.icon} {dashTitle}</h1>
                    <p className="text-gray-600 italic">Click a module to begin your {s.name.toLowerCase()} journey!</p>
                  </div>
                  <hr className="border-t-2 border-maineBlue mb-6" />
                  <div className="mb-4 p-3">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
                    <div className="flex flex-col items-center p-6 rounded-lg border-4 border-seafoam bg-teal-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                      <div className="mb-3 text-4xl">{s.icon}</div>
                      <h3 className="text-sm font-bold font-retro">{s.modules.workspace}</h3>
                    </div>
                    <div className="flex flex-col items-center p-6 rounded-lg border-4 border-blue-400 bg-blue-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                      <div className="mb-3 text-4xl">📖</div>
                      <h3 className="text-sm font-bold font-retro">{s.modules.notebook}</h3>
                    </div>
                    <div className="flex flex-col items-center p-6 rounded-lg border-4 border-red-400 bg-red-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                      <div className="mb-3 text-4xl">🤝</div>
                      <h3 className="text-sm font-bold font-retro">{s.modules.community}</h3>
                    </div>
                    <div className="flex flex-col items-center p-6 rounded-lg border-4 border-yellow-300 bg-yellow-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                      <div className="mb-3 text-4xl">🎓</div>
                      <h3 className="text-sm font-bold font-retro">{s.modules.school}</h3>
                    </div>
                  </div>
                  </div>
                  <div className="bg-red-50 border-4 border-red-400 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center mr-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="font-bold text-red-700 text-sm">LIVE NOW</span>
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-sm text-red-800">
                          <strong>{s.people.mockFaculty[0]?.name || 'Instructor'}</strong> is presenting live &bull; 23 watching
                        </span>
                      </div>
                      <div className="bg-red-500 text-white text-xs px-4 py-2 rounded-full font-medium">
                        🔴 Join
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-blue-50 border-4 border-blue-400 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">📚</div>
                        <h4 className="font-semibold text-gray-900 text-sm font-retro mb-1">Learning Progress</h4>
                        <p className="text-xs text-gray-600 italic mb-2">Track your lessons &amp; curriculum</p>
                        <span className="bg-maineBlue text-white px-4 py-1.5 rounded-md text-xs font-retro inline-block">View Details</span>
                      </div>
                      <div className="bg-green-50 border-4 border-green-400 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">⭐</div>
                        <h4 className="font-semibold text-gray-900 text-sm font-retro mb-1">Skills Development</h4>
                        <p className="text-xs text-gray-600 italic mb-2">Monitor your {s.content.metricLabel.toLowerCase()}</p>
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
                  <div className="mt-4 flex justify-end">
                    <div className="bg-white border-4 border-maineBlue rounded-lg shadow-lg p-3 max-w-[220px]">
                      <p className="font-bold text-maineBlue text-xs font-retro mb-1">💬 {s.assistant.name}</p>
                      <p className="text-[10px] text-gray-600 leading-tight line-clamp-2">{s.assistant.greeting.split('.')[0]}.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== TAB 2: WORKSPACE (mirrors MyKitchen) ===== */}
              {previewTab === 'workspace' && (
                <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue flex flex-col">
                  <div className="flex items-center justify-center p-6 pb-4">
                    <span className="text-5xl mr-2">{s.icon}</span>
                    <h1 className="text-3xl font-retro text-maineBlue mb-0">{s.modules.workspace}</h1>
                  </div>
                  <div className="sticky top-0 bg-white z-10 px-6">
                    <hr className="border-t-2 border-maineBlue" />
                  </div>
                  <div className="p-6 pt-4">
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
                      <span className="bg-lobsterRed text-weatheredWhite px-4 py-2 rounded font-bold text-sm border border-black">📷 Upload to {s.modules.workspace}</span>
                      <span className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold text-sm border border-black">🔍 Browse {s.content.metricLabel}</span>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-retro text-maineBlue flex items-center gap-2">
                        <span role="img" aria-label="pin">📌</span> Project Board
                      </h3>
                      <span className="text-xs text-lobsterRed underline hover:text-maineBlue">Clear All</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
                      <input type="text" className="border px-3 py-2 rounded w-full sm:w-1/3" placeholder="Search projects..." readOnly />
                      <input type="text" className="border px-3 py-2 rounded w-full sm:w-1/3" placeholder={`Add a ${s.content.metricLabel.toLowerCase().replace(/s$/, '')}...`} readOnly />
                      <select className="border px-2 py-2 rounded bg-weatheredWhite text-sm">
                        <option>Category</option>
                      </select>
                      <span className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black text-center">Add</span>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-sand border-4 border-maineBlue rounded-2xl shadow-lg p-4 relative overflow-hidden">
                      <div className="grid grid-cols-3 gap-3 relative z-10">
                        {['Item A', 'Item B', 'Item C', 'Item D', 'Item E', 'Item F'].map((item, idx) => (
                          <div key={idx} className="bg-white border-2 border-maineBlue rounded-lg shadow-sm p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                            <span className="text-[10px] text-gray-500 bg-sand px-1.5 rounded-sm font-medium mb-1">Category</span>
                            <span className="text-xs font-semibold text-maineBlue break-words px-1">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== TAB 3: NOTEBOOK (mirrors MyCookBook) ===== */}
              {previewTab === 'notebook' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Side - Main Cookbook */}
                  <div className="lg:w-2/3 bg-weatheredWhite rounded shadow-lg border-4 border-maineBlue flex flex-col">
                    <div className="flex items-center justify-center p-6 pb-4">
                      <span className="text-5xl mr-2">📖</span>
                      <h1 className="text-3xl font-retro text-maineBlue mb-0">{s.modules.notebook}</h1>
                    </div>
                    <div className="sticky top-0 bg-weatheredWhite z-10 px-6">
                      <hr className="border-t-2 border-maineBlue" />
                    </div>
                    <div className="overflow-y-auto p-6 pt-4">
                      {/* Search and Filters */}
                      <div className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                          <select className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-seafoam bg-white text-sm w-full sm:w-auto sm:min-w-[120px]">
                            <option>All</option>
                            <option>Category A</option>
                            <option>Category B</option>
                          </select>
                          <div className="relative flex-1">
                            <span className="border px-3 py-2 rounded border-gray-300 w-full text-sm block pl-8 text-gray-400">Search {s.content.metricLabel.toLowerCase()}...</span>
                            <div className="absolute left-2 top-2.5 text-gray-400">🔍</div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <span className="px-4 py-2 rounded border border-black text-sm font-bold bg-gray-200 text-gray-500 min-w-[100px] text-center">Previous</span>
                          <span className="px-4 py-2 rounded border border-black text-sm font-bold bg-seafoam text-maineBlue min-w-[100px] text-center">Next</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">{s.content.metricLabel.replace(/s$/, '')} 1 of 5</div>

                      {/* Flip Card Recipe Display - Front Face */}
                      <div className="relative w-full min-h-[450px]">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border-4 border-maineBlue flex flex-col items-center">
                          <div className="w-full h-32 sm:h-40 bg-gray-200 rounded-lg mb-4 border-2 border-gray-200 flex items-center justify-center text-gray-400">Photo</div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-center text-maineBlue">Sample {s.content.metricLabel.replace(/s$/, '')}</h3>
                          <div className="flex-1 flex flex-col justify-center w-full px-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                              <div className="bg-seafoam/20 p-3 rounded-lg text-center border-2 border-seafoam">
                                <h4 className="font-bold mb-2 text-sm sm:text-base text-maineBlue">📋 Items</h4>
                                <ul className="list-disc pl-4 max-h-[100px] overflow-y-auto text-left text-xs sm:text-sm space-y-0.5">
                                  <li>Component Alpha</li>
                                  <li>Component Beta</li>
                                  <li>Component Gamma</li>
                                </ul>
                              </div>
                              <div className="bg-amber-50 p-3 rounded-lg text-center border-2 border-amber-300">
                                <h4 className="font-bold mb-2 text-sm sm:text-base text-amber-900">�️ Equipment</h4>
                                <ul className="list-disc pl-4 max-h-[100px] overflow-y-auto text-left text-xs sm:text-sm space-y-0.5">
                                  <li>Tool A</li>
                                  <li>Tool B</li>
                                </ul>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg text-center border-2 border-green-300">
                                <h4 className="font-bold mb-2 text-sm sm:text-base text-green-900">🏷️ Tags</h4>
                                <div className="flex flex-wrap gap-1.5 justify-center max-h-[100px] overflow-y-auto">
                                  <span className="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-semibold border border-green-400">Healthy</span>
                                  <span className="bg-green-200 text-green-900 px-2 py-1 rounded-full text-xs font-semibold border border-green-400">Quick</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 text-xs sm:text-sm text-gray-600 text-center font-semibold bg-gray-100 px-4 py-2 rounded-full border border-gray-300">
                            Tap to flip for instructions
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center w-full italic">Scroll to see more</div>

                      {/* Chef Quote */}
                      <div className="mt-6 text-center">
                        <div className="italic text-lg mb-1">&ldquo;The only way to do great work is to love what you do.&rdquo;</div>
                        <div className="text-gray-600">&mdash; Industry Leader</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Collections Library */}
                  <div className="lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full h-full">
                      <div className="p-4 bg-seafoam text-maineBlue font-retro text-center">
                        <h3 className="text-xl">📚 Collections Library</h3>
                      </div>
                      <div className="p-4">
                        <div className="mb-6">
                          <h4 className="font-bold text-maineBlue mb-3">📋 My Collections</h4>
                          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50">
                            {['Favorites', 'Quick Start', 'Advanced'].map((name, idx) => (
                              <div key={idx} className="py-2 px-2 hover:bg-sand rounded cursor-pointer flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="mr-2">{idx === 0 ? '⭐' : idx === 1 ? '⚡' : '🥗'}</span>
                                  <span className="text-sm">{name}</span>
                                </div>
                                <span className="text-xs text-gray-500 bg-seafoam px-2 py-1 rounded-full">{idx === 0 ? 3 : idx === 1 ? 2 : 5}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <p className="text-sm text-gray-600 mb-3">Select {s.content.metricLabel.toLowerCase()} to add:</p>
                          <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-2">
                            {['Sample A', 'Sample B', 'Sample C'].map((name, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 hover:bg-sand rounded">
                                <div className="flex items-center">
                                  <input type="checkbox" className="mr-3 w-4 h-4 text-maineBlue bg-gray-100 border-gray-300 rounded" readOnly />
                                  <span className="text-sm">{name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border-t border-gray-200">
                        <span className="w-full mt-3 px-4 py-2 rounded border transition-colors bg-seafoam text-maineBlue border-maineBlue block text-center font-bold">Create Collection (0)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== TAB 4: COMMUNITY (mirrors ChefsCorner) ===== */}
              {previewTab === 'community' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue">
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-5xl mr-2">🤝</span>
                      <h1 className="text-3xl font-retro text-maineBlue mb-0">{s.modules.community}</h1>
                    </div>
                    <hr className="border-t-2 border-maineBlue mb-6" />
                    <div className="w-full mx-auto">
                      <section className="mb-8">
                        <div className="bg-sand p-4 rounded-lg border border-black">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-700">Showcase {s.content.metricLabel.replace(/s$/, '')}</label>
                            <div className="flex gap-2">
                              <span className="bg-seafoam text-maineBlue px-4 py-2 rounded font-bold hover:bg-maineBlue hover:text-seafoam transition-colors border border-black cursor-pointer">📋 Build Showcase</span>
                              <span className="bg-maineBlue text-seafoam px-4 py-2 rounded font-bold hover:bg-seafoam hover:text-maineBlue transition-colors border border-gray-300 cursor-pointer">Import from {s.modules.notebook}</span>
                            </div>
                          </div>
                          <div className="mt-4 text-gray-400 italic text-center">No {s.content.metricLabel.toLowerCase().replace(/s$/, '')} selected — import one to showcase</div>
                        </div>
                      </section>
                      <p className="text-center text-gray-600 italic mb-6">&ldquo;Skills can be taught. Character you either have or you don&rsquo;t have.&rdquo; &mdash; Industry Leader</p>
                    </div>
                  </div>
                  {/* Right Sidebar - GlobalTestKitchen */}
                  <div className="lg:w-1/3 space-y-6">
                    <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full">
                      <div className="p-4 bg-red-500 text-white font-retro text-center">
                        <h2 className="text-xl flex items-center justify-center">
                          <span className="text-2xl mr-2">🌍</span>
                          Global {s.name} Lab
                        </h2>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 text-center mb-4">Watch and share live {s.name.toLowerCase()} sessions with peers worldwide</p>
                        {/* Tab Navigation */}
                        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                          <span className="flex-1 py-2 px-1 rounded-md text-xs font-medium bg-white text-maineBlue shadow-sm text-center">🔴 Live</span>
                          <span className="flex-1 py-2 px-1 rounded-md text-xs font-medium text-gray-600 text-center">📅 Upcoming</span>
                          <span className="flex-1 py-2 px-1 rounded-md text-xs font-medium text-gray-600 text-center">🎥 Host</span>
                        </div>
                        {/* Live Sessions */}
                        <div className="space-y-3">
                          {[
                            { name: `${s.people.mockFaculty[0]?.name || 'Instructor A'}`, title: `Advanced ${s.name} Demo`, viewers: 47, isLive: true, emoji: '📺', desc: `Live demonstration of advanced ${s.name.toLowerCase()} techniques` },
                            { name: 'Guest Speaker', title: `${s.name} Industry Insights`, viewers: 23, isLive: true, emoji: '🎤', desc: `Real-world ${s.name.toLowerCase()} career perspectives` },
                            { name: 'Student Showcase', title: `Peer ${s.content.metricLabel.replace(/s$/, '')} Review`, viewers: 35, isLive: false, emoji: '🏆', desc: `Student-led ${s.content.metricLabel.toLowerCase()} showcase and feedback` },
                          ].map((session, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                  <span className="text-2xl mr-2">{session.emoji}</span>
                                  <div>
                                    <h3 className="font-semibold text-sm text-gray-900">{session.title}</h3>
                                    <p className="text-xs text-gray-600">by {session.name}</p>
                                  </div>
                                </div>
                                <div className={`flex items-center text-xs ${session.isLive ? 'text-red-600' : 'text-gray-500'}`}>
                                  <div className={`w-2 h-2 ${session.isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'} rounded-full mr-1`}></div>
                                  {session.isLive ? 'LIVE' : 'Ended'}
                                </div>
                              </div>
                              <p className="text-xs text-gray-700 mb-2">{session.desc}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">🌍 {s.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">👥 {session.viewers} watching</span>
                                  <span className={`text-white text-xs px-3 py-1 rounded-full ${session.isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}>
                                    {session.isLive ? 'Join' : 'Ended'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== TAB 5: SCHOOL (mirrors CulinarySchool) ===== */}
              {previewTab === 'school' && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="lg:w-2/3 bg-white p-6 rounded-lg shadow-lg border-4 border-maineBlue">
                    <div className="flex items-center justify-center mb-4">
                      <span className="text-5xl mr-2">🎓</span>
                      <h1 className="text-3xl font-retro text-maineBlue mb-0">{s.modules.school}</h1>
                    </div>
                    <hr className="border-t-2 border-maineBlue mb-6" />
                    <div className="w-full mx-auto">
                      {/* Practice Settings Section (mirrors CookingTimer layout) */}
                      <div className="space-y-4">
                        <div className="bg-sand p-4 rounded-lg border border-black">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-700">Study Group Size:</label>
                            <div className="flex items-center space-x-2">
                              <input type="number" min="1" max="8" defaultValue={2} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center font-bold" readOnly />
                              <span className="text-sm text-gray-600">participants</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 mb-2">
                            {Array.from({ length: 8 }, (_, i) => (
                              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i < 2 ? 'bg-maineBlue text-seafoam' : 'bg-gray-200 text-gray-400'}`}>👤</div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500">*Practice settings adjust based on group size</div>
                          <div className="text-xs text-gray-400 mt-1">Recommended by {s.people.defaultProgram} standards</div>
                        </div>
                        {/* Preset Practice Timers */}
                        <div className="bg-sand p-4 rounded-lg border border-black">
                          <h4 className="text-sm font-semibold mb-2 text-gray-700">{s.name} Practice Timers:</h4>
                          <div className="flex flex-wrap gap-2">
                            {[`${s.name} Basics (8m)`, `Core Skills (18m)`, `Quick Review (6m)`, `Deep Practice (12m)`, `Assessment (4m)`].map((preset, index) => (
                              <span key={index} className="px-3 py-1 bg-seafoam text-maineBlue rounded-full text-xs font-medium hover:bg-maineBlue hover:text-seafoam transition-colors cursor-pointer">{preset}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Tutorial Cards */}
                      <div className="space-y-4 mt-8">
                        <div className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors">
                          <div className="font-bold mb-1">📺 {s.name} Technique of the Week</div>
                          <div className="text-sm text-gray-700">Watch this week's featured {s.name.toLowerCase()} tutorial</div>
                        </div>
                        <div className="bg-sand p-4 rounded shadow-inner border border-black relative cursor-pointer hover:bg-sky-300 hover:text-maineBlue transition-colors">
                          <div className="font-bold mb-1">📺 {s.name} Guided Practice</div>
                          <div className="text-sm text-gray-700">Follow along with step-by-step {s.name.toLowerCase()} instruction</div>
                        </div>
                      </div>
                      {/* Navigation Links */}
                      <div className="mt-8 text-center">
                        <div className="text-gray-700 mb-4">Select a {s.content.metricLabel.toLowerCase().replace(/s$/, '')} to get started:</div>
                        <div className="flex justify-center space-x-4">
                          <span className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow font-bold">Go to {s.modules.workspace}</span>
                          <span className="inline-block bg-maineBlue text-seafoam px-6 py-2 rounded-full shadow font-bold">Go to {s.modules.notebook}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right Side - SyllabusCard */}
                  <div className="lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue overflow-hidden w-full">
                      <div className="p-4 bg-yellow-400 text-maineBlue font-retro">
                        <h3 className="text-xl">✏️ {s.people.defaultProgram} Curriculum</h3>
                      </div>
                      {/* Practice Board Button */}
                      <div className="px-4 pt-4">
                        <span className="w-full px-4 py-2 rounded border transition-colors bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 hover:text-amber-900 block text-center cursor-pointer">🥽 {s.modules.practiceBench || `${s.name} Practice Bench`}</span>
                      </div>
                      <div className="p-4">
                        {[
                          { title: 'Term 1: Foundations', expanded: true, lessons: [
                            { name: 'Lesson A', completed: true, current: false },
                            { name: 'Lesson B', completed: true, current: false },
                            { name: 'Lesson C', completed: false, current: true },
                            { name: 'Lesson D', completed: false, current: false },
                            { name: 'Lesson E', completed: false, current: false },
                          ]},
                          { title: 'Term 1: Core Skills', expanded: false, lessons: [
                            { name: 'Lesson A', completed: false, current: false },
                            { name: 'Lesson B', completed: false, current: false },
                          ]},
                          { title: 'Term 2: Applied Practice', expanded: false, lessons: [] },
                          { title: 'Term 2: Specialization', expanded: false, lessons: [] },
                        ].map((course, idx) => (
                          <div key={idx} className="mb-4 last:mb-0">
                            <div className="flex items-center justify-between cursor-pointer hover:bg-sand p-2 rounded">
                              <h4 className="font-bold text-maineBlue">{course.title}</h4>
                              <span className="text-sm text-gray-500">{course.expanded ? '▼' : '►'}</span>
                            </div>
                            {course.expanded && course.lessons.length > 0 && (
                              <div className="ml-4 mt-2 border-l-2 border-gray-300 pl-4">
                                {course.lessons.map((lesson, li) => (
                                  <div key={li} className={`py-2 flex items-center cursor-pointer hover:bg-sand rounded px-2 ${lesson.current ? 'bg-sand' : ''}`}>
                                    <div className="mr-2">
                                      {lesson.completed ? (
                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                          <span className="text-white text-xs">✓</span>
                                        </div>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                                          <span className="text-gray-400 text-[8px]">⏱</span>
                                        </div>
                                      )}
                                    </div>
                                    <span className={lesson.current ? 'font-bold' : ''}>{lesson.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== TAB 6: ADMIN DASHBOARD (mirrors UnifiedAdminDashboard) ===== */}
              {previewTab === 'admin' && (
                <div className="space-y-4">
                  <div className="bg-white border-2 border-maineBlue rounded-lg shadow-sm px-4 py-3 grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                    <p className="text-maineBlue font-retro text-sm sm:text-base text-center sm:text-left">Your School Name Here</p>
                    <div className="flex items-center justify-center gap-2 w-full">
                      <label className="font-retro text-sm text-maineBlue whitespace-nowrap">Program:</label>
                      <span className="border-2 border-maineBlue rounded-lg px-4 py-2 font-retro text-sm bg-white text-maineBlue">{s.icon} {s.name}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 italic text-center sm:text-right">Viewing: <span className="font-semibold text-maineBlue">{s.name}</span></p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg border-4 border-maineBlue p-4 lg:p-6">
                    <div className="text-center mb-6">
                      <h1 className="text-4xl font-retro text-maineBlue mb-2">Admin Dashboard</h1>
                      <p className="text-gray-600 italic">Manage your {s.name.toLowerCase()} program</p>
                    </div>
                    <hr className="border-t-2 border-maineBlue mb-6" />
                    <div className="mb-4 p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-2">
                      <div className="flex flex-col items-center p-6 rounded-lg border-4 border-seafoam bg-teal-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                        <div className="mb-3 text-4xl">🌡️</div>
                        <h3 className="text-sm font-bold font-retro">Overview</h3>
                      </div>
                      <div className="flex flex-col items-center p-6 rounded-lg border-4 border-blue-400 bg-blue-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                        <div className="mb-3 text-4xl">🎓</div>
                        <h3 className="text-sm font-bold font-retro">Users</h3>
                      </div>
                      <div className="flex flex-col items-center p-6 rounded-lg border-4 border-red-400 bg-red-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                        <div className="mb-3 text-4xl">📚</div>
                        <h3 className="text-sm font-bold font-retro">Curriculum Content</h3>
                      </div>
                      <div className="flex flex-col items-center p-6 rounded-lg border-4 border-yellow-300 bg-yellow-50 text-black hover:scale-105 transition-transform duration-200 text-center min-h-[120px]">
                        <div className="mb-3 text-4xl">🏫</div>
                        <h3 className="text-sm font-bold font-retro">School Settings</h3>
                      </div>
                    </div>
                    </div>
                    <div className="bg-orange-50 border-4 border-orange-400 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center mr-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="font-bold text-orange-700 text-sm">🛡️ Integrity Alerts (3)</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="text-sm text-orange-800">Fast completion detected &bull; Flagged for review</span>
                        </div>
                        <div className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-medium">Review</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue mb-4">
                      <h3 className="font-retro text-base text-maineBlue mb-3">Program Health</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Users', value: '156', icon: '👥' },
                          { label: 'Active Users', value: '89', icon: '✅' },
                          { label: s.content.metricLabel, value: '342', icon: '📄' },
                          { label: 'Total XP', value: '24,500', icon: '⭐' },
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-blue-50 border-4 border-blue-400 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-xl font-bold text-maineBlue">{stat.value}</div>
                            <div className="text-xs text-gray-600">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 border-4 border-maineBlue">
                      <h3 className="font-retro text-base text-maineBlue mb-3">Faculty</h3>
                      <div className="space-y-3">
                        {s.people.mockFaculty.map((f, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-3 border-4 border-gray-400 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-green-500'} flex items-center justify-center text-white text-sm font-bold`}>
                              {f.name.split(' ').filter((_: string, i: number, a: string[]) => i === 0 || i === a.length - 1).map((w: string) => w[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{f.name}</div>
                              <div className="text-xs text-gray-500">{f.role} &bull; {f.courses}</div>
                            </div>
                            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded">Active</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
        );
      })()}
    </div>
  );
};

export default DisciplineSelector;
