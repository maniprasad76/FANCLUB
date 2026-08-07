import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState, useRef, Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/SkeletonLoader";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { DeviceProvider } from "./context/DeviceContext";
import { Particles } from "./components/Particles";
import TopNav from "./components/TopNav/TopNav";
import Footer from "./components/Footer/Footer";
import MobileBottomNav from "./components/MobileBottomNav/MobileBottomNav";
import TopProgressBar from "./components/TopProgressBar";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import BrandIntro from "./components/BrandIntro";
import FloatingSocials from "./components/FloatingSocials";
import OfflineIndicator from "./components/OfflineIndicator";
import ScarcityToaster from "./components/ScarcityToaster";

/* ─── Lazy-loaded pages (code-split into separate chunks) ─── */
const Home = lazy(() => import("./pages/Home/Home"));
const Shop = lazy(() => import("./pages/Shop/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart/Cart"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const OrderSuccess = lazy(() => import("./pages/Checkout/OrderSuccess"));
const PaymentStatus = lazy(() => import("./pages/Checkout/PaymentStatus"));
const Wishlist = lazy(() => import("./pages/Wishlist/Wishlist"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));
const Fandom = lazy(() => import("./pages/Fandom/Fandom"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const About = lazy(() => import("./pages/About/About"));
const FAQ = lazy(() => import("./pages/Support/FAQ"));
const Privacy = lazy(() => import("./pages/Support/Privacy"));
const Returns = lazy(() => import("./pages/Support/Returns"));
const Terms = lazy(() => import("./pages/Support/Terms"));
const LaunchChecklist = lazy(() => import("./pages/LaunchChecklist/LaunchChecklist"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessDenied = lazy(() => import("./pages/AccessDenied/AccessDenied"));
const LoyaltyClub = lazy(() => import("./pages/LoyaltyClub/LoyaltyClub"));


function AppShell() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Route-change announcer for screen readers
  const [routeAnnouncement, setRouteAnnouncement] = useState('');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      const pageName = location.pathname === '/' ? 'Home' : location.pathname.replace(/^\//,'').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setRouteAnnouncement(`Navigated to ${pageName}`);
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <>
      {/* Skip-to-content link — first focusable element for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to Main Content</a>
      {/* Aria-live region — announces route changes to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="route-announcer" role="status">
        {routeAnnouncement}
      </div>
      <div className="bauhaus-color-bar" style={{ position: 'relative', zIndex: 99999 }}>
        <div />
        <div />
      </div>
      <TopNav />
      <main className="app-main" id="main-content">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-success"
              element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-status/:orderId"
              element={
                <ProtectedRoute>
                  <PaymentStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/orders/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* /orders → redirect to /profile (orders are shown in profile tab) */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Navigate to="/profile" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <Navigate to="/profile" replace />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/fandom" element={<Fandom />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route
              path="/loyalty"
              element={
                <ProtectedRoute>
                  <LoyaltyClub />
                </ProtectedRoute>
              }
            />
            <Route path="/launch-checklist" element={<LaunchChecklist />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingSocials />
      <OfflineIndicator />
      <ScarcityToaster />
      {/* Global UX Components */}
      <Toaster
        position="top-center"
        containerStyle={{
          top: "calc(var(--nav-height) + 6px)",
        }}
        gutter={6}
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(18, 18, 24, 0.94)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: "999px",
            padding: "6px 14px",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: "0.78rem",
            letterSpacing: "0.2px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            maxWidth: "min(300px, 86vw)",
          },
          success: {
            style: {
              background: "rgba(18, 18, 24, 0.94)",
              color: "#ffffff",
              border: "1px solid rgba(34, 197, 94, 0.35)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "0.78rem",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            },
            iconTheme: {
              primary: "#22c55e",
              secondary: "#121216",
            },
          },
          error: {
            style: {
              background: "rgba(18, 18, 24, 0.94)",
              color: "#ffffff",
              border: "1px solid rgba(248, 113, 113, 0.35)",
              borderRadius: "999px",
              padding: "6px 14px",
              fontSize: "0.78rem",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            },
            iconTheme: {
              primary: "#f87171",
              secondary: "#121216",
            },
          },
        }}
      />
      <TopProgressBar />
    </>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem('fan_intro_shown');
    } catch {
      return false;
    }
  });

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {showIntro && (
          <BrandIntro
            key="brand-intro"
            onDone={() => {
              setShowIntro(false);
              try { sessionStorage.setItem('fan_intro_shown', '1'); } catch {}
            }}
          />
        )}
      </AnimatePresence>
      <Particles />
      <DeviceProvider>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <AppShell />
              </Suspense>
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </DeviceProvider>
    </BrowserRouter>
  );
}

export default App;
