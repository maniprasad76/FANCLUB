import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  Star,
  Minus,
  Plus,
  ChevronLeft,
  Truck,
  Shield,
  RotateCcw,
  Edit3,
  X,
  Eye,
  ChevronDown,
  Flame,
  CheckCircle2,
  Shirt,
  Ruler,
  Package,
  MapPin,
} from "lucide-react";
import AnimatedPage from "../../components/AnimatedPage";
import ProductCard from "../../components/ProductCard/ProductCard";
import SEOHead, {
  buildProductSchema,
  buildBreadcrumbSchema,
} from "../../components/SEOHead";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { formatImageUrl } from "../../lib/utils";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cartStatus, setCartStatus] = useState<"idle" | "adding" | "added">(
    "idle",
  );

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");
  const [openFeatureAccordion, setOpenFeatureAccordion] = useState<
    string | null
  >(null);
  const [viewingCount] = useState(Math.floor(Math.random() * 15) + 5);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get(`/products/slug/${slug}`)
      .then((r) => {
        setProduct(r.data);
        if (r.data.sizes?.length) setSelectedSize(r.data.sizes[0]);
        if (r.data.colors?.length) setSelectedColor(r.data.colors[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    api
      .get(`/products/slug/${slug}/related`)
      .then((r) => setRelated(r.data))
      .catch(() => {});
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || cartStatus !== "idle") return;
    setCartStatus("adding");
    setTimeout(async () => {
      await addToCart(
        product.id,
        quantity,
        selectedSize || undefined,
        selectedColor || undefined,
      );
      setCartStatus("added");
      setTimeout(() => setCartStatus("idle"), 2000);
    }, 600);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    await addToCart(
      product.id,
      quantity,
      selectedSize || undefined,
      selectedColor || undefined,
    );
    navigate("/checkout");
  };

  const getCategoryIcon = (size: number) => {
    const cat = product?.category?.name?.toLowerCase() || "";
    if (
      cat.includes("shirt") ||
      cat.includes("hoodie") ||
      cat.includes("top") ||
      cat.includes("jean")
    ) {
      return <Shirt size={size} />;
    }
    return <ShoppingBag size={size} />;
  };

  const handleWishlist = async () => {
    if (!product) return;
    if (!user) {
      toast.error("Please login to add to wishlist");
      navigate("/login?redirect=" + encodeURIComponent(location.pathname));
      return;
    }
    try {
      await api.post(`/wishlist/${product.id}`);
      toast.success("Added to wishlist!");
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    try {
      await api.post("/reviews", {
        productId: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: "" });
      api.get(`/products/slug/${slug}`).then((r) => setProduct(r.data));
    } catch {
      // silent
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="container pdp-page">
        <div className="pdp-split-grid">
          <div
            className="skeleton"
            style={{ aspectRatio: "4/5", borderRadius: "12px" }}
          />
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div
              className="skeleton"
              style={{ width: "40%", height: "20px", borderRadius: "4px" }}
            />
            <div
              className="skeleton"
              style={{ width: "90%", height: "64px", borderRadius: "4px" }}
            />
            <div
              className="skeleton"
              style={{ width: "30%", height: "40px", borderRadius: "4px" }}
            />
            <div
              className="skeleton"
              style={{
                width: "100%",
                height: "120px",
                borderRadius: "8px",
                marginTop: "40px",
              }}
            />
          </div>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="container" style={{ paddingTop: 100 }}>
        <h2>Product not found</h2>
      </div>
    );

  // Create a safe array of images, minimum 1 to prevent map errors
  const displayImages =
    product.images?.length > 0
      ? product.images
      : ["https://placehold.co/800x1000/1a1a2e/8b5cf6?text=TFI"];

  return (
    <AnimatedPage>
      <div className="pdp-page" id="product-detail-page">
        {/* SEO + Structured Data */}
        <SEOHead
          title={`${product.name} — TFICLUB | ₹${product.price.toLocaleString("en-IN")}`}
          description={`${product.description?.slice(0, 155)}... Shop ${product.name} at TFICLUB.`}
          keywords={`${product.name}, TFICLUB, ${product.category?.name || ""}, cinema fashion, buy online India`}
          ogType="product"
          ogImage={formatImageUrl(displayImages[0])}
          jsonLd={[
            buildProductSchema(product),
            buildBreadcrumbSchema([
              { name: "Home", url: window.location.origin },
              { name: "Shop", url: `${window.location.origin}/shop` },
              ...(product.category
                ? [
                    {
                      name: product.category.name,
                      url: `${window.location.origin}/shop?category=${product.category.slug}`,
                    },
                  ]
                : []),
              { name: product.name, url: window.location.href },
            ]),
          ]}
        />

        <div className="container">
          <Link to="/shop" className="pdp-back">
            <ChevronLeft size={16} /> Back to Collection
          </Link>

          <div className="pdp-split-grid">
            {/* Left Column: Image Stack */}
            <div className="pdp-image-stack">
              {displayImages.map((img: string, idx: number) => (
                <motion.div
                  key={idx}
                  className="pdp-image-wrap"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <img
                    src={formatImageUrl(img)}
                    alt={`${product.name} - view ${idx + 1}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </motion.div>
              ))}
            </div>

            {/* Right Column: Sticky Product Info */}
            <div className="pdp-info-sticky">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {product.category && (
                  <span className="pdp-category">{product.category.name}</span>
                )}
                <h1 className="pdp-title">{product.name}</h1>

                {product.reviewCount > 0 && (
                  <div
                    className="pdp-rating-mini"
                    onClick={() =>
                      document
                        .getElementById("reviews-section")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    <Star
                      size={14}
                      fill="var(--bauhaus-black)"
                      stroke="var(--bauhaus-black)"
                    />
                    <span>
                      {product.rating.toFixed(1)} ({product.reviewCount}{" "}
                      Reviews)
                    </span>
                  </div>
                )}

                <div
                  className="pdp-price-wrap"
                  style={{
                    marginBottom: product.comparePrice ? "0.5rem" : "2rem",
                  }}
                >
                  <span className="pdp-current-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                  {product.comparePrice && (
                    <>
                      <span className="pdp-compare-price">
                        ₹{product.comparePrice.toLocaleString("en-IN")}
                      </span>
                    </>
                  )}
                </div>
                {product.comparePrice && (
                  <div className="pdp-savings">
                    You Save ₹
                    {(product.comparePrice - product.price).toLocaleString(
                      "en-IN",
                    )}
                  </div>
                )}

                <div className="scarcity-container">
                  <div className="scarcity-header">
                    <span className="pulse-dot"></span>
                    <span className="scarcity-text">High Demand</span>
                    <span className="view-count">
                      <Eye
                        size={14}
                        style={{
                          display: "inline",
                          marginRight: "4px",
                          verticalAlign: "text-bottom",
                        }}
                      />{" "}
                      {viewingCount} people viewing now
                    </span>
                  </div>
                  {product.stock && product.stock < 15 ? (
                    <div className="stock-warning">
                      <div className="stock-bar">
                        <div
                          className="stock-fill"
                          style={{ width: `${(product.stock / 50) * 100}%` }}
                        ></div>
                      </div>
                      <div className="stock-text">
                        <Flame
                          size={14}
                          style={{
                            display: "inline",
                            marginRight: "4px",
                            verticalAlign: "text-bottom",
                          }}
                        />{" "}
                        Only {product.stock} pieces left worldwide
                      </div>
                    </div>
                  ) : null}
                </div>

                {product.sizes?.length > 0 && (
                  <div className="pdp-option-group">
                    <div className="pdp-option-header">
                      <span className="pdp-option-label">Select Size</span>
                      <button className="size-guide-link">Size Guide</button>
                    </div>
                    <div className="pdp-sizes">
                      {product.sizes.map((s: string) => (
                        <button
                          key={s}
                          className={`size-btn-neo ${selectedSize === s ? "active" : ""}`}
                          onClick={() => setSelectedSize(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.colors?.length > 0 && (
                  <div className="pdp-option-group">
                    <div className="pdp-option-header">
                      <span className="pdp-option-label">Select Color</span>
                    </div>
                    <div className="pdp-colors">
                      {product.colors.map((c: string) => (
                        <button
                          key={c}
                          className={`color-btn-neo ${selectedColor === c ? "active" : ""}`}
                          onClick={() => setSelectedColor(c)}
                          style={{ background: c.toLowerCase() }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="pdp-option-group">
                  <div className="pdp-option-header">
                    <span className="pdp-option-label">Quantity</span>
                  </div>
                  <div className="qty-selector-neo">
                    <button
                      className="qty-btn-neo"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-value-neo">{quantity}</span>
                    <button
                      className="qty-btn-neo"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Stacked Action Buttons */}
                <div className="pdp-action-bar-stacked">
                  <div className="pdp-action-row">
                    <button
                      className={`btn-stacked btn-add-to-cart ${cartStatus !== "idle" ? "adding-active" : ""}`}
                      onClick={handleAddToCart}
                      disabled={cartStatus !== "idle"}
                    >
                      <AnimatePresence mode="wait">
                        {cartStatus === "idle" && (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            Add to cart
                          </motion.span>
                        )}
                        {cartStatus === "adding" && (
                          <motion.span
                            key="adding"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                            }}
                          >
                            <motion.span
                              initial={{ x: -30, opacity: 0 }}
                              animate={{
                                x: 10,
                                scale: 0.3,
                                opacity: [0, 1, 0],
                              }}
                              transition={{ duration: 0.6, ease: "easeInOut" }}
                            >
                              {getCategoryIcon(18)}
                            </motion.span>
                            <motion.span
                              initial={{ scale: 1 }}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ delay: 0.4, duration: 0.3 }}
                            >
                              <ShoppingBag size={18} />
                            </motion.span>
                          </motion.span>
                        )}
                        {cartStatus === "added" && (
                          <motion.span
                            key="added"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircle2 size={18} /> Added to Bag
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    <button
                      className="btn-wishlist-neo"
                      onClick={handleWishlist}
                      title="Add to Wishlist"
                    >
                      <Heart size={22} strokeWidth={1.5} />
                    </button>
                  </div>
                  <button
                    className="btn-stacked btn-buy-now-full"
                    onClick={handleBuyNow}
                  >
                    Buy It Now
                  </button>
                </div>

                {/* Size Chart Link */}
                <button
                  className="pdp-size-chart-link"
                  onClick={() => setSizeChartOpen(!sizeChartOpen)}
                >
                  <Ruler size={18} />
                  <span>Size Chart</span>
                </button>

                {/* Size Chart Modal */}
                <AnimatePresence>
                  {sizeChartOpen && (
                    <motion.div
                      className="size-chart-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="size-chart-inner">
                        <table className="size-chart-table">
                          <thead>
                            <tr>
                              <th>Size</th>
                              <th>Chest (in)</th>
                              <th>Length (in)</th>
                              <th>Shoulder (in)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>S</td>
                              <td>38</td>
                              <td>27</td>
                              <td>17</td>
                            </tr>
                            <tr>
                              <td>M</td>
                              <td>40</td>
                              <td>28</td>
                              <td>18</td>
                            </tr>
                            <tr>
                              <td>L</td>
                              <td>42</td>
                              <td>29</td>
                              <td>19</td>
                            </tr>
                            <tr>
                              <td>XL</td>
                              <td>44</td>
                              <td>30</td>
                              <td>20</td>
                            </tr>
                            <tr>
                              <td>XXL</td>
                              <td>46</td>
                              <td>31</td>
                              <td>21</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Delivery Timeline */}
                <div className="delivery-timeline">
                  <div className="delivery-timeline-bar">
                    <div className="timeline-progress-track">
                      <div className="timeline-progress-fill" />
                    </div>
                    <div className="timeline-node">
                      <div className="timeline-icon active">
                        <Package size={18} />
                      </div>
                      <div className="timeline-label">Ordered</div>
                      <div className="timeline-date">
                        {(() => {
                          const d = new Date();
                          return d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        })()}
                      </div>
                    </div>
                    <div className="timeline-node">
                      <div className="timeline-icon">
                        <Truck size={18} />
                      </div>
                      <div className="timeline-label">Order Ready</div>
                      <div className="timeline-date">
                        {(() => {
                          const d = new Date();
                          const d2 = new Date(d);
                          d.setDate(d.getDate() + 1);
                          d2.setDate(d2.getDate() + 3);
                          return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${d2.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                        })()}
                      </div>
                    </div>
                    <div className="timeline-node">
                      <div className="timeline-icon">
                        <MapPin size={18} />
                      </div>
                      <div className="timeline-label">Delivered</div>
                      <div className="timeline-date">
                        {(() => {
                          const d = new Date();
                          const d2 = new Date(d);
                          d.setDate(d.getDate() + 4);
                          d2.setDate(d2.getDate() + 7);
                          return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${d2.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Accordions */}
                <div className="pdp-feature-accordions">
                  <FeatureAccordionItem
                    icon={<Truck size={22} />}
                    title="Priority Logistics"
                    isOpen={openFeatureAccordion === "logistics"}
                    onClick={() =>
                      setOpenFeatureAccordion(
                        openFeatureAccordion === "logistics"
                          ? null
                          : "logistics",
                      )
                    }
                  >
                    <p>
                      Your order ships via our premium logistics network within
                      24-48 hours. We partner with top-tier carriers to ensure
                      safe, tracked delivery to your doorstep.
                    </p>
                  </FeatureAccordionItem>
                  <FeatureAccordionItem
                    icon={<Package size={22} />}
                    title="Artisanal Packaging"
                    isOpen={openFeatureAccordion === "packaging"}
                    onClick={() =>
                      setOpenFeatureAccordion(
                        openFeatureAccordion === "packaging"
                          ? null
                          : "packaging",
                      )
                    }
                  >
                    <p>
                      Every order is hand-wrapped in our signature packaging —
                      premium tissue, branded stickers, and a collectible card.
                      Unboxing is part of the experience.
                    </p>
                  </FeatureAccordionItem>
                  <FeatureAccordionItem
                    icon={<Shirt size={22} />}
                    title="The Legend Fit"
                    isOpen={openFeatureAccordion === "fit"}
                    onClick={() =>
                      setOpenFeatureAccordion(
                        openFeatureAccordion === "fit" ? null : "fit",
                      )
                    }
                  >
                    <p>
                      Our signature Legend Fit is engineered for the modern
                      silhouette — tailored through the shoulders, relaxed
                      through the body, with the perfect drop length. Pre-shrunk
                      premium cotton ensures the fit stays true, wash after
                      wash.
                    </p>
                  </FeatureAccordionItem>
                </div>

                {/* Dress With Class Tagline */}
                <div className="pdp-dress-with-class">DRESS WITH CLASS</div>

                {/* Accordions */}
                <div className="pdp-accordion-group">
                  <AccordionItem
                    title="Product Details"
                    isOpen={openAccordion === "details"}
                    onClick={() =>
                      setOpenAccordion(
                        openAccordion === "details" ? null : "details",
                      )
                    }
                  >
                    <p>{product.description}</p>
                    <ul
                      style={{
                        marginTop: "16px",
                        paddingLeft: "20px",
                        listStyle: "disc",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <li>Premium 100% bio-washed cotton</li>
                      <li>High-density cinematic prints</li>
                      <li>Pre-shrunk for perfect fit</li>
                      <li>Made in India</li>
                    </ul>
                  </AccordionItem>
                  <AccordionItem
                    title="Shipping & Returns"
                    isOpen={openAccordion === "shipping"}
                    onClick={() =>
                      setOpenAccordion(
                        openAccordion === "shipping" ? null : "shipping",
                      )
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <Truck size={18} /> Delivery within 3-5 business days
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <RotateCcw size={18} /> 7-day hassle-free return policy
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <Shield size={18} /> Secure encrypted payments
                      </div>
                    </div>
                  </AccordionItem>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Full Width Reviews Section */}
        <div className="neo-section" id="reviews-section">
          <div className="container">
            <h2 className="neo-section-title">Customer Reviews</h2>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "20px",
              }}
            >
              {user ? (
                <button
                  className="btn btn-outline"
                  onClick={() => setReviewModalOpen(true)}
                >
                  <Edit3 size={18} /> Write a Review
                </button>
              ) : (
                <Link to="/login" className="btn btn-ghost">
                  Login to Review
                </Link>
              )}
            </div>

            {product.reviews?.length > 0 ? (
              <div className="review-masonry">
                {product.reviews.map((r: any, i: number) => (
                  <motion.div
                    key={r.id}
                    className="review-card-neo"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                  >
                    <div className="review-header-neo">
                      <span className="reviewer-name">
                        {r.user?.name || "Anonymous Verified Buyer"}
                      </span>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={14}
                            fill={
                              idx < r.rating
                                ? "var(--bauhaus-black)"
                                : "transparent"
                            }
                            stroke="var(--bauhaus-black)"
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="review-comment">"{r.comment}"</p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="neo-reviews-empty">
                <Star
                  size={48}
                  color="var(--text-muted)"
                  style={{ margin: "0 auto 16px", opacity: 0.3 }}
                />
                <h4 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
                  No reviews yet
                </h4>
                <p style={{ color: "var(--text-muted)" }}>
                  Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* You May Also Like */}
        {related.length > 0 && (
          <div
            className="neo-section"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="container">
              <h2 className="neo-section-title">You May Also Like</h2>
              <div className="product-grid">
                {related.map((p: any, i: number) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Glassmorphic CTA */}
        <div className={`floating-action-bar ${isScrolled ? "visible" : ""}`}>
          <div className="floating-info">
            {displayImages[0] && (
              <img
                src={formatImageUrl(displayImages[0])}
                alt="product"
                style={{ width: "40px", height: "50px", objectFit: "cover" }}
              />
            )}
            <div>
              <div className="floating-title">{product.name}</div>
              <div className="floating-price">
                ₹{(product.price * quantity).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <div className="floating-actions">
            <button
              className="btn-wishlist-neo"
              onClick={handleWishlist}
              style={{ width: "48px", height: "48px" }}
            >
              <Heart size={20} strokeWidth={1.5} />
            </button>
            <button
              className={`btn-super ${cartStatus !== "idle" ? "adding-active" : ""}`}
              onClick={handleAddToCart}
              disabled={cartStatus !== "idle"}
              style={{
                position: "relative",
                overflow: "hidden",
                minWidth: "160px",
              }}
            >
              <AnimatePresence mode="wait">
                {cartStatus === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    <ShoppingBag size={18} /> Add To Bag
                  </motion.div>
                )}
                {cartStatus === "adding" && (
                  <motion.div
                    key="adding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "24px",
                      width: "100%",
                    }}
                  >
                    <motion.div
                      initial={{ x: -40, y: 0, scale: 1, opacity: 0 }}
                      animate={{ x: 10, y: 0, scale: 0.3, opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      style={{ position: "absolute", zIndex: 2 }}
                    >
                      {getCategoryIcon(18)}
                    </motion.div>
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <ShoppingBag size={18} />
                    </motion.div>
                  </motion.div>
                )}
                {cartStatus === "added" && (
                  <motion.div
                    key="added"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={18} /> Added
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Review Modal */}
        <AnimatePresence>
          {reviewModalOpen && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.8)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <motion.div
                className="modal-content glass-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={{
                  backgroundColor: "white",
                  color: "black",
                  padding: "32px",
                  borderRadius: "16px",
                  border: "none",
                  maxWidth: "400px",
                  width: "100%",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setReviewModalOpen(false)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                  }}
                >
                  <X size={24} color="black" />
                </button>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.8rem",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                  }}
                >
                  Leave a Review
                </h3>
                <form
                  onSubmit={submitReview}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "8px", cursor: "pointer" }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={28}
                        fill={
                          star <= reviewForm.rating
                            ? "var(--bauhaus-black)"
                            : "transparent"
                        }
                        stroke="var(--bauhaus-black)"
                        onClick={() =>
                          setReviewForm({ ...reviewForm, rating: star })
                        }
                      />
                    ))}
                  </div>
                  <textarea
                    placeholder="Share your thoughts on the quality and fit..."
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    style={{
                      padding: "16px",
                      minHeight: "120px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-super"
                    style={{ marginTop: "8px" }}
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedPage>
  );
}

// Helper Accordion Component
function AccordionItem({
  title,
  isOpen,
  onClick,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pdp-accordion">
      <button className="pdp-accordion-trigger" onClick={onClick}>
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pdp-accordion-content-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Feature Accordion with icon (for Priority Logistics, Artisanal Packaging, etc.)
function FeatureAccordionItem({
  icon,
  title,
  isOpen,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="feature-accordion">
      <button className="feature-accordion-trigger" onClick={onClick}>
        <div className="feature-accordion-left">
          <span className="feature-accordion-icon">{icon}</span>
          <span className="feature-accordion-title">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="feature-accordion-content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
