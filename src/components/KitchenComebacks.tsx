import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './KitchenComebacks.css';
import logoImage from '../images/logo.png';

const latestEpisodes = [
  {
    title: "Finding Light After Darkness",
    guest: "Jessie M.",
    date: "August 1, 2025",
    description: "Jessie shares how learning to bake bread became her therapy after escaping an abusive relationship.",
    audioUrl: "#",
    imageUrl: "https://via.placeholder.com/300x200"
  },
  {
    title: "From Trauma to Tiramisu",
    guest: "Carlos R.",
    date: "July 15, 2025",
    description: "Carlos found purpose and recovery through Italian desserts after a life-changing accident.",
    audioUrl: "#",
    imageUrl: "https://via.placeholder.com/300x200"
  },
  {
    title: "The Healing Table",
    guest: "Priya S.",
    date: "July 1, 2025",
    description: "Priya turned family recipes into a ritual of healing from grief and loss.",
    audioUrl: "#",
    imageUrl: "https://via.placeholder.com/300x200"
  },
  {
    title: "Cooking Through Crisis",
    guest: "Marcus T.",
    date: "June 15, 2025",
    description: "Marcus discusses how cooking became his anchor during a personal health crisis and recovery journey.",
    audioUrl: "#",
    imageUrl: "https://via.placeholder.com/300x200"
  }
];

const KitchenComebacks = () => {
  const [showModal, setShowModal] = useState(false);
  const [storyForm, setStoryForm] = useState({
    name: '',
    email: '',
    story: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoryForm({
      ...storyForm,
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
        name: storyForm.name,
        email: storyForm.email,
        story: storyForm.story,
        subject: 'Kitchen Comebacks Story Submission'
      };
      
      // In a real implementation, you would send this data to your backend
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form and close modal
      setStoryForm({
        name: '',
        email: '',
        story: ''
      });
      setShowModal(false);
      
      // Show success message
      alert('Thank you for sharing your story! We will review it soon.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your story. Please try again later.');
      
      // Reset button
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  };

  return (
    <div className="kc-page-container">
      <div className="kc-header">
        <div className="kc-nav-links">
          <Link to="/" className="kc-back-arrow" aria-label="Back to Home">
            ← Back to Home
          </Link>
          <Link to="/AboutUs" className="kc-back-arrow" aria-label="Back to About Us">
            ← Back to About Us
          </Link>
          <Link to="/TenantWellness" className="kc-back-arrow" aria-label="Back to Tenant Wellness">
            ← Back to Tenant Wellness
          </Link>
        </div>
        <img src={logoImage} alt="PorkChop Logo" className="kc-logo" />
      </div>
      
      <section className="kc-hero">
        <h1 className="kc-title">Kitchen Comebacks</h1>
        <p className="kc-tagline">Healing Trauma via the Power of Cooking</p>
      </section>
      
      <section className="kc-description">
        <p><strong>Kitchen Comebacks</strong> is a podcast about how the art of cooking can be a powerful healing mechanism. We share real stories from people who have used cooking to overcome trauma, abuse, and adversity. Whether you found hope in the kitchen after hardship, or used food as a way to rebuild your life, this show is for you.</p>
        <blockquote className="kc-quote">“I was abused and cooking healed me.”</blockquote>
        <p>These are the voices we amplify—stories of resilience, recovery, and the transformational power of food.</p>
        <p>If you have a comeback story to share, or want to listen and find hope, you’re in the right place.</p>
      </section>
      
      <section className="kc-latest-episodes">
        <div className="kc-episodes-grid">
          {latestEpisodes.map((episode, index) => (
            <div className="kc-episode-card" key={episode.title}>
              <div className="kc-episode-content">
                <h3>{episode.title}</h3>
                <span className="kc-guest">with {episode.guest}</span>
                <p>{episode.description}</p>
                <div className="kc-button-container">
                  <a className="kc-listen-btn" href={episode.audioUrl}>Listen Now</a>
                  <span className="kc-coming-soon-disclaimer">Coming Soon</span>
                </div>
              </div>
              <div className="kc-episode-overlay">
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="kc-footer">
        <h2>Converse with Us</h2>
        <p className="kc-footer-tagline">Join our community of healing through shared culinary experiences</p>
        <div className="kc-footer-buttons">
          <button className="kc-footer-btn kc-submit-story" onClick={() => setShowModal(true)}>Submit Your Story</button>
          <a href="https://global-prod-porkchop.us.wristband.dev/signup" className="kc-footer-btn kc-discover" target="_blank" rel="noopener noreferrer">Discover PorkChop</a>
        </div>
      </section>
      
      {showModal && (
        <div className="kc-modal">
          <div className="kc-modal-content">
            <h2>Share Your Story</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Name:
                <input type="text" name="name" value={storyForm.name} onChange={handleInputChange} />
              </label>
              <label>
                Email:
                <input type="email" name="email" value={storyForm.email} onChange={handleInputChange} />
              </label>
              <label>
                Story:
                <textarea name="story" value={storyForm.story} onChange={handleInputChange} />
              </label>
              <button type="submit">Submit</button>
            </form>
            <button className="kc-modal-close" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenComebacks;
