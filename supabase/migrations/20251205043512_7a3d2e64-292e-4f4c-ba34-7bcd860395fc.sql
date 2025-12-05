-- Add quality_stats column to video_calls table
ALTER TABLE public.video_calls 
ADD COLUMN IF NOT EXISTS quality_stats jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT NULL;

-- Create index for faster queries on caller/callee
CREATE INDEX IF NOT EXISTS idx_video_calls_caller_id ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_callee_id ON public.video_calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_created_at ON public.video_calls(created_at DESC);