'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Clock, User, Send, ThumbsUp, ChevronDown, Plus, Image, X, Heart } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { filterProfanity, containsProfanity } from '@/lib/profanity-filter'

interface Badge {
  id: string
  name: string
  description: string
  icon_url: string
}

interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  author_id: string
  category: string
  created_at: string
  is_active: boolean
  userBadge?: Badge | null
}

interface Comment {
  id: string
  post_id: string
  content: string
  author: string
  author_id: string
  created_at: string
  image_url?: string
  likes_count: number
  isLikedByUser?: boolean
  avatar_url?: string
  userBadge?: Badge | null
}

export default function ForumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showProfanityWarning, setShowProfanityWarning] = useState(false)
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'warning'}>>([])
  const [commentLikes, setCommentLikes] = useState<{[key: string]: boolean}>({})
  const [likingComments, setLikingComments] = useState<{[key: string]: boolean}>({})

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

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      addToast('Anda harus login untuk menyukai komentar', 'warning')
      return
    }

    if (likingComments[commentId]) {
      return // Prevent double clicking
    }

    setLikingComments(prev => ({ ...prev, [commentId]: true }))

    try {
      const comment = comments.find(c => c.id === commentId)
      if (!comment) return

      if (comment.isLikedByUser) {
        // Unlike comment
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (error) throw error

        // Update local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, likes_count: Math.max(0, c.likes_count - 1), isLikedByUser: false }
            : c
        ))
      } else {
        // Like comment
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          })

        if (error) throw error

        // Update local state
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, likes_count: c.likes_count + 1, isLikedByUser: true }
            : c
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      addToast('Gagal menyukai komentar', 'error')
    } finally {
      setLikingComments(prev => ({ ...prev, [commentId]: false }))
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchPostAndComments()
    }
  }, [params.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.status-dropdown')) {
        setShowStatusDropdown(false)
      }
    }

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusDropdown])

  const fetchPostAndComments = async () => {
    try {
      setLoading(true)
      
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', params.id)
        .single()

      if (postError) {
        console.error('Error fetching post:', postError)
        if (postError.code === '42P01') {
          console.warn('Forum posts table does not exist')
          return
        }
        throw postError
      }
      
      // Update post author name and badge from users
      let updatedPost = postData
      if (postData) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, active_badge_id')
            .eq('id', postData.author_id)
            .single()
          
          if (profile?.full_name) {
            updatedPost = { ...postData, author: profile.full_name }
          }
          
          // Fetch the badge if user has one selected
          if (profile?.active_badge_id) {
            const { data: badgeData } = await supabase
              .from('badges')
              .select('*')
              .eq('id', profile.active_badge_id)
              .single()
            
            if (badgeData) {
              updatedPost = { ...updatedPost, userBadge: badgeData }
            }
          }
        } catch (profileError) {
          console.warn('Could not fetch profile for post author:', profileError)
        }
      }
      setPost(updatedPost)

      // Fetch comments with likes data
      const { data: commentsData, error: commentsError } = await supabase
        .from('forum_comments')
        .select('*, likes_count')
        .eq('post_id', params.id)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('Error fetching comments:', commentsError)
        if (commentsError.code === '42P01') {
          console.warn('Forum comments table does not exist')
          setComments([])
          return
        }
        if (commentsError.code === '42703') {
          console.warn('Forum comments table structure needs update')
          setComments([])
          return
        }
        throw commentsError
      }
      
      // Update comment author names, check likes, and fetch badges
      const updatedComments = await Promise.all(
        (commentsData || []).map(async (comment) => {
          try {
            // Fetch profile with badge
            const { data: profile } = await supabase
              .from('users')
              .select('full_name, avatar_url, active_badge_id')
              .eq('id', comment.author_id)
              .single()
            
            // Fetch the badge if user has one selected
            let userBadge: Badge | null = null
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
            
            // Check if current user liked this comment
            let isLikedByUser = false
            if (user) {
              const { data: likeData } = await supabase
                .from('comment_likes')
                .select('id')
                .eq('comment_id', comment.id)
                .eq('user_id', user.id)
                .single()
              
              isLikedByUser = !!likeData
            }
            
            const updatedComment = {
              ...comment,
              author: profile?.full_name || comment.author,
              avatar_url: profile?.avatar_url || '',
              likes_count: comment.likes_count || 0,
              isLikedByUser,
              userBadge
            }
            
            return updatedComment
          } catch (profileError) {
            console.warn('Could not fetch profile for comment author:', profileError)
            return {
              ...comment,
              likes_count: comment.likes_count || 0,
              isLikedByUser: false,
              avatar_url: '',
              userBadge: null
            }
          }
        })
      )
      
      setComments(updatedComments)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't show alert here as it would be annoying, just log the error
      setComments([]) // Set empty comments array as fallback
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
  }

  const processImageFile = (file: File) => {
    // Check if file is image
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      addToast('Hanya file gambar (JPG, PNG, GIF, WebP) yang diizinkan!', 'error')
      return
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Ukuran file maksimal 5MB!', 'error')
      return
    }
    
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processImageFile(files[0])
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadProgress(0)
    setIsUploading(false)
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewComment(value)
    
    // Cek profanity real-time
    if (value.trim() && containsProfanity(value)) {
      setShowProfanityWarning(true)
    } else {
      setShowProfanityWarning(false)
    }
  }

  const closeCommentModal = () => {
    setShowCommentModal(false)
    setNewComment('')
    setSelectedImage(null)
    setImagePreview(null)
    setIsDragOver(false)
    setUploadProgress(0)
    setIsUploading(false)
    setShowProfanityWarning(false)
  }

  const handleToggleStatus = async (newStatus: boolean) => {
    if (!user || !post || post.author_id !== user.id) {
      return
    }

    try {
      setUpdatingStatus(true)
      setShowStatusDropdown(false)
      
      const { error } = await supabase
        .from('forum_posts')
        .update({ is_active: newStatus })
        .eq('id', params.id)

      if (error) throw error

      // Update local state
      setPost(prev => prev ? { ...prev, is_active: newStatus } : null)
      
      addToast(newStatus ? 'Status forum berhasil diubah menjadi Aktif' : 'Status forum berhasil diubah menjadi Selesai', 'success')
    } catch (error) {
      console.error('Error updating status:', error)
      addToast('Gagal mengubah status forum. Silakan coba lagi.', 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!post?.is_active) {
      addToast('Forum ini sudah selesai. Tidak dapat menambahkan komentar baru.', 'warning')
      return
    }

    if (!newComment.trim() && !selectedImage) {
      addToast('Komentar harus diisi!', 'warning')
      return
    }

    if (!newComment.trim() && selectedImage) {
      addToast('Komentar teks harus diisi jika ingin mengunggah gambar!', 'warning')
      return
    }

    try {
      setSubmitting(true)
      
      // Get user profile
      let authorName = 'User'
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        authorName = profile?.full_name || user.email?.split('@')[0] || 'User'
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError)
        authorName = user.email?.split('@')[0] || 'User'
      }

      let imageUrl = null
      
      // Upload image to storage only if there's text content
      if (selectedImage && newComment.trim()) {
        try {
          setIsUploading(true)
          setUploadProgress(0)
          
          const fileExt = selectedImage.name.split('.').pop()
          const fileName = `${user.id}-${Date.now()}.${fileExt}`
          
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
          }, 100)
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('forum-images')
            .upload(fileName, selectedImage)
          
          clearInterval(progressInterval)
          setUploadProgress(100)
          
          if (uploadError) {
            console.error('Image upload error:', uploadError)
            throw uploadError
          } else {
            const { data: urlData } = supabase.storage
              .from('forum-images')
              .getPublicUrl(uploadData.path)
            imageUrl = urlData.publicUrl
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError)
          addToast('Gagal mengupload gambar. Komentar akan dikirim tanpa gambar.', 'error')
          imageUrl = null
        } finally {
          setIsUploading(false)
          setUploadProgress(0)
        }
      } else if (selectedImage && !newComment.trim()) {
        // If only image without text, don't save to storage
        console.log('Gambar tidak disimpan ke storage karena tidak ada teks komentar')
        imageUrl = null
      }

      // Filter profanity dari komentar
      const filteredContent = newComment.trim() ? filterProfanity(newComment.trim()) : null

      // Insert comment - only include image_url if there's text content
      const commentData = {
        post_id: params.id,
        content: filteredContent,
        author: authorName,
        author_id: user.id,
        ...(imageUrl && newComment.trim() && { image_url: imageUrl })
      }

      const { error: insertError } = await supabase
        .from('forum_comments')
        .insert([commentData])

      if (insertError) {
        console.error('Comment insert error:', insertError)
        throw insertError
      }

      // Close modal and refresh data
      closeCommentModal()
      await fetchPostAndComments()
      addToast('Komentar berhasil dikirim!', 'success')
      
    } catch (error: any) {
      console.error('Error submitting comment:', error)
      
      // More specific error messages
      if (error?.code === '42P01') {
        addToast('Tabel komentar belum dibuat. Silakan setup database terlebih dahulu.', 'error')
      } else if (error?.code === '42703') {
        addToast('Struktur database perlu diperbaiki. Silakan jalankan fix-forum-comments-error.sql', 'error')
      } else {
        addToast('Gagal mengirim komentar. Silakan coba lagi.', 'error')
      }
    } finally {
      setSubmitting(false)
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
    if (diffHours < 24) return `${diffHours} hari yang lalu`
    return `${diffDays} hari yang lalu`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center px-3">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Memuat diskusi...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center px-3">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">Diskusi tidak ditemukan</p>
          <button
            onClick={() => router.push('/forum')}
            className="mt-3 sm:mt-4 text-sm sm:text-base text-blue-600 hover:underline"
          >
            Kembali ke Forum
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/forum')}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            Kembali ke Forum
          </button>
        </div>

        {/* Post Content and Comments in One Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-4 sm:mb-6">
            {post.title}
          </h1>

          {/* Status and Meta Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            {/* Status Badge */}
            <div className={`flex items-center gap-1.5 sm:gap-2 font-medium ${
              post.is_active ? 'text-blue-600' : 'text-green-600'
            }`}>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                post.is_active ? 'bg-blue-600' : 'bg-green-600'
              }`}></div>
              <span>{post.is_active ? 'Aktif' : 'Selesai'}</span>
            </div>

            <span className="hidden sm:inline">•</span>
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
            {user && post.author_id === user.id && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-yellow-600 font-medium">Pembuat Topik</span>
              </>
            )}
            <span className="hidden sm:inline">•</span>
            <span>{post.category}</span>
          </div>

          {/* Content */}
          <div className="prose max-w-none text-sm sm:text-base text-gray-700 leading-relaxed mb-6 sm:mb-8">
            <div className="whitespace-pre-wrap">{post.content}</div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8">
            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Komentar
                </h2>
                <span className="bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                  {comments.length}
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                {user && post.is_active && (
                  <button
                    onClick={() => setShowCommentModal(true)}
                    className="hidden sm:flex flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden md:inline">Tambah Komentar</span>
                    <span className="md:hidden">Tambah</span>
                  </button>
                )}

                {user && post.author_id === user.id && (
                <div className="relative status-dropdown flex-1 sm:flex-none">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    disabled={updatingStatus}
                    className={`w-full sm:w-auto px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg font-medium transition-colors border flex items-center justify-center gap-1.5 sm:gap-2 ${
                      post.is_active 
                        ? 'border-blue-300 text-blue-700 hover:bg-blue-50' 
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updatingStatus ? (
                      <span className="text-xs sm:text-sm">Mengubah...</span>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm">
                          <span className="hidden md:inline">{post.is_active ? 'Tandai Selesai' : 'Tandai Aktif'}</span>
                          <span className="md:hidden">{post.is_active ? 'Selesai' : 'Aktif'}</span>
                        </span>
                        <ChevronDown size={12} className={`sm:w-[14px] sm:h-[14px] transition-transform ${
                          showStatusDropdown ? 'rotate-180' : ''
                        }`} />
                      </>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showStatusDropdown && !updatingStatus && (
                    <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleToggleStatus(true)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                            post.is_active ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                        >
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <div>
                            <div className="font-medium">Aktif</div>
                            <div className="text-xs text-gray-500">Diskusi terbuka untuk komentar</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(false)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                            !post.is_active ? 'text-green-600 bg-green-50' : 'text-gray-700'
                          }`}
                        >
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <div>
                            <div className="font-medium">Selesai</div>
                            <div className="text-xs text-gray-500">Diskusi ditutup, tidak menerima komentar</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {!user && (
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-center ${
                post.is_active ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
              {post.is_active ? (
                <>
                  <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">Silakan login untuk berkomentar</p>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm sm:text-base text-gray-700 mb-1 sm:mb-2 font-medium">Diskusi Telah Selesai</p>
                  <p className="text-xs sm:text-sm text-gray-600">Forum ini sudah ditandai selesai. Silakan login untuk melihat diskusi lainnya.</p>
                  <button
                    onClick={() => router.push('/login')}
                    className="mt-2 sm:mt-3 px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Login
                  </button>
                </>
                )}
              </div>
            )}

            {user && !post.is_active && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm sm:text-base text-green-700 mb-1 sm:mb-2 font-medium">Diskusi Telah Selesai</p>
                <p className="text-xs sm:text-sm text-green-600">Forum ini sudah ditandai selesai oleh pembuat topik. Tidak dapat menambahkan komentar baru.</p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-1">
            {comments.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <MessageCircle className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-3" />
                <p className="text-sm sm:text-base text-gray-600 mb-1">Belum ada komentar</p>
                <p className="text-xs sm:text-sm text-gray-500">Jadilah yang pertama berkomentar di diskusi ini!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="py-3 sm:py-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
                        {comment.avatar_url ? (
                          <img 
                            src={comment.avatar_url} 
                            alt={comment.author} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            {comment.author.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="font-medium text-sm sm:text-base text-gray-900 truncate max-w-[120px] sm:max-w-none">
                          {comment.author}
                        </span>
                        {comment.userBadge && (
                          <img 
                            src={comment.userBadge.icon_url}
                            alt={comment.userBadge.name}
                            title={comment.userBadge.name}
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain flex-shrink-0"
                          />
                        )}
                        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-500">
                          <Clock size={10} className="sm:w-3 sm:h-3" />
                          <span>{getRelativeTime(comment.created_at)}</span>
                        </div>
                      </div>
                      {comment.content && (
                        <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap mb-2 leading-relaxed">
                          {comment.content}
                        </p>
                      )}
                      {comment.image_url && (
                        <div className="mt-2">
                          <img 
                            src={comment.image_url} 
                            alt="Gambar komentar" 
                            className="max-w-full sm:max-w-sm w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity object-cover"
                            onClick={() => window.open(comment.image_url, '_blank')}
                            style={{ maxHeight: '150px', maxWidth: '250px' }}
                          />
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                            Klik untuk melihat ukuran penuh
                          </p>
                        </div>
                      )}
                      
                      {/* Like Button */}
                      <div className="flex items-center gap-2 mt-2 sm:mt-3">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          disabled={likingComments[comment.id]}
                          className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 ${
                            comment.isLikedByUser
                              ? 'text-pink-600 bg-pink-50 hover:bg-pink-100'
                              : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'
                          } ${likingComments[comment.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <Heart 
                            size={14} 
                            className={`sm:w-4 sm:h-4 transition-all duration-200 ${
                              comment.isLikedByUser ? 'fill-pink-600 text-pink-600' : 'fill-none'
                            } ${likingComments[comment.id] ? 'animate-pulse' : ''}`} 
                          />
                          {comment.likes_count > 0 && (
                            <span className="text-xs sm:text-sm font-medium">
                              {comment.likes_count}
                            </span>
                          )}
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Tambah Komentar</h2>
                <button
                  onClick={closeCommentModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Text Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Komentar <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Tulis komentar Anda... (wajib diisi)"
                    rows={4}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none text-black ${
                      showProfanityWarning 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  
                  {/* Profanity Warning */}
                  {showProfanityWarning && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 mb-2">
                        <span className="font-medium">⚠️ Peringatan:</span> Komentar mengandung kata yang tidak pantas. 
                        Kata tersebut akan otomatis disensor menjadi *** saat dikirim.
                      </p>
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500 mb-1">Preview hasil filter:</p>
                        <p className="text-sm text-gray-700">
                          "{filterProfanity(newComment)}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Gambar/GIF (Opsional)
                  </label>
                  

                  
                  {!selectedImage ? (
                    <div 
                      className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
                        isDragOver 
                          ? 'border-blue-400 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Image className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 ${
                        isDragOver ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-sm sm:text-base text-blue-600 font-medium hover:text-blue-700">
                          Klik untuk pilih gambar
                        </span>
                        <span className="text-sm sm:text-base text-gray-500"> atau drag & drop disini</span>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                        JPG, PNG, GIF, WebP hingga 5MB
                      </p>
                      {isDragOver && (
                        <p className="text-xs sm:text-sm text-blue-600 mt-2 font-medium">
                          Lepaskan file disini
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <img
                          src={imagePreview!}
                          alt="Preview"
                          className="max-w-full h-auto rounded-lg border border-gray-200 object-cover mx-auto"
                          style={{ maxHeight: '150px', maxWidth: '250px' }}
                        />
                        {!isUploading && (
                          <button
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                              <p className="text-sm">Uploading... {uploadProgress}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Upload Progress Bar */}
                      {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                      
                      {/* File Info */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="truncate mr-2">{selectedImage?.name}</span>
                        <span>{((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    onClick={closeCommentModal}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmitComment}
                    disabled={submitting || isUploading || !newComment.trim()}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                    {submitting ? 'Mengirim...' : isUploading ? 'Mengupload...' : 'Kirim Komentar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      {user && post?.is_active && (
        <div className="fixed bottom-4 right-4 sm:hidden z-40">
          <button
            onClick={() => setShowCommentModal(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center hover:scale-105"
          >
            <Plus size={20} className="sm:w-6 sm:h-6" />
          </button>
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
