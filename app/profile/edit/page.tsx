'use client'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function EditProfileContent() {
  const { user, userProfile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [activeMenu, setActiveMenu] = useState('profile')
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error'}>>([])
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [tempImage, setTempImage] = useState<string>('')
  const [imageScale, setImageScale] = useState(1)
  const [maxZoom, setMaxZoom] = useState(3)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, aspect: 1 })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    no_telepon: '',
    gender: '',
    id_number: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (userProfile && user) {
      const nameParts = userProfile.full_name?.split(' ') || ['', '']
      setFormData({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: user?.email || '',
        no_telepon: userProfile.no_telepon || '',
        gender: userProfile.gender || '',
        id_number: user.id, // Menggunakan ID dari Supabase user
        avatar_url: userProfile.avatar_url || ''
      })
      setAvatarPreview(userProfile.avatar_url || '')
    }
  }, [userProfile, user])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleGenderChange = (gender: string) => {
    setFormData({
      ...formData,
      gender: gender
    })
  }

  const handleCropConfirm = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const outputSize = 300
      canvas.width = outputSize
      canvas.height = outputSize
      
      if (ctx) {
        // Circular clip
        ctx.beginPath()
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        
        // Calculate proper positioning
        const containerWidth = 400 // Preview container width
        const containerHeight = 256 // Preview container height (h-64)
        const cropRadius = 100 // Circle radius in preview
        
        // Calculate scale factor from preview to output
        const scaleFactor = outputSize / (cropRadius * 2)
        
        // Image dimensions in preview
        const imgAspect = img.width / img.height
        let previewImgWidth = containerWidth
        let previewImgHeight = containerWidth / imgAspect
        
        if (previewImgHeight < containerHeight) {
          previewImgHeight = containerHeight
          previewImgWidth = containerHeight * imgAspect
        }
        
        // Apply user scale
        previewImgWidth *= imageScale
        previewImgHeight *= imageScale
        
        // Center point of preview container
        const centerX = containerWidth / 2
        const centerY = containerHeight / 2
        
        // Top-left corner of image in preview
        const imgLeft = centerX - previewImgWidth / 2 + imagePosition.x
        const imgTop = centerY - previewImgHeight / 2 + imagePosition.y
        
        // Crop area top-left in image coordinates
        const cropX = (centerX - cropRadius - imgLeft) / previewImgWidth * img.width
        const cropY = (centerY - cropRadius - imgTop) / previewImgHeight * img.height
        const cropSize = (cropRadius * 2) / previewImgWidth * img.width
        
        // Draw cropped portion
        ctx.drawImage(
          img,
          cropX, cropY, cropSize, cropSize, // Source
          0, 0, outputSize, outputSize // Destination
        )
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
            setAvatarFile(croppedFile)
            setAvatarPreview(canvas.toDataURL('image/jpeg', 0.95))
            setShowCropModal(false)
          }
        }, 'image/jpeg', 0.95)
      }
    }
    
    img.src = tempImage
  }

  const calculateBoundaries = (scale: number) => {
    const containerWidth = 400
    const containerHeight = 256
    const cropRadius = 100
    
    // Calculate image dimensions based on scale and actual aspect ratio
    const imgAspect = imageDimensions.aspect || 1
    let imgWidth = containerWidth
    let imgHeight = containerWidth / imgAspect
    
    if (imgHeight < containerHeight) {
      imgHeight = containerHeight
      imgWidth = containerHeight * imgAspect
    }
    
    // Apply scale
    imgWidth *= scale
    imgHeight *= scale
    
    // Max distance image can move before showing black
    // Image must always cover the crop circle
    const cropDiameter = cropRadius * 2
    const maxX = Math.max(0, (imgWidth - cropDiameter) / 2)
    const maxY = Math.max(0, (imgHeight - cropDiameter) / 2)
    
    return { maxX, maxY }
  }

  const constrainPosition = (x: number, y: number, scale: number) => {
    const { maxX, maxY } = calculateBoundaries(scale)
    
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      const constrained = constrainPosition(newX, newY, imageScale)
      setImagePosition(constrained)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - imagePosition.x, y: touch.clientY - imagePosition.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) {
      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y
      const constrained = constrainPosition(newX, newY, imageScale)
      setImagePosition(constrained)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar!', 'error')
      return
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB!', 'error')
      return
    }

    // Load image untuk crop modal
    const reader = new FileReader()
    reader.onloadend = () => {
      const imgData = reader.result as string
      setTempImage(imgData)
      
      // Calculate max zoom to prevent pixelation
      const img = new Image()
      img.onload = () => {
        const containerWidth = 400
        const containerHeight = 256
        const cropRadius = 100
        
        // Determine how image fits in container
        const imgAspect = img.width / img.height
        let fitWidth = containerWidth
        let fitHeight = containerWidth / imgAspect
        
        if (fitHeight < containerHeight) {
          fitHeight = containerHeight
          fitWidth = containerHeight * imgAspect
        }
        
        // Store image dimensions
        setImageDimensions({
          width: img.width,
          height: img.height,
          aspect: imgAspect
        })
        
        // Calculate max zoom where crop area doesn't exceed original image size
        const cropDiameter = cropRadius * 2
        const maxZoomX = fitWidth / cropDiameter
        const maxZoomY = fitHeight / cropDiameter
        const calculatedMaxZoom = Math.min(maxZoomX, maxZoomY, 3) // Cap at 3x
        
        setMaxZoom(Math.max(1, calculatedMaxZoom))
        setImageScale(1)
        setImagePosition({ x: 0, y: 0 })
        setShowCropModal(true)
      }
      img.src = imgData
    }
    reader.readAsDataURL(file)
    setAvatarFile(file)
    
    // Reset input
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi input
    if (!formData.first_name.trim()) {
      showToast('Nama depan tidak boleh kosong', 'error')
      return
    }
    
    if (!formData.last_name.trim()) {
      showToast('Nama belakang tidak boleh kosong', 'error')
      return
    }
    
    setSaving(true)

    try {
      let avatarUrl = formData.avatar_url

      // Upload foto profil jika ada file baru
      if (avatarFile) {
        setUploading(true)
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`
        const filePath = fileName

        // Upload ke Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error('Gagal mengupload foto: ' + uploadError.message)
        }

        // Dapatkan URL publik
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
        setUploading(false)
      }

      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim()
      
      // Prepare update data - only include fields that exist in the table
      const updateData: any = {
        full_name: fullName,
        avatar_url: avatarUrl
      }
      
      // Only add optional fields if they have values
      if (formData.no_telepon) {
        updateData.no_telepon = formData.no_telepon
      }
      if (formData.gender) {
        updateData.gender = formData.gender
      }
      
      console.log('Updating profile with data:', updateData)
      console.log('User ID:', user?.id)
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user?.id)
        .select()

      console.log('Update response:', { data, error })

      if (error) {
        console.error('Supabase error details:', error)
        throw new Error(error.message || 'Gagal memperbarui profil')
      }

      // Refresh auth context untuk update navbar
      await refreshProfile()

      showToast('Profil berhasil diperbarui!', 'success')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const errorMessage = error?.message || error?.error_description || 'Gagal memperbarui profil. Silakan coba lagi.'
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    try {
      // Hapus foto dari storage jika ada
      if (formData.avatar_url && formData.avatar_url.includes('/avatars/')) {
        const urlParts = formData.avatar_url.split('/avatars/')
        const filePath = urlParts[urlParts.length - 1]
        if (filePath) {
          await supabase.storage.from('avatars').remove([filePath])
        }
      }

      setFormData({ ...formData, avatar_url: '' })
      setAvatarPreview('')
      setAvatarFile(null)
      showToast('Foto profil dihapus', 'success')
    } catch (error) {
      console.error('Error deleting photo:', error)
      showToast('Gagal menghapus foto', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">Profil Saya</span>
              </Link>

              <Link
                href="/profile/badges"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">Achievement</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-400 rounded-full border-4 border-white overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                        {formData.first_name[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading || saving}
                    />
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>
                
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    disabled={uploading || saving}
                    className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus Foto
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="mb-5 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                  Nama Depan<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base text-black"
                  placeholder="Masukkan nama depan"
                  required
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                  Nama Belakang<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base text-black"
                  placeholder="Masukkan nama belakang"
                  required
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                  No Telepon
                </label>
                <input
                  type="tel"
                  name="no_telepon"
                  value={formData.no_telepon}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base text-black"
                  placeholder="Masukkan No Telepon"
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-1.5 sm:mb-2">
                  Jenis Kelamin
                </label>
                <div className="flex gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => handleGenderChange('Laki-Laki')}
                    className={`flex-1 px-3 sm:px-4 py-3 border rounded-lg flex items-center justify-center gap-2 sm:gap-3 transition-colors ${
                      formData.gender === 'Laki-Laki' 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.gender === 'Laki-Laki' ? 'border-blue-600' : 'border-gray-300'
                    }`}>
                      {formData.gender === 'Laki-Laki' && (
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-700 text-sm sm:text-base">Laki - Laki</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderChange('Perempuan')}
                    className={`flex-1 px-3 sm:px-4 py-3 border rounded-lg flex items-center justify-center gap-2 sm:gap-3 transition-colors ${
                      formData.gender === 'Perempuan' 
                        ? ' bg-pink-50 border-pink-600' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.gender === 'Perempuan' ? 'border-pink-600' : 'border-gray-300'
                    }`}>
                      {formData.gender === 'Perempuan' && (
                        <div className="w-3 h-3 bg-pink-600 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-700 text-sm sm:text-base">Perempuan</span>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ID
                </label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between items-stretch sm:items-center pt-4">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
                >
                  {uploading ? 'Mengupload...' : saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="px-8 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors order-1 sm:order-2"
                >
                  Kembali
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full p-3 sm:p-4 md:p-5 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Atur Foto Profil</h3>
              <button
                onClick={() => setShowCropModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Crop Area */}
            <div className="relative mb-3 sm:mb-4">
              <div 
                className="relative w-full h-48 sm:h-56 md:h-64 bg-gray-900 rounded-lg overflow-hidden cursor-move select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={tempImage}
                  alt="Crop preview"
                  className="absolute top-1/2 left-1/2 pointer-events-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale})`,
                    maxWidth: 'none',
                    width: '100%',
                    height: 'auto'
                  }}
                />
                {/* Circular overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full">
                    <defs>
                      <mask id="circleMask">
                        <rect width="100%" height="100%" fill="white" opacity="0.5"/>
                        <circle cx="50%" cy="50%" r="80" fill="black" className="sm:hidden"/>
                        <circle cx="50%" cy="50%" r="90" fill="black" className="hidden sm:block md:hidden"/>
                        <circle cx="50%" cy="50%" r="100" fill="black" className="hidden md:block"/>
                      </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="black" opacity="0.6" mask="url(#circleMask)"/>
                    <circle cx="50%" cy="50%" r="80" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="sm:hidden"/>
                    <circle cx="50%" cy="50%" r="90" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="hidden sm:block md:hidden"/>
                    <circle cx="50%" cy="50%" r="100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="hidden md:block"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2 sm:space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Zoom
                  </label>
                  <span className="text-xs font-semibold text-blue-600">{imageScale.toFixed(1)}x / {maxZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max={maxZoom}
                  step="0.1"
                  value={imageScale}
                  onChange={(e) => {
                    const newScale = parseFloat(e.target.value)
                    setImageScale(newScale)
                    // Re-constrain position when zoom changes
                    const constrained = constrainPosition(imagePosition.x, imagePosition.y, newScale)
                    if (constrained.x !== imagePosition.x || constrained.y !== imagePosition.y) {
                      setImagePosition(constrained)
                    }
                  }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="text-xs text-gray-600 bg-blue-50 p-2 sm:p-2.5 rounded-lg flex items-start gap-1.5 sm:gap-2">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[10px] sm:text-xs">Drag gambar untuk posisi, slider untuk zoom</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3 sm:mt-4">
              <button
                onClick={handleCropConfirm}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
              >
                Gunakan Foto
              </button>
              <button
                onClick={() => {
                  setShowCropModal(false)
                  setTempImage('')
                  setImageScale(1)
                  setImagePosition({ x: 0, y: 0 })
                }}
                className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm`}>
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

export default function EditProfilePage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <EditProfileContent />
    </ProtectedRoute>
  )
}
