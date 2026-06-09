import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, ShieldAlert, Award, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AdminDashboard({ token }) {
  const [institutions, setInstitutions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchData = async () => {
    try {
      const instRes = await fetch('/api/auth/institutions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const instData = await instRes.json();
      if (instData.success) {
        setInstitutions(instData.institutions);
      }

      const certRes = await fetch('/api/certificates/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const certData = await certRes.json();
      if (certData.success) {
        setCertificates(certData.certificates);
      }
    } catch (err) {
      setError('Error retrieving administration records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleToggleVerify = async (institutionId, currentStatus) => {
    setProcessingId(institutionId);
    setError('');
    try {
      const response = await fetch(`/api/auth/institutions/verify/${institutionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      const data = await response.json();
      if (data.success) {
        // Reload data
        await fetchData();
      } else {
        setError(data.message || 'Smart contract authorization failed');
      }
    } catch (err) {
      setError('Connection error while writing transaction to Ethereum network.');
    } finally {
      setProcessingId(null);
    }
  };

  const totalCerts = certificates.length;
  const verifiedInsts = institutions.filter(i => i.is_verified).length;
  const pendingInsts = institutions.filter(i => !i.is_verified).length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 800 }}>Admin Console</h1>
        <p style={{ color: 'var(--text-secondary)' }}>System administration. Verify registrar institutions and audit all system logs.</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--error-red)', borderRadius: '8px', color: 'white', padding: '16px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Fetching data logs...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Stats Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Award size={36} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL REGISTERED CERTIFICATES</span>
                <strong style={{ fontSize: '24px' }}>{totalCerts}</strong>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ShieldCheck size={36} style={{ color: 'var(--success-green)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>VERIFIED REGISTRARS ON-CHAIN</span>
                <strong style={{ fontSize: '24px' }}>{verifiedInsts}</strong>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ShieldAlert size={36} style={{ color: 'orange' }} />
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>PENDING REGISTRAR APPROVALS</span>
                <strong style={{ fontSize: '24px' }}>{pendingInsts}</strong>
              </div>
            </div>
          </div>

          {/* Registrars Management Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
              University Registrars & Smart Contract Access
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>UNIVERSITY NAME</th>
                  <th style={{ padding: '12px 8px' }}>WALLETS ADDRESS</th>
                  <th style={{ padding: '12px 8px' }}>DATE REGISTERED</th>
                  <th style={{ padding: '12px 8px' }}>BLOCKCHAIN ACCESS</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst) => (
                  <tr key={inst.institution_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: 600 }}>{inst.name}</td>
                    <td style={{ padding: '16px 8px' }}><code style={{ fontSize: '12px' }}>{inst.wallet_address}</code></td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>
                      {new Date(inst.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: inst.is_verified ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                        color: inst.is_verified ? 'var(--success-green)' : 'orange'
                      }}>
                        {inst.is_verified ? 'AUTHORIZED' : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleVerify(inst.institution_id, inst.is_verified)}
                        disabled={processingId === inst.institution_id}
                        className={inst.is_verified ? 'btn-secondary' : 'btn-primary'}
                        style={{ padding: '6px 12px', fontSize: '12px', minWidth: '80px' }}
                      >
                        {processingId === inst.institution_id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : inst.is_verified ? (
                          'Revoke'
                        ) : (
                          'Authorize'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--accent-cyan)' }} />
              System Certificate Audit Log
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>STUDENT</th>
                  <th style={{ padding: '12px 8px' }}>COURSE</th>
                  <th style={{ padding: '12px 8px' }}>ISSUER</th>
                  <th style={{ padding: '12px 8px' }}>DATE ISSUED</th>
                  <th style={{ padding: '12px 8px' }}>ON-CHAIN STATE</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.certificate_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '16px 8px' }}>
                      <strong style={{ display: 'block' }}>{cert.Student?.User?.name || 'Unknown'}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {cert.Student?.student_number}</span>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      {cert.Course?.course_name}
                      <span style={{ fontSize: '12px', display: 'block', color: 'var(--text-muted)' }}>{cert.Course?.course_code}</span>
                    </td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{cert.Institution?.name}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>
                      {new Date(cert.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {cert.is_revoked ? (
                          <>
                            <XCircle size={16} style={{ color: 'var(--error-red)' }} />
                            <span style={{ color: 'var(--error-red)', fontWeight: 600, fontSize: '12px' }}>REVOKED</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} style={{ color: 'var(--success-green)' }} />
                            <span style={{ color: 'var(--success-green)', fontWeight: 600, fontSize: '12px' }}>ACTIVE</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
