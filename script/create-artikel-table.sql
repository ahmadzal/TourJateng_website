-- Create artikel table in Supabase
-- This table stores article/blog posts for the TourJateng application

CREATE TABLE IF NOT EXISTS artikel (
  id_artikel BIGSERIAL PRIMARY KEY,
  judul_artikel TEXT NOT NULL,
  deskripsi_artikel TEXT NOT NULL,
  kategori_artikel TEXT NOT NULL,
  durasi_baca TEXT NOT NULL,
  penerbit TEXT NOT NULL,
  url_gambar TEXT NOT NULL,
  tanggal_terbit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artikel_kategori ON artikel(kategori_artikel);
CREATE INDEX IF NOT EXISTS idx_artikel_tanggal ON artikel(tanggal_terbit);

-- Enable Row Level Security (RLS)
ALTER TABLE artikel ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read articles
CREATE POLICY "Allow public read access to artikel" 
ON artikel FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert articles (optional - adjust based on your needs)
CREATE POLICY "Allow authenticated users to insert artikel" 
ON artikel FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update articles (optional - adjust based on your needs)
CREATE POLICY "Allow authenticated users to update artikel" 
ON artikel FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Sample data insert (optional - uncomment if you want to add sample data)
/*
INSERT INTO artikel (judul_artikel, deskripsi_artikel, kategori_artikel, durasi_baca, penerbit, url_gambar, tanggal_terbit) VALUES
('Keajaiban Candi Borobudur di Pagi Hari', 
 'Menyaksikan sunrise di Borobudur adalah pengalaman spiritual yang tak terlupakan. Candi Buddha terbesar di dunia ini menawarkan pemandangan magis saat fajar menyingsing. Dibangun pada abad ke-8 dan ke-9 oleh Dinasti Syailendra, monument megah ini terdiri dari sembilan tingkat yang melambangkan perjalanan spiritual menuju pencerahan.', 
 'Sejarah', 
 '5 menit', 
 'Tim TourJateng', 
 '/images/Borobudur.png', 
 '2024-11-05'),

('Menjelajahi Keindahan Curug Lawe yang Memukau', 
 'Air terjun setinggi 80 meter ini tersembunyi di antara hutan hijau Temanggung. Suara gemericik air dan udara sejuk menjadi daya tarik utama bagi para petualang. Perjalanan menuju Curug Lawe dimulai dari Desa Tlahap dengan tracking sekitar 45 menit melalui jalur yang menantang namun mempesona.', 
 'Alam', 
 '7 menit', 
 'Tim TourJateng', 
 '/images/CurugLawe.png', 
 '2024-11-03'),

('Seni Batik Tradisional Solo: Warisan Budaya Nusantara', 
 'Batik Solo memiliki ciri khas motif klasik yang elegan. Proses pembuatan batik tulis yang memakan waktu berbulan-bulan menghasilkan karya seni bernilai tinggi. Motif-motif seperti Parang, Kawung, Sido Mukti, dan Truntum menjadi ikon khas Keraton Surakarta dengan filosofi yang mendalam.', 
 'Seni Budaya', 
 '6 menit', 
 'Tim TourJateng', 
 '/images/des1.png', 
 '2024-11-01'),

('Pesona Hutan Pinus Kragilan di Magelang', 
 'Hamparan pohon pinus yang tertata rapi menciptakan suasana sejuk dan damai. Tempat ini menjadi favorit fotografer dan pencinta alam untuk menikmati ketenangan. Udara segar dan pemandangan hijau yang menenangkan menjadikan Hutan Pinus Kragilan destinasi sempurna untuk healing dan refreshing.', 
 'Alam', 
 '4 menit', 
 'Tim TourJateng', 
 '/images/HutanPinusKragilan.png', 
 '2024-10-28');
*/
