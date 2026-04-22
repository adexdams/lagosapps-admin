-- ============================================================
-- System notification triggers for the admin dashboard.
--
-- Each trigger inserts rows into system_notifications that target
-- the appropriate admin team members. Admins see these in their
-- topbar bell icon and on the /notifications page.
--
-- Categories covered in this migration:
--   1. Service request assigned → notify the assignee
--   2. Service request created → notify operations team
--   3. Custom order request created → notify operations team
--   4. Order cancelled → notify operations team
--   5. Inventory low stock (stock <= low_stock_threshold) → notify operations
--   6. Team member role or privileges changed → notify the member
--   7. Broadcast sent → notify super_admin team members
--
-- Conventions:
-- - All trigger functions are SECURITY DEFINER so they can insert into
--   system_notifications even when the originating action is a user or
--   a non-admin service role.
-- - Functions never raise errors that could roll back the parent insert —
--   failures are logged as warnings via RAISE NOTICE.
-- - Each notification includes entity_type + entity_id so the admin UI
--   can deep-link to the relevant record.
-- ============================================================

-- ── Helpers ────────────────────────────────────────────────

-- Returns admin team_members who hold the given role(s).
CREATE OR REPLACE FUNCTION public.admins_with_roles(VARIADIC target_roles team_role[])
RETURNS TABLE(user_id UUID) AS $$
  SELECT atm.user_id
  FROM public.admin_team_members atm
  WHERE atm.is_active = true
    AND atm.role = ANY(target_roles);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Fan out a notification to a set of admin user IDs.
