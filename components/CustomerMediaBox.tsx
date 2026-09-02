'use client';

import { useEffect, useState, useRef } from 'react';

// Platform-controlled customer media box.
// Renders the single targeted media entry for the current venue as one
// responsive rectangular box. Supports image, video, and slideshow.
// Media is created/managed by the platform admin in /system and targeted
// by venue area. PDF is intentionally not supported.

interface MediaPayload {
  title?: string;
  media_type: 'image' | 'video' | 'slideshow';
  url: string;
  slide_urls: string[];
}

export default function CustomerMediaBox({ barId }: { barId: string }) {
  const [media, setMedia] = useState<MediaPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoaded(false);
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

  // Auto-advance slideshow
  useEffect(() => {
    if (!media || media.media_type !== 'slideshow' || media.slide_urls.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSlideIndex((i) => (i + 1) % media.slide_urls.length);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [media]);

  if (loaded && !media) return null;
  if (!loaded || !media) {
    return <div className="w-full" style={{ aspectRatio: '16 / 5', backgroundColor: '#000' }} />;
  }

  // Fill the full width edge-to-edge (no border/radius/padding) so the banner
  // blends with the app like the header. Content keeps its own aspect ratio,
  // centred on a dark canvas (no crop or distortion) — video caps height at the
  // screen, images/slideshow scale naturally.
  return (
    <div className="w-full overflow-hidden" style={{ backgroundColor: '#000', minHeight: 160 }}>
      <div className="flex items-center justify-center w-full" style={{ minHeight: 160 }}>
        {media.media_type === 'video' ? (
          <video
            src={media.url}
            controls
            playsInline
            className="w-full h-auto max-h-[70vh]"
            style={{ objectFit: 'contain', backgroundColor: '#000' }}
          />
        ) : media.media_type === 'slideshow' && media.slide_urls.length > 1 ? (
          <img
            src={media.slide_urls[slideIndex] ?? media.url}
            alt={media.title ?? 'Promotion'}
            className="w-full h-auto"
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <img
            src={media.url}
            alt={media.title ?? 'Promotion'}
            className="w-full h-auto"
            style={{ objectFit: 'contain' }}
          />
        )}
      </div>
    </div>
  );
}
