/*
  # Create Storage Buckets for File Submissions

  1. New Storage Buckets
    - `code-submissions` - For storing code archive files
    - `video-submissions` - For storing video explanation files
  
  2. Security
    - Enable RLS on both buckets
    - Add policies for authenticated users to upload their own files
    - Add policies for users to view all submitted files
*/

-- Create code submissions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('code-submissions', 'code-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Create video submissions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-submissions', 'video-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload code files
CREATE POLICY "Users can upload code files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'code-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for authenticated users to upload video files
CREATE POLICY "Users can upload video files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'video-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for users to view all code submissions
CREATE POLICY "Users can view code submissions"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'code-submissions');

-- Policy for users to view all video submissions
CREATE POLICY "Users can view video submissions"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'video-submissions');

-- Policy for users to update their own code files
CREATE POLICY "Users can update their own code files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'code-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for users to update their own video files
CREATE POLICY "Users can update their own video files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'video-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for users to delete their own code files
CREATE POLICY "Users can delete their own code files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'code-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for users to delete their own video files
CREATE POLICY "Users can delete their own video files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'video-submissions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );