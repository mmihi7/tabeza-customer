import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 48,
}

const FALLBACK_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const px = sizeMap[size]

  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo.svg"
        alt="Tabeza"
        width={px}
        height={px}
        priority
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).src = FALLBACK_SRC
        }}
      />
    </span>
  )
}
