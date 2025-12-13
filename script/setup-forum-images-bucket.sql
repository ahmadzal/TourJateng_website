-- Setup Storage Bucket untuk Upload Gambar Komentar Forum
-- File: setup-forum-images-bucket.sql
-- JALANKAN SCRIPT INI DI SUPABASE SQL EDITOR

-- 1. Create bucket forum-images (jika belum ada)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy untuk melihat gambar (public read access)
DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;
CREATE POLICY "Anyone can view forum images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'forum-images');

-- 3. Policy untuk upload gambar oleh authenticated users
DROP POLICY IF EXISTS "Authenticated users can upload forum images" ON storage.objects;
CREATE POLICY "Authenticated users can upload forum images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'forum-images');

-- 4. Policy untuk update gambar oleh pemilik
DROP POLICY IF EXISTS "Users can update their own forum images" ON storage.objects;
CREATE POLICY "Users can update their own forum images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'forum-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '-'))[1]
  );

-- 5. Policy untuk delete gambar oleh pemilik
DROP POLICY IF EXISTS "Users can delete their own forum images" ON storage.objects;
CREATE POLICY "Users can delete their own forum images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'forum-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '-'))[1]
  );

-- 6. Verify bucket creation
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'forum-images';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Forum images bucket setup completed!';
    RAISE NOTICE 'Bucket name: forum-images';
    RAISE NOTICE 'Public access: enabled';
    RAISE NOTICE 'Upload restrictions: authenticated users only';
    RAISE NOTICE 'File naming convention: {user_id}-{timestamp}.{extension}';
END $$;