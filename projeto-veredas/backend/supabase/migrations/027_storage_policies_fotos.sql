-- Migration 027: Storage RLS policies for bucket 'fotos'

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "fotos_insert_authenticated" ON storage.objects;
CREATE POLICY "fotos_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fotos');

-- Allow public read access (needed for landing page)
DROP POLICY IF EXISTS "fotos_select_public" ON storage.objects;
CREATE POLICY "fotos_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'fotos');

-- Allow authenticated users to update files
DROP POLICY IF EXISTS "fotos_update_authenticated" ON storage.objects;
CREATE POLICY "fotos_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'fotos');

-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "fotos_delete_authenticated" ON storage.objects;
CREATE POLICY "fotos_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'fotos');
