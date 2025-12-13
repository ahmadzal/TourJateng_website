'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Clock, Calendar, DollarSign, Car, Heart, ArrowLeft, Share2, Star, Lightbulb, Package, Bike } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import ReactMarkdown from 'react-markdown'

interface Destinasi {
  id_destinasi: number
  nama_destinasi: string
  kategori: string
  deskripsi: string
  lokasi: string
  alamat_lengkap: string
  jam_operasional: string
  hari_operasional: string
  tips_berkunjung: string
  harga_parkir_motor: string
  harga_parkir_mobil: string
  url_gambar: string
  id_harga?: number
}

interface Fasilitas {
  id_fasilitas: number
  kategori_fasilitas: string
}

interface HTM {
  id_harga: number
  harga_weekday: string
  harga_weekend: string
}

export default function DetailDestinasi() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [destinasi, setDestinasi] = useState<Destinasi | null>(null)
  const [fasilitas, setFasilitas] = useState<Fasilitas[]>([])
  const [htm, setHtm] = useState<HTM | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('🔍 Starting fetch data for destinasi ID:', params.id)
        
        // Fetch destinasi
        const { data: destinasiData, error: destinasiError } = await supabase
          .from('destinasi')
          .select('*')
          .eq('id_destinasi', params.id)
          .single()
        
        console.log('📍 Destinasi Data:', destinasiData)
        console.log('❌ Destinasi Error:', destinasiError)
        
        if (destinasiError) {
          console.error('Error fetching destinasi:', destinasiError)
        } else if (destinasiData) {
          setDestinasi(destinasiData)
          console.log('✅ Destinasi set successfully')
          console.log('🔑 Available keys in destinasi:', Object.keys(destinasiData))
          console.log('💰 id_harga value:', destinasiData.id_harga)
          console.log('💰 Checking all possible HTM column names:')
          console.log('   - id_harga:', destinasiData.id_harga)
          console.log('   - id_htm:', destinasiData.id_htm)
          console.log('   - htm_id:', destinasiData.htm_id)
          console.log('   - harga_id:', destinasiData.harga_id)
          
          // Fetch HTM if id_harga exists
          const htmId = destinasiData.id_harga || destinasiData.id_htm || destinasiData.htm_id || destinasiData.harga_id
          
          if (htmId) {
            console.log('💰 Fetching HTM for id_harga:', htmId)
            const { data: htmData, error: htmError } = await supabase
              .from('htm')
              .select('*')
              .eq('id_harga', htmId)
              .single()
            
            console.log('💵 HTM Data:', htmData)
            console.log('❌ HTM Error:', htmError)
            console.log('🔒 HTM Error details:', htmError?.message, htmError?.code, htmError?.details)
            
            if (htmError) {
              console.error('❌ Error fetching HTM - Possible RLS issue:', htmError)
              console.log('⚠️ Pastikan RLS policy untuk tabel HTM sudah diaktifkan')
              console.log('⚠️ SQL untuk enable RLS:')
              console.log(`   CREATE POLICY "Enable read access for all users" ON "public"."htm"`)
              console.log(`   FOR SELECT USING (true);`)
            } else if (htmData) {
              setHtm(htmData)
              console.log('✅ HTM set successfully')
              console.log('📊 HTM Details:', {
                weekday: htmData.harga_weekday,
                weekend: htmData.harga_weekend,
                isWeekendSame: parseFloat(htmData.harga_weekend) === 0
              })
            }
          } else {
            console.log('⚠️ No id_harga found in destinasi')
          }
        }

        // Fetch fasilitas through relasi_fasilitas
        console.log('🔍 Fetching fasilitas for destinasi ID:', params.id)
        
        // Try method 1: Nested select from destinasi
        const { data: destinasiWithFasilitas, error: fasilitasError } = await supabase
          .from('destinasi')
          .select(`
            nama_destinasi,
            relasi_fasilitas (
              fasilitas (
                id_fasilitas,
                kategori_fasilitas
              )
            )
          `)
          .eq('id_destinasi', params.id)
          .single()
         
        console.log('🏢 Destinasi With Fasilitas:', destinasiWithFasilitas)
        console.log('❌ Fasilitas Error:', fasilitasError)
        console.log('🔒 Error details:', fasilitasError?.message, fasilitasError?.code, fasilitasError?.details)
        
        if (fasilitasError) {
          console.error('❌ Error fetching fasilitas:', fasilitasError)
          console.log('🔄 Trying alternative method - direct query to relasi_fasilitas...')
          
          // Alternative: Query relasi_fasilitas directly
          const { data: relasiFasilitasDirect, error: relError } = await supabase
            .from('relasi_fasilitas')
            .select('id_fasilitas')
            .eq('id_destinasi', params.id)
          
          console.log('📋 Direct relasi query result:', relasiFasilitasDirect)
          console.log('❌ Direct relasi error:', relError)
          
          if (!relError && relasiFasilitasDirect && relasiFasilitasDirect.length > 0) {
            // Get fasilitas details for each id
            const fasilitasIds = relasiFasilitasDirect.map(r => r.id_fasilitas)
            console.log('🔑 Fasilitas IDs:', fasilitasIds)
            
            const { data: fasilitasDetails, error: fasError } = await supabase
              .from('fasilitas')
              .select('id_fasilitas, kategori_fasilitas')
              .in('id_fasilitas', fasilitasIds)
            
            console.log('📦 Fasilitas details:', fasilitasDetails)
            console.log('❌ Fasilitas details error:', fasError)
            
            if (fasilitasDetails) {
              setFasilitas(fasilitasDetails)
              console.log('✅ Fasilitas set via alternative method')
            }
          }
        } else if (destinasiWithFasilitas?.relasi_fasilitas) {
          console.log('🔄 Processing fasilitas data...')
          console.log('📊 Relasi Fasilitas Array:', destinasiWithFasilitas.relasi_fasilitas)
          console.log('📏 Relasi Fasilitas Length:', destinasiWithFasilitas.relasi_fasilitas.length)
          
          // Extract fasilitas data from the nested structure
          const fasilitasData = destinasiWithFasilitas.relasi_fasilitas
            .map((rel: any, index: number) => {
              console.log(`  🔹 Item ${index}:`, rel)
              console.log(`  🔹 Fasilitas object:`, rel.fasilitas)
              return rel.fasilitas
            })
            .filter((f: any) => {
              const isValid = f !== null && f !== undefined
              console.log('  ✔️ Filter result:', isValid, 'Data:', f)
              return isValid
            }) as Fasilitas[]
          
          console.log('✅ Final Fasilitas Data:', fasilitasData)
          console.log('📏 Fasilitas Count:', fasilitasData.length)
          setFasilitas(fasilitasData)
        } else {
          console.log('⚠️ No relasi_fasilitas found in response')
          console.log('⚠️ Response structure:', destinasiWithFasilitas)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  // Check if destination is in user's favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user || !params.id) return
      
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('destinasi_id', params.id)
          .single()
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking favorite status:', error)
          return
        }
        
        setIsFavorite(!!data)
      } catch (error) {
        console.error('Error checking favorite:', error)
      }
    }

    checkFavoriteStatus()
  }, [user, params.id])

  const toggleFavorite = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login')
      return
    }

    setFavoriteLoading(true)
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('destinasi_id', params.id)
        
        if (error) {
          console.error('Error removing favorite:', error)
          alert('Gagal menghapus dari favorit')
          return
        }
        
        setIsFavorite(false)
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            destinasi_id: params.id
          })
        
        if (error) {
          console.error('Error adding favorite:', error)
          alert('Gagal menambahkan ke favorit')
          return
        }
        
        setIsFavorite(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Terjadi kesalahan')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const calculateWeekendPrice = (weekdayPrice: string, weekendPercent: string) => {
    const weekday = parseFloat(weekdayPrice.replace(/[^0-9]/g, '')) || 0
    const percent = parseFloat(weekendPercent) || 0
    
    if (percent === 0) {
      return weekday
    }
    
    const increase = (weekday * percent) / 100
    return weekday + increase
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: destinasi?.nama_destinasi,
        text: `Lihat destinasi wisata ${destinasi?.nama_destinasi}`,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link telah disalin ke clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-b-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail destinasi...</p>
        </div>
      </div>
    )
  }

  if (!destinasi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Destinasi Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Maaf, destinasi yang Anda cari tidak ditemukan.</p>
          <button
            onClick={() => router.push('/destinasi')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Daftar Destinasi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 md:px-6 md:py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="group flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-3 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="font-medium">Kembali</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                title="Bagikan"
              >
                <Share2 className="h-5 w-5 text-gray-500" />
              </button>
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`p-3 rounded-lg transition-colors duration-200 ${
                  favoriteLoading 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-50'
                }`}
                title={favoriteLoading ? 'Memproses...' : 'Favorit'}
              >
                {favoriteLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-current border-b-transparent rounded-full" />
                ) : (
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6 md:space-y-12">
            {/* Hero Image */}
            <div className="relative">
              <div className="relative h-[240px] md:h-[300px] lg:h-[360px] rounded-xl overflow-hidden">
                <img
                  src={destinasi.url_gambar || '/images/placeholder.jpg'}
                  alt={destinasi.nama_destinasi}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <span className="inline-flex items-center bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                    {destinasi.kategori}
                  </span>
                </div>
              </div>
            </div>

            {/* Title and Location */}
            <div className="space-y-3 md:space-y-6">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight">
                {destinasi.nama_destinasi}
              </h1>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-gray-400 flex-shrink-0" />
                  <span className="text-base md:text-lg font-medium text-gray-800">{destinasi.lokasi}</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-3 text-gray-400 mt-0.5 md:mt-1 flex-shrink-0" />
                  <span className="text-xs md:text-sm leading-relaxed">{destinasi.alamat_lengkap}</span>
                </div>
              </div>
            </div>

            {/* Tentang Destinasi */}
            <section className="space-y-2 md:space-y-3">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Tentang Destinasi</h2>
              <div className="prose prose-sm md:prose-lg max-w-none text-gray-700">
                <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {destinasi.deskripsi}
                </p>
              </div>
            </section>

            {/* Tips Berkunjung */}
            <section className="space-y-2 md:space-y-3">
              <div className="flex items-center">
                <Lightbulb className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-amber-500" />
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Tips Berkunjung</h2>
              </div>
              <div className="prose prose-sm md:prose-lg max-w-none text-gray-700">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-base md:text-xl font-bold text-gray-900 mt-4 md:mt-6 mb-2 md:mb-3" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-sm md:text-lg font-bold text-gray-900 mt-3 md:mt-5 mb-1.5 md:mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm md:text-base font-semibold text-gray-900 mt-3 md:mt-4 mb-1.5 md:mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-700 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 md:ml-6 mb-3 md:mb-4 space-y-1.5 md:space-y-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 md:ml-6 mb-3 md:mb-4 space-y-1.5 md:space-y-2" {...props} />,
                    li: ({node, ...props}) => <li className="text-sm md:text-base text-gray-700 leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                    code: ({node, ...props}) => <code className="bg-gray-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs md:text-sm font-mono text-gray-800" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-200 pl-4 md:pl-6 italic text-gray-600 my-3 md:my-4 text-sm md:text-base" {...props} />,
                  }}
                >
                  {destinasi.tips_berkunjung}
                </ReactMarkdown>
              </div>
            </section>

            {/* Fasilitas */}
            {fasilitas.length > 0 && (
              <section className="bg-blue-50 rounded-xl p-4 md:p-8 border border-blue-100 space-y-2 md:space-y-3">
                <div className="flex items-center">
                  <Package className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3 text-blue-600" />
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900">Fasilitas</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {fasilitas.map((item) => (
                    <span
                      key={item.id_fasilitas}
                      className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
                    >
                      {item.kategori_fasilitas}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Info Cards */}
          <aside className="lg:col-span-4 space-y-4 md:space-y-8">
            {/* HTM - Harga Tiket Masuk */}
            {htm && (
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Harga Tiket Masuk</h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Row layout for weekday and weekend prices */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Hari Biasa - Left side */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-blue-700 mb-1">Hari Biasa</p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {formatCurrency(parseFloat(htm.harga_weekday.replace(/[^0-9]/g, '')) || 0)}
                      </p>
                    </div>
                    
                    {/* Akhir Pekan - Right side */}
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-sm font-medium text-orange-700 mb-1">Akhir Pekan</p>
                      {parseFloat(htm.harga_weekend) === 0 ? (
                        <p className="text-sm text-gray-900 font-semibold">
                          {formatCurrency(parseFloat(htm.harga_weekday.replace(/[^0-9]/g, '')) || 0)}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-900 font-semibold">
                            {formatCurrency(calculateWeekendPrice(htm.harga_weekday, htm.harga_weekend))}
                          </p>
                          <p className="text-xs text-orange-600 font-medium">
                            +{htm.harga_weekend}%
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Info note */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                      💡 Harga dapat berubah sewaktu-waktu
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Jam Operasional */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Jam Operasional</h3>
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Hari Operasional</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{destinasi.hari_operasional}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Jam Buka</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{destinasi.jam_operasional}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Parkir */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Informasi Parkir</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Row layout for motorcycle and car parking */}
                <div className={`grid gap-4 ${destinasi.harga_parkir_mobil ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Parkir Motor - Left side */}
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Bike className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-700 mb-1">Motor</p>
                      <p className="text-sm text-gray-900 font-semibold truncate">{destinasi.harga_parkir_motor}</p>
                    </div>
                  </div>
                  
                  {/* Parkir Mobil - Right side */}
                  {destinasi.harga_parkir_mobil && (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <Car className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-700 mb-1">Mobil</p>
                        <p className="text-sm text-gray-900 font-semibold truncate">{destinasi.harga_parkir_mobil}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer Credit */}
        <footer className="mt-4 md:mt-5 border-t border-gray-200 pt-4 pb-6">
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-500">
              © 2025 TourJateng. Jelajahi Keindahan Jawa Tengah
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
