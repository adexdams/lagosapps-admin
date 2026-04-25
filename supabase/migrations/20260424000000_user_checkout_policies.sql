-- ============================================================
-- M3 User Checkout Policies
--
-- The initial schema only granted users SELECT on order_items,
-- order_timeline, and wallet_transactions. The user-facing app
-- creates orders client-side (pre-Paystack), so it needs INSERT
-- on these tables for rows it owns.
--
-- These policies mirror the same ownership check already on
-- orders (user_id = auth.uid()), just one join deeper.
-- ============================================================

-- Users can insert order_items for orders they own
CREATE POLICY "Users create order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Users can insert order_timeline rows for orders they own
CREATE POLICY "Users create order timeline" ON order_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_timeline.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Users can insert their own wallet transactions
-- (deductions at checkout; top-ups in M4 via Paystack webhook)
CREATE POLICY "Users create wallet transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for tables the user app subscribes to
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
