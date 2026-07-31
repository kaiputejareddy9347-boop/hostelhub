import React, { useState, useEffect } from 'react';
import Api from '../services/api.js';
import { Calendar, CreditCard, AlertCircle, PlusCircle, Check } from 'lucide-react';

function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  
  // Data States
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Complaint Form State
  const [hostelId, setHostelId] = useState('');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState('');

  // Payment State
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState('');

  // Checkout Date State
  const [modifyingBooking, setModifyingBooking] = useState(null);
  const [newCheckoutDate, setNewCheckoutDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const bookingsData = await Api.bookings.getStudentBookings();
      setBookings(bookingsData);
      
      const invoicesData = await Api.invoices.getStudentInvoices();
      setInvoices(invoicesData);
      
      const complaintsData = await Api.complaints.getStudentComplaints();
      setComplaints(complaintsData);

      if (bookingsData.length > 0) {
        setHostelId(bookingsData[0].room.hostel.id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    setComplaintSuccess('');
    setError('');

    if (!hostelId || !complaintTitle || !complaintDesc) {
      setError('All fields are required.');
      return;
    }

    try {
      await Api.complaints.create({
        hostelId: parseInt(hostelId),
        title: complaintTitle,
        description: complaintDesc
      });
      setComplaintSuccess('Complaint raised successfully!');
      setComplaintTitle('');
      setComplaintDesc('');
      
      // Refresh complaints
      const complaintsData = await Api.complaints.getStudentComplaints();
      setComplaints(complaintsData);
    } catch (err) {
      setError(err.message || 'Failed to raise complaint.');
    }
  };

  const handlePayInvoice = async (e) => {
    e.preventDefault();
    setError('');

    // Validation: Online payments require either a transaction ID or a screenshot
    if (paymentMethod !== 'CASH' && (!transactionId || transactionId.trim() === '') && (!screenshot || screenshot.trim() === '')) {
      setError('Either a Transaction ID or a Payment Screenshot is compulsory.');
      return;
    }

    try {
      await Api.payments.create({
        invoiceId: payingInvoice.id,
        amount: parseFloat(payingInvoice.amount),
        paymentMethod,
        transactionId: transactionId.trim() !== '' ? transactionId.trim() : undefined,
        screenshot: screenshot || undefined
      });

      setPayingInvoice(null);
      setTransactionId('');
      setScreenshot('');
      
      // Refresh Invoices & bookings
      const invoicesData = await Api.invoices.getStudentInvoices();
      setInvoices(invoicesData);
    } catch (err) {
      setError(err.message || 'Payment processing failed.');
    }
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModifyCheckout = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await Api.bookings.changeCheckoutDate(modifyingBooking.id, newCheckoutDate);
      setModifyingBooking(null);
      setNewCheckoutDate('');

      // Refresh Invoices & bookings
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to change checkout date.');
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
          className={`sidebar-link ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <Calendar size={18} /> My Stays
        </div>
        <div 
          className={`sidebar-link ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={18} /> My Bills
        </div>
        <div 
          className={`sidebar-link ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          <AlertCircle size={18} /> Complaints
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {error && <div className="alert-box alert-danger">⚠️ {error}</div>}

        {/* 1. Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>My Stays & Subscriptions</h2>
            {bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You have no room bookings yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Hostel</th>
                      <th>Room</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>{booking.room.hostel.name}</strong>
                          {booking.room.hostel.owner && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Owner: {booking.room.hostel.owner.name} <br />
                              📞 {booking.room.hostel.owner.phone || 'N/A'} <br />
                              ✉️ {booking.room.hostel.owner.email}
                            </div>
                          )}
                        </td>
                        <td>Room {booking.room.roomNumber} ({booking.room.roomType})</td>
                        <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                        <td>{new Date(booking.endDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-pill status-${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          {booking.status === 'ACCEPTED' && (
                            <button 
                              onClick={() => {
                                setModifyingBooking(booking);
                                const dateStr = new Date(booking.endDate).toISOString().split('T')[0];
                                setNewCheckoutDate(dateStr);
                              }}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              📅 Extend Stay
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

        {/* 2. Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>My Bills</h2>
            {invoices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No invoices have been generated.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Hostel</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{inv.billingMonth}</td>
                        <td>₹{inv.amount}</td>
                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td>{inv.booking.room.hostel.name}</td>
                        <td>
                          <span className={`status-pill ${inv.status === 'PAID' ? 'status-available' : 'status-pending'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          {inv.status === 'PENDING' && (
                            <button 
                              onClick={() => setPayingInvoice(inv)} 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              💳 Pay Now
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

        {/* 3. Complaints Tab */}
        {activeTab === 'complaints' && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '30px' }}>
            {/* List Complaints */}
            <div>
              <h2 style={{ marginBottom: '20px' }}>Support Complaints</h2>
              {complaints.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No support complaints filed.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {complaints.map((c) => (
                    <div key={c.id} className="room-item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ fontWeight: 600 }}>{c.title}</h4>
                        <span className={`status-pill ${c.status === 'RESOLVED' ? 'status-available' : 'status-pending'}`}>
                          {c.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{c.description}</p>
                      {c.ownerReply && (
                        <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>Owner Reply:</span>
                          <p style={{ fontSize: '13px', color: 'white', marginTop: '4px' }}>{c.ownerReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Raise Complaint Form */}
            <div>
              <div className="booking-card">
                <h3 style={{ marginBottom: '20px' }}><PlusCircle size={16} /> Raise Support Ticket</h3>
                {complaintSuccess && <div className="alert-box alert-success">{complaintSuccess}</div>}
                
                {bookings.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>You must have an active booking to raise complaints.</p>
                ) : (
                  <form onSubmit={handleRaiseComplaint}>
                    <div className="form-group">
                      <label htmlFor="hostelSelect">Select Hostel</label>
                      <select 
                        id="hostelSelect" 
                        className="form-control form-select"
                        value={hostelId}
                        onChange={(e) => setHostelId(e.target.value)}
                      >
                        {bookings.map((b) => (
                          <option key={b.id} value={b.room.hostel.id}>
                            {b.room.hostel.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="compTitle">Issue Title</label>
                      <input 
                        type="text" 
                        id="compTitle"
                        className="form-control"
                        placeholder="e.g. WiFi not working"
                        required
                        value={complaintTitle}
                        onChange={(e) => setComplaintTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="compDesc">Details</label>
                      <textarea 
                        id="compDesc"
                        className="form-control"
                        rows="4"
                        placeholder="Provide details about the issue..."
                        required
                        value={complaintDesc}
                        onChange={(e) => setComplaintDesc(e.target.value)}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Submit Support Ticket
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {payingInvoice && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <span className="modal-close" onClick={() => setPayingInvoice(null)}>×</span>
              <h3 style={{ marginBottom: '20px' }}>Process Invoice Payment</h3>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Invoice For: <strong>{payingInvoice.billingMonth}</strong></p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginTop: '5px' }}>Amount Due: ₹{payingInvoice.amount}</p>
              </div>

              <form onSubmit={handlePayInvoice}>
                <div className="form-group">
                  <label htmlFor="payMethod">Payment Method</label>
                  <select 
                    id="payMethod"
                    className="form-control form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NETBANKING">Netbanking</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="txId">Transaction ID (Required if no screenshot)</label>
                  <input 
                    type="text"
                    id="txId"
                    className="form-control"
                    placeholder="Enter transaction reference ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="scrFile">Payment Screenshot (Required if no Transaction ID)</label>
                  <input 
                    type="file" 
                    id="scrFile"
                    accept="image/*"
                    className="form-control"
                    style={{ padding: '8px' }}
                    onChange={handleScreenshotUpload}
                  />
                  {screenshot && (
                    <div style={{ marginTop: '10px', width: '100%', height: '120px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <img src={screenshot} alt="Screenshot Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Confirm Payment
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modify Checkout Modal */}
        {modifyingBooking && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <span className="modal-close" onClick={() => setModifyingBooking(null)}>×</span>
              <h3 style={{ marginBottom: '20px' }}>Modify checkout date</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Extending your checkout date will automatically calculate and generate new monthly invoices.
              </p>

              <form onSubmit={handleModifyCheckout}>
                <div className="form-group">
                  <label htmlFor="newCheckout">New Checkout Date</label>
                  <input 
                    type="date"
                    id="newCheckout"
                    className="form-control"
                    required
                    value={newCheckoutDate}
                    onChange={(e) => setNewCheckoutDate(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Update Stay
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default StudentDashboard;
