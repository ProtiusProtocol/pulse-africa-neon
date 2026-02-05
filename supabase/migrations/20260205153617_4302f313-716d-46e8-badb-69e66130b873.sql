
-- Create storage bucket for fan card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('fan-cards', 'fan-cards', true);

-- Allow public read access to fan card images
CREATE POLICY "Anyone can view fan card images"
ON storage.objects FOR SELECT
USING (bucket_id = 'fan-cards');

-- Allow authenticated uploads (for admin)
CREATE POLICY "Admins can upload fan card images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fan-cards');
