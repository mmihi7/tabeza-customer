'use client';

import { useEffect, useState, useRef } from 'react';

// Platform-controlled customer media advert.
//
// Renders as a full-screen AUTO-PLAYING interstitial with NO user controls:
//   - media starts automatically (video is muted/looping; slideshows advance)
//   - it is NOT controllable by the customer (no controls, taps pass through)
//   - after a fixed on-screen duration it "closes" with a sci-fi wipe (four
//     shutters converging vertically + horizontally)
//   - it reappears automatically after a set interval, forever (while this page
//     is open).
//
// Media is created/managed by the platform admin in /system and targeted by
// venue area. PDF is intentionally not supported.

interface MediaPayload {
  title?: string;
  media_type: 'image' | 'video' | 'slideshow';
  url: string;
  slide_urls: string[];
}

type Phase = 'hidden' | 'showing' | 'closing';

const FIRST_DELAY_MS = 4000; // how soon the first advert appears
const ON_SCREEN_MS = 8000;   // how long the advert stays before closing
const CLOSE_MS = 750;        // sci-fi wipe duration
const REPEAT_MS = 45000;     // how long until it appears again

export default function CustomerMediaBox({ barId }: { barId: string }) {
  const [media, setMedia] = useState<MediaPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('hidden');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoaded(false);
    setMedia(null);
    setPhase('hidden');
    fetch(`/api/media?barId=${barId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setMedia(data?.media ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setMedia(null);
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [barId]);

  // Auto-advance slideshow (only while visible)
  useEffect(() => {
    if (phase !== 'showing' || !media || media.media_type !== 'slideshow' || media.slide_urls.length <= 1) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % media.slide_urls.length);
    }, 3000);
    return () => clearInterval(t);
  }, [phase, media]);

  // Auto-show → auto-close (sci-fi wipe) → reappear on a loop
  useEffect(() => {
    if (!loaded || !media) return;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const later = (fn: () => void, ms: number) => {
      timeoutsRef.current.push(setTimeout(fn, ms));
    };

    const showAd = () => setPhase('showing');
    const startClosing = () => setPhase('closing');
    const hideAd = () => {
      setPhase('hidden');
      later(() => {
        showAd();
        later(startClosing, ON_SCREEN_MS);
        later(hideAd, ON_SCREEN_MS + CLOSE_MS);
      }, REPEAT_MS);
    };

    later(showAd, FIRST_DELAY_MS);
    later(startClosing, FIRST_DELAY_MS + ON_SCREEN_MS);
    later(hideAd, FIRST_DELAY_MS + ON_SCREEN_MS + CLOSE_MS);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [loaded, media]);

  if (!media || phase === 'hidden') return null;

  const content =
    media.media_type === 'video' ? (
      // Auto-start, no controls, no user interaction.
      <video
        src={media.url}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-contain"
        style={{ backgroundColor: '#000' }}
      />
    ) : media.media_type === 'slideshow' && media.slide_urls.length > 1 ? (
      <img src={media.slide_urls[slideIndex] ?? media.url} alt={media.title ?? 'Promotion'} className="w-full h-full object-contain" />
    ) : (
      <img src={media.url} alt={media.title ?? 'Promotion'} className="w-full h-full object-contain" />
    );

  return (
    <div
      className={`media-advert ${phase === 'closing' ? 'media-advert--closing' : ''}`}
      style={{ position: 'fixed', inset: 0, zIndex: 70, pointerEvents: 'none' }}
    >
      {content}

      {/* Sci-fi close: four shutters converge vertically + horizontally */}
      {phase === 'closing' && (
        <>
          <span className="ad-shutter ad-shutter--top" />
          <span className="ad-shutter ad-shutter--bottom" />
          <span className="ad-shutter ad-shutter--left" />
          <span className="ad-shutter ad-shutter--right" />
        </>
      )}

      <style>{`
        .media-advert { display: flex; align-items: center; justify-content: center; }
        .ad-shutter { position: absolute; background: #000; will-change: transform; }
        .media-advert--closing .ad-shutter--top { top: 0; left: 0; right: 0; height: 50%; transform-origin: top; animation: adTop 0.75s ease-in forwards; }
        .media-advert--closing .ad-shutter--bottom { bottom: 0; left: 0; right: 0; height: 50%; transform-origin: bottom; animation: adBottom 0.75s ease-in forwards; }
        .media-advert--closing .ad-shutter--left { left: 0; top: 0; bottom: 0; width: 50%; transform-origin: left; animation: adLeft 0.75s ease-in forwards; }
        .media-advert--closing .ad-shutter--right { right: 0; top: 0; bottom: 0; width: 50%; transform-origin: right; animation: adRight 0.75s ease-in forwards; }
        @keyframes adTop { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes adBottom { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes adLeft { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes adRight { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      `}</style>
    </div>
  );
}
