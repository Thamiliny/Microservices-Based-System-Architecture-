import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RestaurantsPage from './pages/RestaurantsPage.jsx';
import RestaurantDetailPage from './pages/RestaurantDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StatusPage from './pages/StatusPage.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RestaurantsPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['owner', 'admin']}><DashboardPage /></ProtectedRoute>
          } />
          <Route path="*" element={
            <div className="container"><h1>404</h1><p className="muted">Page not found.</p></div>
          } />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          QuickBite · Food Delivery System · React + Express + PostgreSQL, orchestrated with Docker Compose
        </div>
      </footer>
    </>
  );
}
