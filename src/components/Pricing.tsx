import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // Shared styles
import "./Pricing.css";     // New styles for this page
import logo from '../images/logo.png';

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
    cta: "Contact Sales",
    popular: true
  }
];

const Pricing: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDemoForm({
      ...demoForm,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitButton = (e.target as HTMLFormElement).querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitButton) return;

    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
      const subject = encodeURIComponent("PorkChop Demo Request");
      const body = encodeURIComponent(
        `Name: ${demoForm.name}\n\nCompany: ${demoForm.company}\n\nEmail: ${demoForm.email}\n\nPhone: ${demoForm.phone}`
      );
      
      const mailtoLink = document.createElement('a');
      mailtoLink.href = `mailto:chef@porkchop.app?subject=${subject}&body=${body}`;
      mailtoLink.style.display = 'none';
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);
      
      setDemoForm({ name: '', company: '', email: '', phone: '' });
      setShowModal(false);
      
      alert('Thank you for your interest! Your demo request has been sent to our team.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again later.');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
  };
  return (
    <div className="tw-page-container">
      <div className="tw-header">
        <div className="tw-nav-links">
          <Link to="/" className="tw-back-arrow" aria-label="Back to Home">← Back to Home</Link>
          <Link to="/AboutUs" className="tw-back-arrow" aria-label="Back to About Us">← Back to About Us</Link>
          <Link to="/KitchenComebacks" className="tw-back-arrow" aria-label="Back to Kitchen Comebacks">← Back to Kitchen Comebacks</Link>
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
                tier.cta === "Contact Sales" ? (
                  <button onClick={() => setShowModal(true)} className="tw-contact-btn">{tier.cta}</button>
                ) : (
                  <a href={wristbandConsumerSignupUrl} className="tw-contact-btn" rel="noopener noreferrer">{tier.cta}</a>
                )
              }
            </div>
          ))}
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

      <footer className="tw-footer">
        <p>Questions? Email <a href="mailto:chef@porkchop.app">chef@porkchop.app</a></p>
      </footer>
    </div>
  );
}

export default Pricing;
