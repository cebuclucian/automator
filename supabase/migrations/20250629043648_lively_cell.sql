/*
  # Storage Setup for Course Materials

  1. Storage Bucket
    - Create 'course-materials' bucket for storing generated files
    - Set appropriate file size limits and MIME types
    - Configure as private bucket

  2. Storage Policies
    - Users can view their own course materials
    - Users can upload materials for their own jobs
    - Service role can manage all files

  3. Materials Table Updates
    - Make content column nullable (files stored in storage)
    - Add storage_path column to track file locations
    - Add file_size column for metadata
    - Add performance index
*/

-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-materials',
  'course-materials',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own course materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own course materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all course materials" ON storage.objects;

-- Create storage policies for course materials bucket
-- Policy for authenticated users to read their own materials
CREATE POLICY "Users can view their own course materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT j.id::text 
    FROM jobs j 
    WHERE j."userId" = auth.uid()
  )
);

-- Policy for authenticated users to insert their own materials
CREATE POLICY "Users can upload their own course materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials' AND
  (storage.foldername(name))[1] IN (
    SELECT j.id::text 
    FROM jobs j 
    WHERE j."userId" = auth.uid()
  )
);

-- Policy for service role to manage all files in the bucket
CREATE POLICY "Service role can manage all course materials"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'course-materials')
WITH CHECK (bucket_id = 'course-materials');

-- Update materials table to make content column nullable
-- since we'll store files in storage instead of database
DO $$
BEGIN
  -- Make content column nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' 
    AND column_name = 'content' 
    AND is_nullable = 'NO'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.materials ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- Add storage_path column to materials table to track file locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' 
    AND column_name = 'storage_path'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN storage_path text;
  END IF;
END $$;

-- Add file_size column to materials table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' 
    AND column_name = 'file_size'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.materials ADD COLUMN file_size bigint;
  END IF;
END $$;

-- Create index on storage_path for better performance
CREATE INDEX IF NOT EXISTS idx_materials_storage_path ON public.materials(storage_path);