import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ARShopScene from './ARShopScene';
import { defaultARScenes } from '../data/defaultARScenes';
import { canUseImmersiveVR } from '../../../utils/xrSupport';
import DeviceSelectionModal from '../../../components/DeviceSelectionModal';
import { supabase } from '../api/supabaseClient';

interface BenchPracticeModalProps {
  open: boolean;
  onClose: () => void;
}

const BenchPracticeModal: React.FC<BenchPracticeModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [isPracticing, setIsPracticing] = useState(false);
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [isGeneratingAR, setIsGeneratingAR] = useState(false);
  const [arScene, setArScene] = useState<any>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [curriculumLessons, setCurriculumLessons] = useState<Array<{ id: string; title: string; weekNumber?: number }>>([]);
  const stopTrackingRef = useRef<(() => void) | null>(null);

  // Fetch curriculum lessons for dropdown
  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        let items: any[] = [];

        // Try curriculum_content first
        const { data: currData, error: currError } = await supabase
          .from('curriculum_content')
          .select('*')
          .order('week_number', { ascending: true, nullsFirst: false });

        if (!currError && currData && currData.length > 0) {
          items = currData;
        } else {
          // Fallback to content_staging
          const { data: stagingData, error: stagingError } = await supabase
            .from('content_staging')
            .select('*')
            .in('status', ['distributed', 'pending', 'draft'])
            .order('created_at', { ascending: true });

          if (!stagingError && stagingData && stagingData.length > 0) {
            items = stagingData.map((row: any) => {
              const suggestion = row.ai_suggestion || {};
              const metadata = suggestion.metadata || {};
              return {
                id: row.id,
                title: metadata.title || row.file_name || 'Untitled Lesson',
                week_number: metadata.weekNumber || null
              };
            });
          }
        }

        if (items.length > 0) {
          const lessons = items.map((item: any) => ({
            id: item.id,
            title: item.title,
            weekNumber: item.week_number
          }));
          setCurriculumLessons(lessons);
        }
      } catch (err) {
        console.error('Failed to load curriculum for dropdown:', err);
      }
    };

    if (open) {
      loadCurriculum();
    }
  }, [open]);

  if (!open) return null;

  const startVirtualPractice = async (selectedMode: 'ar' | 'vr' = 'ar') => {
    setModeNotice(null);
    if (selectedMode === 'vr') {
      const vrSupported = await canUseImmersiveVR();
      if (!vrSupported) {
        setModeNotice('No VR headset detected. Starting AR practice instead.');
      }
    }


    try {
      // For demo: Use pre-built HVAC AR scene (instant load)
      const demoLesson = Object.keys(defaultARScenes)[0] as keyof typeof defaultARScenes;

      // Check if we have a default scene
      if (demoLesson && defaultARScenes[demoLesson]) {
        console.log('Loading default AR scene for demo');
        setArScene(defaultARScenes[demoLesson]);
        setIsPracticing(true);
        return;
      }

      // Fallback: AI generation if no default exists
      setIsGeneratingAR(true);
      
      const response = await fetch('/.netlify/functions/generate-ar-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline: 'hvac',
          lessonTitle: demoLesson,
          lessonContent: 'Static pressure testing workflow for HVAC systems. Includes gauge setup, reference pressure checks, duct traverse technique, and airflow balancing validation.',
        }),
      });

      const data = await response.json();
      
      if (data.success && data.scene) {
        setArScene(data.scene);
        setIsPracticing(true);
      } else {
        throw new Error('Failed to generate AR scene');
      }
    } catch (error) {
      console.error('Error generating AR practice:', error);
      alert('Could not generate AR practice scene');
      setIsPracticing(false);
    } finally {
      setIsGeneratingAR(false);
    }
  };

  const endPractice = () => {
    // Stop pose tracking camera
    if (stopTrackingRef.current) {
      stopTrackingRef.current();
    }
    cleanupPractice();
  };

  const cleanupPractice = () => {
    if (stopTrackingRef.current) {
      stopTrackingRef.current();
    }
    setIsPracticing(false);
    setModeNotice(null);
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black w-full max-w-5xl my-auto relative flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        <button
          onClick={() => {
            // Stop camera tracking before closing
            if (stopTrackingRef.current) {
              stopTrackingRef.current();
            }
            cleanupPractice();
            setShowDeviceSelection(false);
            onClose();
          }}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-amber-800 hover:text-amber-900 text-2xl z-10 bg-white rounded-full shadow"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Left Side - Practice Area with Banner */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Banner Header - Left Side Only */}
          <div className="p-3 sm:p-4 bg-amber-100 text-amber-800 font-retro text-center border-b-2 border-amber-200">
            <h2 className="text-base sm:text-xl flex items-center justify-center">
              <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🔧</span>
              Bench Practice
            </h2>
          </div>
          
          {/* Practice Content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {isPracticing && (
            <>
              <h2 className="text-sm sm:text-lg font-bold mb-1 text-center text-amber-800">
                📚 Virtual Practice: {arScene?.lesson || 'HVAC Fundamentals'}
              </h2>
              <p className="text-center text-xs text-gray-600 mb-1">
                AR-guided demonstration mode
              </p>
            </>
          )}
          
          {/* Practice Video/Camera Area */}
          <div className="bg-amber-50 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
            {isGeneratingAR ? (
              // Generating AR scene
              <div className="text-amber-900 text-center">
                <div className="text-6xl mb-4 animate-pulse">🧠</div>
                <p className="text-lg font-bold">AI generating practice scene...</p>
                <p className="text-sm opacity-75 mt-2">Creating virtual workbench</p>
              </div>
            ) : isPracticing && arScene ? (
              // Virtual practice mode - show AR scene
              <ARShopScene 
                scene={arScene}
                onComplete={() => {
                  alert('Practice complete! Great work.');
                  cleanupPractice();
                }}
                guideOpen={guideOpen}
                setGuideOpen={setGuideOpen}
                onStopTrackingRef={stopTrackingRef}
              />
            ) : (
              // Not practicing - show placeholder
              <div className="text-amber-900 text-center">
                <div className="text-4xl mb-2">�</div>
                <p className="text-sm font-bold">AI-Guided Bench Practice</p>
                <p className="text-xs opacity-75">Select a lesson and press start</p>
              </div>
            )}
            
            {/* Practice Indicator */}
            {isPracticing && (
              <div className="absolute top-4 left-4 bg-amber-700 text-white text-sm px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                Practicing
              </div>
            )}
            
            {/* Timer/Progress */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
              ⏱️ {isPracticing ? '5:23' : 'Not started'}
            </div>
          </div>

          {/* Simple Controls */}
          <div className="flex flex-col gap-2 mt-1 mb-1 px-2">
            {!isPracticing ? (
              <>
                <button 
                  onClick={() => setShowDeviceSelection(true)}
                  className="w-full bg-amber-600 text-amber-50 px-6 py-2 text-sm rounded font-bold hover:bg-amber-700 transition-colors border border-amber-900"
                >
                  � Virtual Practice
                </button>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Choose a lesson...</option>
                  {curriculumLessons.length > 0 ? (
                    curriculumLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.weekNumber ? `Week ${lesson.weekNumber}: ` : ''}{lesson.title}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No lessons available - upload curriculum first</option>
                  )}
                </select>
              </>
            ) : (
              <>
                <button 
                  onClick={endPractice}
                  className="w-full bg-amber-800 text-white px-4 py-2 text-sm rounded font-bold hover:bg-amber-900 transition-colors border border-amber-900"
                >
                  ⏹️ End Practice
                </button>
                <select
                  className="w-full px-3 py-2 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  defaultValue=""
                >
                  <option value="" disabled>Lessons Practiced</option>
                  <option value="static-pressure">Static Pressure Measurement Fundamentals</option>
                </select>
              </>
            )}
          </div>

          
          {modeNotice && (
            <div className="mx-2 sm:mx-0 mb-2 rounded-lg border-2 border-maineBlue bg-sand px-3 py-2 text-xs sm:text-sm text-maineBlue text-center font-semibold">
              {modeNotice}
            </div>
          )}

          {/* Mobile Instructions Toggle - Only show on mobile */}
          <button 
            onClick={() => setInstructionsOpen(!instructionsOpen)}
            className="lg:hidden w-full bg-amber-100 text-amber-800 px-4 py-2 text-sm font-bold border-t-2 border-amber-300 hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">📋</span>
            <span>{instructionsOpen ? 'Hide Instructions' : 'Show Instructions'}</span>
            <span className="text-xs">{instructionsOpen ? '▼' : '▲'}</span>
          </button>
          
          {/* Mobile Instructions Panel - Appears below toggle button */}
          {instructionsOpen && (
            <div className="lg:hidden border-t-4 border-amber-300 bg-white max-h-[40vh] overflow-y-auto">
              {/* Instructions Header */}
              <div className="p-3 bg-amber-100 text-amber-800 font-retro text-center border-b-2 border-amber-300">
                <h3 className="text-base font-bold">
                  📋 Practice Instructions
                </h3>
              </div>
              
              {/* Instructions Content */}
              <div className="p-3">
                {/* Lesson Selection Dropdown */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Select a lesson to practice:
                  </label>
                  <select
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Choose a lesson...</option>
                    {curriculumLessons.length > 0 ? (
                      curriculumLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.weekNumber ? `Week ${lesson.weekNumber}: ` : ''}{lesson.title}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No lessons available - upload curriculum first</option>
                    )}
                  </select>
                </div>
                
                {/* Guide Toggle Button */}
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full mb-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg shadow border-2 border-amber-600 px-3 py-1.5 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-base">📋</span>
                  <span className="text-xs font-bold">{guideOpen ? 'Close Guide' : 'Open Guide'}</span>
                </button>
                
                {/* Technique Feedback - below Open Guide */}
                <div className="mb-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-base">🤖</span>
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-blue-900 mb-0.5">Technique Feedback</div>
                        <p className="text-xs text-blue-800">
                          {isPracticing 
                            ? 'Good form! Maintain consistent probe contact...'
                            : 'Start practicing to receive real-time AI guidance'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Practice Steps */}
                <div className="space-y-2">
                  <div className="p-2 border-l-4 border-amber-700 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">Setup</div>
                    <p className="text-xs text-gray-700">Stage your tools and gather required HVAC materials</p>
                  </div>
                  
                  <div className="p-2 border-l-4 border-amber-600 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">Tool Control</div>
                    <p className="text-xs text-gray-700">Use steady instrument handling and maintain consistent probe contact</p>
                  </div>
                  
                  <div className="p-2 border-l-4 border-amber-500 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">Measurements</div>
                    <p className="text-xs text-gray-700">Capture and log pressure readings across each test point</p>
                  </div>

                  <div className="p-2 border-l-4 border-amber-400 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">Validation</div>
                    <p className="text-xs text-gray-600">AI will validate your readings for consistency and tolerance</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          </div>
        </div>
        
        {/* Right Side - Instructions/Feedback - Desktop Only */}
        <div className="hidden md:flex md:w-72 lg:w-80 border-l-4 border-gray-200 flex-col overflow-y-auto">
          {/* Colored Header for Right Side */}
          <div className="p-4 bg-amber-100 text-amber-800 font-retro text-center">
            <h3 className="text-lg font-bold">
              📋 Practice Instructions
            </h3>
          </div>
          
          {/* Instructions Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          
          {/* Guide Toggle Button - always visible */}
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full mb-4 bg-amber-800 hover:bg-amber-700 text-white rounded-lg shadow border-2 border-amber-600 px-4 py-2 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">📋</span>
            <span className="text-sm font-bold">{guideOpen ? 'Close Guide' : 'Open Guide'}</span>
          </button>

          {/* Technique Feedback - below Open Guide */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-blue-900 mb-1">Technique Feedback</div>
                  <p className="text-xs text-blue-800">
                    {isPracticing 
                      ? 'Good form! Maintain consistent probe contact...'
                      : 'Start practicing to receive real-time AI guidance'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Placeholder instructions */}
            <div className="p-3 border-l-4 border-amber-700 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Setup</div>
              <p className="text-xs text-gray-700">Stage your tools and gather required HVAC materials</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-600 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Tool Control</div>
              <p className="text-xs text-gray-700">Use steady instrument handling and maintain consistent probe contact</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Measurements</div>
              <p className="text-xs text-gray-700">Capture and log pressure readings across each test point</p>
            </div>

            <div className="p-3 border-l-4 border-amber-400 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Validation</div>
              <p className="text-xs text-gray-600">AI will validate your readings for consistency and tolerance</p>
            </div>
          </div>
          
          </div>
        </div>
      </div>
    </div>

    {/* Practice Guide Modal */}
    {guideOpen && (
      <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-lg border-4 border-amber-600 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Sticky Header */}
          <div className="bg-white p-6 pb-4 border-b-2 border-amber-300 rounded-t-lg flex justify-between items-center">
            <div className="flex-1"></div>
            <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
              <span>📖</span>
              <span>Practice Guide</span>
            </h3>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setGuideOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto p-6 pt-4 flex-1">
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>�</span>
                  <span>Instrument Technique</span>
                </p>
                <p className="text-sm text-gray-800">Proper gauge connection, consistent probe placement, and accurate pressure readings.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>📏</span>
                  <span>Measurement Consistency</span>
                </p>
                <p className="text-sm text-gray-800">Take multiple readings and verify against manufacturer specs for accuracy.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚡</span>
                  <span>Safety First</span>
                </p>
                <p className="text-sm text-gray-800">Always verify lockout/tagout, check for live voltage, and wear appropriate PPE.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Focus Points</span>
                </p>
                <p className="text-sm text-gray-800">Superheat/subcooling targets, static pressure limits, and temperature differential specs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    <DeviceSelectionModal
      open={showDeviceSelection}
      onClose={() => setShowDeviceSelection(false)}
      onSelectAR={() => {
        setShowDeviceSelection(false);
        startVirtualPractice('ar');
      }}
      onSelectVR={() => {
        setShowDeviceSelection(false);
        startVirtualPractice('vr');
      }}
    />

    </>
  );
};

export default BenchPracticeModal;

