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

              <!-- Sky/Environment - stylized gradient -->
              <a-sky color="#1a1a2e"></a-sky>
              
              <!-- Ambient particles - floating embers -->
              <a-entity position="0 0 -1.5">
                <a-sphere position="-0.3 0.2 0" radius="0.008" color="#A8D5BA" material="emissive: #A8D5BA; emissiveIntensity: 0.8" animation="property: position; to: -0.3 0.4 0; dur: 3000; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.2 0.15 0.1" radius="0.006" color="#A8D5BA" material="emissive: #A8D5BA; emissiveIntensity: 0.6" animation="property: position; to: 0.2 0.35 0.1; dur: 2500; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.4 0.25 -0.1" radius="0.007" color="#C41E3A" material="emissive: #C41E3A; emissiveIntensity: 0.5" animation="property: position; to: 0.4 0.45 -0.1; dur: 2800; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
              </a-entity>

              <!-- Kitchen Counter - rich wood with PorkChop sand tones -->
              <a-box 
                position="0 -0.5 -1.5" 
                width="2.2" 
                height="0.12" 
                depth="1.1"
                color="#8B5A2B"
                material="metalness: 0.1; roughness: 0.7"
              ></a-box>
              <!-- Counter edge trim - Maine blue -->
              <a-box 
                position="0 -0.44 -1.0" 
                width="2.25" 
                height="0.02" 
                depth="0.02"
                color="#003366"
                material="metalness: 0.6; roughness: 0.3; emissive: #003366; emissiveIntensity: 0.2"
              ></a-box>

              <!-- Whetstone - stylized with seafoam glow -->
              <a-box 
                position="0 -0.4 -1.5" 
                width="0.65" 
                height="0.06" 
                depth="0.22"
                color="${strokeCount > 0 ? '#4A5568' : '#2D3748'}"
                material="metalness: 0.3; roughness: 0.6"
              >
                <!-- Whetstone glow rim -->
                <a-box 
                  position="0 0 0" 
                  width="0.67" 
                  height="0.02" 
                  depth="0.24"
                  color="#A8D5BA"
                  material="opacity: 0.4; transparent: true; emissive: #A8D5BA; emissiveIntensity: 0.5"
                  animation="property: material.emissiveIntensity; to: 0.2; dur: 1500; easing: easeInOutSine; loop: true; dir: alternate"
                ></a-box>
              </a-box>
              <!-- Water puddle effect -->
              <a-circle 
                position="0.35 -0.44 -1.4" 
                radius="0.08" 
                rotation="-90 0 0"
                color="#A8D5BA"
                material="opacity: 0.3; transparent: true; emissive: #A8D5BA; emissiveIntensity: 0.3"
              ></a-circle>
              
              <!-- Stroke counter display - stylized -->
              ${strokeCount > 0 ? `
              <a-entity position="0 0.35 -1.5">
                <a-text 
                  value="${strokeCount}/10" 
                  align="center" 
                  position="0 0 0" 
                  scale="0.5 0.5 0.5" 
                  color="#A8D5BA"
                  material="emissive: #A8D5BA; emissiveIntensity: 0.8"
                ></a-text>
                <a-text 
                  value="STROKES" 
                  align="center" 
                  position="0 -0.08 0" 
                  scale="0.2 0.2 0.2" 
                  color="#FFFFFF"
                ></a-text>
              </a-entity>` : ''}

              <!-- Chef's Knife - stylized blade with lobster red handle -->
              <a-entity 
                id="knife"
                position="${knifeSelected ? '0 -0.38 -1.5' : '0.4 -0.33 -1.5'}" 
                rotation="0 0 ${currentStepData.overlays.find(o => o.type === 'line')?.angle || 20}"
                animation="${isAnimating ? 'property: position; to: -0.3 -0.38 -1.5; dur: 600; easing: easeInOutQuad; loop: 5; dir: alternate' : ''}"
              >
                <!-- Blade -->
                <a-box 
                  position="0.15 0 0" 
                  width="0.4" 
                  height="0.025" 
                  depth="0.06"
                  color="${knifeSelected ? '#E8E8E8' : '#B8B8B8'}"
                  material="metalness: 0.9; roughness: 0.2; emissive: ${knifeSelected ? '#FFFFFF' : '#888888'}; emissiveIntensity: ${knifeSelected ? '0.3' : '0.1'}"
                ></a-box>
                <!-- Blade edge glow -->
                <a-box 
                  position="0.15 -0.015 0" 
                  width="0.42" 
                  height="0.005" 
                  depth="0.062"
                  color="#A8D5BA"
                  material="opacity: ${knifeSelected ? '0.6' : '0.2'}; transparent: true; emissive: #A8D5BA; emissiveIntensity: 0.8"
                  animation="${knifeSelected ? 'property: material.opacity; to: 0.3; dur: 800; easing: easeInOutSine; loop: true; dir: alternate' : ''}"
                ></a-box>
                <!-- Handle - Lobster Red -->
                <a-box 
                  position="-0.12 0 0" 
                  width="0.15" 
                  height="0.035" 
                  depth="0.045"
                  color="#C41E3A"
                  material="metalness: 0.2; roughness: 0.5; emissive: #C41E3A; emissiveIntensity: 0.2"
                ></a-box>
                <!-- Handle accent -->
                <a-box 
                  position="-0.04 0 0" 
                  width="0.02" 
                  height="0.04" 
                  depth="0.05"
                  color="#003366"
                  material="metalness: 0.7; roughness: 0.3"
                ></a-box>
              </a-entity>
              
              <!-- Knife selection aura -->
              ${knifeSelected ? `
              <a-ring 
                position="0 -0.35 -1.5" 
                radius-inner="0.28" 
                radius-outer="0.32"
                rotation="-90 0 0"
                color="#A8D5BA"
                material="opacity: 0.5; transparent: true; emissive: #A8D5BA; emissiveIntensity: 1; side: double"
                animation="property: scale; to: 1.1 1.1 1.1; dur: 1000; easing: easeInOutSine; loop: true; dir: alternate"
              ></a-ring>` : ''}

              <!-- Angle Guide Line - glowing -->
              ${currentStepData.overlays.filter(o => o.type === 'line').map((overlay, idx) => `
                <a-cylinder 
                  position="${knifeSelected ? '0.15 -0.35 -1.5' : '0.55 -0.33 -1.5'}"
                  radius="0.008" 
                  height="0.35" 
                  color="#C41E3A"
                  rotation="0 0 ${overlay.angle || 20}"
                  material="emissive: #C41E3A; emissiveIntensity: 0.6; opacity: 0.8; transparent: true"
                  animation="property: material.emissiveIntensity; to: 0.3; dur: 1000; easing: easeInOutSine; loop: true; dir: alternate"
                ></a-cylinder>
                <a-text 
                  value="${overlay.angle || 20}°" 
                  position="${knifeSelected ? '0.35 -0.2 -1.5' : '0.75 -0.18 -1.5'}" 
                  scale="0.15 0.15 0.15" 
                  color="#C41E3A"
                  material="emissive: #C41E3A; emissiveIntensity: 0.5"
                ></a-text>
              `).join('')}

              <!-- Motion Path Arrow - stylized -->
              ${currentStepData.overlays.filter(o => o.type === 'arrow').map((overlay, idx) => `
                <a-cone 
                  position="0.65 -0.33 -1.5"
                  radius-bottom="0.06" 
                  radius-top="0" 
                  height="0.12"
                  color="#003366"
                  rotation="0 0 -90"
                  material="emissive: #003366; emissiveIntensity: 0.4"
                  animation="property: position; to: 0.75 -0.33 -1.5; dur: 800; easing: easeInOutSine; loop: true; dir: alternate"
                ></a-cone>
              `).join('')}

              <!-- Text Overlays - stylized with glow -->
              ${currentStepData.overlays.filter(o => o.type === 'text').map((overlay, idx) => `
                <a-text 
                  value="${overlay.label || ''}" 
                  align="center" 
                  position="0 0.25 -1.5" 
                  scale="0.35 0.35 0.35" 
                  color="#FFFFFF"
                  material="emissive: #FFFFFF; emissiveIntensity: 0.3"
                ></a-text>
              `).join('')}

              <!-- Lighting - dramatic WoW-style -->
              <a-light type="ambient" color="#A8D5BA" intensity="0.4"></a-light>
              <a-light type="directional" color="#FFFFFF" intensity="0.7" position="-1 2 1"></a-light>
              <a-light type="point" color="#C41E3A" intensity="0.3" position="0.5 0.5 -1" distance="3"></a-light>
              <a-light type="point" color="#003366" intensity="0.2" position="-0.5 0.3 -1.2" distance="2"></a-light>
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
