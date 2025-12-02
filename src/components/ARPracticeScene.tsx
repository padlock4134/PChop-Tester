import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  
  // Interactive AR states
  const [knifeSelected, setKnifeSelected] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [lastSwipeTime, setLastSwipeTime] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Audio feedback
  const playSound = (type: 'tap' | 'swipe' | 'success' | 'complete') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'tap':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.1);
          break;
        case 'swipe':
          oscillator.frequency.value = 400 + (strokeCount * 50);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'success':
          oscillator.frequency.value = 800;
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          oscillator.start();
          setTimeout(() => { oscillator.frequency.value = 1000; }, 100);
          setTimeout(() => { oscillator.frequency.value = 1200; }, 200);
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
        case 'complete':
          oscillator.frequency.value = 523;
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          oscillator.start();
          setTimeout(() => { oscillator.frequency.value = 659; }, 150);
          setTimeout(() => { oscillator.frequency.value = 784; }, 300);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  };
  
  // Haptic feedback
  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };
  
  // Handle tap on 3D scene
  const handleSceneTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!knifeSelected) {
      setKnifeSelected(true);
      playSound('tap');
      vibrate(50);
    }
  };
  
  // Handle swipe start
  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!knifeSelected) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setSwipeStartX(clientX);
    setSwipeStartY(clientY);
  };
  
  // Handle swipe end
  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!knifeSelected || swipeStartX === 0) return;
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const deltaX = clientX - swipeStartX;
    const deltaY = clientY - swipeStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Valid swipe: horizontal, at least 50px
    if (distance > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      const now = Date.now();
      if (now - lastSwipeTime > 300) { // Debounce
        setStrokeCount(prev => prev + 1);
        setLastSwipeTime(now);
        playSound('swipe');
        vibrate(30);
        
        // Show success after 10 strokes
        if (strokeCount + 1 >= 10) {
          setShowSuccess(true);
          playSound('success');
          vibrate([50, 50, 50]);
          setTimeout(() => setShowSuccess(false), 2000);
        }
      }
    }
    
    setSwipeStartX(0);
    setSwipeStartY(0);
  };
  
  // Play demo animation
  const playDemoAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000);
  };
  
  // Reset interaction state when step changes
  useEffect(() => {
    setKnifeSelected(false);
    setStrokeCount(0);
    setShowSuccess(false);
  }, [currentStep]);

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
      // Allow dragging anywhere on screen
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      newX = Math.max(0, Math.min(newX, window.innerWidth - tooltipRect.width));
      newY = Math.max(0, Math.min(newY, window.innerHeight - tooltipRect.height));
      
      setTooltipPosition({ x: newX, y: newY });
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

  // Render tooltip content
  const tooltipContent = (
    <div 
      ref={tooltipRef}
      onMouseDown={handleMouseDown}
      className="fixed bg-gradient-to-br from-amber-900 to-amber-950 text-white rounded-xl shadow-2xl border-4 border-amber-600 max-w-sm cursor-move select-none"
      style={{ 
        left: tooltipPosition.x ? `${tooltipPosition.x}px` : 'auto',
        top: tooltipPosition.y ? `${tooltipPosition.y}px` : '1rem',
        right: tooltipPosition.x ? 'auto' : '1rem',
        maxHeight: '70vh', 
        overflowY: 'auto' as const,
        zIndex: 9999
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
        <div className="text-xs opacity-75 cursor-move">⋮⋮ Drag me</div>
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
  );

  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onClick={handleSceneTap}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        onMouseDown={handleSwipeStart}
        onMouseUp={handleSwipeEnd}
      >
        {/* Interaction Overlay */}
        {!knifeSelected && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-black bg-opacity-60 text-white px-6 py-4 rounded-xl text-center animate-pulse">
              <p className="text-lg font-bold">👆 Tap to pick up knife</p>
            </div>
          </div>
        )}
        
        {knifeSelected && strokeCount < 10 && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-bold">↔️ Swipe to sharpen</p>
              <p className="text-xs mt-1">Strokes: {strokeCount}/10</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(strokeCount / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-green-500 text-white px-8 py-4 rounded-xl text-center animate-bounce">
              <p className="text-2xl font-bold">✓ Great technique!</p>
              <p className="text-sm">10 strokes complete</p>
            </div>
          </div>
        )}
        
        {/* Demo Animation Button */}
        <button
          onClick={(e) => { e.stopPropagation(); playDemoAnimation(); }}
          className="absolute bottom-4 left-4 z-10 bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
        >
          ▶ Watch Demo
        </button>
        
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

              <!-- Whetstone (with water effect) -->
              <a-box 
                position="0 -0.4 -1.5" 
                width="0.6" 
                height="0.05" 
                depth="0.2"
                color="${strokeCount > 0 ? '#505050' : '#696969'}"
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
              
              <!-- Stroke counter display -->
              ${strokeCount > 0 ? `
              <a-text 
                value="${strokeCount}/10 strokes" 
                align="center" 
                position="0 0.3 -1.5" 
                scale="0.3 0.3 0.3" 
                color="#00FF00"
              ></a-text>` : ''}

              <!-- Chef's Knife (interactive) -->
              <a-box 
                id="knife"
                position="${knifeSelected ? '0 -0.4 -1.5' : '0.4 -0.35 -1.5'}" 
                width="0.5" 
                height="0.02" 
                depth="0.05"
                color="${knifeSelected ? '#E8E8E8' : '#C0C0C0'}"
                rotation="0 0 ${currentStepData.overlays.find(o => o.type === 'line')?.angle || 20}"
                animation="${isAnimating ? 'property: position; to: -0.3 -0.4 -1.5; dur: 500; easing: easeInOutSine; loop: 5; dir: alternate' : ''}"
                class="clickable"
              >
                <a-text 
                  value="${knifeSelected ? '🔪 Ready' : 'Tap Me'}" 
                  align="center" 
                  position="0 0.08 0" 
                  scale="0.2 0.2 0.2" 
                  color="${knifeSelected ? '#00AA00' : '#000000'}"
                ></a-text>
              </a-box>
              
              <!-- Glow effect when selected -->
              ${knifeSelected ? `
              <a-box 
                position="0 -0.4 -1.5" 
                width="0.55" 
                height="0.03" 
                depth="0.06"
                color="#FFD700"
                material="opacity: 0.3; transparent: true"
                animation="property: material.opacity; to: 0.1; dur: 500; easing: easeInOutSine; loop: true; dir: alternate"
              ></a-box>` : ''}

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
      </div>

      {/* Portal tooltip to document body so it can float anywhere */}
      {typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
};

export default ARPracticeSceneComponent;
