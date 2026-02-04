-- First drop policies so we can alter user_id column type
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.model_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.model_purchases;