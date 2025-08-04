import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import "./KitchenComebacks.css";

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
];

const KitchenComebacks: React.FC = () => (
  <div className="kc-page-container">
    <div className="kc-header">
      <Link to="/" className="kc-back-arrow" aria-label="Back to Home">
        ← Back to Home
      </Link>
      <img src="/src/images/logo.png" alt="PorkChop Logo" className="kc-logo" />
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
      <h2>Latest Episodes</h2>
      <div className="kc-episodes-grid">
        {latestEpisodes.map((episode, index) => (
          <div className="kc-episode-card" key={episode.title}>
            <div className="kc-episode-image">
              <img src={episode.imageUrl} alt={episode.title} />
            </div>
            <div className="kc-episode-content">
              <span className="kc-episode-date">{episode.date}</span>
              <h3>{episode.title}</h3>
              <span className="kc-guest">with {episode.guest}</span>
              <p>{episode.description}</p>
              <a className="kc-listen-btn" href={episode.audioUrl}>Listen Now</a>
            </div>
          </div>
        ))}
      </div>
    </section>
    
    <section className="kc-footer">
      <div className="kc-footer-buttons">
        <a href="#" className="kc-footer-btn kc-listen-now">Listen Now</a>
        <a href="#" className="kc-footer-btn kc-submit-story">Submit Your Story</a>
        <Link to="/" className="kc-footer-btn kc-discover">Discover PorkChop</Link>
      </div>
    </section>
  </div>
);

export default KitchenComebacks;
