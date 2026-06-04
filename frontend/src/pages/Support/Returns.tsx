import AnimatedPage from '../../components/AnimatedPage';

export default function Returns() {
  return (
    <AnimatedPage>
      <div style={{ paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="section-header">
            <p className="section-subtitle" style={{ color: 'var(--bauhaus-red)' }}>Support</p>
            <h1 className="section-title">Returns & Exchanges</h1>
            <div className="section-divider" />
          </div>

          <div style={{ 
            marginTop: '40px', 
            background: 'var(--bg-card)', 
            padding: '40px',
            border: '2px solid var(--bauhaus-black)',
            boxShadow: '6px 6px 0px 0px var(--bauhaus-black)'
          }}>
            <h2 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--bauhaus-black)' }}>7-Day Return Policy</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '30px' }}>
              At FANCLUB, we take pride in the quality of our clothing. If you are not entirely satisfied with your purchase, we offer a hassle-free return and exchange policy within <strong>7 days</strong> of the delivery date.
            </p>

            <h3 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.1rem' }}>Eligibility Conditions</h3>
            <ul style={{ listStyleType: 'square', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '30px' }}>
              <li>Items must be unused, unwashed, and in their original condition.</li>
              <li>All original tags and packaging must remain fully intact.</li>
              <li>Any items bought during flash sales or clearance events are non-refundable unless defective.</li>
            </ul>

            <h3 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.1rem' }}>Damaged or Defective Items</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '30px' }}>
              We double-check every product before shipping. However, if you receive a damaged or incorrect item, please contact us at <strong>support@fanclub.com</strong> within 48 hours of delivery along with photograph proof. We will replace the item at no extra cost.
            </p>

            <div style={{ borderTop: '2px dashed var(--border-subtle)', paddingTop: '30px', marginTop: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-accent)', textTransform: 'uppercase', marginBottom: '16px', fontSize: '1.1rem', color: 'var(--bauhaus-blue)' }}>How to initiate a return?</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                Please email us at <strong>returns@fanclub.com</strong> with your Order ID. Our logistics partner will pick up the item from your delivery address within 2-3 business days. Refunds are processed back to the original payment source within 5-7 working days after the warehouse inspection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
