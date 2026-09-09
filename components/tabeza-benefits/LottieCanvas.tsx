'use client';

import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import type { LottieSceneData } from './animations';

// Imperative lottie-web host. Renders a looping scene into its own container
// and tears it down on unmount so the RAF loop never leaks.

export default function LottieCanvas({
  animationData,
  className,
  style,
}: {
  animationData: LottieSceneData;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });
    return () => {
      anim.destroy();
    };
  }, [animationData]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style }}
      aria-hidden="true"
    />
  );
}