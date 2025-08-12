import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HomeIcon, GiftIcon } from "@heroicons/react/24/solid";
import "./LandingPage.css";
import "./TenantWellness.css";
import logo from '../images/logo.png';

const amenityBenefits = [
  {
    title: "🔒 Risk Mitigation",
    description: "Kitchens are a leading source of residential claims. PorkChop uses AI-driven guidance paired with real chef techniques to teach safe, skill-based cooking—helping residents avoid accidents, misuse, and property damage."
  },
  {
    title: "🤖 AI Blended Coaching",
    description: "Chef Freddie, our contextual AI chef, offers real-time, personalized support—while human-vetted culinary videos teach proper form, knife safety, and cooking technique. It's smart, skill-agnostic coaching that evolves with each user."
  },
  {
    title: "👥 Build Community",
    description: "Encourage connection with recipe sharing, cooking challenges, and hyperlocal food storytelling. PorkChop turns mealtime into a shared experience—even in individual units. Builds a sense of belonging and community engagement."
  },
  {
    title: "🏠 Resident Happiness",
    description: "PorkChop becomes part of residents' daily lives—supporting healthier eating, self-confidence, and enjoyment at home. Happier, more capable tenants = longer leases and better reviews."
  },
  {
    title: "📲 Minimal CapEx",
    description: "No hardware. No build-outs. Just a branded, tech-forward amenity that elevates your property's wellness offering—with digital deployment, usage analytics, and high perceived value."
  },
  {
    title: "🍽️ What Do They Get?",
    description: "Residents receive unlimited access to PorkChop's digital cookbook with hundreds of curated recipes, personalized meal plans, step-by-step cooking tutorials, and skill-building resources that adapt to their dietary preferences and cooking abilities."
  }
];

