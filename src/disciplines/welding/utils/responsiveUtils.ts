import { useEffect, useState } from 'react';

// Device types
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Hook to detect device type and screen size
export const useDeviceDetect = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    // Function to update dimensions and device type
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWidth(width);
      setHeight(height);
      
      // Determine device type based on screen width
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Set initial dimensions
    updateDimensions();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateDimensions);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return { deviceType, width, height };
};

// Helper function to get device-specific class names
export const getResponsiveClasses = (deviceType: DeviceType) => {
  const baseClasses = 'mx-auto';
  
  switch (deviceType) {
    case 'mobile':
      return `${baseClasses} w-full px-2`;
    case 'tablet':
      return `${baseClasses} w-full max-w-2xl px-4`;
    case 'desktop':
    default:
      return `${baseClasses} w-full max-w-5xl px-4`;
  }
};

// Helper function to check if the device is in portrait orientation
export const isPortraitOrientation = () => {
  return window.matchMedia('(orientation: portrait)').matches;
};

// Helper function to get viewport dimensions
export const getViewportDimensions = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};
