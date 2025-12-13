'use client'
import { useState } from 'react'

interface UserAvatarProps {
  src?: string | null
  name?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ 
  src, 
  name, 
  email, 
  size = 'md', 
  className = '' 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)
  
  // Get initials from name or email
  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    if (email) {
      return email[0].toUpperCase()
    }
    
    return 'U'
  }
  
  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-base'
  }
  
  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-medium ${className}`
  
  // Show image if available and no error
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || email || 'User'}
        className={`${baseClasses} object-cover`}
        onError={() => setImageError(true)}
      />
    )
  }
  
  // Show initials fallback
  return (
    <div className={`${baseClasses} bg-sky-600 text-white`}>
      {getInitials()}
    </div>
  )
}