-- ============================================================================
-- QUICK UPDATE - Batch Update Destinasi dengan Pola yang Sama
-- ============================================================================
-- Cara cepat untuk mengisi banyak destinasi sekaligus tanpa input manual
-- ============================================================================

-- ============================================================================
-- METODE 1: UPDATE BERDASARKAN KATEGORI (Paling Cepat!)
-- ============================================================================

-- 1. UPDATE SEMUA WISATA ALAM (nature)
UPDATE destinasi 
SET 
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  durasi_rekomendasi = 'medium'
WHERE kategori ILIKE '%alam%'
  AND durasi_rekomendasi IS NULL;  -- Hanya yang belum diisi

-- 2. UPDATE SEMUA WISATA BUDAYA (culture)
UPDATE destinasi 
SET 
  kategori_aktivitas = ARRAY['culture'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family'],
  durasi_rekomendasi = 'medium'
WHERE (kategori ILIKE '%budaya%' OR kategori ILIKE '%sejarah%')
  AND durasi_rekomendasi IS NULL;

-- 3. UPDATE SEMUA WISATA REKREASI (recreation)
UPDATE destinasi 
SET 
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends'],
  durasi_rekomendasi = 'medium'
WHERE (kategori ILIKE '%buatan%' OR kategori ILIKE '%rekreasi%')
  AND durasi_rekomendasi IS NULL;

-- ============================================================================
-- METODE 2: UPDATE BERDASARKAN NAMA/POLA (Spesifik)
-- ============================================================================

-- 4. SEMUA CURUG/AIR TERJUN (Karakteristik sama)
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE (nama_destinasi ILIKE '%curug%' OR nama_destinasi ILIKE '%air terjun%')
  AND durasi_rekomendasi IS NULL;

-- 5. SEMUA CANDI (Karakteristik sama)
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['culture'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE nama_destinasi ILIKE '%candi%'
  AND durasi_rekomendasi IS NULL;

-- 6. SEMUA MUSEUM (Karakteristik sama)
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'short',
  kategori_aktivitas = ARRAY['culture'],
  tujuan_cocok = ARRAY['experience'],
  cocok_untuk = ARRAY['solo', 'couple', 'family']
WHERE nama_destinasi ILIKE '%museum%'
  AND durasi_rekomendasi IS NULL;

-- 7. SEMUA PANTAI (Karakteristik sama)
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'long',
  kategori_aktivitas = ARRAY['nature', 'recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE nama_destinasi ILIKE '%pantai%'
  AND durasi_rekomendasi IS NULL;

-- 8. SEMUA TAMAN (Karakteristik sama)
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends']
WHERE nama_destinasi ILIKE '%taman%'
  AND durasi_rekomendasi IS NULL;

-- ============================================================================
-- METODE 3: COPY DATA DARI DESTINASI A KE B (Destinasi Mirip)
-- ============================================================================

-- Template: Copy semua kolom preferensi dari destinasi yang sudah diisi
-- Ganti 'Curug Sinom Indah' dengan destinasi sumber
-- Ganti id_destinasi dengan destinasi tujuan yang mau diisi

-- Contoh: Copy dari Curug A ke Curug B, C, D (yang karakteristiknya sama)
UPDATE destinasi AS target
SET 
  durasi_rekomendasi = source.durasi_rekomendasi,
  kategori_aktivitas = source.kategori_aktivitas,
  tujuan_cocok = source.tujuan_cocok,
  cocok_untuk = source.cocok_untuk
FROM destinasi AS source
WHERE source.nama_destinasi = 'Curug Sinom Indah'  -- Destinasi sumber (yang sudah diisi)
  AND target.id_destinasi IN (9, 10, 11, 12);  -- Destinasi tujuan (yang mau diisi)

-- ============================================================================
-- METODE 4: UPDATE MULTIPLE DESTINASI SPESIFIK (By ID)
-- ============================================================================

-- Update beberapa destinasi sekaligus dengan ID
-- Cocok untuk destinasi yang kamu pilih manual
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN (15, 16, 17, 18, 19, 20);  -- Ganti dengan ID destinasi yang mau diupdate

-- ============================================================================
-- METODE 5: UPDATE BERDASARKAN LOKASI (Destinasi di daerah yang sama)
-- ============================================================================

-- Update semua destinasi di Banjarnegara (biasanya karakteristik mirip)
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE lokasi ILIKE '%banjarnegara%'
  AND durasi_rekomendasi IS NULL;

-- ============================================================================
-- TEMPLATE CUSTOM (Edit sesuai kebutuhan)
-- ============================================================================

-- Template 1: Destinasi Petualangan (hiking, trekking)
/*
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'long',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['experience', 'content'],
  cocok_untuk = ARRAY['solo', 'friends']
WHERE (deskripsi ILIKE '%hiking%' OR deskripsi ILIKE '%trekking%' OR deskripsi ILIKE '%pendakian%')
  AND durasi_rekomendasi IS NULL;
*/

-- Template 2: Destinasi Instagramable (spot foto)
/*
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'short',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['content'],
  cocok_untuk = ARRAY['solo', 'couple', 'friends']
WHERE (deskripsi ILIKE '%spot foto%' OR deskripsi ILIKE '%instagramable%')
  AND durasi_rekomendasi IS NULL;
*/

-- Template 3: Destinasi Family-Friendly
/*
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['couple', 'family', 'friends']
WHERE deskripsi ILIKE '%keluarga%'
  AND durasi_rekomendasi IS NULL;
*/

-- ============================================================================
-- VERIFIKASI & ROLLBACK
-- ============================================================================

-- CEK SEBELUM UPDATE (Preview destinasi yang akan diupdate)
SELECT id_destinasi, nama_destinasi, kategori, lokasi
FROM destinasi
WHERE kategori ILIKE '%alam%'
  AND durasi_rekomendasi IS NULL;

-- CEK HASIL SETELAH UPDATE
SELECT 
  id_destinasi,
  nama_destinasi,
  kategori,
  durasi_rekomendasi,
  kategori_aktivitas,
  tujuan_cocok,
  cocok_untuk
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
ORDER BY id_destinasi DESC
LIMIT 20;

-- ROLLBACK (Set NULL jika salah update)
/*
UPDATE destinasi 
SET 
  durasi_rekomendasi = NULL,
  kategori_aktivitas = NULL,
  tujuan_cocok = NULL,
  cocok_untuk = NULL
WHERE id_destinasi IN (1, 2, 3);  -- Ganti dengan ID yang mau direset
*/

-- ============================================================================
-- TIPS PENGGUNAAN
-- ============================================================================
-- 1. SELALU CEK DULU dengan SELECT sebelum UPDATE
-- 2. Gunakan WHERE dengan IS NULL agar tidak overwrite data yang sudah diisi
-- 3. Update per kategori/pola untuk konsistensi
-- 4. Backup data dulu jika ragu
-- 5. Test dengan 1-2 destinasi dulu sebelum batch update besar
-- ============================================================================
