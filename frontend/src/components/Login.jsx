import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import '../App.css';
import '../css/Login.css';

const Login = () => {
  const { login } = useContext(UserContext); 
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '', 
    password: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Add local observer effect for fade-in animation
  useEffect(() => {
    const sections = document.querySelectorAll('.hidden-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible-section');
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Logging in...");
    
    const payload = { 
      username: formData.username,
      password: formData.password
    };

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        login(result.token, result.role);
        setStatus("Login successful! Redirecting...");

        // redirect based on role
        if (['admin', 'branch manager', 'volunteer'].includes(result.role)) {
          navigate('/inventory');
        } else {
          navigate('/');
        }

      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed. Invalid credentials.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="login" className="login-section hidden-section">
      <div className="container login-card">
        <h2 className="section-title">Login to AidFlow AI</h2>
        <p>Access your account to contribute and monitor disaster relief.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-field"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-field"
            />
          </div>

          <button type="submit" className="cta-button-secondary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {status && (
            <p
              style={{ marginTop: '1rem' }}
              className={status.startsWith("Error") ? 'text-critical' : 'text-primary'}
            >
              {status}
            </p>
          )}
        </form>

        <p className="mt-4 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
