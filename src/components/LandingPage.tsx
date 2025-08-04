import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

import TermsModal from './TermsModal';
import { useTermsModal } from './useTermsModal';
import InstallPWAButton from "./InstallPWAButton";
import FlippableCookbook from "./FlippableCookbook";
import { useDeviceDetect, getResponsiveClasses } from '../utils/responsiveUtils';

const wristbandConsumerLoginUrl = (import.meta as any).env.VITE_WRISTBAND_CONSUMER_LOGIN_URL;
const wristbandConsumerSignupUrl = (import.meta as any).env.VITE_WRISTBAND_CONSUMER_SIGNUP_URL;

// Placeholder SVG for Freddie (replace with your vector when ready)
const FreddieSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" aria-label="Grandpa Freddie" style={{marginBottom: '1rem'}}>
    <circle cx="40" cy="40" r="38" fill="#f9fafb" stroke="#63ace5" strokeWidth="4"/>
    <ellipse cx="40" cy="50" rx="22" ry="18" fill="#e94e3c" opacity="0.13"/>
    <circle cx="40" cy="38" r="20" fill="#f5e9da" stroke="#2a4d69" strokeWidth="2"/>
    <ellipse cx="40" cy="44" rx="12" ry="8" fill="#fff"/>
    <circle cx="32" cy="38" r="2.5" fill="#2a4d69"/>
    <circle cx="48" cy="38" r="2.5" fill="#2a4d69"/>
    <path d="M34 48 Q40 54 46 48" stroke="#2a4d69" strokeWidth="2" fill="none"/>
  </svg>
);

const RecipeCard = ({ title, icon, children }: { title: string, icon?: string, children: React.ReactNode }) => (
  <section className="recipe-card bg-weatheredWhite rounded-2xl shadow-lg border-2 border-seafoam mb-8 p-7 max-w-xl mx-auto">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <h2 className="text-xl font-retro font-bold text-maineBlue">{title}</h2>
    </div>
    <div className="recipe-content text-navy font-sans">{children}</div>
  </section>
);

// Add deferredPrompt to Window interface
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

const LandingPage: React.FC = () => {
  const { modalOpen, setModalOpen, termsContent } = useTermsModal();
  const { deviceType } = useDeviceDetect();
  
  // Render different navigation based on device type
  const renderNavigation = () => {
    if (deviceType === 'mobile') {
      return (
        <nav className="landing-nav-row mobile">
          <Link to="/AboutUs" className="landing-nav-btn mobile">About Us</Link>
          <Link to="/KitchenComebacks" className="landing-nav-btn mobile">Kitchen Comebacks</Link>
          <div className="mobile-auth-buttons">
            <a href={wristbandConsumerLoginUrl} className="landing-nav-btn mobile" rel="noopener noreferrer">Sign In</a>
            <a href={wristbandConsumerSignupUrl} className="landing-nav-btn primary mobile" rel="noopener noreferrer">Sign Up</a>
          </div>
        </nav>
      );
    }
    
    return (
      <nav className="landing-nav-row">
        <Link to="/AboutUs" className="landing-nav-btn primary">About Us</Link>
        <Link to="/KitchenComebacks" className="landing-nav-btn">Kitchen Comebacks</Link>
        <a href={wristbandConsumerLoginUrl} className="landing-nav-btn" rel="noopener noreferrer">Sign In</a>
        <a href={wristbandConsumerSignupUrl} className="landing-nav-btn primary" rel="noopener noreferrer">Sign Up</a>
      </nav>
    );
  };
  
  return (
    <div className={`landing-root bg-sand font-retro min-h-screen flex flex-col device-${deviceType}`}>
      <main className="landing-main flex-1 flex flex-col items-center justify-center px-4">
        {renderNavigation()}
        <section className={`flex flex-col items-center justify-center w-full ${deviceType === 'mobile' ? 'mt-2' : 'mt-12'}`} style={{ margin: deviceType === 'mobile' ? '1rem 0 1rem' : '3rem 0 1rem' }}>
          <div className={`cookbook-wrapper ${deviceType === 'mobile' ? 'mobile' : ''}`}>
            <FlippableCookbook />
          </div>
        </section>
        <div style={{ 
          marginTop: deviceType === 'mobile' ? '1rem' : '2rem', 
          textAlign: 'center', 
          paddingBottom: deviceType === 'mobile' ? '1rem' : '2rem' 
        }}>
          <span style={{ 
            fontSize: deviceType === 'mobile' ? '0.75rem' : '0.85rem', 
            color: '#2a4d69' 
          }}>
            {new Date().getFullYear()} PorkChop. All rights reserved. |{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setModalOpen(true)}>Terms of Service</span>
          </span>
        </div>
        <TermsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} termsContent={termsContent} />
      </main>
    </div>
  );
};

export default LandingPage;
