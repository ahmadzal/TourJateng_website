'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useIsomorphicLayoutEffect } from '@/hooks/useBrowserAPIs'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const hasMounted = useIsomorphicLayoutEffect()

  const refreshProfile = async () => {
    console.log('🔄 RefreshProfile called, user:', user?.id)
    if (!user) {
      console.log('❌ No user found, skipping profile refresh')
      return
    }
    
    try {
      console.log('📡 Fetching profile for user:', user.id)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('📊 Profile fetch result:', { data: !!data, error: !!error })
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return
      }
      
      if (data) {
        console.log('✅ Profile found:', data)
        
        // Fetch badge icon if user has active badge
        if (data.active_badge_id) {
          const { data: badgeData } = await supabase
            .from('badges')
            .select('icon_url')
            .eq('id', data.active_badge_id)
            .single()
          
          if (badgeData) {
            data.badge_icon_url = badgeData.icon_url
          }
        }
        
        setUserProfile(data)
      } else {
        console.log('⚠️ No profile data found for user:', user.id)
      }
    } catch (error) {
      console.error('💥 Exception in refreshProfile:', error)
    }
  }



  useEffect(() => {
    if (!hasMounted) return
    
    console.log('🔵 Auth Context initializing...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📡 Initial session check:', !!session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, !!session)
        
        if (session?.user) {
          console.log('👤 User authenticated:', session.user.id, session.user.email)
        } else {
          console.log('👤 No user session')
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('🔄 User found, refreshing profile...')
          // Fetch profile after user login/signup
          await refreshProfile()
        } else {
          console.log('🔄 No user, clearing profile...')
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      console.log('🔴 Auth Context cleanup')
      subscription.unsubscribe()
    }
  }, [hasMounted])

  useEffect(() => {
    if (user) {
      refreshProfile()
    }
  }, [user])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}