import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import CustomerDashboard from './pages/customer/Dashboard';
import Designs from './pages/customer/Designs';
import Tailors from './pages/customer/Tailors';
import OrderNew from './pages/customer/OrderNew';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import Measurements from './pages/customer/Measurements';
import ReviewForm from './pages/customer/ReviewForm';
import AIDesign from './pages/customer/AIDesign';
import MannequinPreview from './pages/customer/MannequinPreview';

import TailorDashboard from './pages/tailor/Dashboard';
import TailorProfile from './pages/tailor/Profile';
import TailorOrders from './pages/tailor/Orders';

import AdminDashboard from './pages/admin/Dashboard';
import AdminTailors from './pages/admin/Tailors';
import AdminOrders from './pages/admin/Orders';
import AdminDesigns from './pages/admin/Designs';
import AdminUsers from './pages/admin/Users';
import AdminRules from './pages/admin/Rules';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={
        user ? <Layout /> : <Landing />
      }>
        <Route index element={<Navigate to={user?.role === 'customer' ? '/designs' : user?.role === 'tailor' ? '/tailor' : '/admin'} replace />} />
        {/* Customer */}
        <Route path="designs" element={<ProtectedRoute roles={['customer']}><Designs /></ProtectedRoute>} />
        <Route path="tailors" element={<ProtectedRoute roles={['customer']}><Tailors /></ProtectedRoute>} />
        <Route path="orders/new" element={<ProtectedRoute roles={['customer']}><OrderNew /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute roles={['customer']}><MyOrders /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute roles={['customer', 'tailor', 'admin']}><OrderDetail /></ProtectedRoute>} />
        <Route path="measurements" element={<ProtectedRoute roles={['customer']}><Measurements /></ProtectedRoute>} />
        <Route path="reviews/new" element={<ProtectedRoute roles={['customer']}><ReviewForm /></ProtectedRoute>} />
        <Route path="ai-design" element={<ProtectedRoute roles={['customer']}><AIDesign /></ProtectedRoute>} />
        <Route path="mannequin" element={<ProtectedRoute roles={['customer']}><MannequinPreview /></ProtectedRoute>} />
        <Route path="customer" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
        {/* Tailor */}
        <Route path="tailor" element={<ProtectedRoute roles={['tailor']}><TailorDashboard /></ProtectedRoute>} />
        <Route path="tailor/profile" element={<ProtectedRoute roles={['tailor']}><TailorProfile /></ProtectedRoute>} />
        <Route path="tailor/orders" element={<ProtectedRoute roles={['tailor']}><TailorOrders /></ProtectedRoute>} />
        {/* Admin */}
        <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/tailors" element={<ProtectedRoute roles={['admin']}><AdminTailors /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="admin/designs" element={<ProtectedRoute roles={['admin']}><AdminDesigns /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/rules" element={<ProtectedRoute roles={['admin']}><AdminRules /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
