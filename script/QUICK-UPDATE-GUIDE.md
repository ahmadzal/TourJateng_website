# Quick Update Guide - Isi Data Destinasi Cepat

## 🚀 Cara Tercepat Isi Data

### **Metode 1: Update by Kategori** ⭐ PALING CEPAT

Semua destinasi dengan kategori yang sama → langsung terisi!

```sql
-- Update SEMUA wisata alam sekaligus
UPDATE destinasi 
SET 
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  durasi_rekomendasi = 'medium'
WHERE kategori ILIKE '%alam%'
  AND durasi_rekomendasi IS NULL;
```

✅ **1 query = puluhan destinasi terisi!**

---

### **Metode 2: Update by Nama Pattern**

Destinasi dengan nama yang mirip (curug, candi, museum):

```sql
-- Semua CURUG langsung sama
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE nama_destinasi ILIKE '%curug%'
  AND durasi_rekomendasi IS NULL;
```

---

### **Metode 3: Copy dari Destinasi Lain**

Destinasi A sudah diisi → copy ke B, C, D yang mirip:

```sql
-- Copy dari Curug A ke curug lainnya (ID: 9,10,11)
UPDATE destinasi AS target
SET 
  durasi_rekomendasi = source.durasi_rekomendasi,
  kategori_aktivitas = source.kategori_aktivitas,
  tujuan_cocok = source.tujuan_cocok,
  cocok_untuk = source.cocok_untuk
FROM destinasi AS source
WHERE source.id_destinasi = 8  -- ID Curug A yang sudah diisi
  AND target.id_destinasi IN (9, 10, 11, 12);  -- ID yang mau diisi
```

---

### **Metode 4: Update Multiple by ID**

Pilih beberapa ID yang mau diisi sekaligus:

```sql
-- Update ID 15-20 sekaligus dengan nilai yang sama
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends']
WHERE id_destinasi IN (15, 16, 17, 18, 19, 20);
```

---

## 📋 Workflow yang Efisien

### **Step 1: Cek Dulu**
```sql
-- Lihat destinasi mana yang belum diisi
SELECT id_destinasi, nama_destinasi, kategori
FROM destinasi
WHERE durasi_rekomendasi IS NULL
ORDER BY kategori;
```

### **Step 2: Kelompokkan**
Pisahkan berdasarkan:
- Kategori (alam, budaya, rekreasi)
- Nama pattern (curug, candi, pantai, museum)
- Lokasi (satu daerah biasanya mirip)

### **Step 3: Batch Update**
Update per kelompok, bukan satu-satu!

### **Step 4: Verifikasi**
```sql
-- Cek hasil
SELECT nama_destinasi, durasi_rekomendasi, kategori_aktivitas, tujuan_cocok
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
LIMIT 10;
```

---

## 💡 Tips & Trik

### ✅ DO:
- Gunakan `WHERE ... IS NULL` agar tidak overwrite data yang sudah benar
- Update per kategori/pola untuk konsistensi
- Cek dengan SELECT sebelum UPDATE
- Gunakan pattern matching dengan ILIKE untuk fleksibilitas

### ❌ DON'T:
- Jangan update semua destinasi tanpa filter
- Jangan lupa WHERE condition
- Jangan langsung batch besar tanpa test dulu

---

## 🔧 Query Siap Pakai

### Wisata Alam
```sql
UPDATE destinasi SET 
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  durasi_rekomendasi = 'medium'
WHERE kategori ILIKE '%alam%' AND durasi_rekomendasi IS NULL;
```

### Wisata Budaya
```sql
UPDATE destinasi SET 
  kategori_aktivitas = ARRAY['culture'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family'],
  durasi_rekomendasi = 'medium'
WHERE kategori ILIKE '%budaya%' AND durasi_rekomendasi IS NULL;
```

### Wisata Rekreasi
```sql
UPDATE destinasi SET 
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends'],
  durasi_rekomendasi = 'medium'
WHERE kategori ILIKE '%rekreasi%' AND durasi_rekomendasi IS NULL;
```

---

## 🎯 Contoh Real

Dari screenshot kamu, yang sudah diisi:
- ID 8-23 → Hampir semua `recreation` + `healing,content`

Cara cepatnya:
```sql
-- 1. Cek berapa yang belum
SELECT COUNT(*) FROM destinasi WHERE durasi_rekomendasi IS NULL;

-- 2. Update semua recreation sekaligus
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends']
WHERE kategori ILIKE '%rekreasi%' 
  AND durasi_rekomendasi IS NULL;

-- 3. Cek hasil
SELECT COUNT(*) FROM destinasi WHERE durasi_rekomendasi IS NOT NULL;
```

**Result: Puluhan destinasi terisi dalam hitungan detik!** ⚡

---

Lihat file `quick-update-destinasi.sql` untuk template lengkap! 🚀
