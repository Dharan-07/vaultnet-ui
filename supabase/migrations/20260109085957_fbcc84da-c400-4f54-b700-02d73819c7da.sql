-- Fix dataset ownership: make uploaded_by NOT NULL and cascade on user deletion
-- First drop the existing constraint
ALTER TABLE public.uploaded_datasets
DROP CONSTRAINT IF EXISTS uploaded_datasets_uploaded_by_fkey;

-- Make the column NOT NULL (no orphaned rows exist)
ALTER TABLE public.uploaded_datasets 
ALTER COLUMN uploaded_by SET NOT NULL;

-- Re-add the foreign key with ON DELETE CASCADE
ALTER TABLE public.uploaded_datasets
ADD CONSTRAINT uploaded_datasets_uploaded_by_fkey 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;