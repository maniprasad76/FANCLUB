import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedPage from "../../components/AnimatedPage";
import SEOHead from "../../components/SEOHead";
import "./LaunchChecklist.css";

/* ── Data ─────────────────────────────────────────────────────── */
interface CheckItem {
  id: string;
  label: string;
  hint: string;
  optional?: boolean;
}

interface CheckSection {
  id: string;
  name: string;
  tag: string;
  icon: string;
  color: string;
  stripe: "stripe-red" | "stripe-blue" | "stripe-yellow" | "stripe-black" | "stripe-mixed";
  items: CheckItem[];
}

const SECTIONS: CheckSection[] = [
  {
    id: "app-store",
    name: "App Store",
    tag: "Submission",
    icon: "📱",
    color: "var(--bauhaus-red)",
    stripe: "stripe-red",
    items: [
      {
        id: "as-title",
        label: "App title with keywords",
        hint: "Include primary keyword in the title for App Store search ranking.",
      },
      {
        id: "as-subtitle",
        label: "Subtitle (don't leave empty)",
        hint: "30 chars. Second-most indexed field — use benefit-focused keywords.",
      },
      {
        id: "as-description",
        label: "App description (hook in first 2 lines)",
        hint: 'First 2 lines visible before "More" tap. Lead with value, not features.',
      },
      {
        id: "as-keywords",
        label: "Keywords researched and added",
        hint: "100 chars max. No repeats from title/subtitle. Use competitor gap keywords.",
      },
      {
        id: "as-screenshots",
        label: "Screenshots (show benefits, not features)",
        hint: "First screenshot = highest conversion impact. Show the outcome, not the UI.",
      },
      {
        id: "as-preview",
        label: "App preview video",
        hint: "Optional but boosts conversion 20–35%. Auto-plays muted on product page.",
        optional: true,
      },
      {
        id: "as-privacy",
        label: "Privacy policy URL",
        hint: "Required for all apps. Must be publicly accessible and accurate.",
      },
      {
        id: "as-support",
        label: "Support URL",
        hint: "Where users go for help. A real page, not just your homepage.",
      },
      {
        id: "as-category",
        label: "App category selected",
        hint: "Primary + secondary category. Strategic choice affects discoverability.",
      },
      {
        id: "as-age",
        label: "Age rating completed",
        hint: "Answer questionnaire honestly. Wrong rating = rejection or removal.",
      },
    ],
  },
  {
    id: "website",
    name: "Website",
    tag: "Web Presence",
    icon: "🌐",
    color: "var(--bauhaus-blue)",
    stripe: "stripe-blue",
    items: [
      {
        id: "web-landing",
        label: "Landing page live",
        hint: "At minimum: hero, benefits, screenshots, download button, privacy link.",
      },
      {
        id: "web-og",
        label: "Open Graph tags set",
        hint: "og:title, og:description, og:image (1200×630), og:url — for social shares.",
      },
      {
        id: "web-favicon",
        label: "Favicon added",
        hint: "ico + 192px + 512px PNG. Don't forget apple-touch-icon.",
      },
      {
        id: "web-responsive",
        label: "Mobile responsive",
        hint: "Test on real devices. Most traffic will be on mobile for an app landing page.",
      },
      {
        id: "web-ssl",
        label: "SSL certificate active (https)",
        hint: "Required for trust, SEO, and App Store privacy policy URL.",
      },
      {
        id: "web-cta",
        label: "Download / CTA button working",
        hint: "Deep-link to App Store. Track clicks with UTM params.",
      },
    ],
  },
  {
    id: "seo",
    name: "SEO",
    tag: "Discoverability",
    icon: "🔍",
    color: "var(--bauhaus-yellow)",
    stripe: "stripe-yellow",
    items: [
      {
        id: "seo-gsc",
        label: "Google Search Console connected",
        hint: "Verify ownership, submit sitemap. Free indexing insights.",
      },
      {
        id: "seo-bing",
        label: "Bing Webmaster Tools connected",
        hint: "Bing powers DuckDuckGo. 15% of desktop search. Don't skip it.",
      },
      {
        id: "seo-sitemap",
        label: "Sitemap submitted",
        hint: "sitemap.xml at root. Submit URL in both GSC and Bing.",
      },
      {
        id: "seo-indexnow",
        label: "IndexNow configured",
        hint: "Instantly pings Bing/Yandex on new content. One API key, huge time savings.",
      },
      {
        id: "seo-meta",
        label: "Meta title and description set",
        hint: "Title: 50-60 chars with keyword. Description: 150-160 chars with CTA.",
      },
      {
        id: "seo-robots",
        label: "robots.txt file in place",
        hint: "Minimum: allow all + sitemap URL. Block /admin and private routes.",
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    tag: "Go-To-Market",
    icon: "🚀",
    color: "var(--bauhaus-black)",
    stripe: "stripe-black",
    items: [
      {
        id: "mkt-post",
        label: "Launch post drafted",
        hint: "Write the post before launch day. Multiple versions for different platforms.",
      },
      {
        id: "mkt-assets",
        label: "Social media assets ready",
        hint: "Images sized per platform (OG 1200×630, Twitter 1200×675, Square 1080×1080).",
      },
      {
        id: "mkt-email",
        label: "Email list notified",
        hint: "Send early — people check email before social. Include direct download link.",
      },
      {
        id: "mkt-ph",
        label: "Product Hunt listing prepped",
        hint: "Optional. Schedule for 12:01 AM PST Tuesday–Thursday for best results.",
        optional: true,
      },
      {
        id: "mkt-community",
        label: "Friends / community ready to support",
        hint: "Line up upvotes, reviews, and shares before launch. First 24h momentum matters.",
      },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    tag: "Compliance",
    icon: "⚖️",
    color: "var(--bauhaus-red)",
    stripe: "stripe-mixed",
    items: [
      {
        id: "leg-privacy",
        label: "Privacy policy written and linked",
        hint: "Required by App Store, Play Store, and GDPR. Use a generator or lawyer.",
      },
      {
        id: "leg-terms",
        label: "Terms of service written and linked",
        hint: "Covers liability, user conduct, IP ownership. Don't launch without it.",
      },
      {
        id: "leg-data",
        label: "Data handling documented",
        hint: "Apple requires Data Nutrition Label. Be accurate — it's audited.",
      },
      {
        id: "leg-gdpr",
        label: "GDPR compliance (if applicable)",
        hint: "EU users require lawful basis for processing, right to deletion, DPA if needed.",
      },
      {
        id: "leg-cookie",
        label: "Cookie notice (if website tracks)",
        hint: "Required if using analytics/ads. Simple banner with accept/reject.",
      },
    ],
  },
];

const STORAGE_KEY = "fan-launch-checklist-v1";

/* ── Helpers ──────────────────────────────────────────────────── */
function loadChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveChecked(data: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getRingOffset(done: number, total: number): number {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const progress = total === 0 ? 0 : done / total;
  return circ * (1 - progress);
}

/* ── Item Component ──────────────────────────────────────────── */
interface ItemProps {
  item: CheckItem;
  checked: boolean;
  onToggle: (id: string) => void;
  index: number;
}

function ChecklistItem({ item, checked, onToggle, index }: ItemProps) {
  return (
    <motion.div
      className={`checklist-item${checked ? " is-checked" : ""}`}
      onClick={() => onToggle(item.id)}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      id={`item-${item.id}`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(item.id);
        }
      }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <div className="check-box" aria-hidden="true">
        <span className="check-mark">✓</span>
      </div>
      <div className="item-text-group">
        <div className="item-label">{item.label}</div>
        <div className="item-hint">{item.hint}</div>
      </div>
      {item.optional && <span className="item-optional">Optional</span>}
    </motion.div>
  );
}

/* ── Section Component ───────────────────────────────────────── */
interface SectionProps {
  section: CheckSection;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}

function ChecklistSection({ section, checked, onToggle }: SectionProps) {
  const total = section.items.length;
  const done = section.items.filter((i) => checked[i.id]).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const isComplete = done === total;

  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = getRingOffset(done, total);

  return (
    <motion.div
      className={`checklist-section${isComplete ? " is-complete" : ""}`}
      id={`section-${section.id}`}
      layout
    >
      {/* Accent stripe */}
      <div className={`section-stripe ${section.stripe}`} />

      {/* Completion overlay border */}
      <div className="section-complete-overlay" aria-hidden="true" />

      {/* Section Header */}
      <div className="section-head">
        <span className="section-icon" aria-hidden="true">
          {section.icon}
        </span>
        <div className="section-title-group">
          <div className="section-tag">{section.tag}</div>
          <div className="section-name">{section.name}</div>
        </div>
        <div className="section-progress-pill">
          <svg
            className="section-progress-ring"
            viewBox="0 0 40 40"
            aria-label={`${done} of ${total} complete`}
          >
            <circle className="ring-bg" cx="20" cy="20" r={r} />
            <circle
              className={`ring-fill${isComplete ? " ring-complete" : ""}`}
              cx="20"
              cy="20"
              r={r}
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
        </div>
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="section-complete-badge"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
            >
              ✓ Done
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Items */}
      <div className="section-items" role="group" aria-label={`${section.name} checklist`}>
        {section.items.map((item, idx) => (
          <ChecklistItem
            key={item.id}
            item={item}
            checked={!!checked[item.id]}
            onToggle={onToggle}
            index={idx}
          />
        ))}
      </div>

      {/* Section Footer Progress Bar */}
      <div className="section-footer">
        <div className="section-bar-label">
          <span className="section-bar-text">
            {done}/{total} completed
          </span>
          <span className="section-bar-pct">{pct}%</span>
        </div>
        <div className="section-bar-wrap">
          <div
            className={`section-bar-fill${isComplete ? " bar-complete" : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page Component ─────────────────────────────────────── */
export default function LaunchChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  const allItems = SECTIONS.flatMap((s) => s.items);
  const totalCount = allItems.length;
  const doneCount = allItems.filter((i) => checked[i.id]).length;
  const allDone = doneCount === totalCount;
  const overallPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  const handleToggle = useCallback((id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleReset = () => {
    setChecked({});
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      const offset = 96; // nav height + buffer
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <AnimatedPage>
      <SEOHead
        title="App Launch Checklist — FANCLUB Pre-Launch Guide"
        description="The definitive app launch checklist: App Store optimization, website readiness, SEO setup, marketing prep, and legal compliance. Don't ship without it."
        keywords="app launch checklist, app store optimization, pre-launch checklist, app marketing, ASO checklist"
        noIndex={true}
      />

      <div className="checklist-page">
        <div className="container">

          {/* ── Hero ── */}
          <div className="checklist-hero">
            <div className="checklist-hero-inner">
              <div>
                <div className="checklist-eyebrow">FAN Club · Pre-Launch</div>
                <h1 className="checklist-title">
                  App Launch<br />
                  <span>Checklist</span>
                </h1>
                <p className="checklist-subtitle">
                  Everything you need before you hit "Submit." Tick each item
                  off as you go — progress is saved automatically in your
                  browser.
                </p>
              </div>

              {/* Overall progress card */}
              <div
                className="overall-progress-card"
                role="status"
                aria-label={`${doneCount} of ${totalCount} items complete`}
              >
                <div className="overall-progress-label">Overall Progress</div>
                <div className="overall-progress-count">
                  {doneCount}
                  <span>/{totalCount}</span>
                </div>
                <div className="overall-progress-total">
                  items complete · {overallPct}%
                </div>
                <div className="overall-progress-bar-wrap">
                  <div
                    className={`overall-progress-bar${allDone ? " bar-all-done" : ""}`}
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick-jump nav */}
            <nav className="section-jump-nav" aria-label="Jump to section">
              {SECTIONS.map((s) => {
                const done = s.items.filter((i) => checked[i.id]).length;
                const total = s.items.length;
                const complete = done === total;
                return (
                  <button
                    key={s.id}
                    className={`jump-btn${complete ? " jump-btn--done" : ""}`}
                    onClick={() => scrollToSection(s.id)}
                    aria-label={`Jump to ${s.name} section`}
                  >
                    <span className="jump-icon">{s.icon}</span>
                    <span className="jump-label">{s.name}</span>
                    <span className="jump-count">{done}/{total}</span>
                    {complete && <span className="jump-check">✓</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── Celebration Banner ── */}
          <AnimatePresence>
            {allDone && (
              <motion.div
                className="celebration-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                role="alert"
              >
                <div className="celebration-icon">🎉</div>
                <div className="celebration-text">
                  <h2>You're Ready to Launch!</h2>
                  <p>
                    All {totalCount} items checked. Submit to the App Store and
                    ship it. The world is waiting.
                  </p>
                </div>
                <a
                  href="https://appstoreconnect.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="celebration-cta"
                  id="btn-go-to-app-store-connect"
                >
                  Open App Store Connect →
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Actions ── */}
          <div className="checklist-actions">
            <span className="checklist-actions-label">
              {allDone
                ? "🚀 All done — ready to ship!"
                : doneCount > 0
                ? `${totalCount - doneCount} items remaining`
                : "Click any item to start"}
            </span>
            {doneCount > 0 && (
              <button
                className="btn-reset"
                onClick={handleReset}
                id="btn-reset-checklist"
                aria-label="Reset all checklist items"
              >
                ↺ Reset All
              </button>
            )}
          </div>

          {/* ── Checklist Grid ── */}
          <div className="checklist-grid">
            {SECTIONS.map((section) => (
              <ChecklistSection
                key={section.id}
                section={section}
                checked={checked}
                onToggle={handleToggle}
              />
            ))}
          </div>

          {/* ── Footer callout ── */}
          <div className="checklist-footer-callout">
            <span className="callout-arrow">→</span>
            <span className="callout-text">
              Save this. Use it. Don't launch without it.
            </span>
          </div>

        </div>
      </div>
    </AnimatedPage>
  );
}
