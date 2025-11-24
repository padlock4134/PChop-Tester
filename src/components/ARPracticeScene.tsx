import React, { useEffect, useRef, useState } from 'react';

interface AROverlay {
  type: 'line' | 'circle' | 'grid' | 'text' | 'arrow' | 'hand' | 'tool';
  position?: string;
  angle?: number;
  color?: string;
  label?: string;
  size?: string;
  coordinates?: { x: number; y: number; z: number };
}

interface ARStep {
  id: number;
  instruction: string;
  duration: string;
  overlays: AROverlay[];
  tools: string[];
  ingredients: string[];
  keyPoints: string[];
}

interface ARPracticeScene {
  lesson: string;
  setup: {
    workspace: string;
    requiredTools: string[];
    requiredIngredients: string[];
  };
  steps: ARStep[];
  tips: string[];
}

interface ARPracticeSceneProps {
  scene: ARPracticeScene;
  onComplete: () => void;
}

const ARPracticeSceneComponent: React.FC<ARPracticeSceneProps> = ({ scene, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isARReady, setIsARReady] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize AR scene
    if (sceneRef.current && typeof window !== 'undefined' && (window as any).AFRAME) {
      setIsARReady(true);
    }
  }, []);

  const currentStepData = scene.steps[currentStep];

  const nextStep = () => {
    if (currentStep < scene.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* AR Scene Container */}
      <div ref={sceneRef} className="w-full h-full bg-black">
        {isARReady ? (
          <div dangerouslySetInnerHTML={{
            __html: `
              <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;" vr-mode-ui="enabled: false">
                <a-entity camera></a-entity>
                <a-plane position="0 0 -2" rotation="-90 0 0" width="2" height="2" color="#8B4513" material="opacity: 0.8"></a-plane>
                ${currentStepData.tools.map((tool, idx) => `
                  <a-box position="${-0.5 + idx * 0.3} 0.1 -2" rotation="0 45 0" color="#666666" width="0.2" height="0.05" depth="0.1">
                    <a-text value="${tool}" align="center" position="0 0.1 0" scale="0.3 0.3 0.3" color="#FFFFFF"></a-text>
                  </a-box>
                `).join('')}
                ${currentStepData.overlays.map((overlay, idx) => {
                  if (overlay.type === 'line') {
                    return `<a-entity position="0 0.2 -2">
                      <a-cylinder radius="0.01" height="0.5" color="${overlay.color || '#3B82F6'}" rotation="0 0 ${overlay.angle || 0}"></a-cylinder>
                    </a-entity>`;
                  }
                  if (overlay.type === 'text') {
                    return `<a-text value="${overlay.label || ''}" align="center" position="0 0.5 -2" scale="0.5 0.5 0.5" color="${overlay.color || '#FFFFFF'}"></a-text>`;
                  }
                  return '';
                }).join('')}
                <a-light type="ambient" color="#BBB"></a-light>
                <a-light type="directional" color="#FFF" intensity="0.6" position="-0.5 1 1"></a-light>
              </a-scene>
            `
          }} />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-lg">Initializing AR...</p>
              <p className="text-sm opacity-75 mt-2">Please allow camera access</p>
            </div>
          </div>
        )}
      </div>

      {/* Instruction Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-75">
              Step {currentStep + 1} of {scene.steps.length}
            </span>
            <span className="text-sm opacity-75">{currentStepData.duration}</span>
          </div>

          <p className="text-lg font-bold mb-2">{currentStepData.instruction}</p>

          {currentStepData.keyPoints.length > 0 && (
            <div className="text-sm opacity-90 mb-3">
              {currentStepData.keyPoints.map((point, idx) => (
                <div key={idx} className="flex items-start mb-1">
                  <span className="mr-2">•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={nextStep}
              className="flex-1 bg-amber-700 text-amber-50 py-2 px-4 rounded font-bold hover:bg-amber-800 transition-colors"
            >
              {currentStep === scene.steps.length - 1 ? 'Complete ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARPracticeSceneComponent;
