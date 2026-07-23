'use client';

/**
 * Home page — pure redirect gate.
 * - Unauthenticated → /login
 * - Authenticated → /start (StepHome: recent venues, scan, enter code)
 *
 * All the old landing page logic has been superseded by the new
 * dark-themed onboarding flow in /start.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/start');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Minimal loading state while auth resolves
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderTop: '3px solid var(--amber)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
