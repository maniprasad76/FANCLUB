import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Gift,
  Star,
  History,
  Crown,
  Sparkles,
  X,
  ShoppingBag,
} from "lucide-react";
import AnimatedPage from "../../components/AnimatedPage";
import FanStamp from "../../components/FanStamp/FanStamp";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import "./LoyaltyClub.css";

interface LoyaltyProgress {
  id: string;
  userId: string;
  email: string;
  currentCycle: number;
  completedOrders: number;
  requiredOrders: number;
  rewardUnlocked: boolean;
  rewardClaimed: boolean;
  lifetimeRewards: number;
  remainingOrders: number;
  progressPercentage: number;
  motivationMessage: string;
  rewards: LoyaltyReward[];
  countedOrders: any[];
}

interface LoyaltyReward {
  id: string;
  cycle: number;
  productName: string;
  productImage: string | null;
  productSize: string | null;
  productColor: string | null;
  couponCode: string | null;
  claimedAt: string;
}

interface EligibleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
}

// Simple confetti implementation
function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#FFD700", "#FF6B35", "#e63946", "#457b9d", "#ffd60a", "#22c55e"];
  const particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    w: number;
    h: number;
    rot: number;
    vr: number;
    life: number;
  }[] = [];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -18 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 2,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
      life: 1,
    });
  }

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.99;
      p.rot += p.vr;
      p.life -= 0.008;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    frame++;
    if (alive && frame < 300) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  animate();
}

