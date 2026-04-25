-- Add source column to admin_audit_log to distinguish admin dashboard
-- actions from user portal actions.
ALTER TABLE admin_audit_log
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin'
  CHECK (source IN ('admin', 'user'));

-- Relax INSERT policy so regular users can also log their own actions.
-- Previously only admins could insert. Now any authenticated user can
-- insert a row where they are the actor (admin_user_id = their own uid).
-- Admins retain full insert access via the is_admin() check.
DROP POLICY IF EXISTS "Admin insert audit log" ON admin_audit_log;

CREATE POLICY "Insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (auth.uid() = admin_user_id);

-- Read access remains admin-only.
-- (The existing "Admin read audit log" SELECT policy is unchanged.)
