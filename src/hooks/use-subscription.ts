import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import supabase from '@/lib/supabase';

interface SubscriptionData {
  customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
  // Added fields from users table
  planType: string | null;
  generationsRemaining: number | null;
  subscriptionRenewalDate: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get user data from the users table to get generations remaining and plan type
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('planType, generationsRemaining, subscriptionRenewalDate')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      // Then get subscription data from the view
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription data:', subscriptionError);
        // Don't throw here, as the user might not have a subscription yet
      }

      // Combine the data
      const combinedData: SubscriptionData = {
        customer_id: subscriptionData?.customer_id || null,
        subscription_id: subscriptionData?.subscription_id || null,
        subscription_status: subscriptionData?.subscription_status || null,
        price_id: subscriptionData?.price_id || null,
        current_period_start: subscriptionData?.current_period_start || null,
        current_period_end: subscriptionData?.current_period_end || null,
        cancel_at_period_end: subscriptionData?.cancel_at_period_end || null,
        payment_method_brand: subscriptionData?.payment_method_brand || null,
        payment_method_last4: subscriptionData?.payment_method_last4 || null,
        planType: userData?.planType || 'free',
        generationsRemaining: userData?.generationsRemaining || 0,
        subscriptionRenewalDate: userData?.subscriptionRenewalDate || null,
      };

      setSubscription(combinedData);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Computed values for easier access
  const generationsRemaining = subscription?.generationsRemaining || 0;
  const planType = subscription?.planType || 'free';
  const canGenerate = generationsRemaining > 0;

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    generationsRemaining,
    planType,
    canGenerate,
  };
}