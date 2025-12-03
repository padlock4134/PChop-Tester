import { useEffect, useRef, useState, useCallback } from 'react';

// MediaPipe types (loaded via CDN)
declare global {
  interface Window {
    Pose: any;
    Camera: any;
  }
}

interface PoseTrackingResult {
  // Normalized wrist X position (0 = left side of screen, 1 = right side)
  rightWristX: number;
  // Whether tracking is active
  isTracking: boolean;
  // Whether pose is detected
  poseDetected: boolean;
  // Error message if any
  error: string | null;
  // Start tracking
  startTracking: () => void;
  // Stop tracking
  stopTracking: () => void;
  // Video element ref for displaying camera feed (optional)
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const usePoseTracking = (): PoseTrackingResult => {
  const [rightWristX, setRightWristX] = useState(0.5); // Start centered
  const [isTracking, setIsTracking] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationFrameRef = useRef<number>();
  
  // Smoothing for wrist position (prevents jitter)
  const smoothedWristX = useRef(0.5);
  const SMOOTHING_FACTOR = 0.3; // Lower = smoother but slower response
  
  const onPoseResults = useCallback((results: any) => {
    if (results.poseLandmarks) {
      setPoseDetected(true);
      
      // Landmark 16 = right wrist (from camera's perspective, so it's user's right hand)
      const rightWrist = results.poseLandmarks[16];
      
      if (rightWrist) {
        // rightWrist.x is normalized 0-1 (0 = left edge of camera, 1 = right edge)
        // We invert it because camera is mirrored
        const rawX = 1 - rightWrist.x;
        
        // Apply smoothing
        smoothedWristX.current = smoothedWristX.current + (rawX - smoothedWristX.current) * SMOOTHING_FACTOR;
        
        setRightWristX(smoothedWristX.current);
      }
    } else {
      setPoseDetected(false);
    }
  }, []);
  
  const startTracking = useCallback(async () => {
    try {
      // Check if MediaPipe is loaded
      if (!window.Pose) {
        setError('MediaPipe not loaded. Please refresh the page.');
        return;
      }
      
      // Initialize Pose
      const pose = new window.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        }
      });
      
      pose.setOptions({
        modelComplexity: 0, // 0 = lite (fastest), 1 = full, 2 = heavy
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      pose.onResults(onPoseResults);
      poseRef.current = pose;
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      // Create video element if not provided
      const video = videoRef.current || document.createElement('video');
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      await video.play();
      
      // Start processing frames
      const processFrame = async () => {
        if (poseRef.current && video.readyState >= 2) {
          await poseRef.current.send({ image: video });
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
      };
      
      processFrame();
      setIsTracking(true);
      setError(null);
      
    } catch (err: any) {
      console.error('Pose tracking error:', err);
      setError(err.message || 'Failed to start camera');
      setIsTracking(false);
    }
  }, [onPoseResults]);
  
  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    
    setIsTracking(false);
    setPoseDetected(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);
  
  return {
    rightWristX,
    isTracking,
    poseDetected,
    error,
    startTracking,
    stopTracking,
    videoRef
  };
};

export default usePoseTracking;
