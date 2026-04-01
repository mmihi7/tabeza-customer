'use client';

// apps/customer/app/terms/page.tsx
export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)', padding: '24px' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 600, color: 'var(--cream)', marginBottom: 24 }}>Terms of Use</h1>
        
        <div>
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>Last updated: December 2024</p>
          
          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>1. Service Description</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            Tabeza provides a digital ordering platform for bars and restaurants. By using our service, you agree to these terms.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>2. Anonymous Usage</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            We do not collect personal information. Your tab is temporary and exists only for your current visit.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>3. Payment</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            All orders must be paid through the establishment's accepted payment methods. Tabeza is not responsible for payment processing.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>4. User Conduct</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            You agree to use the service responsibly and not to place fraudulent orders or misuse the platform.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>5. Limitation of Liability</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            Tabeza is not liable for food quality, service issues, or disputes between customers and establishments.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>6. Service Availability</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            Service availability depends on the establishment's operating hours and technical conditions.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>7. Contact</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            For questions about these terms: support@Tabeza
          </p>
        </div>

        <button
          onClick={() => window.close()}
          style={{
            marginTop: 32,
            width: '100%',
            background: 'var(--amber)',
            color: 'var(--ink)',
            padding: '12px 24px',
            borderRadius: 8,
            fontFamily: 'Lato, sans-serif',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
