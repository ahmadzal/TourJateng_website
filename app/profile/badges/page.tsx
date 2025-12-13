'use client'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Badge {
  id: string
  name: string
  description: string
  icon_url: string
  badge_type: string
  requirement_type: string
  requirement_value: number
  created_at: string
  earned_at?: string
  progress?: number
  total?: number
}

interface Banner {
  id: string
  name: string
  description: string
  image_url: string
  banner_type: string
  requirement_type: string
  requirement_value: number
  created_at: string
  earned_at?: string
  progress?: number
  total?: number
}

function BadgesContent() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [showBadgesModal, setShowBadgesModal] = useState(false)
  const [showBannersModal, setShowBannersModal] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'badges' | 'banners'>('badges')
  const [badges, setBadges] = useState<Badge[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loadingBadges, setLoadingBadges] = useState(true)
  const [loadingBanners, setLoadingBanners] = useState(true)
  const [showBadgeDetailModal, setShowBadgeDetailModal] = useState(false)
  const [showBannerDetailModal, setShowBannerDetailModal] = useState(false)
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<Badge | null>(null)
  const [selectedBannerDetail, setSelectedBannerDetail] = useState<Banner | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Fetch badges from Supabase
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoadingBadges(true)
        
        // Fetch all badges
        const { data: allBadges, error: badgesError } = await supabase
          .from('badges')
          .select('*')
          .order('created_at', { ascending: false })

        if (badgesError) {
          console.error('Error fetching badges:', badgesError)
          return
        }

        // Fetch user's earned badges if user is logged in
        if (user) {
          const { data: userBadges, error: userBadgesError } = await supabase
            .from('user_badges')
            .select('badge_id, earned_at')
            .eq('user_id', user.id)

          if (userBadgesError) {
            console.error('Error fetching user badges:', userBadgesError)
          }

          // Get user activity stats for progress calculation
          let forumPostsCount = 0
          let activeDaysCount = 0
          let commentLikesCount = 0
          
          try {
            // Fetch forum posts count
            const { data: forumPosts, error: forumError } = await supabase
              .from('forum_posts')
              .select('id')
              .eq('author_id', user.id)

            if (forumError) {
              console.error('Error fetching forum posts:', forumError)
              const { data: forumPostsAlt } = await supabase
                .from('forum_posts')
                .select('id')
                .eq('user_id', user.id)
              
              forumPostsCount = forumPostsAlt?.length || 0
            } else {
              forumPostsCount = forumPosts?.length || 0
            }
            
            // Fetch comment likes count
            const { data: commentLikes } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('user_id', user.id)
            
            commentLikesCount = commentLikes?.length || 0
            
            // Calculate active days
            const { data: userData } = await supabase
              .from('users')
              .select('created_at')
              .eq('id', user.id)
              .single()
            
            if (userData?.created_at) {
              const createdDate = new Date(userData.created_at)
              const today = new Date()
              const diffTime = Math.abs(today.getTime() - createdDate.getTime())
              activeDaysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }
          } catch (error) {
            console.error('Error in activity stats fetch:', error)
          }

          console.log('📊 User stats:', { forumPosts: forumPostsCount, activeDays: activeDaysCount, commentLikes: commentLikesCount })

          // Merge data and auto-award if requirements met
          const badgesWithEarned = allBadges?.map((badge: any) => {
            const earned = userBadges?.find((ub: any) => ub.badge_id === badge.id)
            
            // Calculate progress for all badges
            let progress = 0
            let total = badge.requirement_value || 0
            let shouldAutoAward = false
            
            // Calculate progress based on requirement type
            if (badge.requirement_type === 'forum_posts') {
              progress = forumPostsCount
              console.log(`🎯 Badge "${badge.name}": ${progress}/${total} forum posts`)
            } else if (badge.requirement_type === 'comment_likes') {
              progress = commentLikesCount
              console.log(`🎯 Badge "${badge.name}": ${progress}/${total} comment likes`)
            } else if (badge.requirement_type === 'active_7days') {
              progress = Math.min(activeDaysCount, total)
              console.log(`🎯 Badge "${badge.name}": ${progress}/${total} active days`)
            } else if (badge.requirement_type === 'active_30days') {
              progress = Math.min(activeDaysCount, total)
              console.log(`🎯 Badge "${badge.name}": ${progress}/${total} active days`)
            } else if (badge.requirement_type === 'first_login') {
              // First login badge awarded automatically on registration
              progress = 1
              total = 1
            } else if (badge.requirement_type === 'admin_grant') {
              // Admin-granted badge (The Grand Architect)
              // Badge sudah otomatis diberikan via trigger jika user email ada di admin_granted_badges
              // Jika earned, badge langsung unlock dengan progress penuh
              if (earned) {
                progress = 1
                total = 1
              } else {
                progress = 0
                total = 1
              }
            } else if (badge.requirement_type === 'creator') {
              // Creator badge is manually awarded
              progress = 0
              total = 1
            }
            
            // Check if should auto-award (when requirement is met)
            if (total > 0 && progress >= total && !earned) {
              shouldAutoAward = true
              console.log(`✅ Auto-awarding badge: ${badge.name}`)
              
              // Award in background
              supabase
                .from('user_badges')
                .insert({
                  user_id: user.id,
                  badge_id: badge.id
                })
                .then(({ error }) => {
                  if (error && error.code !== '23505') {
                    console.error('Error auto-awarding badge:', error)
                  }
                })
            }
            
            // Determine if badge should be shown as earned
            let earnedAt = earned?.earned_at
            if (!earnedAt && shouldAutoAward) {
              earnedAt = new Date().toISOString()
            }
            
            // Debug log untuk badge
            console.log(`Badge "${badge.name}":`, {
              requirement_type: badge.requirement_type,
              requirement_value: badge.requirement_value,
              progress,
              total,
              earned: !!earnedAt
            })
            
            return {
              ...badge,
              earned_at: earnedAt,
              progress: progress,
              total: total
            }
          }) || []

          setBadges(badgesWithEarned)
        } else {
          // For non-logged in users
          const badgesWithStatus = allBadges?.map((badge: any) => ({
            ...badge,
            earned_at: null,
            progress: 0,
            total: badge.requirement_value || 0
          })) || []
          
          setBadges(badgesWithStatus)
        }
      } catch (error) {
        console.error('Error in fetchBadges:', error)
      } finally {
        setLoadingBadges(false)
      }
    }

    fetchBadges()
  }, [user])

  // Sample earned badges (backup - will be replaced by database)
  const earnedBadgesOld: any[] = [
    {
      id: 1,
      name: 'The Grand Architect',
      description: 'Diberikan kepada pembuat atau pengembang utama TourJateng.',
      icon: '👑',
      color: 'from-yellow-400 to-yellow-600',
      earnedDate: '2025-11-20',
      limited: true
    },
    {
      id: 2,
      name: 'The First Wanderer',
      description: 'Diberikan kepada pengguna baru yang mulai menjelajah destinasi.',
      icon: '🏅',
      color: 'from-gray-400 to-gray-600',
      earnedDate: '2025-11-15'
    },
    {
      id: 3,
      name: 'The Trail Seeker',
      description: 'Diberikan kepada pengguna yang telah aktif masuk selama 7 hari berturut-turut.',
      icon: '⭐',
      color: 'from-blue-400 to-blue-600',
      earnedDate: '2025-11-10'
    },
    {
      id: 4,
      name: 'The Seasoned Voyager',
      description: 'Diberikan kepada pengguna yang telah aktif masuk selama 30 hari berturut-turut.',
      icon: '🌟',
      color: 'from-green-400 to-green-600',
      earnedDate: '2025-11-05'
    },
    {
      id: 5,
      name: 'The Innovator',
      description: 'Diberikan kepada kontributor pengembangan TourJateng.',
      icon: '⚙️',
      color: 'from-purple-400 to-purple-600',
      earned: false,
      limited: true
    },
    {
      id: 6,
      name: 'The Forum Sage',
      description: 'Diberikan kepada pengguna dengan lebih dari 100 komentar di komunitas.',
      icon: '💬',
      color: 'from-amber-400 to-amber-600',
      earned: false,
      progress: 45,
      total: 100
    },
    {
      id: 7,
      name: 'The Insight Bringer',
      description: 'Diberikan kepada penguji aktif selama tahap beta TourJateng.',
      icon: '💎',
      color: 'from-cyan-400 to-cyan-600',
      earned: false,
      limited: true
    }
  ]

  // Fetch banners from Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoadingBanners(true)
        
        // Fetch all banners
        const { data: allBanners, error: bannersError } = await supabase
          .from('banners')
          .select('*')
          .order('created_at', { ascending: false })

        if (bannersError) {
          console.error('Error fetching banners:', bannersError)
          return
        }

        // Fetch user's earned banners if user is logged in
        if (user) {
          const { data: userBanners, error: userBannersError } = await supabase
            .from('user_banners')
            .select('banner_id, earned_at')
            .eq('user_id', user.id)

          if (userBannersError) {
            console.error('Error fetching user banners:', userBannersError)
          }

          // Get user activity stats for progress calculation
          let forumPostsCount = 0
          let activeDaysCount = 0
          
          try {
            // Fetch forum posts count
            const { data: forumPosts, error: forumError } = await supabase
              .from('forum_posts')
              .select('id')
              .eq('author_id', user.id)

            if (forumError) {
              console.error('Error fetching forum posts:', forumError)
              // Fallback: try user_id if author_id doesn't work
              const { data: forumPostsAlt } = await supabase
                .from('forum_posts')
                .select('id')
                .eq('user_id', user.id)
              
              forumPostsCount = forumPostsAlt?.length || 0
            } else {
              forumPostsCount = forumPosts?.length || 0
            }
            
            // Calculate active days (days since registration)
            const { data: userData } = await supabase
              .from('users')
              .select('created_at')
              .eq('id', user.id)
              .single()
            
            if (userData?.created_at) {
              const createdDate = new Date(userData.created_at)
              const today = new Date()
              const diffTime = Math.abs(today.getTime() - createdDate.getTime())
              activeDaysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }
          } catch (error) {
            console.error('Error in activity stats fetch:', error)
            forumPostsCount = 0
            activeDaysCount = 0
          }

          console.log('📊 User stats:', { forumPosts: forumPostsCount, activeDays: activeDaysCount })

          // Merge data and auto-award if requirements met
          const bannersWithEarned = allBanners?.map((banner: any) => {
            const earned = userBanners?.find((ub: any) => ub.banner_id === banner.id)
            
            // Auto-award free banners
            const isFree = banner.banner_type?.toLowerCase() === 'free'
            
            // Calculate progress for premium banners
            let progress = 0
            let total = banner.requirement_value || 0
            let shouldAutoAward = false
            
            if (banner.banner_type?.toLowerCase() === 'premium') {
              if (banner.requirement_type === 'forum_posts') {
                progress = forumPostsCount
                console.log(`🎯 Banner "${banner.name}": ${progress}/${total} forum posts`)
              } else if (banner.requirement_type === 'active_7days') {
                progress = Math.min(activeDaysCount, total)
                console.log(`🎯 Banner "${banner.name}": ${progress}/${total} active days`)
              } else if (banner.requirement_type === 'active_30days') {
                progress = Math.min(activeDaysCount, total)
                console.log(`🎯 Banner "${banner.name}": ${progress}/${total} active days`)
              }
              
              // Check if should auto-award
              if (progress >= total && !earned) {
                shouldAutoAward = true
                console.log(`✅ Auto-awarding banner: ${banner.name}`)
                
                // Award in background
                supabase
                  .from('user_banners')
                  .insert({
                    user_id: user.id,
                    banner_id: banner.id
                  })
                  .then(({ error }) => {
                    if (error && error.code !== '23505') { // Ignore duplicate errors
                      console.error('Error auto-awarding banner:', error)
                    }
                  })
              }
            }
            
            return {
              ...banner,
              earned_at: earned?.earned_at || (isFree ? new Date().toISOString() : null) || (shouldAutoAward ? new Date().toISOString() : null),
              progress: banner.banner_type?.toLowerCase() === 'premium' ? progress : undefined,
              total: banner.banner_type?.toLowerCase() === 'premium' ? total : undefined
            }
          }) || []

          setBanners(bannersWithEarned)
        } else {
          // For non-logged in users, just show free banners as available
          const bannersWithStatus = allBanners?.map((banner: any) => ({
            ...banner,
            earned_at: banner.banner_type?.toLowerCase() === 'free' ? new Date().toISOString() : null,
            progress: banner.banner_type?.toLowerCase() === 'premium' ? 0 : undefined,
            total: banner.banner_type?.toLowerCase() === 'premium' ? banner.requirement_value : undefined
          })) || []
          
          setBanners(bannersWithStatus)
        }
      } catch (error) {
        console.error('Error in fetchBanners:', error)
      } finally {
        setLoadingBanners(false)
      }
    }

    fetchBanners()
  }, [user])

  useEffect(() => {
    const savedBadge = localStorage.getItem('selectedBadge')
    if (savedBadge) {
      setSelectedBadge(savedBadge)
    }
    const savedBanner = localStorage.getItem('selectedBanner')
    if (savedBanner) {
      setSelectedBanner(savedBanner)
    }
  }, [])

  const handleSelectBadge = async (badgeId: string) => {
    setSelectedBadge(badgeId)
    localStorage.setItem('selectedBadge', badgeId)
    setShowBadgesModal(false)
    
    // Update user's active badge in database
    if (user) {
      await supabase
        .from('users')
        .update({ active_badge_id: badgeId })
        .eq('id', user.id)
      
      // Trigger event to refresh forum posts
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('badgeUpdated'))
      }
    }
  }

  const handleSelectBanner = async (bannerId: string) => {
    setSelectedBanner(bannerId)
    localStorage.setItem('selectedBanner', bannerId)
    setShowBannersModal(false)
    
    // Update user's active banner in database
    if (user) {
      await supabase
        .from('users')
        .update({ active_banner_id: bannerId })
        .eq('id', user.id)
    }
  }

  const getSelectedBadgeData = () => {
    return badges.find(badge => badge.id === selectedBadge)
  }

  const getSelectedBannerData = () => {
    return banners.find(banner => banner.id === selectedBanner)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="animate-pulse flex w-full">
          <div className="w-80 bg-white p-6">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
          </div>
          <div className="flex-1 p-8">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-white rounded-lg"></div>
              ))}
            </div>
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
              <span className="font-medium text-sm sm:text-base">Beranda</span>
            </Link>

            <Link href="/destinasi" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Destinasi Wisata</span>
            </Link>

            <Link href="/forum" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Forum Diskusi</span>
            </Link>

            <Link href="/artikel" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Artikel</span>
            </Link>

            <Link href="/chatbot" className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Chatbot AI</span>
            </Link>

            <div>
              <div className="px-4 py-2 text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wider">
                PROFILE
              </div>
              
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">Profil Saya</span>
              </Link>

              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-blue-600 text-white rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">Achievement</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Achievement & Badges</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Kumpulkan badge dan banner eksklusif dengan menyelesaikan berbagai aktivitas di TourJateng</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 sm:mb-8">
            <div className="flex gap-3 sm:gap-4 justify-center">
              <button 
                onClick={() => setActiveTab('badges')}
                className={`px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
                  activeTab === 'badges' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Lencana
              </button>
              <button 
                onClick={() => setActiveTab('banners')}
                className={`px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg text-sm sm:text-base font-medium transition-all ${
                  activeTab === 'banners' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Banner
              </button>
            </div>
          </div>

          {/* Badges Content */}
          {activeTab === 'badges' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {loadingBadges ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : badges.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Belum ada lencana tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`relative bg-gradient-to-br from-blue-50 to-indigo-100 border-2 p-6 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-lg flex flex-col ${
                        badge.earned_at && (!badge.total || (badge.progress || 0) >= badge.total)
                          ? 'border-gray-300 hover:border-blue-300' 
                          : 'border-gray-200 opacity-60'
                      }`}
                      onClick={() => {
                        setSelectedBadgeDetail(badge)
                        setShowBadgeDetailModal(true)
                      }}
                    >
                      {/* Badge Icon */}
                      <div className="flex justify-center mb-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                          badge.earned_at ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <img src={badge.icon_url} alt={badge.name} className="w-16 h-16 object-contain" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">🏅</span>'
                            }}
                          />
                        </div>
                      </div>

                      {/* Badge Title */}
                      <h3 className={`text-center font-semibold text-base sm:text-lg mb-3 sm:mb-4 flex items-center justify-center ${
                        badge.earned_at ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {badge.name}
                      </h3>

                      {/* Progress Bar - show if not completed or if still in progress */}
                      {badge.total !== undefined && badge.total > 0 && (!badge.earned_at || (badge.progress || 0) < badge.total) && (
                        <div className="mt-auto">
                          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                            <span>Progress</span>
                            <span>{badge.progress || 0}/{badge.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${badge.total > 0 ? Math.min(((badge.progress || 0) / badge.total) * 100, 100) : 0}%` }}
                            ></div>
                          </div>
                          <p className="text-gray-500 text-xs mt-2">
                            {badge.requirement_type === 'forum_posts' && `Buat ${badge.total} postingan forum`}
                            {badge.requirement_type === 'comment_likes' && `Berikan ${badge.total} like ke komentar`}
                            {badge.requirement_type === 'active_7days' && `Aktif selama ${badge.total} hari`}
                            {badge.requirement_type === 'active_30days' && `Aktif selama ${badge.total} hari`}
                          </p>
                        </div>
                      )}

                      {/* Premium Badge Tag */}
                      {badge.badge_type?.toLowerCase() === 'premium' && (
                        <div className="absolute top-3 right-3">
                          <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            PREMIUM
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Banners Content */}
          {activeTab === 'banners' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {loadingBanners ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Belum ada banner tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className={`relative h-48 rounded-xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-all duration-200 ${
                        !banner.earned_at ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      onClick={() => {
                        setSelectedBannerDetail(banner)
                        setShowBannerDetailModal(true)
                      }}
                    >
                      {/* Banner Image Background */}
                      <div className="absolute inset-0">
                        <img 
                          src={banner.image_url} 
                          alt={banner.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback gradient if image fails to load
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.parentElement!.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600')
                          }}
                        />
                        <div className="bg-black"></div>
                      </div>
                      
                      {/* Overlay for hover effect */}
                      <div className="group-hover:bg-black/5 transition-colors"></div>
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col justify-between p-6">
                        {/* Top Section - Premium Badge & Selected Indicator */}
                        <div className="flex items-start justify-between">
                          {banner.banner_type?.toLowerCase() === 'premium' && (
                            <div className="inline-flex items-center px-3 p
                            y-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              PREMIUM
                            </div>
                          )}
                          
                        </div>
                        
                        {/* Bottom Section - Banner Name */}
                        <div>
                          <h3 className="text-3xl font-bold text-white drop-shadow-lg mb-3">{banner.name}</h3>
                          
                          {/* Progress Bar for Premium Locked Banners */}
                          {!banner.earned_at && banner.banner_type?.toLowerCase() === 'premium' && banner.progress !== undefined && banner.total !== undefined && (
                            <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/20">
                              <div className="flex justify-between text-white text-xs mb-2">
                                <span className="font-medium">Progress</span>
                                <span className="font-bold">{banner.progress}/{banner.total}</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min((banner.progress / banner.total) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <p className="text-white/80 text-xs mt-2">
                                {banner.requirement_type === 'forum_posts' && `Buat ${banner.total} postingan forum`}
                                {banner.requirement_type === 'active_7days' && `Aktif selama ${banner.total} hari`}
                                {banner.requirement_type === 'active_30days' && `Aktif selama ${banner.total} hari`}
                              </p>
                            </div>
                          )}
                          
                          {/* Earned Date for Unlocked Banners */}
                          {banner.earned_at && (
                            <div className="flex items-center text-white/90 text-sm">
                              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Diperoleh: {new Date(banner.earned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {showBadgeDetailModal && selectedBadgeDetail && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowBadgeDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full p-4 sm:p-6 relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowBadgeDetailModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Badge Icon */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ${
                selectedBadgeDetail.earned_at ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <img 
                  src={selectedBadgeDetail.icon_url} 
                  alt={selectedBadgeDetail.name} 
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl sm:text-6xl">🏅</span>'
                  }}
                />
              </div>
            </div>

            {/* Badge Name */}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-1.5 sm:mb-2">
              {selectedBadgeDetail.name}
            </h2>

            {/* Badge Type */}
            {selectedBadgeDetail.badge_type && (
              <div className="flex justify-center mb-3 sm:mb-4">
                <span className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                  selectedBadgeDetail.badge_type.toLowerCase() === 'premium' 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedBadgeDetail.badge_type.toUpperCase()}
                </span>
              </div>
            )}

            {/* Badge Description */}
            <p className="text-gray-600 text-center mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm">
              {selectedBadgeDetail.description}
            </p>

            {/* Progress Section */}
            {selectedBadgeDetail.total !== undefined && selectedBadgeDetail.total > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-bold">{selectedBadgeDetail.progress || 0}/{selectedBadgeDetail.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div 
                    className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                      selectedBadgeDetail.earned_at 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ 
                      width: `${selectedBadgeDetail.total > 0 ? Math.min(((selectedBadgeDetail.progress || 0) / selectedBadgeDetail.total) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <p className="text-gray-500 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
                  {selectedBadgeDetail.requirement_type === 'forum_posts' && `Buat ${selectedBadgeDetail.total} postingan forum`}
                  {selectedBadgeDetail.requirement_type === 'comment_likes' && `Berikan ${selectedBadgeDetail.total} like ke komentar`}
                  {selectedBadgeDetail.requirement_type === 'active_7days' && `Aktif selama ${selectedBadgeDetail.total} hari`}
                  {selectedBadgeDetail.requirement_type === 'active_30days' && `Aktif selama ${selectedBadgeDetail.total} hari`}
                  {selectedBadgeDetail.requirement_type === 'first_login' && 'Login pertama kali'}
                  {selectedBadgeDetail.requirement_type === 'admin_grant' && 'Diberikan oleh admin'}
                </p>
              </div>
            )}

            {/* Earned Status */}
            {selectedBadgeDetail.earned_at ? (
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 text-green-700 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-xs sm:text-sm">Lencana Terbuka</span>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2">
                  Diperoleh: {new Date(selectedBadgeDetail.earned_at).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            ) : (
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-full">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-semibold text-xs sm:text-sm">Lencana Terkunci</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowBadgeDetailModal(false)}
                className="flex-1 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Detail Modal */}
      {showBannerDetailModal && selectedBannerDetail && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={() => setShowBannerDetailModal(false)}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-sm sm:max-w-md md:max-w-lg w-full overflow-hidden relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowBannerDetailModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black/30 rounded-full p-1.5 sm:p-2 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Banner Image */}
            <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
              <img 
                src={selectedBannerDetail.image_url} 
                alt={selectedBannerDetail.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600')
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              {/* Banner Name on Image */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg mb-1.5 sm:mb-2">
                  {selectedBannerDetail.name}
                </h2>
                {selectedBannerDetail.banner_type && (
                  <span className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                    selectedBannerDetail.banner_type.toLowerCase() === 'premium' 
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                      : 'bg-white/90 text-gray-800'
                  }`}>
                    {selectedBannerDetail.banner_type.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Banner Content */}
            <div className="p-4 sm:p-5 md:p-6">
              {/* Banner Description */}
              <p className="text-gray-600 text-center mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm">
                {selectedBannerDetail.description}
              </p>

              {/* Progress Section */}
              {!selectedBannerDetail.earned_at && selectedBannerDetail.banner_type?.toLowerCase() === 'premium' && 
               selectedBannerDetail.progress !== undefined && selectedBannerDetail.total !== undefined && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2">
                    <span className="font-medium">Progress</span>
                    <span className="font-bold">{selectedBannerDetail.progress}/{selectedBannerDetail.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((selectedBannerDetail.progress / selectedBannerDetail.total) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
                    {selectedBannerDetail.requirement_type === 'forum_posts' && `Buat ${selectedBannerDetail.total} postingan forum`}
                    {selectedBannerDetail.requirement_type === 'active_7days' && `Aktif selama ${selectedBannerDetail.total} hari`}
                    {selectedBannerDetail.requirement_type === 'active_30days' && `Aktif selama ${selectedBannerDetail.total} hari`}
                  </p>
                </div>
              )}

              {/* Earned Status */}
              {selectedBannerDetail.earned_at ? (
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 text-green-700 rounded-full">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold text-xs sm:text-sm">Banner Terbuka</span>
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1.5 sm:mt-2">
                    Diperoleh: {new Date(selectedBannerDetail.earned_at).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              ) : (
                <div className="text-center mb-4 sm:mb-6">
                  <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-full">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-semibold text-xs sm:text-sm">Banner Terkunci</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setShowBannerDetailModal(false)}
                  className="flex-1 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 transition-colors"
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

export default function BadgesPage() {
  return (
    <ProtectedRoute>
      <BadgesContent />
    </ProtectedRoute>
  )
}