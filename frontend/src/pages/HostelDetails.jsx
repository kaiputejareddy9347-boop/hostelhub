import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Api from '../services/api.js';
import { MapPin, Phone, Building, Calendar, Info } from 'lucide-react';

function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = Api.auth.getCurrentUser();

  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Form State
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  useEffect(() => {
    const fetchHostelData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await Api.hostels.getById(id);
        setHostel(data.hostel);
        setRooms(data.rooms || []);
        
        // Auto-select first available room if any
        const available = (data.rooms || []).filter(r => r.status === 'AVAILABLE');
        if (available.length > 0) {
          setSelectedRoomId(available[0].id.toString());
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch hostel details.');
      } finally {
        setLoading(false);
      }
    };

    fetchHostelData();
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'STUDENT') {
      setBookingError('Only student accounts can book hostel rooms.');
      return;
    }

    if (!selectedRoomId || !startDate || !endDate) {
      setBookingError('All fields are required.');
      return;
    }

    setBookingLoading(true);

    try {
      await Api.bookings.create({
        roomId: parseInt(selectedRoomId),
        startDate,
        endDate
      });
      setBookingSuccess('Booking request sent successfully! You can track its status on your dashboard.');
      // Reload rooms to update availability status if immediate (usually accepted later, but good practice)
      const data = await Api.hostels.getById(id);
      setRooms(data.rooms || []);
    } catch (err) {
      setBookingError(err.message || 'Booking request failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>
        Loading hostel details...
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', color: 'var(--danger)' }}>
        ⚠️ {error || 'Hostel not found'}
        <div style={{ marginTop: '20px' }}>
          <Link to="/" className="btn btn-secondary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="logo">🏢 HostelHub</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          {user ? (
            <>
              <li><Link to="/dashboard" className="btn btn-secondary">Dashboard</Link></li>
              <li><button onClick={() => Api.auth.logout()} className="btn btn-outline">Log Out</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="btn btn-secondary">Log In</Link></li>
              <li><Link to="/register" className="btn btn-primary">Sign Up</Link></li>
            </>
          )}
        </ul>
      </nav>

      {/* Details Banner */}
      <div className="details-layout">
        <div className="details-main">
          <div className="details-banner">
            {hostel.images && hostel.images.length > 0 && (
              <img
                src={hostel.images[0].imageUrl}
                alt={hostel.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius-lg)', position: 'absolute' }}
              />
            )}
          </div>

          <div className="details-title-row">
            <div>
              <h1>{hostel.name}</h1>
              <div className="hostel-location" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <MapPin size={16} style={{ flexShrink: 0 }} /> {hostel.address}, {hostel.city}
                {hostel.googleMapsUrl && (
                  <a 
                    href={hostel.googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: '#a78bfa', 
                      fontWeight: 600, 
                      marginLeft: '10px', 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      background: 'rgba(124, 58, 237, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '4px'
                    }}
                  >
                    🗺️ View on Google Maps
                  </a>
                )}
              </div>
            </div>
            {hostel.isVerified && (
              <span className="status-pill status-available" style={{ padding: '8px 16px', borderRadius: '20px' }}>
                ✓ Verified Property
              </span>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>About this Hostel</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{hostel.description || 'No description available for this hostel.'}</p>
          </div>

          {/* Facilities */}
          <div>
            <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>Facilities Offered</h3>
            <div className="facilities-container">
              {hostel.facilities && hostel.facilities.length > 0 ? (
                hostel.facilities.map((fac) => (
                  <span key={fac.id} className="facility-badge">
                    {fac.name}
                  </span>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No listed facilities.</p>
              )}
            </div>
          </div>

          {/* Mess Timetable */}
          {hostel.messTimetable && (
            <div style={{ marginTop: '25px' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>🍽️ Mess Timetable</h3>
              <div style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <img src={hostel.messTimetable} alt="Mess Timetable" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            </div>
          )}

          {/* Rooms List */}
          <div>
            <h3 style={{ marginBottom: '15px', fontSize: '20px' }}>{hostel.type === 'MESS' ? '🍽️ Mess Subscription Plans' : 'Room Listings'}</h3>
            {rooms.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>{hostel.type === 'MESS' ? 'No subscription plans configured for this mess yet.' : 'No rooms configured for this hostel yet.'}</p>
            ) : (
              rooms.map((room) => {
                const roomVacancies = room.capacity - (room.bookings ? room.bookings.length : 0);
                return (
                  <div key={room.id} className="room-item-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {room.imageUrl && (
                      <div style={{ width: '100px', height: '80px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={room.imageUrl} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{hostel.type === 'MESS' ? 'Plan' : 'Room'} {room.roomNumber} ({room.roomType})</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{hostel.type === 'MESS' ? 'Subscriber capacity:' : 'Capacity:'} {room.capacity} Person(s)</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                        <span className={`status-pill ${roomVacancies > 0 ? 'status-available' : 'status-occupied'}`}>
                          {roomVacancies > 0 ? 'AVAILABLE' : 'FULLY SUBSCRIBED'}
                        </span>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: roomVacancies > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: roomVacancies > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                          {roomVacancies} / {room.capacity} Vacant
                        </span>
                      </div>
                    </div>
                    <div className="room-price-info" style={{ textAlign: 'right' }}>
                      <div className="room-price">₹{room.pricePerMonth}</div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>per month</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="details-sidebar">
          <div className="booking-card">
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              {hostel.type === 'MESS' ? 'Subscribe to Mess' : 'Reserve a Room'}
            </h3>

            {bookingError && (
              <div className="alert-box alert-danger">
                {bookingError}
              </div>
            )}

            {bookingSuccess && (
              <div className="alert-box alert-success">
                {bookingSuccess}
              </div>
            )}

            {availableRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                <Info size={32} style={{ marginBottom: '10px', color: 'var(--warning)' }} />
                <p style={{ fontWeight: 600 }}>{hostel.type === 'MESS' ? 'Plans Fully Booked' : 'No Available Rooms'}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>This property is currently fully booked.</p>
              </div>
            ) : (
              <form onSubmit={handleBook}>
                <div className="form-group">
                  <label htmlFor="roomSelect">{hostel.type === 'MESS' ? 'Select Plan' : 'Select Room'}</label>
                  <select
                    id="roomSelect"
                    className="form-control form-select"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    required
                  >
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {hostel.type === 'MESS' ? 'Plan' : 'Room'} {room.roomNumber} - {room.roomType} (₹{room.pricePerMonth}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="startDate">{hostel.type === 'MESS' ? 'Subscription Start Date' : 'Check-In Date'}</label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">{hostel.type === 'MESS' ? 'Subscription End Date' : 'Check-Out Date'}</label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '15px' }}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Sending Request...' : (hostel.type === 'MESS' ? 'Send Subscription Request' : 'Send Booking Request')}
                </button>
              </form>
            )}

            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              ℹ️ Sending a request does not charge your account. Upon owner's approval, monthly invoices will be generated for the selection.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HostelDetails;
