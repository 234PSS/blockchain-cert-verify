import { useState } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi } from '../api/client';
import CertificateTable from '../components/CertificateTable';
import FieldError from '../components/FieldError';
import LoadingState from '../components/LoadingState';
import RevokeModal from '../components/RevokeModal';
import { useToast } from '../context/ToastContext';
import { validatePositiveInt } from '../utils/validation';

export default function StaffDashboard() {
  const toast = useToast();
  const [studentId, setStudentId] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [searched, setSearched] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const loadStudentCerts = async (id) => {
    const res = await certificateApi.byStudent(id);
    setCertificates(res.certificates || []);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const validationError = validatePositiveInt(studentId, 'Student ID');
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setFieldError('');
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      await loadStudentCerts(studentId);
    } catch (err) {
      setError(err.message || 'Failed to load certificates.');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (reason) => {
    await certificateApi.revoke(revokeTarget.certificate_id, reason);
    toast.success(`Certificate #${revokeTarget.certificate_id} revoked`);
    setRevokeTarget(null);
    await loadStudentCerts(studentId);
  };

  return (
    <>
      <div className="page-header">
        <h1>Staff Dashboard</h1>
        <p>Issue certificates and look up student records</p>
      </div>

      <div className="card">
        <div className="actions-row">
          <Link to="/issue" className="btn btn-primary">Issue new certificate</Link>
          <Link to="/verify" className="btn btn-secondary">Public verification</Link>
        </div>
      </div>

      <div className="card">
        <h2>Student certificate lookup</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Enter a student ID to view their issued certificates.
        </p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <form onSubmit={handleSearch} className="form-grid two-col" style={{ alignItems: 'end' }} noValidate>
          <div className={`form-field ${fieldError ? 'has-error' : ''}`}>
            <label htmlFor="studentId">Student ID</label>
            <input
              id="studentId"
              type="number"
              min="1"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                if (fieldError) setFieldError('');
              }}
              placeholder="e.g. 1"
              disabled={loading}
            />
            <FieldError error={fieldError} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {loading && <LoadingState message="Loading certificates..." />}

      {searched && !loading && (
        <div style={{ marginTop: '1rem' }}>
          <CertificateTable
            certificates={certificates}
            showRevoke
            onRevoke={setRevokeTarget}
            emptyTitle="No certificates for this student"
            emptyMessage="This student has no issued certificates on record."
          />
        </div>
      )}

      {revokeTarget && (
        <RevokeModal
          certificate={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={handleRevoke}
        />
      )}
    </>
  );
}
