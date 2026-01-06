-- Create game AI reviews table for storing Angel AI evaluations
CREATE TABLE game_ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES uploaded_games(id) ON DELETE CASCADE,
  
  -- Overall Assessment
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  is_safe_for_kids BOOLEAN DEFAULT true,
  recommended_age TEXT,
  
  -- Violence Detection
  violence_score INTEGER CHECK (violence_score >= 0 AND violence_score <= 10),
  violence_types TEXT[],
  violence_details TEXT,
  
  -- Lootbox/Gambling Detection
  has_lootbox BOOLEAN DEFAULT false,
  has_gambling_mechanics BOOLEAN DEFAULT false,
  monetization_concerns TEXT[],
  monetization_details TEXT,
  
  -- Educational Value
  educational_score INTEGER CHECK (educational_score >= 0 AND educational_score <= 10),
  educational_categories TEXT[],
  learning_outcomes TEXT[],
  educational_details TEXT,
  
  -- Content Categories
  detected_themes TEXT[],
  positive_aspects TEXT[],
  concerns TEXT[],
  
  -- AI Metadata
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  confidence_score NUMERIC(4,2),
  review_summary TEXT,
  full_ai_response JSONB,
  
  -- Timestamps
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint
  CONSTRAINT unique_game_ai_review UNIQUE (game_id)
);

-- Indexes for fast queries
CREATE INDEX idx_game_ai_reviews_game_id ON game_ai_reviews(game_id);
CREATE INDEX idx_game_ai_reviews_is_safe ON game_ai_reviews(is_safe_for_kids);
CREATE INDEX idx_game_ai_reviews_recommended_age ON game_ai_reviews(recommended_age);
CREATE INDEX idx_game_ai_reviews_overall_score ON game_ai_reviews(overall_score);

-- Enable RLS
ALTER TABLE game_ai_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies using has_role function
CREATE POLICY "Admins can manage all AI reviews" ON game_ai_reviews
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Game owners can view their reviews" ON game_ai_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM uploaded_games WHERE id = game_ai_reviews.game_id AND user_id = auth.uid())
  );

CREATE POLICY "Public can view reviews for approved games" ON game_ai_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM uploaded_games WHERE id = game_ai_reviews.game_id AND status = 'approved')
  );

-- Trigger to update updated_at
CREATE TRIGGER update_game_ai_reviews_updated_at
  BEFORE UPDATE ON game_ai_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();