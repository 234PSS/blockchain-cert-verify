export default function EmptyState({ title = 'No results', message, action }) {
  return (
    <div className="empty-state card">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
