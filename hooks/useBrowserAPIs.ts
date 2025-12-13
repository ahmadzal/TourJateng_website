'use client'
import { useEffect, useState } from 'react'

/**
 * Hook to detect when the component has been hydrated on the client.
 * This prevents hydration mismatch errors by ensuring consistent rendering
 * between server and client on the initial render.
 */
export function useIsomorphicLayoutEffect() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}

/**
 * Get browser APIs safely with SSR compatibility
 */
export function useBrowserAPIs() {
  const hasMounted = useIsomorphicLayoutEffect()

  return {
    hasMounted,
    window: hasMounted ? window : undefined,
    document: hasMounted ? document : undefined,
    location: hasMounted && typeof window !== 'undefined' ? window.location : undefined,
    localStorage: hasMounted && typeof window !== 'undefined' ? window.localStorage : undefined,
    sessionStorage: hasMounted && typeof window !== 'undefined' ? window.sessionStorage : undefined,
  }
}