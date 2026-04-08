import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePoseTracking } from '../hooks/usePoseTracking';

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
  guideOpen?: boolean;
  setGuideOpen?: (open: boolean) => void;
  onStopTrackingRef?: React.MutableRefObject<(() => void) | null>;
}

const ARPracticeSceneComponent: React.FC<ARPracticeSceneProps> = ({ scene, onComplete, guideOpen: externalGuideOpen, setGuideOpen: externalSetGuideOpen, onStopTrackingRef }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isARReady, setIsARReady] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Interactive AR states
  const [knifeSelected, setKnifeSelected] = useState(false);
  const [whetstoneSelected, setWhetstoneSelected] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [lastSwipeTime, setLastSwipeTime] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [internalGuideOpen, setInternalGuideOpen] = useState(true);
  
  // Use external state if provided, otherwise use internal
  const guideOpen = externalGuideOpen !== undefined ? externalGuideOpen : internalGuideOpen;
  const setGuideOpen = externalSetGuideOpen || setInternalGuideOpen;
  const [isSharpeningStroke, setIsSharpeningStroke] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera-based pose tracking
  const { 
    rightWristX, 
    isTracking, 
    poseDetected, 
    error: poseError, 
    startTracking, 
    stopTracking 
  } = usePoseTracking();
  
  // Knife position controlled by wrist (0 = back of stone, 1 = front of stone)
  const [knifeProgress, setKnifeProgress] = useState(0.5);
  const [inputMode, setInputMode] = useState<'camera' | 'touch' | 'mouse' | null>(null);

  const teardownARSession = useCallback(() => {
    document.querySelectorAll('video').forEach((node) => {
      if (node.closest('#root') && !node.id?.includes('arjs')) return;
      const mediaStream = node.srcObject;
      if (mediaStream instanceof MediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      node.pause();
      node.srcObject = null;
      node.remove();
    });

    const orphanedSelectors = [
      '.arjs-loader', '#arjsDebugUIContainer',
      '.a-enter-vr', '.a-orientation-modal', '.a-loader-title',
      'a-scene > canvas', '.a-canvas',
    ];
    orphanedSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (!node.closest('#root')) node.remove();
      });
    });

    document.querySelectorAll('style[data-href*="aframe"]').forEach((s) => s.remove());

    document.body.style.overflow = '';
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
  }, []);
  
  // Track wrist movement for stroke counting
  const lastWristDirection = useRef<'left' | 'right' | null>(null);
  const wristCenterCrossCount = useRef(0);
  
  // Update knife position based on wrist tracking
  useEffect(() => {
    if (isTracking && poseDetected && knifeSelected) {
      setInputMode('camera');
      setKnifeProgress(rightWristX);
      
      // Count strokes: each time wrist crosses center going right = 1 stroke
      const isRight = rightWristX > 0.5;
      const wasLeft = lastWristDirection.current === 'left';
      
      if (isRight && wasLeft) {
        // Completed a stroke (went left, now going right)
        setStrokeCount(prev => {
          const newCount = prev + 1;
          playSound('swipe');
          vibrate(30);
          if (newCount % 10 === 0) {
            setShowSuccess(true);
            playSound('success');
            vibrate([50, 50, 50]);
            setTimeout(() => setShowSuccess(false), 2000);
          }
          return newCount;
        });
      }
      
      lastWristDirection.current = isRight ? 'right' : 'left';
    }
  }, [rightWristX, isTracking, poseDetected, knifeSelected]);
  
  // Auto-start tracking when knife is picked up
  useEffect(() => {
    if (knifeSelected && !isTracking) {
      startTracking();
    }
  }, [knifeSelected, isTracking, startTracking]);
  
  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      stopTracking();
      teardownARSession();
    };
  }, [stopTracking, teardownARSession]);
  
  // Expose stopTracking to parent via ref
  useEffect(() => {
    if (onStopTrackingRef) {
      onStopTrackingRef.current = () => {
        stopTracking();
        teardownARSession();
      };
    }
    return () => {
      if (onStopTrackingRef) {
        onStopTrackingRef.current = null;
      }
    };
  }, [onStopTrackingRef, stopTracking, teardownARSession]);
  
  // Update knife position directly via DOM (avoids React re-renders)
  useEffect(() => {
    const knifeEntity = document.getElementById('knife-hand-entity');
    if (knifeEntity) {
      // Calculate position based on knifeProgress (0-1)
      // Knife slides along stone surface - pulled back so blade tip touches
      const y = -0.08;
      const z = -0.64 + (knifeProgress * 0.16);
      knifeEntity.setAttribute('position', `0.08 ${y} ${z}`);
    }
  }, [knifeProgress]);
  
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
  
  // Handle tap on 3D scene - Pick up both knife and whetstone
  const handleSceneTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!knifeSelected) {
      // Pick up both items at once
      setKnifeSelected(true);
      setWhetstoneSelected(true);
      playSound('tap');
      vibrate(50);
    }
  };
  
  // Track if currently dragging (touch/mouse fallback)
  const [isDraggingKnife, setIsDraggingKnife] = useState(false);
  const dragStartX = useRef(0);
  const dragLastDirection = useRef<'left' | 'right' | null>(null);
  
  // Handle drag start (touch/mouse fallback when camera not tracking)
  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!knifeSelected) return;
    
    // Only use touch/mouse if camera is not actively tracking
    if (isTracking && poseDetected) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSwipeStartX(clientX);
    setSwipeStartY('touches' in e ? e.touches[0].clientY : e.clientY);
    dragStartX.current = clientX;
    setIsDraggingKnife(true);
    setInputMode('touches' in e ? 'touch' : 'mouse');
  };
  
  // Handle drag move (real-time position update)
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingKnife || !knifeSelected) return;
    if (isTracking && poseDetected) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    
    // Map drag delta to knife progress - amplified for easier movement
    const delta = (clientX - dragStartX.current) / (containerWidth * 0.35);
    const progress = Math.max(0, Math.min(1, 0.5 + delta));
    setKnifeProgress(progress);
    
    // Track direction changes for stroke counting
    const moveDelta = clientX - swipeStartX;
    const minMove = 30; // pixels needed to register direction
    
    if (Math.abs(moveDelta) > minMove) {
      const currentDir = moveDelta > 0 ? 'right' : 'left';
      const prevDir = dragLastDirection.current;
      
      if (prevDir && currentDir !== prevDir) {
        // Direction changed = completed a stroke
        const now = Date.now();
        if (now - lastSwipeTime > 100) {
          setStrokeCount(prev => {
            const newCount = prev + 1;
            playSound('swipe');
            vibrate(30);
            if (newCount % 10 === 0) {
              setShowSuccess(true);
              playSound('success');
              vibrate([50, 50, 50]);
              setTimeout(() => setShowSuccess(false), 2000);
            }
            return newCount;
          });
          setLastSwipeTime(now);
        }
      }
      
      dragLastDirection.current = currentDir;
      setSwipeStartX(clientX);
    }
  };
  
  // Handle drag end
  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDraggingKnife(false);
    setSwipeStartX(0);
    setSwipeStartY(0);
  };
  
  // Play demo animation
  const playDemoAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000);
  };
  
  // Reset stroke count when step changes (but keep items picked up)
  useEffect(() => {
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


  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        onClick={handleSceneTap}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleSwipeEnd}
        onMouseDown={handleSwipeStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleSwipeEnd}
        onMouseLeave={handleSwipeEnd}
      >
        {/* Interaction Overlay */}
        {!knifeSelected && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-black bg-opacity-60 text-white px-6 py-4 rounded-xl text-center animate-pulse">
              <p className="text-lg font-bold">👆 Tap to pick up pipe cutter & copper pipe</p>
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
        
        {/* Real AR Camera View */}
        <div 
          ref={sceneRef}
          className="w-full h-full"
          dangerouslySetInnerHTML={{
            __html: `
            <a-scene 
              embedded 
              vr-mode-ui="enabled: false"
              style="width: 100%; height: 100%;"
            >
              <a-entity camera look-controls="enabled: false"></a-entity>
              <a-entity scale="1.02 1.02 1.02">
              <a-sky color="#F3F4F6"></a-sky>

              <!-- Workbench -->
              <a-box 
                position="0 -0.5 -1.5" 
                width="2.2" 
                height="0.12" 
                depth="1.1"
                color="#8B5A2B"
                material="metalness: 0.1; roughness: 0.7"
              ></a-box>
              <a-box 
                position="0 -0.44 -1.0" 
                width="2.25" 
                height="0.02" 
                depth="0.02"
                color="#003366"
                material="metalness: 0.4; roughness: 0.5"
              ></a-box>

              <!-- Copper pipe on bench -->
              ${!whetstoneSelected ? `
              <a-cylinder 
                position="0 -0.37 -1.5"
                radius="0.035"
                height="0.62"
                rotation="0 0 90"
                color="#B87333"
                material="metalness: 0.5; roughness: 0.45"
              ></a-cylinder>` : ''}

              <!-- Left hand holding copper pipe -->
              ${whetstoneSelected ? `
              <a-entity 
                position="-0.15 -0.15 -0.55" 
                rotation="-15 25 -55" 
                scale="1.3 1.3 1.3"
              >
                <a-cylinder 
                  position="0 0.12 0" 
                  radius="0.03" 
                  height="0.32" 
                  rotation="0 0 90"
                  color="#B87333"
                  material="shader: standard; roughness: 0.6; metalness: 0.45"
                ></a-cylinder>
                <a-cylinder position="0.008 -0.15 0.03" radius="0.035" height="0.28" color="#003366" rotation="10 0 6" material="shader: standard; roughness: 0.7" segments-radial="16"></a-cylinder>
                <a-sphere position="0.02 -0.29 0.06" radius="0.036" color="#003366" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.003 -0.02 0.015" radius="0.036" color="#003366" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-cylinder position="0 -0.03 0.015" radius="0.03" height="0.07" color="#F4A460" rotation="6 0 3" material="shader: standard; roughness: 0.8" segments-radial="16"></a-cylinder>
                <a-sphere position="0 -0.005 0.01" radius="0.032" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <a-sphere position="0 0.06 0" radius="0.055" scale="1.4 0.7 0.8" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <a-cylinder position="0 0.09 -0.04" radius="0.022" height="0.1" color="#F4A460" rotation="15 0 90" material="shader: standard; roughness: 0.8" segments-radial="12"></a-cylinder>
                <a-sphere position="-0.03 0.09 -0.055" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="-0.01 0.09 -0.058" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.01 0.088 -0.055" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0 0.1 -0.02" radius="0.04" scale="1.3 0.5 0.6" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="-0.05 0.04 0.02" radius="0.025" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <a-cylinder position="-0.06 0.08 0.04" radius="0.016" height="0.08" color="#F4A460" rotation="10 0 0" material="shader: standard; roughness: 0.8" segments-radial="10"></a-cylinder>
                <a-sphere position="-0.06 0.12 0.048" radius="0.016" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
              </a-entity>` : ''}

              <!-- Right hand holding pipe cutter -->
              ${knifeSelected ? `
              <a-entity 
                id="knife-hand-entity"
                position="0.08 -0.08 -0.64" 
                rotation="-30 -10 40" 
                scale="1.3 1.3 1.3"
              >
                <a-torus
                  position="0 0.18 0"
                  radius="0.085"
                  radius-tubular="0.015"
                  rotation="90 0 0"
                  color="#D1D5DB"
                  material="metalness: 0.75; roughness: 0.35"
                ></a-torus>
                <a-cylinder
                  position="0.055 0.18 0"
                  radius="0.015"
                  height="0.05"
                  rotation="90 0 0"
                  color="#6B7280"
                  material="metalness: 0.8; roughness: 0.3"
                ></a-cylinder>
                <a-box 
                  position="-0.045 0.1 0" 
                  width="0.03" 
                  height="0.11" 
                  depth="0.025"
                  color="#374151"
                  material="shader: standard; roughness: 0.7"
                ></a-box>
                <a-cylinder position="-0.01 -0.16 0.04" radius="0.035" height="0.18" color="#FFFFFF" rotation="12 0 -8" material="shader: standard; roughness: 0.7" segments-radial="16"></a-cylinder>
                <a-sphere position="-0.02 -0.25 0.06" radius="0.036" color="#FFFFFF" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-cylinder position="0 -0.06 0.02" radius="0.028" height="0.06" color="#F4A460" rotation="8 0 -4" material="shader: standard; roughness: 0.8" segments-radial="16"></a-cylinder>
                <a-sphere position="-0.005 -0.08 0.03" radius="0.033" color="#FFFFFF" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0 -0.04 0.015" radius="0.03" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <a-sphere position="0 0.03 0" radius="0.05" scale="0.9 1.3 0.7" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <a-sphere position="0 0.09 0" radius="0.035" scale="1 0.5 0.8" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-cylinder position="0 0.06 -0.02" radius="0.025" height="0.08" color="#F4A460" rotation="-20 0 0" material="shader: standard; roughness: 0.8" segments-radial="12"></a-cylinder>
                <a-sphere position="-0.015 0.06 -0.04" radius="0.014" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.005 0.06 -0.042" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.02 0.055 -0.038" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-cylinder position="-0.035 0.06 0.015" radius="0.013" height="0.07" color="#F4A460" rotation="5 0 15" material="shader: standard; roughness: 0.8" segments-radial="10"></a-cylinder>
                <a-sphere position="-0.04 0.095 0.018" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
              </a-entity>` : ''}

              <!-- Pipe cutter on bench -->
              ${!knifeSelected ? `
              <a-entity 
                id="knife-on-table"
                position="0.3 -0.38 -1.5" 
                rotation="0 0 ${currentStepData.overlays.find(o => o.type === 'line')?.angle || 20}"
              >` : `
              <a-entity id="knife-placeholder" visible="false">`}
                <a-torus
                  position="0.05 0.02 0"
                  radius="0.11"
                  radius-tubular="0.02"
                  rotation="90 0 0"
                  color="#9CA3AF"
                  material="metalness: 0.75; roughness: 0.3"
                ></a-torus>
                <a-box 
                  position="-0.07 0.02 0" 
                  width="0.06" 
                  height="0.14" 
                  depth="0.03"
                  color="#374151"
                  material="metalness: 0.2; roughness: 0.65"
                ></a-box>
              </a-entity>

              <!-- Angle guide -->
              ${currentStepData.overlays.filter(o => o.type === 'line').map((overlay, idx) => `
                <a-cylinder 
                  position="${knifeSelected ? '0.15 -0.35 -1.5' : '0.55 -0.33 -1.5'}"
                  radius="0.008" 
                  height="0.35" 
                  color="#B91C1C"
                  rotation="0 0 ${overlay.angle || 20}"
                  material="opacity: 0.85; transparent: true"
                ></a-cylinder>
                <a-text 
                  value="${overlay.label || `${overlay.angle || 20}°`}" 
                  position="${knifeSelected ? '0.35 -0.2 -1.5' : '0.75 -0.18 -1.5'}" 
                  scale="0.15 0.15 0.15" 
                  color="#B91C1C"
                ></a-text>
              `).join('')}

              <!-- Motion path arrow -->
              ${currentStepData.overlays.filter(o => o.type === 'arrow').map((overlay, idx) => `
                <a-cone 
                  position="0.65 -0.33 -1.5"
                  radius-bottom="0.06" 
                  radius-top="0" 
                  height="0.12"
                  color="#003366"
                  rotation="0 0 -90"
                  material="opacity: 0.9; transparent: true"
                ></a-cone>
              `).join('')}


              </a-entity>

              <a-light type="ambient" color="#FFFFFF" intensity="0.65"></a-light>
              <a-light type="directional" color="#FFFFFF" intensity="0.5" position="-1 2.5 1.5"></a-light>
            </a-scene>
          `
          }}
        />
      </div>

    </>
  );
};

export default ARPracticeSceneComponent;
