# Update Artikel - Integrasi Supabase

## Ringkasan Perubahan

Halaman artikel telah diupdate untuk menggunakan data dari tabel `artikel` di Supabase database sesuai dengan struktur tabel yang Anda berikan.

## Struktur Tabel Artikel

Tabel `artikel` memiliki kolom-kolom berikut:

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id_artikel` | int8 | Primary Key - ID unik artikel |
| `judul_artikel` | text | Judul artikel |
| `deskripsi_artil` | text | Deskripsi/konten artikel |
| `kategori_artikel` | text | Kategori artikel (Alam, Sejarah, Seni Budaya, dll) |
| `durasi_baca` | text | Estimasi waktu baca (contoh: "5 menit") |
| `penerbit` | text | Penerbit/penulis artikel |
| `url_gambar` | text | URL gambar artikel |
| `tanggal_terbit` | text | Tanggal terbit artikel |

## File yang Diupdate

### 1. `app/artikel/page.tsx`
- ✅ Fetch artikel dari Supabase menggunakan `supabase.from('artikel').select('*')`
- ✅ Update interface `Article` sesuai struktur database
- ✅ Update filter dan sorting menggunakan field baru
- ✅ Update rendering artikel card dengan field dari database
- ✅ Tambah loading state

### 2. `app/artikel/[id]/page.tsx`
- ✅ Fetch detail artikel berdasarkan `id_artikel`
- ✅ Fetch artikel terkait berdasarkan `kategori_artik`
- ✅ Update semua field display (judul, deskripsi, penerbit, dll)
- ✅ Tambah loading state dan error handling

### 3. `components/ArticleList.tsx`
- ✅ Fetch artikel terbaru (limit 4) untuk featured section
- ✅ Update carousel artikel dengan data dari Supabase
- ✅ Update semua field display
- ✅ Tambah loading state

## Fitur yang Tersedia

### Halaman List Artikel (`/artikel`)
- 🔍 Search artikel berdasarkan judul dan deskripsi
- 🏷️ Filter berdasarkan kategori
- 📅 Sort berdasarkan tanggal (terbaru/terlama)
- 📄 Pagination (6 artikel per halaman)
- ⚡ Loading state saat fetch data

### Halaman Detail Artikel (`/artikel/[id]`)
- 📖 Menampilkan detail lengkap artikel
- 🖼️ Featured image dari database
- 👤 Informasi penerbit dan tanggal terbit
- ⏱️ Durasi baca
- 🔗 Artikel terkait (kategori yang sama)
- 📤 Tombol share (Twitter, Facebook, WhatsApp)
- ⚡ Loading state dan error handling

### Komponen Article List (Homepage)
- 🎯 Featured artikel dengan auto-rotate
- 📋 List 4 artikel terbaru
- 🖱️ Manual selection dengan pause auto-rotate
- ⏰ Time ago display untuk tanggal terbit

## Setup Database

File `create-artikel-table.sql` sudah dibuat untuk membuat tabel di Supabase. Langkah-langkah:

1. Buka Supabase Dashboard
2. Masuk ke SQL Editor
3. Copy paste isi file `create-artikel-table.sql`
4. Jalankan query

Atau jika tabel sudah ada, pastikan strukturnya sesuai dengan yang ditentukan.

## Cara Menambah Artikel

### Melalui Supabase Dashboard:
1. Buka Supabase Dashboard
2. Pilih Table Editor
3. Pilih tabel `artikel`
4. Klik "Insert row"
5. Isi semua field yang diperlukan:
   - `judul_artikel`: Judul artikel
   - `deskripsi_artil`: Konten artikel (bisa multi-paragraph)
   - `kategori_artik`: Kategori (Alam, Sejarah, Seni Budaya, Kuliner, dll)
   - `durasi_baca`: Format "X menit"
   - `penerbit`: Nama penulis/penerbit
   - `url_gambar`: Path atau URL gambar (contoh: "/images/artikel1.png")
   - `tanggal_terbit`: Format YYYY-MM-DD atau ISO date string

### Melalui SQL:
```sql
INSERT INTO artikel (
  judul_artikel, 
  deskripsi_artikel, 
  kategori_artikel, 
  durasi_baca, 
  penerbit, 
  url_gambar, 
  tanggal_terbit
) VALUES (
  'Judul Artikel Anda',
  'Deskripsi lengkap artikel...',
  'Alam',
  '5 menit',
  'Tim TourJateng',
  '/images/artikel.png',
  '2024-11-27'
);
```

## Environment Variables

Pastikan file `.env.local` memiliki:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

1. Pastikan tabel `artikel` sudah dibuat di Supabase
2. Tambahkan minimal 1 artikel untuk testing
3. Jalankan aplikasi: `npm run dev`
4. Kunjungi halaman-halaman berikut:
   - `/` - Homepage dengan ArticleList component
   - `/artikel` - List semua artikel dengan filter
   - `/artikel/1` - Detail artikel (sesuaikan ID)

## Notes

- Semua query ke Supabase sudah include error handling
- Loading state ditampilkan saat fetch data
- Fallback image `/images/placeholder.png` digunakan jika `url_gambar` null
- RLS (Row Level Security) diaktifkan dengan policy public read access
- Artikel diurutkan berdasarkan `tanggal_terbit` descending secara default

## Troubleshooting

### Artikel tidak muncul:
1. Cek console browser untuk error
2. Pastikan tabel `artikel` ada dan memiliki data
3. Verifikasi RLS policy sudah dibuat untuk public read access
4. Cek environment variables Supabase

### Gambar tidak muncul:
1. Pastikan path `url_gambar` benar
2. Jika menggunakan Supabase Storage, gunakan public URL
3. Pastikan file gambar ada di folder `public/images/`

### Error TypeScript:
Pastikan semua import sudah benar dan tipe data `Article` interface match dengan struktur database.
