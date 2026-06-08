import { useState } from "react";
import { Star, Edit3, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";

export default function ProductReviews({ product, setProduct, user, slug }: any) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

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
      api.get(`/products/slug/${slug}`).then((r: any) => setProduct(r.data));
    } catch {
      // silent
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <>
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
                <div style={{ display: "flex", gap: "8px", cursor: "pointer" }}>
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
    </>
  );
}
