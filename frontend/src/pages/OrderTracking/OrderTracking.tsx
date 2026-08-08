import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Check,
  Truck,
  Home,
  Clock,
  Copy,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft,
  ExternalLink,
  ShoppingBag,
  FileText,
} from "lucide-react";
import AnimatedPage from "../../components/AnimatedPage";
import api from "../../lib/api";
import { formatImageUrl } from "../../lib/utils";
import "./OrderTracking.css";

/** Step order drives the visual timeline. */
const TIMELINE_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: FileText },
  { key: "CONFIRMED", label: "Confirmed", icon: Check },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
] as const;

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

/**
 * Courier tracking URL template, e.g. https://example.com/track?awb={trackingId}
 *
 * Priority: 1) the DB-backed `courier_tracking_url` setting managed from the
 * admin Settings page (fetched on mount), 2) the VITE_COURIER_TRACKING_URL
 * env var as a build-time fallback.
 */
const ENV_COURIER_TEMPLATE = (import.meta.env.VITE_COURIER_TRACKING_URL as
  | string
  | undefined)?.trim();

/** Add `days` calendar days, skipping weekends (simple business-day helper). */
function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "ot-badge-warning",
  CONFIRMED: "ot-badge-info",
  PROCESSING: "ot-badge-info",
  SHIPPED: "ot-badge-accent",
  DELIVERED: "ot-badge-success",
  CANCELLED: "ot-badge-danger",
  REFUNDED: "ot-badge-danger",
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [courierSetting, setCourierSetting] = useState<{
    url: string;
    configured: boolean;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Load the courier tracking URL template (DB setting, env fallback)
  useEffect(() => {
    api
      .get("/settings/tracking-url")
      .then((r: any) =>
        setCourierSetting(r.data || { url: "", configured: false }),
      )
      .catch(() => setCourierSetting({ url: "", configured: false }));
  }, []);

  const delivery = useMemo(() => {
    if (!order) return null;
    const placedAt = new Date(order.createdAt);
    const eta = addBusinessDays(placedAt, 5);
    const etaEnd = addBusinessDays(placedAt, 7);

    let daysLeft = 0;
    if (order.status !== "DELIVERED" && order.status !== "CANCELLED") {
      let d = new Date();
      let count = 0;
      while (d < eta && count < 60) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) count += 1;
      }
      daysLeft = Math.max(count, 1);
    }

    return {
      eta,
      etaEnd,
      daysLeft,
      etaLabel:
        order.status === "DELIVERED"
          ? "Delivered"
          : order.status === "CANCELLED"
            ? "Cancelled"
            : `${eta.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} – ${etaEnd.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`,
    };
  }, [order]);

  const currentStep = order ? STATUS_INDEX[order.status] ?? 0 : 0;
  const isCancelled = order?.status === "CANCELLED" || order?.status === "REFUNDED";
  const courierUrl = useMemo(() => {
    const url = courierSetting?.url?.trim() || "";
    // An explicitly configured (even empty) setting wins over the env
    // fallback — this lets admins fully disable the courier link.
    const template = courierSetting?.configured
      ? url || null
      : url || ENV_COURIER_TEMPLATE || null;
    if (!order?.trackingId || !template) return null;
    try {
      return template.replace(
        "{trackingId}",
        encodeURIComponent(order.trackingId),
      );
    } catch {
      return null;
    }
  }, [order, courierSetting]);

  const copyTrackingId = async () => {
    if (!order?.trackingId) return;
    try {
      await navigator.clipboard.writeText(order.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="container ot-page">
          <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
        </div>
      </AnimatedPage>
    );
  }

  if (!order) {
    return (
      <AnimatedPage>
        <div className="container ot-page">
          <div className="ot-not-found">
            <XCircle size={52} style={{ opacity: 0.4, marginBottom: 16 }} />
            <h1 className="heading-md">Order not found</h1>
            <p className="text-muted">It may have been placed on a different account.</p>
            <Link to="/profile" className="btn btn-primary" style={{ marginTop: 20 }}>
              <ChevronLeft size={16} /> Back to My Orders
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="container ot-page" id="order-tracking-page">
        <Link to="/profile" className="ot-back">
          <ChevronLeft size={16} /> My Orders
        </Link>

        {/* Header */}
        <div className="ot-header">
          <div>
            <div className="ot-eyebrow">ORDER TRACKING</div>
            <h1 className="heading-lg ot-title">
              Order <span className="text-gradient">{order.orderNumber?.slice(0, 8)}</span>
            </h1>
            <p className="text-muted ot-placed">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="ot-header-side">
            <span className={`ot-badge ${STATUS_BADGE_CLASS[order.status] || "ot-badge-info"}`}>
              {order.status}
            </span>
            <span className="ot-total">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Timeline */}
        <motion.section
          className="ot-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h2 className="ot-section-title">Progress</h2>

          {isCancelled ? (
            <div className="ot-cancelled-banner">
              <XCircle size={22} />
              <div>
                <strong>This order was {order.status.toLowerCase()}.</strong>
                <p>Refunds, if applicable, are processed back to your original payment method.</p>
              </div>
            </div>
          ) : (
            <div className="ot-timeline">
              {TIMELINE_STEPS.map(({ key, label, icon: Icon }, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={key} className="ot-step">
                    <div className="ot-step-marker">
                      {isCompleted ? (
                        <div className={`ot-node done ${isCurrent ? "current" : ""}`}>
                          <Icon size={16} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="ot-node pending">
                          <Icon size={16} />
                        </div>
                      )}
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <div className={`ot-connector ${isCompleted ? "done" : ""}`} />
                      )}
                    </div>
                    <div className="ot-step-body">
                      <span className={`ot-step-label ${isCompleted ? "active" : ""}`}>{label}</span>
                      <span className="ot-step-date">
                        {idx === 0
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : isCurrent
                            ? new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : isCompleted
                              ? "Done"
                              : "Upcoming"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ETA countdown */}
          {delivery && !isCancelled && (
            <div className="ot-eta">
              <Clock size={20} />
              <div>
                <span className="ot-eta-label">
                  {order.status === "DELIVERED" ? "Delivered" : "Estimated Delivery"}
                </span>
                <strong>{delivery.etaLabel}</strong>
              </div>
              {order.status !== "DELIVERED" && (
                <span className="ot-eta-count">
                  Arriving in ~{delivery.daysLeft} business day{delivery.daysLeft !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </motion.section>

        <div className="ot-grid">
          {/* Courier tracking */}
          <motion.section
            className="ot-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <h2 className="ot-section-title">Courier Tracking</h2>
            {order.trackingId ? (
              <div className="ot-tracking-id">
                <div>
                  <span className="ot-info-label">Tracking ID</span>
                  <strong className="ot-tracking-value">{order.trackingId}</strong>
                </div>
                <div className="ot-tracking-actions">
                  <button className="btn btn-outline btn-sm" onClick={copyTrackingId}>
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  {courierUrl && (
                    <a
                      className="btn btn-primary btn-sm"
                      href={courierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Track Package <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                {!courierUrl && (
                  <p className="ot-tracking-hint">
                    Enter this ID on your courier partner's tracking page to follow the package.
                  </p>
                )}
              </div>
            ) : (
              <div className="ot-empty-tracking">
                <Truck size={30} style={{ opacity: 0.35 }} />
                <p>
                  {order.status === "SHIPPED" || order.status === "DELIVERED"
                    ? "Tracking details will appear here once your shipment is assigned."
                    : "Your order will receive a tracking ID once it ships."}
                </p>
              </div>
            )}
          </motion.section>

          {/* Delivery address */}
          <motion.section
            className="ot-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <h2 className="ot-section-title">Delivering To</h2>
            {order.address ? (
              <div className="ot-address">
                <MapPin size={18} className="ot-address-icon" />
                <div>
                  <strong>
                    {order.address.name} — {order.address.phone}
                  </strong>
                  <p>
                    {order.address.street}, {order.address.city}, {order.address.state}{" "}
                    {order.address.pincode}
                    {order.address.country ? `, ${order.address.country}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted">Shipping details attached to your order.</p>
            )}
          </motion.section>
        </div>

        {/* Items */}
        <motion.section
          className="ot-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <h2 className="ot-section-title">Items</h2>
          <div className="ot-items">
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="ot-item">
                <img
                  src={formatImageUrl(item.image || item.product?.images?.[0])}
                  alt={item.name || item.product?.name}
                  loading="lazy"
                  decoding="async"
                />
                <div className="ot-item-info">
                  <strong>{item.name || item.product?.name}</strong>
                  <span>
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && " • "}
                    {item.color && `Color: ${item.color}`}
                    {(item.size || item.color) && " • "}Qty: {item.quantity}
                  </span>
                </div>
                <span className="ot-item-price">
                  ₹{Number(item.price || item.product?.price || 0).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
          <div className="ot-totals">
            <div>
              <span>Subtotal</span>
              <span>₹{Number(order.totalAmount - (order.shippingAmount || 0)).toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span>Shipping & Taxes</span>
              <span>{(order.shippingAmount || 0) === 0 ? "Free (Inclusive)" : `₹${order.shippingAmount}`}</span>
            </div>
            <div className="ot-grand">
              <span>Total</span>
              <span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </motion.section>

        {/* Actions */}
        <div className="ot-actions">
          <Link to="/shop" className="btn btn-outline">
            <ShoppingBag size={16} /> Continue Shopping
          </Link>
          <Link to="/profile" className="btn btn-primary">
            View All Orders
          </Link>
        </div>
      </div>
    </AnimatedPage>
  );
}
