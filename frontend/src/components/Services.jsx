import React from 'react';
import { Link } from 'react-router-dom';
import ServiceCard from './ServiceCard.jsx';

const Services = () => {
  const services = [
    {
      icon: 'exclamation-triangle',
      title: 'Live Disasters',
      description: 'Track ongoing disasters in real time...',
      url: '/live-disasters',
      bgUrl: '/imgs/live_dist.jpg',
    },
    {
      icon: 'route',
      title: 'Smart Routing',
      description: 'Find the safest and fastest paths using AI-based routing that avoids danger zones and blockages.',
      url: '/routing',
      bgUrl: '/imgs/live_routing.jpg',
    },
    {
      icon: 'box-open',
      title: 'Search Inventory',
      description: 'Quickly locate and request supplies from distributed aid inventories and local storage hubs.',
      url: '/inventory',
      bgUrl: '/imgs/live_inv.jpg',
    },
    {
      icon: 'hand-holding-heart',
      title: 'Contribute',
      description: 'Upload images, share local information, or volunteer your help to support relief operations.',
      url: '#',
      bgUrl: 'imgs/live_help.jpeg',
    },
  ];

  return (
    <section id="services" className="services-section hidden-section">
      <div className="container">
        <h2 className="section-title text-center">Our Services</h2>
        <div className="services-grid">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              url={service.url}
              bgUrl={service.bgUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
