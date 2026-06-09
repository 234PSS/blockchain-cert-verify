import { useEffect, useState } from 'react';
import { certificateApi } from '../api/client';
import CertificateTable from '../components/CertificateTable';
import LoadingState from '../components/LoadingState';
import RevokeModal from '../components/RevokeModal';
import { useToast } from '../context/ToastContext';

export default function CertificateListPage() {
  const toast = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);

  const loadCertificates = () => {
    setLoading(true);
    setError('');
    certificateApi.listAll()
      .then((res) => setCertificates(res.certificates || []))
      .catch((err) => setError(err.message || 'Failed to load certificates.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handleRevoke = async (reason) => {
    await certificateApi.revoke(revokeTarget.certificate_id, reason);
    toast.success(`Certificate #${revokeTarget.certificate_id} revoked`);
    setRevokeTarget(null);
    loadCertificates();
  };

  if (loading) return <LoadingState message="Loading certificates..." />;

  return (
    <>
      <div className="page-header">
        <h1>All Certificates</h1>
        <p>Manage and revoke issued certificates</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <CertificateTable
        certificates={certificates}
        showRevoke
        onRevoke={setRevokeTarget}
        emptyMessage="No certificates have been issued in the system."
      />

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
