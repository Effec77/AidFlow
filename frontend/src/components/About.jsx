import React from 'react';

const About = () => (
  <section id="about" className="about-section hidden-section">
    <div className="container about-content-grid">

      {/* Text Column */}
      <div className="about-text-content">
        <h2 className="about-title">
          About <span>AidFlow</span> AI
        </h2>
        <p>
          <strong>AidFlow AI</strong> is a next-generation disaster response platform that combines 
          AI-driven image analysis with intuitive geospatial visualization to support faster, smarter 
          humanitarian logistics. Tailored for NGOs and government agencies, the platform transforms 
          aerial imagery into actionable insights—helping teams quickly assess damage, allocate resources, 
          and respond with precision.
        </p>
        <p>
          By leveraging deep learning for multi-label classification, AidFlow AI detects and geotags 
          critical disaster features like floods, infrastructure damage, and fallen vegetation. 
          These insights are presented through a dynamic, map-based dashboard that empowers users to 
          visualize disaster severity, locations, and timestamps in real time.
        </p>
        <p>
          Built with scalability and frontline usability in mind, the platform lays the foundation for 
          advanced features like automated rerouting, predictive alerts, and intelligent resource distribution. 
          AidFlow AI bridges the gap between cutting-edge AI and real-world impact—offering a reliable, 
          high-precision tool for modern disaster management teams.
        </p>
      </div>

      {/* Image Carousel Column */}
      <div className="about-image-carousel">
        <div className="about-image-carousel-inner">
          <img src="https://placehold.co/400x300/61dafb/000000?text=AI+Insights" alt="AI Insights" />
          <img src="https://placehold.co/400x300/2FA8CC/FFFFFF?text=Logistics" alt="Logistics" />
          <img src="https://placehold.co/400x300/ffb625/000000?text=Relief+Efforts" alt="Relief Efforts" />
          <img src="https://placehold.co/400x300/61dafb/000000?text=AI+Insights" alt="AI Insights" />
          <img src="https://placehold.co/400x300/2FA8CC/FFFFFF?text=Logistics" alt="Logistics" />
          <img src="https://placehold.co/400x300/ffb625/000000?text=Relief+Efforts" alt="Relief Efforts" />
        </div>
      </div>

    </div>
  </section>
);

export default About;
