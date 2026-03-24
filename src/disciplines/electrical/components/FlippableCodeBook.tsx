import React, { useState } from 'react';
import './FlippableCookbook.css';
import { useDeviceDetect } from '../utils/responsiveUtils';

const PAGES = [
  // Cover
  {
    title: "",
    content: (
      <>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '20px'
        }}>
          <h1 className="cover-title" style={{ fontSize: '3.3rem', margin: '1rem 0 0.5rem 0', color: '#fff', textAlign: 'center' }}>PORKCHOP</h1>
          <h2 className="cover-subtitle" style={{ fontSize: '1.8rem', margin: '0 0 2rem 0', color: '#fff', textAlign: 'center' }}>Your AI Electrical Training Companion</h2>
          <h3 className="cover-body" style={{ fontSize: '1.5rem', textAlign: 'center', margin: '0 auto 2rem', color: '#fff' }}>Open To Learn More</h3>
          <div 
            className="cookbook-logo"
            style={{ 
              width: '300px',
              height: '300px',
              margin: '0 auto 1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'white',
              border: '4px solid black',
              borderRadius: '50%',
              overflow: 'hidden',
              padding: '5px'
            }}
          >
            <img 
              src="/logo.png" 
              alt="PorkChop Logo" 
              style={{ 
                width: '95%',
                height: '95%',
                objectFit: 'cover',
                borderRadius: '50%'
              }} 
            />
          </div>

        </div>
      </>
    ),
    pageNumber: null,
    isCover: true
  },
  // Page 1 - Table of Contents
  {
    title: "Table of Contents",
    content: (
      <div className="toc-content">
        <ul className="toc-list">
          <li>Inspiration (Page 2)</li>
          <li>My Panel (Page 3)</li>
          <li>My Codebook (Page 4)</li>
          <li>Elec School (Page 5)</li>
          <li>Wire Lounge (Page 6)</li>
          <li>Sparky (Page 7)</li>
          <li>Common Questions (Page 8)</li>
          <li>Pricing (Page 9)</li>
        </ul>
      </div>
    ),
    pageNumber: 1
  },
  // Page 2 - Inspiration
  {
    title: "Inspiration",
    content: (
      <>
        <div className="inspiration-logo-container">
          <img src="/logo.png" alt="PorkChop Logo" className="inspiration-logo" />
        </div>
        <p className="page-content-text">
          We created PorkChop because my grandfather Frederick would always know what to make when he's looking in his fridge. 
          Everyone loved Pancake Saturdays cause everyone got to eat - even friends we brought with us.
          He taught us that it's important to always be as nice as you can and help people if you can - food is the best way to make sure no one goes hungry.
        </p>
      </>
    ),
    pageNumber: 2
  },
  // Page 3 - My Panel
  {
    title: "My Panel",
    content: (
      <>
        <p className="page-content-text">
          Your digital circuit tracker that manages your tools and suggests the right wiring approach for any job.
        </p>
        <div className="page-image-container page-3-image">
          <img src="/my-kitchen-screenshot.png" alt="My Panel Screenshot" className="page-screenshot" />
        </div>
      </>
    ),
    pageNumber: 3
  },
  // Page 4 - My Codebook
  {
    title: "My Codebook",
    content: (
      <>
        <p className="page-content-text">
          Your personal wiring diagram portfolio — circuit designs, inspection records, and completed jobs in one place.
        </p>
        <div className="page-image-container page-4-image">
          <img src="/my-cookbook-screenshot.png" alt="My Codebook Screenshot" className="page-screenshot" />
        </div>
      </>
    ),
    pageNumber: 4
  },
  // Page 5 - Elec School
  {
    title: "Elec School",
    content: (
      <>
        <p className="page-content-text">
          Master electrical techniques with step-by-step video lessons — from NEC code compliance to panel installation.
        </p>
        <div className="page-image-container page-5-image">
          <img src="/culinary-school-screenshot.png" alt="Elec School Screenshot" className="page-screenshot" />
        </div>
      </>
    ),
    pageNumber: 5
  },
  // Page 6 - Wire Lounge
  {
    title: "Wire Lounge",
    content: (
      <>
        <p className="page-content-text">
          Connect with peers, find local electrical suppliers and wholesalers, and share techniques with fellow electricians.
        </p>
        <div className="page-image-container page-6-image">
          <img src="/chefs-corner-screenshot.png" alt="Wire Lounge Screenshot" className="page-screenshot" />
        </div>
      </>
    ),
    pageNumber: 6
  },
  // Page 7 - Sparky
  {
    title: "Sparky",
    content: (
      <>
        <p className="page-content-text">
          Your AI electrical assistant, ready to help with NEC code lookups, circuit design, load calculations, and troubleshooting.
        </p>
        <div className="page-image-container page-7-image">
          <img src="/chef-freddie-screenshot.png" alt="Sparky Screenshot" className="page-screenshot" />
        </div>
      </>
    ),
    pageNumber: 7
  },
  // Page 8 - Common Questions
  {
    title: "Common Questions",
    content: (
      <>
        <div className="faq-content">
          <ul className="faq-list">
            <li><strong>Why not use ChatGPT?</strong><br />
            PorkChop is purpose-built for electrical education — it knows the NEC, OSHA standards, and trade-specific workflows.</li>
            
            <li><strong>Is this just a video library?</strong><br />
            We combine it all — circuit tracking, code compliance tools, supplier locator, and AI-powered education.</li>
            
            <li><strong>How is this different?</strong><br />
            It adapts to your skill level, the systems you work on, and your jurisdiction's electrical codes in real-time.</li>
          </ul>
        </div>
      </>
    ),
    pageNumber: 8
  }
];

