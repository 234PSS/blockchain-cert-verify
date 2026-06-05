export default function StatusBadge({ revoked, valid, status }) {
  if (revoked || status === 'revoked') {
    return <span className="badge badge-revoked">Revoked</span>;
  }
  if (valid === true || status === 'valid') {
    return <span className="badge badge-valid">Valid</span>;
  }
  if (valid === false || status === 'invalid') {
    return <span className="badge badge-invalid">Invalid</span>;
  }
  return <span className="badge badge-pending">Unknown</span>;
}
