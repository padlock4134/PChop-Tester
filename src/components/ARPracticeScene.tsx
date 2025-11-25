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
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      setIsDragging(true);
      const rect = tooltipRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && tooltipRef.current) {
      const container = tooltipRef.current.parentElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        
        let newX = e.clientX - containerRect.left - dragOffset.x;
        let newY = e.clientY - containerRect.top - dragOffset.y;
        
        // Keep within bounds
        newX = Math.max(0, Math.min(newX, containerRect.width - tooltipRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - tooltipRect.height));
        
        setTooltipPosition({ x: newX, y: newY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Visual Practice Demo - Fits video box */}
      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-2">
        {/* Visual Workspace - Compact to fit */}
        <div className="w-full h-full bg-amber-100 rounded-lg p-3 shadow-2xl border-4 border-amber-800 overflow-y-auto">
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

      {/* Floating Instruction Tooltip - Draggable */}
      <div 
        ref={tooltipRef}
        onMouseDown={handleMouseDown}
        className="absolute bg-gradient-to-br from-amber-900 to-amber-950 text-white rounded-xl shadow-2xl border-4 border-amber-600 max-w-sm cursor-move select-none"
        style={{ 
          left: tooltipPosition.x ? `${tooltipPosition.x}px` : 'auto',
          top: tooltipPosition.y ? `${tooltipPosition.y}px` : '1rem',
          right: tooltipPosition.x ? 'auto' : '1rem',
          maxHeight: '70vh', 
          overflowY: 'auto' as const,
          zIndex: 10
        }}
      >
        {/* Tooltip Header */}
        <div className="bg-amber-800 px-4 py-3 rounded-t-lg border-b-2 border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-bold text-sm">Step-by-Step Guide</p>
              <p className="text-xs opacity-75">
                Step {currentStep + 1} of {scene.steps.length} • {currentStepData.duration}
              </p>
            </div>
          </div>
          <div className="text-xs opacity-75 cursor-move">⋮⋮</div>
        </div>

        {/* Tooltip Content */}
        <div className="p-4">
          <p className="text-base font-bold mb-3 leading-relaxed">{currentStepData.instruction}</p>

          {currentStepData.keyPoints.length > 0 && (
            <div className="bg-amber-950 bg-opacity-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-amber-300 mb-2">💡 Key Points:</p>
              <div className="text-sm space-y-1">
                {currentStepData.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start">
                    <span className="text-amber-400 mr-2">•</span>
                    <span className="opacity-90">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 bg-amber-700 text-white py-2 px-4 rounded-lg font-bold hover:bg-amber-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            >
              ← Previous
            </button>
            <button
              onClick={nextStep}
              className="flex-1 bg-amber-700 text-white py-2 px-4 rounded-lg font-bold hover:bg-amber-600 transition-colors text-sm"
            >
              {currentStep === scene.steps.length - 1 ? 'Complete ✓' : 'Next →'}
            </button>
          </div>

          {/* Tips Section */}
          {scene.tips && scene.tips.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-700">
              <p className="text-xs font-bold text-amber-300 mb-2">💭 Pro Tips:</p>
              <div className="text-xs opacity-75 space-y-1">
                {scene.tips.slice(0, 2).map((tip, idx) => (
                  <p key={idx}>• {tip}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARPracticeSceneComponent;
