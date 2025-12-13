'use client'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useBrowserAPIs } from '@/hooks/useBrowserAPIs'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { hasMounted, location } = useBrowserAPIs()

  useEffect(() => {
    if (!loading && hasMounted) {
      if (requireAuth && !user) {
        // User not authenticated, redirect to login with return URL
        const currentPath = location 
          ? location.pathname + location.search 
          : '/'
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        console.log('🔒 Protected route - redirecting to:', loginUrl)
        router.push(loginUrl)
      } else if (!requireAuth && user) {
        // User already authenticated but trying to access auth pages
        router.push('/')
      }
    }
  }, [user, loading, router, redirectTo, requireAuth, hasMounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Don't render if user doesn't meet auth requirements
  if (requireAuth && !user) {
    return null
  }

  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}