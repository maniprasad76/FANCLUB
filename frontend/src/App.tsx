import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Particles } from './components/Particles';
import TopNav from './components/TopNav/TopNav';
import Footer from './components/Footer/Footer';
import FooterVideo from './components/FooterVideo/FooterVideo';
import MobileBottomNav from './components/MobileBottomNav/MobileBottomNav';
import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import OrderSuccess from './pages/Checkout/OrderSuccess';
import PaymentStatus from './pages/Checkout/PaymentStatus';
import Wishlist from './pages/Wishlist/Wishlist';
import Profile from './pages/Profile/Profile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Cinema from './pages/Cinema/Cinema';
import Contact from './pages/Contact/Contact';
import About from './pages/About/About';
import FAQ from './pages/Support/FAQ';
import Privacy from './pages/Support/Privacy';
import Returns from './pages/Support/Returns';
import Terms from './pages/Support/Terms';
import NotFound from './pages/NotFound';
import SocialProofToast from './components/SocialProofToast';
import { Toaster } from 'react-hot-toast';
import './App.css';
import BrandIntro from './components/BrandIntro/BrandIntro';
import FloatingSocials from './components/FloatingSocials/FloatingSocials';

// --- Top Progress Bar Illusion ---
function TopProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 200);
    const t2 = setTimeout(() => setProgress(100), 500);
    const t3 = setTimeout(() => setProgress(0), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [location.pathname]);

  if (progress === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '3px',
      background: 'rgba(255,255,255,0.1)',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div style={{
        height: '100%',
        background: 'var(--bauhaus-red)',
        width: `${progress}%`,
        transition: 'width 0.3s ease-out',
      }} />
    </div>
  );
}



function AppShell() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <TopNav />
      <main className="app-main">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/payment-status/:orderId" element={<PaymentStatus />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/orders/:id" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cinema" element={<Cinema />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <FooterVideo />
      <Footer />
      <MobileBottomNav />
      {/* Social Proof — live purchase notifications */}
      <SocialProofToast />
      <FloatingSocials />
      {/* Global UX Components */}
      <Toaster 
        position="top-center"
        containerStyle={{
          top: 'calc(var(--nav-height) + 12px)',
        }}
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
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            fontSize: '0.85rem',
            maxWidth: '90vw',
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
      <TopProgressBar />
    </>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Show intro for 2.8 seconds on initial load
    const timer = setTimeout(() => setShowIntro(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        {showIntro && <BrandIntro key="brand-intro" />}
      </AnimatePresence>
      <Particles />
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
