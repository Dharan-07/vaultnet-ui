-- Reduce exposure of sensitive purchase + dataset metadata by restricting direct table SELECT
-- and exposing only safe, purpose-built RPCs.

-- 1) Lock down direct SELECT on sensitive tables
REVOKE SELECT ON TABLE public.model_purchases FROM anon, authenticated;
REVOKE SELECT ON TABLE public.uploaded_datasets FROM anon, authenticated;

-- 2) Purchases: expose only the current user's purchase list (no tx_hash)
CREATE OR REPLACE FUNCTION public.get_my_model_purchases()
RETURNS TABLE (
  id uuid,
  model_id integer,
  model_cid text,
  model_name text,
  model_price text,
  purchased_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mp.id, mp.model_id, mp.model_cid, mp.model_name, mp.model_price, mp.purchased_at
  FROM public.model_purchases mp
  WHERE auth.uid() IS NOT NULL
    AND mp.user_id = auth.uid()
  ORDER BY mp.purchased_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.has_purchased_model(_model_id integer)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.model_purchases mp
      WHERE mp.user_id = auth.uid()
        AND mp.model_id = _model_id
    )
  );
$$;

-- Centralize purchase recording inside the database (prevents needing table SELECT from client/edge)
CREATE OR REPLACE FUNCTION public.record_model_purchase(
  _model_id integer,
  _model_cid text,
  _model_name text,
  _model_price text,
  _tx_hash text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  -- idempotency per user/model
  SELECT mp.id
  INTO v_existing_id
  FROM public.model_purchases mp
  WHERE mp.user_id = auth.uid()
    AND mp.model_id = _model_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- prevent tx hash reuse across users (if provided)
  IF _tx_hash IS NOT NULL AND length(_tx_hash) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM public.model_purchases mp
      WHERE mp.tx_hash = _tx_hash
    ) THEN
      RAISE EXCEPTION 'Transaction hash already used' USING ERRCODE = '23505';
    END IF;
  END IF;

  INSERT INTO public.model_purchases (
    user_id,
    model_id,
    model_cid,
    model_name,
    model_price,
    tx_hash
  )
  VALUES (
    auth.uid(),
    _model_id,
    _model_cid,
    _model_name,
    _model_price,
    NULLIF(_tx_hash, '')
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_model_purchases() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_purchased_model(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_model_purchase(integer, text, text, text, text) TO authenticated;

-- 3) Datasets: expose a public catalog without file_path/uploaded_by
CREATE OR REPLACE FUNCTION public.list_dataset_catalog()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  format text,
  tags text[],
  downloads integer,
  created_at timestamptz,
  file_size bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.name,
    d.description,
    d.category,
    d.format,
    d.tags,
    d.downloads,
    d.created_at,
    d.file_size
  FROM public.uploaded_datasets d
  WHERE auth.uid() IS NOT NULL
  ORDER BY d.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_dataset_catalog() TO authenticated;
