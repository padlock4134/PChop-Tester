import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ARFloorScene from './ARFloorScene';
import { defaultARScenes } from '../data/defaultARScenes';
import { canUseImmersiveVR } from '../../../utils/xrSupport';
import DeviceSelectionModal from '../../../components/DeviceSelectionModal';
import PracticeLessonSelect, { getPracticeLessonTitle, PracticeLessonCourse, PracticeLessonHistorySelect } from '../../../components/PracticeLessonSelect';

interface BenchPracticeModalProps {
  open: boolean;
  onClose: () => void;
  courses?: PracticeLessonCourse[];
}

const BenchPracticeModal: React.FC<BenchPracticeModalProps> = ({ open, onClose, courses = [] }) => {
  const { t } = useTranslation();
  const [isPracticing, setIsPracticing] = useState(false);
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [isGeneratingAR, setIsGeneratingAR] = useState(false);
  const [arScene, setArScene] = useState<any>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const stopTrackingRef = useRef<(() => void) | null>(null);

  if (!open) return null;

  const startVirtualPractice = async (selectedMode: 'ar' | 'vr' = 'ar') => {
    setModeNotice(null);
    const lessonTitle = getPracticeLessonTitle(courses, selectedLesson);
    if (!lessonTitle) {
      alert('Please select a lesson first.');
      return;
    }

    if (selectedMode === 'vr') {
      const vrSupported = await canUseImmersiveVR();
      if (!vrSupported) {
        setModeNotice('No VR headset detected. Starting AR practice instead.');
      }
    }


    try {
      if (defaultARScenes[lessonTitle]) {
        setArScene(defaultARScenes[lessonTitle]);
        setIsPracticing(true);
        return;
      }

      // Fallback: AI generation if no default exists
      setIsGeneratingAR(true);
      
      const response = await fetch('/.netlify/functions/generate-ar-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline: 'manufacturing',
          lessonTitle,
          lessonContent: 'Micro-electronics conveyor belt packaging technique. Includes ESD station setup, tweezers grip, component pick-and-place at 20-degree approach angle, alignment inspection, and final QC check.',
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
      alert('Could not generate AR practice session');
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
          className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center text-amber-800 hover:text-amber-900 text-2xl z-10"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Left Side - Practice Area with Banner */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Banner Header - Left Side Only */}
          <div className="p-2 sm:p-4 bg-amber-100 text-amber-800 font-retro text-center">
            <h2 className="text-base sm:text-xl flex items-center justify-center">
              <span className="text-lg sm:text-2xl mr-1 sm:mr-2">🏭</span>
              The Factory Floor
            </h2>
          </div>
          
          {/* Practice Content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {isPracticing && (
            <>
              <h2 className="text-sm sm:text-lg font-bold mb-1 text-center text-amber-800">
                📚 Virtual Practice: {arScene?.lesson || 'Assembly Skills'}
              </h2>
              <p className="text-center text-xs text-gray-600 mb-1">
                AR Demonstration
              </p>
            </>
          )}
          
          {/* Practice Video/Camera Area */}
          <div className="bg-amber-50 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
            {isGeneratingAR ? (
              // Generating AR scene
              <div className="text-amber-900 text-center">
                <div className="text-6xl mb-4 animate-pulse">🧠</div>
                <p className="text-lg font-bold">AI Generating Practice</p>
                <p className="text-sm opacity-75 mt-2">Creating Virtual Production Line</p>
              </div>
            ) : isPracticing && arScene ? (
              // Virtual practice mode - show AR scene
              <ARFloorScene 
                scene={arScene}
                onComplete={() => {
                  alert('Practice Complete!');
                  cleanupPractice();
                }}
                guideOpen={guideOpen}
                setGuideOpen={setGuideOpen}
                onStopTrackingRef={stopTrackingRef}
              />
            ) : (
              // Not practicing - show placeholder
              <div className="text-amber-900 text-center">
                <div className="text-4xl mb-2">👷‍♂️</div>
                <p className="text-sm font-bold">AI Guided Practice</p>
                <p className="text-xs opacity-75">Select a process to begin practice</p>
              </div>
            )}
            
            {/* Practice Indicator */}
            {isPracticing && (
              <div className="absolute top-4 left-4 bg-amber-700 text-white text-sm px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                {t('culinarySchool.charcuterieBoard.practicing')}
              </div>
            )}
            
            {/* Timer/Progress */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
              ⏱️ {isPracticing ? '5:23' : t('culinarySchool.charcuterieBoard.notStarted')}
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
                  📚 {t('culinarySchool.charcuterieBoard.virtualPracticeButton')}
                </button>
                <PracticeLessonSelect
                  value={selectedLesson}
                  onChange={setSelectedLesson}
                  courses={courses}
                  className="w-full px-3 py-2 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </>
            ) : (
              <>
                <button 
                  onClick={endPractice}
                  className="w-full bg-amber-800 text-white px-4 py-2 text-sm rounded font-bold hover:bg-amber-900 transition-colors border border-amber-900"
                >
                  ⏹️ {t('culinarySchool.charcuterieBoard.endPractice')}
                </button>
                <PracticeLessonHistorySelect
                  selectedLessonId={selectedLesson}
                  courses={courses}
                  className="w-full px-3 py-2 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
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
            <span>{instructionsOpen ? t('culinarySchool.charcuterieBoard.hideInstructions') : t('culinarySchool.charcuterieBoard.showInstructions')}</span>
            <span className="text-xs">{instructionsOpen ? '▼' : '▲'}</span>
          </button>
          
          {/* Mobile Instructions Panel - Appears below toggle button */}
          {instructionsOpen && (
            <div className="lg:hidden border-t-4 border-amber-300 bg-white max-h-[40vh] overflow-y-auto">
              {/* Instructions Header */}
              <div className="p-3 bg-amber-100 text-amber-800 font-retro text-center border-b-2 border-amber-300">
                <h3 className="text-base font-bold">
                  📋 {t('culinarySchool.charcuterieBoard.practiceInstructions')}
                </h3>
              </div>
              
              {/* Instructions Content */}
              <div className="p-3">
                {/* Lesson Selection Dropdown */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    {t('culinarySchool.charcuterieBoard.selectLessonToPractice')}
                  </label>
                  <PracticeLessonSelect
                  value={selectedLesson}
                  onChange={setSelectedLesson}
                  courses={courses}
                  className="w-full px-2 py-1.5 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                </div>
                
                {/* Guide Toggle Button */}
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full mb-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg shadow border-2 border-amber-600 px-3 py-1.5 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-base">📋</span>
                  <span className="text-xs font-bold">{guideOpen ? t('culinarySchool.charcuterieBoard.closeGuide') : t('culinarySchool.charcuterieBoard.openGuide')}</span>
                </button>
                
                
                {/* Practice Steps */}
                <div className="space-y-2">
                  <div className="p-2 border-l-4 border-amber-700 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">{t('culinarySchool.charcuterieBoard.step1Setup')}</div>
                    <p className="text-xs text-gray-700">{t('culinarySchool.charcuterieBoard.step1Desc')}</p>
                  </div>
                  
                  <div className="p-2 border-l-4 border-amber-600 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">{t('culinarySchool.charcuterieBoard.step2KnifeGrip')}</div>
                    <p className="text-xs text-gray-700">{t('culinarySchool.charcuterieBoard.step2Desc')}</p>
                  </div>
                  
                  <div className="p-2 border-l-4 border-amber-500 bg-amber-50 rounded">
                    <div className="font-semibold text-xs text-amber-900 mb-0.5">{t('culinarySchool.charcuterieBoard.step3FirstCuts')}</div>
                    <p className="text-xs text-gray-700">{t('culinarySchool.charcuterieBoard.step3Desc')}</p>
                  </div>

                  <div className="p-2 border-l-4 border-gray-300 bg-gray-50 rounded opacity-50">
                    <div className="font-semibold text-xs text-gray-600 mb-0.5">{t('culinarySchool.charcuterieBoard.step4Validation')}</div>
                    <p className="text-xs text-gray-600">{t('culinarySchool.charcuterieBoard.step4Desc')}</p>
                  </div>
                </div>
                
                {/* AI Feedback */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-base">🤖</span>
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-blue-900 mb-0.5">{t('culinarySchool.charcuterieBoard.aiFeedback')}</div>
                        <p className="text-xs text-blue-800">
                          {isPracticing 
                            ? t('culinarySchool.charcuterieBoard.aiFeedbackActive')
                            : t('culinarySchool.charcuterieBoard.aiFeedbackInactive')}
                        </p>
                      </div>
                    </div>
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
          
          {/* Technique Feedback - underneath Open Guide */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-blue-900 mb-1">Technique Feedback</div>
                  <p className="text-xs text-blue-800">
                    {isPracticing 
                      ? "Great start! Keep your component alignment steady..."
                      : "Start practicing to receive real-time AI guidance"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Placeholder instructions */}
            <div className="p-3 border-l-4 border-amber-700 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">ESD Station Setup</div>
              <p className="text-xs text-gray-700">Position workbench, verify grounding, prepare component tray</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-600 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Lever Control</div>
              <p className="text-xs text-gray-700">Grip control lever with proper hand position</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Component Placement</div>
              <p className="text-xs text-gray-700">Guide crane to pick component and place in packaging</p>
            </div>

            <div className="p-3 border-l-4 border-amber-400 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Validation</div>
              <p className="text-xs text-gray-600">AI will verify component placement accuracy</p>
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
              <span>{t('culinarySchool.charcuterieBoard.practiceGuide')}</span>
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
                  <span>🏭</span>
                  <span>Crane Control Technique</span>
                </p>
                <p className="text-sm text-gray-800">Use smooth, controlled lever movements. Pull to extend crane arm, push to retract. Maintain steady hand position for precise component placement.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>📏</span>
                  <span>Placement Precision</span>
                </p>
                <p className="text-sm text-gray-800">Align components within tolerance zones. Verify orientation before release. Consistent placement ensures quality and reduces rework.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚡</span>
                  <span>ESD Safety First</span>
                </p>
                <p className="text-sm text-gray-800">Always wear grounding strap. Handle components by edges only. Keep work area clean and free of static-generating materials.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Quality Focus Points</span>
                </p>
                <p className="text-sm text-gray-800">Monitor component orientation, verify secure placement, check for damage, maintain consistent cycle time, follow standard work procedures.</p>
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
