'use client';

import { useEffect, useState } from 'react';

// Platform-controlled customer media banner.
//
// A permanent edge-to-edge advert banner shown as the last thing before the
// footer (NOT full screen, NOT controllable by the customer):
//   - media starts automatically (video muted/looping; slideshows advance)
//   - it has no rounded corners and bleeds edge to edge
//   - it fills the full content width with a fixed height (160px),
//     using object-cover to preserve aspect ratio
//   - stays visible as long as media exists and the page is open
//
// Media is created/managed by the platform admin in /system and targeted by
// venue area. PDF is intentionally not supported.

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

  useEffect(() => {
    let mounted = true;
    setLoaded(false);
    setMedia(null);
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
    if (!loaded || !media || media.media_type !== 'slideshow' || media.slide_urls.length <= 1) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % media.slide_urls.length);
    }, 3000);
    return () => clearInterval(t);
  }, [loaded, media]);

  if (!media || !loaded) return null;

  return (
    <div
      className="media-advert"
      style={{
        position: 'relative',
        width: '100%',
        height: '160px',
        overflow: 'hidden',
        backgroundColor: '#000',
        borderRadius: 0,
        margin: 0,
      }}
    >
      {media.media_type === 'video' ? (
        <video
          src={media.url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full block"
          style={{ objectFit: 'cover' }}
        />
      ) : media.media_type === 'slideshow' && media.slide_urls.length > 1 ? (
        <img
          src={media.slide_urls[slideIndex] ?? media.url}
          alt={media.title ?? 'Promotion'}
          className="w-full h-full block"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <img
          src={media.url}
          alt={media.title ?? 'Promotion'}
          className="w-full h-full block"
          style={{ objectFit: 'cover' }}
        />
      )}

      <style>{`
        .media-advert { pointer-events: none; }
      `}</style>
    </div>
  );
}
