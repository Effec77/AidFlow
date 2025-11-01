import React from 'react';
import { Link } from 'react-router-dom';

const ServiceCard = ({ icon, title, description, url, bgUrl }) => {
  return (
    <div className="service-card" style={{ '--bg-url': `url(${bgUrl})` }}>
      <div className="service-icon">
        <i className={`fas fa-${icon}`}></i>
      </div>
      <h3 className="service-title">
        <Link to={url}>{title}</Link>
      </h3>
      <p className="service-description">{description}</p>
    </div>
  );
};

export default ServiceCard;