import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        onLogin(data.token, data.user);
        // Redirect based on role
        if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'university_staff') {
          navigate('/university');
        } else {
          navigate('/student');
        }
      } else {
        setError(data.message || 'Invalid login credentials');
      }
    } catch (err) {
      setError('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '0 20px' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <h2 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
          Welcome Back
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginBottom: '32px' }}>
          Log in to access your certificate dashboard
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--error-red)', borderRadius: '8px', color: 'white', padding: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>EMAIL ADDRESS</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input
              type="email"
              required
              placeholder="name@university.edu"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '32px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>PASSWORD</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px', marginBottom: '24px' }}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          Sign In
        </button>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" className="gradient-text" style={{ fontWeight: 600, textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}
