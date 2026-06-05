import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FieldError from '../components/FieldError';
import { certificateApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  collectErrors,
  validateFile,
  validatePositiveInt
} from '../utils/validation';

export default function IssueCertificatePage() {
  const fileRef = useRef(null);
  const toast = useToast();
  const [form, setForm] = useState({
    studentId: '',
    courseId: '',
    institutionId: '',
    grade: '',
    remarks: ''
  });
  const [document, setDocument] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = collectErrors([
      ['studentId', validatePositiveInt(form.studentId, 'Student ID')],
      ['courseId', validatePositiveInt(form.courseId, 'Course ID')],
      ['institutionId', validatePositiveInt(form.institutionId, 'Institution ID')],
      ['document', validateFile(document)]
    ]);
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('studentId', form.studentId);
      formData.append('courseId', form.courseId);
      formData.append('institutionId', form.institutionId);
      if (form.grade) formData.append('grade', form.grade);
      if (form.remarks) formData.append('remarks', form.remarks);
      formData.append('document', document);

      const res = await certificateApi.issue(formData);
      setResult(res);
      setForm({ studentId: '', courseId: '', institutionId: '', grade: '', remarks: '' });
      setDocument(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success(`Certificate #${res.certificate?.certificate_id} issued successfully`);
    } catch (err) {
      setError(err.message || 'Failed to issue certificate.');
      toast.error(err.message || 'Failed to issue certificate.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field) => `form-field ${fieldErrors[field] ? 'has-error' : ''}`;

  return (
    <>
      <div className="page-header">
        <h1>Issue Certificate</h1>
        <p>Upload a certificate document and register it on the blockchain</p>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <div className="form-grid two-col">
            <div className={fieldClass('studentId')}>
              <label htmlFor="studentId">Student ID</label>
              <input
                id="studentId"
                type="number"
                min="1"
                value={form.studentId}
                onChange={update('studentId')}
                disabled={loading}
              />
              <FieldError error={fieldErrors.studentId} />
            </div>
            <div className={fieldClass('courseId')}>
              <label htmlFor="courseId">Course ID</label>
              <input
                id="courseId"
                type="number"
                min="1"
                value={form.courseId}
                onChange={update('courseId')}
                disabled={loading}
              />
              <FieldError error={fieldErrors.courseId} />
            </div>
            <div className={fieldClass('institutionId')}>
              <label htmlFor="institutionId">Institution ID</label>
              <input
                id="institutionId"
                type="number"
                min="1"
                value={form.institutionId}
                onChange={update('institutionId')}
                disabled={loading}
              />
              <FieldError error={fieldErrors.institutionId} />
            </div>
            <div className="form-field">
              <label htmlFor="grade">Grade</label>
              <input id="grade" value={form.grade} onChange={update('grade')} placeholder="e.g. A" disabled={loading} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="remarks">Remarks</label>
            <textarea id="remarks" rows={2} value={form.remarks} onChange={update('remarks')} disabled={loading} />
          </div>
          <div className={fieldClass('document')}>
            <label htmlFor="document">Certificate document</label>
            <input
              ref={fileRef}
              id="document"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                setDocument(e.target.files[0] || null);
                if (fieldErrors.document) {
                  setFieldErrors((prev) => ({ ...prev, document: '' }));
                }
              }}
              disabled={loading}
            />
            <small>PDF, PNG, or JPEG — max 5 MB</small>
            <FieldError error={fieldErrors.document} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Issuing...' : 'Issue certificate'}
          </button>
        </form>
      </div>

      {result && (
        <div className="card">
          <h2>Issue result</h2>
          <dl className="detail-grid">
            <dt>Certificate ID</dt>
            <dd>{result.certificate?.certificate_id}</dd>
            <dt>Transaction</dt>
            <dd style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>{result.transactionHash}</dd>
            <dt>Document</dt>
            <dd>
              {result.filePath ? (
                <a href={result.filePath} target="_blank" rel="noreferrer">View document</a>
              ) : '—'}
            </dd>
            <dt>Verification</dt>
            <dd>
              <Link to={`/verify/${result.certificate?.certificate_id}`}>Open verification page</Link>
            </dd>
          </dl>
          {result.qrPath && (
            <div className="qr-display">
              <img src={result.qrPath} alt="Certificate QR code" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
