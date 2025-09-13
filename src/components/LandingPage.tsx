import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

import TermsModal from './TermsModal';
import { useTermsModal } from './useTermsModal';
import InstallPWAButton from "./InstallPWAButton";
import TestRunButton from "./TestRunButton";
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
          <TestRunButton />
          <InstallPWAButton />
          <Link to="/AboutUs" className="landing-nav-btn mobile about-us-btn">About Us</Link>
          <Link to="/KitchenComebacks" className="landing-nav-btn mobile kitchen-comebacks-btn">Podcast</Link>
          <Link to="/TenantWellness" className="landing-nav-btn mobile tenant-wellness-btn">Provisions</Link>
          <Link to="/Pricing" className="landing-nav-btn mobile pricing-btn">Pricing</Link>
          <div className="mobile-auth-buttons">
            <a href={wristbandConsumerLoginUrl} className="landing-nav-btn mobile" rel="noopener noreferrer">Sign In</a>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div className="trial-text">FREE TRIAL</div>
              <a href={wristbandConsumerSignupUrl} className="landing-nav-btn primary mobile signup-btn" rel="noopener noreferrer">
                Sign Up
              </a>
            </div>
          </div>
        </nav>
      );
    }
    
    return (
      <nav className="landing-nav-column">
        <TestRunButton />
        <InstallPWAButton />
        <Link to="/AboutUs" className="landing-nav-btn about-us-btn">Who We Are</Link>
        <Link to="/KitchenComebacks" className="landing-nav-btn kitchen-comebacks-btn">PorkChop Podcast</Link>
        <Link to="/TenantWellness" className="landing-nav-btn tenant-wellness-btn">Our Prime Cuts</Link>
        <Link to="/Pricing" className="landing-nav-btn pricing-btn">Pricing</Link>
        <a href={wristbandConsumerLoginUrl} className="landing-nav-btn" rel="noopener noreferrer">Sign In</a>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div className="trial-text">FREE TRIAL</div>
          <a href={wristbandConsumerSignupUrl} className="landing-nav-btn primary signup-btn" rel="noopener noreferrer">
            Sign Up
          </a>
        </div>
      </nav>
    );
  };
  
  return (
    <div className={`landing-root bg-sand font-retro min-h-screen flex flex-col device-${deviceType}`}>
      <main className="landing-main flex-1 flex flex-col items-center justify-center px-4">
        <section className={`landing-content-wrapper ${deviceType === 'mobile' ? 'mobile-layout' : 'desktop-layout'}`}>
          <div className={`cookbook-wrapper ${deviceType === 'mobile' ? 'mobile' : ''}`}>
            <FlippableCookbook />
          </div>
          {deviceType !== 'mobile' && renderNavigation()}
        </section>
        
        {deviceType === 'mobile' && renderNavigation()}
        
        <div style={{ 
          marginTop: deviceType === 'mobile' ? '1rem' : '2rem', 
          textAlign: 'center', 
          paddingBottom: deviceType === 'mobile' ? '1rem' : '2rem' 
        }}>
          <span style={{ 
            fontSize: deviceType === 'mobile' ? '0.75rem' : '0.85rem', 
            color: '#2a4d69' 
          }}>
            {new Date().getFullYear()} PorkChop. All rights reserved.<br></br>{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setModalOpen(true)}>Terms of Service</span>
            {' '}|{' '}
            <a href="/investment.html" style={{ textDecoration: 'underline', color: '#2a4d69' }}>Investment</a>
            {' '}|{' '}
            <a href="/careers.html" style={{ textDecoration: 'underline', color: '#2a4d69' }}>Careers</a>
          </span>
        </div>
        <TermsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} termsContent={termsContent} />
      </main>
    </div>
  );
};

export default LandingPage;