const loyaltyBenefits = [
  {
    title: "📈 Increase Basket Size",
    description: "Our meal planning and recipe discovery tools encourage shoppers to buy a wider variety of ingredients, directly increasing their average spend per visit."
  },
  {
    title: "🚶‍♂️ Drive In-Store & Online Traffic",
    description: "Feature your weekly specials, private label products, or high-margin items within our recipes to guide customers' purchasing decisions and drive traffic to specific aisles or online categories."
  },
  {
    title: "🎁 A Modern, Sticky Reward",
    description: "Offer a high-value digital experience that customers use daily. PorkChop becomes an indispensable tool, creating a powerful new reason for customers to choose your store."
  },
  {
    title: "💡 Gain Customer Insights",
    description: "Understand what your customers are cooking and buying. Leverage powerful data on food trends and preferences to optimize inventory, promotions, and marketing efforts."
  },
  {
    title: "⚙️ Seamless Integration",
    description: "PorkChop is a lightweight, digital-first reward that can be easily integrated into your existing loyalty program with minimal technical overhead."
  },
  {
    title: "🛒 Automated Shopping & E-commerce Integration",
    description: "Allow customers to instantly turn any recipe into a pre-filled shopping cart on your e-commerce platform. This seamless one-click experience removes friction and makes online grocery shopping easier than ever."
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

const AmenityModal = ({ onClose, onScheduleDemo }) => (
  <div className="tw-modal-large">
    <div className="tw-modal-content-large">
      <button className="tw-modal-close-large" onClick={onClose}>×</button>
      <section className="tw-hero">
        <h1 className="tw-title">Your Culinary Companion</h1>
        <p className="tw-tagline">Level up your property offering by rethinking resident wellness</p>
      </section>
      
      <section className="tw-description">
        <p>In today's rushed world, <strong>the kitchen has quietly disappeard from daily life for most</strong> - along with the confidence, joy and the connection it once brought. Many residents no longer feel equipped to cook satisfying meals, losing not just skills but a sense of home. The result? A growing dependence on processed food, rising health concerns and a silent loneliness around supper. PorkChop transforms this crisis into an opportunity by offering a modern amenity that brings neighbors together through shared cooking, recipe exchanges and a boost in kitchen confidence.</p>
        <blockquote className="tw-quote">"PorkChop isn't just another app—it's a property amenity that reconnects residents with the joy and wellness benefits of cooking."</blockquote>
      </section>
      
      <section className="tw-amenities">
        <h2>
          <span role="img" aria-label="Building"></span> 
          Why PorkChop for Residential Property Managers
        </h2>
        <div className="tw-amenities-grid">
          {amenityBenefits.map((benefit, index) => {
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
        <h2>Bring PorkChop to Your Property</h2>
        <p>Elevate your property's wellness offering with our zero-installation culinary amenity</p>
        <div className="tw-contact-options">
          <button 
            onClick={(e) => {
              e.preventDefault();
              downloadWhitepaper(
                '/porkchop-perks-residential.pdf',
                'PorkChop-Perks-Residential-Whitepaper.pdf'
              );
            }} 
            className="tw-contact-btn"
          >
            The Secret Ingredient to Happy Tenants
          </button>
        </div>
      </section>
    </div>
  </div>
);

const LoyaltyModal = ({ onClose, onScheduleDemo }) => (
  <div className="tw-modal-large">
    <div className="tw-modal-content-large">
      <button className="tw-modal-close-large" onClick={onClose}>×</button>
      <section className="tw-hero">
        <h1 className="tw-title">Redefine Loyalty & Rewards</h1>
        <p className="tw-tagline">Turn everyday groceries into a unique culinary experience.</p>
      </section>

      <section className="tw-description">
        <p>Move beyond points and discounts. PorkChop offers a dynamic, digital reward that integrates directly into your customers' lives, transforming how they shop and cook. By offering our platform as a loyalty benefit, you give customers a powerful tool to plan meals, discover recipes using your products, and reduce food waste—all while building a deeper connection with your brand.</p>
        <blockquote className="tw-quote">"PorkChop is the modern loyalty solution that makes your grocery store an indispensable part of your customers' kitchens."</blockquote>
      </section>

      <section className="tw-amenities">
        <h2>
          <span role="img" aria-label="Shopping Cart"></span> 
          Why PorkChop for Grocery
        </h2>
        <div className="tw-amenities-grid">
          {loyaltyBenefits.map((benefit) => {
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
        <p>Offer a loyalty perk that can drive more shoppers to your aisles.</p>
        <div className="tw-contact-options">
          <button 
            onClick={(e) => {
              e.preventDefault();
              downloadWhitepaper(
                '/porkchop-perks-grocery.pdf',
                'PorkChop-Perks-Grocery-Whitepaper.pdf'
              );
            }} 
            className="tw-contact-btn"
          >
            Sprinkle Some Success into Your Aisles
          </button>
        </div>
      </section>
    </div>
  </div>
);

const TenantWellness: React.FC = () => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeModal, setActiveModal] = useState<'amenity' | 'loyalty' | null>(null);
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
    
    const form = e.target as HTMLFormElement;
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitButton) return;

    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
      // Create URL-encoded form data
      const formData = new URLSearchParams();
      formData.append('form-name', 'tenant-wellness-demo');
      formData.append('name', demoForm.name);
      formData.append('company', demoForm.company);
      formData.append('email', demoForm.email);
      formData.append('phone', demoForm.phone);
      formData.append('preferredTime', demoForm.preferredTime);
      
      // Submit to Netlify
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      
      // Reset form and close modal
      setDemoForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        preferredTime: ''
      });
      setShowDemoModal(false);
      
      // Show success message
      alert('Thank you for your interest! Your demo request has been sent to our team.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again later.');
    } finally {
      // Reset button
      if (submitButton) {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    }
  };

  return (
    <div className="tw-page-container">
      <div className="tw-header">
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
        </div>
        <img src={logo} alt="PorkChop Logo" className="tw-logo" />
      </div>

      <section className="tw-hero">
        <h1 className="tw-title">PorkChop Perks Cantina</h1>
        <p className="tw-tagline">Blending tradition with modern culinary experiences for everyone.</p>
      </section>

      <div className="tw-verticals-container">
        <div className="tw-vertical-card" onClick={() => setActiveModal('amenity')}>
          <div className="tw-icon-container">
            <HomeIcon className="tw-card-icon text-blue-600" />
          </div>
          <div className="tw-card-content">
            <h3>Amenity Programs</h3>
            <p>Elevate your residential property with a unique wellness offering.</p>
          </div>
        </div>
        <div className="tw-vertical-card" onClick={() => setActiveModal('loyalty')}>
          <div className="tw-icon-container">
            <GiftIcon className="tw-card-icon text-red-600" />
          </div>
          <div className="tw-card-content">
            <h3>Loyalty & Rewards</h3>
            <p>Drive customer engagement for your grocery brand.</p>
          </div>
        </div>
      </div>

      {activeModal === 'amenity' && 
        <AmenityModal 
          onClose={() => setActiveModal(null)} 
          onScheduleDemo={() => setShowDemoModal(true)} 
        />
      }

      {activeModal === 'loyalty' && 
        <LoyaltyModal 
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
              name="tenant-wellness-demo"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="form-name" value="tenant-wellness-demo" />
              <p className="hidden">
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
    </div>
  );
};

export default TenantWellness;
