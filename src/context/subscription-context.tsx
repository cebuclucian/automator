import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';
import { Database } from '@/types/supabase';

type UserSubscription = Database['public']['Tables']['users']['Row'];

interface SubscriptionContextProps {
  subscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  canGenerate: boolean;
  generationsRemaining: number;
  fetchSubscription: () => Promise<void>;
  checkCanGenerate: () => Promise<boolean>;
  initializeStripeCheckout: (priceId: string) => Promise<string | null>;
  cancelSubscription: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslation();

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setSubscription(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanGenerate = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Refresh subscription info
      await fetchSubscription();
      
      if (!subscription) return false;
      
      // Check if user has generations remaining
      return subscription.generationsRemaining > 0;
    } catch (err) {
      console.error('Error checking if user can generate:', err);
      return false;
    }
  };

  const initializeStripeCheckout = async (priceId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      // Call the serverless function to create a Stripe Checkout session
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          priceId,
          userId: user.id,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/settings?checkout=cancelled`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { checkoutUrl } = await response.json();
      return checkoutUrl;
    } catch (err) {
      const error = err as Error;
      toast({
        title: t('subscription.checkoutError'),
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!user || !subscription?.stripeSubscriptionId) return false;
    
    try {
      // Call the serverless function to cancel the subscription
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          subscriptionId: subscription.stripeSubscriptionId,
          userId: user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      // Refresh subscription info
      await fetchSubscription();
      
      toast({
        title: t('subscription.cancelSuccess'),
        description: t('subscription.cancelMessage'),
      });
      
      return true;
    } catch (err) {
      const error = err as Error;
      toast({
        title: t('subscription.cancelError'),
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const canGenerate = subscription?.generationsRemaining ? subscription.generationsRemaining > 0 : false;
  const generationsRemaining = subscription?.generationsRemaining ?? 0;

  const value = {
    subscription,
    loading,
    error,
    canGenerate,
    generationsRemaining,
    fetchSubscription,
    checkCanGenerate,
    initializeStripeCheckout,
    cancelSubscription,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}