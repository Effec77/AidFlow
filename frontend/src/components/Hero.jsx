import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const Hero = () => {
  return (
    <section id="hero" className="hero-section">
      <div className="container hero-content">
        <motion.div
          className="hero-text-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className="hero-title" variants={itemVariants}>
            AidFlow AI
          </motion.h1>
          <motion.p className="hero-subtitle" variants={itemVariants}>
            Intelligent Logistics and Proactive Resource Allocation During Disasters.
          </motion.p>
          <motion.div className="hero-cta" variants={itemVariants}>
            {/* <a href="#solutions" className="cta-button">
              Explore Solutions
            </a> */}
            <a href="#contact" className="learn-more-link">
              Contact Us &rarr;
            </a>
          </motion.div>
        </motion.div>
      </div>

      <div className="scroll-down-arrow-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="scroll-down-svg">
          <path d="M16.924 9.617A1 1 0 0 0 16 9H8a1 1 0 0 0-.707 1.707l4 4a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0 .217-1.09z" />
        </svg>
      </div>
    </section>
  );
};

export default Hero;