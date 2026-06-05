import { Navigate } from 'react-router-dom';
import LoadingState from '../components/LoadingState';
import { useAuth } from '../context/AuthContext';

export default function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState message="Loading..." />;

  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'university_staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/student" replace />;
}
