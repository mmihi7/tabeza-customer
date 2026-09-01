'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, MapPin, Clock, Banknote, HeartHandshake, Briefcase, Trophy, Menu } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';

interface VenueInfoModalProps {
  barId: string;
  barName: string;
  onStart: () => void;
  onClose: () => void;
}

interface VenuePayload {
  venue: {
    id: string;
    name: string;
    address: string | null;
    location: string | null;
    area: string | null;
    logo_url: string | null;
    phone: string | null;
    business_hours_simple: { openTime?: string; closeTime?: string } | null;
    show_customer_menu: boolean | null;
  };
  menu: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    image_url: string | null;
    sale_price: number;
    is_promo: boolean | null;
  }[];
  crew: {
    avg_payout_reliability: number;
    avg_treatment: number;
    avg_shifts_available: number;
    review_count: number;
  };
}

/**
 * VenueInfoModal — shown on the start/home flow when a customer taps a venue,
 * before a tab is opened. Pulls from the public venue surface
 * (GET /api/public/venues/[id]) so a customer can see the venue's own facts,
 * menu preview, and aggregated crew reputation without logging in.
 */
export const VenueInfoModal: React.FC<VenueInfoModalProps> = ({ barId, barName, onStart, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<VenuePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/public/venues/${barId}`);
      if (!res.ok) throw new Error('venue load failed');
      const json: VenuePayload = await res.json();
      setData(json);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [barId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const venue = data?.venue ?? null;
  const menuPreview = (data?.menu ?? []).slice(0, 6);
  const crew = data?.crew;
  const hasReviews = !!crew && crew.review_count > 0;

  const ReputationBar = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
          {icon}
          {label}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cream)' }}>{value.toFixed(1)}/5</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, backgroundColor: 'var(--border2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round((value / 5) * 100)}%`, backgroundColor: 'var(--amber)', borderRadius: 999 }} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`About ${barName}`}
        className={`relative rounded-t-3xl shadow-2xl w-full max-w-lg transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ background: 'var(--ink2)', border: '1px solid var(--border2)', maxHeight: '82vh', overflowY: 'auto' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-full transition-colors"
          style={{ background: 'var(--ink3)' }}
        >
          <X size={18} style={{ color: 'var(--muted)' }} />
        </button>

        {/* Content */}
        <div style={{ padding: '0 1.25rem 1.5rem' }}>
          {/* Venue identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'var(--ink3)',
                border: '1px solid var(--border2)',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {venue?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={venue.logo_url} alt={venue?.name || barName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--amber)' }}>
                  {(venue?.name || barName).charAt(0)}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--cream)' }}>{venue?.name || barName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                  <MapPin size={12} /> {venue?.location || venue?.area || venue?.address || 'Location unavailable'}
                </span>
                {venue?.business_hours_simple?.openTime && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                    <Clock size={12} /> {venue.business_hours_simple.openTime} – {venue.business_hours_simple.closeTime || 'late'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ padding: '2rem 0', textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
              Loading venue…
            </div>
          )}

          {!loading && failed && (
            <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                Couldn&apos;t load venue details.
              </div>
              <button
                onClick={load}
                style={{
                  background: 'var(--amber)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.625rem 1.25rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Crew reputation */}
          {!loading && !failed && hasReviews && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="section-label" style={{ marginBottom: '0.625rem' }}>
                What crew say
              </p>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <ReputationBar icon={<Banknote size={13} />} label="Pays on time" value={crew.avg_payout_reliability} />
                <ReputationBar icon={<HeartHandshake size={13} />} label="Treatment of staff" value={crew.avg_treatment} />
                <ReputationBar icon={<Briefcase size={13} />} label="Shifts available" value={crew.avg_shifts_available} />
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--muted2)' }}>
                Based on {crew.review_count} review{crew.review_count === 1 ? '' : 's'} from crew who&apos;ve worked at {venue?.name || barName}. Aggregated only — reviewers stay anonymous.
              </div>
            </div>
          )}

          {/* Menu preview */}
          {!loading && !failed && menuPreview.length > 0 && venue?.show_customer_menu !== false && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p className="section-label" style={{ marginBottom: '0.625rem' }}>
                Menu highlights
              </p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {menuPreview.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'baseline' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cream)' }}>
                        {m.name}
                        {m.is_promo && (
                          <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase' }}>
                            Promo
                          </span>
                        )}
                      </span>
                      {m.description && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.description}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cream)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(m.sale_price)}
                    </span>
                  </div>
                ))}
                {(data?.menu?.length ?? 0) > 6 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted2)', textAlign: 'center', marginTop: '0.25rem' }}>
                    <Menu size={11} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: '-1px' }} />
                    Full menu available once you open a tab
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'grid', gap: '0.625rem', marginTop: '0.5rem' }}>
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-bold text-base transition-all"
              style={{ background: 'linear-gradient(135deg, var(--amber) 0%, #CC3F00 100%)' }}
            >
              <Trophy size={18} />
              Start tab at {venue?.name || barName}
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'var(--ink3)', color: 'var(--muted)' }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};