import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FieldError from '../components/FieldError';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collectErrors, validateEmail, validateRequired } from '../utils/validation';

function getDashboardPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'university_staff') return '/staff';
  return '/student';
}

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = collectErrors([
      ['email', validateEmail(email)],
      ['password', validateRequired(password, 'Password')]
    ]);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      toast.success('Signed in successfully');
      const redirect = location.state?.from?.pathname || getDashboardPath(user.role);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="subtitle">University Certificate Verification System</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div className={`form-field ${fieldErrors.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              autoComplete="email"
              disabled={loading}
            />
            <FieldError error={fieldErrors.email} />
          </div>
          <div className={`form-field ${fieldErrors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
              autoComplete="current-password"
              disabled={loading}
            />
            <FieldError error={fieldErrors.password} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-footer">
          <Link to="/verify">Verify a certificate publicly</Link>
        </p>
      </div>
    </div>
  );
}
