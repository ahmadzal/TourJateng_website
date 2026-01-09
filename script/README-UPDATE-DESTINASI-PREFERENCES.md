# Panduan Update Data Preferensi Destinasi

## 📋 Cara Menggunakan

### 1. Jalankan Setup Script
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy-paste isi file `setup-destinasi-preferences.sql`
3. Klik **Run** atau tekan `Ctrl+Enter`

### 2. Input Data Per Destinasi

Gunakan template berikut sesuai jenis destinasi:

---

## 🏔️ WISATA ALAM

### Air Terjun / Curug
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE nama_destinasi = 'Nama Curug/Air Terjun';
```

### Gunung / Pendakian
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'long',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['experience'],
  cocok_untuk = ARRAY['solo', 'friends'],
  intensitas_aktivitas = 'berat'
WHERE nama_destinasi = 'Nama Gunung';
```

### Pantai Santai
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'long',
  kategori_aktivitas = ARRAY['nature', 'recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  intensitas_aktivitas = 'ringan'
WHERE nama_destinasi = 'Nama Pantai';
```

### Bukit / Spot Sunrise
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'short',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE nama_destinasi = 'Nama Bukit';
```

---

## 🏛️ WISATA BUDAYA

### Candi
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['culture'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  intensitas_aktivitas = 'ringan'
WHERE nama_destinasi = 'Nama Candi';
```

### Museum
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'short',
  kategori_aktivitas = ARRAY['culture'],
  tujuan_cocok = ARRAY['experience'],
  cocok_untuk = ARRAY['solo', 'couple', 'family'],
  intensitas_aktivitas = 'ringan'
WHERE nama_destinasi = 'Nama Museum';
```

### Desa Wisata
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['culture', 'recreation'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends'],
  intensitas_aktivitas = 'ringan'
WHERE nama_destinasi = 'Nama Desa Wisata';
```

---

## 🎢 WISATA REKREASI

### Taman Rekreasi / Theme Park
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'long',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE nama_destinasi = 'Nama Taman';
```

### Waterpark
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['family', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE nama_destinasi = 'Nama Waterpark';
```

### Spot Foto Instagramable
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'short',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['content'],
  cocok_untuk = ARRAY['solo', 'couple', 'friends'],
  intensitas_aktivitas = 'ringan'
WHERE nama_destinasi = 'Nama Spot Foto';
```

### Mall / Shopping
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  intensitas_aktivitas = 'ringan'
WHERE nama_destinasi = 'Nama Mall';
```

---

## 🌟 KOMBINASI MULTI-KATEGORI

### Wisata Alam + Edukasi
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature', 'culture'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE nama_destinasi = 'Contoh: Kebun Raya, Taman Nasional';
```

### Wisata Alam + Petualangan + Instagramable
```sql
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'long',
  kategori_aktivitas = ARRAY['nature', 'recreation'],
  tujuan_cocok = ARRAY['healing', 'experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE nama_destinasi = 'Contoh: Telaga, Danau Scenic';
```

---

## 📊 Referensi Nilai

### Durasi Rekomendasi
- `'short'` = 2-3 jam (museum, spot foto)
- `'medium'` = 3-6 jam (wisata standar)
- `'long'` = 6+ jam (bisa seharian)

### Kategori Aktivitas (bisa multiple)
- `'nature'` = Wisata alam
- `'culture'` = Sejarah & budaya
- `'recreation'` = Rekreasi & hiburan

### Tujuan Cocok (bisa multiple)
- `'healing'` = Relaksasi, refreshing
- `'experience'` = Petualangan, hal baru
- `'content'` = Foto, konten medsos

### Cocok Untuk (bisa multiple)
- `'solo'` = Sendiri
- `'couple'` = Berdua
- `'family'` = Keluarga
- `'friends'` = Teman

### Intensitas Aktivitas
- `'ringan'` = Jalan santai
- `'sedang'` = Berjalan cukup jauh
- `'berat'` = Trekking, mendaki

---

## ✅ Tips Input Data

1. **Multiple values**: Gunakan `ARRAY['value1', 'value2']`
2. **Satu value**: Tetap gunakan `ARRAY['value1']`
3. **Case sensitive**: Gunakan lowercase semua
4. **Test query**: Jalankan SELECT dulu untuk cek nama destinasi yang tepat

```sql
-- Cek nama destinasi
SELECT id_destinasi, nama_destinasi, kategori 
FROM destinasi 
WHERE nama_destinasi ILIKE '%kata kunci%';
```

---

## 🔍 Query Verifikasi

### Cek destinasi yang belum diisi
```sql
SELECT nama_destinasi, kategori
FROM destinasi
WHERE durasi_rekomendasi IS NULL
   OR kategori_aktivitas IS NULL
   OR tujuan_cocok IS NULL
   OR cocok_untuk IS NULL;
```

### Cek hasil input
```sql
SELECT 
  nama_destinasi,
  durasi_rekomendasi,
  kategori_aktivitas,
  tujuan_cocok,
  cocok_untuk,
  intensitas_aktivitas
FROM destinasi
ORDER BY nama_destinasi;
```

---

## 🎯 Langkah Selanjutnya

Setelah data terisi:
1. Jalankan verifikasi query
2. Update kode TypeScript di `app/destinasi/page.tsx`
3. Test sistem rekomendasi
4. Adjust data jika perlu

---

**Butuh bantuan?** Tanya aja! 😊
