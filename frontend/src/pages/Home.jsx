import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Api from '../services/api.js';
import { Search, MapPin, Building, Phone } from 'lucide-react';

function Home() {
  const [hostels, setHostels] = useState([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = Api.auth.getCurrentUser();

  const loadHostels = async (searchCity = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await Api.hostels.getAll(searchCity);
      setHostels(data);
    } catch (err) {
      setError(err.message || 'Failed to load hostels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostels();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadHostels(city);
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="logo">🏢 HostelHub</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {user ? (
            <>
              <li>
                <Link to="/dashboard" className="btn btn-secondary">
                  {user.role === 'OWNER' ? '🛠️ Manage Listings' : '📝 My Bookings'}
                </Link>
              </li>
              <li>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
                  Hi, {user.name}
                </span>
              </li>
              <li>
                <button onClick={() => Api.auth.logout()} className="btn btn-outline">
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="btn btn-secondary">Log In</Link></li>
              <li><Link to="/register" className="btn btn-primary">Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <h1 className="hero-title">Find Your Perfect <br />Home Away From Home</h1>
        <p className="hero-subtitle">
          Discover premium, student-friendly hostels with high-speed WiFi, security, and top-tier facilities.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="search-container">
          <div className="search-field" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '15px' }}>
            <label htmlFor="searchCity">Location / City</label>
            <input
              type="text"
              id="searchCity"
              placeholder="Enter city (e.g. Visakhapatnam)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Search Hostels
          </button>
        </form>
      </header>

      {/* Featured Hostels */}
      <section>
        <h2 className="section-title">✨ Featured Hostels</h2>

        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading hostels...
          </div>
        ) : hostels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px' }}>🔍</div>
            <p style={{ fontSize: '18px', marginTop: '10px', fontWeight: 600 }}>No hostels found</p>
            <p style={{ fontSize: '14px', marginTop: '5px', color: 'var(--text-muted)' }}>
              Try searching for another city, or search without filters.
            </p>
          </div>
        ) : (
          <div className="hostels-grid">
            {hostels.map((hostel) => {
              const facilitiesHtml = hostel.facilities.slice(0, 3).map((f) => (
                <span key={f.id} className="facility-badge" style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {f.name}
                </span>
              ));

              return (
                <div
                  key={hostel.id}
                  className="hostel-card"
                  onClick={() => navigate(`/hostels/${hostel.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="hostel-img-placeholder">
                    {hostel.images && hostel.images.length > 0 && (
                      <img
                        src={hostel.images[0].imageUrl}
                        alt={hostel.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
                      />
                    )}
                  </div>
                  <div className="hostel-info">
                    <h3 className="hostel-name">{hostel.name}</h3>
                    <div className="hostel-location">
                      <MapPin size={12} /> {hostel.address}, {hostel.city}
                    </div>
                    <p className="hostel-desc">{hostel.description || 'No description provided.'}</p>
                    <div className="facilities-container" style={{ marginBottom: '15px' }}>
                      {facilitiesHtml}
                    </div>
                    <div className="hostel-footer">
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {hostel.contactNumber || 'N/A'}
                      </span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '14px' }}>
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
