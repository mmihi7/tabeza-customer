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
    return <div className="w-full rounded-xl border border-gray-100" style={{ aspectRatio: '16 / 5', backgroundColor: '#000' }} />;
  }

  // Rectangular responsive box — adapts aspect to media type (video 16:9,
  // image/slideshow keep a wide banner ratio).
  const aspect =
    media.media_type === 'video'
      ? '16 / 9'
      : media.media_type === 'slideshow' && media.slide_urls.length > 1
      ? '16 / 6'
      : '16 / 5';

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-100 shadow-sm" style={{ aspectRatio: aspect, backgroundColor: '#000' }}>
      {media.media_type === 'video' ? (
        <video src={media.url} controls playsInline className="w-full h-full object-cover" />
      ) : media.media_type === 'slideshow' && media.slide_urls.length > 1 ? (
        <img src={media.slide_urls[slideIndex] ?? media.url} alt={media.title ?? 'Promotion'} className="w-full h-full object-cover" />
      ) : (
        <img src={media.url} alt={media.title ?? 'Promotion'} className="w-full h-full object-cover" />
      )}
    </div>
  );
}
