'use client'
import { useState, useEffect } from 'react'
import { Search, MessageCircle, Clock, User, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  author_id: string
  category: string
  created_at: string
  comments_count: number
  is_active: boolean
}

interface Badge {
  id: string
  name: string
  description: string
  icon_url: string
}

interface PostWithBadge extends ForumPost {
  userBadge?: Badge | null
}

export default function ForumPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<PostWithBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'Alam'
  })
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'warning'}>>([])

  // Function to add toast notification
  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    const toastId = Date.now().toString()
    const newToast = {
      id: toastId,
      message,
      type
    }
    setToasts(prev => [...prev, newToast])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }, 5000)
  }

  useEffect(() => {
    fetchPosts()
    
    // Set up real-time subscription for forum posts updates
    const channel = supabase
      .channel('forum-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'forum_posts',
          filter: 'is_active=neq.NULL'
        },
        (payload) => {
          console.log('Forum post updated:', payload)
          // Refresh posts when any post is updated (including status changes)
          fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Listen for badge selection changes and refresh posts
  useEffect(() => {
    const handleBadgeChange = () => {
      // Refresh posts to show updated badge for current user's posts
      fetchPosts()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('badgeUpdated', handleBadgeChange)
      return () => window.removeEventListener('badgeUpdated', handleBadgeChange)
    }
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.warn('Forum posts table does not exist')
          setPosts([])
          return
        }
        throw error
      }
      
      // Add user badges to posts and update author names from profiles
      const postsWithBadges: PostWithBadge[] = await Promise.all(
        (data || []).map(async (post) => {
          let userBadge: Badge | null = null
          let updatedAuthorName = post.author
          
          // Get the actual author name and badge from users table
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('full_name, active_badge_id')
              .eq('id', post.author_id)
              .single()
            
            console.log('Profile data for post:', post.id, profile)
            
            if (profile?.full_name) {
              updatedAuthorName = profile.full_name
            }
            
            // Fetch the badge if user has one selected
            if (profile?.active_badge_id) {
              const { data: badgeData } = await supabase
                .from('badges')
                .select('*')
                .eq('id', profile.active_badge_id)
                .single()
              
              console.log('Badge data for user:', post.author_id, badgeData)
              
              if (badgeData) {
                userBadge = badgeData
              }
            }
          } catch (profileError) {
            console.warn('Could not fetch profile for post author:', profileError)
            // Keep the original author name if profile fetch fails
          }
          
          return {
            ...post,
            author: updatedAuthorName,
            userBadge
          }
        })
      )
      
      console.log('Posts with badges:', postsWithBadges)
      
      setPosts(postsWithBadges)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      addToast('Judul dan konten harus diisi!', 'warning')
      return
    }

    try {
      // Check if forum_posts table exists by trying to count records first
      const { count, error: countError } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
      
      if (countError && countError.code === '42P01') {
        addToast('Tabel forum belum dibuat. Silakan setup database terlebih dahulu menggunakan forum-setup.sql', 'error')
        return
      }

      // Get user profile with fallback
      let authorName = 'Anonymous User'
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        // Use profile name if available, otherwise use email username
        if (profile?.full_name) {
          authorName = profile.full_name
        } else if (user.email) {
          authorName = user.email.split('@')[0]
        } else {
          authorName = 'User'
        }
      } catch (profileError) {
        console.warn('Could not fetch profile, using fallback name:', profileError)
        // If profile fetch fails, use email username or User as fallback
        if (user.email) {
          authorName = user.email.split('@')[0]
        } else {
          authorName = 'User'
        }
      }

      const { data: insertedPost, error } = await supabase
        .from('forum_posts')
        .insert([
          {
            title: newPost.title,
            content: newPost.content,
            author: authorName,
            author_id: user.id,
            category: newPost.category,
            is_active: true,
            comments_count: 0
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setShowCreateModal(false)
      setNewPost({ title: '', content: '', category: 'Alam' })
      
      // Add the new post to the current posts list with user's badge
      if (insertedPost) {
        // Fetch user's active badge
        let userBadge: Badge | null = null
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('active_badge_id')
            .eq('id', user.id)
            .single()
          
          if (profile?.active_badge_id) {
            const { data: badgeData } = await supabase
              .from('badges')
              .select('*')
              .eq('id', profile.active_badge_id)
              .single()
            
            if (badgeData) {
              userBadge = badgeData
            }
          }
        } catch (err) {
          console.warn('Could not fetch user badge:', err)
        }
        
        const newPostWithBadge: PostWithBadge = {
          ...insertedPost,
          userBadge
        }
        setPosts(prevPosts => [newPostWithBadge, ...prevPosts])
      } else {
        fetchPosts()
      }
      
      addToast('Diskusi berhasil dibuat!', 'success')
    } catch (error) {
      console.error('Error creating post:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
        addToast('Tabel forum belum ada. Jalankan forum-setup.sql terlebih dahulu.', 'error')
      } else {
        const errorMessage = error && typeof error === 'object' && 'message' in error 
          ? (error as any).message 
          : 'Terjadi kesalahan yang tidak diketahui'
        addToast('Gagal membuat diskusi: ' + errorMessage, 'error')
      }
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          
          {/* Search and Buttons Section */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 sm:w-48 md:w-64 lg:w-80 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari Topik"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Search on Enter key
                    }
                  }}
                  className="w-full pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
              </div>
              
              <button
                onClick={() => {
                  if (!user) {
                    router.push('/login')
                  } else {
                    setShowCreateModal(true)
                  }
                }}
                className="px-3 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium whitespace-nowrap"
              >
                Buat
              </button>
            </div>

            <button 
              onClick={() => setShowInfoModal(true)}
              className="px-2 sm:px-2.5 py-2 sm:py-2.5 border-2 border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors font-medium flex items-center gap-2 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px]">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Forum Posts */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Memuat diskusi...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <MessageCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Belum ada diskusi. Mulai diskusi pertama!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/forum/${post.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors flex-1 line-clamp-2 sm:line-clamp-1">
                        {post.title}
                      </h2>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          post.is_active ? 'bg-blue-600' : 'bg-green-600'
                        }`}></div>
                        <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                          post.is_active ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {post.is_active ? 'Aktif' : 'Selesai'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="truncate max-w-[120px] sm:max-w-none">Oleh {post.author}</span>
                        {post.userBadge && (
                          <img 
                            src={post.userBadge.icon_url}
                            alt={post.userBadge.name}
                            title={post.userBadge.name}
                            className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
                          />
                        )}
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm">{getRelativeTime(post.created_at)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-xs sm:text-sm">{post.category}</span>
                    </div>
                    
                    <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <span>{post.comments_count || 0} Komentar</span>
                  </div>
                  
                  <button 
                    className="px-4 sm:px-5 lg:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/forum/${post.id}`)
                    }}
                  >
                    Masuk
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Buat Diskusi Baru</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="transform rotate-45" size={20} />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Judul Diskusi
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Masukkan judul diskusi..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Kategori
                  </label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  >
                    <option value="Alam">Alam</option>
                    <option value="Budaya">Budaya</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Sejarah">Sejarah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Konten Diskusi
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Tulis konten diskusi Anda di sini..."
                    rows={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0 pt-2 sm:pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewPost({ title: '', content: '', category: 'Alam' })
                    }}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreatePost}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Posting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Panduan Forum Diskusi</h2>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="transform rotate-45" size={20} />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Status Diskusi */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Status Diskusi</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                      <span className="text-blue-600 font-medium text-sm sm:text-base">Aktif</span>
                      <span className="text-gray-700 text-xs sm:text-sm">- Diskusi masih berlangsung dan terbuka untuk komentar baru</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-600 rounded-full flex-shrink-0"></div>
                      <span className="text-green-600 font-medium text-sm sm:text-base">Selesai</span>
                      <span className="text-gray-700 text-xs sm:text-sm">- Diskusi telah diselesaikan atau ditutup</span>
                    </div>
                  </div>
                </div>

                {/* Cara Menggunakan Forum */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Cara Menggunakan Forum</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    
                    {/* Untuk Membaca Diskusi */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-sm sm:text-base font-semibold text-blue-600">📖 Membaca Diskusi</h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 flex-shrink-0">•</span>
                          <span>Gunakan kotak <strong>"Cari Topik"</strong> untuk mencari diskusi tertentu</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 flex-shrink-0">•</span>
                          <span>Klik judul diskusi atau tombol <strong>"Masuk"</strong> untuk membaca detail</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 flex-shrink-0">•</span>
                          <span>Lihat status diskusi dari indikator warna (biru = aktif, hijau = selesai)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 flex-shrink-0">•</span>
                          <span>Badge di samping nama menunjukkan pencapaian user</span>
                        </li>
                      </ul>
                    </div>

                    {/* Untuk Membuat Diskusi */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-sm sm:text-base font-semibold text-green-600">✏️ Membuat Diskusi</h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 flex-shrink-0">•</span>
                          <span>Klik tombol <strong>"Buat"</strong> untuk membuat diskusi baru</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 flex-shrink-0">•</span>
                          <span>Pastikan Anda sudah login terlebih dahulu</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 flex-shrink-0">•</span>
                          <span>Isi judul yang jelas dan deskriptif</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 flex-shrink-0">•</span>
                          <span>Pilih kategori yang sesuai (Alam, Budaya, Kuliner, dll)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 flex-shrink-0">•</span>
                          <span>Tulis konten diskusi dengan detail yang cukup</span>
                        </li>
                      </ul>
                    </div>

                    {/* Untuk Berkomentar */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-sm sm:text-base font-semibold text-purple-600">💬 Berkomentar</h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 flex-shrink-0">•</span>
                          <span>Masuk ke diskusi yang ingin dikomentari</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 flex-shrink-0">•</span>
                          <span>Scroll ke bagian bawah untuk melihat form komentar</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 flex-shrink-0">•</span>
                          <span>Tulis komentar yang relevan dan konstruktif</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 flex-shrink-0">•</span>
                          <span>Klik <strong>"Kirim Komentar"</strong> untuk memposting</span>
                        </li>
                      </ul>
                    </div>

                    {/* Tips dan Etika */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-sm sm:text-base font-semibold text-orange-600">🌟 Tips & Etika</h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>Gunakan bahasa yang sopan dan menghormati</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>Berikan informasi yang akurat dan bermanfaat</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>Jangan spam atau posting berulang-ulang</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>Berikan bantuan kepada sesama traveler</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500 flex-shrink-0">•</span>
                          <span>Share pengalaman wisata Anda di Jawa Tengah</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Kategori Diskusi */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Kategori Diskusi</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                    <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                      <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🌿</div>
                      <span className="text-xs sm:text-sm font-medium text-black">Alam</span>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                      <div className="text-xl sm:text-2xl mb-1 sm:mb-2">🏛️</div>
                      <span className="text-xs sm:text-sm font-medium text-black">Budaya</span>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                      <div className="text-xl sm:text-2xl mb-1 sm:mb-2 text-black">🍜</div>
                      <span className="text-xs sm:text-sm font-medium text-black">Kuliner</span>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                      <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📜</div>
                      <span className="text-xs sm:text-sm font-medium text-black">Sejarah</span>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                      <div className="text-xl sm:text-2xl mb-1 sm:mb-2">💡</div>
                      <span className="text-xs sm:text-sm font-medium text-black">Lainnya</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Ada pertanyaan atau masalah? Hubungi tim <strong>TourJateng</strong> melalui halaman kontak.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 sm:top-6 right-3 sm:right-6 z-50 flex flex-col gap-2 sm:gap-3 max-w-[calc(100vw-1.5rem)] sm:max-w-sm">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`${
              toast.type === 'success' ? 'bg-green-600' :
              toast.type === 'warning' ? 'bg-yellow-600' :
              'bg-red-600'
            } text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-2xl flex items-center gap-2 sm:gap-3`}>
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : toast.type === 'warning' ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium break-words">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
