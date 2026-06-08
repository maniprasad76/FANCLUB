import { Settings as SettingsIcon, Loader2 } from "lucide-react";

interface CheckoutSettingsProps {
  codEnabled: boolean;
  updatingCod: boolean;
  handleToggleCod: () => void;
}

export function CheckoutSettings({
  codEnabled,
  updatingCod,
  handleToggleCod,
}: CheckoutSettingsProps) {
  return (
    <div className="glass" style={{ padding: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: "var(--bauhaus-red)",
            border: "2px solid var(--bauhaus-black)",
            boxShadow: "2px 2px 0px 0px var(--bauhaus-black)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SettingsIcon size={20} color="white" />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "1.1rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Checkout Options
        </h2>
      </div>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: 24,
          fontSize: "0.85rem",
        }}
      >
        Manage payment methods available during checkout.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          border: "2px solid var(--bauhaus-black)",
          background: "var(--bg-primary)",
        }}
      >
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontWeight: 700 }}>
            Cash on Delivery (COD)
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            Allow customers to pay upon receiving their order.
          </p>
        </div>
        <button
          onClick={handleToggleCod}
          disabled={updatingCod}
          style={{
            padding: "8px 16px",
            border: "2px solid var(--bauhaus-black)",
            background: codEnabled ? "var(--bauhaus-blue)" : "var(--bg-secondary)",
            color: codEnabled ? "white" : "var(--text-primary)",
            fontWeight: 700,
            cursor: updatingCod ? "not-allowed" : "pointer",
            boxShadow: codEnabled
              ? "2px 2px 0px 0px var(--bauhaus-black)"
              : "inset 2px 2px 0px 0px var(--bauhaus-black)",
            opacity: updatingCod ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {updatingCod && <Loader2 size={14} className="spin" />}
          {codEnabled ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
