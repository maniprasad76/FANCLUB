import AnimatedPage from '../../components/AnimatedPage';
import SEOHead, { buildFAQSchema } from '../../components/SEOHead';

export default function FAQ() {
  const faqs = [
    {
      q: 'How long does shipping take?',
      a: 'We process all orders within 24-48 hours. Standard delivery across India takes 3-7 business days depending on your location.'
    },
    {
      q: 'Do you offer Cash on Delivery (COD)?',
      a: 'Currently, we support secure prepaid orders via Razorpay (UPI, Credit/Debit Cards, NetBanking). COD is coming soon!'
    },
    {
      q: 'How do I care for my FANCLUB apparel?',
      a: 'To preserve the premium prints and fabric, wash inside out in cold water. Do not iron directly on the print, and avoid tumble drying.'
    },
    {
      q: 'How can I track my order?',
      a: 'Once your order is shipped, you will receive a tracking link via email and SMS. You can also view live tracking from your FANCLUB Profile dashboard.'
    },
    {
      q: 'Do you ship internationally?',
      a: 'At the moment, FANCLUB exclusively ships within India. We plan to expand globally in the near future!'
    }
  ];

  return (
    <AnimatedPage>
      {/* AEO: FAQPage schema — critical for voice search and answer boxes */}
      <SEOHead
        title="FAQ — FANCLUB | Frequently Asked Questions"
        description="Find answers to common questions about FANCLUB: shipping, returns, payment methods, order tracking, and more."
        keywords="FANCLUB FAQ, shipping India, COD, order tracking, returns policy, garment care"
        jsonLd={buildFAQSchema(faqs.map(f => ({ question: f.q, answer: f.a })))}
      />
      <div style={{ paddingTop: 'calc(var(--nav-height) + 20px)', paddingBottom: '80px', minHeight: '100vh' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="section-header" style={{ marginBottom: '0' }}>
            <p className="section-subtitle" style={{ color: 'var(--bauhaus-blue)' }}>Support</p>
            <h1 className="section-title">Frequently Asked Questions</h1>
            <div className="section-divider" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ 
                padding: '30px', 
                background: 'var(--bg-card)', 
                border: '2px solid var(--bauhaus-black)',
                boxShadow: '4px 4px 0px 0px var(--bauhaus-black)'
              }}>
                <h3 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.2rem', marginBottom: '12px', textTransform: 'uppercase' }}>
                  {faq.q}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '60px', textAlign: 'center', padding: '40px', background: 'var(--bauhaus-yellow)', border: '4px solid var(--bauhaus-black)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', marginBottom: '16px' }}>Still need help?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Our support team is ready to assist you.</p>
            <a href="/contact" className="btn btn-primary" style={{ background: 'var(--bauhaus-black)', color: 'var(--bauhaus-white)' }}>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
