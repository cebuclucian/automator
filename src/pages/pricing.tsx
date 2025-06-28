import { useState } from 'react';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Star, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const { subscription, initializeStripeCheckout } = useSubscription();
  const { toast } = useToast();
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-4">{t('pricing.title')}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('pricing.feature.allLanguages')}</span>
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
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('pricing.feature.allLanguages')}</span>
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
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('pricing.feature.allLanguages')}</span>
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

        {/* FAQ Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">{t('pricing.faq.title')}</h2>
            <p className="text-muted-foreground">
              {t('pricing.faq.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pricing.faq.q1')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('pricing.faq.a1')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pricing.faq.q2')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('pricing.faq.a2')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pricing.faq.q3')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('pricing.faq.a3')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('pricing.faq.q4')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('pricing.faq.a4')}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">{t('pricing.contact.title')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('pricing.contact.description')}
              </p>
              <Button asChild>
                <Link to="/contact">
                  {t('pricing.contact.button')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}