import {
  Film,
  Upload,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../lib/api";

export default function AdminSettings() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentVideo, setCurrentVideo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [successImage, setSuccessImage] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [codEnabled, setCodEnabled] = useState(true);
  const [updatingCod, setUpdatingCod] = useState(false);

  useEffect(() => {
    fetchCurrentVideo();
    fetchCurrentImage();
    fetchCodStatus();
  }, []);

  const fetchCurrentVideo = async () => {
    try {
      const res = await api.get("/settings/video");
      if (res.data?.url) setCurrentVideo(res.data.url);
    } catch (err: any) {
      // No video configured yet
    }
  };

  const fetchCurrentImage = async () => {
    try {
      const res = await api.get("/settings/about-image");
      if (res.data?.url) setCurrentImage(res.data.url);
    } catch (err: any) {
      // No image configured yet
    }
  };

  const fetchCodStatus = async () => {
    try {
      const res = await api.get("/settings/cod");
      if (res.data && typeof res.data.enabled === 'boolean') {
        setCodEnabled(res.data.enabled);
      }
    } catch (err: any) {
      console.error("Failed to fetch COD status");
    }
  };

  const handleToggleCod = async () => {
    setUpdatingCod(true);
    try {
      const res = await api.post("/settings/cod", { enabled: !codEnabled });
      if (res.data?.success) {
        setCodEnabled(res.data.enabled);
        toast.success(`Cash on Delivery ${res.data.enabled ? 'Enabled' : 'Disabled'}`);
      }
    } catch (err: any) {
      toast.error("Failed to update COD status");
    } finally {
      setUpdatingCod(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("video", file);

      const res = await api.post("/settings/video/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setSuccess(true);
        setCurrentVideo(res.data.url);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Video upload failed", err);
      toast.error("Video upload failed. Is backend running?");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSuccessImage(false);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/settings/about-image/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setSuccessImage(true);
        setCurrentImage(res.data.url);
        setTimeout(() => setSuccessImage(false), 3000);
      }
    } catch (err: any) {
      console.error("Image upload failed", err);
      toast.error("Image upload failed.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirm("Are you sure you want to delete the footer video?")) return;
    try {
      await api.delete("/settings/video");
      setCurrentVideo("");
      toast.success("Video deleted successfully");
    } catch (e) {
      toast.error("Failed to delete video");
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm("Are you sure you want to delete the about image?")) return;
    try {
      await api.delete("/settings/about-image");
      setCurrentImage("");
      toast.success("Image deleted successfully");
    } catch (e) {
      toast.error("Failed to delete image");
    }
  };

  const uploadZoneStyle = {
    border: "3px dashed var(--bauhaus-black)",
    padding: "40px",
    textAlign: "center" as const,
    background: "var(--bg-primary)",
    position: "relative" as const,
    overflow: "hidden" as const,
  };

  return (
    <div id="admin-settings" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <SettingsIcon size={24} style={{ color: "var(--bauhaus-red)" }} />
          <h1 className="page-title">Settings</h1>
        </div>
        <div
          style={{
            display: "flex",
            gap: 0,
            marginTop: 12,
            height: 4,
            maxWidth: 200,
          }}
        >
          <div style={{ flex: 1, background: "var(--bauhaus-red)" }} />
          <div style={{ flex: 1, background: "var(--bauhaus-blue)" }} />
          <div style={{ flex: 1, background: "var(--bauhaus-yellow)" }} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Store Info Card */}
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

        {/* Checkout Settings Card */}
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
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
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

        {/* Video Upload Card */}
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
                background: "var(--bauhaus-blue)",
                border: "2px solid var(--bauhaus-black)",
                boxShadow: "2px 2px 0px 0px var(--bauhaus-black)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Film size={20} color="white" />
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
              Footer Video
            </h2>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: 24,
              fontSize: "0.85rem",
            }}
          >
            Upload an MP4 file to appear full-width above the website footer.
          </p>

          <div style={uploadZoneStyle}>
            {uploading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  color: "var(--text-secondary)",
                }}
              >
                <Loader2
                  size={40}
                  className="spin"
                  style={{ color: "var(--bauhaus-blue)" }}
                />
                <p
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Uploading Video...
                </p>
              </div>
            ) : success ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  color: "var(--accent-emerald)",
                }}
              >
                <CheckCircle2 size={40} />
                <p
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Video uploaded!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "var(--bauhaus-black)",
                    border: "3px solid var(--bauhaus-black)",
                    boxShadow: "3px 3px 0px 0px var(--bauhaus-yellow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} color="white" />
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 6px 0",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Select Video File
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Max size 50MB. MP4 format recommended.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="video/mp4,video/webm,video/quicktime"
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {currentVideo && !uploading && (
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--bauhaus-blue)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Current Video:
                </p>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleDeleteVideo}
                  style={{
                    padding: "4px 8px",
                    minHeight: "unset",
                    fontSize: "0.7rem",
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
              <div
                style={{
                  background: "var(--bg-primary)",
                  padding: "10px 14px",
                  border: "2px solid var(--bauhaus-black)",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  fontFamily: "monospace",
                }}
              >
                {(() => {
                  let base =
                    import.meta.env.VITE_API_URL?.replace("/api", "") ||
                    "https://fanclub-backend.onrender.com";
                  if (
                    base.includes("localhost") &&
                    typeof window !== "undefined"
                  )
                    base = base.replace("localhost", window.location.hostname);
                  return base;
                })()}
                {currentVideo}
              </div>
            </div>
          )}
        </div>

        {/* Image Upload Card */}
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
                background: "var(--bauhaus-yellow)",
                border: "2px solid var(--bauhaus-black)",
                boxShadow: "2px 2px 0px 0px var(--bauhaus-black)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ImageIcon size={20} color="var(--bauhaus-black)" />
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
              About Image
            </h2>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: 24,
              fontSize: "0.85rem",
            }}
          >
            Upload an image for the "Our Story" section on the About page.
          </p>

          <div style={uploadZoneStyle}>
            {uploadingImage ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  color: "var(--text-secondary)",
                }}
              >
                <Loader2
                  size={40}
                  className="spin"
                  style={{ color: "var(--bauhaus-blue)" }}
                />
                <p
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Uploading Image...
                </p>
              </div>
            ) : successImage ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  color: "var(--accent-emerald)",
                }}
              >
                <CheckCircle2 size={40} />
                <p
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Image uploaded!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "var(--bauhaus-black)",
                    border: "3px solid var(--bauhaus-black)",
                    boxShadow: "3px 3px 0px 0px var(--bauhaus-red)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Upload size={28} color="white" />
                </div>
                <div>
                  <h4
                    style={{
                      margin: "0 0 6px 0",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Select Image File
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    JPG, PNG, WebP supported.
                  </p>
                </div>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {currentImage && !uploadingImage && (
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--bauhaus-blue)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Current Image:
                </p>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleDeleteImage}
                  style={{
                    padding: "4px 8px",
                    minHeight: "unset",
                    fontSize: "0.7rem",
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
              <div
                style={{
                  background: "var(--bg-primary)",
                  padding: "12px",
                  border: "2px solid var(--bauhaus-black)",
                  textAlign: "center",
                }}
              >
                <img
                  src={
                    (() => {
                      let base =
                        import.meta.env.VITE_API_URL?.replace("/api", "") ||
                        "https://fanclub-backend.onrender.com";
                      if (
                        base.includes("localhost") &&
                        typeof window !== "undefined"
                      )
                        base = base.replace(
                          "localhost",
                          window.location.hostname,
                        );
                      return base;
                    })() + currentImage
                  }
                  alt="About Configured"
                  style={{
                    maxHeight: "150px",
                    objectFit: "contain",
                    margin: "0 auto",
                    border: "2px solid var(--bauhaus-black)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
