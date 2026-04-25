-- Fix: order_status enum uses 'completed' not 'delivered'
CREATE OR REPLACE FUNCTION flag_overdue_fulfillment()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE fulfillment_tracking
  SET risk_level = 'behind'
  WHERE risk_level != 'behind'
    AND fulfillment_deadline IS NOT NULL
    AND fulfillment_deadline < now()
    AND order_id IN (
      SELECT id FROM orders WHERE status NOT IN ('completed', 'cancelled')
    );
END;
$$;
