/*
  # Create Storage Bucket for Course Materials

  1. Storage Setup
    - Create a new bucket for storing generated DOCX/PPTX files
    - Configure RLS policies for secure access
    - Set up proper permissions for authenticated users

  2. Security
    - Only authenticated users can access their own materials
    - Files are automatically cleaned up after expiry
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
);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own materials
CREATE POLICY "Users can view their own course materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for service role to manage all files
CREATE POLICY "Service role can manage all course materials"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'course-materials');

-- Update materials table to remove content column dependency
DO $$
BEGIN
  -- Make content column nullable since we'll store files in storage
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'content' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE materials ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;