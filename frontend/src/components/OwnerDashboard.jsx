import React, { useState, useEffect } from 'react';
import Api from '../services/api.js';
import { Home, ClipboardList, CreditCard, MessageSquare, PlusCircle } from 'lucide-react';

function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('hostels');

  // Data States
  const [hostels, setHostels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Hostel Form State
  const [hostelForm, setHostelForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    contactNumber: '',
    upiId: '',
    bankAccount: '',
    type: 'HOSTEL',
    allowedOccupants: 'ANY',
    messTimetable: '',
    googleMapsUrl: '',
    facilityIds: [],
    imageUrls: ['']
  });
  const [hostelSuccess, setHostelSuccess] = useState('');

  // 2. Room Form State
  const [selectedHostelForRoom, setSelectedHostelForRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomType: 'Single',
    capacity: 1,
    pricePerMonth: '',
    imageUrl: ''
  });
  const [roomSuccess, setRoomSuccess] = useState('');

  // 3. Complaint Reply Form State
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [ownerReply, setOwnerReply] = useState('');
  const [complaintStatus, setComplaintStatus] = useState('RESOLVED');

  // 4. Record Payment State
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const hostelsData = await Api.hostels.getOwnerHostels();
      setHostels(hostelsData);

      const bookingsData = await Api.bookings.getOwnerBookings();
      setBookings(bookingsData);

      const invoicesData = await Api.invoices.getOwnerInvoices();
      setInvoices(invoicesData);

      const complaintsData = await Api.complaints.getOwnerComplaints();
      setComplaints(complaintsData);

      const facilitiesData = await Api.facilities.getAll();
      setFacilities(facilitiesData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const [expandedHostelId, setExpandedHostelId] = useState(null);

  const toggleExpandHostel = async (hostelId) => {
    if (expandedHostelId === hostelId) {
      setExpandedHostelId(null);
    } else {
      setExpandedHostelId(hostelId);
      // Fetch detailed hostel information including rooms and occupied bookings
      try {
        const detailedData = await Api.hostels.getById(hostelId);
        // Update our hostels list with this detailed one so the rooms list is available
        setHostels(hostels.map(h => h.id === hostelId ? { ...h, rooms: detailedData.rooms } : h));
      } catch (err) {
        setError('Failed to load hostel details.');
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHostelForm({
          ...hostelForm,
          imageUrls: [reader.result]
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMessTimetableUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHostelForm({
          ...hostelForm,
          messTimetable: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoomImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRoomForm({
          ...roomForm,
          imageUrl: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form Handlers
  const handleHostelSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setHostelSuccess('');

    try {
      await Api.hostels.create({
        ...hostelForm,
        facilityIds: hostelForm.facilityIds.map(id => parseInt(id))
      });
      setHostelSuccess('Listing published successfully!');
      setHostelForm({
        name: '',
        description: '',
        address: '',
        city: '',
        contactNumber: '',
        upiId: '',
        bankAccount: '',
        type: 'HOSTEL',
        allowedOccupants: 'ANY',
        messTimetable: '',
        googleMapsUrl: '',
        facilityIds: [],
        imageUrls: ['']
      });
      
      const hostelsData = await Api.hostels.getOwnerHostels();
      setHostels(hostelsData);
    } catch (err) {
      setError(err.message || 'Failed to create hostel.');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRoomSuccess('');

    try {
      await Api.hostels.addRoom(selectedHostelForRoom.id, {
        ...roomForm,
        capacity: parseInt(roomForm.capacity),
        pricePerMonth: parseFloat(roomForm.pricePerMonth)
      });
      setRoomSuccess('Room added successfully!');
      setRoomForm({
        roomNumber: '',
        roomType: 'Single',
        capacity: 1,
        pricePerMonth: '',
        imageUrl: ''
      });
      setTimeout(() => setSelectedHostelForRoom(null), 1500);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add room.');
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    setError('');
    try {
      await Api.bookings.updateStatus(bookingId, status);
      loadData();
    } catch (err) {
      setError(err.message || 'Booking update failed.');
    }
  };

  const handleEviction = async (bookingId) => {
    if (!window.confirm('Are you sure you want to terminate this booking? Outstanding pending invoices will be deleted.')) {
      return;
    }
    setError('');
    try {
      await Api.bookings.terminate(bookingId);
      loadData();
    } catch (err) {
      setError(err.message || 'Early checkout termination failed.');
    }
  };

  const handleComplaintReply = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await Api.complaints.reply(activeComplaint.id, {
        ownerReply,
        status: complaintStatus
      });
      setActiveComplaint(null);
      setOwnerReply('');
      
      const complaintsData = await Api.complaints.getOwnerComplaints();
      setComplaints(complaintsData);
    } catch (err) {
      setError(err.message || 'Failed to reply to complaint.');
    }
  };

  const handleRecordOfflinePayment = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await Api.payments.create({
        invoiceId: activeInvoiceForPayment.id,
        amount: parseFloat(activeInvoiceForPayment.amount),
        paymentMethod: 'CASH',
        transactionId: paymentTransactionId || `CASH-OFFLINE-${Date.now()}`
      });
      
      setActiveInvoiceForPayment(null);
      setPaymentTransactionId('');
      
      const invoicesData = await Api.invoices.getOwnerInvoices();
      setInvoices(invoicesData);
    } catch (err) {
      setError(err.message || 'Recording cash payment failed.');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div 
          className={`sidebar-link ${activeTab === 'hostels' ? 'active' : ''}`}
          onClick={() => setActiveTab('hostels')}
        >
          <Home size={18} /> My Hostels
        </div>
        <div 
          className={`sidebar-link ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <ClipboardList size={18} /> Room Bookings
        </div>
        <div 
          className={`sidebar-link ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={18} /> Invoices & Payouts
        </div>
        <div 
          className={`sidebar-link ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          <MessageSquare size={18} /> Complaints
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {error && <div className="alert-box alert-danger">⚠️ {error}</div>}

        {/* 1. My Hostels Tab */}
        {activeTab === 'hostels' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px' }}>
            {/* List Listings */}
            <div>
              <h2 style={{ marginBottom: '20px' }}>Listed Properties</h2>
              {hostels.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>You have no hostels listed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {hostels.map(h => (
                    <div key={h.id} className="room-item-card" style={{ alignItems: 'stretch', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                        <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => toggleExpandHostel(h.id)}>
                          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
                            {h.name} {expandedHostelId === h.id ? '▼' : '▶'}
                          </h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>📍 {h.address}, {h.city}</p>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', fontWeight: 600 }}>
                              {h.type === 'HOSTEL' ? '🏨 Hostel' : h.type === 'ROOM' ? '🚪 Room (PG)' : '🏢 Flat / Apartment'}
                            </span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#e2e8f0' }}>
                              {h.allowedOccupants === 'ANY' ? '👥 Any Occupants' : h.allowedOccupants === 'STUDENTS' ? '🎓 Students Only' : h.allowedOccupants === 'BACHELORS' ? '💼 Bachelors Only' : '👨‍👩‍👧 Families Only'}
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '10px' }}>UPI: {h.upiId || 'N/A'}</p>
                        </div>
                        <div>
                          <button 
                            onClick={() => setSelectedHostelForRoom(h)}
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '12px' }}
                          >
                            🚪 Add Room
                          </button>
                        </div>
                      </div>

                      {/* Expanded Rooms and Occupants Details */}
                      {expandedHostelId === h.id && (
                        <div style={{ width: '100%', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                          <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--primary-color)' }}>
                            Rooms & Occupant Details
                          </h4>
                          {!h.rooms || h.rooms.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No rooms added yet. Click "Add Room" to create one.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {h.rooms.map(room => {
                                const activeBooking = room.bookings && room.bookings[0];
                                return (
                                  <div 
                                    key={room.id} 
                                    style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center', 
                                      background: 'rgba(255,255,255,0.02)', 
                                      padding: '12px 16px', 
                                      borderRadius: '8px', 
                                      border: '1px solid rgba(255,255,255,0.05)',
                                      gap: '15px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                      {room.imageUrl && (
                                        <div style={{ width: '60px', height: '60px', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0 }}>
                                          <img src={room.imageUrl} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                      )}
                                      <div>
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>Room {room.roomNumber}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '10px' }}>({room.roomType})</span>
                                      
                                      {room.status === 'OCCUPIED' && activeBooking ? (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                          👤 Tenant: <strong style={{ color: 'white' }}>{activeBooking.student.name}</strong>
                                          <span style={{ marginLeft: '12px' }}>📅 Check-in: <strong style={{ color: 'white' }}>{new Date(activeBooking.startDate).toLocaleDateString()}</strong></span>
                                          {activeBooking.student.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>📞 Phone: {activeBooking.student.phone}</div>}
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '6px', fontWeight: 600 }}>
                                          🟢 Available for Booking
                                        </div>
                                      )}
                                    </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)' }}>
                                        ₹{room.pricePerMonth}
                                      </div>
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ month</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Hostel Form */}
            <div>
              <div className="booking-card">
                <h3 style={{ marginBottom: '20px' }}><PlusCircle size={16} /> List a New Property</h3>
                {hostelSuccess && <div className="alert-box alert-success">{hostelSuccess}</div>}
                
                <form onSubmit={handleHostelSubmit}>
                  <div className="form-group">
                    <label htmlFor="hName">Property Name</label>
                    <input 
                      type="text" 
                      id="hName"
                      className="form-control"
                      placeholder="Grand Residency / 2BHK Flat"
                      required
                      value={hostelForm.name}
                      onChange={e => setHostelForm({...hostelForm, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label htmlFor="hType">Property Type</label>
                      <select 
                        id="hType"
                        className="form-control"
                        value={hostelForm.type}
                        onChange={e => setHostelForm({...hostelForm, type: e.target.value})}
                      >
                        <option value="HOSTEL">Hostel</option>
                        <option value="ROOM">Room (PG)</option>
                        <option value="FLAT">Flat / Apartment</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="hOccupants">Allowed Occupants</label>
                      <select 
                        id="hOccupants"
                        className="form-control"
                        value={hostelForm.allowedOccupants}
                        onChange={e => setHostelForm({...hostelForm, allowedOccupants: e.target.value})}
                      >
                        <option value="ANY">Any / All</option>
                        <option value="STUDENTS">Students Only</option>
                        <option value="BACHELORS">Bachelors (Working)</option>
                        <option value="FAMILY">Families Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hDesc">Description</label>
                    <textarea 
                      id="hDesc"
                      className="form-control"
                      rows="2"
                      placeholder="Brief details about rooms, location..."
                      value={hostelForm.description}
                      onChange={e => setHostelForm({...hostelForm, description: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hAddress">Address</label>
                    <input 
                      type="text" 
                      id="hAddress"
                      className="form-control"
                      placeholder="12-3 Main Road"
                      required
                      value={hostelForm.address}
                      onChange={e => setHostelForm({...hostelForm, address: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hCity">City</label>
                    <input 
                      type="text" 
                      id="hCity"
                      className="form-control"
                      placeholder="Visakhapatnam"
                      required
                      value={hostelForm.city}
                      onChange={e => setHostelForm({...hostelForm, city: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hMaps">Google Maps Location URL (Optional)</label>
                    <input 
                      type="url" 
                      id="hMaps"
                      className="form-control"
                      placeholder="https://maps.app.goo.gl/..."
                      value={hostelForm.googleMapsUrl}
                      onChange={e => setHostelForm({...hostelForm, googleMapsUrl: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hContact">Contact Phone</label>
                    <input 
                      type="text" 
                      id="hContact"
                      className="form-control"
                      placeholder="9998887776"
                      value={hostelForm.contactNumber}
                      onChange={e => setHostelForm({...hostelForm, contactNumber: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hUpi">UPI ID (For payments)</label>
                    <input 
                      type="text" 
                      id="hUpi"
                      className="form-control"
                      placeholder="owner@upi"
                      value={hostelForm.upiId}
                      onChange={e => setHostelForm({...hostelForm, upiId: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hBank">Bank Details (Optional)</label>
                    <input 
                      type="text" 
                      id="hBank"
                      className="form-control"
                      placeholder="Bank: HDFC, A/C: 12345, IFSC: HDFC0001"
                      value={hostelForm.bankAccount}
                      onChange={e => setHostelForm({...hostelForm, bankAccount: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Select Facilities Available</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                      {facilities.map(f => (
                        <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                          <input 
                            type="checkbox"
                            value={f.id}
                            checked={hostelForm.facilityIds.includes(f.id.toString())}
                            onChange={e => {
                              const checked = e.target.checked;
                              const updated = checked 
                                ? [...hostelForm.facilityIds, f.id.toString()]
                                : hostelForm.facilityIds.filter(id => id !== f.id.toString());
                              setHostelForm({...hostelForm, facilityIds: updated});
                            }}
                          />
                          {f.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hImgFile">Hostel Image (Upload from Camera or Gallery)</label>
                    <input 
                      type="file" 
                      id="hImgFile"
                      accept="image/*"
                      className="form-control"
                      style={{ padding: '8px' }}
                      onChange={handleImageUpload}
                    />
                    {hostelForm.imageUrls[0] && (
                      <div style={{ marginTop: '10px', width: '100%', height: '150px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <img src={hostelForm.imageUrls[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="hMessTimetable">Mess Timetable Image (Optional - Camera/Gallery)</label>
                    <input 
                      type="file" 
                      id="hMessTimetable"
                      accept="image/*"
                      className="form-control"
                      style={{ padding: '8px' }}
                      onChange={handleMessTimetableUpload}
                    />
                    {hostelForm.messTimetable && (
                      <div style={{ marginTop: '10px', width: '100%', height: '150px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                        <img src={hostelForm.messTimetable} alt="Timetable Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Publish Listing
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 2. Room Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Active Tenant Bookings & Requests</h2>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No tenant bookings found for your listings.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Property / Room</th>
                      <th>Stay Period</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>{booking.student.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{booking.student.email} | {booking.student.phone || 'N/A'}</div>
                        </td>
                        <td>
                          {booking.room.hostel.name}
                          <div style={{ fontSize: '12px', color: 'var(--primary-color)' }}>Room {booking.room.roomNumber} ({booking.room.roomType})</div>
                        </td>
                        <td>
                          {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`status-pill status-${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {booking.status === 'PENDING' && (
                              <>
                                <button 
                                  onClick={() => handleBookingAction(booking.id, 'ACCEPTED')}
                                  className="btn btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--success)' }}
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => handleBookingAction(booking.id, 'REJECTED')}
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {booking.status === 'ACCEPTED' && (
                              <button 
                                onClick={() => handleEviction(booking.id)}
                                className="btn btn-outline" 
                                style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                              >
                                Terminate Tenancy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Invoices Ledger</h2>
            {invoices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No invoices generated yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Billing Month</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <strong>{inv.booking.student.name}</strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{inv.booking.room.hostel.name} | Room {inv.booking.room.roomNumber}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{inv.billingMonth}</td>
                        <td>₹{inv.amount}</td>
                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-pill ${inv.status === 'PAID' ? 'status-available' : 'status-pending'}`}>
                            {inv.status}
                          </span>
                          {inv.status === 'PAID' && inv.payments && inv.payments[0] && (
                            <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)', textAlign: 'left' }}>
                              {inv.payments[0].transactionId && !inv.payments[0].transactionId.startsWith('TXN-PENDING-') && !inv.payments[0].transactionId.startsWith('TXN-CASH-') && (
                                <div style={{ wordBreak: 'break-all' }}>Ref: <strong style={{ color: 'white' }}>{inv.payments[0].transactionId}</strong></div>
                              )}
                              {inv.payments[0].screenshot && (
                                <button
                                  onClick={() => setViewScreenshotUrl(inv.payments[0].screenshot)}
                                  className="btn btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '10px', marginTop: '4px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  🖼️ View Screenshot
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {inv.status === 'PENDING' && (
                            <button 
                              onClick={() => setActiveInvoiceForPayment(inv)}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              💵 Record Cash
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. Complaints Tab */}
        {activeTab === 'complaints' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Tenant Complaints File</h2>
            {complaints.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No complaints logged.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {complaints.map((c) => (
                  <div key={c.id} className="room-item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{c.title}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          By: <strong>{c.student.name}</strong> ({c.hostel.name})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`status-pill ${c.status === 'RESOLVED' ? 'status-available' : 'status-pending'}`}>
                          {c.status}
                        </span>
                        {c.status !== 'RESOLVED' && (
                          <button 
                            onClick={() => {
                              setActiveComplaint(c);
                              setOwnerReply(c.ownerReply || '');
                            }}
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '5px' }}>{c.description}</p>
                    {c.ownerReply && (
                      <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>Your Resolution Reply:</span>
                        <p style={{ fontSize: '13px', color: 'white', marginTop: '4px' }}>{c.ownerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Room Modal */}
        {selectedHostelForRoom && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <span className="modal-close" onClick={() => setSelectedHostelForRoom(null)}>×</span>
              <h3 style={{ marginBottom: '20px' }}>Add Room to {selectedHostelForRoom.name}</h3>
              {roomSuccess && <div className="alert-box alert-success">{roomSuccess}</div>}

              <form onSubmit={handleRoomSubmit}>
                <div className="form-group">
                  <label htmlFor="rNum">Room Number / ID</label>
                  <input 
                    type="text" 
                    id="rNum"
                    className="form-control"
                    placeholder="404"
                    required
                    value={roomForm.roomNumber}
                    onChange={e => setRoomForm({...roomForm, roomNumber: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rType">Room Sharing Type</label>
                  <select 
                    id="rType" 
                    className="form-control form-select"
                    value={roomForm.roomType}
                    onChange={e => setRoomForm({...roomForm, roomType: e.target.value})}
                  >
                    <option value="Single">Single Room</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Four Sharing">Four Sharing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rCap">Maximum Capacity (Occupants)</label>
                  <input 
                    type="number" 
                    id="rCap"
                    className="form-control"
                    min="1"
                    required
                    value={roomForm.capacity}
                    onChange={e => setRoomForm({...roomForm, capacity: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rPrice">Rent Per Month (₹)</label>
                  <input 
                    type="number" 
                    id="rPrice"
                    className="form-control"
                    placeholder="8000"
                    required
                    value={roomForm.pricePerMonth}
                    onChange={e => setRoomForm({...roomForm, pricePerMonth: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rImgFile">Room Photo (Optional - Camera/Gallery)</label>
                  <input 
                    type="file" 
                    id="rImgFile"
                    accept="image/*"
                    className="form-control"
                    style={{ padding: '8px' }}
                    onChange={handleRoomImageUpload}
                  />
                  {roomForm.imageUrl && (
                    <div style={{ marginTop: '10px', width: '100%', height: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <img src={roomForm.imageUrl} alt="Room Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Register Room
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Complaint Resolution Modal */}
        {activeComplaint && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <span className="modal-close" onClick={() => setActiveComplaint(null)}>×</span>
              <h3 style={{ marginBottom: '20px' }}>Resolve Support Ticket</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '15px' }}>
                Ticket: <strong>{activeComplaint.title}</strong><br />
                Raised By: {activeComplaint.student.name}
              </p>

              <form onSubmit={handleComplaintReply}>
                <div className="form-group">
                  <label htmlFor="cReply">Resolution Reply</label>
                  <textarea 
                    id="cReply"
                    className="form-control"
                    rows="4"
                    placeholder="Describe action taken to resolve this issue..."
                    required
                    value={ownerReply}
                    onChange={e => setOwnerReply(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="cStat">Update Status</label>
                  <select 
                    id="cStat" 
                    className="form-control form-select"
                    value={complaintStatus}
                    onChange={e => setComplaintStatus(e.target.value)}
                  >
                    <option value="RESOLVED">RESOLVED (Issue Closed)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Under Review)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Save Resolution
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Cash Record Modal */}
        {activeInvoiceForPayment && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <span className="modal-close" onClick={() => setActiveInvoiceForPayment(null)}>×</span>
              <h3 style={{ marginBottom: '20px' }}>Record Cash Payment</h3>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Log payment for tenant <strong>{activeInvoiceForPayment.booking.student.name}</strong></p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Month: {activeInvoiceForPayment.billingMonth}</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)', marginTop: '8px' }}>Received Amount: ₹{activeInvoiceForPayment.amount}</p>
              </div>

              <form onSubmit={handleRecordOfflinePayment}>
                <div className="form-group">
                  <label htmlFor="cashTx">Cash Receipt Reference (Optional)</label>
                  <input 
                    type="text"
                    id="cashTx"
                    className="form-control"
                    placeholder="Enter manual receipt number"
                    value={paymentTransactionId}
                    onChange={e => setPaymentTransactionId(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Record Offline Cash Payment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Screenshot View Modal */}
        {viewScreenshotUrl && (
          <div className="modal-overlay active" onClick={() => setViewScreenshotUrl(null)}>
            <div className="modal-content" style={{ maxWidth: '600px', background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }} onClick={e => e.stopPropagation()}>
              <span className="modal-close" style={{ top: '-15px', right: '-15px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setViewScreenshotUrl(null)}>×</span>
              <img src={viewScreenshotUrl} alt="Payment Screenshot" style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block', maxHeight: '80vh', objectFit: 'contain' }} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default OwnerDashboard;
