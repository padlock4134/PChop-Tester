import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import "./AboutUs.css";
import logo from '../images/logo.png';

const teamMembers = [
  {
    name: "Patrick Adukonis",
    role: "Founder",
    photo: "../images/paddy.png"
  },
  {
    name: "Coming Soon!",
    role: "Chief Culinary Officer",
    photo: "https://via.placeholder.com/150"
  },
  {
    name: "Coming Soon!",
    role: "Head of Go To Market",
    photo: "https://via.placeholder.com/150"
  },
];

const AboutUs: React.FC = () => (
  <div className="about-page-container">
    <div className="about-header">
      <Link to="/" className="about-back-arrow" aria-label="Back to Home">
        ← Back to Home
      </Link>
      <img src={logo} alt="PorkChop Logo" className="about-logo" />
    </div>
    
    <section className="about-hero">
      <h1 className="about-title">About Us</h1>
      <p className="about-tagline">Elevating your kitchen experience</p>
    </section>
    
    <section className="about-content">
      <p>PorkChop is revolutionizing the way you interact with your kitchen. We believe that cooking should be accessible, enjoyable, and rewarding for everyone, regardless of skill level.</p>
      
      <p>Our mission is to provide innovative tools and resources that make cooking more intuitive, efficient, and fun. Whether you're a seasoned chef or just starting your culinary journey, PorkChop is designed to meet you where you are and help you level up.</p>
    </section>
    
    <section className="about-section">
      <h2>Our Story</h2>
      <div className="about-card">
        <p>PorkChop was born from a simple observation: despite the digital revolution transforming nearly every aspect of our lives, the kitchen remained largely unchanged. Our founder, frustrated by disorganized recipes and forgotten ingredients, envisioned a smarter kitchen assistant that could streamline the cooking process.</p>
        
        <p>What started as a personal project quickly evolved into a comprehensive platform designed to address the common pain points of home cooking. Today, PorkChop continues to grow and innovate, driven by our passion for good food and great technology.</p>
      </div>
    </section>
    
    <section className="about-section">
      <h2>Meet Our Team</h2>
      <div className="about-team">
        {teamMembers.map(member => (
          <div className="team-member" key={member.name}>
            <img src={member.photo} alt={member.name} className="team-photo" />
            <h3>{member.name}</h3>
            <p>{member.role}</p>
          </div>
        ))}
      </div>
    </section>
    
    <section className="about-cta">
      <h2>Join the PorkChop Community</h2>
      <p>Ready to transform your cooking experience? Sign up today and discover the future of kitchen technology.</p>
      <Link to="/" className="about-cta-btn">Get Started</Link>
    </section>
  </div>
);

export default AboutUs;
