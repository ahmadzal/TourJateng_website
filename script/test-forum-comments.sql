-- Test data untuk fitur komentar forum
-- File: test-forum-comments.sql

-- Insert sample forum posts untuk testing
INSERT INTO forum_posts (title, content, author, author_id, category, comments_count) VALUES
  (
    'Tips Fotografi Landscape di Jawa Tengah',
    'Halo fotografer! Saya mau sharing tips-tips fotografi landscape yang cocok diterapkan di Jawa Tengah. Pertama, golden hour di sini biasanya jam 5:30-6:30 pagi dan 17:00-18:00 sore. Kedua, pastikan bawa tripod karena banyak spot yang butuh long exposure...',
    'Ahmad Photographer',
    'test-user-photographer',
    'Fotografi',
    0
  ),
  (
    'Rekomendasi Wisata Kuliner Semarang',
    'Buat yang lagi liburan ke Semarang, nih aku kasih rekomendasi kuliner yang wajib dicoba: 1) Lumpia Gang Lombok - legendary banget! 2) Nasi Gudeg Yu Djum 3) Tahu Petis Bu Kanti 4) Es Cao Bu Sum. Ada yang punya rekomendasi lain?',
    'Foodie Explorer',
    'test-user-foodie',
    'Kuliner',
    0
  ),
  (
    'Pengalaman Mendaki Gunung Merbabu Solo',
    'Kemarin baru selesai mendaki Merbabu lewat jalur Selo. Subhanallah pemandangannya! Sunrise di puncak benar-benar spektakuler. Yang mau mendaki, prepare fisik dari jauh-jauh hari ya. Jalurnya cukup menantang tapi worth it banget!',
    'Mountain Explorer',
    'test-user-hiker',
    'Alam',
    0
  );

-- Insert sample comments untuk testing
INSERT INTO forum_comments (post_id, content, author, author_id) VALUES
  -- Comments untuk post fotografi
  (
    (SELECT id FROM forum_posts WHERE title = 'Tips Fotografi Landscape di Jawa Tengah' LIMIT 1),
    'Wah tips yang sangat berguna! Saya juga sering foto landscape di Jateng. Mau nambahkan, spot terbaik menurutku di Candi Borobudur saat sunrise, tapi harus datang sebelum jam 5 pagi buat dapet posisi terbaik.',
    'Landscape Enthusiast',
    'test-user-photo2'
  ),
  (
    (SELECT id FROM forum_posts WHERE title = 'Tips Fotografi Landscape di Jawa Tengah' LIMIT 1),
    'Boleh minta rekomendasi gear yang cocok gak? Budget terbatas soalnya 😅',
    'Photography Beginner',
    'test-user-beginner'
  ),
  (
    (SELECT id FROM forum_posts WHERE title = 'Tips Fotografi Landscape di Jawa Tengah' LIMIT 1),
    'Untuk gear budget terbatas, coba Canon EOS M50 + EF-M 15-45mm. Atau kalau mau lebih hemat, HP flagship sekarang juga udah bagus kok untuk landscape asal tau tekniknya.',
    'Ahmad Photographer',
    'test-user-photographer'
  ),
  
  -- Comments untuk post kuliner
  (
    (SELECT id FROM forum_posts WHERE title = 'Rekomendasi Wisata Kuliner Semarang' LIMIT 1),
    'Lumpia Gang Lombok memang juara! Tapi sekarang antrinya panjang banget, mending datang pagi-pagi. Oh iya, jangan lupa coba Soto Bangkong Bu Dalijo juga, enak poll!',
    'Semarang Local',
    'test-user-local'
  ),
  (
    (SELECT id FROM forum_posts WHERE title = 'Rekomendasi Wisata Kuliner Semarang' LIMIT 1),
    'Yang halal ada rekomendasi gak? Soalnya aku muslim dan agak susah nyari yang pasti halal di Semarang.',
    'Halal Food Hunter',
    'test-user-halal'
  ),
  (
    (SELECT id FROM forum_posts WHERE title = 'Rekomendasi Wisata Kuliner Semarang' LIMIT 1),
    'Untuk yang halal: Nasi Gudeg Yu Djum itu halal kok, terus ada Ayam Goreng Pemuda yang enak banget. Soto ayam Pak Gareng juga recommended!',
    'Foodie Explorer',
    'test-user-foodie'
  ),
  
  -- Comments untuk post hiking
  (
    (SELECT id FROM forum_posts WHERE title = 'Pengalaman Mendaki Gunung Merbabu Solo' LIMIT 1),
    'Mantap! Aku juga mau coba solo hiking. Kira-kira aman gak ya untuk pemula? Dan gear minimal apa aja yang harus dibawa?',
    'Hiking Newbie',
    'test-user-newbie'
  ),
  (
    (SELECT id FROM forum_posts WHERE title = 'Pengalaman Mendaki Gunung Merbabu Solo' LIMIT 1),
    'Untuk solo hiking Merbabu, pastikan: 1) Bawa GPS/offline maps 2) Inform keluarga soal rencana pendakian 3) Bawa gear survival basics 4) Check cuaca dulu. Safety first ya!',
    'Mountain Rescue',
    'test-user-rescue'
  );

-- Update comments count di forum_posts
UPDATE forum_posts 
SET comments_count = (
  SELECT COUNT(*) 
  FROM forum_comments 
  WHERE forum_comments.post_id = forum_posts.id
);

-- Verify the data
SELECT 
  fp.title,
  fp.author,
  fp.comments_count,
  COUNT(fc.id) as actual_comments
FROM forum_posts fp
LEFT JOIN forum_comments fc ON fp.id = fc.post_id
GROUP BY fp.id, fp.title, fp.author, fp.comments_count
ORDER BY fp.created_at DESC;