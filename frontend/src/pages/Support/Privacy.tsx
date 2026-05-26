import AnimatedPage from '../../components/AnimatedPage';
import SEOHead from '../../components/SEOHead';

export default function Privacy() {
  return (
    <AnimatedPage>
      <SEOHead
        title="Privacy Policy — TFICLUB"
        description="TFICLUB Privacy Policy: how we collect, use, store, and protect your personal data. Covers GDPR rights, data handling, cookies, and third-party sharing."
        keywords="privacy policy, data protection, GDPR, TFICLUB privacy"
      />
      <div style={{ paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="section-header">
            <p className="section-subtitle" style={{ color: 'var(--bauhaus-black)' }}>Legal</p>
            <h1 className="section-title">Privacy Policy</h1>
            <div className="section-divider" />
          </div>

          <div style={{ 
            marginTop: '40px', 
            background: 'var(--bg-card)', 
            padding: '40px',
            border: '2px solid var(--bauhaus-black)'
          }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
              <strong>Last updated:</strong> May 26, 2026
            </p>

            {/* Section 1 — Information We Collect */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>1. Information We Collect</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                At TFICLUB, your privacy is our priority. We collect personal information that you voluntarily provide to us when registering on the website, expressing an interest in obtaining information about our products, or when purchasing items. This includes your name, shipping address, email address, and phone number. Payment information is processed securely by our payment gateway providers (Razorpay) and is never stored on our servers.
              </p>
            </section>

            {/* Section 2 — How We Use Your Information */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>2. How We Use Your Information</h2>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>To fulfill and manage your orders, payments, and returns.</li>
                <li>To send administrative information regarding the platform or shipping updates.</li>
                <li>To deliver targeted advertising or promotional offers (only if you subscribe to our newsletter).</li>
                <li>To administer our loyalty accounts and user profiles.</li>
              </ul>
            </section>

            {/* Section 3 — Data Handling & Storage */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>3. Data Handling & Storage</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '12px' }}>
                Your personal data is stored securely on cloud infrastructure provided by Supabase (hosted on AWS). We implement industry-standard security measures including:
              </p>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><strong>Encryption at rest:</strong> All database records are encrypted using AES-256.</li>
                <li><strong>Encryption in transit:</strong> All data transmitted between your browser and our servers is encrypted via TLS 1.3 (HTTPS).</li>
                <li><strong>Access controls:</strong> Row-Level Security (RLS) policies ensure users can only access their own data.</li>
                <li><strong>Payment data:</strong> We never store credit card numbers, CVVs, or full payment credentials. All payment processing is handled by PCI DSS-compliant third-party processors (Razorpay).</li>
                <li><strong>Data retention:</strong> Account data is retained while your account is active. Order history is retained for 7 years for tax and legal compliance. You may request deletion at any time.</li>
              </ul>
            </section>

            {/* Section 4 — Information Sharing */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>4. Information Sharing</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                We do not sell or rent your personal information to third parties. We only share information with third-party service providers (like shipping logistics or payment processors) strictly to execute the services you requested. These providers are bound by strict confidentiality agreements.
              </p>
            </section>

            {/* Section 5 — Cookies & Tracking */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>5. Cookies & Tracking</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '12px' }}>
                We use cookies and similar technologies to enhance your browsing experience:
              </p>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><strong>Essential cookies:</strong> Required for authentication, cart functionality, and site security. These cannot be disabled.</li>
                <li><strong>Analytics cookies:</strong> Used to understand how visitors interact with our website (page views, session duration). We use privacy-respecting analytics.</li>
                <li><strong>Preference cookies:</strong> Remember your language, region, and display preferences.</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '12px' }}>
                You can manage cookie preferences through your browser settings. Disabling essential cookies may affect site functionality.
              </p>
            </section>

            {/* Section 6 — GDPR Rights (EU Users) */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>6. Your Rights (GDPR & Data Protection)</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '12px' }}>
                If you are located in the European Economic Area (EEA), United Kingdom, or any jurisdiction with similar data protection laws, you have the following rights:
              </p>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><strong>Right of access:</strong> Request a copy of all personal data we hold about you.</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Right to erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
                <li><strong>Right to restrict processing:</strong> Request that we limit how we use your data.</li>
                <li><strong>Right to data portability:</strong> Receive your data in a structured, machine-readable format.</li>
                <li><strong>Right to object:</strong> Object to processing based on legitimate interests or direct marketing.</li>
                <li><strong>Right to withdraw consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '12px' }}>
                <strong>Lawful basis for processing:</strong> We process your data under the following lawful bases: (a) contractual necessity (order fulfillment), (b) legitimate interests (fraud prevention, site security), and (c) consent (marketing communications).
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '12px' }}>
                To exercise any of these rights, contact us at <strong>privacy@tficlub.com</strong>. We will respond within 30 days.
              </p>
            </section>

            {/* Section 7 — Children's Privacy */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>7. Children's Privacy</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Our services are not directed to individuals under 13 years of age. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 13, we will delete it promptly.
              </p>
            </section>

            {/* Section 8 — Contact */}
            <section>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>8. Contact Us</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                If you have questions or comments about this Privacy Policy, you may email us at <strong>privacy@tficlub.com</strong> or contact us via our support lines. For GDPR-related inquiries, you may also contact our Data Protection Officer at <strong>dpo@tficlub.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
