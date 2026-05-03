-- Add open_to_work column to profiles table
-- Candidates can toggle this to hide/show themselves from employer searches.
-- NULL is treated as true (visible) for backwards compatibility with existing users.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT NULL;
