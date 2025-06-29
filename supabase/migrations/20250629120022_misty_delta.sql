-- Update the stripe_user_subscriptions view to include user data
-- Drop existing view
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Create updated view that includes user data
CREATE VIEW stripe_user_subscriptions AS
SELECT 
  sc.customer_id,
  ss.subscription_id,
  ss.status as subscription_status,
  ss.price_id,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  ss.payment_method_brand,
  ss.payment_method_last4,
  -- Include user data
  u."planType",
  u."generationsRemaining",
  u."subscriptionRenewalDate"
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
LEFT JOIN users u ON sc.user_id = u.id
WHERE sc.user_id = auth.uid() AND sc.deleted_at IS NULL;

-- Make view security definer so it works with RLS
ALTER VIEW stripe_user_subscriptions SET (security_invoker = off);