import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import StatusBadge from './StatusBadge';

export default function CertificateTable({
  certificates,
  onRevoke,
  showRevoke = false,
  emptyTitle = 'No certificates',
  emptyMessage = 'No certificates have been issued yet.'
}) {
  if (!certificates?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="table-wrap card" style={{ padding: 0 }}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Course</th>
            <th>Institution</th>
            <th>Grade</th>
            <th>Status</th>
            <th>Issued</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((cert) => (
            <tr key={cert.certificate_id}>
              <td>{cert.certificate_id}</td>
              <td>
                {cert.Student?.User?.name || cert.Student?.student_number || '—'}
              </td>
              <td>{cert.Course?.course_name || '—'}</td>
              <td>{cert.Institution?.name || '—'}</td>
              <td>{cert.grade || '—'}</td>
              <td>
                <StatusBadge revoked={cert.is_revoked} />
              </td>
              <td>
                {cert.created_at
                  ? new Date(cert.created_at).toLocaleDateString()
                  : '—'}
              </td>
              <td>
                <div className="actions-row">
                  <Link to={`/verify/${cert.certificate_id}`} className="btn btn-secondary btn-sm">
                    Verify
                  </Link>
                  {cert.filePath && (
                    <a href={cert.filePath} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      Document
                    </a>
                  )}
                  {showRevoke && !cert.is_revoked && onRevoke && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onRevoke(cert)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
