import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { certificateApi } from '../api/client';
import LoadingState from '../components/LoadingState';
import StatusBadge from '../components/StatusBadge';

export default function QrResultPage() {
  const { certificateId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    certificateApi.verify(certificateId)
      .then(setResult)
      .catch((err) => setError(err.message || 'Verification failed.'))
      .finally(() => setLoading(false));
  }, [certificateId]);

  if (loading) {
    return (
      <div className="auth-page" style={{ background: 'var(--bg)' }}>
        <LoadingState message="Verifying certificate..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-page" style={{ background: 'var(--bg)' }}>
        <div className="verify-page">
          <div className="card">
            <div className="alert alert-error" role="alert">{error}</div>
            <Link to="/verify" className="btn btn-secondary">Try another ID</Link>
          </div>
        </div>
      </div>
    );
  }

  const cert = result.certificate || {};
  const statusClass = result.status === 'valid' ? 'valid' : result.status === 'revoked' ? 'revoked' : 'invalid';

  return (
    <div className="auth-page" style={{ background: 'var(--bg)' }}>
      <div className="verify-page">
        <div className="card">
          <div className={`verify-result ${statusClass}`}>
            <div className="status-icon" aria-hidden="true">
              {result.valid ? '✓' : '✕'}
            </div>
            <h1>
              {result.status === 'revoked'
                ? 'Certificate Revoked'
                : result.valid
                  ? 'Certificate Valid'
                  : 'Certificate Invalid'}
            </h1>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>
              Certificate ID: {certificateId}
            </p>
            <StatusBadge valid={result.valid} status={result.status} revoked={cert.is_revoked} />
          </div>

          {result.qrPath && (
            <div className="qr-display">
              <img src={result.qrPath} alt="Verification QR code" />
            </div>
          )}

          <dl className="detail-grid" style={{ marginTop: '1.5rem' }}>
            <dt>Student</dt>
            <dd>{cert.Student?.User?.name || cert.Student?.student_number || '—'}</dd>
            <dt>Course</dt>
            <dd>{cert.Course?.course_name || '—'}</dd>
            <dt>Institution</dt>
            <dd>{result.institution || cert.Institution?.name || '—'}</dd>
            <dt>Grade</dt>
            <dd>{cert.grade || '—'}</dd>
            <dt>Issued</dt>
            <dd>
              {cert.created_at
                ? new Date(cert.created_at).toLocaleDateString()
                : '—'}
            </dd>
            <dt>On-chain hash</dt>
            <dd style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
              {result.onChainHash || result.certificateHash || '—'}
            </dd>
          </dl>

          <div className="actions-row" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
            {result.filePath && (
              <a href={result.filePath} target="_blank" rel="noreferrer" className="btn btn-primary">
                View document
              </a>
            )}
            <Link to="/verify" className="btn btn-secondary">Verify another</Link>
          </div>

          {result.message && (
            <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--danger)', fontSize: '0.875rem' }}>
              {result.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
