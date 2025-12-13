# Fitur Upload Gambar Komentar Forum

## Overview
Fitur upload gambar telah diintegrasikan dengan sistem komentar forum menggunakan Supabase Storage bucket `forum-images`.

## Fitur yang Diimplementasi

### ✅ **Upload Gambar**
- [x] Upload gambar ke bucket `forum-images`
- [x] Validasi tipe file (JPG, PNG, GIF, WebP)
- [x] Validasi ukuran file (maksimal 5MB)
- [x] Preview gambar sebelum upload
- [x] Progress indicator saat upload
- [x] Drag & drop functionality

### ✅ **User Experience**
- [x] Drag & drop area yang responsive
- [x] Visual feedback saat drag over
- [x] Progress bar dan loading indicator
- [x] File info display (nama dan ukuran)
- [x] Easy remove gambar sebelum submit
- [x] Error handling yang user-friendly

### ✅ **Storage & Security**
- [x] Public read access untuk semua gambar
- [x] Authenticated upload only
- [x] User-based file naming: `{user_id}-{timestamp}.{ext}`
- [x] Row Level Security policies

## Setup Database & Storage

### 1. Jalankan SQL Scripts
```sql
-- 1. Setup database tables
-- Jalankan: fix-forum-comments-error.sql

-- 2. Setup storage bucket  
-- Jalankan: setup-forum-images-bucket.sql
```

### 2. Verifikasi Setup
- ✅ Tabel `forum_comments` memiliki kolom `image_url`
- ✅ Bucket `forum-images` ada dan public
- ✅ Storage policies sudah aktif
- ✅ Trigger auto-update comments_count berfungsi

## Cara Menggunakan

### Untuk User
1. **Buka Modal Komentar**: Klik "Tambah Komentar"
2. **Tulis Komentar**: Isi komentar teks (WAJIB)
3. **Upload Gambar** (opsional):
   - **Klik**: Klik area upload atau tombol "Klik untuk pilih gambar"
   - **Drag & Drop**: Drag file gambar ke area upload
4. **Preview**: Lihat preview gambar yang dipilih
5. **Edit**: Klik X untuk menghapus gambar jika ingin ganti
6. **Submit**: Klik "Kirim Komentar"

**⚠️ PENTING**: Gambar hanya akan disimpan di storage jika disertai dengan komentar teks. Komentar tanpa teks tidak diizinkan.

### File Support
- **Format**: JPG, JPEG, PNG, GIF, WebP
- **Ukuran**: Maksimal 5MB
- **Resolusi**: Otomatis resize untuk display (max height 400px)

## Technical Details

### File Naming Convention
```
{user_id}-{timestamp}.{extension}
Contoh: 123e4567-e89b-12d3-a456-426614174000-1703980800000.jpg
```

### Storage Structure
```
forum-images/
├── user1-1703980800000.jpg
├── user2-1703980801000.png
└── user3-1703980802000.gif
```

### Database Schema
```sql
-- Kolom image_url di tabel forum_comments
image_url TEXT  -- Store public URL dari Supabase Storage
```

## Error Handling

### Client Side
- File type validation
- File size validation  
- Network error handling
- Upload progress feedback

### Server Side
- Storage bucket validation
- Authentication check
- File upload error handling
- Graceful fallback (comment without image)

## Performance Optimizations

### Image Display
- Lazy loading untuk gambar dalam komentar
- Maximum height restriction (400px)
- Click to open full size in new tab
- Compressed preview dalam modal

### Upload Process
- Progress indicator untuk better UX
- Async upload dengan error recovery
- File validation sebelum upload starts

## Security Features

### Storage Policies
```sql
-- Public read access
CREATE POLICY "Anyone can view forum images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'forum-images');

-- Authenticated upload only
CREATE POLICY "Authenticated users can upload forum images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'forum-images');
```

### File Validation
- MIME type checking
- File extension validation
- File size limits
- User authentication required

## Troubleshooting

### Error: "Bucket tidak ditemukan"
**Solusi**: 
1. Buka Supabase Dashboard > Storage
2. Buat bucket baru dengan nama `forum-images`
3. Set bucket sebagai public
4. Jalankan `setup-forum-images-bucket.sql`

### Error: "Upload gagal"
**Solusi**:
1. Check internet connection
2. Verify file size < 5MB
3. Check file format (JPG, PNG, GIF, WebP only)
4. Pastikan user sudah login

### Error: "Gambar tidak muncul"
**Solusi**:
1. Check bucket `forum-images` adalah public
2. Verify RLS policies aktif
3. Check console untuk error network

## Aturan Upload Gambar

### 🚨 **Kebijakan Baru (v2.1.0)**
- **Gambar HANYA disimpan** jika disertai dengan komentar teks
- **Komentar teks WAJIB** untuk semua submission
- **Tidak diizinkan** upload gambar tanpa teks komentar
- **Validasi client-side** mencegah submit tanpa teks

### Alasan Kebijakan
1. **Mengurangi spam** gambar tanpa konteks
2. **Menghemat storage** dengan menghindari gambar yang tidak relevan  
3. **Meningkatkan kualitas** diskusi dengan memerlukan konteks tertulis
4. **Optimasi performa** database dan storage

### User Flow Baru
1. User wajib mengisi komentar teks ✅
2. User bisa menambah gambar sebagai pelengkap ✅
3. System hanya upload gambar jika ada teks ✅
4. Komentar tersimpan dengan/tanpa gambar sesuai aturan ✅

## Future Enhancements

### Planned Features
- [ ] Image compression sebelum upload
- [ ] Multiple image upload
- [ ] Image gallery view untuk komentar
- [ ] Image moderation tools
- [ ] Automatic image optimization

### Performance Improvements
- [ ] CDN integration
- [ ] Image lazy loading
- [ ] Thumbnail generation
- [ ] Progressive loading

---
**Last Updated**: December 1, 2025  
**Version**: 2.1.0  
**New**: Gambar hanya disimpan jika disertai komentar teks