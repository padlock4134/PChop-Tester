import React, { useState, memo, FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import "./Pricing.css";
import logo from "/logo.png";

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

interface DemoRequestFormProps {
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}

interface PricingTier {
  title: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

// This URL should direct users to your signup page.
const wristbandConsumerSignupUrl = (import.meta as any).env.VITE_WRISTBAND_CONSUMER_SIGNUP_URL;

interface PricingCalculatorProps {
  onGetStarted: () => void;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({ onGetStarted }) => {
  const [monthlyFee, setMonthlyFee] = useState(2500); // Start at a middle value
  
  // Calculate per seat cost based on monthly fee
  const calculatePerSeatCost = (monthlyFee: number) => {
    // Ensure monthly fee is at least $499
    const effectiveFee = Math.max(499, monthlyFee);
    
    // Define price tiers with their corresponding monthly fee ranges
    const priceTiers = [
      { min: 499, max: 999, price: 20 },
      { min: 1000, max: 1499, price: 15 },
      { min: 1500, max: 1999, price: 10 },
      { min: 2000, max: 2499, price: 8 },
      { min: 2500, max: 2999, price: 7 },
      { min: 3000, max: 3499, price: 6 },
      { min: 3500, max: 3999, price: 5 },
      { min: 4000, max: 4499, price: 4 },
      { min: 4500, max: 5000, price: 3 }
    ];
    
    // Find the matching price tier
    const tier = priceTiers.find(t => effectiveFee >= t.min && effectiveFee <= t.max);
    return tier ? tier.price : 3; // Default to $3 if no tier matches (shouldn't happen with our current ranges)
  };
  
  const perSeatCost = calculatePerSeatCost(monthlyFee);
  
  return (
    <div style={{ width: '100%' }}>
      <p className="pricing-card-price" style={{
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#e94e3c',
        textAlign: 'center',
        margin: '0 0 2rem 0'
      }}>${perSeatCost}<span style={{
        fontSize: '1rem',
        color: '#6c757d',
        marginLeft: '0.5rem'
      }}>/student/month</span></p>
      
      <div className="slider-container" style={{ margin: '2rem 0' }}>
        <label style={{
          display: 'block',
          color: '#2a4d69',
          fontWeight: '500',
          textAlign: 'center',
          fontSize: '1.1rem',
          marginBottom: '1rem'
        }}>
          Choose Your Monthly Subscription : ${monthlyFee.toLocaleString()}
        </label>
        <div 
          style={{
            width: '100%',
            padding: '10px 0',
            marginBottom: '1.5rem',
            touchAction: 'none' // Prevent touch events from interfering with slider
          }}
          onTouchMove={(e) => e.stopPropagation()} // Stop touch event propagation
        >
          <input 
            type="range" 
            min="499" 
            max="5000" 
            step="100"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: '#e0e7ff',
              outline: 'none',
              WebkitAppearance: 'none',
              touchAction: 'manipulation' // Optimize for touch
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6c757d',
          marginTop: '0.25rem',
          padding: '0 0.5rem'
        }}>
          <span>$499.00</span>
          <span>$5,000+</span>
        </div>
        <p style={{
          fontSize: '0.75rem',
          color: '#6c757d',
          fontStyle: 'italic',
          margin: '0.5rem auto 1.5rem',
          lineHeight: '1.4',
          textAlign: 'center',
          maxWidth: '90%'
        }}>
          *Pick your comfort level - your monthly budget controls your seat costs.*
        </p>
      </div>
      
      <button 
        className="cta-button"
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: '#e94e3c',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          marginTop: '1rem'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d44636')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e94e3c')}
        onClick={onGetStarted}
      >
        Get Started
      </button>
      
      {/* Hidden per request - upfront payment text
      <p style={{
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '0.875rem',
        marginTop: '1rem'
      }}>
        Based on ${monthlyFee.toLocaleString()} upfront payment
      </p>
      */}
    </div>
  );
};

