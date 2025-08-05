import React, { useEffect, useState } from "react";

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // On iOS, show instructions instead (no prompt)
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const handleClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent opening the book
    e.stopPropagation();
    
    if (isIOS) {
      window.alert('To install PorkChop on iOS, tap the Share icon in Safari, then choose "Add to Home Screen".');
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  return (
    <button
      className="landing-nav-btn install-app-btn"
      onClick={handleClick}
      type="button"
    >
      Install App
    </button>
  );
};

export default InstallPWAButton;
