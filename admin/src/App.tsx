import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Reviews from './pages/Reviews';
import Newsletter from './pages/Newsletter';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Coupons from './pages/Coupons';
import './App.css';
import { Toaster } from 'react-hot-toast';


function ProtectedRoutes() {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!admin) return <Navigate to="/login" />;
  return <AdminLayout />;
}

function LoginRoute() {
  const { admin, loading, login } = useAdminAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  if (admin) return <Navigate to="/" />;
  return <AdminLogin onLogin={login} />;
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id/edit" element={<ProductForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/coupons" element={<Coupons />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bauhaus-white)',
              color: 'var(--bauhaus-black)',
              border: '3px solid var(--bauhaus-black)',
              boxShadow: '4px 4px 0px 0px var(--bauhaus-black)',
              borderRadius: '0px',
              padding: '16px 24px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontSize: '0.85rem'
            },
            success: {
              iconTheme: {
                primary: 'var(--bauhaus-blue)',
                secondary: 'var(--bauhaus-white)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--bauhaus-red)',
                secondary: 'var(--bauhaus-white)',
              },
            },
          }} 
        />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
