import { Outlet, Link, useNavigate } from 'react-router-dom';
import './Layout.css';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navCustomer = [
    { to: '/designs', label: 'Designs' },
    { to: '/ai-design', label: 'AI Design' },
    { to: '/mannequin', label: '3D Preview' },
    { to: '/tailors', label: 'Find Tailors' },
    { to: '/orders/new', label: 'New Order' },
    { to: '/orders', label: 'My Orders' },
    { to: '/measurements', label: 'Measurements' },
  ];
  const navTailor = [
    { to: '/tailor', label: 'Dashboard' },
    { to: '/tailor/profile', label: 'Profile' },
    { to: '/tailor/orders', label: 'Orders' },
  ];
  const navAdmin = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/tailors', label: 'Tailors' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/designs', label: 'Designs' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/rules', label: 'Rules' },
  ];

  const nav = user?.role === 'customer' ? navCustomer : user?.role === 'tailor' ? navTailor : navAdmin;

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">E-Stitch</Link>
        <nav className="nav">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="nav-link">{n.label}</Link>
          ))}
        </nav>
        <div className="header-right">
          <span className="user-name">{user?.full_name}</span>
          <button onClick={handleLogout} className="btn btn-outline">Logout</button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
