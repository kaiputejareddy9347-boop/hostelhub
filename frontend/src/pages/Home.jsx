import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Api from '../services/api.js';
import { Search, MapPin, Building, Phone } from 'lucide-react';

function Home() {
  const [allHostels, setAllHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [city, setCity] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterOccupants, setFilterOccupants] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = Api.auth.getCurrentUser();

  const applyFilters = (data, type, occupants) => {
    let temp = [...data];
    if (type !== 'ALL') {
      temp = temp.filter(h => h.type === type);
    }
    if (occupants !== 'ALL') {
      temp = temp.filter(h => h.allowedOccupants === 'ANY' || h.allowedOccupants === occupants);
    }
    setFilteredHostels(temp);
  };

  const loadHostels = async (searchCity = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await Api.hostels.getAll(searchCity);
      setAllHostels(data);
      applyFilters(data, filterType, filterOccupants);
    } catch (err) {
      setError(err.message || 'Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    applyFilters(allHostels, filterType, filterOccupants);
  }, [filterType, filterOccupants, allHostels]);

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
          Discover premium hostels, rooms, and flats with high-speed WiFi, security, and top-tier facilities.
        </p>

        {/* Search & Filters */}
        <form onSubmit={handleSearch} className="search-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto', gap: '15px', alignItems: 'center', width: '100%', maxWidth: '950px' }}>
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
          <div className="search-field" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '15px' }}>
            <label htmlFor="searchType">Property Type</label>
            <select
              id="searchType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '14px', marginTop: '5px', cursor: 'pointer' }}
            >
              <option value="ALL" style={{ background: '#13111C' }}>All Properties</option>
              <option value="HOSTEL" style={{ background: '#13111C' }}>🏨 Hostels</option>
              <option value="ROOM" style={{ background: '#13111C' }}>🚪 Rooms / PGs</option>
              <option value="FLAT" style={{ background: '#13111C' }}>🏢 Flats / Apartments</option>
            </select>
          </div>
          <div className="search-field" style={{ paddingRight: '15px' }}>
            <label htmlFor="searchOccupants">Allowed Occupants</label>
            <select
              id="searchOccupants"
              value={filterOccupants}
              onChange={(e) => setFilterOccupants(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '14px', marginTop: '5px', cursor: 'pointer' }}
            >
              <option value="ALL" style={{ background: '#13111C' }}>Any Occupants</option>
              <option value="STUDENTS" style={{ background: '#13111C' }}>🎓 Students</option>
              <option value="BACHELORS" style={{ background: '#13111C' }}>💼 Bachelors</option>
              <option value="FAMILY" style={{ background: '#13111C' }}>👨‍👩‍👧 Families</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '15px 25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} /> Search
          </button>
        </form>
      </header>

      {/* Featured Properties */}
      <section>
        <h2 className="section-title">✨ Featured Listings</h2>

        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading properties...
          </div>
        ) : filteredHostels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px' }}>🔍</div>
            <p style={{ fontSize: '18px', marginTop: '10px', fontWeight: 600 }}>No properties found</p>
            <p style={{ fontSize: '14px', marginTop: '5px', color: 'var(--text-muted)' }}>
              Try changing your filters or searching for another city.
            </p>
          </div>
        ) : (
          <div className="hostels-grid">
            {filteredHostels.map((hostel) => {
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
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', fontWeight: 600 }}>
                        {hostel.type === 'HOSTEL' ? '🏨 Hostel' : hostel.type === 'ROOM' ? '🚪 Room (PG)' : '🏢 Flat'}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0' }}>
                        {hostel.allowedOccupants === 'ANY' ? '👥 Any' : hostel.allowedOccupants === 'STUDENTS' ? '🎓 Students' : hostel.allowedOccupants === 'BACHELORS' ? '💼 Bachelors' : '👨‍👩‍👧 Families'}
                      </span>
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
