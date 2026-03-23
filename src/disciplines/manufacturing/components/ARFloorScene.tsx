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
  const [toolSelected, setToolSelected] = useState(false);
  const [beltActive, setBeltActive] = useState(false);
  const [placementCount, setPlacementCount] = useState(0);
  const [lastSwipeTime, setLastSwipeTime] = useState(0);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [internalGuideOpen, setInternalGuideOpen] = useState(true);
  
  // Use external state if provided, otherwise use internal
  const guideOpen = externalGuideOpen !== undefined ? externalGuideOpen : internalGuideOpen;
  const setGuideOpen = externalSetGuideOpen || setInternalGuideOpen;
  const [isPlacingComponent, setIsPlacingComponent] = useState(false);
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
  
  // Tweezers position controlled by wrist (0 = left of belt, 1 = right of belt)
  const [tweezersProgress, setTweezersProgress] = useState(0.5);
  const [inputMode, setInputMode] = useState<'camera' | 'touch' | 'mouse' | null>(null);
  
  // Track wrist movement for placement counting
  const lastWristDirection = useRef<'left' | 'right' | null>(null);
  const wristCenterCrossCount = useRef(0);
  
  // Update tweezers position based on wrist tracking
  useEffect(() => {
    if (isTracking && poseDetected && toolSelected) {
      setInputMode('camera');
      setTweezersProgress(rightWristX);
      
      // Count placements: each time wrist crosses center going right = 1 placement
      const isRight = rightWristX > 0.5;
      const wasLeft = lastWristDirection.current === 'left';
      
      if (isRight && wasLeft) {
        // Completed a placement (went left, now going right)
        setPlacementCount(prev => {
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
  }, [rightWristX, isTracking, poseDetected, toolSelected]);
  
  // Auto-start tracking when tool is picked up
  useEffect(() => {
    if (toolSelected && !isTracking) {
      startTracking();
    }
  }, [toolSelected, isTracking, startTracking]);
  
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
  
  // Update tweezers position directly via DOM (avoids React re-renders)
  useEffect(() => {
    const tweezersEntity = document.getElementById('tweezers-hand-entity');
    if (tweezersEntity) {
      // Calculate position based on tweezersProgress (0-1)
      // Tweezers slide along belt surface
      const y = -0.08;
      const z = -0.64 + (tweezersProgress * 0.16);
      tweezersEntity.setAttribute('position', `0.08 ${y} ${z}`);
    }
  }, [tweezersProgress]);
  
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
          oscillator.frequency.value = 400 + (placementCount * 50);
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
  
  // Handle tap on 3D scene - Pick up tweezers and start conveyor belt
  const handleSceneTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!toolSelected) {
      // Pick up both items at once
      setToolSelected(true);
      setBeltActive(true);
      playSound('tap');
      vibrate(50);
    }
  };
  
  // Track if currently dragging (touch/mouse fallback)
  const [isDraggingTool, setIsDraggingTool] = useState(false);
  const dragStartX = useRef(0);
  const dragLastDirection = useRef<'left' | 'right' | null>(null);
  
  // Handle drag start (touch/mouse fallback when camera not tracking)
  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!toolSelected) return;
    
    // Only use touch/mouse if camera is not actively tracking
    if (isTracking && poseDetected) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSwipeStartX(clientX);
    setSwipeStartY('touches' in e ? e.touches[0].clientY : e.clientY);
    dragStartX.current = clientX;
    setIsDraggingTool(true);
    setInputMode('touches' in e ? 'touch' : 'mouse');
  };
  
  // Handle drag move (real-time position update)
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingTool || !toolSelected) return;
    if (isTracking && poseDetected) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    
    // Map drag delta to tweezers progress - amplified for easier movement
    const delta = (clientX - dragStartX.current) / (containerWidth * 0.35);
    const progress = Math.max(0, Math.min(1, 0.5 + delta));
    setTweezersProgress(progress);
    
    // Track direction changes for placement counting
    const moveDelta = clientX - swipeStartX;
    const minMove = 30; // pixels needed to register direction
    
    if (Math.abs(moveDelta) > minMove) {
      const currentDir = moveDelta > 0 ? 'right' : 'left';
      const prevDir = dragLastDirection.current;
      
      if (prevDir && currentDir !== prevDir) {
        // Direction changed = completed a placement
        const now = Date.now();
        if (now - lastSwipeTime > 100) {
          setPlacementCount(prev => {
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
    setIsDraggingTool(false);
    setSwipeStartX(0);
    setSwipeStartY(0);
  };
  
  // Play demo animation
  const playDemoAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000);
  };
  
  // Reset placement count when step changes (but keep items picked up)
  useEffect(() => {
    setPlacementCount(0);
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
        {!toolSelected && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-black bg-opacity-60 text-white px-6 py-4 rounded-xl text-center animate-pulse">
              <p className="text-lg font-bold">👆 Tap to pick up tweezers & start belt</p>
            </div>
          </div>
        )}
        
        
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-green-500 text-white px-8 py-4 rounded-xl text-center animate-bounce">
              <p className="text-2xl font-bold">✓ Great placement!</p>
              <p className="text-sm">10 components placed</p>
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

              <!-- Scene content scaled up 2% -->
              <a-entity scale="1.02 1.02 1.02">

              <!-- Sky/Environment - clean room dark -->
              <a-sky color="#0d1117"></a-sky>
              
              <!-- Ambient particles - clean room dust motes (blue/white) -->
              <a-entity position="0 0 -1.5">
                <a-sphere position="-0.3 0.2 0" radius="0.006" color="#60A5FA" material="emissive: #60A5FA; emissiveIntensity: 0.8" animation="property: position; to: -0.3 0.4 0; dur: 4000; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.2 0.15 0.1" radius="0.005" color="#93C5FD" material="emissive: #93C5FD; emissiveIntensity: 0.6" animation="property: position; to: 0.2 0.35 0.1; dur: 3500; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.4 0.25 -0.1" radius="0.005" color="#FBBF24" material="emissive: #FBBF24; emissiveIntensity: 0.5" animation="property: position; to: 0.4 0.45 -0.1; dur: 3800; easing: easeInOutSine; loop: true; dir: alternate"></a-sphere>
              </a-entity>

              <!-- Industrial Workbench - steel gray -->
              <a-box 
                position="0 -0.5 -1.5" 
                width="2.2" 
                height="0.12" 
                depth="1.1"
                color="#4B5563"
                material="metalness: 0.7; roughness: 0.4"
              ></a-box>
              <!-- Workbench edge trim - safety yellow -->
              <a-box 
                position="0 -0.44 -1.0" 
                width="2.25" 
                height="0.02" 
                depth="0.02"
                color="#FBBF24"
                material="metalness: 0.5; roughness: 0.3; emissive: #FBBF24; emissiveIntensity: 0.2"
              ></a-box>

              <!-- Conveyor Belt - always visible with packaging box -->
              <a-entity position="0 -0.4 -1.5" 
                animation="property: scale; to: ${beltActive ? '1.05 1.05 1.05' : '1 1 1'}; dur: 1500; easing: easeInOutSine">
                <!-- Belt base -->
                <a-box 
                  position="0 0 0" 
                  width="0.8" 
                  height="0.05" 
                  depth="0.22"
                  color="${beltActive ? '#4B5563' : '#374151'}"
                  material="metalness: 0.5; roughness: 0.4; emissive: ${beltActive ? '#374151' : '#000000'}; emissiveIntensity: ${beltActive ? '0.2' : '0'}"
                  animation="property: material.emissiveIntensity; to: ${beltActive ? '0.2' : '0'}; dur: 1000; easing: easeInOutSine"
                ></a-box>
                <!-- Belt surface (dark rubber) - animated when active -->
                <a-box 
                  position="0 0.03 0" 
                  width="0.75" 
                  height="0.015" 
                  depth="0.2"
                  color="#111827"
                  material="metalness: 0.1; roughness: 0.9"
                  animation="${beltActive ? 'property: position; to: 0 0.035 0; dur: 800; loop: true; dir: alternate; easing: easeInOutSine' : ''}"
                ></a-box>
                <!-- Belt rollers (left & right) - spin when active -->
                <a-cylinder position="-0.38 0 0" radius="0.03" height="0.22" color="#6B7280" rotation="90 0 0" material="metalness: 0.8; roughness: 0.3"
                  animation="${beltActive ? 'property: rotation; to: 90 0 360; dur: 3000; loop: true; easing: linear' : ''}"></a-cylinder>
                <a-cylinder position="0.38 0 0" radius="0.03" height="0.22" color="#6B7280" rotation="90 0 0" material="metalness: 0.8; roughness: 0.3"
                  animation="${beltActive ? 'property: rotation; to: 90 0 360; dur: 3000; loop: true; easing: linear' : ''}"></a-cylinder>
                
                <!-- PACKAGING BOX on belt with open flaps (scales and glows when active) -->
                <!-- Box bottom -->
                <a-box position="0 0.06 0" width="0.18" height="0.01" depth="0.12" color="#8B5A2B" material="roughness: 0.6; metalness: 0.1"
                  animation="${toolSelected ? 'property: scale; to: 1.1 1.1 1.1; dur: 1200; easing: easeInOutSine' : ''}"></a-box>
                <!-- Box walls (glow when crane is active) -->
                <a-box position="0 0.085 -0.055" width="0.18" height="0.04" depth="0.01" color="#A0522D" 
                  material="roughness: 0.5; emissive: ${toolSelected ? '#8B5A2B' : '#000000'}; emissiveIntensity: ${toolSelected ? '0.3' : '0'}"
                  animation="${toolSelected ? 'property: material.emissiveIntensity; to: 0.3; dur: 1000; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="0 0.085 0.055" width="0.18" height="0.04" depth="0.01" color="#A0522D" 
                  material="roughness: 0.5; emissive: ${toolSelected ? '#8B5A2B' : '#000000'}; emissiveIntensity: ${toolSelected ? '0.3' : '0'}"
                  animation="${toolSelected ? 'property: material.emissiveIntensity; to: 0.3; dur: 1000; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="-0.085 0.085 0" width="0.01" height="0.04" depth="0.12" color="#A0522D" 
                  material="roughness: 0.5; emissive: ${toolSelected ? '#8B5A2B' : '#000000'}; emissiveIntensity: ${toolSelected ? '0.3' : '0'}"
                  animation="${toolSelected ? 'property: material.emissiveIntensity; to: 0.3; dur: 1000; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="0.085 0.085 0" width="0.01" height="0.04" depth="0.12" color="#A0522D" 
                  material="roughness: 0.5; emissive: ${toolSelected ? '#8B5A2B' : '#000000'}; emissiveIntensity: ${toolSelected ? '0.3' : '0'}"
                  animation="${toolSelected ? 'property: material.emissiveIntensity; to: 0.3; dur: 1000; easing: easeInOutSine' : ''}"></a-box>
                
                <!-- Open flaps (folded outward) - flutter when crane is active -->
                <a-box position="0 0.065 -0.09" width="0.18" height="0.01" depth="0.07" color="#8B5A2B" rotation="-45 0 0" material="roughness: 0.6"
                  animation="${toolSelected ? 'property: rotation; to: -50 0 0; dur: 1500; loop: true; dir: alternate; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="0 0.065 0.09" width="0.18" height="0.01" depth="0.07" color="#8B5A2B" rotation="45 0 0" material="roughness: 0.6"
                  animation="${toolSelected ? 'property: rotation; to: 50 0 0; dur: 1500; loop: true; dir: alternate; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="-0.125 0.065 0" width="0.07" height="0.01" depth="0.12" color="#8B5A2B" rotation="0 0 -45" material="roughness: 0.6"
                  animation="${toolSelected ? 'property: rotation; to: 0 0 -50; dur: 1500; loop: true; dir: alternate; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="0.125 0.065 0" width="0.07" height="0.01" depth="0.12" color="#8B5A2B" rotation="0 0 45" material="roughness: 0.6"
                  animation="${toolSelected ? 'property: rotation; to: 0 0 50; dur: 1500; loop: true; dir: alternate; easing: easeInOutSine' : ''}"></a-box>
                
                <!-- ESD foam inside box (glows when receiving component) -->
                <a-box position="0 0.07 0" width="0.16" height="0.01" depth="0.1" color="#1F2937" 
                  material="roughness: 0.9; emissive: ${tweezersProgress > 0.8 ? '#60A5FA' : '#000000'}; emissiveIntensity: ${tweezersProgress > 0.8 ? '0.4' : '0'}"
                  animation="${tweezersProgress > 0.8 ? 'property: material.emissiveIntensity; to: 0.4; dur: 800; easing: easeInOutSine' : ''}"></a-box>
                <!-- Component slots (highlight target slot) -->
                <a-box position="-0.04 0.075 -0.02" width="0.03" height="0.005" depth="0.025" color="#111827"></a-box>
                <a-box position="0.02 0.075 0.02" width="0.03" height="0.005" depth="0.025" color="${tweezersProgress > 0.7 ? '#60A5FA' : '#111827'}"
                  material="emissive: ${tweezersProgress > 0.7 ? '#60A5FA' : '#000000'}; emissiveIntensity: ${tweezersProgress > 0.7 ? '0.6' : '0'}"
                  animation="${tweezersProgress > 0.7 ? 'property: scale; to: 1.2 1.2 1.2; dur: 600; loop: true; dir: alternate; easing: easeInOutSine' : ''}"></a-box>
                <a-box position="0.04 0.075 -0.02" width="0.03" height="0.005" depth="0.025" color="#111827"></a-box>
                
                <!-- Component placed in box (appears when crane drops) -->
                ${tweezersProgress > 0.9 ? `
                <a-box position="0.02 0.08 0.02" width="0.015" height="0.008" depth="0.012" color="#1E3A5F" 
                  material="metalness: 0.4; roughness: 0.5; emissive: #60A5FA; emissiveIntensity: 0.3"
                  animation="property: scale; from: 0.1 0.1 0.1; to: 1 1 1; dur: 800; easing: easeOutBounce"></a-box>
                ` : ''}
              </a-entity>
              
              <!-- OVERHEAD CRANE SYSTEM -->
              <!-- Crane rail/track above workstation -->
              <a-box position="0 0.3 -1.5" width="1.2" height="0.02" depth="0.04" color="#6B7280" material="metalness: 0.8; roughness: 0.3"></a-box>
              <!-- Crane support posts -->
              <a-cylinder position="-0.6 0.1 -1.5" radius="0.015" height="0.4" color="#4B5563" material="metalness: 0.7; roughness: 0.4"></a-cylinder>
              <a-cylinder position="0.6 0.1 -1.5" radius="0.015" height="0.4" color="#4B5563" material="metalness: 0.7; roughness: 0.4"></a-cylinder>
              
              <!-- Crane trolley (moves along rail) -->
              ${toolSelected ? `
              <a-entity id="crane-trolley" position="0 0.25 -1.5" 
                animation="property: position; to: ${tweezersProgress > 0.7 ? '0 0.25 -1.5' : '-0.2 0.25 -1.5'}; dur: 2000; easing: easeInOutQuad">
                <!-- Trolley body -->
                <a-box position="0 0 0" width="0.08" height="0.04" depth="0.06" color="#374151" material="metalness: 0.6; roughness: 0.4"></a-box>
                <!-- Crane arm extending down (animated based on progress) -->
                <a-cylinder position="0 -0.1 0" radius="0.008" height="${0.16 + (tweezersProgress * 0.1)}" color="#6B7280" material="metalness: 0.8; roughness: 0.2"
                  animation="property: height; to: ${tweezersProgress > 0.5 ? '0.26' : '0.16'}; dur: 1500; easing: easeInOutSine"></a-cylinder>
                <!-- Crane head/gripper -->
                <a-box position="0 ${-0.18 - (tweezersProgress * 0.05)} 0" width="0.03" height="0.02" depth="0.03" color="#9CA3AF" material="metalness: 0.7; roughness: 0.3"
                  animation="property: position; to: 0 ${tweezersProgress > 0.5 ? '-0.23' : '-0.18'} 0; dur: 1500; easing: easeInOutSine"></a-box>
                <!-- Microchip held by crane (drops when progress high) -->
                <a-box position="0 ${-0.2 - (tweezersProgress * 0.05)} 0" width="0.015" height="0.008" depth="0.012" color="#1E3A5F" material="metalness: 0.4; roughness: 0.5"
                  animation="property: position; to: 0 ${tweezersProgress > 0.8 ? '-0.35' : '-0.25'} 0; dur: 1000; easing: easeInQuart"
                  visible="${tweezersProgress < 0.9}"></a-box>
                <!-- Crane status LED -->
                <a-sphere position="0 0.025 0.035" radius="0.004" color="${tweezersProgress > 0.3 ? '#10B981' : '#EF4444'}" 
                  material="emissive: ${tweezersProgress > 0.3 ? '#10B981' : '#EF4444'}; emissiveIntensity: 0.8"
                  animation="property: scale; from: 1 1 1; to: 1.3 1.3 1.3; dur: 600; loop: true; dir: alternate"></a-sphere>
              </a-entity>` : ''}
              <!-- Anti-static mat glow effect -->
              <a-box 
                position="0.45 -0.44 -1.4" 
                width="0.2"
                height="0.005"
                depth="0.15"
                rotation="0 0 0"
                color="#60A5FA"
                material="opacity: 0.25; transparent: true; emissive: #60A5FA; emissiveIntensity: 0.3"
              ></a-box>
              <!-- Component tray -->
              <a-box position="-0.55 -0.42 -1.5" width="0.2" height="0.03" depth="0.15" color="#374151" material="metalness: 0.6; roughness: 0.4"></a-box>
              <!-- Tiny SMD components in tray -->
              <a-box position="-0.58 -0.4 -1.53" width="0.03" height="0.01" depth="0.02" color="#1F2937" material="metalness: 0.3; roughness: 0.5"></a-box>
              <a-box position="-0.53 -0.4 -1.48" width="0.025" height="0.01" depth="0.018" color="#1F2937" material="metalness: 0.3; roughness: 0.5"></a-box>
              <a-box position="-0.56 -0.4 -1.46" width="0.028" height="0.01" depth="0.02" color="#1F2937" material="metalness: 0.3; roughness: 0.5"></a-box>
              
              <!-- Placement counter removed from A-Frame to prevent re-renders - shown in React overlay instead -->

              <!-- LEFT HAND guiding box down (stationary for demo) -->
              ${beltActive ? `
              <a-entity 
                position="-0.25 -0.25 -1.3" 
                rotation="10 15 -20" 
                scale="1.3 1.3 1.3"
              >
                
                <!-- === LEFT HAND + ARM (connected anatomy) === -->
                <!-- FOREARM (blue ESD sleeve) -->
                <a-cylinder position="0.008 -0.15 0.03" radius="0.035" height="0.28" color="#1E3A5F" rotation="10 0 6" material="shader: standard; roughness: 0.7" segments-radial="16"></a-cylinder>
                <!-- Elbow-end cap -->
                <a-sphere position="0.02 -0.29 0.06" radius="0.036" color="#1E3A5F" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- Sleeve cuff overlap -->
                <a-sphere position="0.003 -0.02 0.015" radius="0.036" color="#1E3A5F" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- ESD wrist strap -->
                <a-cylinder position="0 -0.04 0.015" radius="0.032" height="0.02" color="#FBBF24" material="shader: standard; roughness: 0.5; emissive: #FBBF24; emissiveIntensity: 0.2" segments-radial="16"></a-cylinder>
                <!-- WRIST skin -->
                <a-cylinder position="0 -0.03 0.015" radius="0.03" height="0.07" color="#F4A460" rotation="6 0 3" material="shader: standard; roughness: 0.8" segments-radial="16"></a-cylinder>
                <!-- Wrist-to-hand overlap sphere -->
                <a-sphere position="0 -0.005 0.01" radius="0.032" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- PALM - cupping under box -->
                <a-sphere position="0 0.06 0" radius="0.055" scale="1.4 0.7 0.9" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- FINGERS curled around box sides -->
                <a-cylinder position="0 0.09 -0.05" radius="0.022" height="0.1" color="#F4A460" rotation="5 0 90" material="shader: standard; roughness: 0.8" segments-radial="12"></a-cylinder>
                <!-- Fingertip bumps (gripping box wall) -->
                <a-sphere position="-0.03 0.10 -0.06" radius="0.013" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="-0.01 0.10 -0.062" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.01 0.098 -0.06" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- Knuckle ridge -->
                <a-sphere position="0 0.1 -0.03" radius="0.04" scale="1.3 0.5 0.6" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- THUMB - pressed against near box wall -->
                <a-sphere position="-0.05 0.04 0.02" radius="0.025" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <a-cylinder position="-0.06 0.09 0.045" radius="0.016" height="0.09" color="#F4A460" rotation="10 0 0" material="shader: standard; roughness: 0.8" segments-radial="10"></a-cylinder>
                <a-sphere position="-0.06 0.135 0.052" radius="0.016" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
              </a-entity>` : ''}

              <!-- RIGHT HAND holding CONTROL LEVER - controlled by camera/touch/mouse input -->
              ${toolSelected ? `
              <a-entity 
                id="lever-hand-entity"
                position="${0.35 + (tweezersProgress * 0.1)} ${-0.15 + (tweezersProgress * 0.05)} -1.2" 
                rotation="${-20 + (tweezersProgress * 15)} -25 30" 
                scale="${1.3 + (tweezersProgress * 0.2)} ${1.3 + (tweezersProgress * 0.2)} ${1.3 + (tweezersProgress * 0.2)}"
                animation="property: position; to: ${tweezersProgress > 0.5 ? '0.45 -0.1 -1.2' : '0.35 -0.15 -1.2'}; dur: 1200; easing: easeInOutSine"
              >
                <!-- THE CONTROL LEVER you're holding -->
                <!-- Lever base/mount -->
                <a-cylinder 
                  position="0 0.05 0" 
                  radius="0.04" 
                  height="0.08"
                  color="#4B5563"
                  material="shader: standard; roughness: 0.4; metalness: 0.7"
                ></a-cylinder>
                <!-- Lever shaft (tilts based on progress) -->
                <a-cylinder 
                  position="0 0.15 0" 
                  radius="0.012" 
                  height="0.18"
                  color="#6B7280"
                  material="shader: standard; roughness: 0.3; metalness: 0.8"
                  rotation="0 0 ${tweezersProgress * 30}"
                  animation="property: rotation; to: 0 0 ${tweezersProgress > 0.6 ? '30' : '0'}; dur: 1000; easing: easeInOutSine"
                ></a-cylinder>
                <!-- Lever handle/grip (moves with shaft) -->
                <a-sphere 
                  position="${tweezersProgress * 0.05} ${0.24 + (tweezersProgress * 0.02)} 0" 
                  radius="0.025"
                  color="#DC2626"
                  material="shader: standard; roughness: 0.6; emissive: #DC2626; emissiveIntensity: ${0.3 + (tweezersProgress * 0.4)}"
                  animation="property: material.emissiveIntensity; to: ${tweezersProgress > 0.4 ? '0.7' : '0.3'}; dur: 800; easing: easeInOutSine"
                ></a-sphere>
                <!-- Lever status indicator (changes color with progress) -->
                <a-sphere position="0 0.1 0.05" radius="0.006" color="${tweezersProgress > 0.3 ? '#10B981' : '#FBBF24'}" 
                  material="emissive: ${tweezersProgress > 0.3 ? '#10B981' : '#FBBF24'}; emissiveIntensity: 0.8" 
                  animation="property: scale; from: 1 1 1; to: ${1.2 + (tweezersProgress * 0.3)} ${1.2 + (tweezersProgress * 0.3)} ${1.2 + (tweezersProgress * 0.3)}; dur: 800; loop: true; dir: alternate"></a-sphere>
                
                <!-- === RIGHT HAND + ARM (connected anatomy) === -->
                <!-- FOREARM (white ESD smock sleeve) -->
                <a-cylinder position="-0.01 -0.16 0.04" radius="0.035" height="0.18" color="#E5E7EB" rotation="12 0 -8" material="shader: standard; roughness: 0.7" segments-radial="16"></a-cylinder>
                <!-- Elbow-end cap -->
                <a-sphere position="-0.02 -0.25 0.06" radius="0.036" color="#E5E7EB" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- WRIST -->
                <a-cylinder position="0 -0.06 0.02" radius="0.028" height="0.06" color="#F4A460" rotation="8 0 -4" material="shader: standard; roughness: 0.8" segments-radial="16"></a-cylinder>
                <!-- Wrist-to-sleeve overlap -->
                <a-sphere position="-0.005 -0.08 0.03" radius="0.033" color="#E5E7EB" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- Wrist-to-hand overlap -->
                <a-sphere position="0 -0.04 0.015" radius="0.03" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- PALM - gripping lever handle -->
                <a-sphere position="0 0.03 0" radius="0.045" scale="0.9 1.1 0.7" color="#F4A460" material="shader: standard; roughness: 0.8"></a-sphere>
                <!-- KNUCKLE RIDGE -->
                <a-sphere position="0 0.08 0" radius="0.03" scale="1 0.5 0.8" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- FINGERS wrapped around lever handle -->
                <a-cylinder position="0 0.05 -0.02" radius="0.018" height="0.08" color="#F4A460" rotation="-10 0 0" material="shader: standard; roughness: 0.8" segments-radial="12"></a-cylinder>
                <!-- Fingertip bumps (gripping lever) -->
                <a-sphere position="-0.015 0.05 -0.04" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.005 0.05 -0.042" radius="0.011" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <a-sphere position="0.018 0.048 -0.038" radius="0.011" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
                <!-- THUMB - wrapped around lever handle -->
                <a-cylinder position="-0.025 0.05 0.015" radius="0.012" height="0.06" color="#F4A460" rotation="5 0 20" material="shader: standard; roughness: 0.8" segments-radial="10"></a-cylinder>
                <a-sphere position="-0.03 0.08 0.02" radius="0.012" color="#E8945A" material="shader: standard; roughness: 0.7"></a-sphere>
              </a-entity>` : ''}

              <!-- Control Panel on table - only visible when NOT activated -->
              ${!toolSelected ? `
              <a-entity 
                id="control-panel-on-table"
                position="0.4 -0.38 -1.5" 
                rotation="0 0 0"
              >
                <!-- Control panel base -->
                <a-box 
                  position="0 0 0" 
                  width="0.25" 
                  height="0.04" 
                  depth="0.15"
                  color="#374151"
                  material="metalness: 0.6; roughness: 0.4"
                ></a-box>
                <!-- Lever mount in center -->
                <a-cylinder 
                  position="0 0.03 0" 
                  radius="0.03" 
                  height="0.06"
                  color="#4B5563"
                  material="metalness: 0.7; roughness: 0.4"
                ></a-cylinder>
                <!-- Lever shaft (neutral position) -->
                <a-cylinder 
                  position="0 0.08 0" 
                  radius="0.008" 
                  height="0.1"
                  color="#6B7280"
                  material="metalness: 0.8; roughness: 0.3"
                ></a-cylinder>
                <!-- Lever handle -->
                <a-sphere 
                  position="0 0.13 0" 
                  radius="0.018"
                  color="#DC2626"
                  material="roughness: 0.6; emissive: #DC2626; emissiveIntensity: 0.2"
                ></a-sphere>
                <!-- Status indicators -->
                <a-sphere position="-0.08 0.025 0.04" radius="0.004" color="#EF4444" material="emissive: #EF4444; emissiveIntensity: 0.6" animation="property: scale; from: 1 1 1; to: 1.2 1.2 1.2; dur: 800; loop: true; dir: alternate"></a-sphere>
                <a-sphere position="0.08 0.025 0.04" radius="0.004" color="#10B981" material="emissive: #10B981; emissiveIntensity: 0.6"></a-sphere>
                <!-- Control labels -->
                <a-text value="CRANE" position="-0.08 0.035 0.06" scale="0.08 0.08 0.08" color="#9CA3AF"></a-text>
                <a-text value="READY" position="0.05 0.035 0.06" scale="0.08 0.08 0.08" color="#9CA3AF"></a-text>
              </a-entity>` : `
              <a-entity id="control-panel-placeholder" visible="false">`}
              </a-entity>
              
              <!-- Tool selection aura -->
              ${toolSelected ? `
              <a-ring 
                position="0 -0.35 -1.5" 
                radius-inner="0.28" 
                radius-outer="0.32"
                rotation="-90 0 0"
                color="#60A5FA"
                material="opacity: 0.5; transparent: true; emissive: #60A5FA; emissiveIntensity: 1; side: double"
                animation="property: scale; to: 1.1 1.1 1.1; dur: 1000; easing: easeInOutSine; loop: true; dir: alternate"
              ></a-ring>` : ''}

              <!-- Angle Guide Line - glowing -->
              ${currentStepData.overlays.filter(o => o.type === 'line').map((overlay, idx) => `
                <a-cylinder 
                  position="${toolSelected ? '0.15 -0.35 -1.5' : '0.55 -0.33 -1.5'}"
                  radius="0.008" 
                  height="0.35" 
                  color="#FBBF24"
                  rotation="0 0 ${overlay.angle || 20}"
                  material="emissive: #FBBF24; emissiveIntensity: 0.6; opacity: 0.8; transparent: true"
                  animation="property: material.emissiveIntensity; to: 0.3; dur: 1000; easing: easeInOutSine; loop: true; dir: alternate"
                ></a-cylinder>
                <a-text 
                  value="${overlay.angle || 20}°" 
                  position="${toolSelected ? '0.35 -0.2 -1.5' : '0.75 -0.18 -1.5'}" 
                  scale="0.15 0.15 0.15" 
                  color="#FBBF24"
                  material="emissive: #FBBF24; emissiveIntensity: 0.5"
                ></a-text>
              `).join('')}

              <!-- Motion Path Arrow - stylized -->
              ${currentStepData.overlays.filter(o => o.type === 'arrow').map((overlay, idx) => `
                <a-cone 
                  position="0.65 -0.33 -1.5"
                  radius-bottom="0.06" 
                  radius-top="0" 
                  height="0.12"
                  color="#3B82F6"
                  rotation="0 0 -90"
                  material="emissive: #3B82F6; emissiveIntensity: 0.4"
                  animation="property: position; to: 0.75 -0.33 -1.5; dur: 800; easing: easeInOutSine; loop: true; dir: alternate"
                ></a-cone>
              `).join('')}


              </a-entity>

              <!-- Lighting - cool industrial -->
              <a-light type="ambient" color="#D1D5DB" intensity="0.5"></a-light>
              <a-light type="directional" color="#FFFFFF" intensity="0.7" position="-1 2.5 1.5"></a-light>
              <a-light type="directional" color="#BFDBFE" intensity="0.3" position="1 0.5 -0.5"></a-light>
              <a-light type="point" color="#3B82F6" intensity="0.15" position="0.5 0.5 -1" distance="3"></a-light>
              <a-light type="point" color="#FBBF24" intensity="0.1" position="-0.5 0.3 -1.2" distance="2"></a-light>
            </a-scene>
          `
          }}
        />
      </div>

    </>
  );
};

export default ARPracticeSceneComponent;
