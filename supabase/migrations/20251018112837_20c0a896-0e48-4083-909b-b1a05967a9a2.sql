-- Create storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat files
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_url and file_name columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;