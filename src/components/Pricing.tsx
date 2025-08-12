import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // Shared styles
import "./Pricing.css";     // New styles for this page
import logo from '/logo.png';

// This URL should direct users to your signup page.
const wristbandConsumerSignupUrl = (import.meta as any).env.VITE_WRISTBAND_CONSUMER_SIGNUP_URL;

const pricingTiers = [
  {
    title: "The Home Cook",
    price: "What? 10.99?",
    features: [
      "Monthly unlimited recipes",
      "AI-powered pantry scanning",
      "Personalized meal planning",
      "Basic cooking tutorials",
      "Community recipe sharing",
      "Smart technique building"
    ],
    cta: "Start Your Journey"
  },
  {
    title: "PorkChop Perks",
    price: "Just Ask!",
    features: [
      "Wholesale costs for partners",
      "White-label branding options",
      "Dedicated partner support",
      "API access for integration",
      "Bulk account management",
      "Custom auto provisioning"
    ],
    cta: "Let's Get Perk'd",
    popular: true
  }
];

const DemoRequestForm = memo(({ onSubmit, onClose }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    preferredTime: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    onSubmit(formData);
  };

  return (
    <form 
      name="demo-request"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      netlify-honeypot="bot-field"
      netlify
    >
      <input type="hidden" name="form-name" value="demo-request" />
      <p className="hidden">
        <label>Don't fill this out if you're human: <input name="bot-field" /></label>
      </p>
      <label>
        Name:
        <input 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
        />
      </label>
      <label>
        Company Name:
        <input 
          type="text" 
          name="company" 
          value={formData.company} 
          onChange={handleChange} 
          required 
        />
      </label>
      <label>
        Email:
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
        />
      </label>
      <label>
        Phone:
        <input 
          type="tel" 
          name="phone" 
          value={formData.phone} 
          onChange={handleChange} 
          required 
        />
      </label>
      <label>
        Preferred Date & Time:
        <input 
          type="datetime-local" 
          name="preferredTime" 
          value={formData.preferredTime}
          onChange={handleChange}
          min={new Date().toISOString().slice(0, 16)}
          required 
        />
      </label>
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button type="submit" className="tw-contact-btn">Schedule Call</button>
      </div>
    </form>
  );
});

