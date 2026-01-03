-- Thêm bảng user_rewards vào realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_rewards;

-- Đảm bảo REPLICA IDENTITY để realtime nhận được đủ dữ liệu
ALTER TABLE public.user_rewards REPLICA IDENTITY FULL;