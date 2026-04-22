-- Create public storage bucket for email assets (logo + banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (public bucket, needed by email clients to load images)
CREATE POLICY "Public read email assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'email-assets');

-- Only admins can upload/update/delete
CREATE POLICY "Admin upload email assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'email-assets' AND is_admin());
CREATE POLICY "Admin update email assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'email-assets' AND is_admin());
CREATE POLICY "Admin delete email assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'email-assets' AND is_admin());
