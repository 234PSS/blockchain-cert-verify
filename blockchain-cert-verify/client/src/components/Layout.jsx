import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const adminLinks = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/certificates', label: 'Certificates' },
  { to: '/issue', label: 'Issue Certificate' }
];

const staffLinks = [
  { to: '/staff', label: 'Dashboard' },
  { to: '/issue', label: 'Issue Certificate' }
];

const studentLinks = [
  { to: '/student', label: 'My Certificates' }
];

const roleLabels = {
  admin: 'Admin',
  university_staff: 'Staff',
  student: 'Student'
};

export default function Layout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'university_staff'
        ? staffLinks
        : studentLinks;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/">CertVerify</Link>
        <nav>
          <Link to="/verify">Public Verify</Link>
          <div className="user-meta">
            <span className="user-name">{user?.name}</span>
            <span className="role-badge">{roleLabels[user?.role] || user?.role}</span>
          </div>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </nav>
      </header>
      <div className="app-body">
        <aside className="sidebar" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
              end={link.to !== '/certificates'}
            >
              {link.label}
            </NavLink>
          ))}
        </aside>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
