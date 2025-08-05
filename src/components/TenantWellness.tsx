import React, { useState } from "react";
import { Link } from "react-router-dom";
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

const TenantWellness: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDemoForm({
      ...demoForm,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show sending feedback to user
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
      // Prepare form data
      const formData = {
        name: demoForm.name,
        company: demoForm.company,
        email: demoForm.email,
        phone: demoForm.phone,
        subject: 'PorkChop Demo Request'
      };
      
      // Create mailto link with form data
      const subject = encodeURIComponent("PorkChop Demo Request");
      const body = encodeURIComponent(
        `Name: ${demoForm.name}\n\nCompany: ${demoForm.company}\n\nEmail: ${demoForm.email}\n\nPhone: ${demoForm.phone}`
      );
      
      // Create a hidden link and click it
      const mailtoLink = document.createElement('a');
      mailtoLink.href = `mailto:chef@porkchop.app?subject=${subject}&body=${body}`;
      mailtoLink.style.display = 'none';
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);
      
      // Reset form and close modal
      setDemoForm({
        name: '',
        company: '',
        email: '',
        phone: ''
      });
      setShowModal(false);
      
      // Show success message
      alert('Thank you for your interest! Your demo request has been sent to our team.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again later.');
      
      // Reset button
      submitButton.textContent = originalText;
      submitButton.disabled = false;
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
        <h1 className="tw-title">Your Culinary Companion</h1>
        <p className="tw-tagline">Level up your property offering by rethinking resident wellness</p>
      </section>
      
      <section className="tw-description">
        <p>In today's rushed world, <strong>the kitchen has quietly disappeard from daily life for most</strong> - along with the confidence, joy and the connection it once brought. Many residents no longer feel equipped to cook satisfying meals, losing not just skills but a sense of home. The result? A growing dependence on processed food, rising health concerns and a silent loneliness around supper. PorkChop transforms this crisis into an opportunity by offering a modern amenity that brings neighbors together through shared cooking, recipe exchanges and a boost in kitchen confidence.</p>
        <blockquote className="tw-quote">"PorkChop isn't just another app—it's a property amenity that reconnects residents with the joy and wellness benefits of cooking."</blockquote>
      </section>
      
      <section className="tw-amenities">
        <h2>
          <span role="img" aria-label="Building">🏢</span> 
          Why PorkChop for Residential Property Managers?
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
          <button onClick={() => setShowModal(true)} className="tw-contact-btn">Schedule Demo</button>
        </div>
      </section>
      
      {showModal && (
        <div className="tw-modal">
          <div className="tw-modal-content">
            <h2>Schedule a Demo</h2>
            <form onSubmit={handleSubmit}>
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
              <button type="submit">Submit Request</button>
            </form>
            <button className="tw-modal-close" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantWellness;
