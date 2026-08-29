'use client';

import React, { useEffect, useState } from 'react';
import { X, Link2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-identity';
import { useToast } from '@/components/ui/Toast';

interface OtherAccount {
  userId: string;
  displayName: string | null;
}

/**
 * IdentityLinkPrompt — start-page sheet shown when this device has opened
 * tabs under a DIFFERENT auth user (a second email). Linking the two accounts
 * keeps unpaid liabilities visible across both, with an explicit customer
 * acknowledgement of shared liability before the link is created.
 */
export function IdentityLinkPrompt() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<OtherAccount[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [linking, setLinking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;

    let cancelled = false;
    (async () => {
      try {
        const deviceId = await getDeviceId();
        if (!deviceId || deviceId.startsWith('temp_')) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch(`/api/identity/link-state?deviceId=${encodeURIComponent(deviceId)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;

        const state = await res.json();
        if (cancelled) return;
        if (state.promptable && Array.isArray(state.otherAccounts) && state.otherAccounts.length > 0) {
          setAccounts(state.otherAccounts);
          setOpen(true);
        }
      } catch {
        // Non-critical — linking is opt-in.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, dismissed]);

  const handleLink = async () => {
    if (!acknowledged || accounts.length === 0) return;
    setLinking(true);
    try {
      const deviceId = await getDeviceId();
      const { data: { session } } = await supabase.auth.getSession();
      if (!deviceId || !session?.access_token) return;

      const res = await fetch('/api/identity/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          deviceId,
          otherUserId: accounts[0].userId,
          acknowledge: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast({ type: 'error', title: 'Could not connect', message: err?.error || 'Please try again.' });
        return;
      }

      setOpen(false);
      setDismissed(true);
      showToast({
        type: 'success',
        title: 'Accounts connected',
        message: 'Your tab history and bills are now shared across both accounts.',
      });
    } catch {
      showToast({ type: 'error', title: 'Could not connect', message: 'Please try again.' });
    } finally {
      setLinking(false);
    }
  };

  const close = () => {
    setOpen(false);
    setDismissed(true);
  };

  if (!open) return null;

  const labels = accounts.map((a) => a.displayName || 'another email').filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ animation: 'fadeIn 0.25s ease-out' }}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl mx-auto"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FFF1E8] flex items-center justify-center">
              <Link2 size={18} className="text-[#FF4F00]" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Another account used this device</h2>
          </div>
          <button onClick={close} className="p-1.5 rounded-full hover:bg-gray-100" aria-label="Dismiss">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            This device has previously opened tabs as{' '}
            <strong className="text-gray-900">{labels[0] || 'another email'}</strong>.
            Connect that account so your tab history and ongoing bills stay together.
          </p>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2.5">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              By connecting, unpaid balances from either account become visible across
              both, and either may be pursued to settle them in case of a legal claim.
            </p>
          </div>

          <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#FF4F00]"
            />
            <span className="text-sm text-gray-700">
              I understand and accept that my accounts will share liability for unpaid tabs.
            </span>
          </label>

          <button
            onClick={handleLink}
            disabled={!acknowledged || linking}
            className="mt-4 w-full rounded-xl py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: acknowledged && !linking ? '#FF4F00' : '#F5F5F5',
              color: acknowledged && !linking ? '#fff' : '#9CA3AF',
            }}
          >
            {linking ? 'Connecting…' : 'Connect accounts'}
          </button>

          <button onClick={close} className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-gray-700">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}