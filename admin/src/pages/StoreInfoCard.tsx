import { Settings as SettingsIcon } from "lucide-react";

export function StoreInfoCard() {
  return (
    <div className="glass" style={{ padding: 32, textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          background: "var(--bauhaus-red)",
          border: "3px solid var(--bauhaus-black)",
          boxShadow: "4px 4px 0px 0px var(--bauhaus-black)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <SettingsIcon size={32} color="white" />
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "1.3rem",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        FAN Admin Panel
      </h2>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: 24,
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        Store Configuration
      </p>

      <div
        style={{
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[
          {
            label: "Store Name",
            value: "FAN",
            color: "var(--bauhaus-red)",
          },
          {
            label: "Currency",
            value: "₹ INR",
            color: "var(--bauhaus-blue)",
          },
          {
            label: "Payment",
            value: "Razorpay",
            color: "var(--bauhaus-yellow)",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              border: "2px solid var(--bauhaus-black)",
              background: "var(--bg-primary)",
            }}
          >
            <div
              style={{
                width: 4,
                height: 24,
                background: color,
                flexShrink: 0,
              }}
            />
            <div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "var(--text-muted)",
                }}
              >
                {label}
              </span>
              <p style={{ fontSize: "0.9rem", fontWeight: 700 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
