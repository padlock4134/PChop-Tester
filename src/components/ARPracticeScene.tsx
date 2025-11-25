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
      {/* Real AR Camera View */}
      <div 
        ref={sceneRef}
        className="w-full h-full"
        dangerouslySetInnerHTML={{
          __html: `
            <a-scene 
              embedded 
              arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
              vr-mode-ui="enabled: false"
              style="width: 100%; height: 100%;"
            >
              <!-- Camera -->
              <a-entity camera look-controls="enabled: false"></a-entity>

              <!-- Kitchen Counter (wooden surface) -->
              <a-box 
                position="0 -0.5 -1.5" 
                width="2" 
                height="0.1" 
                depth="1"
                color="#8B4513"
                material="roughness: 0.8"
              ></a-box>

              <!-- Whetstone -->
              <a-box 
                position="0 -0.4 -1.5" 
                width="0.6" 
                height="0.05" 
                depth="0.2"
                color="#696969"
                material="roughness: 0.9"
              >
                <a-text 
                  value="Whetstone" 
                  align="center" 
                  position="0 0.1 0" 
                  scale="0.3 0.3 0.3" 
                  color="#FFFFFF"
                ></a-text>
              </a-box>

              <!-- Chef's Knife -->
              <a-box 
                position="0.4 -0.35 -1.5" 
                width="0.5" 
                height="0.02" 
                depth="0.05"
                color="#C0C0C0"
                rotation="0 0 ${currentStepData.overlays.find(o => o.type === 'line')?.angle || 20}"
              >
                <a-text 
                  value="Knife" 
                  align="center" 
                  position="0 0.08 0" 
                  scale="0.2 0.2 0.2" 
                  color="#000000"
                ></a-text>
              </a-box>

              <!-- Angle Guide Line (20 degrees) -->
              ${currentStepData.overlays.filter(o => o.type === 'line').map((overlay, idx) => `
                <a-cylinder 
                  position="0.4 -0.35 -1.5"
                  radius="0.005" 
                  height="0.3" 
                  color="${overlay.color || '#3B82F6'}"
                  rotation="0 0 ${overlay.angle || 20}"
                  material="opacity: 0.7"
                ></a-cylinder>
              `).join('')}

              <!-- Motion Path Arrow -->
              ${currentStepData.overlays.filter(o => o.type === 'arrow').map((overlay, idx) => `
                <a-cone 
                  position="0.6 -0.35 -1.5"
                  radius-bottom="0.05" 
                  radius-top="0" 
                  height="0.1"
                  color="${overlay.color || '#3B82F6'}"
                  rotation="0 0 -90"
                ></a-cone>
              `).join('')}

              <!-- Text Overlays -->
              ${currentStepData.overlays.filter(o => o.type === 'text').map((overlay, idx) => `
                <a-text 
                  value="${overlay.label || ''}" 
                  align="center" 
                  position="0 0.2 -1.5" 
                  scale="0.4 0.4 0.4" 
                  color="${overlay.color || '#FFFFFF'}"
                  material="shader: flat"
                ></a-text>
              `).join('')}

              <!-- Lighting -->
              <a-light type="ambient" color="#FFF" intensity="0.8"></a-light>
              <a-light type="directional" color="#FFF" intensity="0.5" position="-1 1 0"></a-light>
            </a-scene>
          `
        }}
      />

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
