import { useState } from 'react';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useStripe } from '@/hooks/use-stripe';
import { useSubscription } from '@/hooks/use-subscription';
import { stripeProducts } from '@/stripe-config';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Star, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function PricingPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const { createCheckoutSession, isLoading } = useStripe();
  const { subscription } = useSubscription();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleUpgradeSubscription = async (priceId: string) => {
    if (!user) {
      // Redirect to register if not logged in
      window.location.href = '/register';
      return;
    }

    setLoadingPriceId(priceId);
    
    try {
      await createCheckoutSession({
        priceId,
        mode: 'subscription',
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  const isCurrentPlan = (priceId: string) => {
    return subscription?.price_id === priceId && subscription?.subscription_status === 'active';
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
          {stripeProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className={`relative ${
                isCurrentPlan(product.priceId) ? 'border-primary' : 
                product.name === 'Pro' ? 'border-primary' : ''
              }`}
            >
              {isCurrentPlan(product.priceId) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.currentPlan')}
                  </span>
                </div>
              )}
              
              {!isCurrentPlan(product.priceId) && product.name === 'Pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.popular')}
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center gap-2">
                  {product.name}
                  {product.name === 'Pro' && <Star className="h-5 w-5 text-yellow-500" />}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">€{product.price}</span>
                  <span className="text-muted-foreground">{t('subscription.monthly')}</span>
                </div>
                <CardDescription className="mt-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    {product.name === 'Basic' ? '1' : 
                     product.name === 'Pro' ? '5' : '20'} {t('generate.info.courses')}
                  </span>
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
                  <span className="text-sm">
                    {product.name === 'Basic' ? t('subscription.features.support') :
                     product.name === 'Pro' ? t('subscription.features.prioritySupport') :
                     t('subscription.features.dedicatedSupport')}
                  </span>
                </div>
                {product.name !== 'Basic' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('subscription.features.extendedDownloads')}</span>
                  </div>
                )}
                {product.name === 'Enterprise' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('subscription.features.priorityProcessing')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t('pricing.feature.allLanguages')}</span>
                </div>
              </CardContent>
              
              <CardFooter>
                {isCurrentPlan(product.priceId) ? (
                  <Button disabled variant="outline" className="w-full">
                    {t('subscription.currentPlan')}
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => handleUpgradeSubscription(product.priceId)}
                    disabled={isLoading || loadingPriceId === product.priceId}
                  >
                    {loadingPriceId === product.priceId ? (
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
          ))}
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