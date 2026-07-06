import { useState, useEffect, useCallback } from "react";
import {
  Crown,
  Trophy,
  Users,
  Gift,
  Search,
  RotateCcw,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  AlertCircle,
} from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

interface LoyaltyProgressItem {
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
  status: "IN_PROGRESS" | "REWARD_READY" | "CLAIMED";
  updatedAt: string;
  user: { id: string; name: string | null; email: string; avatar: string | null };
  rewards: any[];
}

interface Analytics {
  totalUsers: number;
  totalRewardsClaimed: number;
  rewardReadyCount: number;
  nearCompletion: number;
  avgProgress: number;
  recentRewards: {
    id: string;
    userName: string | null;
    userEmail: string;
    productName: string;
    cycle: number;
    claimedAt: string;
    couponCode: string | null;
  }[];
}

export default function LoyaltyAdmin() {
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [progress, setProgress] = useState<LoyaltyProgressItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<LoyaltyProgressItem | null>(null);
  const [editStamps, setEditStamps] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get("/loyalty/admin/analytics");
      setAnalytics(res.data);
    } catch {
      toast.error("Failed to load loyalty analytics");
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api.get("/loyalty/admin/progress", { params });
      setProgress(res.data.progress);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error("Failed to load loyalty progress");
    }
  }, [page, search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnalytics(), fetchProgress()]).finally(() =>
      setLoading(false)
    );
  }, [fetchAnalytics, fetchProgress]);

  const handleResetCycle = async (userId: string, userName: string | null) => {
    if (!confirm(`Reset loyalty cycle for ${userName || userId}? This cannot be undone.`)) return;
    try {
      await api.post(`/loyalty/admin/reset/${userId}`);
      toast.success("Loyalty cycle reset successfully");
      fetchProgress();
      fetchAnalytics();
    } catch {
      toast.error("Failed to reset loyalty cycle");
    }
  };

  const handleUpdateStamps = async () => {
    if (!editModal) return;
    try {
      await api.put(`/loyalty/admin/progress/${editModal.userId}`, {
        completedOrders: editStamps,
      });
      toast.success("Stamps updated successfully");
      setEditModal(null);
      fetchProgress();
      fetchAnalytics();
    } catch {
      toast.error("Failed to update stamps");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "REWARD_READY":
        return <span className="badge badge-success">Reward Ready</span>;
      case "CLAIMED":
        return <span className="badge badge-primary">Claimed</span>;
      default:
        return <span className="badge badge-warning">In Progress</span>;
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: 4 }}>
            <Crown size={28} style={{ verticalAlign: "middle", marginRight: 10, color: "#FFD700" }} />
            Loyalty <span className="text-gradient">Club</span>
          </h1>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>
            Manage loyalty rewards, view progress, and analytics
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`btn ${tab === "overview" ? "btn-primary" : "btn-outline"} btn-sm`}
            onClick={() => setTab("overview")}
          >
            <TrendingUp size={14} /> Overview
          </button>
          <button
            className={`btn ${tab === "users" ? "btn-primary" : "btn-outline"} btn-sm`}
            onClick={() => setTab("users")}
          >
            <Users size={14} /> Users
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : tab === "overview" ? (
        /* ── Overview Tab ── */
        <>
          {/* Analytics Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              { label: "Total Users", value: analytics?.totalUsers || 0, icon: Users, color: "var(--bauhaus-blue)" },
              { label: "Rewards Claimed", value: analytics?.totalRewardsClaimed || 0, icon: Trophy, color: "#FFD700" },
              { label: "Reward Ready", value: analytics?.rewardReadyCount || 0, icon: Gift, color: "#22c55e" },
              { label: "Near Completion", value: analytics?.nearCompletion || 0, icon: TrendingUp, color: "#FF6B35" },
              { label: "Avg Progress", value: `${analytics?.avgProgress || 0}%`, icon: Crown, color: "var(--bauhaus-red)" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="glass-card"
                style={{
                  padding: 20,
                  border: "3px solid var(--bauhaus-black)",
                  boxShadow: "4px 4px 0px 0px var(--bauhaus-black)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Icon size={18} style={{ color }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    color,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Rewards */}
          <h3 className="heading-sm" style={{ marginBottom: 16 }}>
            <Gift size={18} style={{ marginRight: 8 }} /> Recent Rewards
          </h3>
          {analytics?.recentRewards && analytics.recentRewards.length > 0 ? (
            <div
              style={{
                border: "3px solid var(--bauhaus-black)",
                boxShadow: "4px 4px 0px 0px var(--bauhaus-black)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "3px solid var(--bauhaus-black)", background: "rgba(255,255,255,0.02)" }}>
                    {["User", "Product", "Cycle", "Coupon", "Date"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "1.5px",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentRewards.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{r.userName || "—"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.userEmail}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: "0.85rem" }}>{r.productName}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>#{r.cycle}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <code style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "2px 6px" }}>
                          {r.couponCode || "—"}
                        </code>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {new Date(r.claimedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No rewards claimed yet.</p>
          )}
        </>
      ) : (
        /* ── Users Tab ── */
        <>
          {/* Search */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="input-field"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <span className="text-muted" style={{ alignSelf: "center", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
              {total} users
            </span>
          </div>

          {/* Progress Table */}
          <div
            style={{
              border: "3px solid var(--bauhaus-black)",
              boxShadow: "4px 4px 0px 0px var(--bauhaus-black)",
              overflow: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: "3px solid var(--bauhaus-black)", background: "rgba(255,255,255,0.02)" }}>
                  {["User", "Progress", "Cycle", "Lifetime", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "1.5px",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progress.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{p.user?.name || "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 0, border: "1px solid var(--border-color)", minWidth: 80 }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${p.progressPercentage}%`,
                              background: "linear-gradient(90deg, #FFD700, #FF6B35)",
                            }}
                          />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {p.completedOrders}/{p.requiredOrders}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>#{p.currentCycle}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#FFD700" }}>
                      {p.lifetimeRewards}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{statusBadge(p.status)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditModal(p);
                            setEditStamps(p.completedOrders);
                          }}
                          title="Edit stamps"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleResetCycle(p.userId, p.user?.name)}
                          title="Reset cycle"
                          style={{ color: "var(--bauhaus-red)" }}
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {progress.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                      No loyalty progress found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", alignSelf: "center" }}>
                {page} / {pages}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Edit Stamps Modal ── */}
      {editModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setEditModal(null)}
        >
          <div
            style={{
              background: "var(--bg-primary, #0a0a0a)",
              border: "3px solid var(--bauhaus-black)",
              boxShadow: "8px 8px 0px 0px var(--bauhaus-black)",
              padding: 32,
              maxWidth: 400,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="heading-sm" style={{ marginBottom: 16 }}>
              <Edit2 size={16} style={{ marginRight: 8 }} />
              Adjust Stamps
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
              {editModal.user?.name || editModal.email} — Cycle #{editModal.currentCycle}
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Completed Stamps (0–{editModal.requiredOrders})</label>
              <input
                type="number"
                className="input-field"
                min={0}
                max={editModal.requiredOrders}
                value={editStamps}
                onChange={(e) => setEditStamps(Math.min(editModal.requiredOrders, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "10px 12px", background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)" }}>
              <AlertCircle size={14} style={{ color: "#FFD700", flexShrink: 0 }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Setting to {editModal.requiredOrders} will unlock the reward for this user.
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleUpdateStamps} style={{ flex: 1 }}>
                Save Changes
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
