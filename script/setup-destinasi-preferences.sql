-- ============================================================================
-- Setup Kolom Preferensi Destinasi untuk Sistem Rekomendasi
-- ============================================================================
-- File ini menambahkan kolom-kolom baru di tabel destinasi untuk
-- meningkatkan akurasi sistem rekomendasi berbasis kuesioner
--
-- Cara pakai:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Copy-paste script ini
-- 3. Run
-- ============================================================================

-- 1. TAMBAH KOLOM BARU
-- ============================================================================

ALTER TABLE destinasi 
ADD COLUMN IF NOT EXISTS durasi_rekomendasi TEXT,
ADD COLUMN IF NOT EXISTS kategori_aktivitas TEXT[],
ADD COLUMN IF NOT EXISTS tujuan_cocok TEXT[],
ADD COLUMN IF NOT EXISTS cocok_untuk TEXT[],
ADD COLUMN IF NOT EXISTS intensitas_aktivitas TEXT;

-- 2. TAMBAH CONSTRAINT (Optional - untuk validasi data)
-- ============================================================================

-- Constraint untuk durasi_rekomendasi
ALTER TABLE destinasi 
DROP CONSTRAINT IF EXISTS check_durasi_rekomendasi;

ALTER TABLE destinasi
ADD CONSTRAINT check_durasi_rekomendasi 
CHECK (durasi_rekomendasi IN ('short', 'medium', 'long'));

-- Constraint untuk intensitas_aktivitas
ALTER TABLE destinasi 
DROP CONSTRAINT IF EXISTS check_intensitas_aktivitas;

ALTER TABLE destinasi
ADD CONSTRAINT check_intensitas_aktivitas 
CHECK (intensitas_aktivitas IN ('ringan', 'sedang', 'berat'));

-- 3. COMMENT KOLOM (Dokumentasi)
-- ============================================================================

COMMENT ON COLUMN destinasi.durasi_rekomendasi IS 'Durasi kunjungan yang disarankan: short (2-3 jam), medium (3-6 jam), long (6+ jam)';
COMMENT ON COLUMN destinasi.kategori_aktivitas IS 'Array kategori aktivitas: nature, culture, recreation';
COMMENT ON COLUMN destinasi.tujuan_cocok IS 'Array tujuan traveling yang cocok: healing, experience, content';
COMMENT ON COLUMN destinasi.cocok_untuk IS 'Array tipe traveler yang cocok: solo, couple, family, friends';
COMMENT ON COLUMN destinasi.intensitas_aktivitas IS 'Tingkat intensitas fisik: ringan, sedang, berat';

-- 4. CONTOH UPDATE DATA (TEMPLATE)
-- ============================================================================
-- Silakan sesuaikan dengan data destinasi yang ada

-- ============================================================================
-- TEMPLATE UNTUK DESTINASI ALAM (Curug, Gunung, Pantai)
-- ============================================================================

-- Contoh 1: Curug / Air Terjun (Wisata Alam Santai)
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'medium',
--   kategori_aktivitas = ARRAY['nature'],
--   tujuan_cocok = ARRAY['healing', 'content'],
--   cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
--   intensitas_aktivitas = 'sedang'
-- WHERE nama_destinasi ILIKE '%curug%' OR nama_destinasi ILIKE '%air terjun%';

-- Contoh 2: Gunung / Pendakian (Wisata Petualangan)
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'long',
--   kategori_aktivitas = ARRAY['nature'],
--   tujuan_cocok = ARRAY['experience', 'content'],
--   cocok_untuk = ARRAY['solo', 'friends'],
--   intensitas_aktivitas = 'berat'
-- WHERE nama_destinasi ILIKE '%dieng%' OR kategori ILIKE '%gunung%';

-- Contoh 3: Pantai (Wisata Santai)
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'long',
--   kategori_aktivitas = ARRAY['nature', 'recreation'],
--   tujuan_cocok = ARRAY['healing', 'content'],
--   cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
--   intensitas_aktivitas = 'ringan'
-- WHERE kategori ILIKE '%pantai%';

-- ============================================================================
-- TEMPLATE UNTUK DESTINASI BUDAYA
-- ============================================================================

