import { useState } from "react";
import { Send, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedPage from "../../components/AnimatedPage";
import SEOHead from "../../components/SEOHead";
import api from "../../lib/api";
import { SOCIAL_LINKS } from "../../config";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/contact", form);
    setSent(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <AnimatedPage>
      <SEOHead
        title="Contact Us — FANCLUB | Get in Touch"
        description="Have questions about FANCLUB? Contact us via email, phone, or the contact form. We're here to help with orders, returns, and more."
        keywords="FANCLUB contact, customer support, help, email, phone, Srikakulam"
      />
      <div
        className="container"
        style={{
          paddingTop: "calc(var(--nav-height) + 40px)",
          minHeight: "100vh",
          maxWidth: 1100,
          margin: "0 auto",
          paddingBottom: "80px",
        }}
        id="contact-page"
      >
        <div className="section-header" style={{ marginBottom: "60px" }}>
          <p
            className="section-subtitle"
            style={{ color: "var(--bauhaus-red)" }}
          >
            Get in Touch
          </p>
          <h1 className="section-title">Contact Us</h1>
          <div
            className="section-divider"
            style={{ background: "var(--bauhaus-black)" }}
          />
        </div>

        <div className="contact-grid">
          {/* Left Column: Contact Info */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}
          >
            {/* Mail */}
            <div
              style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--bauhaus-blue)",
                  border: "2px solid var(--bauhaus-black)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                <Mail size={24} />
              </div>
              <div style={{ paddingTop: "4px" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    margin: "0 0 4px 0",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                  }}
                >
                  Email
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  hello@fanclub.com
                </p>
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div
              style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--bauhaus-red)",
                  border: "2px solid var(--bauhaus-black)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                <Phone size={24} />
              </div>
              <div style={{ paddingTop: "4px" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    margin: "0 0 4px 0",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                  }}
                >
                  Phone & WhatsApp
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  +91 7569428709
                </p>
              </div>
            </div>

            {/* Location */}
            <div
              style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--bauhaus-yellow)",
                  border: "2px solid var(--bauhaus-black)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#121212",
                  flexShrink: 0,
                }}
              >
                <MapPin size={24} />
              </div>
              <div style={{ paddingTop: "4px" }}>
                <h3
                  style={{
                    fontSize: "1.2rem",
                    margin: "0 0 4px 0",
                    fontFamily: "var(--font-display)",
                    textTransform: "uppercase",
                  }}
                >
                  Location
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  Srikakulam,
                  <br />
                  Andhra Pradesh, India
                </p>
              </div>
            </div>

            {/* Social Media Links */}
            <div style={{ marginTop: "20px" }}>
              <h3
                style={{
                  fontSize: "1.2rem",
                  margin: "0 0 16px 0",
                  fontFamily: "var(--font-display)",
                  textTransform: "uppercase",
                }}
              >
                Social Networks
              </h3>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bauhaus-black)",
                    color: "var(--bauhaus-white)",
                    border: "2px solid var(--bauhaus-black)",
                    transition: "background 0.2s",
                    cursor: "pointer",
                  }}
                  aria-label="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    width="22"
                    height="22"
                    fill="currentColor"
                  >
                    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bauhaus-black)",
                    color: "var(--bauhaus-white)",
                    border: "2px solid var(--bauhaus-black)",
                    transition: "background 0.2s",
                    cursor: "pointer",
                  }}
                  aria-label="WhatsApp"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    width="22"
                    height="22"
                    fill="currentColor"
                  >
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-23.1-115.1-65.1-157zM223.9 413.3c-33.1 0-65.5-8.9-94-25.7l-6.7-4-69.9 18.3L72 334.8l-4.4-7c-18.4-29.3-28.1-63.5-28.1-98.8 0-101.4 82.6-184 184.2-184 49.1 0 95.3 19.1 130 53.8 34.7 34.7 53.8 81 53.8 130 0 101.5-82.6 184.1-183.6 184.1v-.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18.1-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18.1-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.9-16.5-54.4-28-76.8-67-2.3-4.1-.2-6.3 1.2-7.7 1.2-1.2 2.8-3.2 4.1-4.8 1.4-1.6 1.9-2.8 2.8-4.7 1.1-2.1.5-3.9-.4-5.3-1.1-1.6-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.3-.2-7.1-.2-10.8-.2-3.7 0-9.8 1.4-14.9 6.9-5.1 5.6-19.5 19-19.5 46.3s20 53.6 22.8 57.3c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.6-2.5-5.3-3.9-10.8-6.7z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bauhaus-black)",
                    color: "var(--bauhaus-white)",
                    border: "2px solid var(--bauhaus-black)",
                    transition: "background 0.2s",
                    cursor: "pointer",
                  }}
                  aria-label="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 320 512"
                    width="22"
                    height="22"
                    fill="currentColor"
                  >
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bauhaus-black)",
                    color: "var(--bauhaus-white)",
                    border: "2px solid var(--bauhaus-black)",
                    transition: "background 0.2s",
                    cursor: "pointer",
                  }}
                  aria-label="YouTube"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                    width="22"
                    height="22"
                    fill="currentColor"
                  >
                    <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--bauhaus-black)",
                    color: "var(--bauhaus-white)",
                    border: "2px solid var(--bauhaus-black)",
                    transition: "background 0.2s",
                    cursor: "pointer",
                  }}
                  aria-label="Twitter"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    width="22"
                    height="22"
                    fill="currentColor"
                  >
                    <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.792 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.792-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "4px solid var(--bauhaus-black)",
              padding: "40px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                width: 20,
                height: 20,
                background: "var(--bauhaus-red)",
                border: "2px solid var(--bauhaus-black)",
              }}
            />
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "60px 20px" }}
              >
                <Send
                  size={56}
                  style={{
                    color: "var(--bauhaus-blue)",
                    marginBottom: 24,
                    margin: "0 auto",
                  }}
                />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2rem",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  Message Sent!
                </h3>
                <p
                  style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}
                >
                  Our team will reach out to you shortly.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.8rem",
                    margin: "0 0 10px 0",
                    textTransform: "uppercase",
                    color: "var(--text-primary)",
                  }}
                >
                  Send us a message
                </h2>
                <input
                  className="input-field"
                  style={{ padding: "16px 20px", fontSize: "1rem" }}
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  id="contact-name"
                />
                <input
                  className="input-field"
                  style={{ padding: "16px 20px", fontSize: "1rem" }}
                  type="email"
                  placeholder="Your Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  id="contact-email"
                />
                <input
                  className="input-field"
                  style={{ padding: "16px 20px", fontSize: "1rem" }}
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  required
                  id="contact-subject"
                />
                <textarea
                  className="input-field"
                  style={{
                    padding: "16px 20px",
                    fontSize: "1rem",
                    resize: "vertical",
                  }}
                  placeholder="Your Message"
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  required
                  id="contact-message"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  id="contact-submit"
                >
                  <Send size={20} /> SEND MESSAGE
                </button>
              </form>
            )}
          </div>
        </div>

        {/* BOTTOM FULL-WIDTH GOOGLE MAP */}
        <div
          style={{
            marginTop: "80px",
            border: "4px solid var(--bauhaus-black)",
            borderRadius: "0",
            overflow: "hidden",
            height: "450px",
            background: "var(--bg-secondary)",
          }}
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121731.33230635391!2d83.82422003882772!3d18.300063229864227!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3c14ebac686bf5%3A0x6bba305a415aefc8!2sSrikakulam%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1704257850028!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Srikakulam Location"
          ></iframe>
        </div>
      </div>
    </AnimatedPage>
  );
}
