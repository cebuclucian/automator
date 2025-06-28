import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Star, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';

export default function SubscriptionPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const { subscription, loading: loadingSubscription, initializeStripeCheckout, cancelSubscription } = useSubscription();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<string | null>(null);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP', { locale });
  };

  const handleUpgradeSubscription = async (planType: string) => {
    if (!user) {
      // Redirect to register if not logged in
      window.location.href = '/register';
      return;
    }

    setIsLoadingCheckout(planType);
    
    try {
      let priceId;
      
      switch (planType) {
        case 'basic':
          priceId = 'price_basic';
          break;
        case 'pro':
          priceId = 'price_pro';
          break;
        case 'enterprise':
          priceId = 'price_enterprise';
          break;
        default:
          throw new Error('Invalid plan type');
      }
      
      const checkoutUrl = await initializeStripeCheckout(priceId);
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: t('subscription.upgradeError'),
        description: t('subscription.upgradeFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCheckout(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;
    
    const confirmed = window.confirm(t('subscription.confirmCancel'));
    if (!confirmed) return;
    
    setIsCancellingSubscription(true);
    
    try {
      const success = await cancelSubscription();
      
      if (success) {
        toast({
          title: t('subscription.cancelSuccess'),
          description: t('subscription.cancelMessage'),
        });
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: t('subscription.cancelError'),
        description: t('subscription.cancelFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-4">{t('subscription.manage')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('subscription.currentPlanDescription')}
            </p>
          </div>
        </div>

        {/* Current Plan */}
        <div className="mb-8">
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('subscription.currentPlan')}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {subscription?.planType 
                      ? t(`subscription.${subscription.planType}`)
                      : t('subscription.free')}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {subscription?.planType === 'basic' 
                      ? t('plans.basic.price')
                      : subscription?.planType === 'pro'
                      ? t('plans.pro.price')
                      : subscription?.planType === 'enterprise'
                      ? t('plans.enterprise.price')
                      : '€0'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subscription?.planType !== 'free' ? t('subscription.monthly') : ''}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.generationsRemaining')}</p>
                  <p className="text-lg font-semibold">{subscription?.generationsRemaining || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('dashboard.renewalDate')}</p>
                  <p className="text-lg font-semibold">{formatDate(subscription?.subscriptionRenewalDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('subscription.features')}</p>
                  <p className="text-lg font-semibold">
                    {subscription?.planType === 'basic' ? '1' :
                     subscription?.planType === 'pro' ? '5' :
                     subscription?.planType === 'enterprise' ? '20' : '0'} {t('generate.info.courses')}
                  </p>
                </div>
              </div>
            </CardContent>
            {subscription?.planType !== 'free' && subscription?.stripeSubscriptionId && (
              <CardFooter>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={isCancellingSubscription}
                >
                  {isCancellingSubscription ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('subscription.cancel')
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">{t('subscription.availablePlans')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <Card className={`relative ${subscription?.planType === 'basic' ? 'border-primary' : ''}`}>
              {subscription?.planType === 'basic' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.currentPlan')}
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('plans.basic.name')}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t('plans.basic.price')}</span>
                  <span className="text-muted-foreground">{t('subscription.monthly')}</span>
                </div>
                <CardDescription className="mt-2">
                  {t('plans.basic.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">1 {t('generate.info.courses')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.fullGeneration')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.downloads')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.support')}</span>
                </div>
              </CardContent>
              <CardFooter>
                {subscription?.planType === 'basic' ? (
                  <Button disabled variant="outline" className="w-full">
                    {t('subscription.currentPlan')}
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => handleUpgradeSubscription('basic')}
                    disabled={isLoadingCheckout === 'basic'}
                  >
                    {isLoadingCheckout === 'basic' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      user ? t('subscription.upgrade') : t('auth.signUp')
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className={`relative ${subscription?.planType === 'pro' ? 'border-primary' : 'border-primary'}`}>
              {subscription?.planType === 'pro' ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.currentPlan')}
                  </span>
                </div>
              ) : (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.popular')}
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  {t('plans.pro.name')}
                  <Star className="h-5 w-5 text-yellow-500" />
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t('plans.pro.price')}</span>
                  <span className="text-muted-foreground">{t('subscription.monthly')}</span>
                </div>
                <CardDescription className="mt-2">
                  {t('plans.pro.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">5 {t('generate.info.courses')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.fullGeneration')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.downloads')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.prioritySupport')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.extendedDownloads')}</span>
                </div>
              </CardContent>
              <CardFooter>
                {subscription?.planType === 'pro' ? (
                  <Button disabled variant="outline" className="w-full">
                    {t('subscription.currentPlan')}
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => handleUpgradeSubscription('pro')}
                    disabled={isLoadingCheckout === 'pro'}
                  >
                    {isLoadingCheckout === 'pro' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      user ? t('subscription.upgrade') : t('auth.signUp')
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Enterprise Plan */}
            <Card className={`relative ${subscription?.planType === 'enterprise' ? 'border-primary' : ''}`}>
              {subscription?.planType === 'enterprise' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.currentPlan')}
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{t('plans.enterprise.name')}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t('plans.enterprise.price')}</span>
                  <span className="text-muted-foreground">{t('subscription.monthly')}</span>
                </div>
                <CardDescription className="mt-2">
                  {t('plans.enterprise.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">20 {t('generate.info.courses')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.fullGeneration')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.downloads')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.dedicatedSupport')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.extendedDownloads')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('subscription.features.priorityProcessing')}</span>
                </div>
              </CardContent>
              <CardFooter>
                {subscription?.planType === 'enterprise' ? (
                  <Button disabled variant="outline" className="w-full">
                    {t('subscription.currentPlan')}
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => handleUpgradeSubscription('enterprise')}
                    disabled={isLoadingCheckout === 'enterprise'}
                  >
                    {isLoadingCheckout === 'enterprise' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      user ? t('subscription.upgrade') : t('auth.signUp')
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Billing Information */}
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertTitle>{t('subscription.billingInfo')}</AlertTitle>
          <AlertDescription>
            {t('subscription.billingManagedByStripe')}
          </AlertDescription>
        </Alert>
      </main>
      
      <SiteFooter />
    </div>
  );
}