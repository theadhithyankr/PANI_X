-- Add is_viewed column to applications table to track if candidate has viewed the application status update
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS is_viewed BOOLEAN DEFAULT FALSE;

-- Create an index for faster queries on unread applications
CREATE INDEX IF NOT EXISTS idx_applications_is_viewed 
ON applications(candidate_id, is_viewed) 
WHERE is_viewed = FALSE;

-- Add a comment to document the column
COMMENT ON COLUMN applications.is_viewed IS 'Tracks whether the candidate has viewed this application status update in their inbox';
