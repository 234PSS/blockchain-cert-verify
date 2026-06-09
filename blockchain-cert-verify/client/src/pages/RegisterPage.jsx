import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FieldError from '../components/FieldError';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  collectErrors,
  validateEmail,
  validateMinLength,
  validatePassword,
  validateRequired,
  validateWallet
} from '../utils/validation';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentNumber: '',
    enrollmentDate: '',
    department: '',
    walletAddress: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const checks = [
      ['name', validateMinLength(form.name, 2, 'Name')],
      ['email', validateEmail(form.email)],
      ['password', validatePassword(form.password)],
      ['walletAddress', validateWallet(form.walletAddress)]
    ];
    if (form.role === 'student') {
      checks.push(
        ['studentNumber', validateRequired(form.studentNumber, 'Student number')],
        ['enrollmentDate', validateRequired(form.enrollmentDate, 'Enrollment date')]
      );
    }
    return collectErrors(checks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role
      };
      if (form.walletAddress.trim()) payload.walletAddress = form.walletAddress.trim();
      if (form.role === 'student') {
        payload.studentNumber = form.studentNumber.trim();
        payload.enrollmentDate = form.enrollmentDate;
        if (form.department.trim()) payload.department = form.department.trim();
      }
      const user = await register(payload);
      toast.success('Account created successfully');
      const path =
        user.role === 'admin' ? '/admin'
          : user.role === 'university_staff' ? '/staff'
            : '/student';
      navigate(path, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field) => `form-field ${fieldErrors[field] ? 'has-error' : ''}`;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="subtitle">Register as a student or university staff member</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div className={fieldClass('name')}>
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={update('name')} disabled={loading} />
            <FieldError error={fieldErrors.name} />
          </div>
          <div className={fieldClass('email')}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={update('email')} disabled={loading} />
            <FieldError error={fieldErrors.email} />
          </div>
          <div className={fieldClass('password')}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update('password')}
              disabled={loading}
            />
            <small>Minimum 8 characters</small>
            <FieldError error={fieldErrors.password} />
          </div>
          <div className="form-field">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={update('role')} disabled={loading}>
              <option value="student">Student</option>
              <option value="university_staff">University Staff</option>
            </select>
          </div>
          {form.role === 'student' && (
            <>
              <div className={fieldClass('studentNumber')}>
                <label htmlFor="studentNumber">Student number</label>
                <input
                  id="studentNumber"
                  value={form.studentNumber}
                  onChange={update('studentNumber')}
                  disabled={loading}
                />
                <FieldError error={fieldErrors.studentNumber} />
              </div>
              <div className={fieldClass('enrollmentDate')}>
                <label htmlFor="enrollmentDate">Enrollment date</label>
                <input
                  id="enrollmentDate"
                  type="date"
                  value={form.enrollmentDate}
                  onChange={update('enrollmentDate')}
                  disabled={loading}
                />
                <FieldError error={fieldErrors.enrollmentDate} />
              </div>
              <div className="form-field">
                <label htmlFor="department">Department</label>
                <input id="department" value={form.department} onChange={update('department')} disabled={loading} />
              </div>
            </>
          )}
          <div className={fieldClass('walletAddress')}>
            <label htmlFor="walletAddress">Wallet address (optional)</label>
            <input id="walletAddress" value={form.walletAddress} onChange={update('walletAddress')} disabled={loading} />
            <FieldError error={fieldErrors.walletAddress} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
