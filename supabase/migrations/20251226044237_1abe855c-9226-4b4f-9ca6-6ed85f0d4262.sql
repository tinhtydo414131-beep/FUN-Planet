-- Create table for Angel AI chat history
CREATE TABLE public.angel_ai_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by user
CREATE INDEX idx_angel_ai_chat_user_id ON public.angel_ai_chat_history(user_id);
CREATE INDEX idx_angel_ai_chat_created_at ON public.angel_ai_chat_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.angel_ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own chat history
CREATE POLICY "Users can view their own Angel AI chat history"
ON public.angel_ai_chat_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own Angel AI messages"
ON public.angel_ai_chat_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat history
CREATE POLICY "Users can delete their own Angel AI chat history"
ON public.angel_ai_chat_history
FOR DELETE
USING (auth.uid() = user_id);