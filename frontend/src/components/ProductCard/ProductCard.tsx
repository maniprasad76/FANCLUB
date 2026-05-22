import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/product/${product.slug}`);
  };

  return (
    <motion.div
      className="modern-product-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Link to={`/product/${product.slug}`} className="mpc-link-wrapper">
        <div className="mpc-image-container">
          <img
            src={
              formatImageUrl(product.images?.[0]) ||
              "https://placehold.co/400x500/f0f0f0/111?text=TFI"
            }
            alt={product.name}
            className="mpc-image"
            loading="lazy"
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
              <span>TFI</span>
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
              : "Step into classic cinema style with durable, premium materials designed for comfort."}
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
    </motion.div>
  );
}
