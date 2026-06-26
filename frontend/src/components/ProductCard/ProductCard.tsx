import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatImageUrl } from "../../lib/utils";
import "./ProductCard.css";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    rating: number;
    reviewCount: number;
    category?: { name: string; slug: string };
    newArrival?: boolean;
    bestseller?: boolean;
    description?: string;
  };
  onWishlist?: (id: string) => void;
}

/*
 * Performance optimizations:
 * 1. React.memo — prevents re-render when parent re-renders but props haven't changed
 * 2. Removed framer-motion whileInView — was creating an IntersectionObserver per card,
 *    causing scroll jank with 12+ cards. Parent grid handles entrance animations instead.
 * 3. Removed motion.div wrapper entirely — pure DOM, no animation overhead per card
 * 4. Added decoding="async" on images for non-blocking decode
 */
const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/product/${product.slug}`);
  };

  return (
    <div className="modern-product-card">
      <Link to={`/product/${product.slug}`} className="mpc-link-wrapper">
        <div className="mpc-image-container">
          <img
            src={
              formatImageUrl(product.images?.[0]) ||
              "https://placehold.co/400x500/f0f0f0/111?text=FAN"
            }
            alt={product.name}
            className="mpc-image"
            loading="lazy"
            decoding="async"
          />

          <div className="mpc-badges-top">
            {(product.bestseller || product.newArrival || true) && (
              <span className="mpc-badge-glass">
                {product.bestseller
                  ? "Best Seller"
                  : product.newArrival
                    ? "New Arrival"
                    : "Best Seller"}
              </span>
            )}
            <div className="mpc-brand-box">
              <span>FAN</span>
            </div>
          </div>

          <div className="mpc-dots">
            <span className="mpc-dot active"></span>
            <span className="mpc-dot"></span>
            <span className="mpc-dot"></span>
            <span className="mpc-dot"></span>
          </div>
        </div>

        <div className="mpc-info">
          <h3 className="mpc-title">{product.name}</h3>
          <p className="mpc-subtitle">
            {product.category?.name || "Exclusive Drop"}
          </p>
          <p className="mpc-desc">
            {product.description
              ? product.description.length > 60
                ? product.description.slice(0, 60) + "..."
                : product.description
              : "Step into classic fandom style with durable, premium materials designed for comfort."}
          </p>

          <div className="mpc-bottom-row">
            <div className="mpc-price-pill">
              ₹{product.price.toLocaleString("en-IN")}
            </div>

            <button className="mpc-buy-btn" onClick={handleBuyNow}>
              <span>Buy Now</span>
              <div className="mpc-buy-icon">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
});

export default ProductCard;
