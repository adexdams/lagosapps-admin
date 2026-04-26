-- When a team member row is inserted or activated, promote their profiles.role to 'admin'.
-- When deactivated or deleted, demote back to 'user' (only if they are 'admin', never touch 'super_admin').

CREATE OR REPLACE FUNCTION public.sync_profile_role_from_team()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
      SET role = 'user'
    WHERE id = OLD.user_id AND role = 'admin';
    RETURN OLD;
  END IF;

  -- INSERT or UPDATE
  IF NEW.is_active THEN
    UPDATE public.profiles
      SET role = 'admin'
    WHERE id = NEW.user_id AND role = 'user';
  ELSE
    UPDATE public.profiles
      SET role = 'user'
    WHERE id = NEW.user_id AND role = 'admin';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.admin_team_members;
CREATE TRIGGER trg_sync_profile_role
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_team_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_team();

-- Back-fill: promote any currently active team members whose profile role is still 'user'.
UPDATE public.profiles p
  SET role = 'admin'
FROM public.admin_team_members t
WHERE t.user_id = p.id
  AND t.is_active = true
  AND p.role = 'user';
