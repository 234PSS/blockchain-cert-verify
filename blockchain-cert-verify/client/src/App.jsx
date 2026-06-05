import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingState from './components/LoadingState';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import CertificateListPage from './pages/CertificateListPage';
import HomeRedirect from './pages/HomeRedirect';
import IssueCertificatePage from './pages/IssueCertificatePage';
import LoginPage from './pages/LoginPage';
import QrResultPage from './pages/QrResultPage';
import RegisterPage from './pages/RegisterPage';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashboard';
import VerifyPage from './pages/VerifyPage';
import { useAuth } from './context/AuthContext';

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState message="Loading..." />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:certificateId" element={<QrResultPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomeRedirect />} />
        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="certificates" element={<ProtectedRoute roles={['admin']}><CertificateListPage /></ProtectedRoute>} />
        <Route
          path="issue"
          element={
            <ProtectedRoute roles={['admin', 'university_staff']}>
              <IssueCertificatePage />
            </ProtectedRoute>
          }
        />
        <Route path="staff" element={<ProtectedRoute roles={['university_staff']}><StaffDashboard /></ProtectedRoute>} />
        <Route path="student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
