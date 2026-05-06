-- Add profile_views column to profiles table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

-- Optional: allow employers/anyone to increment view count when viewing a candidate profile
-- (call this via supabase RPC or a trigger — for now just ensure the column exists)
