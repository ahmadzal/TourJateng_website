-- ============================================================================
-- BATCH UPDATE BY SELECTION - Pilih Manual, Update Sekaligus
-- ============================================================================
-- Workflow:
-- 1. Lihat daftar destinasi yang belum diisi
-- 2. Pilih mana yang karakteristiknya sama (A, B, C, D)
-- 3. Catat ID-nya, batch update sekaligus
-- 4. Ulangi untuk grup lain
-- ============================================================================

-- ============================================================================
-- STEP 1: LIHAT DESTINASI YANG BELUM DIISI
-- ============================================================================

-- Lihat semua destinasi yang belum diisi (untuk pilih mana yang sama)
SELECT 
  id_destinasi as ID,
  nama_destinasi as Nama,
  kategori as Kategori,
  lokasi as Lokasi,
  durasi_rekomendasi as Durasi,
  kategori_aktivitas as Aktivitas
FROM destinasi
WHERE durasi_rekomendasi IS NULL
ORDER BY kategori, nama_destinasi;

-- Atau lihat yang sudah diisi (untuk referensi)
SELECT 
  id_destinasi as ID,
  nama_destinasi as Nama,
  durasi_rekomendasi as Durasi,
  kategori_aktivitas as Aktivitas,
  tujuan_cocok as Tujuan,
  cocok_untuk as Untuk
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
ORDER BY durasi_rekomendasi, nama_destinasi;

-- ============================================================================
-- STEP 2: UPDATE BATCH - DURASI REKOMENDASI
-- ============================================================================

-- Grup 1: Durasi SHORT (2-3 jam) - Museum, spot foto, quick visit
-- Pilih ID destinasi yang kamu rasa cocok untuk SHORT
UPDATE destinasi 
SET durasi_rekomendasi = 'short'
WHERE id_destinasi IN (
  11, 12  -- Ganti dengan ID destinasi yang kamu pilih
);

-- Grup 2: Durasi MEDIUM (3-6 jam) - Wisata standar, tidak butuh seharian
-- Pilih ID destinasi yang kamu rasa cocok untuk MEDIUM
UPDATE destinasi 
SET durasi_rekomendasi = 'medium'
WHERE id_destinasi IN (
  8, 9, 10, 13, 14  -- Ganti dengan ID destinasi yang kamu pilih
);

-- Grup 3: Durasi LONG (6+ jam) - Bisa seharian, luas, atau camping
-- Pilih ID destinasi yang kamu rasa cocok untuk LONG
UPDATE destinasi 
SET durasi_rekomendasi = 'long'
WHERE id_destinasi IN (
  15, 16  -- Ganti dengan ID destinasi yang kamu pilih
);

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, durasi_rekomendasi
FROM destinasi
WHERE id_destinasi IN (8, 9, 10, 11, 12, 13, 14, 15, 16)
ORDER BY durasi_rekomendasi, id_destinasi;

-- ============================================================================
-- STEP 3: UPDATE BATCH - KATEGORI AKTIVITAS
-- ============================================================================

-- Grup 1: Wisata ALAM (nature)
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['nature']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi alam (curug, pantai, gunung, dll)
  
);

-- Grup 2: Wisata BUDAYA (culture)
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['culture']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi budaya (candi, museum, desa wisata, dll)
  
);

-- Grup 3: Wisata REKREASI (recreation)
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['recreation']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi rekreasi (taman, waterpark, mall, dll)
  8, 9, 10  -- Contoh
);

-- Grup 4: KOMBINASI - Alam + Rekreasi (pantai, danau scenic)
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['nature', 'recreation']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang alam tapi juga rekreasi
  
);

-- Grup 5: KOMBINASI - Budaya + Rekreasi (desa wisata, museum interaktif)
UPDATE destinasi 
SET kategori_aktivitas = ARRAY['culture', 'recreation']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi budaya yang fun
  
);

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, kategori_aktivitas
FROM destinasi
WHERE id_destinasi IN (8, 9, 10)  -- Sesuaikan dengan ID yang kamu update
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 4: UPDATE BATCH - TUJUAN COCOK
-- ============================================================================

-- Grup 1: HEALING only (tempat santai, tenang)
UPDATE destinasi 
SET tujuan_cocok = ARRAY['healing']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang fokus relaksasi
  
);

-- Grup 2: EXPERIENCE only (petualangan ekstrem, unik)
UPDATE destinasi 
SET tujuan_cocok = ARRAY['experience']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi petualangan/tantangan
  
);

-- Grup 3: CONTENT only (spot foto pure)
UPDATE destinasi 
SET tujuan_cocok = ARRAY['content']
WHERE id_destinasi IN (
  -- Masukkan ID spot foto instagramable
  
);

-- Grup 4: HEALING + CONTENT (tempat santai + foto bagus) ⭐ PALING UMUM
UPDATE destinasi 
SET tujuan_cocok = ARRAY['healing', 'content']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang santai & instagramable (curug, pantai, taman)
  8, 9, 10, 17, 18  -- Contoh
);

-- Grup 5: EXPERIENCE + CONTENT (petualangan + foto keren)
UPDATE destinasi 
SET tujuan_cocok = ARRAY['experience', 'content']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi petualangan dengan view bagus (gunung, sunrise)
  
);

