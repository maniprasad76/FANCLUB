import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './layouts/AdminLayout';
import { Toaster } from 'react-hot-toast';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Categories = lazy(() => import('./pages/Categories'));
const Orders = lazy(() => import('./pages/Orders'));
const Payments = lazy(() => import('./pages/Payments'));
const Customers = lazy(() => import('./pages/Customers'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Coupons = lazy(() => import('./pages/Coupons'));
const LoyaltyAdmin = lazy(() => import('./pages/LoyaltyAdmin'));

const PageFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
    Loading...
  </div>
);

function ProtectedRoutes() {
  const { admin, loading } = useAdminAuth();
  if (loading) return <PageFallback />;
  if (!admin) return <Navigate to="/login" />;
  return <AdminLayout />;
}

function LoginRoute() {
  const { admin, loading, login } = useAdminAuth();
  if (loading) return <PageFallback />;
  if (admin) return <Navigate to="/" />;
  return <AdminLogin onLogin={login} />;
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
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
                <Route path="/loyalty" element={<LoyaltyAdmin />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
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
        </ErrorBoundary>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
