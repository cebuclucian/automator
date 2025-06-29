import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';

interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
}

export function useStripe() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();
  const t = useTranslation();

  const createCheckoutSession = async ({
    priceId,
    mode,
    successUrl = `${window.location.origin}/success`,
    cancelUrl = `${window.location.origin}/pricing`
  }: CreateCheckoutSessionParams) => {
    if (!user || !session) {
      toast({
        title: t('auth.signInError'),
        description: 'Please sign in to continue',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }

      return url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: t('subscription.checkoutError'),
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading,
  };
}