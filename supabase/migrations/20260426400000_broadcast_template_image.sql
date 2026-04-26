-- Add imageBlock support to the broadcast email template.
-- The Edge Function pre-builds {{imageBlock}} from data.imageUrl before interpolation,
-- so no conditional logic is needed in the template itself.
UPDATE email_templates
SET body_html = '<div style="font-size:15px;line-height:1.6;color:#334155;">{{message}}</div>{{imageBlock}}'
WHERE key = 'broadcast';
