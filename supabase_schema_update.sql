-- Add positive_note column to moods table
-- Run this in your Supabase SQL editor

ALTER TABLE moods 
ADD COLUMN IF NOT EXISTS positive_note TEXT;

-- The column will be nullable, so existing records won't be affected
-- RLS policies already cover this column since they're based on user_id

