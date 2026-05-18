import AnimatedPage from '../../components/AnimatedPage';

export default function Privacy() {
  return (
    <AnimatedPage>
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
              <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>1. Information We Collect</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                At TFICLUB, your privacy is our priority. We collect personal information that you voluntarily provide to us when registering on the website, expressing an interest in obtaining information about our products, or when purchasing items. This includes your name, shipping address, email address, and phone number. Payment information is processed securely by our payment gateway providers (Razorpay) and is never stored on our servers.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>2. How We Use Your Information</h2>
              <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li>To fulfill and manage your orders, payments, and returns.</li>
                <li>To send administrative information regarding the platform or shipping updates.</li>
                <li>To deliver targeted advertising or promotional offers (only if you subscribe to our newsletter).</li>
                <li>To administer our loyalty accounts and user profiles.</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>3. Information Sharing</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                We do not sell or rent your personal information to third parties. We only share information with third-party service providers (like shipping logistics or payment processors) strictly to execute the services you requested. These providers are bound by strict confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.2rem', color: 'var(--bauhaus-black)' }}>4. Contact Us</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                If you have questions or comments about this Privacy Policy, you may email us at <strong>privacy@tficlub.com</strong> or contact us via our support lines.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
