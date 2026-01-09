-- ============================================================================
-- STEP-BY-STEP GUIDE - Copy Paste Sesuai Urutan
-- ============================================================================
-- Ikuti step 1-2-3-4-5 secara berurutan
-- Copy paste per query, RUN, lalu lanjut ke step berikutnya
-- ============================================================================

-- ============================================================================
-- STEP 1: LIHAT DESTINASI YANG BELUM DIISI
-- ============================================================================
-- Copy & RUN query ini dulu untuk lihat data

SELECT 
  id_destinasi as ID,
  nama_destinasi as Nama,
  kategori as Kategori,
  lokasi as Lokasi
FROM destinasi
WHERE durasi_rekomendasi IS NULL
ORDER BY kategori, nama_destinasi;

-- Dari hasil di atas, catat ID destinasi yang karakteristiknya mirip
-- Contoh: ID 25,26,27 = curug semua, ID 30,31 = candi semua

-- ============================================================================
-- STEP 2: UPDATE DURASI REKOMENDASI
-- ============================================================================
-- Sesuaikan ID dengan hasil STEP 1

-- 2A. Durasi SHORT (2-3 jam) - Museum, spot foto
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET durasi_rekomendasi = 'short'
WHERE id_destinasi IN (11, 12);
-- ☝️ GANTI 11,12 dengan ID destinasi yang durasi SHORT

-- 2B. Durasi MEDIUM (3-6 jam) - Wisata standar
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET durasi_rekomendasi = 'medium'
WHERE id_destinasi IN (8, 9, 10);
-- ☝️ GANTI 8,9,10 dengan ID destinasi yang durasi MEDIUM

-- 2C. Durasi LONG (6+ jam) - Bisa seharian
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET durasi_rekomendasi = 'long'
WHERE id_destinasi IN (13, 14);
-- ☝️ GANTI 13,14 dengan ID destinasi yang durasi LONG

-- CEK HASIL (copy & run untuk verifikasi)
SELECT id_destinasi, nama_destinasi, durasi_rekomendasi
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
ORDER BY durasi_rekomendasi, id_destinasi;

-- ============================================================================
-- STEP 3: UPDATE KATEGORI AKTIVITAS
-- ============================================================================
-- Sesuaikan ID dengan destinasi yang mau diupdate

-- 3A. Wisata ALAM (nature) - Curug, pantai, gunung
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['nature']
WHERE id_destinasi IN (25, 26, 27);
-- ☝️ GANTI dengan ID destinasi ALAM

-- 3B. Wisata BUDAYA (culture) - Candi, museum, sejarah
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['culture']
WHERE id_destinasi IN (30, 31);
-- ☝️ GANTI dengan ID destinasi BUDAYA

-- 3C. Wisata REKREASI (recreation) - Taman, waterpark, mall
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['recreation']
WHERE id_destinasi IN (8, 9, 10);
-- ☝️ GANTI dengan ID destinasi REKREASI

-- 3D. KOMBINASI - Alam + Rekreasi (pantai indah, danau)
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['nature', 'recreation']
WHERE id_destinasi IN (40, 41);
-- ☝️ GANTI dengan ID destinasi ALAM+REKREASI

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, kategori_aktivitas
FROM destinasi
WHERE kategori_aktivitas IS NOT NULL
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 4: UPDATE TUJUAN COCOK
-- ============================================================================
-- Pilih kombinasi yang sesuai dengan karakteristik destinasi

-- 4A. HEALING + CONTENT (santai + foto) - PALING UMUM untuk curug, pantai, taman
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET tujuan_cocok = ARRAY['healing', 'content']
WHERE id_destinasi IN (8, 9, 10);
-- ☝️ GANTI dengan ID destinasi yang SANTAI & FOTO BAGUS

-- 4B. EXPERIENCE + CONTENT (petualangan + foto) - Gunung, hiking
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET tujuan_cocok = ARRAY['experience', 'content']
WHERE id_destinasi IN (13, 14);
-- ☝️ GANTI dengan ID destinasi PETUALANGAN dengan view bagus

-- 4C. EXPERIENCE only (petualangan murni) - Ekstrem, menantang
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET tujuan_cocok = ARRAY['experience']
WHERE id_destinasi IN (15);
-- ☝️ GANTI dengan ID destinasi PETUALANGAN murni

-- 4D. HEALING only (santai murni) - Tempat tenang, relax
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET tujuan_cocok = ARRAY['healing']
WHERE id_destinasi IN (20);
-- ☝️ GANTI dengan ID destinasi SANTAI murni

