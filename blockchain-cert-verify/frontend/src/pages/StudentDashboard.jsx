import React, { useState, useEffect } from 'react';
import { Award, Calendar, BookOpen, Download, ShieldCheck, ExternalLink, QrCode } from 'lucide-react';

export default function StudentDashboard({ user, token }) {
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user?.Student?.student_id) {
        setError('Student profile not found. If you registered as registrar, please log into the Registrar Dashboard.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/certificates/student/${user.Student.student_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setCertificates(data.certificates);
          if (data.certificates.length > 0) {
            setSelectedCert(data.certificates[0]);
          }
        } else {
          setError(data.message || 'Failed to load certificates');
        }
      } catch (err) {
        setError('Error connecting to certificate server.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user, token]);

  const downloadJSON = (cert) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      certificate_id: cert.certificate_id,
      certificate_hash: cert.certificate_hash,
      student_id: cert.student_id,
      course_id: cert.course_id,
      institution_id: cert.institution_id,
      blockchain_tx_hash: cert.blockchain_tx_hash
    }, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `certificate_${cert.certificate_id.substring(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 800 }}>Student Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}. Here are your registered academic achievements.</p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Retrieving credentials from database...</p>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '40px', borderLeft: '4px solid var(--error-red)' }}>
          <p style={{ color: 'white' }}>{error}</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <Award size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Certificates Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You do not have any certificates registered under your student ID yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
          {/* List panel */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              All Credentials ({certificates.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
              {certificates.map((cert) => (
                <div
                  key={cert.certificate_id}
                  onClick={() => setSelectedCert(cert)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: selectedCert?.certificate_id === cert.certificate_id ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedCert?.certificate_id === cert.certificate_id ? 'var(--accent-cyan)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <strong style={{ display: 'block', fontSize: '14px', color: 'white' }}>
                    {cert.Course?.course_name}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {cert.Institution?.name}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(cert.created_at).toLocaleDateString()}</span>
                    <span style={{ color: cert.is_revoked ? 'var(--error-red)' : 'var(--success-green)', fontWeight: 600 }}>
                      {cert.is_revoked ? 'REVOKED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Viewer panel */}
          {selectedCert && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Digital scroll layout */}
              <div className="glass-panel glow-cyan" style={{
                padding: '40px',
                textAlign: 'center',
                position: 'relative',
                background: 'radial-gradient(circle at 50% 50%, rgba(15, 18, 29, 0.9) 0%, rgba(8, 9, 12, 0.95) 100%)',
                border: '2px solid rgba(0, 240, 255, 0.15)'
              }}>
                {/* Visual Watermarks */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-green)', fontSize: '11px', fontWeight: 700 }}>
                  <ShieldCheck size={16} />
                  SECURED ON ETHEREUM
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <Award size={56} style={{ color: 'var(--accent-cyan)' }} />
                </div>

                <h4 style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
                  This is to certify that
                </h4>
                <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>{user.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '200px', margin: '0 auto 16px auto', paddingBottom: '8px' }}>
                  Student ID: {user.Student?.student_number}
                </p>

                <h4 style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '8px' }}>
                  has successfully completed the course
                </h4>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                  {selectedCert.Course?.course_name} ({selectedCert.Course?.course_code})
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
                  with grade <strong>{selectedCert.grade || 'Passed'}</strong>
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>ISSUED BY</span>
                    <strong style={{ fontSize: '13px' }}>{selectedCert.Institution?.name}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Date: {new Date(selectedCert.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&color=00f0ff&bgcolor=0f121d&data=${encodeURIComponent(window.location.origin + '/verify/' + selectedCert.certificate_id)}`}
                      alt="Verification QR Code"
                      style={{ width: '80px', height: '80px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px', borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>SCAN TO VERIFY</span>
                  </div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CERTIFICATE UUID</span>
                  <code style={{ fontSize: '13px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px' }}>
                    {selectedCert.certificate_id}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-secondary" onClick={() => downloadJSON(selectedCert)} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={16} />
                    Download JSON
                  </button>
                  <a 
                    href={`/api/certificates/verify/${selectedCert.certificate_id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary" 
                    style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '14px' }}
                  >
                    <ExternalLink size={16} />
                    Verify on Server
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
