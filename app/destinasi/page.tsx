'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Star, Clock, Heart, Filter, Grid, List, X, Menu } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

// Custom styles for animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-scale-in {
    animation: scaleIn 0.3s ease-out;
  }
`

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
  harga_weekday?: string  // From htm table
  harga_weekend?: string  // From htm table
  // New preference columns (with fallback to text parsing if NULL)
  durasi_rekomendasi?: string  // 'short', 'medium', 'long'
  kategori_aktivitas?: string[]  // ['nature', 'culture', 'recreation']
  tujuan_cocok?: string[]  // ['healing', 'experience', 'content']
  cocok_untuk?: string[]  // ['solo', 'couple', 'family', 'friends']
}

const categories = [
  { id: 'semua', nama: 'Semua Kategori', icon: '🌟' },
  { id: 'wisata-alam', nama: 'Wisata Alam', icon: '🌿' },
  { id: 'pesona-buatan', nama: 'Pesona Buatan', icon: '🏛️' },
  { id: 'seni-budaya', nama: 'Seni & Budaya', icon: '🎭' }
]

const daerahWisata = [
  { id: 'semua', nama: 'Semua Daerah' },
  // Kabupaten (alphabetical)
  { id: 'banjarnegara', nama: 'Kab Banjarnegara' },
  { id: 'banyumas', nama: 'Kab Banyumas' },
  { id: 'batang', nama: 'Kab Batang' },
  { id: 'blora', nama: 'Kab Blora' },
  { id: 'boyolali', nama: 'Kab Boyolali' },
  { id: 'brebes', nama: 'Kab Brebes' },
  { id: 'cilacap', nama: 'Kab Cilacap' },
  { id: 'demak', nama: 'Kab Demak' },
  { id: 'grobogan', nama: 'Kab Grobogan' },
  { id: 'jepara', nama: 'Kab Jepara' },
  { id: 'karanganyar', nama: 'Kab Karanganyar' },
  { id: 'kebumen', nama: 'Kab Kebumen' },
  { id: 'kendal', nama: 'Kab Kendal' },
  { id: 'klaten', nama: 'Kab Klaten' },
  { id: 'kudus', nama: 'Kab Kudus' },
  { id: 'magelang-kab', nama: 'Kab Magelang' },
  { id: 'pati', nama: 'Kab Pati' },
  { id: 'pekalongan-kab', nama: 'Kab Pekalongan' },
  { id: 'pemalang', nama: 'Kab Pemalang' },
  { id: 'purbalingga', nama: 'Kab Purbalingga' },
  { id: 'purworejo', nama: 'Kab Purworejo' },
  { id: 'rembang', nama: 'Kab Rembang' },
  { id: 'semarang-kab', nama: 'Kab Semarang' },
  { id: 'sragen', nama: 'Kab Sragen' },
  { id: 'sukoharjo', nama: 'Kab Sukoharjo' },
  { id: 'tegal-kab', nama: 'Kab Tegal' },
  { id: 'temanggung', nama: 'Kab Temanggung' },
  { id: 'wonogiri', nama: 'Kab Wonogiri' },
  { id: 'wonosobo', nama: 'Kab Wonosobo' },
  // Kota (alphabetical)
  { id: 'magelang', nama: 'Kota Magelang' },
  { id: 'pekalongan', nama: 'Kota Pekalongan' },
  { id: 'salatiga', nama: 'Kota Salatiga' },
  { id: 'semarang', nama: 'Kota Semarang' },
  { id: 'surakarta', nama: 'Kota Surakarta' },
  { id: 'tegal', nama: 'Kota Tegal' }
]

interface QuestionnaireData {
  budget: string
  duration: string
  activities: string[]
  travelPurpose: string
  groupSize: string
  preferredLocation?: string  // Optional: kota/kabupaten pilihan user
}

interface PersonalizedResult {
  destination: Destinasi
  matchPercentage: number
  score: number
}

export default function DestinasiWisata() {
  const router = useRouter()
  const { user } = useAuth()
  const [destinasiData, setDestinasiData] = useState<Destinasi[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDaerah, setSelectedDaerah] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<number[]>([])
  const [daerahList, setDaerahList] = useState<string[]>([])
  const [kategoriList, setKategoriList] = useState<string[]>([])
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // Personalization states
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showPersonalizedResults, setShowPersonalizedResults] = useState(false)
  const [showPersonalizedView, setShowPersonalizedView] = useState(false)
  const [isProcessingRecommendations, setIsProcessingRecommendations] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('')
  const [filteredDestinationsFromPersonalization, setFilteredDestinationsFromPersonalization] = useState<Destinasi[]>([])
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>({
    budget: '',
    duration: '',
    activities: [],
    travelPurpose: '',
    groupSize: '',
    preferredLocation: ''  // Optional location preference
  })
  const [personalizedResults, setPersonalizedResults] = useState<PersonalizedResult[]>([])
  
  // Autocomplete states
  const [showLocationAutocomplete, setShowLocationAutocomplete] = useState(false)
  const [locationSearchTerm, setLocationSearchTerm] = useState('')
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(-1)
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Ref for scrolling to bottom actions
  const bottomActionsRef = useRef<HTMLDivElement>(null)

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('destinasiPageState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        if (parsed.searchTerm) setSearchTerm(parsed.searchTerm)
        if (parsed.selectedCategories) setSelectedCategories(parsed.selectedCategories)
        if (parsed.selectedDaerah) setSelectedDaerah(parsed.selectedDaerah)
        if (parsed.currentPage) setCurrentPage(parsed.currentPage)
        if (parsed.viewMode) setViewMode(parsed.viewMode)
        if (parsed.showPersonalizedView !== undefined) setShowPersonalizedView(parsed.showPersonalizedView)
        if (parsed.filteredDestinationsFromPersonalization) {
          setFilteredDestinationsFromPersonalization(parsed.filteredDestinationsFromPersonalization)
        }
        if (parsed.personalizedResults) {
          setPersonalizedResults(parsed.personalizedResults)
        }
        
        // Restore scroll position after a short delay to ensure content is loaded
        if (parsed.scrollY) {
          setTimeout(() => {
            window.scrollTo(0, parsed.scrollY)
          }, 100)
        }
        
        // Clear the saved state after restoring
        sessionStorage.removeItem('destinasiPageState')
      } catch (e) {
        console.error('Failed to restore state:', e)
      }
    }
  }, [])

  // Handler untuk membuka personalisasi dengan cek autentikasi
  const handleOpenPersonalization = () => {
    if (!user) {
      // Tampilkan modal konfirmasi login
      setShowAuthModal(true)
      return
    }
    setShowQuestionnaire(true)
  }

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside the autocomplete area
      if (!target.closest('.location-autocomplete-container')) {
        setShowLocationAutocomplete(false)
      }
    }

    if (showLocationAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLocationAutocomplete])

  // Reset autocomplete when modal closes
  useEffect(() => {
    if (!showQuestionnaire) {
      setShowLocationAutocomplete(false)
      setLocationSearchTerm('')
    }
  }, [showQuestionnaire])

  // Fetch data from Supabase with HTM data and preference columns
  useEffect(() => {
    const fetchDestinasi = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('destinasi')
          .select(`
            *,
            htm:id_htm (
              harga_weekday,
              harga_weekend
            )
          `)
        
        if (error) {
          console.error('Error fetching destinasi:', error)
        } else if (data) {
          // Flatten the htm data into the main object
          const flattenedData = data.map(dest => ({
            ...dest,
            harga_weekday: dest.htm?.harga_weekday || '0',
            harga_weekend: dest.htm?.harga_weekend || '0'
          }))
          setDestinasiData(flattenedData)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDestinasi()
  }, [])

  // Extract unique locations from data
  useEffect(() => {
    if (destinasiData.length > 0) {
      const uniqueLocations = Array.from(new Set(destinasiData.map(dest => dest.lokasi)))
        .filter(loc => loc && loc.trim() !== '')
        .sort((a, b) => a.localeCompare(b, 'id'))
      setDaerahList(uniqueLocations)
      
      const uniqueKategori = Array.from(new Set(destinasiData.map(dest => dest.kategori)))
        .filter(kat => kat && kat.trim() !== '')
        .sort((a, b) => a.localeCompare(b, 'id'))
      setKategoriList(uniqueKategori)
    }
  }, [destinasiData])

  // Function to toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        // Remove category if already selected
        return prev.filter(id => id !== categoryId)
      } else {
        // Add category if not selected
        return [...prev, categoryId]
      }
    })
  }

  // Function to toggle daerah selection
  const toggleDaerah = (daerahId: string) => {
    setSelectedDaerah(prev => {
      if (prev === daerahId) {
        // Remove daerah if already selected (unselect)
        return ''
      } else {
        // Select new daerah
        return daerahId
      }
    })
  }

  // Filter destinations - Show ALL data by default, filter only when search or filters are applied
  const filteredDestinations = destinasiData.filter(dest => {
    const hasSearchTerm = searchTerm.trim() !== ''
    const hasCategory = selectedCategories.length > 0
    const hasDaerah = !!selectedDaerah
    
    // Apply category filter if selected
    const matchesCategory = !hasCategory || selectedCategories.includes(dest.kategori)
    
    // Apply daerah filter if selected
    const matchesDaerah = !hasDaerah || dest.lokasi === selectedDaerah
    
    // Apply search filter if there's a search term
    // Search ONLY in destination NAME (not description, not location)
    let matchesSearch = true
    if (hasSearchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesNamaDestinasi = dest.nama_destinasi?.toLowerCase().includes(searchLower) || false
      matchesSearch = matchesNamaDestinasi
    }
    
    // ALL conditions must be satisfied (AND logic)
    return matchesCategory && matchesDaerah && matchesSearch
  })

  // Sort destinations by region order (based on sidebar daerahWisata list)
  // This ensures destinations from Kabupaten Banjarnegara appear first, followed by others in sidebar order
  const sortedDestinations = [...filteredDestinations].sort((a, b) => {
    // Safety check for required fields
    if (!a.lokasi || !b.lokasi) return 0
    if (!a.nama_destinasi || !b.nama_destinasi) return 0
    
    // Find the index of each destination's region in the daerahWisata array
    const getRegionIndex = (lokasi: string) => {
      if (!lokasi) return 9999
      const lokasiLower = lokasi.toLowerCase()
      const index = daerahWisata.findIndex(daerah => {
        if (daerah.id === 'semua') return false
        const namaLower = daerah.nama.toLowerCase()
        // Match "Kab X" with "Kabupaten X" or "Kota X" with "Kota X"
        return lokasiLower.includes(daerah.id) || 
               lokasiLower.includes(namaLower) ||
               namaLower.includes(lokasiLower.replace('kabupaten ', '').replace('kab ', '').replace('kota ', ''))
      })
      // Return a high number for unmatched regions to put them at the end
      return index === -1 ? 9999 : index
    }
    
    const indexA = getRegionIndex(a.lokasi)
    const indexB = getRegionIndex(b.lokasi)
    
    // Sort by region index (lower index = appears first)
    if (indexA !== indexB) {
      return indexA - indexB
    }
    
    // If same region, sort alphabetically by name
    return (a.nama_destinasi || '').localeCompare(b.nama_destinasi || '', 'id')
  })

  // Pagination logic
  const totalPages = Math.ceil(sortedDestinations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDestinations = sortedDestinations.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategories, selectedDaerah])

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    )
  }

  // Save current state before navigating to detail page
  const saveCurrentState = () => {
    const currentState = {
      searchTerm,
      selectedCategories,
      selectedDaerah,
      currentPage,
      viewMode,
      showPersonalizedView,
      filteredDestinationsFromPersonalization,
      personalizedResults,
      scrollY: window.scrollY
    }
    sessionStorage.setItem('destinasiPageState', JSON.stringify(currentState))
  }

  // Handle navigation to detail page
  const handleNavigateToDetail = (id: number) => {
    saveCurrentState()
    router.push(`/destinasi/${id}`)
  }

  // Calculate compatibility score based on user preferences and database data
  // Scoring: +1 (perfect match), +0.5 (partial match), 0 (no match)
  // Maximum score: 5 points (5 factors: Budget, Duration, Activity, Purpose, Partner)
  const calculateCompatibility = (destination: Destinasi, preferences: QuestionnaireData): number => {
    let score = 0

    // 1. Budget Score (Budget per orang × jumlah orang)
    // Estimasi jumlah orang berdasarkan travel partner
    const groupMultiplier: { [key: string]: number } = {
      'solo': 1,
      'couple': 2,
      'family': 4,   // Asumsi keluarga 4 orang (2 dewasa + 2 anak)
      'friends': 4   // Asumsi grup teman 4 orang
    }
    const jumlahOrang = groupMultiplier[preferences.groupSize] || 1
    
    // Hitung biaya destinasi
    const htmPerOrang = parseInt(destination.harga_weekday?.replace(/[^0-9]/g, '') || '0')
    const htmTotal = htmPerOrang * jumlahOrang  // HTM dikali jumlah orang
    const parkingMotor = parseInt(destination.harga_parkir_motor?.replace(/[^0-9]/g, '') || '0')
    const parkingMobil = parseInt(destination.harga_parkir_mobil?.replace(/[^0-9]/g, '') || '0')
    const parkingCost = jumlahOrang >= 3 ? parkingMobil : parkingMotor  // Mobil jika 3+ orang, motor jika <3
    const totalBiayaDestinasi = htmTotal + parkingCost
    
    // Budget scoring: Simple & straightforward
    let budgetPerOrang = 0
    let budgetTersedia = 0
    const toleransi = 10000  // Toleransi Rp 10k untuk semua kategori
    
    if (preferences.budget === 'basic') {
      budgetPerOrang = 30000  // <30k per orang
      budgetTersedia = budgetPerOrang * jumlahOrang
    } else if (preferences.budget === 'value') {
      budgetPerOrang = 45000  // ~40-50k per orang
      budgetTersedia = budgetPerOrang * jumlahOrang
    } else if (preferences.budget === 'plus') {
      budgetPerOrang = 70000  // ~60-80k per orang
      budgetTersedia = budgetPerOrang * jumlahOrang
    } else if (preferences.budget === 'premium') {
      budgetPerOrang = 100000  // >80k per orang
      budgetTersedia = budgetPerOrang * jumlahOrang
    }
    
    // Score berdasarkan biaya vs budget
    if (totalBiayaDestinasi <= budgetTersedia) {
      score += 1  // Pas atau lebih murah dari budget
    } else if (totalBiayaDestinasi <= budgetTersedia + toleransi) {
      score += 0.5  // Sedikit over budget (max +10k)
    }
    // Else 0 poin jika over >10k

    // 2. Duration Score (from database)
    if (destination.durasi_rekomendasi) {
      if (preferences.duration === destination.durasi_rekomendasi) {
        score += 1  // Perfect match
      } else if (
        (preferences.duration === 'medium' && destination.durasi_rekomendasi === 'short') ||
        (preferences.duration === 'long' && destination.durasi_rekomendasi === 'medium')
      ) {
        score += 0.5  // Close match
      }
    }

    // 3. Activity Category Score (from database)
    if (destination.kategori_aktivitas && destination.kategori_aktivitas.length > 0) {
      let activityScore = 0
      preferences.activities.forEach(activity => {
        if (destination.kategori_aktivitas!.includes(activity)) {
          activityScore += 1
        }
      })
      // Average activity match (maximum 1 point)
      if (preferences.activities.length > 0) {
        score += Math.min(activityScore / preferences.activities.length, 1)
      }
    }

    // 4. Travel Purpose Score (from database)
    if (destination.tujuan_cocok && destination.tujuan_cocok.length > 0) {
      if (destination.tujuan_cocok.includes(preferences.travelPurpose)) {
        score += 1  // Perfect match
      }
    }

    // 5. Travel Partner Score (from database)
    if (destination.cocok_untuk && destination.cocok_untuk.length > 0) {
      if (destination.cocok_untuk.includes(preferences.groupSize)) {
        score += 1  // Perfect match
      } else if (destination.cocok_untuk.length >= 3) {
        score += 0.5  // Suitable for most groups
      }
    }

    // Return score (0-5 range)
    return score
  }

  // Process questionnaire and generate personalized recommendations
  const processQuestionnaire = () => {
    setIsProcessingRecommendations(true)
    setLoadingProgress(0)
    setLoadingText('Mempersiapkan analisis...')
    
    // Progressive loading simulation
    const progressSteps = [
      { percent: 20, text: 'Menganalisis preferensi budget...', delay: 300 },
      { percent: 40, text: 'Mencocokkan durasi perjalanan...', delay: 400 },
      { percent: 60, text: 'Mengevaluasi kategori aktivitas...', delay: 350 },
      { percent: 80, text: 'Menghitung tujuan traveling & partner...', delay: 400 },
      { percent: 100, text: 'Menyiapkan rekomendasi terbaik...', delay: 300 }
    ]
    
    let currentStep = 0
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep]
        setLoadingProgress(step.percent)
        setLoadingText(step.text)
        currentStep++
      } else {
        clearInterval(progressInterval)
      }
    }, 300)
    
    // Process recommendations after all progress steps
    setTimeout(() => {
      const recommendations: PersonalizedResult[] = []
      
      // Get all available destinations
      let allDestinations = destinasiData
      
      // Filter by location if user specified a preference
      if (questionnaireData.preferredLocation && questionnaireData.preferredLocation.trim() !== '') {
        const preferredLoc = questionnaireData.preferredLocation.toLowerCase()
        
        // Check if this is a combined option (Gab)
        if (preferredLoc.startsWith('gab ')) {
          // Extract the base location name (e.g., "Semarang" from "Gab Semarang")
          const cleanedLoc = preferredLoc.replace(/^gab\s+/i, '').trim()
          
          // Match destinations from BOTH Kota and Kab of this location
          allDestinations = allDestinations.filter(dest => {
            const destinationLocation = dest.lokasi?.toLowerCase() || ''
            // Match if destination contains the base name (flexible matching)
            return destinationLocation.includes(cleanedLoc)
          })
        } else {
          // Specific filtering for individual Kota or Kab
          // User selected specific "Kota X" or "Kab X", so match ONLY that type
          
          if (preferredLoc.startsWith('kota ')) {
            // User chose Kota specifically
            const baseName = preferredLoc.replace(/^kota\s+/i, '').trim()
            allDestinations = allDestinations.filter(dest => {
              const destinationLocation = dest.lokasi?.toLowerCase() || ''
              // Match "Kota X" in any format
              return destinationLocation.includes(`kota ${baseName}`) ||
                     (destinationLocation.includes('kota') && destinationLocation.includes(baseName))
            })
          } else if (preferredLoc.startsWith('kab ')) {
            // User chose Kabupaten specifically
            const baseName = preferredLoc.replace(/^kab\s+/i, '').trim()
            allDestinations = allDestinations.filter(dest => {
              const destinationLocation = dest.lokasi?.toLowerCase() || ''
              // Match "Kabupaten X" or "Kab X" in any format
              return destinationLocation.includes(`kabupaten ${baseName}`) ||
                     destinationLocation.includes(`kab. ${baseName}`) ||
                     destinationLocation.includes(`kab ${baseName}`) ||
                     (destinationLocation.includes('kabupaten') && destinationLocation.includes(baseName)) ||
                     (destinationLocation.includes('kab') && destinationLocation.includes(baseName) && !destinationLocation.includes('kota'))
            })
          }
        }
      }
      
      // Calculate max possible score (now always 5, since location filtering is done separately)
      const maxScore = 5
      
      // Calculate compatibility for each destination (score range: 0-5)
      const destinationScores = allDestinations.map(dest => ({
        destination: dest,
        score: calculateCompatibility(dest, questionnaireData),
        matchPercentage: Math.round((calculateCompatibility(dest, questionnaireData) / maxScore) * 100)
      }))

      // Sort by score descending
      destinationScores.sort((a, b) => b.score - a.score)

      // Filter destinations with score >= 0.5 (minimum 10% match)
      let matchingDestinations = destinationScores.filter(d => d.score >= 0.5)

      // IMPORTANT: If user selected a location, ALWAYS show destinations from that location
      // Even if none meet the score threshold, show alternative recommendations
      if (questionnaireData.preferredLocation && matchingDestinations.length === 0) {
        // No destinations meet the criteria, but user selected a specific location
        // Show top destinations from that location as alternatives (minimum 3, max 20)
        const minResults = Math.min(3, destinationScores.length)
        const maxResults = Math.min(20, destinationScores.length)
        matchingDestinations = destinationScores.slice(0, maxResults >= minResults ? maxResults : minResults)
      } else if (matchingDestinations.length === 0) {
        // No location preference and no matching destinations
        // Take top 3 with best scores from all destinations
        matchingDestinations = destinationScores.slice(0, 3)
      }

      // Take maximum 20 destinations with highest scores
      const finalDestinations = matchingDestinations.slice(0, 20)

      // Convert to PersonalizedResult format with individual scores
      finalDestinations.forEach(dest => {
        recommendations.push({
          destination: dest.destination,
          matchPercentage: dest.matchPercentage,
          score: dest.score
        })
      })

      setPersonalizedResults(recommendations)
      setShowQuestionnaire(false)
      setShowPersonalizedResults(true)
      setIsProcessingRecommendations(false)
      setLoadingProgress(0)
      clearInterval(progressInterval)
    }, 2000) // 2 second total loading delay
  }

  // Handle questionnaire input changes
  const handleQuestionnaireChange = (field: keyof QuestionnaireData, value: string | string[] | boolean) => {
    setQuestionnaireData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle location input change with autocomplete
  const handleLocationInputChange = (value: string) => {
    setLocationSearchTerm(value)
    setQuestionnaireData(prev => ({
      ...prev,
      preferredLocation: value
    }))
    
    // Show autocomplete if there's input
    if (value.trim().length > 0) {
      setShowLocationAutocomplete(true)
      setSelectedAutocompleteIndex(-1)
    } else {
      setShowLocationAutocomplete(false)
    }
  }

  // Handle keyboard navigation in autocomplete
  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showLocationAutocomplete) return
    
    const filteredLocs = getFilteredLocations()
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedAutocompleteIndex(prev => 
        prev < filteredLocs.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedAutocompleteIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedAutocompleteIndex >= 0 && selectedAutocompleteIndex < filteredLocs.length) {
        selectLocation(filteredLocs[selectedAutocompleteIndex].nama)
      }
    } else if (e.key === 'Escape') {
      setShowLocationAutocomplete(false)
      setSelectedAutocompleteIndex(-1)
    }
  }

  // Select location from autocomplete
  const selectLocation = (locationName: string) => {
    setLocationSearchTerm(locationName)
    setQuestionnaireData(prev => ({
      ...prev,
      preferredLocation: locationName
    }))
    setShowLocationAutocomplete(false)
    setSelectedAutocompleteIndex(-1)
  }

  // Filter locations based on search term
  const getFilteredLocations = () => {
    if (!locationSearchTerm || locationSearchTerm.trim().length === 0) {
      return []
    }
    
    const searchLower = locationSearchTerm.toLowerCase()
    const filtered = daerahWisata
      .filter(loc => loc.id !== 'semua') // Exclude 'Semua Daerah'
      .filter(loc => loc.nama.toLowerCase().includes(searchLower))
      .slice(0, 8) // Limit to 8 results for better UX
    
    // Check for duplicate names (Kota and Kab with same base name)
    const locationMap = new Map<string, { kota?: typeof filtered[0], kab?: typeof filtered[0] }>()
    
    filtered.forEach(loc => {
      const baseName = loc.nama.replace(/^(Kota|Kab)\s+/i, '').trim()
      const key = baseName.toLowerCase()
      
      if (!locationMap.has(key)) {
        locationMap.set(key, {})
      }
      
      const entry = locationMap.get(key)!
      if (loc.nama.startsWith('Kota')) {
        entry.kota = loc
      } else if (loc.nama.startsWith('Kab')) {
        entry.kab = loc
      }
    })
    
    // Build result array with combined options where both exist
    const result: Array<typeof filtered[0] & { isCombined?: boolean, baseName?: string }> = []
    
    locationMap.forEach((entry, baseName) => {
      const hasBoth = entry.kota && entry.kab
      
      if (hasBoth) {
        // Add combined option first
        result.push({
          id: `gab-${baseName}`,
          nama: `Gab ${baseName.charAt(0).toUpperCase() + baseName.slice(1)}`,
          isCombined: true,
          baseName: baseName
        } as any)
        // Then add individual options
        if (entry.kota) result.push(entry.kota)
        if (entry.kab) result.push(entry.kab)
      } else {
        // Only one exists, add it
        if (entry.kota) result.push(entry.kota)
        if (entry.kab) result.push(entry.kab)
      }
    })
    
    return result.slice(0, 8)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="flex">
        {/* Desktop Sidebar - Match the exact design from image */}
        <div className="hidden lg:block w-64 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white min-h-screen sticky top-0 h-screen overflow-hidden shadow-2xl">
          <div className="h-full flex flex-col">
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Kategori Filter - Match exact design */}
              <div>
                <div className="sticky top-0 bg-gradient-to-b from-blue-700 via-blue-700 to-blue-700 py-4 z-20 px-6 border-b border-blue-500/30 shadow-lg backdrop-blur-md">
                  <h3 className="text-yellow-300 font-bold flex items-center gap-2 text-base">
                    <span className="text-xl">📂</span>
                    Kategori
                  </h3>
                </div>
                <div className="px-6 py-3 space-y-2">
                  {kategoriList.map((kategori) => (
                    <button
                      key={kategori}
                      onClick={() => toggleCategory(kategori)}
                      className={`w-full text-left py-3 px-4 rounded-xl transition-all duration-200 text-sm group relative overflow-hidden ${ 
                        selectedCategories.includes(kategori)
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg border-l-4 border-yellow-400 transform scale-105'
                          : 'text-blue-100 hover:bg-blue-600/50 hover:text-white hover:transform hover:scale-102 hover:shadow-md backdrop-blur-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <span>{kategori}</span>
                        {selectedCategories.includes(kategori) && (
                          <span className="text-yellow-300 text-sm font-bold animate-pulse">✓</span>
                        )}
                      </div>
                      {!selectedCategories.includes(kategori) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daerah Wisata Filter - Match exact design */}
              <div className="pb-4">
                <div className="sticky top-0 bg-gradient-to-b from-blue-700 via-blue-700 to-blue-700 py-4 z-20 px-6 border-b border-blue-500/30 shadow-lg backdrop-blur-md">
                  <h3 className="text-yellow-300 font-bold flex items-center gap-2 text-base">
                    <span className="text-xl">📍</span>
                    Daerah Wisata
                  </h3>
                </div>
                <div className="px-6 py-3 space-y-1.5">
                  {daerahList.map((lokasi) => (
                    <button
                      key={lokasi}
                      onClick={() => toggleDaerah(lokasi)}
                      className={`w-full text-left py-2.5 px-4 rounded-xl transition-all duration-200 text-sm group relative overflow-hidden ${
                        selectedDaerah === lokasi
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg border-l-4 border-yellow-400 transform scale-105'
                          : 'text-blue-100 hover:bg-blue-600/50 hover:text-white hover:transform hover:scale-102 hover:shadow-md backdrop-blur-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <span className="truncate pr-2">{lokasi}</span>
                        {selectedDaerah === lokasi && (
                          <span className="text-yellow-300 text-sm font-bold flex-shrink-0 animate-pulse">✓</span>
                        )}
                      </div>
                      {selectedDaerah !== lokasi && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Clear filters button at bottom */}
            {(selectedCategories.length > 0 || selectedDaerah) && (
              <div className="px-6 py-4 border-t border-blue-400/30 bg-gradient-to-r from-blue-800 to-blue-900 shadow-lg">
                <button
                  onClick={() => {
                    setSelectedCategories([])
                    setSelectedDaerah('')
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Hapus Semua Filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <div 
              className="w-64 sm:w-72 bg-gradient-to-b from-blue-600 to-blue-700 text-white h-full shadow-2xl animate-slide-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="p-3 sm:p-4 flex items-center justify-between border-b border-blue-500">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-yellow-300">Filter Destinasi</h2>
                    <p className="text-blue-100 text-[10px] sm:text-xs">Pilih kategori & lokasi</p>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 sm:p-2 hover:bg-blue-500 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 custom-scrollbar">
                  {/* Mobile Kategori */}
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-yellow-300 font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">📂</span>
                      Kategori
                    </h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      {kategoriList.map((kategori) => (
                        <button
                          key={kategori}
                          onClick={() => toggleCategory(kategori)}
                          className={`w-full text-left py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                            selectedCategories.includes(kategori)
                              ? 'bg-blue-500 text-white font-medium shadow-md border-l-4 border-yellow-400'
                              : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{kategori}</span>
                            {selectedCategories.includes(kategori) && (
                              <span className="text-yellow-400 text-xs">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Daerah */}
                  <div className="pb-3 sm:pb-4">
                    <h3 className="text-yellow-300 font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <span className="text-base sm:text-lg">📍</span>
                      Daerah Wisata
                    </h3>
                    <div className="space-y-1">
                      {daerahList.map((lokasi) => (
                        <button
                          key={lokasi}
                          onClick={() => toggleDaerah(lokasi)}
                          className={`w-full text-left py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                            selectedDaerah === lokasi
                              ? 'bg-blue-500 text-white font-medium shadow-md border-l-4 border-yellow-400'
                              : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{lokasi}</span>
                            {selectedDaerah === lokasi && (
                              <span className="text-yellow-400 text-xs flex-shrink-0 ml-2">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Clear filters button at bottom for mobile */}
                {(selectedCategories.length > 0 || selectedDaerah) && (
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-blue-500 bg-blue-800">
                    <button
                      onClick={() => {
                        setSelectedCategories([])
                        setSelectedDaerah('')
                        setSidebarOpen(false)
                      }}
                      className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium shadow-md flex items-center justify-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Hapus Semua Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Match exact layout */}
        <div className="flex-1 bg-white flex flex-col h-screen overflow-hidden">
          {/* Search Bar - Match exact position and style - Sticky */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
            <div className="flex gap-1.5 sm:gap-2 items-stretch justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari destinasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
              
              <div className="flex gap-1.5 sm:gap-2 items-stretch">
                {/* Filter Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden bg-blue-600 text-white px-2.5 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Filter</span>
                </button>
                
                {/* Personalization Button */}
                <button
                  onClick={handleOpenPersonalization}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2.5 sm:px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center text-base sm:text-lg"
                >
                  🎯
                </button>
              </div>
            </div>
          </div>

          {/* Content Area - Match exact empty state */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-96 py-12 sm:py-20 px-4 sm:px-6">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-b-transparent mb-3 sm:mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Memuat data destinasi...</p>
              </div>
            ) : showPersonalizedView ? (
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">🎯 Rekomendasi Destinasi Untukmu</h2>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">Berdasarkan hasil personalisasi yang kamu pilih</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPersonalizedView(false)
                      setFilteredDestinationsFromPersonalization([])
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium"
                  >
                    Kembali ke Filter Biasa
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDestinationsFromPersonalization.map((destinasi) => (
                    <div
                      key={destinasi.id_destinasi}
                      onClick={() => handleNavigateToDetail(destinasi.id_destinasi)}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={destinasi.url_gambar || '/images/placeholder.jpg'}
                          alt={destinasi.nama_destinasi}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-4 relative pb-12">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {destinasi.nama_destinasi}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-3">
                          {destinasi.lokasi}
                        </p>

                        {/* Tag kategori di pojok kanan bawah */}
                        <div className="absolute bottom-2 right-4">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
                            {destinasi.kategori}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredDestinations.length === 0 && (searchTerm.trim() !== '' || selectedCategories.length > 0 || selectedDaerah) ? (
              <div 
                key={searchTerm.trim() !== '' ? 'search-empty' : 'filter-empty'}
                className="flex flex-col items-center justify-center min-h-96 py-20 px-6 relative z-10"
              >
                <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  {searchTerm.trim() !== '' ? (
                    <Search className="h-16 w-16 text-gray-400" />
                  ) : (
                    <MapPin className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600 mb-2 text-center">
                  {searchTerm.trim() !== '' 
                    ? "Destinasi tidak ditemukan" 
                    : "Oops, Kamu belum memilih destinasi"
                  }
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-500 text-center max-w-md px-4">
                  {searchTerm.trim() !== '' 
                    ? "Coba periksa kembali kata kunci pencarianmu atau gunakan kata lain."
                    : "Yuk, pilih kategori dan daerah wisata untuk menemukan tempat seru!"
                  }
                </p>
                {searchTerm.trim() !== '' && (
                  <div className="mt-3 sm:mt-4 flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        // Force re-render by ensuring clean state
                        setTimeout(() => {
                          // Optional: could add additional cleanup here
                        }, 0)
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                    >
                      Hapus Pencarian
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 sm:p-4 lg:p-6">
                {viewMode === 'grid' ? (
                  <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {currentDestinations.map((destinasi) => (
                      <div
                        key={destinasi.id_destinasi}
                        onClick={() => handleNavigateToDetail(destinasi.id_destinasi)}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                      >
                        <div className="relative h-36 sm:h-40 overflow-hidden">
                          <img
                            src={destinasi.url_gambar || '/images/placeholder.jpg'}
                            alt={destinasi.nama_destinasi}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="p-3 sm:p-4 relative pb-11 sm:pb-12">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">
                            {destinasi.nama_destinasi}
                          </h3>
                          
                          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 truncate">
                            {destinasi.lokasi}
                          </p>

                          {/* Tag kategori di pojok kanan bawah */}
                          <div className="absolute bottom-2 right-3 sm:right-4">
                            <span className="bg-blue-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                              {destinasi.kategori}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {filteredDestinations.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredDestinations.length)} dari {filteredDestinations.length} destinasi
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <span className="hidden sm:inline">Sebelumnya</span>
                          <span className="sm:hidden">←</span>
                        </button>
                        <span className="text-xs sm:text-sm text-gray-700 px-2 sm:px-3">
                          <span className="hidden sm:inline">Halaman </span>{currentPage}<span className="hidden sm:inline"> dari {totalPages}</span>
                          <span className="sm:hidden">/{totalPages}</span>
                        </span>
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === totalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <span className="hidden sm:inline">Selanjutnya</span>
                          <span className="sm:hidden">→</span>
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                ) : (
                  <>
                  {/* List View */}
                  <div className="space-y-3 sm:space-y-4">{currentDestinations.map((destinasi) => (
                      <div
                        key={destinasi.id_destinasi}
                        className="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                      >
                        <div className="relative w-full sm:w-48 lg:w-64 h-32 sm:h-32 flex-shrink-0 cursor-pointer" onClick={() => handleNavigateToDetail(destinasi.id_destinasi)}>
                          <img
                            src={destinasi.url_gambar || '/images/placeholder.jpg'}
                            alt={destinasi.nama_destinasi}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 p-3 sm:p-4">
                          <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                            <div className="cursor-pointer flex-1" onClick={() => handleNavigateToDetail(destinasi.id_destinasi)}>
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 line-clamp-2">{destinasi.nama_destinasi}</h3>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(destinasi.id_destinasi)
                              }}
                              className={`p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ml-2 ${
                                favorites.includes(destinasi.id_destinasi)
                                  ? 'text-red-500'
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${favorites.includes(destinasi.id_destinasi) ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <div className="flex items-center text-gray-600 mb-1.5 sm:mb-2">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span className="text-xs sm:text-sm truncate">{destinasi.lokasi}</span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-6 text-xs sm:text-sm">
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{destinasi.jam_operasional}</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                {destinasi.kategori}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNavigateToDetail(destinasi.id_destinasi)
                                }}
                                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                              >
                                Lihat Detail
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls for List View */}
                  {!showPersonalizedView && filteredDestinations.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                      <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredDestinations.length)} dari {filteredDestinations.length} destinasi
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <span className="hidden sm:inline">Sebelumnya</span>
                          <span className="sm:hidden">←</span>
                        </button>
                        <span className="text-xs sm:text-sm text-gray-700 px-2 sm:px-3">
                          <span className="hidden sm:inline">Halaman </span>{currentPage}<span className="hidden sm:inline"> dari {totalPages}</span>
                          <span className="sm:hidden">/{totalPages}</span>
                        </span>
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === totalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <span className="hidden sm:inline">Selanjutnya</span>
                          <span className="sm:hidden">→</span>
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Questionnaire Modal */}
      {showQuestionnaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto relative">
            {/* Loading Overlay */}
            {isProcessingRecommendations && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center w-80">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-b-transparent mx-auto mb-6"></div>
                  <div className="mb-4">
                    <p className="text-gray-700 font-medium mb-3">{loadingText || 'Sedang memproses...'}</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{width: `${loadingProgress}%`}}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Menghitung kecocokan destinasi</span>
                      <span className="font-medium">{loadingProgress}%</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">🎯 Mencari destinasi terbaik untukmu...</p>
                </div>
              </div>
            )}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Personalisasi Destinasi</h2>
                <button
                  onClick={() => setShowQuestionnaire(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-black" />
                </button>
              </div>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm">Jawab pertanyaan berikut untuk mendapatkan rekomendasi yang sesuai</p>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Budget Question */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  1. Berapa budget yang kamu siapkan <span className="text-blue-600 font-semibold">(per orang)</span>?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'basic', label: 'Hemat', desc: '< Rp 30.000/orang' },
                    { id: 'value', label: 'Budget', desc: 'Rp 40-50k/orang' },
                    { id: 'plus', label: 'Menengah', desc: 'Rp 60-80k/orang' },
                    { id: 'premium', label: 'Premium', desc: '> Rp 80k/orang' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleQuestionnaireChange('budget', option.id)}
                      className={`p-2 sm:p-3 border-2 rounded-lg text-left transition-all duration-200 shadow-sm ${
                        questionnaireData.budget === option.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                      <div className={`text-[10px] sm:text-xs ${questionnaireData.budget === option.id ? 'text-blue-600' : 'text-gray-500'}`}>{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Question */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  2. Berapa lama waktu yang ingin kamu habiskan?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'short', label: 'Singkat', desc: '2-3 jam' },
                    { id: 'medium', label: 'Sedang', desc: '3-4 jam' },
                    { id: 'long', label: 'Panjang', desc: '4++ jam' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleQuestionnaireChange('duration', option.id)}
                      className={`p-2 sm:p-3 border-2 rounded-lg text-center transition-all duration-200 shadow-sm ${
                        questionnaireData.duration === option.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                      <div className={`text-[10px] sm:text-xs ${questionnaireData.duration === option.id ? 'text-blue-600' : 'text-gray-500'}`}>{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activities Question */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  3. Aktivitas apa yang kamu sukai? (bisa pilih lebih dari satu)
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'nature', label: 'Wisata Alam', desc: 'Gunung, air terjun, danau, pantai' },
                    { id: 'culture', label: 'Seni & Budaya', desc: 'Candi, museum, keraton, tradisi' },
                    { id: 'recreation', label: 'Rekreasi', desc: 'Taman hiburan, waterpark, mall' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        const currentActivities = questionnaireData.activities
                        if (currentActivities.includes(option.id)) {
                          handleQuestionnaireChange('activities', currentActivities.filter(a => a !== option.id))
                        } else {
                          handleQuestionnaireChange('activities', [...currentActivities, option.id])
                        }
                      }}
                      className={`w-full p-2 sm:p-3 border-2 rounded-lg text-left transition-all duration-200 shadow-sm relative ${
                        questionnaireData.activities.includes(option.id)
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                      <div className={`text-[10px] sm:text-xs ${questionnaireData.activities.includes(option.id) ? 'text-blue-600' : 'text-gray-500'}`}>{option.desc}</div>
                      {questionnaireData.activities.includes(option.id) && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Purpose Question */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  4. Apa tujuan utamamu berlibur?
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'healing', label: 'Menghilangkan Stress', desc: 'Relaksasi, refreshing, healing' },
                    { id: 'experience', label: 'Mencari Pengalaman Baru', desc: 'Coba hal baru, keluar zona nyaman' },
                    { id: 'content', label: 'Dokumentasi & Konten', desc: 'Foto estetik, konten media sosial' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleQuestionnaireChange('travelPurpose', option.id)}
                      className={`w-full p-2 sm:p-3 border-2 rounded-lg text-left transition-all duration-200 shadow-sm ${
                        questionnaireData.travelPurpose === option.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                      <div className={`text-[10px] sm:text-xs ${questionnaireData.travelPurpose === option.id ? 'text-blue-600' : 'text-gray-500'}`}>{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Size Question */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  5. Dengan siapa kamu akan traveling?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'solo', label: 'Sendiri', desc: 'Solo traveling' },
                    { id: 'couple', label: 'Berdua', desc: 'Dengan rekan' },
                    { id: 'family', label: 'Keluarga', desc: 'Orang tua & anak' },
                    { id: 'friends', label: 'Grup', desc: 'Grup teman' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleQuestionnaireChange('groupSize', option.id)}
                      className={`p-2 sm:p-3 border-2 rounded-lg text-left transition-all duration-200 shadow-sm ${
                        questionnaireData.groupSize === option.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm">{option.label}</div>
                      <div className={`text-[10px] sm:text-xs ${questionnaireData.groupSize === option.id ? 'text-blue-600' : 'text-gray-500'}`}>{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Preference Question (Optional) */}
              <div className="location-autocomplete-container">
                <label className="block text-xs sm:text-sm font-medium text-gray-900 mb-2">
                  6. Lokasi/Daerah yang kamu inginkan? <span className="text-gray-500 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationSearchTerm}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    onKeyDown={handleLocationKeyDown}
                    onFocus={() => {
                      if (locationSearchTerm.trim().length > 0) {
                        setShowLocationAutocomplete(true)
                      }
                    }}
                    placeholder="Ketik nama kota atau kabupaten..."
                    className="w-full p-2 sm:p-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition-all duration-200 text-xs sm:text-sm text-gray-900"
                    autoComplete="off"
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showLocationAutocomplete && getFilteredLocations().length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-400 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in">
                      {getFilteredLocations().map((location, index) => {
                        const isCombined = location.nama.startsWith('Gab ')
                        const isKota = location.nama.startsWith('Kota')
                        
                        let badgeClass = ''
                        let badgeText = ''
                        
                        if (isCombined) {
                          badgeClass = 'bg-purple-100 text-purple-700 border border-purple-300'
                          badgeText = 'Gab'
                        } else if (isKota) {
                          badgeClass = 'bg-blue-100 text-blue-700 border border-blue-300'
                          badgeText = 'Ko'
                        } else {
                          badgeClass = 'bg-green-100 text-green-700 border border-green-300'
                          badgeText = 'Kab'
                        }
                        
                        const displayName = location.nama
                          .replace('Gab ', '')
                          .replace('Kota ', '')
                          .replace('Kab ', '')
                        
                        return (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => selectLocation(location.nama)}
                            className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                              index === selectedAutocompleteIndex 
                                ? 'bg-blue-100 border-blue-200' 
                                : 'hover:bg-blue-50'
                            }`}
                          >
                            <span className={`text-xs font-bold px-2 py-1 rounded ${badgeClass}`}>
                              {badgeText}
                            </span>
                            <span className="text-sm text-gray-900 font-medium flex-1">
                              {displayName}
                            </span>
                            {isCombined && (
                              <span className="text-xs text-purple-600 mr-1">Kota + Kab</span>
                            )}
                            <Search className="h-4 w-4 text-gray-400" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                  
                  {questionnaireData.preferredLocation && questionnaireData.preferredLocation.trim() !== '' && !showLocationAutocomplete && (
                    <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                      <div className="text-blue-600 mt-0.5 text-sm">💡</div>
                      <div className="flex-1">
                        <p className="text-[10px] sm:text-xs text-blue-800 font-medium">
                          Hasil rekomendasi <span className="font-bold">hanya akan menampilkan destinasi di {questionnaireData.preferredLocation}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLocationSearchTerm('')
                          setQuestionnaireData(prev => ({ ...prev, preferredLocation: '' }))
                          setShowLocationAutocomplete(false)
                          setSelectedAutocompleteIndex(-1)
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  <span className="hidden sm:inline">Mulai ketik untuk melihat daftar kota/kabupaten • Gunakan ↑↓ untuk navigasi • Enter untuk pilih</span>
                  <span className="sm:hidden">Ketik untuk melihat daftar</span>
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => {
                  // Reset questionnaire data to restart
                  setQuestionnaireData({
                    budget: '',
                    duration: '',
                    activities: [],
                    travelPurpose: '',
                    groupSize: '',
                    preferredLocation: ''
                  })
                  setLocationSearchTerm('')
                  setShowLocationAutocomplete(false)
                  setSelectedAutocompleteIndex(-1)
                }}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Ulang
              </button>
              <button
                onClick={processQuestionnaire}
                disabled={!questionnaireData.budget || !questionnaireData.duration || questionnaireData.activities.length === 0 || !questionnaireData.travelPurpose || !questionnaireData.groupSize || isProcessingRecommendations}
                className={`px-3 sm:px-4 py-2 rounded transition-all duration-200 text-xs sm:text-sm flex items-center gap-2 ${
                  questionnaireData.budget && questionnaireData.duration && questionnaireData.activities.length > 0 && questionnaireData.travelPurpose && questionnaireData.groupSize && !isProcessingRecommendations
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isProcessingRecommendations && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-white"></div>
                )}
                {isProcessingRecommendations ? 'Memproses...' : 'Dapatkan Rekomendasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Results Modal */}
      {showPersonalizedResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 animate-scale-in">
            <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">🎯 Rekomendasi Destinasi</h2>
                <button
                  onClick={() => setShowPersonalizedResults(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                </button>
              </div>
              <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">Berdasarkan preferensi kamu, berikut adalah destinasi yang paling cocok</p>
              
              {/* Scroll to Bottom Button */}
              {personalizedResults.length > 0 && (
                <button
                  onClick={() => {
                    bottomActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                  }}
                  className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 sm:py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Gunakan Rekomendasi Ini</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>
              )}
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              {personalizedResults.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
                  <p className="text-gray-800 font-semibold text-sm sm:text-lg mb-2">
                    Tidak ditemukan destinasi di {questionnaireData.preferredLocation}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 px-4">
                    Silakan coba lokasi lain atau kosongkan filter lokasi untuk melihat semua destinasi.
                  </p>
                  <button
                    onClick={() => {
                      setShowPersonalizedResults(false)
                      setQuestionnaireData(prev => ({ ...prev, preferredLocation: '' }))
                      setLocationSearchTerm('')
                      setShowQuestionnaire(true)
                    }}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                  >
                    Ubah Kriteria
                  </button>
                </div>
              ) : (
                <>
                  {/* Summary Statistics */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-blue-800">
                          <span className="font-semibold">✨ {personalizedResults.length} destinasi terpilih</span>
                          {questionnaireData.preferredLocation ? (
                            <span className="hidden sm:inline"> di <span className="font-bold">{questionnaireData.preferredLocation}</span></span>
                          ) : (
                            <span className="hidden sm:inline"> dari {destinasiData.length} destinasi</span>
                          )}
                        </p>
                        <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                          Diurutkan berdasarkan tingkat kecocokan
                        </p>
                      </div>
                      {personalizedResults.length > 0 && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg sm:text-2xl font-bold text-blue-700">
                            {personalizedResults[0].matchPercentage}%
                          </div>
                          <div className="text-[10px] sm:text-xs text-blue-600 whitespace-nowrap">Skor Tertinggi</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Display each destination individually with its own score */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {personalizedResults.map((result, index) => {
                      const destinasi = result.destination
                      
                      // Determine badge style based on match percentage
                      let badgeStyle = ''
                      let badgeLabel = ''
                      let borderStyle = ''
                      
                      if (result.matchPercentage >= 80) {
                        badgeStyle = 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        badgeLabel = '🌟 Sangat Cocok'
                        borderStyle = 'border-green-300 hover:border-green-500'
                      } else if (result.matchPercentage >= 60) {
                        badgeStyle = 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        badgeLabel = '✅ Cocok'
                        borderStyle = 'border-blue-300 hover:border-blue-500'
                      } else if (result.matchPercentage >= 40) {
                        badgeStyle = 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                        badgeLabel = '👍 Cukup Cocok'
                        borderStyle = 'border-yellow-300 hover:border-yellow-500'
                      } else {
                        badgeStyle = 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                        badgeLabel = '💡 Alternatif'
                        borderStyle = 'border-orange-300 hover:border-orange-500'
                      }

                      return (
                        <div
                          key={destinasi.id_destinasi}
                          onClick={() => handleNavigateToDetail(destinasi.id_destinasi)}
                          className={`bg-white border-2 ${borderStyle} rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}
                        >
                          {/* Match Percentage Badge */}
                          <div className="relative">
                            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10">
                              <div className={`${badgeStyle} px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1`}>
                                <span>{result.matchPercentage}%</span>
                              </div>
                            </div>
                            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
                              <div className="bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold text-gray-700 shadow">
                                #{index + 1}
                              </div>
                            </div>
                            <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
                              <img
                                src={destinasi.url_gambar || '/images/placeholder.jpg'}
                                alt={destinasi.nama_destinasi}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          </div>

                          <div className="p-3 sm:p-4">
                            {/* Category Badge */}
                            <div className="mb-1.5 sm:mb-2">
                              <span className={`${badgeStyle} px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold inline-block`}>
                                {badgeLabel}
                              </span>
                            </div>

                            <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2 min-h-[40px] sm:min-h-[48px]">
                              {destinasi.nama_destinasi}
                            </h4>

                            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                              <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-blue-500" />
                                <span className="line-clamp-1">{destinasi.lokasi}</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                <span className="bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium text-gray-700">
                                  {destinasi.kategori}
                                </span>
                              </div>
                            </div>

                            {/* Match Score Bar */}
                            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] sm:text-xs font-medium text-gray-600">Tingkat Kecocokan</span>
                                <span className="text-[10px] sm:text-xs font-bold text-gray-900">{result.matchPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    result.matchPercentage >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                    result.matchPercentage >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                    result.matchPercentage >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                    'bg-gradient-to-r from-orange-400 to-orange-600'
                                  }`}
                                  style={{ width: `${result.matchPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div ref={bottomActionsRef} className="p-3 sm:p-4 md:p-6 border-t border-gray-200 flex justify-between gap-2">
              <button
                onClick={() => {
                  setShowPersonalizedResults(false)
                  // Reset questionnaire data
                  setQuestionnaireData({
                    budget: '',
                    duration: '',
                    activities: [],
                    travelPurpose: '',
                    groupSize: '',
                    preferredLocation: ''
                  })
                  setLocationSearchTerm('')
                  setShowLocationAutocomplete(false)
                  setSelectedAutocompleteIndex(-1)
                }}
                className="px-3 sm:px-4 md:px-6 py-2 border border-blue-600 rounded-lg text-blue-600 hover:bg-gray-50 transition-colors text-xs sm:text-sm"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  // Apply personalized results to main page
                  const allRecommendedDestinations = personalizedResults.map(result => result.destination)
                  setFilteredDestinationsFromPersonalization(allRecommendedDestinations)
                  setShowPersonalizedResults(false)
                  setShowPersonalizedView(true)
                }}
                className="bg-blue-600 text-white px-3 sm:px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal - Prompt Login/Register */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 md:p-8 transform transition-all duration-300 scale-100 animate-scale-in">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 md:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              {/* Title & Message */}
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                Login Diperlukan
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2">
                Untuk menggunakan fitur <span className="font-semibold text-blue-600">Personalisasi Destinasi</span>, 
                Anda perlu login terlebih dahulu.
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowAuthModal(false)
                    router.push('/login?redirect=/destinasi&action=personalize')
                  }}
                  className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm md:text-base"
                >
                  Login Sekarang
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(false)
                    router.push('/register?redirect=/destinasi&action=personalize')
                  }}
                  className="w-full bg-white text-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors font-medium text-xs sm:text-sm md:text-base"
                >
                  Belum Punya Akun? Daftar
                </button>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 transition-colors font-medium text-xs sm:text-sm md:text-base mt-1 sm:mt-2 py-1"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(251, 191, 36, 0.6), rgba(245, 158, 11, 0.6));
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #fbbf24, #f59e0b);
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}