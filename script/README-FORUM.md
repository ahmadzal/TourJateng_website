# Forum Diskusi - Setup Guide

## Fitur Forum Diskusi

Forum Diskusi adalah fitur yang memungkinkan pengguna untuk berbagi pengalaman, bertanya, dan berdiskusi tentang destinasi wisata di Jawa Tengah.

### Fitur Utama:
1. **Halaman Forum** (`/forum`)
   - Menampilkan daftar semua diskusi
   - Pencarian diskusi berdasarkan judul dan konten
   - Filter berdasarkan status (Aktif)
   - Tombol untuk membuat diskusi baru
   - Informasi penulis, waktu posting, dan jumlah komentar

2. **Detail Diskusi** (`/forum/[id]`)
   - Menampilkan detail lengkap diskusi
   - Sistem komentar real-time
   - Fitur like/upvote (dapat dikembangkan)
   - Notifikasi untuk penulis diskusi

3. **Buat Diskusi Baru**
   - Modal form untuk membuat diskusi
   - Input: Judul, Kategori, dan Konten
   - Kategori: Alam, Budaya, Kuliner, Penginapan, Tips, Lainnya
   - Validasi user authentication

4. **Sistem Komentar**
   - User dapat mengomentari setiap diskusi
   - Tampilan author dan timestamp
   - Counter jumlah komentar otomatis

## Setup Database

### 1. Jalankan SQL Script

Jalankan file `forum-setup.sql` di Supabase SQL Editor atau PostgreSQL client Anda:

```bash
# Jika menggunakan psql
psql -U postgres -d your_database < forum-setup.sql

# Atau copy-paste isi file ke Supabase SQL Editor
```

### 2. Struktur Tabel

#### Tabel `forum_posts`
- `id` (UUID) - Primary key
- `title` (TEXT) - Judul diskusi
- `content` (TEXT) - Konten diskusi
- `author` (TEXT) - Nama penulis
- `author_id` (UUID) - Foreign key ke auth.users
- `category` (TEXT) - Kategori diskusi
- `created_at` (TIMESTAMP) - Waktu dibuat
- `updated_at` (TIMESTAMP) - Waktu diupdate
- `is_active` (BOOLEAN) - Status aktif/nonaktif
- `comments_count` (INTEGER) - Jumlah komentar

#### Tabel `forum_comments`
- `id` (UUID) - Primary key
- `post_id` (UUID) - Foreign key ke forum_posts
- `content` (TEXT) - Konten komentar
- `author` (TEXT) - Nama penulis
- `author_id` (UUID) - Foreign key ke auth.users
- `created_at` (TIMESTAMP) - Waktu dibuat
- `updated_at` (TIMESTAMP) - Waktu diupdate

### 3. Row Level Security (RLS)

Database sudah dikonfigurasi dengan RLS policies:

**Forum Posts:**
- ✅ Semua orang dapat melihat post yang aktif
- ✅ User terautentikasi dapat membuat post
- ✅ User hanya dapat update/delete post mereka sendiri

**Forum Comments:**
- ✅ Semua orang dapat melihat komentar
- ✅ User terautentikasi dapat membuat komentar
- ✅ User hanya dapat update/delete komentar mereka sendiri

## Penggunaan

### Akses Forum
1. Buka browser dan navigasi ke `/forum`
2. Lihat daftar diskusi yang tersedia
3. Gunakan search bar untuk mencari topik tertentu

### Membuat Diskusi Baru
1. Klik tombol **"Buat"** di halaman forum
2. Jika belum login, akan diarahkan ke halaman login
3. Isi form:
   - Judul Diskusi
   - Pilih Kategori
   - Tulis Konten
4. Klik **"Posting"** untuk mempublikasikan

### Membaca & Berkomentar
1. Klik pada diskusi yang ingin dibaca
2. Baca konten lengkap diskusi
3. Scroll ke bagian komentar
4. Tulis komentar di text area
5. Klik **"Kirim Komentar"**

## Customization

### Menambah Kategori Baru

Edit file `app/forum/page.tsx` di bagian select kategori:

```tsx
<select
  value={newPost.category}
  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
>
  <option value="Alam">Alam</option>
  <option value="Budaya">Budaya</option>
  <option value="Kuliner">Kuliner</option>
  {/* Tambah kategori baru di sini */}
  <option value="Kategori Baru">Kategori Baru</option>
</select>
```

### Styling

Semua styling menggunakan Tailwind CSS. Untuk mengubah warna tema:

1. Warna utama: `blue-600`, `blue-700`, `blue-50`
2. Edit di file TSX sesuai kebutuhan

### Time Format

Function `getRelativeTime()` menampilkan waktu relatif:
- "baru saja" - < 1 menit
- "X menit yang lalu" - < 60 menit
- "X hari yang lalu" - < 24 jam
- "X hari yang lalu" - >= 24 jam

## Troubleshooting

### Error: "relation forum_posts does not exist"
**Solusi:** Pastikan Anda sudah menjalankan `forum-setup.sql`

### Error: "new row violates row-level security policy"
**Solusi:** 
1. Pastikan user sudah login
2. Check RLS policies di Supabase Dashboard
3. Pastikan `author_id` sesuai dengan `auth.uid()`

### Komentar tidak muncul
**Solusi:**
1. Check console browser untuk error
2. Pastikan tabel `forum_comments` sudah dibuat
3. Check RLS policies untuk tabel comments

### Search tidak bekerja
**Solusi:**
1. Pastikan state `searchQuery` terupdate
2. Check function `filteredPosts`
3. Refresh halaman

## Fitur Lanjutan (Opsional)

Beberapa fitur yang bisa ditambahkan:

1. **Like/Upvote System**
   - Tambah kolom `likes_count` di `forum_posts`
   - Buat tabel `forum_likes` untuk tracking

2. **Notifikasi**
   - Email notification saat ada komentar baru
   - In-app notification

3. **Moderasi**
   - Admin dapat menghapus post/comment
   - Report system untuk konten inappropriate

4. **Rich Text Editor**
   - Gunakan library seperti TipTap atau Quill
   - Support untuk formatting text, images, links

5. **Pagination**
   - Load more untuk daftar diskusi
   - Lazy loading untuk performa lebih baik

6. **Tags/Labels**
   - Tambah multiple tags per post
   - Filter berdasarkan tags

## Testing

### Test Create Post
```javascript
// Test data
const testPost = {
  title: "Test Discussion",
  content: "This is a test content",
  category: "Alam"
}
```

### Test Create Comment
```javascript
// Test data
const testComment = {
  content: "This is a test comment"
}
```

## Support

Jika ada pertanyaan atau issue, silakan:
1. Check dokumentasi ini terlebih dahulu
2. Check console browser untuk error messages
3. Check Supabase logs di Dashboard

## Changelog

### Version 1.0.0 (2025-11-28)
- ✅ Initial release
- ✅ Forum listing page
- ✅ Forum detail page dengan komentar
- ✅ Create post functionality
- ✅ Comment system
- ✅ Search functionality
- ✅ Responsive design
- ✅ Authentication integration
- ✅ Database setup with RLS
