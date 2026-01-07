-- Fix Issue 1: Storage bucket security - make datasets bucket require authentication
UPDATE storage.buckets SET public = false WHERE id = 'datasets';

-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload dataset files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download dataset files" ON storage.objects;

-- Create secure storage policies for authenticated users
CREATE POLICY "Authenticated users can view dataset files"
ON storage.objects FOR SELECT
USING (bucket_id = 'datasets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload dataset files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their dataset files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'datasets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their dataset files"
ON storage.objects FOR DELETE
USING (bucket_id = 'datasets' AND auth.uid() IS NOT NULL);

-- Fix Issue 4: uploaded_datasets table - require authentication
DROP POLICY IF EXISTS "Anyone can view datasets" ON public.uploaded_datasets;
DROP POLICY IF EXISTS "Anyone can upload datasets" ON public.uploaded_datasets;

-- Create secure policies requiring authentication
CREATE POLICY "Authenticated users can view datasets"
ON public.uploaded_datasets
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload datasets"
ON public.uploaded_datasets
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own datasets"
ON public.uploaded_datasets
FOR UPDATE
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own datasets"
ON public.uploaded_datasets
FOR DELETE
USING (auth.uid() = uploaded_by);