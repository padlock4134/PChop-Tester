import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import "./AboutUs.css";
import logo from '/logo.png';

const teamMembers = [
  {
    name: "Patrick Adukonis",
    role: "Founder & CEO",
    photo: "/paddy.png",
    isIcon: false,
    bio: "Patrick is the visionary founder behind PorkChop. With a background in technology and a passion for cooking, he identified the need for a modern solution to kitchen management. His leadership and innovative thinking drive PorkChop's mission to revolutionize the cooking experience.",
    linkedin: "https://www.linkedin.com/in/patrick-paddy-adukonis-3819ba22/"
  },
  {
    name: "Announcing Soon!",
    role: "Chief Culinary Officer",
    photo: "https://cdn-icons-png.flaticon.com/64/1830/1830839.png",
    isIcon: true,
    bio: "Our soon-to-be-announced Chief Culinary Officer brings extensive expertise in culinary arts and food science. They will lead our recipe development and ensure that PorkChop delivers exceptional culinary experiences to our users.",
    linkedin: ""
  },
  {
    name: "Stay Tuned!",
    role: "Head of Go To Market",
    photo: "https://cdn-icons-png.flaticon.com/64/9357/9357543.png",
    isIcon: true,
    bio: "Our upcoming Head of Go To Market will bring strategic vision and marketing expertise to help PorkChop reach kitchens worldwide. They will develop and execute our market strategy to ensure PorkChop's innovative solutions reach as many home cooks as possible.",
    linkedin: ""
  },
];

const AboutUs: React.FC = () => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setHoveredMember(index);
  };

  const handleMouseLeave = () => {
    setHoveredMember(null);
  };

  const handleModalOpen = (index: number) => {
    setModalOpen(index);
  };

  const handleModalClose = () => {
    setModalOpen(null);
  };

  return (
    <div className="about-page-container">
      <div className="about-header">
        <div className="about-nav-links">
          <Link to="/" className="about-back-arrow" aria-label="Back to Home">
            ← Back to Home
          </Link>
          <Link to="/TenantWellness" className="about-back-arrow about-back-to-tw" aria-label="Back to Tenant Wellness">
            ← Back to PorkChop Perks
          </Link>
          <Link to="/KitchenComebacks" className="about-back-arrow about-back-to-kc" aria-label="Back to Kitchen Comebacks">
            ← Back to Kitchen Comebacks
          </Link>
        </div>
        <img src={logo} alt="PorkChop Logo" className="about-logo" />
      </div>
      
      <section className="about-hero">
        <h1 className="about-title">About Us</h1>
        <p className="about-tagline">Elevating your kitchen experience</p>
      </section>
      
      <section className="about-section">
        <h2>Meet Our Team</h2>
        <div className="about-team">
          {teamMembers.map((member, index) => (
            <div 
              className={`team-member ${hoveredMember === index ? 'team-member-hover' : ''}`}
              key={member.name}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleModalOpen(index)}
            >
              <img 
                src={member.photo} 
                alt={member.name} 
                className={member.isIcon ? "team-icon" : "team-photo"} 
              />
              <h3>{member.name}</h3>
              <p>{member.role}</p>
              {hoveredMember === index && (
                <div className="team-member-overlay">
                  <span>Click to view bio</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="about-section">
        <h2>My Journey</h2>
        <div className="about-card">
          <p>My grandfather Fred, originally from Turin, first brought my mother into the kitchen, and later, she brought me in too. Through generations, our family kitchen became a place of learning and healing. Fred showed us that food is more than just ingredients - it's a timeless way to spark creativity, wellness, and tradition.</p>
          
          <p>Years later, surrounded by over 40 well-worn cookbooks inherited from Fred and my mother, I found myself in a rut. As a trained butcher, sake brewer, and tech professional I'd stand before my fridge each night, the weight of culinary history on my shelves, yet feeling uninspired. That's when I taught myself to code & built PorkChop. It's our way to pay forward the lessons that papa and my mother taught me - that cooking isn't about perfection, but about finding tradition in the process while getting better each time.</p>
        </div>
      </section>
      
      {modalOpen !== null && (
        <div className="bio-modal-backdrop" onClick={handleModalClose}>
          <div className="bio-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bio-modal-close" onClick={handleModalClose}>×</button>
            <img 
              src={teamMembers[modalOpen].photo} 
              alt={teamMembers[modalOpen].name} 
              className={teamMembers[modalOpen].isIcon ? "team-icon" : "team-photo"} 
            />
            <div className="bio-modal-header">
              <h3>{teamMembers[modalOpen].name}</h3>
              {teamMembers[modalOpen].linkedin && (
                <a 
                  href={teamMembers[modalOpen].linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="linkedin-icon"
                  aria-label={`${teamMembers[modalOpen].name}'s LinkedIn profile`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>
            <p className="bio-modal-role">{teamMembers[modalOpen].role}</p>
            <p className="bio-modal-text">{teamMembers[modalOpen].bio}</p>
          </div>
        </div>
      )}
      
      <section className="about-cta">
        <h2>Join the PorkChop Community!</h2>
        <p>Just imagine if DuoLingo and your grandfather's cookbook had a baby. That's PorkChop.</p>
        <a href="https://global-mvp123-porkchop.us.wristband.dev/signup" className="about-cta-btn" target="_blank" rel="noopener noreferrer">Get Started</a>
      </section>
    </div>
  );
};

export default AboutUs;
