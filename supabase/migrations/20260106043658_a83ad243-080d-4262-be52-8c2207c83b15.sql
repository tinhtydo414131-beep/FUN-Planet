-- Add columns for thumbnail analysis
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS thumbnail_is_appropriate BOOLEAN DEFAULT true;
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS thumbnail_concerns TEXT[];
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS thumbnail_detected_elements TEXT[];
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS thumbnail_quality_score INTEGER;
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS thumbnail_details TEXT;

-- Add columns for auto-reject tracking
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS auto_rejected BOOLEAN DEFAULT false;
ALTER TABLE game_ai_reviews ADD COLUMN IF NOT EXISTS auto_reject_reasons TEXT[];