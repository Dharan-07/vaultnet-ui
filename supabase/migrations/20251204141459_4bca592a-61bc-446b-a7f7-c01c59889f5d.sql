-- Create storage bucket for datasets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('datasets', 'datasets', true);

-- Create table for uploaded datasets metadata
CREATE TABLE public.uploaded_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  format TEXT,
  tags TEXT[],
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uploaded_datasets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view datasets
CREATE POLICY "Anyone can view datasets"
ON public.uploaded_datasets
FOR SELECT
USING (true);

-- Anyone can insert datasets (public uploads)
CREATE POLICY "Anyone can upload datasets"
ON public.uploaded_datasets
FOR INSERT
WITH CHECK (true);

-- Storage policies
CREATE POLICY "Anyone can view dataset files"
ON storage.objects FOR SELECT
USING (bucket_id = 'datasets');

CREATE POLICY "Anyone can upload dataset files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasets');

CREATE POLICY "Anyone can download dataset files"
ON storage.objects FOR SELECT
USING (bucket_id = 'datasets');