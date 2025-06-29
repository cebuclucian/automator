import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function SuccessPage() {
  const t = useTranslation();
  const [searchParams] = useSearchParams();
  const { subscription, loading, refetch } = useSubscription();
  const [isRefetching, setIsRefetching] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refetch subscription data after successful payment
    const refetchData = async () => {
      setIsRefetching(true);
      // Wait a bit for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetch();
      setIsRefetching(false);
    };

    if (sessionId) {
      refetchData();
    }
  }, [sessionId, refetch]);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-800 dark:text-green-300">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Thank you for your purchase. Your payment has been processed successfully.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loading || isRefetching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing your subscription...</span>
              </div>
            ) : subscription?.subscription_status === 'active' ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  Subscription Activated
                </h3>
                <p className="text-green-700 dark:text-green-400 text-sm">
                  Your subscription is now active and ready to use.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Processing Payment
                </h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Your payment is being processed. You'll receive a confirmation email shortly.
                </p>
              </div>
            )}

            {sessionId && (
              <div className="text-sm text-muted-foreground">
                <p>Session ID: {sessionId}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline">
                <Link to="/settings">
                  Manage Subscription
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <SiteFooter />
    </div>
  );
}