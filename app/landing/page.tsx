'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Smartphone, QrCode, CreditCard, Shield, Star, ArrowRight, Menu, X, Clock, MapPin } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgba(10,10,12,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-white font-semibold text-lg">Tabeza</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm" style={{ color: 'var(--muted)' }}>How it works</a>
              <a href="#features" className="text-sm" style={{ color: 'var(--muted)' }}>Features</a>
              <a href="#loyalty" className="text-sm" style={{ color: 'var(--muted)' }}>Loyalty</a>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)' }}
              >
                Sign In
              </button>
            </div>
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} style={{ color: 'var(--cream)' }} /> : <Menu size={24} style={{ color: 'var(--cream)' }} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-4" style={{ backgroundColor: 'rgba(10,10,12,0.98)' }}>
            <div className="flex flex-col gap-4">
              <a href="#how-it-works" className="text-sm py-2" style={{ color: 'var(--muted)' }}>How it works</a>
              <a href="#features" className="text-sm py-2" style={{ color: 'var(--muted)' }}>Features</a>
              <a href="#loyalty" className="text-sm py-2" style={{ color: 'var(--muted)' }}>Loyalty</a>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-center"
                style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)' }}
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--cream)', lineHeight: 1.1 }}>
                Your Tab.
                <span style={{ color: 'var(--amber)' }}> Your Phone.</span>
              </h1>
              <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                Open tabs, order drinks, and pay securely — all from your phone. No more waiting for the bill, no more disputes. Just seamless hospitality at your favorite venues.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => router.push('/signup')}
                  className="px-5 py-4 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 text-base sm:text-sm"
                  style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)', minHeight: '48px' }}
                >
                  Get Started <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-4 sm:px-6 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 text-base sm:text-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.16)', minHeight: '48px' }}
                >
                  Sign In
                </button>
              </div>
              <p className="text-sm mt-4" style={{ color: 'var(--muted-2)' }}>
                Available at 200+ venues across Kenya
              </p>
            </div>
            <div className="order-last lg:order-first">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: 'var(--amber)', opacity: 0.1, filter: 'blur(40px)' }} />
                <div className="relative rounded-2xl p-4 sm:p-6 lg:p-8" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--amber)' }}>
                        <QrCode size={28} style={{ color: 'var(--ink)' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--cream)' }}>Scan QR Code</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Open your tab instantly</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--amber)' }}>
                        <Smartphone size={28} style={{ color: 'var(--ink)' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--cream)' }}>Order from Phone</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Browse menu & order drinks</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--amber)' }}>
                        <CreditCard size={28} style={{ color: 'var(--ink)' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: 'var(--cream)' }}>Pay Securely</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>M-Pesa & card payments</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--cream)' }}>
              How Tabeza works for you
            </h2>
            <p className="text-base sm:text-lg" style={{ color: 'var(--muted)' }}>
              Open a tab in 3 simple steps
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <StepCard
              step="1"
              icon={<QrCode size={32} style={{ color: 'var(--amber)' }} />}
              title="Scan QR Code"
              description="Find the Tabeza QR code at your venue. Scan it with your phone camera to open a tab instantly."
            />
            <StepCard
              step="2"
              icon={<Smartphone size={32} style={{ color: 'var(--amber)' }} />}
              title="Browse & Order"
              description="View the full menu on your phone. Add items to your tab and send orders to staff with one tap."
            />
            <StepCard
              step="3"
              icon={<CreditCard size={32} style={{ color: 'var(--amber)' }} />}
              title="Pay & Go"
              description="View your live balance and pay securely via M-Pesa or card. No waiting for the bill."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--cream)' }}>
              Features you'll love
            </h2>
            <p className="text-base sm:text-lg" style={{ color: 'var(--muted)' }}>
              Designed for the modern guest experience
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={<Clock size={32} style={{ color: 'var(--amber)' }} />}
              title="Real-time Balance"
              description="See your live tab balance as you order. No surprises when it's time to pay."
            />
            <FeatureCard
              icon={<Shield size={32} style={{ color: 'var(--amber)' }} />}
              title="Secure Payments"
              description="Pay via M-Pesa or card directly in the app. Your payment info stays secure."
            />
            <FeatureCard
              icon={<MapPin size={32} style={{ color: 'var(--amber)' }} />}
              title="Find Venues"
              description="Discover new venues near you that accept Tabeza. Save your favorites for quick access."
            />
            <FeatureCard
              icon={<Smartphone size={32} style={{ color: 'var(--amber)' }} />}
              title="Message Staff"
              description="Need something? Send a message to staff directly from your tab. They'll respond instantly."
            />
            <FeatureCard
              icon={<CheckCircle size={32} style={{ color: 'var(--amber)' }} />}
              title="Order Tracking"
              description="Track your orders in real-time. Know exactly when your drinks are ready."
            />
            <FeatureCard
              icon={<Star size={32} style={{ color: 'var(--amber)' }} />}
              title="Loyalty Rewards"
              description="Earn badges and unlock exclusive perks as a regular at your favorite venues."
            />
          </div>
        </div>
      </section>

      {/* Loyalty Section */}
      <section id="loyalty" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--cream)' }}>
              Earn loyalty at every visit
            </h2>
            <p className="text-base sm:text-lg" style={{ color: 'var(--muted)' }}>
              The more you visit, the more you're rewarded
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <LoyaltyCard
              tier="Bronze"
              color="#cd7f32"
              description="Spend KSh 1,000+ in one sitting"
              perks={['Welcome recognition', 'Basic perks', 'Venue tracking']}
            />
            <LoyaltyCard
              tier="Silver"
              color="#c0c0c0"
              description="Spend KSh 3,000+ in one sitting"
              perks={['All Bronze perks', 'Enhanced discounts', 'Priority service']}
            />
            <LoyaltyCard
              tier="Gold"
              color="#ffd700"
              description="Spend KSh 5,000+ in one sitting"
              perks={['All Silver perks', 'Maximum discounts', 'VIP treatment']}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'rgba(255,79,0,0.1)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--cream)' }}>
            Ready to transform your night out?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8" style={{ color: 'var(--muted)' }}>
            Join thousands of Kenyans who've already switched to Tabeza. Open your first tab today.
          </p>
          <button
            onClick={() => router.push('/signup')}
            className="px-6 sm:px-8 py-4 rounded-lg font-medium text-base sm:text-lg w-full sm:w-auto"
            style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)' }}
          >
            Create Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo size="sm" />
                <span className="font-semibold" style={{ color: 'var(--cream)' }}>Tabeza</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                The digital tab experience for modern hospitality.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--cream)' }}>Product</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#loyalty" className="hover:text-white transition-colors">Loyalty</a></li>
                <li><a href="https://tabeza.co.ke" className="hover:text-white transition-colors">For Venues</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--cream)' }}>Company</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--cream)' }}>Contact</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
                <li><a href="mailto:hello@tabeza.co.ke" className="hover:text-white transition-colors">hello@tabeza.co.ke</a></li>
                <li>Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-sm" style={{ color: 'var(--muted-2)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            © 2024 Tabeza. All rights reserved. Built with ❤️ in Kenya.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 sm:p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--cream)' }}>{title}</h3>
      <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
    </div>
  );
}

function StepCard({ step, icon, title, description }: { step: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
        style={{ backgroundColor: 'var(--amber)', color: 'var(--ink)' }}
      >
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'var(--cream)' }}>{title}</h3>
      <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>{description}</p>
    </div>
  );
}

function LoyaltyCard({ tier, color, description, perks }: { tier: string; color: string; description: string; perks: string[] }) {
  return (
    <div className="p-4 sm:p-6 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-2xl sm:text-3xl font-bold"
        style={{ backgroundColor: color, color: 'var(--ink)' }}
      >
        {tier[0]}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--cream)' }}>{tier}</h3>
      <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: 'var(--muted)' }}>{description}</p>
      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-left" style={{ color: 'var(--muted-2)' }}>
        {perks.map((perk, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle size={14} style={{ color }} />
            {perk}
          </li>
        ))}
      </ul>
    </div>
  );
}
