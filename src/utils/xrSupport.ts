interface XRNavigator extends Navigator {
  xr?: {
    isSessionSupported?: (mode: string) => Promise<boolean>;
  };
}

export async function canUseImmersiveVR(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const xrNavigator = navigator as XRNavigator;

  if (!xrNavigator.xr?.isSessionSupported) {
    return false;
  }

  try {
    return await xrNavigator.xr.isSessionSupported('immersive-vr');
  } catch {
    return false;
  }
}
