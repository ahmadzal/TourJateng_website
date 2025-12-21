// Filter kata kasar/vulgar untuk komentar forum
// File: lib/profanity-filter.ts

// Daftar kata kasar dalam Bahasa Indonesia
const indonesianProfanity = [
  'anjing', 'babi', 'bangsat', 'bajingan', 'brengsek', 'kampret', 'keparat', 
  'kontol', 'memek', 'pepek', 'peler', 'ngentot', 'fuck', 'shit', 'damn',
  'tolol', 'goblok', 'bodoh', 'idiot', 'sialan', 'setan', 'iblis', 'laknat',
  'tai', 'tahi', 'berak', 'poop', 'bangke', 'mampus', 'geblek', 'perek',
  'pelacur', 'sundal', 'lonte', 'jablay', 'lacur', 'bitches', 'bitch',
  'asshole', 'bastard', 'motherfucker', 'pussy', 'dick', 'cock', 'penis',
  'vagina', 'boobs', 'tits', 'ass', 'butt', 'sexy', 'horny', 'porn',
  'porno', 'bokep', 'ngocok', 'coli', 'onani', 'masturbasi', 'oral',
  'anal', 'threesome', 'gangbang', 'orgasme', 'klimaks', 'ejakulasi', 'paha','dada', 'selangkangan', 
  // Kata plesetan
  'anjay', 'anjir', 'njir', 'bjir', 'pantek', 'kamvret', 'silit',
  'bugil', 'telanjang', 'badjingan', 'dongo' ,'anjeng' , 'anj'
]

// Daftar kata kasar dalam Bahasa Inggris
const englishProfanity = [
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks', 'shit', 'shits', 'shitting',
  'damn', 'damned', 'hell', 'bitch', 'bitches', 'bitching', 'asshole',
  'assholes', 'bastard', 'bastards', 'motherfucker', 'motherfuckers',
  'pussy', 'pussies', 'dick', 'dicks', 'cock', 'cocks', 'penis', 'penises',
  'vagina', 'vaginas', 'boobs', 'boob', 'tits', 'tit', 'nipple', 'nipples',
  'ass', 'asses', 'butt', 'butts', 'butthole', 'anus', 'whore', 'whores',
  'slut', 'sluts', 'prostitute', 'hooker', 'hookers', 'retard', 'retarded',
  'stupid', 'idiot', 'idiots', 'moron', 'morons', 'dumbass', 'jackass',
  'piss', 'pissed', 'pissing', 'crap', 'crappy', 'suck', 'sucks', 'sucked'
]

// Daftar kata kasar dalam bahasa Jawa Tengah
const javanesecentalProfanity = [
  'asu', 'jancuk', 'jancok', 'cok', 'cuk', 'matamu', 'ngene', 'ngono',
  'pekok', 'gembel', 'edan', 'gila', 'sinting', 'picek', 'buta',
  'budeg', 'tuli', 'belo', 'bodho', 'ngunu', 'ra', 'ora',
  'kimak', 'tempik', 'jembut', 'itil', 'memeng', 'burung', 'kontol',
  'palkon', 'sempak', 'kathok', 'celeng', 'wedus', 'kethek',
  'bajul', 'ula', 'tokek', 'kadal', 'tikus', 'belatung', 'coro',
  'bangkai', 'mayit', 'jenazah', 'mati', 'pati', 'seda', 'gugur',
  'tewas', 'wafat', 'mangkat', 'nuju', 'lungo', 'lunga', 'mlaku', 'crot' , 'ngewe' , 'kondom' , 
  // Kata plesetan Jawa
  'asuw', 'asuk'
]

// Daftar singkatan kata kasar
const abbreviationProfanity = [
  'ajg', 'ajng', 'kntl', 'bgst', 'bngst', 'mmk', 'plr', 'kmprt',
  'bjngn', 'brngsk', 'tlol', 'gblk', 'ppr', 'cuk', 'jnck'
]

// Daftar kata dengan perpaduan huruf dan angka (leetspeak)
const leetspeakProfanity = [
  'bug1l', 'bug11', 'bu91l', '4jg', '4ng1ng', '4nj1ng', 'b4b1',
  'b4ng54t', 'b4j1ng4n', 'k0nt0l', 'k0nt01', 'm3m3k', 'p3p3k',
  't0l01', 'g0bl0k', '5h1t', 'f4ck', 'f4k', 'b1tch', '455h0l3',
  '45u', '4su', 'j4ncuk', 'j4nc0k', 'p3k0k', 'd0ng0'
]

// Gabungan semua kata kasar
const allProfanity = [
  ...indonesianProfanity,
  ...englishProfanity,
  ...javanesecentalProfanity,
  ...abbreviationProfanity,
  ...leetspeakProfanity
]

/**
 * Filter kata kasar dalam teks
 * Mengubah kata kasar menjadi *** di awal dengan sisa huruf asli
 * @param text - Teks yang akan difilter
 * @returns Teks yang sudah difilter
 */
export function filterProfanity(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  let filteredText = text

  // Loop through semua kata kasar
  allProfanity.forEach(badWord => {
    // Case insensitive regex untuk mencocokkan kata utuh
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi')
    
    // Replace dengan pola *** + sisa huruf
    filteredText = filteredText.replace(regex, (match) => {
      if (match.length <= 2) {
        return '*'.repeat(match.length)
      }
      // Ambil 3 karakter pertama jadi ***, sisanya tetap
      return '***' + match.slice(3)
    })
  })

  return filteredText
}

/**
 * Cek apakah teks mengandung kata kasar
 * @param text - Teks yang akan dicek
 * @returns boolean - true jika mengandung kata kasar
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  const lowerText = text.toLowerCase()
  
  return allProfanity.some(badWord => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'i')
    return regex.test(lowerText)
  })
}

/**
 * Hitung jumlah kata kasar dalam teks
 * @param text - Teks yang akan dicek
 * @returns number - Jumlah kata kasar yang ditemukan
 */
export function countProfanity(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  const lowerText = text.toLowerCase()
  let count = 0
  
  allProfanity.forEach(badWord => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'gi')
    const matches = lowerText.match(regex)
    if (matches) {
      count += matches.length
    }
  })

  return count
}

/**
 * Dapatkan daftar kata kasar yang ditemukan dalam teks
 * @param text - Teks yang akan dicek
 * @returns string[] - Array kata kasar yang ditemukan
 */
export function getProfanityWords(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return []
  }

  const lowerText = text.toLowerCase()
  const foundWords: string[] = []
  
  allProfanity.forEach(badWord => {
    const regex = new RegExp(`\\b${badWord}\\b`, 'i')
    if (regex.test(lowerText)) {
      foundWords.push(badWord)
    }
  })

  return foundWords
}