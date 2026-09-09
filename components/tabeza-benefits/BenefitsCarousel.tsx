'use client';

import { useEffect, useState } from 'react';
import LottieCanvas from './LottieCanvas';
import { tabezaBenefitLotties, type LottieSceneData } from './animations';

type BenefitSlide = {
  key: string;
  title: string;
  body: string;
  animation: LottieSceneData;
  hint?: string;
};

// Hand-authored benefit scenes, shown edge-to-edge in the media-advert slot.
// Each slide is one Tabeza benefit from a customer's point of view. The
// carousel cycles automatically (pause on hover) and, where promos are
// enabled, tapping the banner opens the offers modal.

const SLIDES: BenefitSlide[] = [
  {
    key: 'open',
    title: 'Open a tab from your seat',
    body: 'No queue at the counter.',
    animation: tabezaBenefitLotties.open,
  },
  {
    key: 'pay',
    title: 'Pay at the table',
    body: 'Settle up right on your phone.',
    animation: tabezaBenefitLotties.pay,
  },
  {
    key: 'balance',
    title: 'Your tab, live',
    body: 'See every order the moment it lands.',
    animation: tabezaBenefitLotties.balance,
  },
  {
    key: 'waiter',
    title: 'Waiter, one tap away',
    body: 'No waving — tap to call your waiter.',
    animation: tabezaBenefitLotties.waiter,
  },
  {
    key: 'rewards',
    title: 'Offers that fit you',
    body: 'Treats picked around what you order.',
    animation: tabezaBenefitLotties.rewards,
    hint: 'Tap to see offers',
  },
];

type BenefitsCarouselProps = {
  onActivate?: () => void;
};

export default function BenefitsCarousel({ onActivate }: BenefitsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(t);
  }, [paused]);

  const slide = SLIDES[index];

  const handleClick = () => {
    if (onActivate) onActivate();
  };

  return (
    <div
      className="benefits-carousel"
      style={{
        position: 'relative',
        width: '100%',
        height: '160px',
        backgroundColor: '#111',
        overflow: 'hidden',
        pointerEvents: onActivate ? 'auto' : 'none',
        cursor: onActivate ? 'pointer' : 'default',
      }}
      role={onActivate ? 'button' : undefined}
      onClick={handleClick}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingLeft: 8,
          paddingRight: 16,
        }}
      >
        <div
          style={{
            width: '150px',
            height: '150px',
            flex: '0 0 150px',
          }}
        >
          <LottieCanvas animationData={slide.animation} style={{ width: '100%', height: '100%' }} />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            color: '#FFEDD6',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#FFEDD6',
            }}
          >
            {slide.title}
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              lineHeight: 1.3,
              color: '#FFA83A',
            }}
          >
            {slide.body}
          </p>
          {slide.hint && onActivate ? (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                fontWeight: 600,
                color: '#FF4F00',
              }}
            >
              {slide.hint}
            </p>
          ) : null}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {SLIDES.map((s, i) => (
          <span
            key={s.key}
            style={{
              width: i === index ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === index ? '#FF4F00' : 'rgba(255, 237, 214, 0.35)',
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}