import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, CheckCircle, XCircle, AlertCircle, Loader2, QrCode, ArrowRight } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import confetti from 'canvas-confetti';

export default function Verify() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  const handleVerify = async (idOrHash) => {
    if (!idOrHash) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch(`/api/certificates/verify/${idOrHash}`);
      const data = await response.json();
      if (data.success) {
        setResult(data);
        if (data.valid) {
          // Trigger confetti celebration for valid certificates
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#00f0ff', '#00e676', '#0072ff']
          });
        }
      } else {
        setError(data.message || 'Certificate verification failed');
      }
    } catch (err) {
      setError('Could not connect to verification server. Make sure Ganache is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const certData = JSON.parse(event.target.result);
        if (certData.certificate_hash) {
          handleVerify(certData.certificate_hash);
        } else if (certData.certificate_id) {
          handleVerify(certData.certificate_id);
        } else {
          setError('Invalid certificate file format. Missing hash or ID.');
        }
      } catch (err) {
        setError('Error reading certificate file. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const toggleScanner = () => {
    if (scanning) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
      setScanning(false);
    } else {
      setScanning(true);
      setError('');
      setResult(null);
    }
  };

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }, false);

      scanner.render((decodedText) => {
        // Assume decoded text is either a certificate ID or a direct URL
        let code = decodedText;
        if (decodedText.includes('/verify/')) {
          const parts = decodedText.split('/verify/');
          code = parts[parts.length - 1];
        }
        setQuery(code);
        handleVerify(code);
        scanner.clear().catch(console.error);
        setScanning(false);
      }, (err) => {
        // Quietly log scanner errors
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [scanning]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '40px auto 0 auto', padding: '0 20px' }}>
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
          Verify Certificate Authenticity
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Enter a certificate UUID, upload a certificate file, or scan the certificate QR code.
        </p>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Paste Certificate UUID or SHA256 Hash..."
              className="input-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify(query)}
            />
          </div>
          <button className="btn-primary" onClick={() => handleVerify(query)} style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify'}
            <ArrowRight size={18} />
          </button>
          <button 
            className="btn-secondary" 
            onClick={toggleScanner} 
            style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}
            title="Scan QR Code"
          >
            <QrCode size={20} style={{ color: scanning ? 'var(--accent-cyan)' : 'inherit' }} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', margin: '24px 0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
          <span style={{ padding: '0 12px', fontSize: '12px', fontWeight: 600 }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        {/* Upload Zone */}
        <label className="glass-panel" style={{
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '24px', 
          border: '1.5px dashed rgba(255, 255, 255, 0.15)',
          cursor: 'pointer',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <FileText size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
          <span style={{ fontWeight: 600, fontSize: '15px' }}>Upload Certificate JSON File</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>Click or drag file here</span>
          <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        {/* QR Scanner Container */}
        {scanning && (
          <div className="glass-panel animate-fade-in" style={{ marginTop: '24px', padding: '16px', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>Position QR Code in Camera View</h3>
            <div id="qr-reader" style={{ width: '100%', maxWidth: '350px', margin: '0 auto', background: 'black', borderRadius: '12px', overflow: 'hidden' }}></div>
            <button className="btn-secondary" onClick={toggleScanner} style={{ marginTop: '16px', padding: '8px 16px', fontSize: '13px' }}>
              Cancel Scan
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Checking Ethereum Blockchain Registry...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--error-red)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <AlertCircle size={24} style={{ color: 'var(--error-red)', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>Verification Error</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div className={`glass-panel animate-fade-in ${result.valid ? 'glow-green' : 'glow-cyan'}`} style={{
          padding: '32px',
          borderLeft: `4px solid ${result.valid ? 'var(--success-green)' : 'var(--error-red)'}`
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
            {result.valid ? (
              <CheckCircle size={36} style={{ color: 'var(--success-green)', flexShrink: 0 }} />
            ) : (
              <XCircle size={36} style={{ color: 'var(--error-red)', flexShrink: 0 }} />
            )}
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
                {result.valid ? 'Authentic Credential' : 'Revoked or Invalid Credential'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
                Status returned directly from Ethereum Smart Contract
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>STUDENT NAME</span>
              <strong style={{ fontSize: '16px' }}>{result.certificate?.Student?.User?.name || 'Unknown'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>STUDENT NUMBER</span>
              <strong style={{ fontSize: '16px' }}>{result.certificate?.Student?.student_number || 'N/A'}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>COURSE / DEGREE</span>
              <strong style={{ fontSize: '16px' }}>{result.certificate?.Course?.course_name} ({result.certificate?.Course?.course_code})</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>ISSUING INSTITUTION</span>
              <strong style={{ fontSize: '16px' }}>{result.institution || result.certificate?.Institution?.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>GRADE RECEIVED</span>
              <strong style={{ fontSize: '16px' }}>{result.certificate?.grade || 'N/A'}</strong>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>CERTIFICATE SHA256 HASH</span>
              <code style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '4px' }}>
                {result.certificateHash || result.certificate?.certificate_hash}
              </code>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>BLOCKCHAIN TRANSACTION</span>
              <a 
                href={`https://sepolia.etherscan.io/tx/${result.certificate?.blockchain_tx_hash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="gradient-text"
                style={{ fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden' }}
              >
                {result.certificate?.blockchain_tx_hash || 'View Transaction Log'}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
