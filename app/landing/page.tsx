'use client';

import React, { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';
import { ArrowRight, QrCode, Smartphone } from 'lucide-react';
import Logo from '@/components/Logo';

// ── Desktop gate — shown on screens wider than 768px ─────────────────────────
function DesktopGate() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Lato', sans-serif",
    }}>
      <div style={{ display: 'flex', gap: '6rem', alignItems: 'center', maxWidth: 900, width: '100%' }}>

        {/* Left — branding */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '2rem' }}>
            <Logo size="lg" />
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '3.5rem',
            fontWeight: 600,
            color: 'var(--cream)',
            lineHeight: 1.1,
            marginBottom: '1.25rem',
          }}>
            Your tab.<br />
            <span style={{ color: 'var(--amber)' }}>On your phone.</span>
          </h1>
          <p style={{
            fontSize: '1.0625rem',
            color: 'var(--muted)',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: 380,
          }}>
            Tabeza is a mobile experience — open tabs, order drinks, and pay securely from your phone at any Tabeza venue.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { n: '1', text: 'Scan the QR code with your phone' },
              { n: '2', text: 'Open your tab at the venue' },
              { n: '3', text: 'Order and pay from your seat' },
            ].map(({ n, text }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--amber)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem',
                  color: 'var(--ink)',
                  flexShrink: 0,
                }}>
                  {n}
                </div>
                <span style={{ fontSize: '0.9375rem', color: 'var(--cream2)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone mockup + QR */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {/* Phone frame */}
          <div style={{
            width: 240,
            height: 420,
            borderRadius: 36,
            border: '8px solid rgba(255,255,255,0.15)',
            background: 'var(--ink2)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
            {/* Notch */}
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              width: 80, height: 20, borderRadius: 10,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 2,
            }} />
            {/* Screen content */}
            <div style={{
              padding: '48px 16px 20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--amber)' }}>TABEZA</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--muted)', fontFamily: 'monospace' }}>Tab #42</span>
              </div>
              {/* Venue name */}
              <div style={{
                background: 'rgba(255,79,0,0.1)',
                border: '1px solid rgba(255,79,0,0.2)',
                borderRadius: 10, padding: '0.625rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cream)' }}>The Alchemist</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>Westlands, Nairobi</div>
              </div>
              {/* Order items */}
              {[
                { name: 'Tusker Lager', price: '450' },
                { name: 'Mojito', price: '800' },
                { name: 'Nachos', price: '650' },
              ].map(item => (
                <div key={item.name} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.5rem 0.625rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--cream2)' }}>{item.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--amber)', fontWeight: 700 }}>KSh {item.price}</span>
                </div>
              ))}
              {/* Balance */}
              <div style={{
                marginTop: 'auto',
                background: 'var(--amber)',
                borderRadius: 10,
                padding: '0.625rem',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>BALANCE</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)' }}>KSh 1,900</div>
              </div>
            </div>
          </div>

          {/* QR code box */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '1.25rem',
            textAlign: 'center',
            width: '100%',
          }}>
            <div style={{
              width: 96, height: 96,
              background: '#fff',
              borderRadius: 10,
              margin: '0 auto 0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <QrCode size={64} style={{ color: '#000' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>
              Point your phone camera here<br />to open Tabeza
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--amber)', marginTop: '0.375rem', fontWeight: 600 }}>
              app.tabeza.co.ke
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile landing page ───────────────────────────────────────────────────────
function MobileLanding() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Lato', sans-serif",
      overflowX: 'hidden',
    }}>

      {/* Hero */}
      <div style={{ padding: '3rem 1.5rem 2rem', flex: 1 }}>
        <div style={{ marginBottom: '2rem' }}>
          <Logo size="lg" />
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2.625rem',
          fontWeight: 600,
          color: 'var(--cream)',
          lineHeight: 1.1,
          marginBottom: '1rem',
        }}>
          Your tab.<br />
          <span style={{ color: 'var(--amber)' }}>Your phone.</span>
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--muted)',
          lineHeight: 1.6,
          marginBottom: '2.5rem',
        }}>
          Open tabs, order drinks, and pay securely — all from your phone at any Tabeza venue.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '3rem' }}>
          <button
            onClick={() => router.push('/signup')}
            style={{
              width: '100%', padding: '1rem',
              background: 'var(--amber)', color: 'var(--ink)',
              border: 'none', borderRadius: 12,
              fontSize: '1rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Get started <ArrowRight size={18} />
          </button>
          <button
            onClick={() => router.push('/login')}
            style={{
              width: '100%', padding: '1rem',
              background: 'transparent', color: 'var(--cream)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
              fontSize: '1rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{
            fontSize: '0.6875rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--amber)', marginBottom: '1.25rem',
          }}>
            How it works
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: <QrCode size={20} />, title: 'Scan at the venue', desc: 'Find the Tabeza QR code at your table or bar' },
              { icon: <Smartphone size={20} />, title: 'Order from your seat', desc: 'Browse the menu and add items directly from your phone' },
              { icon: '💳', title: 'Pay when ready', desc: 'Settle with M-Pesa or card — no waiting for the bill' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(255,79,0,0.12)',
                  border: '1px solid rgba(255,79,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--amber)', fontSize: '1.125rem',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cream)', marginBottom: '0.2rem' }}>{item.title}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty teaser */}
        <div style={{
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(255,79,0,0.12) 0%, rgba(255,79,0,0.04) 100%)',
          border: '1px solid rgba(255,79,0,0.2)',
          borderRadius: 16,
          marginBottom: '2rem',
        }}>
          <p style={{
            fontSize: '0.6875rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--amber)', marginBottom: '0.625rem',
          }}>
            Loyalty rewards
          </p>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--cream)', marginBottom: '0.375rem' }}>
            Earn badges at every visit
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            Bronze → Silver → Gold. The more you visit, the more you unlock — discounts, priority service, and VIP perks.
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={{ padding: '2rem 1.5rem 0' }}>
        <p style={{
          fontSize: '0.6875rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--amber)', marginBottom: '1rem',
        }}>
          FAQ
        </p>
        <h2 style={{
          fontSize: '1.5rem', fontWeight: 700,
          color: 'var(--cream)', marginBottom: '1.5rem',
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          Your questions, answered
        </h2>
        <FaqAccordion items={CUSTOMER_FAQS} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '1.5rem', marginBottom: '2rem' }}>
          Still have questions?{' '}
          <a href="mailto:support@tabeza.co.ke" style={{ color: 'var(--amber)', fontWeight: 600 }}>
            support@tabeza.co.ke
          </a>
        </p>
      </div>

      {/* Footer */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>© 2025 Tabeza</p>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <a href="/terms" style={{ fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy" style={{ fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'none' }}>Privacy</a>
        </div>
      </div>
    </div>
  );
}

// ── Customer FAQ data ─────────────────────────────────────────────────────────

const CUSTOMER_FAQS = [
  {
    q: 'What is Tabeza?',
    a: 'Tabeza lets you open a tab at a bar or club using your phone. Scan a QR code at your table or bar, order what you want, and pay when you\'re ready via M-Pesa or card. No waiting for a waiter, no card to hand over, no surprise bill at the end.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. You can use Tabeza completely without an account — just scan and go.',
  },
  {
    q: 'What is the difference between tracked and untracked?',
    a: 'When you first use Tabeza you choose how you want to interact. Untracked means your session is completely private — nothing from your visit is saved after you close your tab. Tracked means your visits and spend build a loyalty profile. Your tier grows with every visit and unlocks real perks at venues you return to. You can switch to untracked at any time.',
  },
  {
    q: 'Does the venue know who I am?',
    a: 'No. The venue sees Tab 01, Tab 02 — a number, not a person. Whether you choose tracked or untracked, your name and personal details are never shared with the venue.',
  },
  {
    q: 'What does tracked actually track?',
    a: 'Only your spend and visit history within Tabeza — which venues you\'ve visited, what tier you\'ve earned, and your order history for loyalty calculations. This is never sold to third parties or shared with venues.',
  },
  {
    q: 'How do I pay?',
    a: 'M-Pesa or card, directly from your phone. Your running balance is visible throughout so you always know where you stand.',
  },
  {
    q: 'What is the loyalty system?',
    a: 'If you choose tracked, you earn towards Bronze, Silver, and Gold tiers based on your spend per visit. Higher tiers unlock discounts, priority service, and recognition at your regular venues. Untracked users enjoy the same ordering and payment experience without the rewards.',
  },
  {
    q: 'Is Tabeza free for customers?',
    a: 'Yes. Completely free.',
  },
  {
    q: 'What if I have an issue with my order or tab?',
    a: 'Message your waiter directly from the tab screen. For anything else, contact support@tabeza.co.ke.',
  },
];

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            border: `1px solid ${open === i ? 'rgba(255,79,0,0.25)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '0.75rem',
            backgroundColor: open === i ? 'rgba(255,79,0,0.05)' : 'rgba(255,255,255,0.03)',
            overflow: 'hidden',
            transition: 'border-color 0.15s, background-color 0.15s',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.875rem 1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cream)', lineHeight: 1.4 }}>
              {item.q}
            </span>
            <span style={{
              flexShrink: 0,
              width: 20, height: 20,
              borderRadius: '50%',
              border: '1.5px solid var(--amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--amber)',
              fontSize: '1rem',
              lineHeight: 1,
              transition: 'transform 0.2s',
              transform: open === i ? 'rotate(45deg)' : 'none',
            }}>
              +
            </span>
          </button>
          {open === i && (
            <div style={{ padding: '0 1rem 0.875rem' }}>
              <p style={{ fontSize: '0.8375rem', color: 'var(--muted)', lineHeight: 1.65 }}>
                {item.a}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Root export — detects screen width and shows correct version ──────────────
export default function LandingPage() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Avoid flash — wait for client to determine screen size
  if (isDesktop === null) {
    return <div style={{ minHeight: '100dvh', background: 'var(--ink)' }} />;
  }

  return isDesktop ? <DesktopGate /> : <MobileLanding />;
}