-- Grup 6: SEMUA (cocok untuk semua tujuan) - Universal
UPDATE destinasi 
SET tujuan_cocok = ARRAY['healing', 'experience', 'content']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang sangat fleksibel
  
);

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, tujuan_cocok
FROM destinasi
WHERE id_destinasi IN (8, 9, 10, 17, 18)
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 5: UPDATE BATCH - COCOK UNTUK (Travel Partner)
-- ============================================================================

-- Grup 1: SOLO only (aman untuk sendiri)
UPDATE destinasi 
SET cocok_untuk = ARRAY['solo']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang cocok solo travel
  
);

-- Grup 2: COUPLE only (romantis, berdua)
UPDATE destinasi 
SET cocok_untuk = ARRAY['couple']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi romantic
  
);

-- Grup 3: FAMILY only (ramah anak, edukatif)
UPDATE destinasi 
SET cocok_untuk = ARRAY['family']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi khusus keluarga
  
);

-- Grup 4: COUPLE + FAMILY (tidak cocok solo/grup besar)
UPDATE destinasi 
SET cocok_untuk = ARRAY['couple', 'family']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi untuk pasangan/keluarga
  
);

-- Grup 5: FRIENDS (cocok grup teman, ramai-ramai)
UPDATE destinasi 
SET cocok_untuk = ARRAY['friends']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang fun untuk grup
  
);

-- Grup 6: COUPLE + FAMILY + FRIENDS (tidak cocok solo)
UPDATE destinasi 
SET cocok_untuk = ARRAY['couple', 'family', 'friends']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang butuh teman tapi tidak cocok sendirian
  11, 12  -- Contoh
);

-- Grup 7: SEMUA (universal - cocok untuk siapa aja) ⭐ PALING UMUM
UPDATE destinasi 
SET cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang fleksibel untuk semua
  8, 9, 10  -- Contoh
);

-- CEK HASIL
SELECT id_destinasi, nama_destinasi, cocok_untuk
FROM destinasi
WHERE id_destinasi IN (8, 9, 10, 11, 12)
ORDER BY id_destinasi;

-- ============================================================================
-- STEP 6: UPDATE LENGKAP SEKALIGUS (All columns at once)
-- ============================================================================

-- Template: Update semua kolom untuk destinasi yang karakteristiknya SAMA PERSIS
-- Contoh: Curug A, B, C, D yang karakteristiknya identik

UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN (
  -- Masukkan ID destinasi yang PERSIS SAMA karakteristiknya
  
);

-- ============================================================================
-- QUERY BANTUAN
-- ============================================================================

-- 1. Lihat destinasi by kategori (untuk kelompokkan yang mirip)
SELECT id_destinasi, nama_destinasi, kategori, lokasi
FROM destinasi
WHERE kategori ILIKE '%alam%'  -- Ganti: %budaya%, %rekreasi%, dll
  AND durasi_rekomendasi IS NULL
ORDER BY nama_destinasi;

-- 2. Lihat destinasi by nama pattern (untuk kelompokkan yang mirip)
SELECT id_destinasi, nama_destinasi, kategori
FROM destinasi
WHERE nama_destinasi ILIKE '%curug%'  -- Ganti: %candi%, %pantai%, %museum%, dll
  AND durasi_rekomendasi IS NULL
ORDER BY nama_destinasi;

-- 3. Lihat progress (berapa yang sudah/belum diisi)
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

-- 4. Lihat destinasi yang sudah diisi lengkap (untuk referensi)
SELECT 
  id_destinasi,
  nama_destinasi,
  durasi_rekomendasi,
  kategori_aktivitas,
  tujuan_cocok,
  cocok_untuk
FROM destinasi
WHERE durasi_rekomendasi IS NOT NULL
ORDER BY id_destinasi DESC
LIMIT 10;

-- ============================================================================
-- TIPS WORKFLOW EFISIEN
-- ============================================================================
/*
1. SORT BY SIMILARITY
   - Kelompokkan destinasi yang mirip (curug-curug, candi-candi, dll)
   - Update per kelompok

2. START WITH EASY ONES
   - Mulai dari yang jelas (museum = short, gunung = long)
   - Sisakan yang abu-abu untuk terakhir

3. USE REFERENCE
   - Lihat destinasi yang sudah diisi
   - Copy pattern yang mirip

4. BATCH BY COLUMN
   - Isi durasi dulu semua
   - Baru aktivitas
   - Baru tujuan
   - Terakhir cocok_untuk

5. CHECK REGULARLY
   - Setiap update, cek hasilnya
   - Pastikan tidak salah

CONTOH WORKFLOW:
Step 1: Kelompokkan curug → ID 1,2,3,4
Step 2: Update durasi → medium
Step 3: Update aktivitas → nature
Step 4: Update tujuan → healing, content
Step 5: Update untuk → solo, couple, family, friends
Step 6: Ulangi untuk candi → ID 5,6,7,8
*/

-- ============================================================================
-- TEMPLATE KOSONG (Copy-paste untuk update cepat)
-- ============================================================================

-- Template Durasi
/*
UPDATE destinasi SET durasi_rekomendasi = 'medium'
WHERE id_destinasi IN ();
*/

-- Template Aktivitas
/*
UPDATE destinasi SET kategori_aktivitas = ARRAY['nature']
WHERE id_destinasi IN ();
*/

-- Template Tujuan
/*
UPDATE destinasi SET tujuan_cocok = ARRAY['healing', 'content']
WHERE id_destinasi IN ();
*/

-- Template Untuk
/*
UPDATE destinasi SET cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN ();
*/

-- Template Lengkap
/*
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['nature'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends']
WHERE id_destinasi IN ();
*/
