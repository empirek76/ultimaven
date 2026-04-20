-- Add youtube_url column to lb_submissions and learning_blocks
ALTER TABLE public.lb_submissions  ADD COLUMN IF NOT EXISTS youtube_url text;
ALTER TABLE public.learning_blocks ADD COLUMN IF NOT EXISTS youtube_url text;