CREATE OR REPLACE FUNCTION public.insert_system_notification(
  recipient_ids UUID[],
  notif_type TEXT,
  notif_title TEXT,
  notif_message TEXT,
  entity_type_in TEXT DEFAULT NULL,
  entity_id_in TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.system_notifications (recipient_id, type, title, message, entity_type, entity_id, read)
  SELECT uid, notif_type, notif_title, notif_message, entity_type_in, entity_id_in, false
  FROM UNNEST(recipient_ids) AS uid
  WHERE uid IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 1 + 2. Service requests ───────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_service_request_event()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
  requester_name TEXT;
BEGIN
  -- When a request is newly created (INSERT)
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO requester_name FROM public.profiles WHERE id = NEW.user_id;
    -- Notify operations team
    SELECT ARRAY_AGG(user_id) INTO recipient_ids FROM public.admins_with_roles('operations', 'super_admin');
    IF recipient_ids IS NOT NULL THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'request_new',
        'New ' || NEW.type_label || ' request',
        'From ' || COALESCE(requester_name, 'a user') || '. Review and assign.',
        'service_request',
        NEW.id
      );
    END IF;

  -- When a request is assigned to someone new (UPDATE with assigned_to change)
  ELSIF TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL
    AND (OLD.assigned_to IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    SELECT name INTO requester_name FROM public.profiles WHERE id = NEW.user_id;
    PERFORM public.insert_system_notification(
      ARRAY[NEW.assigned_to],
      'request_assigned',
      'Service request assigned to you',
      NEW.type_label || ' from ' || COALESCE(requester_name, 'a user'),
      'service_request',
      NEW.id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_service_request_event: % (request %)', SQLERRM, NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_service_request_event ON public.service_requests;
CREATE TRIGGER on_service_request_event
  AFTER INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_service_request_event();

-- ── 3. Custom order requests ──────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_custom_request_created()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
  requester_name TEXT;
BEGIN
  SELECT name INTO requester_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT ARRAY_AGG(user_id) INTO recipient_ids FROM public.admins_with_roles('operations', 'super_admin');
  IF recipient_ids IS NOT NULL THEN
    PERFORM public.insert_system_notification(
      recipient_ids,
      'request_new',
      'New custom order request',
      COALESCE(requester_name, 'A user') || ' submitted a ' || NEW.portal_id || ' custom request.',
      'custom_order_request',
      NEW.id
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_custom_request_created: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_custom_request_created ON public.custom_order_requests;
CREATE TRIGGER on_custom_request_created
  AFTER INSERT ON public.custom_order_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_custom_request_created();

-- ── 4. Order cancelled ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_order_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    SELECT ARRAY_AGG(user_id) INTO recipient_ids FROM public.admins_with_roles('operations', 'super_admin');
    IF recipient_ids IS NOT NULL THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'order_cancelled',
        'Order ' || NEW.id || ' cancelled',
        'Order worth ' || NEW.total_amount::TEXT || ' has been cancelled.',
        'order',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_order_cancelled: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_cancelled ON public.orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_cancelled();

-- ── 5. Inventory low stock ────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_inventory_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
  notif_type TEXT;
  notif_title TEXT;
BEGIN
  -- Only fire when stock crosses a threshold (was OK, now low/out)
  IF NEW.stock = 0 AND OLD.stock > 0 THEN
    notif_type := 'inventory_out_of_stock';
    notif_title := NEW.name || ' is out of stock';
  ELSIF NEW.stock <= NEW.low_stock_threshold AND OLD.stock > OLD.low_stock_threshold THEN
    notif_type := 'inventory_low_stock';
    notif_title := NEW.name || ' is low (' || NEW.stock || ' left)';
  ELSE
    RETURN NEW;
  END IF;

  SELECT ARRAY_AGG(user_id) INTO recipient_ids FROM public.admins_with_roles('operations', 'super_admin');
  IF recipient_ids IS NOT NULL THEN
    PERFORM public.insert_system_notification(
      recipient_ids,
      notif_type,
      notif_title,
      'Portal: ' || NEW.portal_id || '. Check inventory.',
      'product',
      NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_inventory_low_stock: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_product_stock_change ON public.products;
CREATE TRIGGER on_product_stock_change
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_inventory_low_stock();

-- ── 6. Team member role changed ───────────────────────────

CREATE OR REPLACE FUNCTION public.notify_team_role_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    PERFORM public.insert_system_notification(
      ARRAY[NEW.user_id],
      'team_role_changed',
      'Your role has been updated',
      'Your admin role is now ' || NEW.role::TEXT || '.',
      'team_member',
      NEW.id::TEXT
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_team_role_changed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_team_role_changed ON public.admin_team_members;
CREATE TRIGGER on_team_role_changed
  AFTER UPDATE OF role ON public.admin_team_members
  FOR EACH ROW EXECUTE FUNCTION public.notify_team_role_changed();

-- ── 7. Broadcast sent ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_broadcast_sent()
RETURNS TRIGGER AS $$
DECLARE
  recipient_ids UUID[];
BEGIN
  -- Only fire when status flips to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status IS DISTINCT FROM 'sent') THEN
    SELECT ARRAY_AGG(user_id) INTO recipient_ids FROM public.admins_with_roles('super_admin');
    -- Don't notify the sender themselves
    IF recipient_ids IS NOT NULL AND NEW.sent_by IS NOT NULL THEN
      recipient_ids := ARRAY(SELECT UNNEST(recipient_ids) EXCEPT SELECT NEW.sent_by);
    END IF;
    IF recipient_ids IS NOT NULL AND array_length(recipient_ids, 1) > 0 THEN
      PERFORM public.insert_system_notification(
        recipient_ids,
        'broadcast_sent',
        'Broadcast sent: ' || NEW.title,
        'A broadcast went out to users.',
        'broadcast',
        NEW.id::TEXT
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_broadcast_sent: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_broadcast_sent ON public.broadcasts;
CREATE TRIGGER on_broadcast_sent
  AFTER INSERT OR UPDATE ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.notify_broadcast_sent();

-- ── Extend the broadcast_sent notification type in the CHECK constraint
-- The original CHECK in 20260420120400 didn't include 'broadcast_sent'.
-- Drop and recreate with the new allowed value.
-- ============================================================

ALTER TABLE public.system_notifications DROP CONSTRAINT IF EXISTS system_notifications_type_check;
ALTER TABLE public.system_notifications ADD CONSTRAINT system_notifications_type_check CHECK (type IN (
  'order_new', 'order_overdue', 'order_cancelled',
  'fulfillment_assigned', 'fulfillment_sla_risk', 'fulfillment_overdue',
  'request_new', 'request_assigned', 'request_overdue',
  'inventory_low_stock', 'inventory_out_of_stock',
  'wallet_large_transaction', 'wallet_adjustment',
  'membership_new', 'membership_expiring', 'membership_cancelled',
  'team_role_changed', 'team_privilege_updated', 'team_member_added',
  'settings_changed', 'portal_toggled',
  'broadcast_sent'
));
