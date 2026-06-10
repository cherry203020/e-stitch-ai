import { Link } from 'react-router-dom';

export default function CustomerDashboard() {
  return (
    <div className="page">
      <h1>Customer Dashboard</h1>
      <p className="text-muted">Welcome to E-Stitch. Manage your blouse stitching orders.</p>
      <div className="card-grid">
        <Link to="/designs" className="card">
          <h3>Browse Designs</h3>
          <p>Explore blouse designs by neck, sleeve, back patterns</p>
        </Link>
        <Link to="/tailors" className="card">
          <h3>Find Tailors</h3>
          <p>Discover verified tailors by price & rating</p>
        </Link>
        <Link to="/orders/new" className="card">
          <h3>Place Order</h3>
          <p>New stitching order with pickup & delivery</p>
        </Link>
        <Link to="/orders" className="card">
          <h3>My Orders</h3>
          <p>Track order status in real time</p>
        </Link>
      </div>
    </div>
  );
}
