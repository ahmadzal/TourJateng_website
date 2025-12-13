'use client'
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'
import React from 'react'

/**
 * Higher-order component to wrap components that should only render on client
 * This prevents hydration mismatch by deferring rendering until after mount
 */
export function withNoSSR<T extends object>(
  Component: ComponentType<T>,
  fallback?: ComponentType<T> | React.ReactNode
) {
  return dynamic(() => Promise.resolve(Component), {
    ssr: false,
    loading: () => {
      if (!fallback) return null
      if (typeof fallback === 'function') {
        const FallbackComponent = fallback as ComponentType<T>
        return React.createElement(FallbackComponent, {} as T)
      }
      return fallback as React.ReactElement
    }
  })
}

/**
 * Wrapper component for auth-dependent UI elements
 */
export const NoSSRWrapper = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
        <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
      </div>
    )
  }
)