-- Fix membership notification trigger: explicit type casts prevent silent failure
-- when billing_cycle (enum) and id (UUID) are concatenated in the function body.

CREATE OR REPLACE FUNCTION public.notify_membership_event()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
  user_name TEXT;
  tier_label TEXT;
BEGIN
  SELECT name INTO user_name FROM public.profiles WHERE id = NEW.user_id;
  tier_label := initcap(NEW.tier::TEXT);

  IF TG_OP = 'INSERT' THEN
    SELECT ARRAY_AGG(user_id) INTO recipient_ids
      FROM public.admins_with_roles('operations', 'super_admin');
    IF recipient_ids IS NOT NULL THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'membership_new',
        tier_label || ' membership activated',
        COALESCE(user_name, 'A user') || ' subscribed to ' || tier_label || ' (' || NEW.billing_cycle::TEXT || ')',
        'membership_subscription',
        NEW.id::TEXT
      );
    END IF;

  ELSIF TG_OP = 'UPDATE'
    AND NEW.status::TEXT = 'cancelled'
    AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT ARRAY_AGG(user_id) INTO recipient_ids
      FROM public.admins_with_roles('operations', 'super_admin');
    IF recipient_ids IS NOT NULL THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'membership_cancelled',
        tier_label || ' membership cancelled',
        COALESCE(user_name, 'A user') || ' cancelled their ' || tier_label || ' membership',
        'membership_subscription',
        NEW.id::TEXT
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_membership_event: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
