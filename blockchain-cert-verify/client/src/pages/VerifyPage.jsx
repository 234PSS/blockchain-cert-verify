import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FieldError from '../components/FieldError';
import { validatePositiveInt } from '../utils/validation';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [certificateId, setCertificateId] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validatePositiveInt(certificateId, 'Certificate ID');
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError('');
    navigate(`/verify/${certificateId}`);
  };

  return (
    <div className="auth-page" style={{ background: 'var(--bg)' }}>
      <div className="verify-page">
        <div className="card">
          <div className="page-header" style={{ textAlign: 'center' }}>
            <h1>Verify Certificate</h1>
            <p>Enter a certificate ID to check authenticity against the blockchain registry</p>
          </div>
          <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: 360, margin: '0 auto' }} noValidate>
            <div className={`form-field ${fieldError ? 'has-error' : ''}`}>
              <label htmlFor="certificateId">Certificate ID</label>
              <input
                id="certificateId"
                type="number"
                min="1"
                value={certificateId}
                onChange={(e) => {
                  setCertificateId(e.target.value);
                  if (fieldError) setFieldError('');
                }}
                placeholder="e.g. 1"
              />
              <FieldError error={fieldError} />
            </div>
            <button type="submit" className="btn btn-primary">Verify certificate</button>
          </form>
          <p className="auth-footer">
            <Link to="/login">Staff sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
