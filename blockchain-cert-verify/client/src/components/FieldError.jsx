export default function FieldError({ error }) {
  if (!error) return null;
  return <span className="field-error" role="alert">{error}</span>;
}
