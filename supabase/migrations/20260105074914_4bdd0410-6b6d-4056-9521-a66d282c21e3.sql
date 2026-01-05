-- Create a table to track model purchases
CREATE TABLE public.model_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_id INTEGER NOT NULL,
  model_cid TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_price TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tx_hash TEXT
);

-- Enable Row Level Security
ALTER TABLE public.model_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" 
ON public.model_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases" 
ON public.model_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_model_purchases_user_id ON public.model_purchases(user_id);
CREATE INDEX idx_model_purchases_model_id ON public.model_purchases(model_id);