const Pricing: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  
  const foodImages = [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', // 1. Grilled Steak
    'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=800', // 2. Asian - Sushi Rolls
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', // 3. Burger
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop&q=80', // 4. Breakfast
    'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&auto=format&fit=crop&q=80', // 5. Pizza
    'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg?auto=compress&cs=tinysrgb&w=800', // 6. Asian - Dumplings
    'https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?auto=compress&cs=tinysrgb&w=800', // 7. Asian - Ramen
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80', // 8. Ramen
    'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800', // 9. Asian - Pad Thai
    'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800&auto=format&fit=crop&q=80', // 10. Pasta
    'https://images.pexels.com/photos/725990/pexels-photo-725990.jpeg?auto=compress&cs=tinysrgb&w=800', // 11. Asian - Stir Fry
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', // 12. Salad
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80', // 13. Pizza
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80', // 14. Burger
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', // 15. Pasta
    'https://images.unsplash.com/photo-1481070555726-e2fe83577250?w=800&auto=format&fit=crop&q=80', // 16. Burger
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', // 17. Salad
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80', // 18. Pizza
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80', // 19. Burger
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80'  // 20. Pasta
  ];

  const handleFormSubmit = async (formData: FormData) => {
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = submitButton?.textContent;
    
    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }
      
      // Submit to Netlify
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString()
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      setShowModal(false);
      alert('Thank you for your interest! Your demo request has been sent to our team.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again later.');
    } finally {
      if (submitButton) {
        submitButton.textContent = originalText || 'Schedule Call';
        submitButton.disabled = false;
      }
    }
  };

  const Modal = ({ children, onClose }) => {
    return (
      <div className="tw-modal">
        <div className="tw-modal-content">
          {children}
          <button 
            className="tw-modal-close" 
            onClick={onClose}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const PricingTier = ({ tier }) => {
    return (
      <div key={tier.title} className={`pricing-card ${tier.popular ? 'popular' : ''}`}>
        {tier.popular && <div className="popular-badge">Most Popular</div>}
        <h2 className="pricing-card-title">{tier.title}</h2>
        <p className="pricing-card-price">{tier.price}</p>
        <ul className="pricing-card-features">
          {tier.features.map((feature, index) => (
            <li key={index}>✓ {feature}</li>
          ))}
        </ul>
        {
          tier.cta === "Let's Get Perk'd" ? (
            <button onClick={() => setShowModal(true)} className="tw-contact-btn">{tier.cta}</button>
          ) : (
            <a href={wristbandConsumerSignupUrl} className="tw-contact-btn" rel="noopener noreferrer">{tier.cta}</a>
          )
        }
      </div>
    );
  };

  const MetricsBox = ({ value, label, icon }) => {
    return (
      <div style={{
        backgroundColor: '#e6f2ff',
        border: '2px solid #4d94ff',
        padding: '1.5rem',
        borderRadius: '8px',
        textAlign: 'center',
        minWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          fontSize: '2.25rem', 
          fontWeight: 'bold', 
          color: '#e94e3c',
          marginBottom: '0.5rem'
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '1rem',
          color: '#2a4d69',
          fontWeight: 500
        }}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="tw-page-container">
      <div className="tw-header">
        <div className="tw-nav-links">
          <Link to="/" className="tw-back-arrow" aria-label="Back to Home">← Back to Home</Link>
          <Link to="/AboutUs" className="tw-back-arrow" aria-label="Back to About Us">← Back to About Us</Link>
          <Link to="/KitchenComebacks" className="tw-back-arrow" aria-label="Back to Kitchen Comebacks">← Back to Kitchen Comebacks</Link>
          <Link to="/TenantWellness" className="tw-back-arrow" aria-label="Go to Tenant Wellness">
            ← Back to PorkChop Perks
          </Link>
        </div>
        <img src={logo} alt="PorkChop Logo" className="tw-logo" />
      </div>
      
      <section className="tw-hero">
        <h1 className="tw-title">Find Your Perfect Plan</h1>
        <p className="tw-tagline">Unlock culinary potential or community with a plan that fits your appetite.</p>
      </section>
      
      <section className="pricing-plans">
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <PricingTier key={tier.title} tier={tier} />
          ))}
        </div>
      </section>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h2></h2>
          <DemoRequestForm onSubmit={handleFormSubmit} onClose={() => setShowModal(false)} />
        </Modal>
      )}

      {showQuestionsModal && (
        <Modal onClose={() => setShowQuestionsModal(false)}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}></h2>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#e94e3c', marginBottom: '0.5rem' }}>How does the pricing work?</h3>
              <p style={{ margin: 0 }}>Our pricing is simple - pay a flat monthly fee for unlimited access to all features.</p>
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#e94e3c', marginBottom: '0.5rem' }}>Can I cancel anytime?</h3>
              <p style={{ margin: 0 }}>Yes, you can cancel your subscription at any time with no hidden fees.</p>
            </div>
            
            <div>
              <h3 style={{ color: '#e94e3c', marginBottom: '0.5rem' }}>How do I start?</h3>
              <p style={{ margin: 0 }}>Just go to the home page and hit sign up! Questions? Just email chef@porkchop.app. Simple.</p>
            </div>
          </div>
        </Modal>
      )}

      {showImpactModal && (
        <Modal onClose={() => setShowImpactModal(false)}>
          <h2></h2>
          <div style={{ margin: '2rem 0' }}>
            <style dangerouslySetInnerHTML={{
              __html: `
                .food-carousel {
                  width: 100%;
                  overflow: hidden;
                  position: relative;
                  margin: 1.5rem 0;
                }
                .carousel-track {
                  display: flex;
                  animation: scroll 30s linear infinite;
                  width: calc(200px * 20);
                }
                .carousel-slide {
                  height: 150px;
                  width: 200px;
                  flex-shrink: 0;
                  margin: 0 10px;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .carousel-slide img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
                @keyframes scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(calc(-200px * 10)); }
                }
              `
            }} />
            <div className="food-carousel">
              <div className="carousel-track">
                {[...foodImages, ...foodImages].map((img, index) => (
                  <div key={index} className="carousel-slide">
                    <img src={img} alt={`Delicious meal ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              justifyContent: 'center', 
              gap: '2rem',
              margin: '2rem 0'
            }}>
              <MetricsBox value="89%" label="User Adoption Rate" />
              <MetricsBox value="4.7x" label="Daily Active Cooks" icon="↑" />
            </div>
          </div>
        </Modal>
      )}
      <footer className="tw-footer" style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => setShowQuestionsModal(true)}
            className="tw-contact-btn"
            style={{
              margin: '0 0.5rem',
              backgroundColor: '#f8f9fa',
              color: '#2a4d69',
              border: '2px solid #2a4d69'
            }}
          >
            Common Questions
          </button>
          <button 
            onClick={() => setShowImpactModal(true)}
            className="tw-contact-btn"
            style={{ margin: '0 0.5rem' }}
          >
            See the Impact
          </button>
        </div>
        <p style={{ margin: '1rem 0 0', fontSize: '0.9rem' }}>
          Questions? Email <a href="mailto:chef@porkchop.app">chef@porkchop.app</a>
        </p>
      </footer>
    </div>
  );
}

export default Pricing;
