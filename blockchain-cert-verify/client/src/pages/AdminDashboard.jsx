import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { certificateApi, healthApi } from '../api/client';
import LoadingState from '../components/LoadingState';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, valid: 0, revoked: 0 });
  const [blockchain, setBlockchain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      certificateApi.listAll(),
      healthApi.check().catch(() => null)
    ])
      .then(([certRes, healthRes]) => {
        const certs = certRes.certificates || [];
        setStats({
          total: certs.length,
          valid: certs.filter((c) => !c.is_revoked).length,
          revoked: certs.filter((c) => c.is_revoked).length
        });
        setBlockchain(healthRes?.blockchain || null);
      })
      .catch((err) => setError(err.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  return (
    <>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and certificate management</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.total}</div>
          <div className="label">Total Certificates</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.valid}</div>
          <div className="label">Active</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.revoked}</div>
          <div className="label">Revoked</div>
        </div>
        <div className="stat-card">
          <div
            className="value"
            style={{
              fontSize: '1rem',
              color: blockchain?.ready ? 'var(--success)' : 'var(--danger)'
            }}
          >
            {blockchain?.ready ? 'Online' : 'Offline'}
          </div>
          <div className="label">Blockchain</div>
        </div>
      </div>

      <div className="card">
        <h2>Quick actions</h2>
        <div className="actions-row" style={{ marginTop: '1rem' }}>
          <Link to="/certificates" className="btn btn-primary">View all certificates</Link>
          <Link to="/issue" className="btn btn-secondary">Issue certificate</Link>
          <Link to="/verify" className="btn btn-secondary">Public verification</Link>
        </div>
      </div>

      {!blockchain?.ready && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }} role="alert">
          Blockchain unavailable: {blockchain?.reason || 'Not connected'}
        </div>
      )}
    </>
  );
}
