# Integrasi API Gemini untuk TourBot

## 🎯 Fitur yang Diimplementasikan

### ✅ TourBot dengan Gemini AI
- **AI Assistant**: TourBot sekarang menggunakan Google Gemini AI (gemini-1.5-flash) untuk memberikan respons cerdas
- **Fokus Wisata Jawa Tengah**: Bot khusus dirancang untuk memberikan informasi wisata, kuliner, budaya, dan akomodasi di Jawa Tengah
- **Dukungan Gambar**: Bot dapat menganalisis gambar yang dikirim user dan memberikan informasi wisata yang relevan

### 🔧 Implementasi Teknis

#### API Endpoint: `/api/chatbot`
- **Method**: POST
- **Input**: 
  - `message`: Teks pesan dari user (string)
  - `image`: Gambar dalam format base64 (optional)
- **Output**: 
  - `reply`: Respons dari AI bot (string)
  - `error`: Error message jika ada masalah (string)

#### Konfigurasi Environment
File `.env.local` sudah dikonfigurasi dengan:
```env
GEMINI_API_KEY="AIzaSyDW8MxRWDG5MhIo1aUmneZZ7ZlXSs0uREM"
```

#### Dependencies Baru
- `@google/generative-ai`: Package resmi Google untuk Gemini AI

### 🤖 Karakteristik TourBot

TourBot dirancang dengan karakteristik khusus:
- **Bahasa**: Menggunakan bahasa Indonesia yang ramah dan santai
- **Fokus**: Informasi wisata Jawa Tengah (destinasi, kuliner, budaya, akomodasi)
- **Fitur**: 
  - Memberikan tips praktis (jam buka, harga tiket, cara menuju lokasi)
  - Analisis gambar untuk rekomendasi wisata
  - Saran alternatif di Jawa Tengah untuk destinasi luar wilayah
- **UI/UX**: Menggunakan emoji untuk membuat percakapan lebih menarik

### 📱 Cara Penggunaan

1. **Chat Teks**: Ketik pertanyaan tentang wisata Jawa Tengah
2. **Upload Gambar**: Klik icon attachment untuk upload gambar, bot akan menganalisis dan memberikan rekomendasi
3. **Kombinasi**: Kirim gambar dengan teks untuk pertanyaan yang lebih spesifik

### 🔄 Fitur Chat yang Tersedia

- ✅ Real-time chat dengan AI
- ✅ Upload dan preview gambar
- ✅ Riwayat chat dengan sidebar
- ✅ Chat favorites dan management
- ✅ Fullscreen mode
- ✅ Responsive design
- ✅ Error handling yang baik

### 🚀 Penggunaan

Server development: `npm run dev`
Akses aplikasi: `http://localhost:3001/chatbot`

Bot siap digunakan dan akan memberikan respons yang cerdas sesuai dengan pertanyaan tentang wisata di Jawa Tengah!