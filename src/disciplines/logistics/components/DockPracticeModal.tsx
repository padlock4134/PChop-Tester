import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ARDockScene from './ARDockScene';
import { defaultARScenes } from '../data/defaultARScenes';
import { canUseImmersiveVR } from '../../../utils/xrSupport';
import DeviceSelectionModal from '../../../components/DeviceSelectionModal';

interface DockPracticeModalProps {
  open: boolean;
  onClose: () => void;
}

const DockPracticeModal: React.FC<DockPracticeModalProps> = ({ open, onClose }) => {
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
    if (selectedMode === 'vr') {
      const vrSupported = await canUseImmersiveVR();
      if (!vrSupported) {
        setModeNotice('No VR headset detected. Starting AR practice instead.');
      }
    }


    try {
      // For demo: Use pre-built dock AR scene (instant load)
      const demoLesson = 'Dock Loading & Freight Staging';
      
      // Check if we have a default scene
      if (defaultARScenes[demoLesson]) {
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
          lessonTitle: demoLesson,
          lessonContent: 'Dock loading and freight staging fundamentals. Includes load planning, pallet stacking, weight distribution, trailer loading sequence, and dock door assignment. Standard operating procedures for inbound and outbound freight.',
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
      alert(t('logisticsSchool.dockPractice.couldNotGenerateAR'));
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
    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg shadow-lg border-0 sm:border-4 border-black overflow-hidden w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] relative flex flex-col lg:flex-row">
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
              <span className="text-lg sm:text-2xl mr-1 sm:mr-2">�</span>
              The Flatbed
            </h2>
          </div>
          
          {/* Practice Content */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {isPracticing && (
            <>
              <h2 className="text-sm sm:text-lg font-bold mb-1 text-center text-amber-800">
                📚 {t('logisticsSchool.dockPractice.virtualPractice')}: {arScene?.lesson || 'Dock Operations'}
              </h2>
              <p className="text-center text-xs text-gray-600 mb-1">
                {t('logisticsSchool.dockPractice.arDemonstration')}
              </p>
            </>
          )}
          
          {/* Practice Video/Camera Area */}
          <div className="bg-amber-50 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
            {isGeneratingAR ? (
              // Generating AR scene
              <div className="text-amber-900 text-center">
                <div className="text-6xl mb-4 animate-pulse">🧠</div>
                <p className="text-lg font-bold">{t('logisticsSchool.dockPractice.aiGeneratingPractice')}</p>
                <p className="text-sm opacity-75 mt-2">{t('logisticsSchool.dockPractice.creatingVirtualDock')}</p>
              </div>
            ) : isPracticing && arScene ? (
              // Virtual practice mode - show AR scene
              <ARDockScene 
                scene={arScene}
                onComplete={() => {
                  alert(t('logisticsSchool.dockPractice.practiceComplete'));
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
                <p className="text-sm font-bold">{t('logisticsSchool.dockPractice.aiGuidedPracticeLabel')}</p>
                <p className="text-xs opacity-75">{t('logisticsSchool.dockPractice.selectLessonStart')}</p>
              </div>
            )}
            
            {/* Practice Indicator */}
            {isPracticing && (
              <div className="absolute top-4 left-4 bg-amber-700 text-white text-sm px-3 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                {t('logisticsSchool.dockPractice.practicing')}
              </div>
            )}
            
            {/* Timer/Progress */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
              ⏱️ {isPracticing ? '5:23' : t('logisticsSchool.dockPractice.notStarted')}
            </div>
          </div>

          {/* Simple Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-1 mb-1 px-2 sm:px-0">
            {!isPracticing ? (
              <>
                <button 
                  onClick={() => setShowDeviceSelection(true)}
                  className="w-full sm:w-auto bg-amber-600 text-amber-50 px-6 py-2 text-sm rounded font-bold hover:bg-amber-700 transition-colors border border-amber-900"
                >
                  📚 {t('logisticsSchool.dockPractice.virtualPracticeButton')}
                </button>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">{t('logisticsSchool.dockPractice.chooseLesson')}</option>
                  <optgroup label={t('logisticsSchool.dockPractice.term1Foundations')}>
                    <option value="lesson-1-1">Dock Safety and Sanitation</option>
                    <option value="lesson-1-2">Freight Handling and Storage</option>
                    <option value="lesson-1-3">Introduction to Dock Equipment</option>
                    <option value="lesson-1-4">Basic Freight Terminology</option>
                    <option value="lesson-1-5">Weights, Dimensions, and Freight Class</option>
                  </optgroup>
                  <optgroup label={t('logisticsSchool.dockPractice.term1FreightDocs')}>
                    <option value="lesson-2-1">BOL Preparation and Review</option>
                    <option value="lesson-2-2">Freight Classification (NMFC)</option>
                    <option value="lesson-2-3">Shipping Labels and Hazmat Marking</option>
                    <option value="lesson-2-4">Customs and Import Documentation</option>
                  </optgroup>
                  <optgroup label={t('logisticsSchool.dockPractice.term2RoutePlanning')}>
                    <option value="lesson-3-1">Route Optimization Basics</option>
                    <option value="lesson-3-2">Multi-Stop Planning</option>
                    <option value="lesson-3-3">Temperature-Controlled Shipping</option>
                    <option value="lesson-3-4">Last-Mile Delivery Strategy</option>
                  </optgroup>
                  <optgroup label={t('logisticsSchool.dockPractice.term2WarehouseOps')}>
                    <option value="lesson-4-1">Receiving and Put-Away</option>
                    <option value="lesson-4-2">Pick, Pack, and Ship</option>
                    <option value="lesson-4-3">Inventory Cycle Counting</option>
                    <option value="lesson-4-4">Cross-Docking Operations</option>
                  </optgroup>
                </select>
              </>
            ) : (
              <>
                <button 
                  onClick={endPractice}
                  className="w-full sm:w-auto bg-amber-800 text-white px-4 py-2 text-sm rounded font-bold hover:bg-amber-900 transition-colors border border-amber-900"
                >
                  ⏹️ {t('logisticsSchool.dockPractice.endPractice')}
                </button>
                <select
                  className="w-full sm:w-auto px-3 py-2 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  defaultValue=""
                >
                  <option value="" disabled>Lessons Practiced</option>
                  <option value="dock-loading">Dock Operations</option>
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
            <span>{instructionsOpen ? t('logisticsSchool.dockPractice.hideInstructions') : t('logisticsSchool.dockPractice.showInstructions')}</span>
            <span className="text-xs">{instructionsOpen ? '▼' : '▲'}</span>
          </button>
          
          {/* Mobile Instructions Panel - Appears below toggle button */}
          {instructionsOpen && (
            <div className="lg:hidden border-t-4 border-amber-300 bg-white max-h-[40vh] overflow-y-auto">
              {/* Instructions Header */}
              <div className="p-3 bg-amber-100 text-amber-800 font-retro text-center border-b-2 border-amber-300">
                <h3 className="text-base font-bold">
                  📋 {t('logisticsSchool.dockPractice.practiceInstructions')}
                </h3>
              </div>
              
              {/* Instructions Content */}
              <div className="p-3">
                {/* Lesson Selection Dropdown */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    {t('logisticsSchool.dockPractice.selectLessonToPractice')}
                  </label>
                  <select
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">{t('logisticsSchool.dockPractice.chooseLesson')}</option>
                    <optgroup label={t('logisticsSchool.dockPractice.term1Foundations')}>
                      <option value="lesson-1-1">Dock Safety and Sanitation</option>
                      <option value="lesson-1-2">Freight Handling and Storage</option>
                      <option value="lesson-1-3">Introduction to Dock Equipment</option>
                      <option value="lesson-1-4">Basic Freight Terminology</option>
                      <option value="lesson-1-5">Weights, Dimensions, and Freight Class</option>
                    </optgroup>
                    <optgroup label={t('logisticsSchool.dockPractice.term1FreightDocs')}>
                      <option value="lesson-2-1">BOL Preparation and Review</option>
                      <option value="lesson-2-2">Freight Classification (NMFC)</option>
                      <option value="lesson-2-3">Shipping Labels and Hazmat Marking</option>
                      <option value="lesson-2-4">Customs and Import Documentation</option>
                    </optgroup>
                    <optgroup label={t('logisticsSchool.dockPractice.term2RoutePlanning')}>
                      <option value="lesson-3-1">Route Optimization Basics</option>
                      <option value="lesson-3-2">Multi-Stop Planning</option>
                      <option value="lesson-3-3">Temperature-Controlled Shipping</option>
                      <option value="lesson-3-4">Last-Mile Delivery Strategy</option>
                    </optgroup>
                    <optgroup label={t('logisticsSchool.dockPractice.term2WarehouseOps')}>
                      <option value="lesson-4-1">Receiving and Put-Away</option>
                      <option value="lesson-4-2">Pick, Pack, and Ship</option>
                      <option value="lesson-4-3">Inventory Cycle Counting</option>
                      <option value="lesson-4-4">Cross-Docking Operations</option>
                    </optgroup>
                  </select>
                </div>
                
                {/* Guide Toggle Button */}
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full mb-3 bg-amber-800 hover:bg-amber-700 text-white rounded-lg shadow border-2 border-amber-600 px-3 py-1.5 text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-base">📋</span>
                  <span className="text-xs font-bold">{guideOpen ? t('logisticsSchool.dockPractice.closeGuide') : t('logisticsSchool.dockPractice.openGuide')}</span>
                </button>

                {/* AI Feedback */}
                <div className="mb-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-base">🤖</span>
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-blue-900 mb-0.5">{t('logisticsSchool.dockPractice.aiFeedback')}</div>
                        <p className="text-xs text-blue-800">
                          {isPracticing 
                            ? t('logisticsSchool.dockPractice.aiFeedbackActive')
                            : t('logisticsSchool.dockPractice.aiFeedbackInactive')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Practice Steps */}
                <div className="space-y-2">
                  <div className="p-2 border-l-4 border-amber-700 bg-amber-50 rounded">
                    <p className="text-xs text-gray-700">{t('logisticsSchool.dockPractice.step1Desc')}</p>
                  </div>
                  
                  <div className="p-2 border-l-4 border-amber-600 bg-amber-50 rounded">
                    <p className="text-xs text-gray-700">{t('logisticsSchool.dockPractice.step2Desc')}</p>
                  </div>
                  
                  <div className="p-2 border-l-4 border-amber-500 bg-amber-50 rounded">
                    <p className="text-xs text-gray-700">{t('logisticsSchool.dockPractice.step3Desc')}</p>
                  </div>

                  <div className="p-2 border-l-4 border-gray-300 bg-gray-50 rounded opacity-50">
                    <p className="text-xs text-gray-600">{t('logisticsSchool.dockPractice.step4Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          </div>
        </div>
        
        {/* Right Side - Instructions/Feedback - Desktop Only */}
        <div className="hidden lg:flex lg:w-80 border-l-4 border-gray-200 flex-col overflow-hidden">
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

          {/* Technique Feedback */}
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-blue-900 mb-1">Technique Feedback</div>
                  <p className="text-xs text-blue-800">
                    {isPracticing 
                      ? "Great start! Keep your load distribution even..."
                      : "Start practicing to receive real-time AI guidance"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="p-3 border-l-4 border-amber-700 bg-amber-50 rounded">
              <p className="text-xs text-gray-700">Review the load plan and inspect dock area</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-600 bg-amber-50 rounded">
              <p className="text-xs text-gray-700">Verify freight is properly secured and labeled</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded">
              <p className="text-xs text-gray-700">Stage pallets and load trailer per the shipping plan</p>
            </div>

            <div className="p-3 border-l-4 border-gray-300 bg-gray-50 rounded opacity-50">
              <p className="text-xs text-gray-600">AI will verify load accuracy and weight distribution</p>
            </div>
          </div>
          
          </div>
        </div>
      </div>
    </div>

    {/* Practice Guide Modal */}
    {guideOpen && (
      <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-lg border-4 border-amber-600 max-w-2xl w-full mx-4 relative max-h-[85vh] lg:max-h-[80vh] flex flex-col overflow-hidden">
          {/* Sticky Header */}
          <div className="bg-white p-6 pb-4 border-b-2 border-amber-300 rounded-t-lg flex justify-between items-center">
            <div className="flex-1"></div>
            <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
              <span>📖</span>
              <span>Flatbed Practice Guide</span>
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
                  <span>Load Planning</span>
                </p>
                <p className="text-sm text-gray-800">Review the shipping manifest, confirm pallet counts, and plan your trailer loading sequence before touching freight.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>📏</span>
                  <span>Weight Distribution</span>
                </p>
                <p className="text-sm text-gray-800">Balance weight evenly across the trailer floor. Heavy pallets low, last-stop freight at the nose, first-stop near the doors.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚡</span>
                  <span>Safety First</span>
                </p>
                <p className="text-sm text-gray-800">Chock wheels before loading, keep forks low on the pallet jack, and never exceed dock plate weight limits.</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
                <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Focus Points</span>
                </p>
                <p className="text-sm text-gray-800">BOL accuracy, seal numbers, pallet condition, and on-time dock door assignment are the metrics that matter.</p>
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

export default DockPracticeModal;

