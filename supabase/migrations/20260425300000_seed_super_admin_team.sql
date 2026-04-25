-- Ensure every super_admin profile has a corresponding admin_team_members row.
-- This makes TeamPage show them and AuthProvider load their correct teamRole.
-- ON CONFLICT DO NOTHING is safe to re-run.
INSERT INTO admin_team_members (user_id, role, is_active)
SELECT id, 'super_admin'::team_role, true
FROM profiles
WHERE role = 'super_admin'
ON CONFLICT (user_id) DO NOTHING;
