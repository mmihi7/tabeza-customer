'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent {
  readonly prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [show, setShow]             = useState(false);
  const [prompt, setPrompt]         = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (sessionStorage.getItem('customer-pwa-dismissed')) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as unknown as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    setInstalling(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (e) {
      console.error('[PWA] install error:', e);
    } finally {
      setShow(false);
      setInstalling(false);
    }
  }

  function handleDismiss() {
    setShow(false);
    sessionStorage.setItem('customer-pwa-dismissed', '1');
  }

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      right: '1rem',
      zIndex: 9999,
      maxWidth: 420,
      margin: '0 auto',
    }}>
      <div style={{
        background: 'var(--ink2)',
        border: '1px solid rgba(255,79,0,0.25)',
        borderRadius: 16,
        padding: '1rem 1.125rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
      }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'rgba(255,79,0,0.12)',
          border: '1px solid rgba(255,79,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Smartphone size={22} style={{ color: 'var(--amber)' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 700, fontSize: '0.875rem',
            color: 'var(--cream)', marginBottom: 2,
            fontFamily: "'Lato', sans-serif",
          }}>
            Add Tabeza to home screen
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Faster access, works offline
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          disabled={installing}
          style={{
            background: 'var(--amber)',
            color: 'var(--ink)',
            border: 'none',
            borderRadius: 8,
            padding: '0.5rem 0.875rem',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: installing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            flexShrink: 0,
            opacity: installing ? 0.7 : 1,
            fontFamily: "'Lato', sans-serif",
          }}
        >
          <Download size={14} />
          {installing ? 'Installing…' : 'Install'}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 4,
            color: 'var(--muted)',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
