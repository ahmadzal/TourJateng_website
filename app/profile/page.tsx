'use client'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function ProfileContent() {
  const { user, userProfile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState('profile')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [userForums, setUserForums] = useState<any[]>([])
  const [forumsLoading, setForumsLoading] = useState(true)
  const [userFavorites, setUserFavorites] = useState<any[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showBadgeSelector, setShowBadgeSelector] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<any>(null)
  const [earnedBadges, setEarnedBadges] = useState<any[]>([])
  const [loadingBadges, setLoadingBadges] = useState(false)
  const [showBannerSelector, setShowBannerSelector] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<any>(null)
  const [earnedBanners, setEarnedBanners] = useState<any[]>([])
  const [loadingBanners, setLoadingBanners] = useState(false)

  useEffect(() => {
    
    if (user?.id) {
      fetchUserForums()
      fetchUserFavorites()
      fetchActiveBadge()
      fetchEarnedBadges()
      fetchActiveBanner()
      fetchEarnedBanners()
      
      const channel = supabase
        .channel(`user-forums-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'forum_posts',
            filter: `author_id=eq.${user.id}`
          },
          (payload) => {
            console.log('User forum updated:', payload)
            fetchUserForums()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchUserForums = async () => {
    try {
      setForumsLoading(true)
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.warn('Forum posts table does not exist')
          setUserForums([])
          return
        }
        throw error
      }

      setUserForums(data || [])
    } catch (error) {
      console.error('Error fetching user forums:', error)
      setUserForums([])
    } finally {
      setForumsLoading(false)
    }
  }

  const fetchUserFavorites = async () => {
    try {
      setFavoritesLoading(true)
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          created_at,
          destinasi:destinasi_id (
            id_destinasi,
            nama_destinasi,
            kategori,
            lokasi,
            url_gambar,
            deskripsi
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.warn('User favorites table does not exist')
          setUserFavorites([])
          return
        }
        throw error
      }

      setUserFavorites(data || [])
    } catch (error) {
      console.error('Error fetching user favorites:', error)
      setUserFavorites([])
    } finally {
      setFavoritesLoading(false)
    }
  }

  const fetchActiveBadge = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('active_badge_id')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      console.log('User active_badge_id:', userData?.active_badge_id)

      if (userData?.active_badge_id) {
        const { data: badgeData } = await supabase
          .from('badges')
          .select('*')
          .eq('id', userData.active_badge_id)
          .single()

        console.log('Fetched badge data:', badgeData)

        if (badgeData) {
          setSelectedBadge(badgeData)
        }
      } else {
        console.log('No active badge selected for this user')
      }
    } catch (error) {
      console.error('Error fetching active badge:', error)
    }
  }

  const fetchEarnedBadges = async () => {
    try {
      setLoadingBadges(true)
      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon_url
          )
        `)
        .eq('user_id', user?.id)

      if (error) throw error

      console.log('Fetched user badges:', userBadges)

      const badges = userBadges?.map((ub: any) => ({
        ...ub.badges,
        earned_at: ub.earned_at
      })) || []

      console.log('Processed badges:', badges)
      setEarnedBadges(badges)
    } catch (error) {
      console.error('Error fetching earned badges:', error)
      setEarnedBadges([])
    } finally {
      setLoadingBadges(false)
    }
  }

  const handleSelectBadge = async (badgeId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active_badge_id: badgeId })
        .eq('id', user?.id)

      if (error) throw error

      console.log('Badge selected, ID:', badgeId)
      console.log('Earned badges:', earnedBadges)
      
      const badge = earnedBadges.find(b => b.id === badgeId)
      console.log('Found badge:', badge)
      
      if (badge) {
        setSelectedBadge(badge)
      } else {
        // Fetch badge directly from database if not found in earnedBadges
        const { data: badgeData } = await supabase
          .from('badges')
          .select('*')
          .eq('id', badgeId)
          .single()
        
        console.log('Fetched badge from DB:', badgeData)
        if (badgeData) {
          setSelectedBadge(badgeData)
        }
      }
      
      setShowBadgeSelector(false)
      
      // Refresh auth profile to update navbar
      await refreshProfile()
      
      // Trigger event to refresh forum posts
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('badgeUpdated'))
      }
    } catch (error) {
      console.error('Error selecting badge:', error)
    }
  }

  const handleRemoveBadge = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active_badge_id: null })
        .eq('id', user?.id)

      if (error) throw error

      setSelectedBadge(null)
      setShowBadgeSelector(false)
      
      // Refresh auth profile to update navbar
      await refreshProfile()
      
      // Trigger event to refresh forum posts
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('badgeUpdated'))
      }
    } catch (error) {
      console.error('Error removing badge:', error)
    }
  }

  const fetchActiveBanner = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('active_banner_id')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (userData?.active_banner_id) {
        const { data: bannerData } = await supabase
          .from('banners')
          .select('*')
          .eq('id', userData.active_banner_id)
          .single()

        if (bannerData) {
          setSelectedBanner(bannerData)
        }
      }
    } catch (error) {
      console.error('Error fetching active banner:', error)
    }
  }

  const fetchEarnedBanners = async () => {
    try {
      setLoadingBanners(true)
      
      // Fetch all banners
      const { data: allBanners, error: bannersError } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false })

      if (bannersError) throw bannersError

      // Fetch user's earned banners
      const { data: userBanners, error: userBannersError } = await supabase
        .from('user_banners')
        .select('banner_id, earned_at')
        .eq('user_id', user?.id)

      if (userBannersError) throw userBannersError

      // Auto-award free banners if not already awarded
      const freeBanners = allBanners?.filter((b: any) => b.banner_type?.toLowerCase() === 'free') || []
      
      for (const banner of freeBanners) {
        const alreadyAwarded = userBanners?.find((ub: any) => ub.banner_id === banner.id)
        
        if (!alreadyAwarded) {
          console.log(`Auto-awarding free banner: ${banner.name}`)
          await supabase
            .from('user_banners')
            .insert({
              user_id: user?.id,
              banner_id: banner.id
            })
            .then(({ error }) => {
              if (error && error.code !== '23505') {
                console.error('Error auto-awarding free banner:', error)
              }
            })
        }
      }

      // Refetch user banners after auto-award
      const { data: updatedUserBanners } = await supabase
        .from('user_banners')
        .select('banner_id, earned_at')
        .eq('user_id', user?.id)

      // Merge data
      const earnedBannersData = allBanners?.filter((banner: any) => {
        const earned = updatedUserBanners?.find((ub: any) => ub.banner_id === banner.id)
        return earned || banner.banner_type?.toLowerCase() === 'free'
      }).map((banner: any) => {
        const earned = updatedUserBanners?.find((ub: any) => ub.banner_id === banner.id)
        return {
          ...banner,
          earned_at: earned?.earned_at || new Date().toISOString()
        }
      }) || []

      setEarnedBanners(earnedBannersData)
    } catch (error) {
      console.error('Error fetching earned banners:', error)
      setEarnedBanners([])
    } finally {
      setLoadingBanners(false)
    }
  }

  const handleSelectBanner = async (bannerId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active_banner_id: bannerId })
        .eq('id', user?.id)

      if (error) throw error

      const banner = earnedBanners.find(b => b.id === bannerId)
      setSelectedBanner(banner)
      setShowBannerSelector(false)
    } catch (error) {
      console.error('Error selecting banner:', error)
    }
  }

  const handleRemoveBanner = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active_banner_id: null })
        .eq('id', user?.id)

      if (error) throw error

      setSelectedBanner(null)
      setShowBannerSelector(false)
    } catch (error) {
      console.error('Error removing banner:', error)
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'baru saja'
    if (diffMins < 60) return `${diffMins} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    return `${diffDays} hari yang lalu`
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Password baru tidak cocok!' })
      setPasswordSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password minimal 6 karakter!' })
      setPasswordSaving(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        setPasswordMessage({ type: 'error', text: error.message })
      } else {
        setPasswordMessage({ type: 'success', text: 'Password berhasil diubah!' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Terjadi kesalahan saat mengubah password' })
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="animate-pulse flex w-full">
          <div className="w-80 bg-white p-6">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex-1 p-8">
            <div className="h-64 bg-white rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Anda harus login untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Mobile Hamburger Button - hidden when sidebar is open, positioned at top-right */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Toggle menu"
          className="lg:hidden fixed top-4 right-4 z-50 inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-md"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          w-80 bg-white shadow-lg min-h-screen overflow-y-auto
          lg:sticky lg:top-0
          ${isSidebarOpen ? 'fixed left-0 top-0 z-50 h-screen' : 'hidden lg:block'}
          transition-all duration-300
        `}>
          <div className="p-6">
          {/* Logo/Header */}
          <div>
            <div className="px-4 py-2 text-sm font-bold text-blue-600 uppercase tracking-wider">
              UTAMA
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Beranda</span>
            </Link>

            <Link href="/destinasi" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Destinasi Wisata</span>
            </Link>

            <Link href="/forum" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Forum Diskusi</span>
            </Link>

            <Link href="/artikel" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Artikel</span>
            </Link>

            <Link href="/chatbot" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
              </svg>
              <span className="text-sm sm:text-base font-medium">Chatbot AI</span>
            </Link>

            <div className="pt-2">
              <div className="px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wider">
                PROFILE
              </div>
              
              <button
                onClick={() => {
                  setActiveMenu('profile');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  activeMenu === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm sm:text-base font-medium">Profil Saya</span>
              </button>

              <Link
                href="/profile/badges"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-sm sm:text-base font-medium">Achievement</span>
              </Link>
            </div>
          </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden lg:ml-0">
        <div className="max-w-5xl mx-auto">
          {/* Render content based on activeMenu */}
          {activeMenu === 'profile' && (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 relative">
                {/* Cover Banner Area */}
                <div className="relative h-24 sm:h-28 lg:h-32 rounded-t-2xl -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-12 sm:mb-14 lg:mb-16 overflow-hidden">
                  {selectedBanner && selectedBanner.image_url ? (
                    <img 
                      src={selectedBanner.image_url} 
                      alt={selectedBanner.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.classList.add('bg-gradient-to-r', 'from-gray-400', 'to-gray-500')
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
                  )}

                  {/* Banner Selector Icon - positioned to avoid hamburger menu */}
                  <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4">
                    <button
                      onClick={() => setShowBannerSelector(true)}
                      className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title={selectedBanner ? 'Ubah Banner' : 'Pilih Banner'}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit Profile Button */}
                  <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 right-2 sm:right-3 lg:right-4">
                    <button
                      onClick={() => router.push('/profile/edit')}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg flex items-center gap-1 sm:gap-2 transition-colors"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  </div>
                </div>

                {/* Avatar with Badge Button - Outside Banner */}
                <div className="absolute top-6 sm:top-8 lg:top-10 left-4 sm:left-5 lg:left-6 flex items-end gap-2 sm:gap-3 z-20">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gray-400 rounded-full border-2 sm:border-3 lg:border-4 border-white overflow-hidden shadow-lg">
                      {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-2xl sm:text-3xl lg:text-4xl font-bold">
                          {(userProfile?.full_name || user.email?.split('@')[0] || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Badge Selector */}
                  <button
                    onClick={() => setShowBadgeSelector(true)}
                    className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center mb-12 sm:mb-16 lg:mb-20 hover:border-blue-400 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                    title={selectedBadge ? 'Ubah Lencana' : 'Pilih Lencana'}
                  >
                    {selectedBadge && selectedBadge.icon_url ? (
                      <img 
                        src={selectedBadge.icon_url} 
                        alt={selectedBadge.name}
                        className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 object-contain"
                      />
                    ) : (
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* User Info */}
                <div className="mt-2 sm:mt-3 lg:mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
                      {userProfile?.full_name || user.email?.split('@')[0] || 'Nama User'}
                    </h2>
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-600 text-xs sm:text-sm font-medium rounded-full w-fit">
                      User
                    </span>
                  </div>
                  <p className="text-gray-500 mb-1 text-xs sm:text-sm md:text-base break-all">{user.email}</p>
                  <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">
                    Bergabung sejak {new Date(user.created_at || '2025-11-23').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Forum Activity Section */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mt-4 sm:mt-5 lg:mt-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 lg:mb-6">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Riwayat Aktivitas Forum</h3>
                    <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm">Statistik forum diskusi yang Anda buat</p>
                  </div>
                </div>

                {forumsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {/* Total Forums */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-2xl sm:text-3xl font-bold text-gray-700">{userForums.length}</h4>
                          <p className="text-gray-600 font-semibold text-sm sm:text-base">Total Dibuat</p>
                          <p className="text-gray-500 text-xs sm:text-sm">Forum diskusi</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Active Forums */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 lg:p-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-2xl sm:text-3xl font-bold text-blue-700">
                            {userForums.filter(forum => forum.is_active).length}
                          </h4>
                          <p className="text-blue-600 font-semibold text-sm sm:text-base">Forum Aktif</p>
                          <p className="text-blue-500 text-xs sm:text-sm">Masih terbuka</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Completed Forums */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-5 lg:p-6 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-2xl sm:text-3xl font-bold text-green-700">
                            {userForums.filter(forum => !forum.is_active).length}
                          </h4>
                          <p className="text-green-600 font-semibold text-sm sm:text-base">Forum Selesai</p>
                          <p className="text-green-500 text-xs sm:text-sm">Sudah ditutup</p>
                        </div>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {userForums.length === 0 && (
                  <div className="flex justify-center mt-8">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Belum ada diskusi forum yang dibuat</p>
                      <button
                        onClick={() => router.push('/forum')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Buat Diskusi Pertama
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Favorites Section */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mt-4 sm:mt-5 lg:mt-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 lg:mb-6">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Destinasi Favorit</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Destinasi wisata yang Anda sukai</p>
                  </div>
                </div>

                {favoritesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : userFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {userFavorites.map((favorite) => (
                      <div 
                        key={favorite.id} 
                        className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/destinasi/${favorite.destinasi.id_destinasi}`)}
                      >
                        <div className="relative h-40 sm:h-44 lg:h-48 overflow-hidden">
                          <img
                            src={favorite.destinasi.url_gambar || '/images/placeholder.jpg'}
                            alt={favorite.destinasi.nama_destinasi}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                            <div className="bg-red-500 text-white p-2 rounded-full shadow-lg">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {favorite.destinasi.nama_destinasi}
                          </h4>
                          <div className="flex items-center text-gray-600 mb-2">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm">{favorite.destinasi.lokasi}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                              {favorite.destinasi.kategori}
                            </span>
                            <span className="text-xs text-gray-500">
                              Ditambahkan {new Date(favorite.created_at).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Destinasi Favorit</h4>
                    <p className="text-gray-600 mb-4">Mulai menjelajahi dan tambahkan destinasi ke favorit Anda</p>
                    <button
                      onClick={() => router.push('/destinasi')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Jelajahi Destinasi
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Badges/Achievement Content */}
          {activeMenu === 'badges' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievement & Badges</h2>
              <p className="text-gray-600 mb-8">Kumpulkan badge dan banner eksklusif dengan menyelesaikan berbagai aktivitas di TourJateng</p>
              
              {/* Achievement content will be added here */}
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Fitur Achievement Segera Hadir!</h3>
                <p className="text-gray-600">Sistem badge dan achievement sedang dalam pengembangan</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge Selector Modal */}
      {showBadgeSelector && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowBadgeSelector(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Pilih Lencana</h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">Pilih lencana yang ingin ditampilkan di profil Anda</p>
                </div>
                <button
                  onClick={() => setShowBadgeSelector(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto max-h-[calc(85vh-160px)] sm:max-h-[calc(80vh-180px)]">
              {loadingBadges ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : earnedBadges.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Lencana</h3>
                  <p className="text-gray-600 mb-4">Selesaikan aktivitas untuk mendapatkan lencana</p>
                  <button
                    onClick={() => {
                      setShowBadgeSelector(false)
                      router.push('/profile/badges')
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Lihat Semua Lencana
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {earnedBadges.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => handleSelectBadge(badge.id)}
                      className={`relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 p-3 sm:p-4 rounded-xl transition-all duration-200 hover:shadow-lg ${
                        selectedBadge?.id === badge.id 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {/* Selection Indicator */}
                      {selectedBadge?.id === badge.id && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Badge Icon */}
                      <div className="flex justify-center mb-2 sm:mb-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <img 
                            src={badge.icon_url} 
                            alt={badge.name} 
                            className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain" 
                          />
                        </div>
                      </div>

                      {/* Badge Name */}
                      <h3 className="text-center font-semibold text-xs sm:text-sm text-gray-900 break-words">
                        {badge.name}
                      </h3>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 lg:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2 sm:gap-3">
                {selectedBadge && (
                  <button
                    onClick={handleRemoveBadge}
                    className="flex-1 py-2.5 sm:py-3 bg-red-100 text-red-600 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-200 transition-colors"
                  >
                    Hapus Lencana
                  </button>
                )}
                <button
                  onClick={() => setShowBadgeSelector(false)}
                  className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Selector Modal */}
      {showBannerSelector && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowBannerSelector(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Pilih Banner</h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">Pilih banner yang ingin ditampilkan di profil Anda</p>
                </div>
                <button
                  onClick={() => setShowBannerSelector(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto max-h-[calc(85vh-160px)] sm:max-h-[calc(80vh-180px)]">
              {loadingBanners ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : earnedBanners.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Banner</h3>
                  <p className="text-gray-600 mb-4">Selesaikan aktivitas untuk mendapatkan banner</p>
                  <button
                    onClick={() => {
                      setShowBannerSelector(false)
                      router.push('/profile/badges')
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Lihat Semua Banner
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {earnedBanners.map((banner) => (
                    <button
                      key={banner.id}
                      onClick={() => handleSelectBanner(banner.id)}
                      className={`relative h-32 sm:h-36 lg:h-40 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl ${
                        selectedBanner?.id === banner.id 
                          ? 'ring-4 ring-blue-500' 
                          : 'hover:ring-2 hover:ring-blue-300'
                      }`}
                    >
                      {/* Banner Image */}
                      <div className="absolute inset-0">
                        <img 
                          src={banner.image_url} 
                          alt={banner.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600')
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedBanner?.id === banner.id && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Banner Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                        <h3 className="text-white font-bold text-base sm:text-lg drop-shadow-lg mb-1 break-words">
                          {banner.name}
                        </h3>
                        {banner.banner_type && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            banner.banner_type.toLowerCase() === 'premium' 
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                              : 'bg-white/90 text-gray-800'
                          }`}>
                            {banner.banner_type.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 lg:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2 sm:gap-3">
                {selectedBanner && (
                  <button
                    onClick={handleRemoveBanner}
                    className="flex-1 py-2.5 sm:py-3 bg-red-100 text-red-600 rounded-lg text-sm sm:text-base font-semibold hover:bg-red-200 transition-colors"
                  >
                    Hapus Banner
                  </button>
                )}
                <button
                  onClick={() => setShowBannerSelector(false)}
                  className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
