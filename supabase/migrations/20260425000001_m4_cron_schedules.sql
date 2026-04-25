-- Register pg_cron schedules (requires pg_cron extension enabled in Supabase Dashboard)
SELECT cron.schedule('expire-memberships',   '0 1 * * *', 'SELECT expire_memberships()');
SELECT cron.schedule('expire-referrals',     '0 1 * * *', 'SELECT expire_referrals()');
SELECT cron.schedule('reset-benefit-usage',  '0 2 1 * *', 'SELECT reset_monthly_benefit_usage()');
SELECT cron.schedule('flag-overdue-orders',  '0 * * * *', 'SELECT flag_overdue_fulfillment()');
