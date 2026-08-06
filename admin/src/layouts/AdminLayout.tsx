import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  CreditCard,
  Users,
  Star,
  Newspaper,
  Mail,
  Settings,
  LogOut,
  ShieldAlert,
  Ticket,
  Crown,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import "./AdminLayout.css";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/products", icon: Package, label: "Products" },
  { path: "/categories", icon: FolderOpen, label: "Categories" },
  { path: "/orders", icon: ShoppingCart, label: "Orders" },
  { path: "/payments", icon: CreditCard, label: "Payments" },
  { path: "/customers", icon: Users, label: "Customers" },
  { path: "/reviews", icon: Star, label: "Reviews" },
  { path: "/newsletter", icon: Newspaper, label: "Newsletter" },
  { path: "/contacts", icon: Mail, label: "Messages" },
  { path: "/coupons", icon: Ticket, label: "Coupons" },
  { path: "/loyalty", icon: Crown, label: "Loyalty Club" },
  { path: "/audit-logs", icon: ShieldAlert, label: "Security Logs" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="admin-layout">
      {/* Mobile Header */}
      <div className="mobile-admin-header">
        <div className="sidebar-brand">
          <span className="brand-badge">FAN</span>
          <span className="sidebar-brand-text">
            <span className="text-gradient">Admin</span>
          </span>
        </div>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isSidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={toggleSidebar} />
      )}

      <aside className={`admin-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand hide-on-mobile">
          <span className="brand-badge">FAN</span>
          <span className="sidebar-brand-text">
            <span className="text-gradient">Admin</span>
          </span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{admin?.name?.[0] || "A"}</div>
            <div className="sidebar-user-info">
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: "0.2px",
                }}
              >
                {admin?.name || "Admin"}
              </p>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Store Manager
              </p>
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{ marginTop: "4px", color: "var(--bauhaus-red)" }}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
