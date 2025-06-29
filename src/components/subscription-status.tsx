import { useSubscription } from '@/hooks/use-subscription';
import { getProductByPriceId } from '@/stripe-config';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function SubscriptionStatus() {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (!subscription || !subscription.price_id) {
    return <Badge variant="secondary">Free</Badge>;
  }

  const product = getProductByPriceId(subscription.price_id);
  const isActive = subscription.subscription_status === 'active';

  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {product?.name || 'Unknown'}
    </Badge>
  );
}