export default function LoyaltyClub() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LoyaltyProgress | null>(null);
  const [eligibleProducts, setEligibleProducts] = useState<EligibleProduct[]>([]);
  const [rewardHistory, setRewardHistory] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EligibleProduct | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ couponCode: string; message: string } | null>(null);
  const confettiRef = useRef<HTMLCanvasElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [progressRes, productsRes, historyRes] = await Promise.all([
        api.get("/loyalty/progress"),
        api.get("/loyalty/eligible-products"),
        api.get("/loyalty/history"),
      ]);
      setProgress(progressRes.data);
      setEligibleProducts(productsRes.data);
      setRewardHistory(historyRes.data.rewards || []);
    } catch (err: any) {
      console.error("Failed to load loyalty data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Fire confetti when reward is first unlocked
  useEffect(() => {
    if (progress?.rewardUnlocked && !progress.rewardClaimed && confettiRef.current) {
      fireConfetti(confettiRef.current);
    }
  }, [progress?.rewardUnlocked, progress?.rewardClaimed]);

  const handleClaim = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }
    setClaiming(true);
    try {
      const res = await api.post("/loyalty/claim", {
        productId: selectedProduct.id,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      });
      setClaimResult({
        couponCode: res.data.couponCode,
        message: res.data.message,
      });
      if (confettiRef.current) fireConfetti(confettiRef.current);
      toast.success("Reward claimed successfully!");
      // Refresh data after claim
      setTimeout(() => fetchData(), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to claim reward");
    } finally {
      setClaiming(false);
    }
  };

  const openClaimModal = () => {
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedColor("");
    setClaimResult(null);
    setShowClaimModal(true);
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="loyalty-page container">
          <div className="loyalty-hero">
            <div className="skeleton" style={{ height: 48, width: 300, margin: "0 auto 16px" }} />
            <div className="skeleton" style={{ height: 20, width: 400, margin: "0 auto" }} />
          </div>
          <div className="skeleton" style={{ height: 320, maxWidth: 700, margin: "0 auto" }} />
        </div>
      </AnimatedPage>
    );
  }

  if (!progress) return null;

  const stamps = Array.from({ length: progress.requiredOrders }, (_, i) => ({
    index: i,
    filled: i < progress.completedOrders,
    isLatest: i === progress.completedOrders - 1 && progress.completedOrders > 0,
  }));

  return (
    <AnimatedPage className="loyalty-page">
      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 99999,
        }}
      />

      <div className="container">
        {/* ── Hero ── */}
        <motion.div
          className="loyalty-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1>
            <Crown size={36} style={{ verticalAlign: "middle", marginRight: 12, color: "#FFD700" }} />
            FAN <span className="text-gradient">Loyalty Club</span>
          </h1>
          <p className="loyalty-subtitle">
            Earn Fan Stamps with every delivered order. Collect 10 stamps and unlock a FREE T-Shirt reward!
          </p>
        </motion.div>

        {/* ── Loyalty Card ── */}
        <motion.div
          className="loyalty-card"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="loyalty-card-header">
            <span className="loyalty-card-title">
              <Sparkles size={18} style={{ verticalAlign: "middle", marginRight: 6, color: "#FFD700" }} />
              Your Fan Stamps
            </span>
            <span className="loyalty-card-cycle">Cycle #{progress.currentCycle}</span>
          </div>

          {/* Stamps */}
          <div className="loyalty-stamps">
            {stamps.map((stamp) => (
              <FanStamp
                key={stamp.index}
                index={stamp.index}
                filled={stamp.filled}
                isLatest={stamp.isLatest}
                total={progress.requiredOrders}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="loyalty-progress-bar">
            <motion.div
              className="loyalty-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressPercentage}%` }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Stats */}
          <div className="loyalty-progress-stats">
            <span className="loyalty-progress-count">
              <span className="highlight">{progress.completedOrders}</span>
              /{progress.requiredOrders} Stamps
            </span>
            <span className="loyalty-progress-remaining">
              {progress.remainingOrders > 0
                ? `${progress.remainingOrders} remaining`
                : "Reward Unlocked! 🎉"}
            </span>
          </div>

          {/* Motivation Message */}
          <motion.div
            className="loyalty-motivation"
            key={progress.motivationMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {progress.motivationMessage}
          </motion.div>

          {/* Claim Button */}
          {progress.rewardUnlocked && !progress.rewardClaimed && (
            <motion.div
              style={{ textAlign: "center", marginTop: 24 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
            >
              <button className="btn btn-primary btn-lg" onClick={openClaimModal}>
                <Gift size={20} style={{ marginRight: 8 }} />
                Claim Your FREE T-Shirt
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          className="loyalty-stats-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-value">{progress.currentCycle}</div>
            <div className="loyalty-stat-label">Current Cycle</div>
          </div>
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-value" style={{ color: "#FFD700" }}>
              {progress.lifetimeRewards}
            </div>
            <div className="loyalty-stat-label">Lifetime Rewards</div>
          </div>
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-value">{progress.remainingOrders}</div>
            <div className="loyalty-stat-label">Orders Remaining</div>
          </div>
          <div className="loyalty-stat-card">
            <div className="loyalty-stat-value" style={{ color: "#22c55e" }}>
              {progress.progressPercentage}%
            </div>
            <div className="loyalty-stat-label">Progress</div>
          </div>
        </motion.div>

        {/* ── Eligible Products Preview ── */}
        {eligibleProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="loyalty-section-header">
              <ShoppingBag size={22} />
              <h2>Eligible Rewards</h2>
            </div>
            <div className="loyalty-products-grid">
              {eligibleProducts.slice(0, 8).map((product) => (
                <motion.div
                  key={product.id}
                  className="loyalty-product-card"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="loyalty-product-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="loyalty-product-img" style={{ background: "rgba(255,255,255,0.03)" }} />
                  )}
                  <div className="loyalty-product-info">
                    <div className="loyalty-product-name">{product.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="loyalty-product-price">₹{Number(product.price).toLocaleString("en-IN")}</span>
                      <span className="loyalty-product-free">FREE</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Reward History ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="loyalty-section-header">
            <History size={22} />
            <h2>Reward History</h2>
          </div>
          {rewardHistory.length === 0 ? (
            <div className="loyalty-empty">
              <Trophy size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
              <p>No rewards claimed yet. Keep shopping to earn your first FREE T-Shirt!</p>
            </div>
          ) : (
            <div className="loyalty-history-list">
              {rewardHistory.map((reward) => (
                <motion.div
                  key={reward.id}
                  className="loyalty-history-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {reward.productImage ? (
                    <img src={reward.productImage} alt={reward.productName} className="loyalty-history-img" />
                  ) : (
                    <div className="loyalty-history-img" style={{ background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Gift size={20} />
                    </div>
                  )}
                  <div className="loyalty-history-info">
                    <div className="loyalty-history-name">{reward.productName}</div>
                    <div className="loyalty-history-meta">
                      Cycle {reward.cycle} • {new Date(reward.claimedAt).toLocaleDateString()}
                      {reward.productSize && ` • ${reward.productSize}`}
                      {reward.productColor && ` • ${reward.productColor}`}
                    </div>
                    {reward.couponCode && (
                      <div className="loyalty-history-meta" style={{ marginTop: 4 }}>
                        Coupon: {reward.couponCode}
                      </div>
                    )}
                  </div>
                  <span className="loyalty-history-badge">
                    <Star size={10} style={{ marginRight: 4 }} />
                    Claimed
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Claim Modal ── */}
      <AnimatePresence>
        {showClaimModal && (
          <motion.div
            className="loyalty-claim-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !claiming && setShowClaimModal(false)}
          >
            <motion.div
              className="loyalty-claim-modal"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="loyalty-claim-close" onClick={() => !claiming && setShowClaimModal(false)}>
                <X size={24} />
              </button>

              {claimResult ? (
                /* ── Claim Success ── */
                <div className="loyalty-claim-success">
                  <div className="success-emoji">🎉</div>
                  <h3>Reward Claimed!</h3>
                  <div className="coupon-display">{claimResult.couponCode}</div>
                  <p className="success-message">{claimResult.message}</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 24 }}
                    onClick={() => setShowClaimModal(false)}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                /* ── Product Selection ── */
                <>
                  <h2>
                    <Gift size={24} style={{ verticalAlign: "middle", marginRight: 8, color: "#FFD700" }} />
                    Claim Your FREE T-Shirt
                  </h2>
                  <p className="claim-subtitle">Select one eligible product as your reward</p>

                  <div className="loyalty-products-grid" style={{ maxWidth: "100%", marginBottom: 24 }}>
                    {eligibleProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`loyalty-product-card ${selectedProduct?.id === product.id ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedProduct(product);
                          setSelectedSize(product.sizes?.[0] || "");
                          setSelectedColor(product.colors?.[0] || "");
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="loyalty-product-img" />
                        ) : (
                          <div className="loyalty-product-img" style={{ background: "rgba(255,255,255,0.03)" }} />
                        )}
                        <div className="loyalty-product-info">
                          <div className="loyalty-product-name">{product.name}</div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="loyalty-product-price" style={{ textDecoration: "line-through" }}>
                              ₹{Number(product.price).toLocaleString("en-IN")}
                            </span>
                            <span className="loyalty-product-free">FREE</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Size / Color Selection */}
                  {selectedProduct && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="loyalty-selector-row">
                        {selectedProduct.sizes.length > 0 && (
                          <div className="loyalty-selector-group">
                            <label>Size</label>
                            <div className="loyalty-selector-options">
                              {selectedProduct.sizes.map((size) => (
                                <button
                                  key={size}
                                  className={`loyalty-selector-btn ${selectedSize === size ? "active" : ""}`}
                                  onClick={() => setSelectedSize(size)}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProduct.colors.length > 0 && (
                          <div className="loyalty-selector-group">
                            <label>Color</label>
                            <div className="loyalty-selector-options">
                              {selectedProduct.colors.map((color) => (
                                <button
                                  key={color}
                                  className={`loyalty-selector-btn ${selectedColor === color ? "active" : ""}`}
                                  onClick={() => setSelectedColor(color)}
                                >
                                  {color}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%" }}
                    disabled={!selectedProduct || claiming}
                    onClick={handleClaim}
                  >
                    {claiming ? "Claiming..." : "Claim This T-Shirt"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedPage>
  );
}
