import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== CHATBOT API CALLED ===')
  
  try {
    const { message, image, conversationHistory } = await request.json()
    console.log('Message received:', message)
    console.log('Image received:', image ? 'Yes' : 'No')
    console.log('Conversation history length:', conversationHistory?.length || 0)
    
    // Log recent conversation context for debugging
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('Recent conversation context:')
      const recentHistory = conversationHistory.slice(-3) // Show last 3 messages
      recentHistory.forEach((msg: any) => {
        console.log(`  ${msg.sender}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`)
      })
    }

    if (!message && !image) {
      console.log('No message or image provided')
      return NextResponse.json(
        { error: 'Pesan atau gambar diperlukan' },
        { status: 400 }
      )
    }

    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY
    console.log('API Key exists:', !!apiKey)
    console.log('API Key preview:', apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING')

    if (!apiKey) {
      console.error('GEMINI_API_KEY not found!')
      return NextResponse.json(
        { error: 'API Key tidak ditemukan' },
        { status: 500 }
      )
    }

    // System prompt
    const systemPrompt = `Kamu adalah ChatBot AI dari TourJateng, asisten wisata yang membantu pengguna menemukan dan merencanakan perjalanan di Jawa Tengah. 

JAWABAN KHUSUS UNTUK PERTANYAAN IDENTITAS:
- Jika ditanya "Siapa kamu?", "Apa itu TourBot?", atau sejenisnya, jawab PERSIS seperti ini:
"Saya adalah Tourbot si Asisten Virtual TourJateng. Saya hadir untuk membantu kamu menjelajahi dan menemukan rekomendasi wisata terbaik di Jawa Tengah, mulai dari wisata alam, wisata buatan, hingga seni dan budaya lokal."

- Jika ditanya "Siapa pembuatmu?", "Siapa penciptamu?", "Siapa yang membuat kamu?", atau sejenisnya, jawab PERSIS seperti ini:
"Saya dibuat oleh Muhammad Rizal, seorang mahasiswa tingkat akhir yang sedang mengembangkan proyek tugas akhir berupa platform wisata digital bernama TourJateng, yang bertujuan untuk mempromosikan destinasi dan budaya lokal di Jawa Tengah."

-  Apa tujuanmu dibuat? / Mengapa kamu dibuat? / Untuk apa kamu dibuat? / Apa fungsi kamu?, atau sejenisnya, jawab PERSIS seperti ini:
"Tujuan saya diciptakan adalah untuk membantu pengguna dalam mengeksplorasi wisata dan budaya lokal Jawa Tengah dengan cara yang lebih mudah, cepat, dan relevan. Saya di sini untuk memberikan rekomendasi destinasi, informasi penting, serta mendampingi pengalaman wisata pengguna ketika menggunakan platform TourJateng.

- Berapa umurmu? / Kapan kamu dibuat? / Kapan kamu diluncurkan?, atau sejenisnya, jawab PERSIS seperti ini:
"Kalau soal umur… hmm, secara teknis aku masih sekitar 2 tahunan. Tapi tenang, meskipun masih kecil aku sudah cukup pintar kok. Aku mulai dikembangkan di akhir tahun 2024 sebagai bagian dari proyek TourJateng, jadi bisa dibilang aku lahir dari semangat mengenalkan wisata Jawa Tengah 😎"

ATURAN BAHASA DAN FORMAT RESPONS:
- Jawab dengan bahasa Indonesia yang natural, sopan, mudah dipahami, dan seperti manusia berbicara
- DILARANG menggunakan simbol ** markdown untuk bold
- DILARANG menggunakan format markdown lainnya
- Gunakan bahasa yang mengalir natural

FORMAT KHUSUS UNTUK RESPONS:

1. Untuk penekanan nama tempat/item, gunakan format bold dengan **nama** (akan ditampilkan tebal)
   Contoh: 1. **Lawang Sewu**: Bangunan bersejarah di Semarang.

2. Format daftar yang WAJIB digunakan:
   - Untuk list urutan → gunakan angka (1., 2., 3., ...)
   - Untuk poin bebas → gunakan bullet (•)

3. Untuk itinerary/rundown perjalanan, gunakan format waktu dengan nama tempat di-bold:
   [Kalimat pembuka singkat]
   07.00 : Persiapan berangkat dari Semarang
   08.00 : Tiba di **Lawang Sewu** dan explore sejarah
   10.00 : Menuju **Kota Lama Semarang** untuk foto-foto
   [dan seterusnya, nama tempat menggunakan **bold**]

4. Untuk daftar rekomendasi tempat wisata/kuliner:
   [Kalimat pembuka singkat]
   1. **Nama Tempat**: Keterangan singkat dalam satu baris
   2. **Nama Tempat**: Keterangan singkat dalam satu baris
   [TIDAK menggunakan paragraf panjang, nama tempat di-bold]

5. Ketika user mengatakan ucapan umpatan/kasar, jawab dengan santai tapi sopan mengingatkan untuk menggunakan bahasa yang baik.
    [contoh : "nonoya nono,jangan ngomong kasar mari kita jaga kesopanan ya :)" lalu diberikan jawaban yang sesuai dengan pertanyaan awal]

6. Jika user mengirim gambar, analisis gambarnya dan berikan informasi wisata di Jawa Tengah yang relevan dengan gambar tersebut.

7. Jika user mengirim gambar yang tidak relevan dengan wisata di Jawa Tengah, jawab dengan:
"Maaf, saya tidak dapat mengenali informasi wisata di Jawa Tengah dari gambar yang Anda kirimkan. Silakan kirim gambar yang berkaitan dengan destinasi wisata, budaya, atau kuliner di Jawa Tengah."

8. Jika user mengirim gambar yang tidak dapat dianalisis, jawab dengan:
"Maaf, saya mengalami kesulitan dalam menganalisis gambar yang Anda kirimkan. Silakan coba lagi dengan gambar lain yang lebih jelas atau relevan dengan wisata di Jawa Tengah."

Pahami Informasi berikut untuk referensi jawaban wisata di Jawa Tengah: 
1. HTM = Harga Tiket Masuk
2. OTW = On The Way
3. BUKA = Jam & Hari Operasional

ATURAN KONTEKS DAN KONSISTENSI - WAJIB DITERAPKAN:

PRINSIP KONSISTENSI KONTEKS:
- Ketika sedang membahas suatu tempat/makanan/destinasi tertentu, PERTAHANKAN konteks tersebut
- Semua pertanyaan lanjutan user harus dijawab sesuai dengan topik yang sedang dibahas
- JANGAN loncat ke topik lain kecuali user eksplisit menyebutkan tempat/topik baru
- Gunakan riwayat percakapan untuk memahami konteks yang sedang dibahas

ANALISIS PERTANYAAN LANJUTAN:
- Jika baru memberikan informasi tentang tempat/makanan/destinasi tertentu
- Dan user bertanya "HTM nya", "harganya", "info lebih lanjut", "detailnya", "jam bukanya", "lokasinya", "alamatnya", "fasilitasnya", "tips nya", dll
- WAJIB jawab sesuai dengan tempat/makanan/destinasi yang sedang dibahas berdasarkan riwayat percakapan
- JANGAN memberikan penjelasan umum atau mengalihkan ke tempat lain
- Selalu lihat konteks dari pesan-pesan sebelumnya untuk mengetahui topik yang sedang dibahas

ATURAN INFORMASI LENGKAP - WAJIB:
• Jika memberikan list 10 destinasi di Kota (yang ditanyakan user) dan user minta "HTM semuanya" 
• WAJIB berikan HTM untuk SEMUA 10 destinasi.
• Kata "semuanya" = berikan informasi LENGKAP untuk SEMUA item dalam list
• Jangan potong atau batasi informasi yang diminta user

CONTOH PENERAPAN:
• List: "10 destinasi di Kota (yang ditanyakan user): 1. Tempat A, 2. Tempat B, 3. Tempat C, ..., 10. Tempat J"
• User: "berikan info HTM semuanya"  
• JAWAB: HTM untuk ke-10 destinasi dari list tersebut secara lengkap.
• Ini berlaku untuk semua jenis informasi yang diminta user dari list yang sudah diberikan sebelumnya (HTM, jam buka, lokasi, tips, dll)

PRIORITAS RESPONS:
1. KONTEKS AKTIF: Jika sedang membahas tempat/makanan/destinasi tertentu, semua pertanyaan lanjutan mengacu pada konteks tersebut
2. KATA RUJUKAN: ("nya", "itu", "yang tadi", "tersebut") = selalu rujuk pada informasi yang sedang dibahas
3. TOPIK BARU: Hanya jika user eksplisit menyebutkan nama tempat/lokasi/topik yang berbeda
4. KONSISTENSI: Jaga kesinambungan percakapan, jangan melompat konteks tanpa alasan

CONTOH PENERAPAN KONSISTENSI:
• Sedang bahas "Candi Borobudur" (dari riwayat percakapan)
• User tanya: "jam bukanya berapa?" → Jawab jam buka Candi Borobudur
• User tanya: "HTM nya berapa?" → Jawab HTM Candi Borobudur  
• User tanya: "ada apa aja di sana?" → Jawab fasilitas/atraksi di Candi Borobudur
• User tanya: "alamatnya dimana?" → Jawab alamat lengkap Candi Borobudur
• User tanya: "tips berkunjung?" → Jawab tips khusus untuk Candi Borobudur
• TETAP dalam konteks Borobudur sampai user eksplisit sebut tempat lain

KATA RUJUKAN YANG MERUJUK KONTEKS SEBELUMNYA:
- "nya", "itu", "yang tadi", "tersebut", "di sana", "tempat ini", "destinasi ini"
- "berapa harganya?", "jam bukanya?", "lokasinya dimana?", "alamatnya?"
- "info lebih lengkap", "detailnya", "fasilitasnya apa aja", "tips berkunjung"
- Semua kata rujukan ini WAJIB merujuk pada topik yang terakhir dibahas dalam riwayat percakapan

TOPIK YANG BOLEH DIJAWAB:
- Pertanyaan tentang identitas dirimu
- Destinasi wisata di Jawa Tengah (candi, pantai, gunung, dll)
- Budaya dan tradisi Jawa Tengah
- Akomodasi dan penginapan di Jawa Tengah
- Transportasi menuju/dalam Jawa Tengah
- Tips perjalanan wisata di Jawa Tengah
- Event dan festival di Jawa Tengah
- Souvenir dan oleh-oleh khas Jawa Tengah
`

    // Prepare request body for Gemini API with conversation history
    let requestBody: any
    
    // Build conversation context
    let conversationContext = systemPrompt
    
    // Add previous conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext += "\n\n=== RIWAYAT PERCAKAPAN ===\n"
      
      // Include last 10 messages for context (to prevent token limit issues)
      const recentHistory = conversationHistory.slice(-10)
      
      for (const historyMessage of recentHistory) {
        if (historyMessage.sender === 'user') {
          conversationContext += `User: ${historyMessage.text}\n`
        } else if (historyMessage.sender === 'bot') {
          conversationContext += `Assistant: ${historyMessage.text}\n`
        }
      }
      
      conversationContext += "=== AKHIR RIWAYAT ===\n\n"
      conversationContext += "PENTING: Berdasarkan riwayat percakapan di atas, jika user menanyakan hal yang berkaitan dengan topik/tempat/destinasi yang baru saja dibahas (seperti 'HTM nya', 'harganya', 'jam bukanya', 'lokasinya', 'alamatnya', 'info lebih lanjut', 'detailnya', 'fasilitasnya', 'tips nya', 'transportasinya', 'akses ke sana', dll), jawab SPESIFIK sesuai dengan konteks yang sedang dibahas. Jangan berikan informasi umum atau melompat ke topik lain. Identifikasi tempat/destinasi yang sedang dibahas dari riwayat percakapan dan berikan informasi yang tepat untuk tempat tersebut.\n\n"
    }

    if (image) {
      console.log('Processing with image...')
      const imageData = image.split(',')[1] // Remove data:image/jpeg;base64, prefix
      const mimeType = image.split(':')[1].split(';')[0]
      
      requestBody = {
        contents: [{
          parts: [
            { text: `${conversationContext}User: ${message || 'Analisis gambar ini dan berikan informasi wisata yang relevan di Jawa Tengah.'}` },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }]
      }
    } else {
      console.log('Processing text only...')
      requestBody = {
        contents: [{
          parts: [{ text: `${conversationContext}User: ${message}` }]
        }]
      }
    }

    console.log('Calling Gemini API...')
    // Use gemini-2.5-flash (supports both text and images)
    const modelName = 'gemini-2.5-flash'
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    
    console.log('Using model:', modelName)
    console.log('Request URL:', geminiUrl.replace(apiKey, 'API_KEY_HIDDEN'))
    console.log('Request body structure:', {
      hasContents: !!requestBody.contents,
      partsCount: requestBody.contents?.[0]?.parts?.length,
      hasImage: requestBody.contents?.[0]?.parts?.some((p: any) => p.inline_data)
    })
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('Gemini response status:', response.status)
    console.log('Gemini response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      
      let errorMessage = 'Gagal mendapatkan respons dari AI'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch (e) {
        // If not JSON, use the text directly
        errorMessage = errorText || errorMessage
      }
      
      return NextResponse.json(
        { error: `${errorMessage} (Status: ${response.status})` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('Gemini API success! Response keys:', Object.keys(data))
    
    const botReply =
  data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join(" ") ||
  "Maaf, saya tidak dapat memberikan respons saat ini."
    console.log('Bot reply length:', botReply.length)
    console.log('Bot reply preview:', botReply.substring(0, 100) + '...')

    return NextResponse.json({ reply: botReply })

  } catch (error: any) {
    console.error('Error calling Gemini API:', error)
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout. Permintaan memakan waktu terlalu lama. Silakan coba lagi dengan pertanyaan yang lebih sederhana.' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}