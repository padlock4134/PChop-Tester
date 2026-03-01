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
          if (newCount <= 10) {
            playSound('swipe');
            vibrate(30);
          }
          if (newCount >= 10 && prev < 10) {
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
    };
  }, [stopTracking]);
  
  // Expose stopTracking to parent via ref
  useEffect(() => {
    if (onStopTrackingRef) {
      onStopTrackingRef.current = stopTracking;
    }
    return () => {
      if (onStopTrackingRef) {
        onStopTrackingRef.current = null;
      }
    };
  }, [onStopTrackingRef, stopTracking]);
  
  // Update knife position directly via DOM (avoids React re-renders)
  useEffect(() => {
    const knifeEntity = document.getElementById('knife-hand-entity');
    if (knifeEntity) {
      // Calculate position based on knifeProgress (0-1)
      const y = -0.08 + (knifeProgress * 0.03);
      const z = -0.62 + (knifeProgress * 0.14);
      knifeEntity.setAttribute('position', `0.1 ${y} ${z}`);
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
    
    // Map drag position to knife progress (0-1)
    const progress = Math.max(0, Math.min(1, (clientX - dragStartX.current + containerWidth / 2) / containerWidth));
    setKnifeProgress(progress);
    
    // Track direction for stroke counting
    const isRight = clientX > swipeStartX;
    const wasLeft = dragLastDirection.current === 'left';
    
    if (isRight && wasLeft) {
      // Completed a stroke
      const now = Date.now();
      if (now - lastSwipeTime > 300) {
        setStrokeCount(prev => {
          const newCount = prev + 1;
          if (newCount <= 10) {
            playSound('swipe');
            vibrate(30);
          }
          if (newCount >= 10 && prev < 10) {
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
    
    dragLastDirection.current = isRight ? 'right' : 'left';
    setSwipeStartX(clientX);
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
              <p className="text-lg font-bold">👆 Tap to pick up knife & whetstone</p>
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

              <!-- Whetstone on table - only visible when NOT picked up -->
              ${!whetstoneSelected ? `
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
              </a-box>` : ''}
              <!-- Water puddle effect -->
              <a-circle 
                position="0.35 -0.44 -1.4" 
                radius="0.08" 
                rotation="-90 0 0"
                color="#A8D5BA"
                material="opacity: 0.3; transparent: true; emissive: #A8D5BA; emissiveIntensity: 0.3"
              ></a-circle>
              
              <!-- Stroke counter removed from A-Frame to prevent re-renders - shown in React overlay instead -->

              <!-- LEFT HAND holding WHETSTONE - angled 8 to 2 o'clock -->
              ${whetstoneSelected ? `
              <a-entity 
                position="-0.15 -0.15 -0.55" 
                rotation="-15 25 -55" 
                scale="1.3 1.3 1.3"
              >
                <!-- THE WHETSTONE you're holding -->
                <a-box 
                  position="0 0.12 0" 
                  width="0.25" 
                  height="0.06" 
                  depth="0.08"
                  color="#6B8E6B"
                  material="shader: standard; roughness: 0.8"
                ></a-box>
                <a-box position="0 0.12 0" width="0.26" height="0.065" depth="0.085" color="#3D5C3D" material="shader: standard; roughness: 0.8; side: back"></a-box>
                
                <!-- === LEFT HAND + ARM (connected anatomy) === -->
                <!-- FOREARM (blue sleeve) - moved up to overlap wrist -->
                <a-cylinder position="0.008 -0.15 0.03" radius="0.035" height="0.28" color="#003366" rotation="10 0 6" material="shader: standard; roughness: 0.7" segments-radial="16"></a-cylinder>
                <!-- Elbow-end cap -->
                <a-sphere position="0.02 -0.29 0.06" radius="0.036" color="#003366" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- Sleeve cuff overlap - where sleeve meets skin -->
                <a-sphere position="0.003 -0.02 0.015" radius="0.036" color="#003366" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- WRIST skin - bridges sleeve to hand -->
                <a-cylinder position="0 -0.03 0.015" radius="0.03" height="0.07" color="#F4A460" rotation="6 0 3" material="shader: standard; roughness: 0.8" segments-radial="16"></a-cylinder>
                <!-- Wrist-to-hand overlap sphere -->
                <a-sphere position="0 -0.005 0.01" radius="0.032" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- PALM - ellipsoid under the stone -->
                <a-sphere position="0 0.06 0" radius="0.055" scale="1.4 0.7 0.8" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- KNUCKLE RIDGE - elongated sphere across top -->
                <a-sphere position="0 0.1 0.02" radius="0.04" scale="1.3 0.5 0.6" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- FINGERS curled over top of stone -->
                <a-cylinder position="0 0.09 0.04" radius="0.022" height="0.1" color="#F4A460" rotation="-15 0 90" material="shader: standard; roughness: 0.8" segments-radial="12"></a-cylinder>
                <!-- Fingertip bumps (front edge of stone) -->
                <a-sphere position="-0.03 0.09 0.055" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="-0.01 0.09 0.058" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.01 0.088 0.055" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- THUMB on opposite side of stone -->
                <a-cylinder position="0.06 0.07 -0.01" radius="0.014" height="0.065" color="#F4A460" rotation="5 0 -20" material="shader: standard; roughness: 0.8" segments-radial="10"></a-cylinder>
                <a-sphere position="0.065 0.1 -0.015" radius="0.014" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
              </a-entity>` : ''}

              <!-- RIGHT HAND holding KNIFE - controlled by camera/touch/mouse input -->
              ${knifeSelected ? `
              <a-entity 
                id="knife-hand-entity"
                position="0.1 -0.08 -0.62" 
                rotation="-25 -15 35" 
                scale="1.3 1.3 1.3"
              >
                <!-- THE KNIFE you're holding -->
                <!-- Handle -->
                <a-box 
                  position="0 0.05 0" 
                  width="0.04" 
                  height="0.12" 
                  depth="0.03"
                  color="#8B0000"
                  material="shader: standard; roughness: 0.8"
                ></a-box>
                <!-- Blade -->
                <a-box 
                  position="0 0.22 0" 
                  width="0.02" 
                  height="0.25" 
                  depth="0.08"
                  color="#C0C0C0"
                  material="shader: standard; roughness: 0.3; metalness: 0.8"
                ></a-box>
                <a-box position="0 0.22 0" width="0.025" height="0.26" depth="0.085" color="#888888" material="shader: standard; roughness: 0.3; metalness: 0.8; side: back"></a-box>
                <!-- Blade edge glow -->
                <a-box position="0.012 0.22 0" width="0.003" height="0.25" depth="0.075" color="#A8D5BA" material="shader: standard; emissive: #A8D5BA; emissiveIntensity: 0.5"></a-box>
                
                <!-- === RIGHT HAND + ARM (connected anatomy) === -->
                <!-- FOREARM (white sleeve) - tapered cylinder -->
                <a-cylinder position="-0.01 -0.2 0.04" radius="0.035" height="0.28" color="#FFFFFF" rotation="12 0 -8" material="shader: standard; roughness: 0.7" segments-radial="16"></a-cylinder>
                <!-- Elbow-end cap -->
                <a-sphere position="-0.025 -0.34 0.07" radius="0.036" color="#FFFFFF" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- WRIST - slightly narrower, overlaps forearm and hand -->
                <a-cylinder position="0 -0.06 0.02" radius="0.028" height="0.06" color="#F4A460" rotation="8 0 -4" material="shader: standard; roughness: 0.8" segments-radial="16"></a-cylinder>
                <!-- Wrist-to-sleeve overlap sphere -->
                <a-sphere position="-0.005 -0.08 0.03" radius="0.033" color="#FFFFFF" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- Wrist-to-hand overlap sphere -->
                <a-sphere position="0 -0.04 0.015" radius="0.03" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- PALM - ellipsoid (squashed sphere) wrapping around handle -->
                <a-sphere position="0 0.03 0" radius="0.05" scale="0.9 1.3 0.7" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- KNUCKLE RIDGE - elongated sphere across top of fist -->
                <a-sphere position="0 0.09 0" radius="0.035" scale="1 0.5 0.8" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- FINGERS curled around handle (one wide curved piece) -->
                <a-cylinder position="0 0.06 -0.02" radius="0.025" height="0.08" color="#F4A460" rotation="-20 0 0" material="shader: standard; roughness: 0.8" segments-radial="12"></a-cylinder>
                <!-- Fingertip bumps (front of fist) -->
                <a-sphere position="-0.015 0.06 -0.04" radius="0.014" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.005 0.06 -0.042" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.02 0.055 -0.038" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- THUMB - pressed along handle side, pointing up -->
                <a-cylinder position="-0.035 0.06 0.015" radius="0.013" height="0.07" color="#F4A460" rotation="5 0 15" material="shader: standard; roughness: 0.8" segments-radial="10"></a-cylinder>
                <a-sphere position="-0.04 0.095 0.018" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
              </a-entity>` : ''}

              <!-- KNIFE on table - only visible when NOT picked up -->
              ${!knifeSelected ? `
              <a-entity 
                id="knife-on-table"
                position="0.3 -0.38 -1.5" 
                rotation="0 0 ${currentStepData.overlays.find(o => o.type === 'line')?.angle || 20}"
              >` : `
              <a-entity id="knife-placeholder" visible="false">`}
                
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
                  material="opacity: ${knifeSelected ? '0.6' : '0.2'}; transparent: true; emissive: #A8D5BA; emissiveIntensity: 0.9"
                  animation="property: material.opacity; to: 0.3; dur: 800; easing: easeInOutSine; loop: true; dir: alternate"
                ></a-box>
                <!-- Sparks - always present with subtle glow -->
                <a-sphere position="0.2 -0.02 0.03" radius="0.006" color="#FFD700" material="emissive: #FFD700; emissiveIntensity: 0.5" animation="property: scale; from: 1 1 1; to: 1.3 1.3 1.3; dur: 400; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.25 -0.015 -0.02" radius="0.004" color="#FFA500" material="emissive: #FFA500; emissiveIntensity: 0.4" animation="property: scale; from: 1 1 1; to: 1.5 1.5 1.5; dur: 500; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.15 -0.02 0.01" radius="0.005" color="#FFD700" material="emissive: #FFD700; emissiveIntensity: 0.5" animation="property: scale; from: 1 1 1; to: 1.4 1.4 1.4; dur: 450; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
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

              <!-- Lighting - soft and natural -->
              <a-light type="ambient" color="#FFEEDD" intensity="0.5"></a-light>
              <a-light type="directional" color="#FFFFFF" intensity="0.6" position="-1 2.5 1.5"></a-light>
              <a-light type="directional" color="#FFE4C4" intensity="0.25" position="1 0.5 -0.5"></a-light>
              <a-light type="point" color="#C41E3A" intensity="0.15" position="0.5 0.5 -1" distance="3"></a-light>
              <a-light type="point" color="#003366" intensity="0.1" position="-0.5 0.3 -1.2" distance="2"></a-light>
            </a-scene>
          `
          }}
        />
      </div>

    </>
  );
};

export default ARPracticeSceneComponent;
