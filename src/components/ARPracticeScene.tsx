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
      {/* Visual Practice Demo - No camera required */}
      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {/* Visual Workspace */}
          <div className="bg-amber-100 rounded-lg p-8 shadow-2xl border-4 border-amber-800 mb-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-amber-900 mb-2">
                🪨 Virtual Workspace
              </h3>
              <p className="text-sm text-amber-700">
                {scene.setup.workspace}
              </p>
            </div>

            {/* Tools Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentStepData.tools.map((tool, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border-2 border-amber-600 shadow-lg">
                  <div className="text-4xl mb-2 text-center">
                    {tool.includes('knife') || tool.includes('Knife') ? '🔪' : 
                     tool.includes('stone') || tool.includes('Stone') ? '🪨' : 
                     tool.includes('water') || tool.includes('Water') ? '💧' : 
                     tool.includes('towel') || tool.includes('Towel') ? '🧻' : '🔧'}
                  </div>
                  <p className="text-center text-sm font-bold text-gray-800">{tool}</p>
                </div>
              ))}
            </div>

            {/* AR Overlays as Visual Guides */}
            <div className="space-y-3">
              {currentStepData.overlays.map((overlay, idx) => (
                <div 
                  key={idx} 
                  className="bg-blue-50 border-l-4 p-3 rounded"
                  style={{ borderColor: overlay.color || '#3B82F6' }}
                >
                  <p className="text-sm font-bold" style={{ color: overlay.color || '#3B82F6' }}>
                    {overlay.type === 'line' && `📐 ${overlay.label || `${overlay.angle}° angle guide`}`}
                    {overlay.type === 'text' && `💡 ${overlay.label}`}
                    {overlay.type === 'arrow' && `➡️ ${overlay.label}`}
                  </p>
                </div>
              ))}
            </div>

            {/* Key Points */}
            {currentStepData.keyPoints && currentStepData.keyPoints.length > 0 && (
              <div className="mt-6 bg-green-50 rounded-lg p-4 border-2 border-green-600">
                <h4 className="font-bold text-green-900 mb-2">✓ Key Points:</h4>
                <ul className="space-y-1">
                  {currentStepData.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-green-800">• {point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
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
