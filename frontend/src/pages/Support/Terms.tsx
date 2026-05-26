import AnimatedPage from '../../components/AnimatedPage';
import SEOHead from '../../components/SEOHead';

export default function Terms() {
  return (
    <AnimatedPage>
      <SEOHead
        title="Terms of Service — TFICLUB"
        description="TFICLUB Terms of Service: user conduct, intellectual property, payment terms, liability, and dispute resolution for tficlub.com."
        keywords="terms of service, terms and conditions, TFICLUB legal"
      />
      <div style={{ paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="section-header">
            <p className="section-subtitle" style={{ color: 'var(--bauhaus-black)' }}>Legal</p>
            <h1 className="section-title">Terms &amp; Conditions</h1>
            <div className="section-divider" />
          </div>

          <div style={{ 
            marginTop: '40px', 
            background: 'var(--bg-card)', 
            padding: '40px',
            border: '2px solid var(--bauhaus-black)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
              <strong>Last updated:</strong> May 26, 2026
            </p>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>1. Agreement to Terms</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                By accessing or using the TFICLUB website, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you do not have permission to access the service. These terms apply to all visitors, users, and others who wish to access or use the platform.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>2. Products and Availability</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                All products and services are subject to availability. We reserve the right to discontinue any product at any time for any reason. Prices for all products are subject to change. We make every effort to display as accurately as possible the colors and images of our products, but we cannot guarantee that your device's display of any color will be completely accurate.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>3. User Conduct</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '12px' }}>
                By using TFICLUB, you agree not to:
              </p>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>Use the site for any unlawful purpose or to solicit others to perform unlawful acts.</li>
                <li>Attempt to gain unauthorized access to any part of the service, other accounts, or computer systems.</li>
                <li>Engage in any automated use of the system (bots, scrapers) without prior written consent.</li>
                <li>Upload or transmit viruses, malware, or any other harmful code.</li>
                <li>Impersonate another person or misrepresent your affiliation with any person or entity.</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>4. Payment and Billing</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                You agree to provide current, complete, and accurate purchase and account information for all purchases made via the site. We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the email and/or billing address provided at the time the order was made.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>5. Intellectual Property</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of TFICLUB and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of TFICLUB.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>6. Limitation of Liability</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                In no event shall TFICLUB, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Service.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>7. Governing Law</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>8. Contact Information</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                If you have any questions about these Terms, please contact us at <strong>legal@tficlub.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
