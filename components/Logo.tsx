import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-base', logoText: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl', logoText: 'text-lg' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl', logoText: 'text-xl' },
  }
  const { icon, text, logoText } = sizeMap[size]

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${icon} bg-orange-500 rounded-lg flex items-center justify-center`}>
        <span className={`text-white font-bold ${logoText}`}>T</span>
      </div>
      <span className={`${text} font-bold text-gray-800`}>Tabeza</span>
    </div>
  )
}
