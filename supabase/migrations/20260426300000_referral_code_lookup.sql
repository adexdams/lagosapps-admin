-- Fix referral code lookup: profiles SELECT RLS only allows reading your own
-- row, so cross-user lookups (getReferrerByCode) always return null.
-- A SECURITY DEFINER function bypasses RLS for this specific read.

CREATE OR REPLACE FUNCTION public.get_referrer_by_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT, referral_code TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, referral_code
  FROM profiles
  WHERE referral_code = upper(trim(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(TEXT) TO authenticated;
