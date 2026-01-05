-- Add email preferences columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_weekly_summary BOOLEAN DEFAULT true;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.email_weekly_summary IS 'User preference for receiving weekly summary emails';
COMMENT ON COLUMN profiles.email_marketing IS 'User preference for receiving marketing emails';