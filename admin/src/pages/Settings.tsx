import {
  Upload,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Trash2,
  Truck,
  Save,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../lib/api";
import { StoreInfoCard } from "./StoreInfoCard";
import { CheckoutSettings } from "./CheckoutSettings";
import { compressImage } from "../lib/compress";

/** Quick-fill templates for popular Indian couriers ({trackingId} placeholder). */
const COURIER_EXAMPLES = [
  { label: "Delhivery", url: "https://www.delhivery.com/track?awb={trackingId}" },
  { label: "DTDC", url: "https://www.dtdc.in/track/consignment?strCnno={trackingId}" },
  { label: "Blue Dart", url: "https://www.bluedart.com/tracking?action=track&awb={trackingId}" },
  { label: "India Post", url: "https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?TokenNo={trackingId}" },
];

export default function AdminSettings() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successImage, setSuccessImage] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [uploadingHero, setUploadingHero] = useState(false);
  const [successHero, setSuccessHero] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [codEnabled, setCodEnabled] = useState(true);
  const [updatingCod, setUpdatingCod] = useState(false);

  const [trackingUrl, setTrackingUrl] = useState("");
  const [savingTrackingUrl, setSavingTrackingUrl] = useState(false);
  const [trackingUrlSaved, setTrackingUrlSaved] = useState(false);

  useEffect(() => {
    fetchCurrentImage();
    fetchCodStatus();
    fetchHeroImages();
    fetchTrackingUrl();
  }, []);

  const fetchCurrentImage = async () => {
    try {
      const res = await api.get("/settings/about-image");
      if (res.data?.url) setCurrentImage(res.data.url);
    } catch (err: any) {
      // No image configured yet
    }
  };

  const fetchHeroImages = async () => {
    try {
      const res = await api.get("/settings/hero-images");
      if (res.data?.urls) setHeroImages(res.data.urls);
    } catch (err: any) {
      // No images configured yet
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

  const fetchTrackingUrl = async () => {
    try {
      const res = await api.get("/settings/tracking-url");
      if (res.data && typeof res.data.url === "string") {
        setTrackingUrl(res.data.url);
      }
    } catch (err: any) {
      console.error("Failed to fetch tracking URL template");
    }
  };

  const handleSaveTrackingUrl = async () => {
    setSavingTrackingUrl(true);
    setTrackingUrlSaved(false);
    try {
      const res = await api.post("/settings/tracking-url", {
        url: trackingUrl,
      });
      if (res.data?.success) {
        setTrackingUrl(res.data.url);
        setTrackingUrlSaved(true);
        setTimeout(() => setTrackingUrlSaved(false), 3000);
        toast.success("Courier tracking URL updated");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to save tracking URL",
      );
    } finally {
      setSavingTrackingUrl(false);
    }
  };

  const trackingPreview =
    trackingUrl.includes("{trackingId}")
      ? trackingUrl.replace("{trackingId}", "SD123456789IN")
      : null;

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


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setSuccessImage(false);

    try {
      // Compress the image file to max 1000x1000px with 0.8 quality
      const compressedFile = await compressImage(file, { maxWidth: 1000, maxHeight: 1000 });
      
      const formData = new FormData();
      formData.append("image", compressedFile);

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

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (heroImages.length >= 5) {
      toast.error("Maximum 5 media items allowed for the Hero section.");
      if (heroInputRef.current) heroInputRef.current.value = "";
      return;
    }

    setUploadingHero(true);
    setSuccessHero(false);

    try {
      const formData = new FormData();
      const compressedFile = await compressImage(file, { maxWidth: 1920, maxHeight: 1080 });
      formData.append("image", compressedFile);

      const res = await api.post("/settings/hero-images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data.urls) {
        setSuccessHero(true);
        setHeroImages(res.data.urls);
        setTimeout(() => setSuccessHero(false), 3000);
      }
    } catch (err: any) {
      console.error("Hero image upload failed", err);
      toast.error("Hero image upload failed.");
    } finally {
      setUploadingHero(false);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  const handleDeleteHeroImage = async (url: string) => {
    if (!confirm("Are you sure you want to delete this hero image?")) return;
    try {
      const res = await api.delete("/settings/hero-images", { data: { url } });
      if (res.data?.success && res.data.urls) {
        setHeroImages(res.data.urls);
        toast.success("Hero image deleted successfully");
      }
    } catch (e) {
      toast.error("Failed to delete hero image");
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
        <StoreInfoCard />
        <CheckoutSettings
          codEnabled={codEnabled}
          updatingCod={updatingCod}
          handleToggleCod={handleToggleCod}
        />

        {/* Courier Tracking URL Card */}
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
              <Truck size={20} color="white" />
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
              Courier Tracking URL
            </h2>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: 20,
              fontSize: "0.85rem",
            }}
          >
            Template used for the "Track Package" link on order tracking pages.
            Include the <code style={{ fontFamily: "var(--font-mono)" }}>{"{trackingId}"}</code>{" "}
            placeholder — it is replaced with each order's tracking ID.
          </p>

          <label
            htmlFor="courier-tracking-url"
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 8,
            }}
          >
            Tracking URL Template
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <input
              id="courier-tracking-url"
              type="text"
              inputMode="url"
              spellCheck={false}
              autoComplete="off"
              className="input"
              placeholder="https://www.delhivery.com/track?awb={trackingId}"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveTrackingUrl}
              disabled={savingTrackingUrl}
              style={{ whiteSpace: "nowrap" }}
            >
              {savingTrackingUrl ? (
                <Loader2 size={14} className="spin" />
              ) : trackingUrlSaved ? (
                <CheckCircle2 size={14} />
              ) : (
                <Save size={14} />
              )}
              {savingTrackingUrl ? "Saving..." : trackingUrlSaved ? "Saved" : "Save"}
            </button>
          </div>

          {trackingPreview && (
            <p
              style={{
                marginTop: 12,
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                wordBreak: "break-all",
              }}
            >
              Preview:{" "}
              <a
                href={trackingPreview}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--bauhaus-blue)" }}
              >
                {trackingPreview}
              </a>
            </p>
          )}

          <div style={{ marginTop: 18 }}>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              Quick-fill templates
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COURIER_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setTrackingUrl(ex.url)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "6px 10px",
                    background: "var(--bg-primary)",
                    border: "2px solid var(--bauhaus-black)",
                    cursor: "pointer",
                    boxShadow: "1px 1px 0px 0px var(--bauhaus-black)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translate(-1px, -1px)";
                    e.currentTarget.style.boxShadow = "3px 3px 0px 0px var(--bauhaus-black)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translate(0, 0)";
                    e.currentTarget.style.boxShadow = "1px 1px 0px 0px var(--bauhaus-black)";
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
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
                        "http://localhost:3001";
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

        {/* Hero Images Upload Card */}
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
              Hero Images (Max 5)
            </h2>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: 24,
              fontSize: "0.85rem",
            }}
          >
            Upload images for the Hero carousel. Maximum 5 items.
          </p>

          <div style={uploadZoneStyle}>
            {uploadingHero ? (
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
            ) : successHero ? (
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
                  onClick={() => heroInputRef.current?.click()}
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
                  ref={heroInputRef}
                  onChange={handleHeroUpload}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>

          {heroImages.length > 0 && !uploadingHero && (
            <div style={{ marginTop: "20px" }}>
              <p
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "0.75rem",
                  color: "var(--bauhaus-blue)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Current Images:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {heroImages.map((imgUrl, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--bg-primary)",
                      padding: "8px",
                      border: "2px solid var(--bauhaus-black)",
                    }}
                  >
                    <img
                      src={
                        (() => {
                          let base =
                            import.meta.env.VITE_API_URL?.replace("/api", "") ||
                            "http://localhost:3001";
                          if (base.includes("localhost") && typeof window !== "undefined")
                            base = base.replace("localhost", window.location.hostname);
                          return base;
                        })() + imgUrl
                      }
                      alt={`Hero ${i}`}
                      style={{
                        height: "40px",
                        width: "80px",
                        objectFit: "cover",
                        border: "2px solid var(--bauhaus-black)",
                      }}
                    />
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteHeroImage(imgUrl)}
                      style={{
                        padding: "4px 8px",
                        minHeight: "unset",
                        fontSize: "0.7rem",
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
