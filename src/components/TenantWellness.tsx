import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PuzzlePieceIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import "./LandingPage.css";
import "./TenantWellness.css";
import logo from '../images/logo.png';

const partnershipBenefits = [
  {
    title: "🔄 Seamless Integration",
    description: "PorkChop's API-first architecture allows for easy integration with your existing systems. Our flexible platform connects with your tech stack, whether you're a marketplace, SaaS provider, or technology platform."
  },
  {
    title: "🚀 Expanded Offerings",
    description: "Enhance your product portfolio with PorkChop's culinary AI capabilities. Give your customers access to personalized cooking assistance, recipe recommendations, and skill-building tools without building these features from scratch."
  },
  {
    title: "💼 New Revenue Streams",
    description: "Create additional value for your customers and unlock new monetization opportunities. Our partnership models include revenue sharing, white-label solutions, and customized integration options to fit your business model."
  },
  {
    title: "🔍 Customer Insights",
    description: "Gain valuable data on food preferences, cooking habits, and engagement patterns. Our analytics dashboard provides partners with actionable insights while maintaining end-user privacy and data security."
  },
  {
    title: "🌐 Market Expansion",
    description: "Reach new customer segments and markets by adding culinary technology to your offering. PorkChop helps you differentiate in competitive markets and appeal to food-conscious consumers across demographics."
  },
  {
    title: "🛠️ Developer Resources",
    description: "Access comprehensive documentation, SDKs, and dedicated support to make integration smooth and efficient. Our partnership team provides technical assistance throughout the implementation process."
  }
];

const culinarySchoolBenefits = [
  {
    title: "🎓 Enhanced Learning Experience",
    description: "Supplement traditional culinary education with AI-driven personalized guidance. PorkChop works alongside your existing curriculum to reinforce classroom learning, not replace it—ensuring quality education while accelerating skill development."
  },
  {
    title: "🔪 Practical Skill Development",
    description: "Students can practice techniques taught by instructors at their own pace with step-by-step visual guidance. Our platform provides additional practice opportunities that complement hands-on classroom instruction—preserving quality while improving efficiency."
  },
  {
    title: "📱 Modern Educational Tools",
    description: "Bring your culinary program into the digital age with a tech platform that enhances traditional teaching methods. Our tools work in harmony with instructor expertise, creating a blended learning approach that maintains educational quality."
  },
  {
    title: "📊 Progress Tracking & Analytics",
    description: "Gain valuable insights into student performance and engagement without sacrificing personalized instruction. Instructors can use data to tailor their teaching, identifying where students need additional hands-on guidance."
  },
  {
    title: "🌐 Remote Learning Support",
    description: "Extend your classroom's reach while maintaining educational quality. Our platform bridges the gap between in-person and remote learning, ensuring consistent instruction that complements—never replaces—the irreplaceable value of hands-on teaching."
  },
  {
    title: "🍳 Industry-Ready Graduates",
    description: "Prepare students for professional kitchens with a tool that reinforces the techniques taught by your expert instructors. Graduates enter the workforce with the perfect blend of traditional culinary education and modern technological proficiency."
  }
];

