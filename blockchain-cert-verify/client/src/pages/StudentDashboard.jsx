import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi } from '../api/client';
import CertificateTable from '../components/CertificateTable';
import LoadingState from '../components/LoadingState';

export default function StudentDashboard() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    certificateApi.mine()
      .then((res) => setCertificates(res.certificates || []))
      .catch((err) => setError(err.message || 'Failed to load certificates.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading your certificates..." />;

  return (
    <>
      <div className="page-header">
        <h1>My Certificates</h1>
        <p>View and verify your issued academic certificates</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <CertificateTable
        certificates={certificates}
        emptyTitle="No certificates yet"
        emptyMessage="You do not have any issued certificates on record."
      />

      {certificates.length > 0 && (
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
          Scan the QR code on your certificate or{' '}
          <Link to={`/verify/${certificates[0].certificate_id}`}>verify online</Link>.
        </p>
      )}
    </>
  );
}
