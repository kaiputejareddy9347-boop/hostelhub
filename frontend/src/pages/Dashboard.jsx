import React from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import Api from '../services/api.js';
import StudentDashboard from '../components/StudentDashboard.jsx';
import OwnerDashboard from '../components/OwnerDashboard.jsx';

function Dashboard() {
  const user = Api.auth.getCurrentUser();
  const navigate = useNavigate();

  if (!Api.auth.isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="logo">🏢 HostelHub</Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
              Logged in as: <strong>{user.name} ({user.role})</strong>
            </span>
          </li>
          <li>
            <button onClick={() => Api.auth.logout()} className="btn btn-outline" style={{ padding: '6px 14px' }}>
              Log Out
            </button>
          </li>
        </ul>
      </nav>

      {/* Conditional Dashboard Mounting */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {user.role === 'OWNER' ? (
          <OwnerDashboard />
        ) : (
          <StudentDashboard />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
