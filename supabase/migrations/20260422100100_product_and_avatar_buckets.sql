-- ============================================================
-- Storage Buckets: products + avatars
-- ============================================================

-- Products bucket — public read for catalog images, admin-only write
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read products bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND is_admin());
CREATE POLICY "Admin update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products' AND is_admin());
CREATE POLICY "Admin delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND is_admin());

-- Avatars bucket — public read, users can manage their own avatar,
-- admins can manage any avatar.
-- Convention: files are stored under {user_id}/avatar.{ext} so we can
-- enforce ownership with (storage.foldername(name))[1] = user_id.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read avatars bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
  );
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
  );
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
  );
