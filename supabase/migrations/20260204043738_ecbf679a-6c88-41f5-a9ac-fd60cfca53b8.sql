-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow service role full access" ON public.model_purchases;

-- Create restrictive policies:
-- SELECT: Users can only read their own purchases (user_id stores Firebase UID as text)
-- We can't verify Firebase tokens in RLS, so we rely on the edge function for writes.
-- For reads, we block direct client access and require going through an edge function.

-- Block all direct client access - all operations must go through edge functions
CREATE POLICY "Block direct client access for select"
ON public.model_purchases
FOR SELECT
USING (false);

CREATE POLICY "Block direct client access for insert"
ON public.model_purchases
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block direct client access for update"
ON public.model_purchases
FOR UPDATE
USING (false);

CREATE POLICY "Block direct client access for delete"
ON public.model_purchases
FOR DELETE
USING (false);