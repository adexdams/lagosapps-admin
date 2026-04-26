-- Make insert_system_notification respect per-admin alert preferences.
-- Notification type is mapped to a preference category; if the recipient
-- has explicitly disabled that category the row is not inserted.
-- No preference row = default ON (notifications enabled).

CREATE OR REPLACE FUNCTION public.insert_system_notification(
  recipient_ids    UUID[],
  notif_type       TEXT,
  notif_title      TEXT,
  notif_message    TEXT,
  entity_type_in   TEXT DEFAULT NULL,
  entity_id_in     TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  pref_category TEXT;
BEGIN
  pref_category := CASE
    WHEN notif_type IN ('membership_new','membership_expiring','membership_cancelled')
      THEN 'membership'
    WHEN notif_type IN ('order_new','order_overdue','order_cancelled')
      THEN 'orders'
    WHEN notif_type IN ('inventory_low_stock','inventory_out_of_stock')
      THEN 'inventory'
    WHEN notif_type IN ('wallet_large_transaction','wallet_adjustment')
      THEN 'wallet'
    WHEN notif_type IN ('team_role_changed','team_privilege_updated','team_member_added')
      THEN 'team'
    ELSE 'system'
  END;

  INSERT INTO public.system_notifications
    (recipient_id, type, title, message, entity_type, entity_id, read)
  SELECT uid, notif_type, notif_title, notif_message, entity_type_in, entity_id_in, false
  FROM UNNEST(recipient_ids) AS uid
  WHERE uid IS NOT NULL
    -- Skip if the recipient has explicitly turned this category off.
    -- Missing preference row → default enabled.
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_preferences np
      WHERE np.admin_id = uid
        AND np.category = pref_category
        AND np.enabled = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
