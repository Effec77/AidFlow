import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [isNavActive, setIsNavActive] = useState(false);
  const [theme, setTheme] = useState('dark');
  const navigate = useNavigate();

  // ✅ Apply saved theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, []);

  // ✅ Toggle navbar visibility (mobile)
  const handleNavToggle = () => setIsNavActive(!isNavActive);

  // ✅ Toggle between light/dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  // ✅ Smooth scroll to section (after navigating home)
  const handleScroll = (id) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    setIsNavActive(false);
  };

  return (
    <header className="header">
      <div className="container header-container">

        {/* --- Left Section: Logo --- */}
        <Link to="/" className="logo">
          <img
            src="/imgs/AidFlow Logo.png"
            alt="AidFlow AI Logo"
            className="logo-img"
          />
          <span className="logo-text">AidFlow AI</span>
        </Link>

        {/* --- Center Section: Main Nav Links --- */}
        <nav className={`nav centered-nav ${isNavActive ? 'active' : ''}`}>
          <ul className="nav-list">
            <li><button onClick={() => handleScroll('about')} className="nav-link">About</button></li>
            <li><button onClick={() => handleScroll('services')} className="nav-link">Services</button></li>
            <li><Link to="/emergency" className="nav-link emergency-link">🚨 Emergency</Link></li>
            <li><button onClick={() => handleScroll('team')} className="nav-link">Team</button></li>
            <li><button onClick={() => handleScroll('contact')} className="nav-link">Contact</button></li>
          </ul>
        </nav>

        {/* --- Right Section: Auth & Theme Toggle --- */}
        <nav className={`nav right-nav ${isNavActive ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="auth-dropdown">
              <span className="nav-link">Account</span>
              <div className="dropdown-menu">
                <Link to="/login" className="dropdown-item">Login</Link>
                <Link to="/register" className="dropdown-item">Register</Link>
                <Link to="/emergency-dashboard" className="dropdown-item">Emergency Dashboard</Link>
                <Link to="/dispatch-tracker" className="dropdown-item">📍 Dispatch Tracker</Link>
                <Link to="/inventory-live" className="dropdown-item">Live Inventory</Link>
                <Link to="/routing" className="dropdown-item">Smart Routing</Link>
              </div>
            </li>
            <li>
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </li>
          </ul>
        </nav>

        {/* --- Mobile Nav Toggle Button --- */}
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          onClick={handleNavToggle}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
