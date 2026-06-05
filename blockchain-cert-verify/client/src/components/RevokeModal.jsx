import { useState } from 'react';
import FieldError from './FieldError';
import { validateMinLength } from '../utils/validation';

export default function RevokeModal({ certificate, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateMinLength(reason, 3, 'Reason');
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError('');
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason);
      onClose();
    } catch (err) {
      setError(err.message || 'Revocation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: '1rem', borderColor: '#fecaca' }} role="dialog" aria-labelledby="revoke-title">
      <h3 id="revoke-title">Revoke Certificate #{certificate.certificate_id}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
        This action is recorded on the blockchain and cannot be undone.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="form-grid" noValidate>
        <div className={`form-field ${fieldError ? 'has-error' : ''}`}>
          <label htmlFor="reason">Revocation reason</label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (fieldError) setFieldError('');
            }}
            placeholder="Enter reason for revocation"
            disabled={loading}
          />
          <FieldError error={fieldError} />
        </div>
        <div className="actions-row">
          <button type="submit" className="btn btn-danger" disabled={loading}>
            {loading ? 'Revoking...' : 'Confirm revoke'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