const FlippableCookbook: React.FC = () => {
  const [pageNumber, setPageNumber] = useState(0);
  const [turnedPages, setTurnedPages] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTurningPage, setCurrentTurningPage] = useState<number | null>(null);
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward'>('forward');
  
  // Use the device detection hook
  const { deviceType } = useDeviceDetect();
  
  // Function to go to next page
  const goToNextPage = () => {
    if (isAnimating || pageNumber >= PAGES.length - 1) return;
    
    setIsAnimating(true);
    setCurrentTurningPage(pageNumber);
    setTurnDirection('forward');
    
    setTimeout(() => {
      setTurnedPages([...turnedPages, pageNumber]);
      setPageNumber(pageNumber + 1);
      setIsAnimating(false);
      setCurrentTurningPage(null);
    }, 500);
  };
  
  // Function to go to previous page
  const goToPrevPage = () => {
    if (isAnimating || pageNumber <= 0) return;
    
    setIsAnimating(true);
    setCurrentTurningPage(pageNumber - 1);
    setTurnDirection('backward');
    
    setTimeout(() => {
      const newTurnedPages = [...turnedPages];
      newTurnedPages.pop();
      setTurnedPages(newTurnedPages);
      setPageNumber(pageNumber - 1);
      setIsAnimating(false);
      setCurrentTurningPage(null);
    }, 500);
  };

  // When showing the cover or any page
  return (
    <div className={`cookbook-container ${pageNumber === 0 ? 'cover-only' : ''} device-${deviceType}`}>
      <div className="cookbook-spine" />
      
      {/* Turned pages - these are the pages that have been turned and stick */}
      {turnedPages.map((pageNum) => (
        <div key={pageNum} className={`turned-page ${pageNum === 0 ? 'cover-turned-page' : ''}`}>
          <div className={`page-content ${pageNum === 0 ? 'cover-content' : ''}`}>
            {pageNum === 0 ? (
              PAGES[0].content
            ) : (
              <div className="page-inner-content">
                <h1 className="page-title">{PAGES[pageNum].title}</h1>
                {PAGES[pageNum].content}
                {PAGES[pageNum].pageNumber && (
                  <div className="page-number">
                    <span className="page-arrow left-arrow">←</span>
                    {PAGES[pageNum].pageNumber}
                    <span className="page-arrow right-arrow">→</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Current page */}
      <div className={`${pageNumber === 0 ? "cover-page" : "book-page"} ${deviceType === 'mobile' ? 'mobile' : ''}`}>
        <div className="spiral-binding">
          {[...Array(deviceType === 'mobile' ? 10 : 15)].map((_, i) => (
            <div key={i} className="spiral-hole"></div>
          ))}
        </div>
        <div className={pageNumber === 0 ? "" : "page"}>
          {pageNumber === 0 ? (
            PAGES[0].content
          ) : (
            <div className="page-inner-content">
              <h1 className="page-title">{PAGES[pageNumber].title}</h1>
              {PAGES[pageNumber].content}
              {PAGES[pageNumber].pageNumber && (
                <div className="page-number">
                  <span className="page-arrow left-arrow">←</span>
                  {PAGES[pageNumber].pageNumber}
                  <span className="page-arrow right-arrow">→</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      
      {/* Navigation zones */}
      <div 
        className="nav-zone left-zone"
        onClick={(e) => {
          e.stopPropagation();
          goToPrevPage();
        }}
      />
      <div 
        className="nav-zone right-zone"
        onClick={(e) => {
          e.stopPropagation();
          goToNextPage();
        }}
      />
      
      {/* Page turn animation */}
      {isAnimating && currentTurningPage !== null && (
        <div className={`page-turn-animation ${turnDirection === 'backward' ? 'reverse' : ''}`}>
          <div className={`turning-page ${deviceType === 'mobile' ? 'mobile' : ''}`}>
            <div className="page-content front-face">
              <div className="page-inner-content">
                <h1 className="page-title">{PAGES[currentTurningPage].title}</h1>
                {PAGES[currentTurningPage].content}
                {PAGES[currentTurningPage].pageNumber && (
                  <div className="page-number">
                    <span className="page-arrow left-arrow">←</span>
                    {PAGES[currentTurningPage].pageNumber}
                    <span className="page-arrow right-arrow">→</span>
                  </div>
                )}
              </div>
            </div>
            {/* Empty back face - will be styled via CSS */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlippableCookbook;
