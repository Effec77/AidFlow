import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus("Message sent successfully!");
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error('Failed to send message.');
      }
    } catch (err) {
      console.error("Contact form submission error:", err);
      setStatus("Failed to send message. Please try again.");
    }
  };

  return (
    <section id="contact" className="contact-section hidden-section">
      <div className="container contact-content">
        <div className="contact-card">
          <h2 className="section-title">Ready to Revolutionize Disaster Response?</h2>
          <p>Partner with us to bring cutting-edge AI and geospatial intelligence to the frontlines of humanitarian action. Let’s collaborate to build smarter, faster, and more responsive solutions for disaster management.</p>
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
            <textarea name="message" placeholder="Your Message" rows="5" value={formData.message} onChange={handleChange} required></textarea>
            <button type="submit" className="cta-button-secondary">Send Message</button>
            {status && <p style={{ marginTop: '1rem' }}>{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;