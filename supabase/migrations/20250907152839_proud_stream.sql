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

-- Create code-submissions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('code-submissions', 'code-submissions', true);

-- Create video-submissions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-submissions', 'video-submissions', true);

-- Enable RLS on code-submissions bucket
CREATE POLICY "Users can upload their own code files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'code-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all code submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'code-submissions');

-- Enable RLS on video-submissions bucket
CREATE POLICY "Users can upload their own video files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'video-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view all video submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'video-submissions');