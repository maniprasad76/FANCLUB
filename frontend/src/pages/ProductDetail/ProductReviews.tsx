import { useState, useEffect, useRef } from "react";
import {
  Star,
  Edit3,
  X,
  BadgeCheck,
  Camera,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";
import "./ProductReviews.css";

const MAX_PHOTOS = 3;

export default function ProductReviews({ product, setProduct, user, slug }: any) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = photoPreviews;
  const [submittingReview, setSubmittingReview] = useState(false);

  // Revoke preview object URLs on unmount (they were created via createObjectURL)
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const [lightbox, setLightbox] = useState<string | null>(null);

  const loadReviews = () => {
    if (!product?.id) return;
    setLoadingReviews(true);
    api
      .get(`/reviews/product/${product.id}`)
      .then((r) => setReviews(r.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const filtered =
    ratingFilter === null
      ? reviews
      : reviews.filter((r) => r.rating === ratingFilter);

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(
      0,
      MAX_PHOTOS - photoUrls.length,
    );
    if (!files.length) return;
    setUploadingPhoto(true);
    try {
      const newUrls: string[] = [];
      const newPreviews: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const { data } = await api.post("/upload/review-image", fd);
        newUrls.push(data.url);
        newPreviews.push(URL.createObjectURL(file));
      }
      setPhotoUrls((p) => [...p, ...newUrls]);
      setPhotoPreviews((p) => [...p, ...newPreviews]);
    } catch {
      // silent — global axios toasts already handle errors
    } finally {
      setUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const removePhoto = (idx: number) => {
    setPhotoPreviews((p) => {
      const target = p[idx];
      if (target) URL.revokeObjectURL(target);
      return p.filter((_, i) => i !== idx);
    });
    setPhotoUrls((p) => p.filter((_, i) => i !== idx));
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
        photos: photoUrls,
      });
      setReviewModalOpen(false);
      setReviewForm({ rating: 5, comment: "" });
      photoPreviews.forEach((u) => URL.revokeObjectURL(u));
      setPhotoUrls([]);
      setPhotoPreviews([]);
      loadReviews();
      api.get(`/products/slug/${slug}`).then((r: any) => setProduct(r.data));
    } catch {
      // silent
    } finally {
      setSubmittingReview(false);
    }
  };

  const ratingBreakdown = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : product?.rating || 0;

  return (
    <>
      <div className="neo-section" id="reviews-section">
        <div className="container">
          <h2 className="neo-section-title">Customer Reviews</h2>

          {/* ── Summary bar: average, count, rating filters ── */}
          {reviews.length > 0 && (
            <div className="pr-summary">
              <div className="pr-summary-score">
                <span className="pr-score-big">
                  {ratingBreakdown.toFixed(1)}
                </span>
                <div className="pr-score-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= Math.round(ratingBreakdown) ? "var(--bauhaus-black)" : "transparent"}
                      stroke="var(--bauhaus-black)"
                    />
                  ))}
                  <span className="pr-score-count">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="pr-filters" role="group" aria-label="Filter reviews by rating">
                <button
                  className={`pr-filter-chip ${ratingFilter === null ? "active" : ""}`}
                  onClick={() => setRatingFilter(null)}
                >
                  All
                </button>
                {starCounts.map(({ star, count }) => (
                  <button
                    key={star}
                    className={`pr-filter-chip ${ratingFilter === star ? "active" : ""}`}
                    onClick={() =>
                      setRatingFilter(ratingFilter === star ? null : star)
                    }
                    disabled={count === 0}
                    title={`${star} star${star !== 1 ? "s" : ""} (${count})`}
                  >
                    {star}★ <span className="pr-chip-count">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            {user ? (
              <button className="btn btn-outline" onClick={() => setReviewModalOpen(true)}>
                <Edit3 size={18} /> Write a Review
              </button>
            ) : (
              <Link to="/login" className="btn btn-ghost">
                Login to Review
              </Link>
            )}
          </div>

          {loadingReviews ? (
            <div className="pr-loading">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="pr-masonry">
              {filtered.map((r: any, i: number) => (
                <motion.div
                  key={r.id}
                  className="pr-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.08, 0.4), duration: 0.5 }}
                >
                  <div className="pr-card-top">
                    <span className="pr-reviewer">
                      {r.user?.name || "Anonymous Buyer"}
                      {r.verified && (
                        <span className="pr-verified" title="Verified buyer — this customer has a delivered order for this product">
                          <BadgeCheck size={14} /> Verified Buyer
                        </span>
                      )}
                    </span>
                    <div className="pr-stars" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={13}
                          fill={idx < r.rating ? "var(--bauhaus-black)" : "transparent"}
                          stroke="var(--bauhaus-black)"
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="pr-comment">“{r.comment}”</p>}
                  {r.photos?.length > 0 && (
                    <div className="pr-photos">
                      {r.photos.map((p: string, pi: number) => (
                        <button
                          key={pi}
                          className="pr-photo-thumb"
                          onClick={() => setLightbox(p)}
                          aria-label="View review photo"
                        >
                          <img src={p} alt={`Review photo ${pi + 1}`} loading="lazy" decoding="async" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="pr-date">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="neo-reviews-empty">
              <Star size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              <h4 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
                {reviews.length > 0
                  ? `No ${ratingFilter}★ reviews yet`
                  : "No reviews yet"}
              </h4>
              <p style={{ color: "var(--text-muted)" }}>
                {reviews.length > 0
                  ? "Try another rating filter."
                  : "Be the first to share your thoughts!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Write a Review modal ── */}
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
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                padding: "32px",
                borderRadius: "16px",
                border: "1px solid var(--border-subtle)",
                maxWidth: "440px",
                width: "100%",
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
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
                  color: "currentColor",
                }}
                aria-label="Close review form"
              >
                <X size={24} />
              </button>
              <h3 className="pr-modal-title">Leave a Review</h3>
              <form onSubmit={submitReview} className="pr-form">
                <div className="pr-form-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={30}
                      fill={star <= reviewForm.rating ? "var(--bauhaus-black)" : "transparent"}
                      stroke="var(--bauhaus-black)"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>
                <textarea
                  placeholder="Share your thoughts on the quality and fit..."
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  className="pr-textarea"
                />

                {/* Photo upload */}
                <div className="pr-upload">
                  <div className="pr-upload-header">
                    <span>Add photos</span>
                    <span className="pr-upload-hint">
                      {photoUrls.length}/{MAX_PHOTOS} — helps other fans
                    </span>
                  </div>
                  <div className="pr-upload-grid">
                    {photoPreviews.map((preview, idx) => (
                      <div key={idx} className="pr-upload-thumb">
                        <img src={preview} alt={`Selected photo ${idx + 1}`} />
                        <button
                          type="button"
                          className="pr-upload-remove"
                          onClick={() => removePhoto(idx)}
                          aria-label="Remove photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {photoUrls.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        className="pr-upload-zone"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Camera size={20} />
                        )}
                        <span>{uploadingPhoto ? "Uploading..." : "Add photo"}</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    hidden
                    onChange={handlePhotoSelect}
                  />
                </div>

                <button type="submit" disabled={submittingReview} className="btn-super" style={{ marginTop: "8px" }}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="pr-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-label="Review photo preview"
          >
            <button className="pr-lightbox-close" onClick={() => setLightbox(null)} aria-label="Close preview">
              <X size={26} />
            </button>
            <motion.img
              src={lightbox}
              alt="Review photo enlarged"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
