import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/SkeletonLoader";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Particles } from "./components/Particles";
import TopNav from "./components/TopNav/TopNav";
import Footer from "./components/Footer/Footer";
import FooterVideo from "./components/FooterVideo/FooterVideo";
import MobileBottomNav from "./components/MobileBottomNav/MobileBottomNav";
import TopProgressBar from "./components/TopProgressBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home/Home";
import Shop from "./pages/Shop/Shop";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import OrderSuccess from "./pages/Checkout/OrderSuccess";
import PaymentStatus from "./pages/Checkout/PaymentStatus";
import Wishlist from "./pages/Wishlist/Wishlist";
import Profile from "./pages/Profile/Profile";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Fandom from "./pages/Fandom/Fandom";
import Contact from "./pages/Contact/Contact";
import About from "./pages/About/About";
import FAQ from "./pages/Support/FAQ";
import Privacy from "./pages/Support/Privacy";
import Returns from "./pages/Support/Returns";
import Terms from "./pages/Support/Terms";
import LaunchChecklist from "./pages/LaunchChecklist/LaunchChecklist";
import NotFound from "./pages/NotFound";
import { Toaster } from "react-hot-toast";
import "./App.css";
import BrandIntro from "./components/BrandIntro/BrandIntro";
import FloatingSocials from "./components/FloatingSocials/FloatingSocials";
import OfflineIndicator from "./components/OfflineIndicator";

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
            <Route path="/launch-checklist" element={<LaunchChecklist />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <FooterVideo />
      <Footer />
      <MobileBottomNav />
      <FloatingSocials />
      <OfflineIndicator />
      {/* Global UX Components */}
      <Toaster
        position="top-center"
        containerStyle={{
          top: "calc(var(--nav-height) + 12px)",
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--bauhaus-white)",
            color: "var(--bauhaus-black)",
            border: "3px solid var(--bauhaus-black)",
            boxShadow: "4px 4px 0px 0px var(--bauhaus-black)",
            borderRadius: "0px",
            padding: "16px 24px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "1px",
            fontSize: "0.85rem",
            maxWidth: "90vw",
          },
          success: {
            iconTheme: {
              primary: "var(--bauhaus-blue)",
              secondary: "var(--bauhaus-white)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--bauhaus-red)",
              secondary: "var(--bauhaus-white)",
            },
          },
        }}
      />
      <TopProgressBar />
    </>
  );
}

function App() {
  // Show BrandIntro only once per browser session.
  // Returning visitors / page refreshes within the same session skip the 2.8s intro.
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem('fan_intro_shown');
    } catch {
      return true; // sessionStorage unavailable (e.g. private mode edge case)
    }
  });

  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
        try { sessionStorage.setItem('fan_intro_shown', '1'); } catch {}
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {showIntro && <BrandIntro key="brand-intro" />}
      </AnimatePresence>
      <Particles />
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <AppShell />
              </Suspense>
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
