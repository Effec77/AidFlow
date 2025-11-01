import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import '../css/Register.css';

const Register = () => {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'volunteer', // Default role
    gender: '',
    country: '',
    state: '',
    city: '',
    address: '',
    companyType: '',
    occupation: '',
    volunteerSkills: [],
  });

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Animation observer for fade-in transitions
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
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prevData => {
        const newSkills = checked
          ? [...prevData.volunteerSkills, value]
          : prevData.volunteerSkills.filter(skill => skill !== value);
        return { ...prevData, volunteerSkills: newSkills };
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Registering...');

    const dataToSend = Object.fromEntries(
      Object.entries(formData).filter(([key, v]) => {
        if (key === 'gender') return v !== '';
        return v !== null && v !== '' && (Array.isArray(v) ? v.length > 0 : true);
      })
    );

    if (!dataToSend.role) dataToSend.role = 'volunteer';

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();

        login(result.token, result.role);
        setStatus(`Registration successful! Redirecting as ${result.role}...`);

        // Redirect based on role
        if (result.role === 'affected citizen') {
          navigate('/');
        } else {
          navigate('/inventory');
        }

      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed due to server error.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="register" className="register-section hidden-section">
      {/* Left Carousel */}
      <div className="carousel-left">
        <img src="/imgs/dis1.jpg" alt="Aid" />
        <img src="/imgs/dis2.jpg" alt="Relief" />
        <img src="/imgs/dis3.jpeg" alt="Rescue" />
        <img src="/imgs/dis4.png" alt="Help" />
        <img src="/imgs/dis1.jpg" alt="Aid" />
        <img src="/imgs/dis2.jpg" alt="Relief" />
        <img src="/imgs/dis3.jpeg" alt="Rescue" />
        <img src="/imgs/dis4.png" alt="Help" />
      </div>

      <div className="container register-card">
        <h2 className="section-title">Join AidFlow AI</h2>
        <p>Create an account to contribute to disaster relief efforts.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-row">
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

            <div className="form-row">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-field"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-field"
              />
            </div>
          </div>

          <div className="form-group">
            {/* Role Selection */}
            <div className="form-row">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="form-field full-width-field"
              >
                <option value="volunteer">Register as Volunteer/Organization</option>
                <option value="affected citizen">Register as Affected Citizen</option>
              </select>
            </div>

            <div className="form-row">
              <input
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleChange}
                required
                className="form-field"
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                required
                className="form-field"
              />
            </div>

            <div className="form-row">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
                className="form-field full-width-field"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-row">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
                className="form-field full-width-field"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-row">
              <select
                name="companyType"
                value={formData.companyType}
                onChange={handleChange}
                required
                className="form-field"
              >
                <option value="">Company Affiliation</option>
                <option value="NGO">NGO</option>
                <option value="Private">Private</option>
                <option value="Individual">Individual</option>
                <option value="Government Employee">Government Employee</option>
              </select>

              <input
                type="text"
                name="occupation"
                placeholder="Occupation"
                value={formData.occupation}
                onChange={handleChange}
                required
                className="form-field full-width-field"
              />
            </div>
          </div>

          {/* Skills shown only for volunteers */}
          {formData.role !== 'affected citizen' && (
            <div className="volunteer-skills-group">
              <label>What can you do?</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="volunteerSkills"
                    value="Transport"
                    checked={formData.volunteerSkills.includes('Transport')}
                    onChange={handleChange}
                  />
                  Volunteer in transport
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="volunteerSkills"
                    value="Fundraising"
                    checked={formData.volunteerSkills.includes('Fundraising')}
                    onChange={handleChange}
                  />
                  Provide funds/resources
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="volunteerSkills"
                    value="Information Supply"
                    checked={formData.volunteerSkills.includes('Information Supply')}
                    onChange={handleChange}
                  />
                  Supply info
                </label>
              </div>
            </div>
          )}

          <button type="submit" className="cta-button-secondary" disabled={loading}>
            {loading ? 'Processing...' : 'Register'}
          </button>

          {status && (
            <p
              style={{ marginTop: '1rem' }}
              className={status.startsWith('Error') ? 'text-red-500' : 'text-green-500'}
            >
              {status}
            </p>
          )}
        </form>
      </div>

      {/* Right Carousel */}
      <div className="carousel-right">
        <img src="/imgs/dis1.jpg" alt="Aid" />
        <img src="/imgs/dis2.jpg" alt="Relief" />
        <img src="/imgs/dis3.jpeg" alt="Rescue" />
        <img src="/imgs/dis4.png" alt="Help" />
        <img src="/imgs/dis1.jpg" alt="Aid" />
        <img src="/imgs/dis2.jpg" alt="Relief" />
        <img src="/imgs/dis3.jpeg" alt="Rescue" />
        <img src="/imgs/dis4.png" alt="Help" />
      </div>
    </section>
  );
};

export default Register;
