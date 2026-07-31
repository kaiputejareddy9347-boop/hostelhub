import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Api from '../services/api.js';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STUDENT',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await Api.auth.register(
        formData.username,
        formData.email,
        formData.password,
        formData.role,
        formData.name,
        formData.phone
      );
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="logo">🏢 HostelHub</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/login" className="btn btn-secondary">Log In</Link></li>
        </ul>
      </nav>

      {/* Register Card */}
      <div className="auth-wrapper" style={{ padding: '40px 20px' }}>
        <div className="auth-card" style={{ maxWidth: '520px' }}>
          <div className="auth-header">
            <h2>Create an Account</h2>
            <p>Join HostelHub as a tenant or property owner</p>
          </div>

          {error && (
            <div className="alert-box alert-danger">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="alert-box alert-success">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="john@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="form-control"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                placeholder="johndoe12"
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">I am a...</label>
              <select
                id="role"
                name="role"
                className="form-control form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="STUDENT">Tenant (looking for rooms/flats)</option>
                <option value="OWNER">Property Owner (listing properties)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p style={{ marginTop: '25px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
