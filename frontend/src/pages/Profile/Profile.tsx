import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Package, MapPin, LogOut, Edit2, Crown, Fan, Gift } from "lucide-react";
import AnimatedPage from "../../components/AnimatedPage";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import "./Profile.css";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [loyalty, setLoyalty] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/profile");
      return;
    }
    setForm({ name: user.name || "" });
    api
      .get("/orders/my-orders")
      .then((r) => setOrders(r.data.orders || []))
      .catch((err: any) => {
        if (err.response?.status === 401) navigate("/login?redirect=/profile");
      });
    api
      .get("/users/me/profile")
      .then((r) => setAddresses(r.data.addresses || []))
      .catch((err: any) => {
        if (err.response?.status === 401) navigate("/login?redirect=/profile");
      });
    api
      .get("/loyalty/progress")
      .then((r) => setLoyalty(r.data))
      .catch(() => {});
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put("/users/me/profile", form);
    updateUser(form);
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const statusColors: any = {
    PENDING: "badge-warning",
    CONFIRMED: "badge-primary",
    SHIPPED: "badge-primary",
    DELIVERED: "badge-success",
    CANCELLED: "badge-danger",
  };

  return (
    <AnimatedPage>
      <div className="profile-page container" id="profile-page">
        <h1 className="heading-lg">
          My <span className="text-gradient">Profile</span>
        </h1>
        <div className="profile-layout">
          {/* Info */}
          <div className="profile-card glass-card">
            <div className="profile-avatar">
              <User size={40} />
            </div>
            {editing ? (
              <form onSubmit={handleUpdate} className="profile-form">
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Name"
                />

                <div className="profile-form-actions">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3>{user.name}</h3>
                <p className="text-muted">{user.email}</p>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
              </>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              style={{ marginTop: 16, color: "var(--accent-rose)" }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          <div className="profile-main">
            {/* Loyalty Club Card */}
            {loyalty && (
              <Link to="/loyalty" style={{ textDecoration: "none", color: "inherit" }}>
                <div
                  className="profile-section glass-card"
                  style={{
                    background: "rgba(255, 215, 0, 0.03)",
                    border: "3px solid var(--bauhaus-black)",
                    boxShadow: "6px 6px 0px 0px var(--bauhaus-black)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: "linear-gradient(90deg, #FFD700, #FF6B35, #e63946)",
                    }}
                  />
                  <h3 className="heading-sm" style={{ marginBottom: 12 }}>
                    <Crown size={18} style={{ color: "#FFD700" }} /> Fan Loyalty Club
                    {loyalty.rewardUnlocked && !loyalty.rewardClaimed && (
                      <span className="badge badge-success" style={{ marginLeft: 8, fontSize: "0.65rem" }}>
                        <Gift size={10} style={{ marginRight: 3 }} />
                        Reward Ready!
                      </span>
                    )}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    {Array.from({ length: loyalty.requiredOrders }, (_, i) => (
                      <Fan
                        key={i}
                        size={20}
                        strokeWidth={i < loyalty.completedOrders ? 2.5 : 1}
                        style={{
                          color: i < loyalty.completedOrders ? "#FFD700" : "var(--text-muted)",
                          opacity: i < loyalty.completedOrders ? 1 : 0.3,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        letterSpacing: "1px",
                      }}
                    >
                      {loyalty.completedOrders}/{loyalty.requiredOrders} Stamps
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Orders */}
            <div className="profile-section glass-card">
              <h3 className="heading-sm">
                <Package size={18} /> Recent Orders
              </h3>
              {orders.length === 0 ? (
                <p className="text-muted">
                  No orders yet.{" "}
                  <Link to="/shop" style={{ color: "var(--bauhaus-blue)" }}>
                    Start shopping!
                  </Link>
                </p>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <Link
                      to={`/profile/orders/${order.id}`}
                      key={order.id}
                      className="order-item"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <span
                            className="order-number"
                            style={{
                              fontWeight: 800,
                              color: "var(--text-primary)",
                            }}
                          >
                            {order.orderNumber}
                          </span>
                          <span
                            className="order-date"
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div
                          className="order-meta"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "4px",
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>
                            ₹{order.totalAmount.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`badge ${statusColors[order.status] || "badge-primary"}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {order.status !== "CANCELLED" && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            position: "relative",
                            marginTop: "8px",
                            padding: "0 8px",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "16px",
                              right: "16px",
                              height: "2px",
                              background: "var(--border-color)",
                              zIndex: 0,
                            }}
                          />
                          {["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"].map(
                            (step, idx) => {
                              const statuses = [
                                "PENDING",
                                "CONFIRMED",
                                "SHIPPED",
                                "DELIVERED",
                              ];
                              const currentIdx =
                                statuses.indexOf(order.status) === -1
                                  ? 0
                                  : statuses.indexOf(order.status);
                              const isCompleted = idx <= currentIdx;
                              const isActive = idx === currentIdx;
                              return (
                                <div
                                  key={step}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    zIndex: 1,
                                    gap: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "50%",
                                      background: isCompleted
                                        ? "var(--bauhaus-blue)"
                                        : "var(--bg-elevated)",
                                      border: `3px solid ${isCompleted ? "var(--bauhaus-black)" : "var(--border-color)"}`,
                                      boxShadow: isActive
                                        ? "0 0 0 4px var(--bauhaus-yellow)"
                                        : "none",
                                      transition: "all 0.3s ease",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      color: isCompleted
                                        ? "var(--text-primary)"
                                        : "var(--text-muted)",
                                      fontWeight: isCompleted ? 800 : 400,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {step}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="profile-section glass-card">
              <h3 className="heading-sm">
                <MapPin size={18} /> Saved Addresses
              </h3>
              {addresses.length === 0 ? (
                <p className="text-muted">No saved addresses.</p>
              ) : (
                <div className="address-grid">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="address-card">
                      <strong>{addr.name}</strong> — {addr.phone}
                      <br />
                      {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                      {addr.isDefault && (
                        <span
                          className="badge badge-primary"
                          style={{ marginLeft: 8 }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