const DemoRequestForm = memo(({ onSubmit, onClose }: DemoRequestFormProps) => {
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
      // Submit the form data to Netlify
      const form = e.currentTarget;
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form) as any).toString()
      });
      
      // Show thank you message and close after 2 seconds
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset form state when closing
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
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            Name
          </label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1rem',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#63ace5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            Institution/School Name
          </label>
          <input 
            type="text" 
            name="company" 
            value={formData.company} 
            onChange={handleChange} 
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1rem',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#63ace5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            Email
          </label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1rem',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#63ace5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            Phone
          </label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1rem',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#63ace5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#2a4d69',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            Preferred Date & Time
          </label>
          <input 
            type="datetime-local" 
            name="preferredTime" 
            value={formData.preferredTime}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 16)}
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '1rem',
              transition: 'border-color 0.2s',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#63ace5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="submit" 
            style={{
              backgroundColor: '#e94e3c',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              padding: '0.875rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d44636')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e94e3c')}
          >
            Lets Chat!
          </button>
        </div>
      </form>
    </div>
  );
}); // Added missing closing parenthesis and semicolon here

const Pricing: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  
  const foodImages = [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', // 1. Grilled Steak
    'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=800', // 2. Asian - Sushi Rolls
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', // 3. Burger
    'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&auto=format&fit=crop&q=80', // 4. Pizza
    'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg?auto=compress&cs=tinysrgb&w=800', // 5. Asian - Dumplings
    'https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?auto=compress&cs=tinysrgb&w=800', // 6. Asian - Ramen
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80', // 7. Ramen
    'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800', // 8. Asian - Pad Thai
    'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800&auto=format&fit=crop&q=80', // 9. Pasta
    'https://images.pexels.com/photos/725990/pexels-photo-725990.jpeg?auto=compress&cs=tinysrgb&w=800', // 10. Asian - Stir Fry
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', // 11. Salad
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80', // 12. Pizza
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80', // 13. Burger
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', // 14. Pasta
    'https://images.unsplash.com/photo-1481070555726-e2fe83577250?w=800&auto=format&fit=crop&q=80', // 15. Burger
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', // 16. Salad
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80', // 17. Pizza
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80', // 18. Burger
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80'  // 19. Pasta
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

  interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    contentStyle?: React.CSSProperties;
  }

  const Modal = ({ children, onClose, contentStyle = {} }: ModalProps) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
        <div 
          className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-[80vh] relative"
          style={contentStyle}
          onClick={e => e.stopPropagation()}
        >
          <button 
            className="absolute top-2 right-2 text-2xl"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    );
  };

  const PricingTier = ({ tier }: { tier: PricingTier }) => {
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

  interface MetricsBoxProps {
    value: string;
    label: string;
    icon?: string;
  }

  const MetricsBox: React.FC<MetricsBoxProps> = ({ value, label, icon }) => {
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
          {value} {icon && <span>{icon}</span>}
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
          <Link to="/KitchenComebacks" className="tw-back-arrow" aria-label="Back to Kitchen Comebacks">← Back to Scars & Soufflés</Link>
          <Link to="/TenantWellness" className="tw-back-arrow" aria-label="Go to Tenant Wellness">
            ← Back to PorkChop Provisions
          </Link>
        </div>
        <img src={logo} alt="PorkChop Logo" className="tw-logo" style={{ height: '50px' }} />
      </div>
      
      <section className="tw-hero">
        <h1 className="tw-title">Find Your Perfect Cut</h1>
        <p className="tw-tagline">Where students become the chefs other chefs admire</p>
      </section>
      
      <section className="pricing-plans" style={{ padding: '2rem 1rem' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: '#f9fafb',
          borderRadius: '1rem',
          boxShadow: '0 4px 16px rgba(42,77,105,0.09)',
          border: '2px solid #63ace5',
          padding: '2.5rem',
          position: 'relative'
        }}>
          {/* Calculator Section */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: '1.75rem',
              color: '#2a4d69',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>Pricing Calculator</h2>
            <PricingCalculator onGetStarted={() => setShowModal(true)} />
          </div>

          <hr style={{
            border: 'none',
            borderTop: '1px solid #e9ecef',
            margin: '2rem 0'
          }} />

          {/* Features Section */}
          <div>
            <h3 style={{
              fontSize: '1.25rem',
              color: '#2a4d69',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>Everything You Need to Succeed</h3>
            
            <ul style={{
              listStyle: 'none',
              padding: '0',
              margin: '0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {[
                'PorkChop comes co-branded, but white labeling is available',
                'Seamless integration with your existing curriculum',
                'Provide a way to help students learn how to build a recipe without waste',
                'Cultivate curriculum specific digital and personal cookbooks',
                'Students can source quality ingredients for practice',
                'Chef Freddie is our 24/7 AI chef that can be tuned to your specifications',
                'Instructors can provide assignments for students to work out outside of class',
                'Gamified skill progression for instant feedback and recognition'
              ].map((feature, index) => (
                <li key={index} style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1.05rem',
                  lineHeight: '1.4'
                }}>
                  <span style={{
                    color: '#e94e3c',
                    marginRight: '0.75rem',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>✓</span> {feature}
                </li>
              ))}
            </ul>
            
            <div style={{
              backgroundColor: '#e6f2ff',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              marginTop: '2rem',
              borderLeft: '4px solid #4d94ff',
              textAlign: 'center'
            }}>
              <p style={{
                margin: '0',
                color: '#2a4d69',
                fontWeight: '500',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                <span style={{
                  fontWeight: 'bold',
                  color: '#e94e3c'
                }}>All Plans Include:</span> Full platform access, dedicated support, and regular updates with no hidden fees. Start with any plan and scale as you grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto relative"
            style={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              margin: '0 auto',
              position: 'relative',
              border: '2px solid #000'
            }}
            onClick={e => e.stopPropagation()}
          >
            <DemoRequestForm onSubmit={handleFormSubmit} onClose={() => setShowModal(false)} />
          </div>
        </div>
      )}

      {showQuestionsModal && (
        <Modal onClose={() => setShowQuestionsModal(false)}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={() => setShowQuestionsModal(false)}>
            <div 
              className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-[80vh] relative"
              style={{
                border: '2px solid #000',
                borderRadius: '8px',
                overflow: 'hidden',
                maxWidth: '800px',
                width: '90%',
                margin: '0 auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowQuestionsModal(false)}
                className="absolute top-4 right-4 text-2xl font-bold text-gray-700 hover:text-black"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  lineHeight: '1'
                }}
              >
                &times;
              </button>
              <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <section className="faq-section">
                  <div className="container">
                    <h2><b>Frequently Asked Questions</b></h2><br></br>
                    <div className="faq-grid">
                      <div className="faq-item">
                        <h3>How can we reduce costs for our students?</h3>
                        <p>We offer flexible subscription pricing in order to keep education affordable for students.</p><br></br>
                      </div>
                      <div className="faq-item">
                        <h3>How does this benefit our school?</h3>
                        <p>Students can practice what they learn anytime, anywhere.</p><br></br>
                      </div>
                      <div className="faq-item">
                        <h3>How do we control our spending?</h3>
                        <p>Since you are in tune with your own budget, you can lock in your budget before we pilot.</p><br></br>
                      </div>
                      <div className="faq-item">
                        <h3>Can we adjust our investment later?</h3>
                        <p>Yes, you can change your monthly commitment anytime with prorated billing.</p><br></br>
                      </div>
                      <div className="faq-item">
                        <h3>Is there any long-term commitment?</h3>
                        <p>Partnerships come with a one year commitment, cancellable after 45 days.</p><br></br>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              
              <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <p>Have 2500+ students enrolled?<br /><a href="mailto:chef@porkchop.app" style={{ color: '#e94e3c', fontWeight: 600 }}>Contact us!</a></p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showImpactModal && (
        <Modal 
          onClose={() => setShowImpactModal(false)}
          contentStyle={{
            maxWidth: '800px',
            width: '90%',
            padding: '1.5rem',
            margin: '0 auto',
            textAlign: 'center',
            border: '2px solid #000',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#2a4d69' }}>See the Impact</h2>
          <div style={{ margin: '1rem 0' }}>
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
              <MetricsBox value="94%" label="Student Engagement" />
              <MetricsBox value="96%" label="Teacher Satisfaction" />
              <MetricsBox value="100%" label="Curriculum Aligned" />
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
      </footer>
    </div>
  );
}

export default Pricing;
