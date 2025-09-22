import React, { useState, memo, FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import TermsModal from './TermsModal';
import { useTermsModal } from './useTermsModal';
import InstallPWAButton from "./InstallPWAButton";
import TestRunButton from "./TestRunButton";
import FlippableCookbook from "./FlippableCookbook";
import { useDeviceDetect, getResponsiveClasses } from '../utils/responsiveUtils';

// Extend form attributes to include Netlify's custom attributes
declare module 'react' {
  interface FormHTMLAttributes<T> extends React.HTMLAttributes<T> {
    'data-netlify'?: boolean | string;
    'data-netlify-honeypot'?: string;
    'netlify-honeypot'?: string;
    netlify?: boolean | string;
  }
}

interface FormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  preferredTime: string;
}

const DemoRequestForm = memo(({ onSubmit, onClose }: { onSubmit: (data: FormData) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    preferredTime: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const form = e.currentTarget;
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form) as any).toString()
      });
      
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({
          name: '',
          company: '',
          email: '',
          phone: '',
          preferredTime: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#2a4d69'
      }}>
        <h3 style={{
          color: '#e94e3c',
          fontSize: '1.5rem',
          marginBottom: '1rem'
        }}>Thank You!</h3>
        <p style={{
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}>We'll be in touch soon to schedule your demo.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', position: 'relative' }}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: '#6c757d',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          lineHeight: 1,
          transition: 'color 0.2s, background-color 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#e94e3c';
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#6c757d';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label="Close modal"
      >
        ×
      </button>
      <p style={{
        textAlign: 'center',
        color: '#e94e3c',
        marginBottom: '2rem',
        fontSize: '1.05rem',
        lineHeight: 1.6,
        fontWeight: '600'
      }}>
        Let's find a time to collaborate!
      </p>
      <form 
        name="demo-request"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        netlify-honeypot="bot-field"
        netlify
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxWidth: '500px',
          margin: '0 auto'
        }}
      >
        <input type="hidden" name="form-name" value="demo-request" />
        <p className="hidden">
          <label>Don't fill this out if you're human: <input name="bot-field" /></label>
        </p>
        <div>
          <label htmlFor="name" style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500'
          }}>Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem',
              transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
            }}
          />
        </div>
        <div>
          <label htmlFor="company" style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500'
          }}>Company</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem',
              transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
            }}
          />
        </div>
        <div>
          <label htmlFor="email" style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500'
          }}>Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem',
              transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
            }}
          />
        </div>
        <div>
          <label htmlFor="phone" style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500'
          }}>Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem',
              transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
            }}
          />
        </div>
        <div>
          <label htmlFor="preferredTime" style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500'
          }}>Preferred Date/Time</label>
          <input
            type="text"
            id="preferredTime"
            name="preferredTime"
            value={formData.preferredTime}
            onChange={handleChange}
            placeholder="e.g., Next Tuesday at 2 PM"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '1rem',
              transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
            }}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="submit" 
            style={{
              backgroundColor: '#e94e3c',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              width: '100%',
              maxWidth: '200px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#d84315';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#e94e3c';
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
});

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

const LandingPage: React.FC = () => {
  const { modalOpen, setModalOpen, termsContent } = useTermsModal();
  const { deviceType } = useDeviceDetect();
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  const handleDemoSubmit = (formData: FormData) => {
    console.log('Demo requested:', formData);
    // Form submission is handled in the DemoRequestForm component
  };

  // Render different navigation based on device type
  const renderNavigation = () => {
    if (deviceType === 'mobile') {
      return (
        <nav className="landing-nav-mobile">
          <div className="mobile-nav-top">
            <TestRunButton />
            <InstallPWAButton />
          </div>
          <div className="mobile-nav-links">
            <Link to="/AboutUs" className="landing-nav-btn about-us-btn">Who We Are</Link>
            <Link to="/KitchenComebacks" className="landing-nav-btn kitchen-comebacks-btn">Scars & Souffles</Link>
            <Link to="/TenantWellness" className="landing-nav-btn tenant-wellness-btn">For Educators</Link>
            <Link to="/Pricing" className="landing-nav-btn pricing-btn">Pricing</Link>
            <a href={wristbandConsumerLoginUrl} className="landing-nav-btn" rel="noopener noreferrer">Sign In</a>
            <button 
              onClick={() => setShowDemoModal(true)}
              className="landing-nav-btn primary book-demo-btn"
            >
              Book Demo
            </button>
          </div>
        </nav>
      );
    }
    
    return (
      <nav className="landing-nav-column">
        <TestRunButton />
        <InstallPWAButton />
        <Link to="/AboutUs" className="landing-nav-btn about-us-btn">Who We Are</Link>
        <Link to="/KitchenComebacks" className="landing-nav-btn kitchen-comebacks-btn">Scars & Souffles</Link>
        <Link to="/TenantWellness" className="landing-nav-btn tenant-wellness-btn">For Educators</Link>
        <Link to="/Pricing" className="landing-nav-btn pricing-btn">Pricing</Link>
        <a href={wristbandConsumerLoginUrl} className="landing-nav-btn" rel="noopener noreferrer">Sign In</a>
        <button 
          onClick={() => setShowDemoModal(true)}
          className="landing-nav-btn primary book-demo-btn"
        >
          Book Demo
        </button>
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
        
        {/* Demo Request Modal */}
        {showDemoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <DemoRequestForm 
                onSubmit={handleDemoSubmit} 
                onClose={() => setShowDemoModal(false)} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandingPage;
