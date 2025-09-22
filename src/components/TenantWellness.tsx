import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import "./TenantWellness.css";
import logo from '../images/logo.png';

const culinarySchoolBenefits = [
  {
    title: "🎓 Keener Focus",
    description: 'Students get basic technique questions answered at home by Chef Freddie instead of coming to class confused.'
  },
  {
    title: "🔪 Better Prep",
    description: "Students arrive having already practiced your recipes at home, ready to refine techniques rather than learn from scratch."
  },
  {
    title: "📱 Safety Conscious",
    description: "Students work through knife skills and heat techniques at home first, reducing accidents."
  },
  {
    title: "🏆 Maximized Lab",
    description: "Turn expensive kitchen lab time into skill refinement and advanced techniques since students practiced basics at home."
  },
  {
    title: "🌐 Consistent Standards",
    description: "Your teaching methods get reinforced through home practice, ensuring students learn YOUR techniques even outside class."
  },
  {
    title: "🍳 24/7 Learning",
    description: "Students maintain and build skills between lab sessions instead of forgetting techniques during gaps in hands-on instruction."
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
  const [demoForm, setDemoForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    preferredTime: ''
  });
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  
  // Toggle card flip state
  const toggleCardFlip = (index: number) => {
    setFlippedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) // Remove if exists (flip back)
        : [...prev, index] // Add if not exists (flip over)
    );
  };

  // Handle card click - toggle the flip state
  const handleCardClick = (index: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCardFlip(index);
  };

  // Handle keyboard navigation
  const handleKeyDown = (index: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleCardFlip(index);
    }
  };

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
            ← Back to Scars & Soufflés
          </Link>
          <Link to="/Pricing" className="tw-back-arrow" aria-label="Go to Pricing">
            ← Back to Pricing
          </Link>
        </div>
        <img src={logo} alt="PorkChop Logo" className="tw-logo" />
      </div>

      <section className="tw-hero">
        <h1 className="tw-title">PorkChop Provisions</h1>
        <p className="tw-tagline">Where culinary passion meets professional education and growth.</p>
      </section>

      <section className="tw-benefits-section">
        <div className="benefits-container" style={{
          background: '#f9fafb',
          borderRadius: '1rem',
          boxShadow: '0 4px 16px rgba(42,77,105,0.09)',
          border: '2px solid #63ace5',
          padding: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          marginTop: '.3rem',
          marginBottom: '2rem'
        }}>
          <h2 className="tw-section-title" style={{
            textAlign: 'center',
            color: '#2a4d69',
            marginBottom: '1.5rem',
            fontSize: '1.75rem',
            fontWeight: '600'
          }}>What Teachers Love</h2>
          <div className="tw-benefits-grid">
            {culinarySchoolBenefits.map((benefit, index) => {
              const emojiMatch = benefit.title.match(/^([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1F0}-\u{1F1FF}\u{1F1E0}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F0CF}]\s*)/u);
              const emoji = emojiMatch ? emojiMatch[1].trim() : '';
              const titleWithoutEmoji = benefit.title.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1F0}-\u{1F1FF}\u{1F1E0}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F0CF}]\s*/u, '').trim();
              
              return (
                <div 
                  key={index} 
                  className={`tw-benefit-card ${flippedCards.includes(index) ? 'flipped' : ''}`}
                  onClick={handleCardClick(index)}
                  onKeyDown={handleKeyDown(index)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={flippedCards.includes(index)}
                  aria-label={`${titleWithoutEmoji}. Click to ${flippedCards.includes(index) ? 'show front' : 'learn more'}`}
                >
                  <div className="tw-benefit-card-inner">
                    <div className="tw-benefit-card-front">
                      <h3>{titleWithoutEmoji}</h3>
                      {emoji && <div className="tw-benefit-emoji">{emoji}</div>}
                      <div className="tw-flip-hint">
                        {flippedCards.includes(index) ? '← Click to return' : 'Click to learn more →'}
                      </div>
                    </div>
                    <div className="tw-benefit-card-back">
                      <p>{benefit.description}</p>
                      <div className="tw-flip-hint">
                        ← Click to return
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="tw-footer">
        <h2>Lets Get Started!</h2>
        <p className="tw-footer-tagline">Our culinary companion is the perfect every day 'perk me up'.</p>
        <div className="tw-footer-buttons">
          <button onClick={() => setShowDemoModal(true)} className="tw-footer-btn tw-schedule-demo">Book a Call</button>
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
