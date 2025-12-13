'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useClientRedirect() {
  const [hasMounted, setHasMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const redirect = (fallbackUrl: string = '/', delay: number = 0) => {
    if (!hasMounted) return

    const redirectTo = searchParams?.get('redirect') || fallbackUrl

    if (delay > 0) {
      setTimeout(() => {
        console.log('🔄 Redirecting to:', redirectTo)
        router.push(redirectTo)
      }, delay)
    } else {
      console.log('🔄 Redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }

  const getOrigin = () => {
    if (!hasMounted || typeof window === 'undefined') return ''
    return window.location.origin
  }

  return {
    redirect,
    getOrigin,
    hasMounted,
    redirectUrl: hasMounted ? (searchParams?.get('redirect') || '/') : '/'
  }
}