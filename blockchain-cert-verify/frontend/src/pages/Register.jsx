import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Wallet, FileSpreadsheet, Loader2, UserPlus } from 'lucide-react';

export default function Register({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [walletAddress, setWalletAddress] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [department, setDepartment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Construct request body
    const bodyData = {
      name,
      email,
      password,
      role,
      walletAddress: walletAddress || null
    };

    if (role === 'student') {
      bodyData.studentNumber = studentNumber;
      bodyData.enrollmentDate = enrollmentDate;
      bodyData.department = department;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await response.json();

      if (data.success) {
        onLogin(data.token, data.user);
        if (data.user.role === 'university_staff') {
          navigate('/university');
        } else {
          navigate('/student');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '40px 20px' }}>
      <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '40px' }}>
        <h2 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '8px' }}>
          Create Account
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginBottom: '32px' }}>
          Register to issue or access academic credentials
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--error-red)', borderRadius: '8px', color: 'white', padding: '12px', marginBottom: '20px', fontSize: '13px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>FULL NAME</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <User size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              required
              placeholder="John Doe"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>
        </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
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

        {/* Role Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>ACCOUNT TYPE / ROLE</label>
          <select
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-secondary)', cursor: 'pointer' }}
          >
            <option value="student">Student</option>
            <option value="university_staff">University Registrar Staff</option>
          </select>
        </div>

        {/* Wallet Address (Optional for student, recommended for staff) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            ETHEREUM WALLET ADDRESS {role === 'university_staff' && '(REQUIRED)'}
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Wallet size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              required={role === 'university_staff'}
              placeholder="0x..."
              className="input-field"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
            />
          </div>
        </div>

        {/* Student Fields */}
        {role === 'student' && (
          <div className="animate-fade-in" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>STUDENT ID NUMBER</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FileSpreadsheet size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="2026-90412"
                    className="input-field"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    style={{ width: '100%', paddingLeft: '48px' }}
                  />
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>ENROLLMENT DATE</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>ACADEMIC DEPARTMENT</label>
              <input
                type="text"
                required
                placeholder="Computer Science & Engineering"
                className="input-field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '16px', marginTop: '12px', marginBottom: '24px' }}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
          Register
        </button>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" className="gradient-text" style={{ fontWeight: 600, textDecoration: 'none' }}>
            Log in here
          </Link>
        </p>
      </form>
    </div>
  );
}