-- 4E. CONTENT only (spot foto) - Instagramable spot
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET tujuan_cocok = ARRAY['content']
WHERE id_destinasi IN (21);
-- ☝️ GANTI dengan ID SPOT FOTO murni

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, tujuan_cocok
FROM destinasi
WHERE tujuan_cocok IS NOT NULL
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 5: UPDATE COCOK UNTUK (Travel Partner)
-- ============================================================================
-- Siapa yang cocok mengunjungi destinasi ini

-- 5A. UNIVERSAL - Cocok untuk SEMUA (solo, couple, family, friends)
-- PALING UMUM untuk destinasi yang ramah semua orang
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN (8, 9, 10);
-- ☝️ GANTI dengan ID destinasi yang COCOK UNTUK SEMUA

-- 5B. COUPLE + FAMILY + FRIENDS (tidak cocok solo)
-- Untuk destinasi yang lebih fun kalau ramai
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET cocok_untuk = ARRAY['couple', 'family', 'friends']
WHERE id_destinasi IN (11, 12);
-- ☝️ GANTI dengan ID destinasi yang TIDAK COCOK SOLO

-- 5C. SOLO + FRIENDS (tidak cocok couple/family)
-- Untuk pendakian, petualangan
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET cocok_untuk = ARRAY['solo', 'friends']
WHERE id_destinasi IN (13);
-- ☝️ GANTI dengan ID destinasi PETUALANGAN

-- 5D. FAMILY + FRIENDS (ramah anak)
-- Untuk destinasi edukatif, taman bermain
-- EDIT ID di bawah, lalu RUN
UPDATE destinasi 
SET cocok_untuk = ARRAY['family', 'friends']
WHERE id_destinasi IN (14);
-- ☝️ GANTI dengan ID destinasi RAMAH ANAK

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, cocok_untuk
FROM destinasi
WHERE cocok_untuk IS NOT NULL
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 6: CEK FINAL - Lihat Semua Data yang Sudah Diisi
-- ============================================================================
-- Copy & RUN untuk lihat hasil akhir

SELECT 
  id_destinasi,
  nama_destinasi,
  durasi_rekomendasi,
  kategori_aktivitas,
  tujuan_cocok,
  cocok_untuk
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 7: CEK PROGRESS - Berapa yang Sudah/Belum Diisi
-- ============================================================================
-- Copy & RUN untuk lihat progress

SELECT 
  'Total Destinasi' as Status,
  COUNT(*) as Jumlah
FROM destinasi
UNION ALL
SELECT 
  'Sudah Diisi' as Status,
  COUNT(*) as Jumlah
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
UNION ALL
SELECT 
  'Belum Diisi' as Status,
  COUNT(*) as Jumlah
FROM destinasi
WHERE durasi_rekomendasi IS NULL;

-- ============================================================================
-- BONUS: UPDATE LENGKAP SEKALIGUS (Semua Kolom)
-- ============================================================================
-- Kalau ada destinasi yang karakteristiknya PERSIS SAMA,
-- bisa update semua kolom sekaligus

-- Contoh: Curug A, B, C yang karakteristiknya identik
-- EDIT semua value & ID di bawah, lalu RUN
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN (25, 26, 27);
-- ☝️ GANTI value & ID sesuai kebutuhan

-- ============================================================================
-- ROLLBACK (Kalau Salah Update)
-- ============================================================================
-- Kalau ada yang salah, bisa reset ke NULL

-- EDIT ID di bawah dengan ID yang mau direset, lalu RUN
UPDATE destinasi 
SET 
  durasi_rekomendasi = NULL,
  kategori_aktivitas = NULL,
  tujuan_cocok = NULL,
  cocok_untuk = NULL
WHERE id_destinasi IN (99);
-- ☝️ GANTI 99 dengan ID yang mau direset

-- ============================================================================
-- SELESAI! 🎉
-- ============================================================================
/*
TIPS:
1. Jangan run semua sekaligus!
2. Run per query (select, edit ID, run)
3. Cek hasil setelah setiap step
4. Kelompokkan destinasi yang mirip untuk efisiensi
5. Update yang jelas dulu (museum=short, gunung=long), sisanya belakangan

URUTAN KERJA:
Step 1: Lihat data → Catat ID yang mirip
Step 2: Update durasi → Per kategori durasi
Step 3: Update aktivitas → Per kategori wisata
Step 4: Update tujuan → Per tujuan traveling
Step 5: Update untuk → Per tipe traveler
Step 6: Cek hasil → Verifikasi
Step 7: Cek progress → Lihat berapa yang sudah
*/
