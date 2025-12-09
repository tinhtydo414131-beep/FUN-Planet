-- Create private_messages table for 1-1 messaging
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  attachment_url TEXT,
  reply_to_id UUID REFERENCES public.private_messages(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_private_messages_conversation ON public.private_messages(conversation_id, created_at DESC);
CREATE INDEX idx_private_messages_receiver_unread ON public.private_messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_private_messages_sender ON public.private_messages(sender_id);

-- Enable RLS
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages"
ON public.private_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.private_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages (mark as read)"
ON public.private_messages FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own sent messages"
ON public.private_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;