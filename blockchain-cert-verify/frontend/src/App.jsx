import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Award, LogIn, LogOut, Shield } from 'lucide-react';
import Verify from './pages/Verify';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const fetchProfile = async (authToken) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      // Offline fallback
      handleLogout();
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setInitializing(false);
    }
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Restoring secure session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Floating Header */}
      <header className="glass-panel" style={{
        margin: '20px', 
        padding: '16px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: '20px',
        zIndex: 100,
        borderRadius: '16px'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
          <Award size={28} className="gradient-text" style={{ stroke: 'url(#cyan-purple-grad)' }} />
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }} className="gradient-text">
            ChainCert
          </span>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
            Public Verify
          </Link>
          
          {user && (
            <>
              {user.role === 'student' && (
                <Link to="/student" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                  My Transcripts
                </Link>
              )}
              {user.role === 'university_staff' && (
                <Link to="/university" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                  Registrar Console
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Auth Button */}
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12px' }}>
                <span style={{ fontWeight: 700 }}>{user.name}</span>
                <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px' }}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '14px' }}>
              <LogIn size={15} />
              Portal Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ minHeight: '80vh', paddingBottom: '60px' }}>
        <Routes>
          <Route path="/" element={<Verify />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'university_staff' ? '/university' : '/student'} /> : <Login onLogin={handleLogin} />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/student" /> : <Register onLogin={handleLogin} />} 
          />
          
          {/* Protected Dashboards */}
          <Route 
            path="/student" 
            element={user && user.role === 'student' ? <StudentDashboard user={user} token={token} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/university" 
            element={user && user.role === 'university_staff' ? <UniversityDashboard user={user} token={token} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin" 
            element={user && user.role === 'admin' ? <AdminDashboard token={token} /> : <Navigate to="/login" />} 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* SVG Gradient definition */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="cyan-purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#7000ff" />
          </linearGradient>
        </defs>
      </svg>
    </BrowserRouter>
  );
}
