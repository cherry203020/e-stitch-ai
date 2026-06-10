import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p className="text-muted">Verify tailors, monitor orders, manage platform rules.</p>
      <div className="card-grid">
        <Link to="/admin/tailors" className="card">
          <h3>Tailors</h3>
          <p>Verify and manage tailors</p>
        </Link>
        <Link to="/admin/orders" className="card">
          <h3>Orders</h3>
          <p>Monitor and manage all orders</p>
        </Link>
        <Link to="/admin/designs" className="card">
          <h3>Designs</h3>
          <p>Manage catalog designs</p>
        </Link>
        <Link to="/admin/users" className="card">
          <h3>Users</h3>
          <p>Manage all users</p>
        </Link>
        <Link to="/admin/rules" className="card">
          <h3>Platform Rules</h3>
          <p>Pricing & cancellation rules</p>
        </Link>
      </div>
    </div>
  );
}
