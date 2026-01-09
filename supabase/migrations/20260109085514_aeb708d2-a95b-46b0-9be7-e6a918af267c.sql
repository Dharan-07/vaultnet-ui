-- Revoke direct RPC execute from authenticated users - only edge function with service role can record purchases
REVOKE EXECUTE ON FUNCTION public.record_model_purchase(integer, text, text, text, text) FROM authenticated;

-- Grant INSERT privilege back to service role for edge function use
-- (service role already has full access)
