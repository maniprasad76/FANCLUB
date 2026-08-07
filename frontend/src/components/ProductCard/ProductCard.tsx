import { memo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { formatImageUrl } from "../../lib/utils";
import api from "../../lib/api";
import "./ProductCard.css";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    rating?: number;
    reviewCount?: number;
    category?: { name: string; slug: string };
    newArrival?: boolean;
    bestseller?: boolean;
    description?: string;
  };
  onWishlist?: (id: string) => void;
  variant?: "default" | "clean";
}

const ProductCard = memo(function ProductCard({
  product,
  onWishlist,
  variant = "clean",
}: ProductCardProps) {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const priceNum = typeof product.price === "number" ? product.price : parseFloat(product.price || 0);
  const compareNum = product.comparePrice
    ? typeof product.comparePrice === "number"
      ? product.comparePrice
      : parseFloat(product.comparePrice)
    : undefined;

  const hasDiscount = compareNum && compareNum > priceNum;
  const discountPercent = hasDiscount
    ? Math.round(((compareNum - priceNum) / compareNum) * 100)
    : null;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
    if (onWishlist) {
      onWishlist(product.id);
    } else {
      try {
        await api.post(`/wishlist/${product.id}`);
      } catch {
        /* silent fallback for guest or unauth */
      }
    }
  };

  const handleCardClick = () => {
    // Navigate to product detail page on card click
    navigate(`/product/${product.slug}`);
  };

  if (variant === "clean") {
    return (
      <div className="clean-product-card" onClick={handleCardClick}>
        <div className="clean-image-container">
          <img
            src={
              formatImageUrl(product.images?.[0]) ||
              "https://placehold.co/400x500/f5f5f7/999?text=Product"
            }
            alt={product.name}
            className="clean-image"
            loading="lazy"
            decoding="async"
          />

          {/* Badges in top left corner */}
          <div className="clean-badges-left">
            {discountPercent ? (
              <span className="clean-badge discount-badge">-{discountPercent}%</span>
            ) : product.newArrival ? (
              <span className="clean-badge new-badge">New</span>
            ) : product.bestseller ? (
              <span className="clean-badge bestseller-badge">Popular</span>
            ) : null}
          </div>

          {/* Badges in top right corner if both discount and new exist */}
          {discountPercent && product.newArrival && (
            <div className="clean-badges-right">
              <span className="clean-badge new-badge">New</span>
            </div>
          )}
        </div>

        <div className="clean-info">
          <div className="clean-title-row">
            <h3 className="clean-title">{product.name}</h3>
            <button
              type="button"
              className={`clean-wishlist-btn ${isWishlisted ? "active" : ""}`}
              onClick={handleWishlist}
              aria-label="Add to Wishlist"
            >
              <Heart
                size={18}
                fill={isWishlisted ? "#e052a0" : "none"}
                stroke={isWishlisted ? "#e052a0" : "#a0a0a0"}
                strokeWidth={1.75}
              />
            </button>
          </div>

          <div className="clean-price-row">
            <span className="clean-current-price">
              ₹{priceNum.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="clean-compare-price">
                ₹{compareNum.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Default Nike / Fandom style variant */
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
            {(product.bestseller || product.newArrival || discountPercent) && (
              <span className="mpc-badge-glass">
                {discountPercent
                  ? `-${discountPercent}% OFF`
                  : product.bestseller
                  ? "Best Seller"
                  : "New Arrival"}
              </span>
            )}
            <div className="mpc-brand-box">
              <span>FAN</span>
            </div>
          </div>
        </div>

        <div className="mpc-info">
          <h3 className="mpc-title">{product.name}</h3>
          <p className="mpc-subtitle">
            {product.category?.name || "Exclusive Drop"}
          </p>

          <div className="mpc-bottom-row">
            <div className="mpc-price-pill">
              ₹{priceNum.toLocaleString("en-IN")}
              {hasDiscount && (
                <span className="mpc-strikethrough"> ₹{compareNum.toLocaleString("en-IN")}</span>
              )}
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

