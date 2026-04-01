'use client';

// apps/customer/app/privacy/page.tsx (create this file)
export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink)', padding: '24px' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 600, color: 'var(--cream)', marginBottom: 24 }}>Privacy Policy</h1>
        
        <div>
          <p style={{ color: 'var(--muted)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>Last updated: December 2024</p>
          
          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>1. Information We Collect</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            <strong>We do NOT collect:</strong>
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: 24, color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            <li>Names</li>
            <li>Phone numbers</li>
            <li>Email addresses</li>
            <li>Payment information (handled by establishments)</li>
          </ul>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            <strong>We only store:</strong>
          </p>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Device Information</h4>
            <ul style={{ listStyle: 'disc', paddingLeft: 24, color: 'var(--muted)', fontFamily: 'Lato, sans-serif' }}>
              <li>Unique device identifier (for security)</li>
              <li>Browser fingerprint (for fraud prevention)</li>
              <li>IP address (for location verification)</li>
              <li>Session data (for tab management)</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 8, fontFamily: 'Lato, sans-serif' }}>Tab Information</h4>
            <ul style={{ listStyle: 'disc', paddingLeft: 24, color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
              <li>Anonymous tab identifiers (Tab 1, Tab 2, or your chosen nickname)</li>
              <li>Order details (for the duration of your visit)</li>
              <li>Session data (temporary, deleted after visit)</li>
            </ul>
          </div>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>2. Device Identification & Security</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            <strong>For Security and Fraud Prevention:</strong>
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: 24, color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            <li>Unique device identifier (prevents multiple tabs for same order)</li>
            <li>Browser fingerprint (detects suspicious activity)</li>
            <li>IP address (verifies location consistency)</li>
            <li>Session management (ensures proper tab tracking)</li>
          </ul>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            This helps us ensure fair usage and is deleted when your tab is closed (either through payment or staff action).
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>3. How We Use Information</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            Order information is shared only with the establishment you're ordering from. It is not sold, shared, or used for marketing.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>4. Data Retention</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            Your tab data is deleted after your visit ends. We do not maintain long-term records of your orders.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>5. Notifications</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            If you enable notifications, we use browser-based alerts only. No external services are involved.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>6. Your Rights</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            Since we don't collect personal data, there's nothing to request, delete, or export. You're anonymous by design.
          </p>

          <h2 style={{ fontFamily: 'Lato, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--cream)', marginTop: 24, marginBottom: 12 }}>7. Contact</h2>
          <p style={{ color: 'var(--cream2)', marginBottom: 16, fontFamily: 'Lato, sans-serif' }}>
            For privacy questions: privacy@Tabeza
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