-- Contoh 4: Candi (Sejarah & Budaya)
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'medium',
--   kategori_aktivitas = ARRAY['culture'],
--   tujuan_cocok = ARRAY['experience', 'content'],
--   cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
--   intensitas_aktivitas = 'ringan'
-- WHERE nama_destinasi ILIKE '%candi%' OR kategori ILIKE '%sejarah%';

-- Contoh 5: Museum
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'short',
--   kategori_aktivitas = ARRAY['culture'],
--   tujuan_cocok = ARRAY['experience'],
--   cocok_untuk = ARRAY['solo', 'couple', 'family'],
--   intensitas_aktivitas = 'ringan'
-- WHERE nama_destinasi ILIKE '%museum%';

-- ============================================================================
-- TEMPLATE UNTUK DESTINASI REKREASI
-- ============================================================================

-- Contoh 6: Taman Rekreasi / Hiburan
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'long',
--   kategori_aktivitas = ARRAY['recreation'],
--   tujuan_cocok = ARRAY['healing', 'content'],
--   cocok_untuk = ARRAY['couple', 'family', 'friends'],
--   intensitas_aktivitas = 'ringan'
-- WHERE kategori ILIKE '%rekreasi%' OR kategori ILIKE '%hiburan%';

-- Contoh 7: Waterpark / Kolam Renang
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'medium',
--   kategori_aktivitas = ARRAY['recreation'],
--   tujuan_cocok = ARRAY['healing', 'content'],
--   cocok_untuk = ARRAY['family', 'friends'],
--   intensitas_aktivitas = 'sedang'
-- WHERE nama_destinasi ILIKE '%waterpark%' OR nama_destinasi ILIKE '%kolam renang%';

-- Contoh 8: Spot Foto / Instagramable
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'short',
--   kategori_aktivitas = ARRAY['recreation'],
--   tujuan_cocok = ARRAY['content'],
--   cocok_untuk = ARRAY['solo', 'couple', 'friends'],
--   intensitas_aktivitas = 'ringan'
-- WHERE deskripsi ILIKE '%spot foto%' OR deskripsi ILIKE '%instagramable%';

-- ============================================================================
-- TEMPLATE UNTUK DESTINASI MULTI-KATEGORI
-- ============================================================================

-- Contoh 9: Wisata Alam yang juga Instagramable (Kombinasi)
-- UPDATE destinasi 
-- SET 
--   durasi_rekomendasi = 'medium',
--   kategori_aktivitas = ARRAY['nature', 'recreation'],
--   tujuan_cocok = ARRAY['healing', 'experience', 'content'],
--   cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
--   intensitas_aktivitas = 'sedang'
-- WHERE nama_destinasi ILIKE '%telaga%' OR nama_destinasi ILIKE '%danau%';

-- ============================================================================
-- 5. SET DEFAULT UNTUK DESTINASI YANG BELUM DIISI
-- ============================================================================

-- Set default value agar tidak ada yang NULL
UPDATE destinasi 
SET 
  durasi_rekomendasi = 'medium',
  kategori_aktivitas = ARRAY['recreation'],
  tujuan_cocok = ARRAY['healing', 'content'],
  cocok_untuk = ARRAY['solo', 'couple', 'family', 'friends'],
  intensitas_aktivitas = 'sedang'
WHERE durasi_rekomendasi IS NULL;

-- ============================================================================
-- 6. VERIFIKASI DATA
-- ============================================================================

-- Check berapa destinasi yang sudah diisi
SELECT 
  COUNT(*) as total_destinasi,
  COUNT(durasi_rekomendasi) as sudah_ada_durasi,
  COUNT(kategori_aktivitas) as sudah_ada_kategori,
  COUNT(tujuan_cocok) as sudah_ada_tujuan,
  COUNT(cocok_untuk) as sudah_ada_cocok_untuk,
  COUNT(intensitas_aktivitas) as sudah_ada_intensitas
FROM destinasi;

-- Lihat sample data
SELECT 
  nama_destinasi,
  durasi_rekomendasi,
  kategori_aktivitas,
  tujuan_cocok,
  cocok_untuk,
  intensitas_aktivitas
FROM destinasi
LIMIT 10;

-- ============================================================================
-- SELESAI! 🎉
-- ============================================================================
-- Selanjutnya:
-- 1. Isi data destinasi satu per satu sesuai karakteristiknya
-- 2. Update kode TypeScript untuk membaca dari kolom ini
-- 3. Test sistem rekomendasi
-- ============================================================================
