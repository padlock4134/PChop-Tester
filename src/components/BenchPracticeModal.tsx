import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ARPracticeScene from './ARPracticeScene';
import { supabase } from '../api/supabaseClient';
import { useSupabase } from './SupabaseProvider';
import { defaultARScenes } from '../data/defaultARScenes';

interface BenchPracticeModalProps {
  open: boolean;
  onClose: () => void;
}

const BenchPracticeModal: React.FC<BenchPracticeModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { user } = useSupabase();
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'real' | 'virtual' | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [isGeneratingAR, setIsGeneratingAR] = useState(false);
  const [arScene, setArScene] = useState<any>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopTrackingRef = useRef<(() => void) | null>(null);

  // Set video source when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!open) return null;

  const startRealPractice = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: true 
      });
      setStream(mediaStream);

      // Start recording
      const recorder = new MediaRecorder(mediaStream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      
      setPracticeMode('real');
      setIsPracticing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(t('culinarySchool.charcuterieBoard.couldNotAccessCamera'));
    }
  };

  const startVirtualPractice = async () => {
    setPracticeMode('virtual');

    try {
      // For demo: Use pre-built whetstone AR scene (instant load)
      const demoLesson = 'Traditional Whetstone Knife Sharpening';
      
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
          lessonContent: 'Traditional Japanese water stone sharpening technique. Includes stone preparation, proper angle maintenance (20 degrees), stroke technique, and burr detection. Old-school method using only water and stone.',
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
      alert(t('culinarySchool.charcuterieBoard.couldNotGenerateAR'));
      setPracticeMode(null);
    } finally {
      setIsGeneratingAR(false);
    }
  };

  const endPractice = () => {
    // Stop pose tracking camera (for virtual practice)
    if (stopTrackingRef.current) {
      stopTrackingRef.current();
    }
    // Stop camera immediately (for real practice)
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    // Reset all states
    setStream(null);
    setIsPracticing(false);
    setPracticeMode(null);
    setMediaRecorder(null);
    setRecordedBlob(null);
  };

  const cleanupPractice = () => {
    // Stop pose tracking camera (for virtual practice)
    if (stopTrackingRef.current) {
      stopTrackingRef.current();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsPracticing(false);
    setPracticeMode(null);
    setMediaRecorder(null);
    setRecordedBlob(null);
  };

  const handleSaveVideo = async () => {
    console.log('Save video called. Blob:', recordedBlob);
    if (!recordedBlob) {
      alert(t('culinarySchool.charcuterieBoard.noRecordingFound'));
      setSaveModalOpen(false);
      cleanupPractice();
      return;
    }
    
    if (recordedBlob.size === 0) {
      alert(t('culinarySchool.charcuterieBoard.recordingEmpty'));
      setSaveModalOpen(false);
      cleanupPractice();
      return;
    }

    if (!videoTitle.trim()) {
      alert(t('culinarySchool.charcuterieBoard.pleaseEnterTitle'));
      return;
    }

    setIsSaving(true);
    
    try {
      // Generate unique filename with user folder
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${user?.id}/${videoTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.webm`;
      
      console.log('Attempting to upload:', filename, 'Size:', recordedBlob.size);
      
      // Upload to Supabase Storage - Practice Videos bucket
      const { data, error } = await supabase.storage
        .from('Practice Videos')
        .upload(filename, recordedBlob, {
          contentType: 'video/webm',
          upsert: false,
          metadata: {
            title: videoTitle,
            description: videoDescription,
            lesson: arScene?.lesson || 'Practice Session',
            userId: user?.id || ''
          }
        });

      if (error) {
        console.error('Upload error details:', error);
        alert(`Failed to save video: ${error.message || 'Unknown error'}. Please try again.`);
        setIsSaving(false);
        return;
      }

      console.log('Video saved successfully:', data);
      alert(t('culinarySchool.charcuterieBoard.videoSavedSuccess').replace('{title}', videoTitle));
      
      // Clear form data
      setVideoTitle('');
      setVideoDescription('');
      
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video. Please try again.');
    } finally {
      setIsSaving(false);
      setSaveModalOpen(false);
      cleanupPractice();
    }
  };

  const handleDontSave = () => {
    setSaveModalOpen(false);
    cleanupPractice();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg border-4 border-black overflow-hidden w-full h-full sm:w-3/4 sm:h-auto sm:max-h-[80vh] lg:w-2/3 lg:max-h-[80vh] relative flex flex-col lg:flex-row">
        <button
          onClick={() => {
            // Stop camera tracking before closing
            if (stopTrackingRef.current) {
              stopTrackingRef.current();
            }
            cleanupPractice();
            onClose();
          }}
          className="absolute top-2 right-2 text-amber-800 hover:text-amber-900 text-2xl z-10"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Left Side - Practice Area with Banner */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Banner Header - Left Side Only */}
          <div className="p-4 bg-amber-100 text-amber-800 font-retro text-center">
            <h2 className="text-xl flex items-center justify-center">
              <span className="text-2xl mr-2">🧀</span>
              {t('culinarySchool.charcuterieBoard.title')}
            </h2>
          </div>
          
          {/* Practice Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {isPracticing && (
            <>
              <h2 className="text-lg font-bold mb-2 text-center text-amber-800">
                {practiceMode === 'real' ? `🎥 ${t('culinarySchool.charcuterieBoard.realPractice')}` : `📚 ${t('culinarySchool.charcuterieBoard.virtualPractice')}`}: {arScene?.lesson || 'Knife Skills'}
              </h2>
              <p className="text-center text-xs text-gray-600 mb-2">
                {practiceMode === 'real' 
                  ? t('culinarySchool.charcuterieBoard.aiGuidedPractice')
                  : t('culinarySchool.charcuterieBoard.arDemonstration')}
              </p>
            </>
          )}
          
          {/* Practice Video/Camera Area */}
          <div className="bg-amber-50 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-4 border-maineBlue">
            {isGeneratingAR ? (
              // Generating AR scene
              <div className="text-amber-900 text-center">
                <div className="text-6xl mb-4 animate-pulse">🧠</div>
                <p className="text-lg font-bold">{t('culinarySchool.charcuterieBoard.aiGeneratingPractice')}</p>
                <p className="text-sm opacity-75 mt-2">{t('culinarySchool.charcuterieBoard.creatingVirtualKitchen')}</p>
              </div>
            ) : isPracticing && practiceMode === 'real' && stream ? (
              // Real practice mode - show camera feed
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : isPracticing && practiceMode === 'virtual' && arScene ? (
              // Virtual practice mode - show AR scene
              <ARPracticeScene 
                scene={arScene}
                onComplete={() => {
                  alert(t('culinarySchool.charcuterieBoard.practiceComplete'));
                  cleanupPractice();
                }}
                guideOpen={guideOpen}
                setGuideOpen={setGuideOpen}
                onStopTrackingRef={stopTrackingRef}
              />
            ) : (
              // Not practicing - show placeholder
              <div className="text-amber-900 text-center">
                <div className="text-4xl mb-2">👨‍🍳</div>
                <p className="text-sm font-bold">{t('culinarySchool.charcuterieBoard.aiGuidedPracticeLabel')}</p>
                <p className="text-xs opacity-75">{t('culinarySchool.charcuterieBoard.selectLessonStart')}</p>
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
          <div className="flex justify-center space-x-2 mt-2 mb-4 lg:mb-12">
            {!isPracticing ? (
              <>
                <button 
                  onClick={startRealPractice}
                  className="bg-amber-700 text-amber-50 px-6 py-2 text-sm rounded font-bold hover:bg-amber-800 transition-colors border border-amber-900"
                >
                  🎥 {t('culinarySchool.charcuterieBoard.realPracticeButton')}
                </button>
                <button 
                  onClick={startVirtualPractice}
                  className="bg-amber-600 text-amber-50 px-6 py-2 text-sm rounded font-bold hover:bg-amber-700 transition-colors border border-amber-900"
                >
                  📚 {t('culinarySchool.charcuterieBoard.virtualPracticeButton')}
                </button>
              </>
            ) : (
              <button 
                onClick={endPractice}
                className="bg-amber-800 text-white px-4 py-1 text-sm rounded-lg hover:bg-amber-900 transition-colors"
              >
                ⏹️ {t('culinarySchool.charcuterieBoard.endPractice')}
              </button>
            )}
          </div>
          
          {/* Mobile Instructions Toggle - Only show on mobile */}
          <button 
            onClick={() => setInstructionsOpen(!instructionsOpen)}
            className="lg:hidden w-full bg-amber-100 text-amber-800 px-4 py-3 text-sm font-bold border-t-4 border-amber-300 hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
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
                  <select
                    value={selectedLesson}
                    onChange={(e) => setSelectedLesson(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">{t('culinarySchool.charcuterieBoard.chooseLesson')}</option>
                    <optgroup label={t('culinarySchool.charcuterieBoard.term1Foundations')}>
                      <option value="lesson-1-1">Kitchen Safety and Sanitation</option>
                      <option value="lesson-1-2">Food Handling and Storage</option>
                      <option value="lesson-1-3">Introduction to Kitchen Equipment</option>
                      <option value="lesson-1-4">Basic Cooking Terminology</option>
                      <option value="lesson-1-5">Weights, Measures, and Conversions</option>
                    </optgroup>
                    <optgroup label={t('culinarySchool.charcuterieBoard.term1KnifeSkills')}>
                      <option value="lesson-2-1">Knife Safety and Maintenance</option>
                      <option value="lesson-2-2">Basic Knife Cuts</option>
                      <option value="lesson-2-3">Vegetable Fabrication</option>
                      <option value="lesson-2-4">Meat and Fish Fabrication</option>
                    </optgroup>
                    <optgroup label={t('culinarySchool.charcuterieBoard.term2Breakfast')}>
                      <option value="lesson-3-1">Egg Cookery</option>
                      <option value="lesson-3-2">Breakfast Preparations</option>
                      <option value="lesson-3-3">Cold Food Preparation</option>
                      <option value="lesson-3-4">Salads and Dressings</option>
                    </optgroup>
                    <optgroup label={t('culinarySchool.charcuterieBoard.term2Baking')}>
                      <option value="lesson-4-1">Basic Dough and Batters</option>
                      <option value="lesson-4-2">Quick Breads and Muffins</option>
                      <option value="lesson-4-3">Yeast Breads</option>
                      <option value="lesson-4-4">Basic Pastry and Desserts</option>
                    </optgroup>
                  </select>
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
          
          {/* Practice Notice */}
          <div className="hidden lg:block text-center text-xs text-gray-600 mt-4">
            📹 {t('culinarySchool.charcuterieBoard.practiceSessionsSaved')}
          </div>
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
          
          {/* Lesson Selection Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-amber-800 mb-2">
              Select Lesson to Practice:
            </label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full px-3 py-2 border-2 border-amber-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Choose a lesson...</option>
              <optgroup label="Term 1: Culinary Foundations">
                <option value="lesson-1-1">Kitchen Safety and Sanitation</option>
                <option value="lesson-1-2">Food Handling and Storage</option>
                <option value="lesson-1-3">Introduction to Kitchen Equipment</option>
                <option value="lesson-1-4">Basic Cooking Terminology</option>
                <option value="lesson-1-5">Weights, Measures, and Conversions</option>
              </optgroup>
              <optgroup label="Term 1: Knife Skills">
                <option value="lesson-2-1">Knife Safety and Maintenance</option>
                <option value="lesson-2-2">Basic Knife Cuts</option>
                <option value="lesson-2-3">Vegetable Fabrication</option>
                <option value="lesson-2-4">Meat and Fish Fabrication</option>
              </optgroup>
              <optgroup label="Term 2: Breakfast & Garde Manger">
                <option value="lesson-3-1">Egg Cookery</option>
                <option value="lesson-3-2">Breakfast Preparations</option>
                <option value="lesson-3-3">Cold Food Preparation</option>
                <option value="lesson-3-4">Salads and Dressings</option>
              </optgroup>
              <optgroup label="Term 2: Baking & Pastry">
                <option value="lesson-4-1">Basic Dough and Batters</option>
                <option value="lesson-4-2">Quick Breads and Muffins</option>
                <option value="lesson-4-3">Yeast Breads</option>
                <option value="lesson-4-4">Basic Pastry and Desserts</option>
              </optgroup>
            </select>
          </div>
          
          {/* Guide Toggle Button - always visible */}
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full mb-4 bg-amber-800 hover:bg-amber-700 text-white rounded-lg shadow border-2 border-amber-600 px-4 py-2 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">📋</span>
            <span className="text-sm font-bold">{guideOpen ? 'Close Guide' : 'Open Guide'}</span>
          </button>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Placeholder instructions */}
            <div className="p-3 border-l-4 border-amber-700 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Step 1: Setup</div>
              <p className="text-xs text-gray-700">Position your cutting board and gather ingredients</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-600 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Step 2: Knife Grip</div>
              <p className="text-xs text-gray-700">Hold knife with proper pinch grip technique</p>
            </div>
            
            <div className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded">
              <div className="font-semibold text-sm text-amber-900 mb-1">Step 3: First Cuts</div>
              <p className="text-xs text-gray-700">Make 1-2mm slices perpendicular to board</p>
            </div>

            <div className="p-3 border-l-4 border-gray-300 bg-gray-50 rounded opacity-50">
              <div className="font-semibold text-sm text-gray-600 mb-1">Step 4: Validation</div>
              <p className="text-xs text-gray-600">AI will check your cuts for accuracy</p>
            </div>
          </div>
          
          {/* AI Feedback Area */}
          <div className="pt-3 border-t border-gray-200 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <div className="font-semibold text-xs text-blue-900 mb-1">AI Feedback</div>
                  <p className="text-xs text-blue-800">
                    {isPracticing 
                      ? "Great start! Keep your knife angle consistent..."
                      : "Start practicing to receive real-time AI guidance"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    {/* Practice Guide Modal */}
    {guideOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-lg border-4 border-amber-600 p-6 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
              <span>📖</span>
              <span>{t('culinarySchool.charcuterieBoard.practiceGuide')}</span>
            </h3>
            <button
              onClick={() => setGuideOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span>🔪</span>
                <span>{t('culinarySchool.charcuterieBoard.knifeTechnique')}</span>
              </p>
              <p className="text-sm text-gray-800">{t('culinarySchool.charcuterieBoard.knifeTechniqueDesc')}</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span>📏</span>
                <span>{t('culinarySchool.charcuterieBoard.consistency')}</span>
              </p>
              <p className="text-sm text-gray-800">{t('culinarySchool.charcuterieBoard.consistencyDesc')}</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span>⚡</span>
                <span>{t('culinarySchool.charcuterieBoard.safetyFirst')}</span>
              </p>
              <p className="text-sm text-gray-800">{t('culinarySchool.charcuterieBoard.safetyFirstDesc')}</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <p className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span>🎯</span>
                <span>{t('culinarySchool.charcuterieBoard.focusPoints')}</span>
              </p>
              <p className="text-sm text-gray-800">{t('culinarySchool.charcuterieBoard.focusPointsDesc')}</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setGuideOpen(false)}
              className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900 transition-colors font-bold"
            >
              {t('culinarySchool.charcuterieBoard.closeGuide')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Save Video Modal */}
    {saveModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg border-4 border-amber-900 p-6 max-w-lg w-full mx-4 relative max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">🎥</div>
            <h2 className="text-2xl font-bold mb-4 text-amber-800 font-retro">
              {t('culinarySchool.charcuterieBoard.saveYourPracticeSession')}
            </h2>
            
            <p className="text-gray-700 mb-6 leading-relaxed">
              {t('culinarySchool.charcuterieBoard.addDetailsToSave').replace('{collection}', `<span class="font-semibold text-amber-800">${t('culinarySchool.charcuterieBoard.practiceVideos')}</span>`)}
            </p>
            
            {/* Video Metadata Form */}
            <div className="space-y-4 mb-6 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('culinarySchool.charcuterieBoard.videoTitleRequired')}
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g., Brunoise Practice Session"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={isSaving}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('culinarySchool.charcuterieBoard.notes')}
                </label>
                <textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder={t('culinarySchool.charcuterieBoard.notesPlaceholder')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleDontSave}
                disabled={isSaving}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-600 transition-colors border-2 border-gray-600 disabled:opacity-50"
              >
                🚫 {t('culinarySchool.charcuterieBoard.noDoNotSave')}
              </button>
              <button
                onClick={handleSaveVideo}
                disabled={isSaving || !videoTitle.trim()}
                className="flex-1 bg-amber-700 text-amber-50 py-3 px-4 rounded-lg font-bold hover:bg-amber-800 transition-colors border-2 border-amber-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('culinarySchool.charcuterieBoard.saving')}
                  </>
                ) : (
                  `💾 ${t('culinarySchool.charcuterieBoard.saveVideo')}`
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              💡 {t('culinarySchool.charcuterieBoard.requiredField')}
            </p>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default BenchPracticeModal;