// Helper function to handle whitepaper download
const downloadWhitepaper = (filePath: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const PartnershipsModal = ({ onClose, onScheduleDemo }) => (
  <div className="tw-modal-large">
    <div className="tw-modal-content-large">
      <button className="tw-modal-close-large" onClick={onClose}>×</button>
      <section className="tw-hero">
        <h1 className="tw-title">Strategic Partnerships</h1>
        <p className="tw-tagline">Integrate culinary AI into your platform and marketplace</p>
      </section>
      
      <section className="tw-description">
        <p>In today's digital ecosystem, <strong>partnerships and integrations</strong> are key to delivering comprehensive solutions to end users. PorkChop's culinary AI platform offers powerful capabilities that can enhance your existing products and services. Whether you're a marketplace looking to add food-related features, a technology platform seeking culinary content, or an integration partner wanting to expand your offering, our flexible API and partnership models make it easy to bring cooking intelligence to your users.</p>
        <blockquote className="tw-quote">"PorkChop's partnership program allows you to tap into the growing demand for personalized culinary experiences without building these capabilities from scratch."</blockquote>
      </section>
      
      <section className="tw-amenities">
        <h2>
          <span role="img" aria-label="Puzzle Piece"></span> 
          Why Partner with PorkChop
        </h2>
        <div className="tw-amenities-grid">
          {partnershipBenefits.map((benefit, index) => {
            const emoji = benefit.title.substring(0, 2);
            const title = benefit.title.substring(3);
            return (
              <div className="tw-amenity-card" key={benefit.title}>
                <div className="tw-amenity-card-inner">
                  <div className="tw-amenity-card-front">
                    <h3>
                      {title}
                    </h3>
                    <div className="emoji-icon">
                      <span role="img" aria-label="Icon">{emoji}</span>
                    </div>
                  </div>
                  <div className="tw-amenity-card-back">
                    <p>{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      
      <section className="tw-contact">
        <h2>Become a PorkChop Partner</h2>
        <p>Explore how our culinary AI can enhance your platform and create new opportunities</p>
        <div className="tw-contact-options">
          <button 
            onClick={(e) => {
              e.preventDefault();
              downloadWhitepaper(
                '/porkchop-partnerships.pdf',
                'PorkChop-Partnerships-Overview.pdf'
              );
            }} 
            className="tw-contact-btn"
          >
            Partnership & Integration Guide
          </button>
        </div>
      </section>
    </div>
  </div>
);

const CulinarySchoolModal = ({ onClose, onScheduleDemo }) => (
  <div className="tw-modal-large">
    <div className="tw-modal-content-large">
      <button className="tw-modal-close-large" onClick={onClose}>×</button>
      <section className="tw-hero">
        <h1 className="tw-title">Elevate Culinary Education</h1>
        <p className="tw-tagline">Transform how students learn, practice, and master culinary skills.</p>
      </section>

      <section className="tw-description">
        <p>Today's culinary students need more than just classroom instruction. They require consistent practice, personalized feedback, and modern tools that reflect the evolving food industry. PorkChop bridges the gap between traditional culinary education and digital innovation, providing students with an AI-powered companion that <strong>augments instructor expertise</strong>, builds confidence, and accelerates skill development—without sacrificing the quality and depth of traditional culinary training.</p>
        <blockquote className="tw-quote">"PorkChop is the digital teaching assistant that extends your culinary curriculum beyond the classroom walls, enhancing—never replacing—the irreplaceable value of expert instruction."</blockquote>
      </section>

      <section className="tw-amenities">
        <h2>
          <span role="img" aria-label="Academic Cap"></span> 
          Why PorkChop for Culinary Schools
        </h2>
        <div className="tw-amenities-grid">
          {culinarySchoolBenefits.map((benefit) => {
            const emoji = benefit.title.substring(0, 2);
            const title = benefit.title.substring(3);
            return (
              <div className="tw-amenity-card" key={benefit.title}>
                <div className="tw-amenity-card-inner">
                  <div className="tw-amenity-card-front">
                    <h3>{title}</h3>
                    <div className="emoji-icon">
                      <span role="img" aria-label="Icon">{emoji}</span>
                    </div>
                  </div>
                  <div className="tw-amenity-card-back">
                    <p>{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tw-contact">
        <h2>Partner with PorkChop</h2>
        <p>Enhance your culinary curriculum with our innovative digital platform.</p>
        <div className="tw-contact-options">
          <button 
            onClick={(e) => {
              e.preventDefault();
              downloadWhitepaper(
                '/porkchop-whitepaper.pdf',
                'PorkChop-Culinary-Education-Guide.pdf'
              );
            }} 
            className="tw-contact-btn"
          >
            The Recipe for Culinary Education Success
          </button>
        </div>
      </section>
    </div>
  </div>
);

const TenantWellness: React.FC = () => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [activeModal, setActiveModal] = useState<'partnerships' | 'culinary' | null>(null);
  const [demoForm, setDemoForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    preferredTime: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDemoForm({
      ...demoForm,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the form element
    const form = e.target as HTMLFormElement;
    
    // Create form data object
    const formData = new FormData(form);
    formData.append('form-name', 'demo-request');
    
    // Add all form fields
    Object.entries(demoForm).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    try {
      // Submit to Netlify
      const response = await fetch('/', {
        method: 'POST',
        body: new URLSearchParams(formData as any).toString(),
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Reset form and show thank you modal
      setDemoForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        preferredTime: ''
      });
      setShowDemoModal(false);
      setShowThankYouModal(true);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again.');
    }
  };

  return (
    <div className="tw-page-container">
      <div className="tw-header">
        <Link 
          to="/" 
          className="back-arrow" 
          style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>←</span>
        </Link>
        <div className="tw-nav-links">
          <Link to="/" className="tw-back-arrow" aria-label="Back to Home">
            ← Back to Home
          </Link>
          <Link to="/AboutUs" className="tw-back-arrow" aria-label="Back to About Us">
            ← Back to About Us
          </Link>
          <Link to="/KitchenComebacks" className="tw-back-arrow" aria-label="Back to Kitchen Comebacks">
            ← Back to Kitchen Comebacks
          </Link>
          <Link to="/Pricing" className="tw-back-arrow" aria-label="Go to Pricing">
            ← Back to Pricing
          </Link>
        </div>
        <img src={logo} alt="PorkChop Logo" className="tw-logo" />
      </div>

      <section className="tw-hero">
        <h1 className="tw-title">PorkChop Provisions</h1>
        <p className="tw-tagline">Blending tradition with modern culinary experiences for everyone.</p>
      </section>

      <div className="tw-verticals-container">
        <div className="tw-vertical-card" onClick={() => setActiveModal('partnerships')}>
          <div className="tw-icon-container">
            <PuzzlePieceIcon className="tw-card-icon text-blue-600" />
          </div>
          <div className="tw-card-content">
            <h3>Partnerships</h3>
            <p>Integrate our culinary AI into your marketplace or platform.</p>
          </div>
        </div>
        <div className="tw-vertical-card" onClick={() => setActiveModal('culinary')}>
          <div className="tw-icon-container">
            <AcademicCapIcon className="tw-card-icon text-green-600" />
          </div>
          <div className="tw-card-content">
            <h3>Culinary Education</h3>
            <p>Enhance your culinary school with modern learning tools.</p>
          </div>
        </div>
      </div>

      {activeModal === 'partnerships' && 
        <PartnershipsModal 
          onClose={() => setActiveModal(null)} 
          onScheduleDemo={() => setShowDemoModal(true)} 
        />
      }

      {activeModal === 'culinary' && 
        <CulinarySchoolModal 
          onClose={() => setActiveModal(null)} 
          onScheduleDemo={() => setShowDemoModal(true)} 
        />
      }

      <section className="tw-footer">
        <h2>Lets Get Started!</h2>
        <p className="tw-footer-tagline">Our culinary companion is the perfect every day 'perk me up'.</p>
        <div className="tw-footer-buttons">
          <button onClick={() => setShowDemoModal(true)} className="tw-footer-btn tw-schedule-demo">Book a Call</button>
          <button onClick={() => setShowVideoModal(true)} className="tw-footer-btn tw-learn-more">Watch Demo</button>
        </div>
      </section>

      {showVideoModal && (
        <div className="tw-modal">
          <div className="tw-modal-content" style={{ maxWidth: '800px', padding: '20px' }}>
            <button className="tw-modal-close" onClick={() => setShowVideoModal(false)}>×</button>
            <h2 style={{ 
              color: '#e94e3c', 
              textAlign: 'center', 
              marginBottom: '10px',
              fontSize: '2rem',
              fontFamily: "'Bree Serif', serif"
            }}></h2>
            <p style={{ 
              color: '#2a4d69', 
              textAlign: 'center', 
              marginBottom: '25px',
              fontSize: '1.1rem',
              fontWeight: 500
            }}>
            </p>
            
            <p style={{
              textAlign: 'center',
              marginBottom: '20px',
              color: '#2a4d69',
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              Watch how our platform transforms your cooking experience.
            </p>
            
            <div style={{
              width: '100%',
              margin: '10px 0',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '2px solid #2a4d69'
            }}>
              <video 
                className="demo-video" 
                controls 
                autoPlay 
                style={{ width: '100%' }}
                onPlay={(e) => { e.currentTarget.volume = 0.5; }}
              >
                <source src="/PorkChop - Google Chrome 2025-06-28 12-15-21.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {showDemoModal && (
        <div className="tw-modal">
          <div className="tw-modal-content">
            <button className="tw-modal-close" onClick={() => setShowDemoModal(false)} style={{ position: 'absolute', top: '10px', right: '10px' }}>×</button>
            <h2></h2>
            <form 
              name="demo-request"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
              netlify-honeypot="bot-field"
            >
              <input type="hidden" name="form-name" value="demo-request" />
              <p hidden>
                <label>Don't fill this out if you're human: <input name="bot-field" /></label>
              </p>
              <label>
                Name:
                <input type="text" name="name" value={demoForm.name} onChange={handleInputChange} required />
              </label>
              <label>
                Company Name:
                <input type="text" name="company" value={demoForm.company} onChange={handleInputChange} required />
              </label>
              <label>
                Email:
                <input type="email" name="email" value={demoForm.email} onChange={handleInputChange} required />
              </label>
              <label>
                Phone:
                <input type="tel" name="phone" value={demoForm.phone} onChange={handleInputChange} required />
              </label>
              <label>
                Preferred Date & Time:
                <input 
                  type="datetime-local" 
                  name="preferredTime" 
                  value={demoForm.preferredTime}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)} // Prevent selecting past dates
                  required 
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginTop: '5px'
                  }}
                />
              </label>
              <button type="submit">Schedule Call</button>
            </form>
          </div>
        </div>
      )}

      {/* Thank You Modal */}
      {showThankYouModal && (
        <div className="tw-modal">
          <div className="tw-modal-content" style={{ textAlign: 'center', padding: '2rem' }}>
            <button 
              className="tw-modal-close" 
              onClick={() => setShowThankYouModal(false)}
              style={{ position: 'absolute', top: '10px', right: '10px' }}
            >
              ×
            </button>
            <h2 style={{ color: '#e94e3c', marginBottom: '1rem' }}>Thank You!</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Your request has been submitted successfully. We'll be in touch shortly to schedule your call.
            </p>
            <button 
              onClick={() => setShowThankYouModal(false)}
              style={{
                backgroundColor: '#e94e3c',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantWellness;
