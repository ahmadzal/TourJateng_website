-- SQL untuk setup Storage Bucket untuk gambar forum
-- File: forum-storage-setup.sql
-- JALANKAN DI SUPABASE SQL EDITOR

-- Membuat bucket untuk menyimpan gambar forum
INSERT INTO storage.buckets (id, name, public) 
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Membuat folder structure policy
-- Policy untuk melihat gambar forum (public read)
CREATE POLICY "Anyone can view forum images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'forum-images');

-- Policy untuk upload gambar oleh user yang sudah login
CREATE POLICY "Authenticated users can upload forum images" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy untuk update gambar oleh owner
CREATE POLICY "Users can update their own forum images" 
  ON storage.objects FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy untuk delete gambar oleh owner  
CREATE POLICY "Users can delete their own forum images" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'forum-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Catatan:
-- 1. Jalankan script ini di Supabase Dashboard > SQL Editor
-- 2. Pastikan Row Level Security sudah enabled di storage.objects
-- 3. Folder structure: forum-images/{user_id}/{filename}
-- 4. Gambar akan public readable tapi hanya bisa diupload/edit oleh owner