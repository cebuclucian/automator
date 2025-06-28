import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCheck, Star, Zap, Layers, ArrowRight, CheckCircle, Clock, Users, Globe } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function HomePage() {
  const t = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium">
                ✨ {t('landing.aiPowered')}
              </div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl">
                {t('landing.title')}
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                {t('landing.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to={user ? "/genereaza-curs" : "/register"}>
                    {t('landing.getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link to="/despre">
                    {t('landing.learnMore')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('landing.howItWorks')}
              </h2>
              <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                {t('landing.howItWorksSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <CardTitle>{t('landing.step1Title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('landing.step1Description')}
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{t('landing.step2Title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('landing.step2Description')}
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <BookCheck className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{t('landing.step3Title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {t('landing.step3Description')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('landing.benefits')}
              </h2>
              <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                {t('landing.benefitsSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <Clock className="h-12 w-12 text-primary" />
                <h3 className="font-semibold text-lg">{t('landing.benefit1Title')}</h3>
                <p className="text-muted-foreground text-sm">{t('landing.benefit1Description')}</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <Star className="h-12 w-12 text-primary" />
                <h3 className="font-semibold text-lg">{t('landing.benefit2Title')}</h3>
                <p className="text-muted-foreground text-sm">{t('landing.benefit2Description')}</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <Globe className="h-12 w-12 text-primary" />
                <h3 className="font-semibold text-lg">{t('landing.benefit3Title')}</h3>
                <p className="text-muted-foreground text-sm">{t('landing.benefit3Description')}</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <Users className="h-12 w-12 text-primary" />
                <h3 className="font-semibold text-lg">{t('landing.benefit4Title')}</h3>
                <p className="text-muted-foreground text-sm">{t('landing.benefit4Description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('landing.pricing')}
              </h2>
              <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                {t('landing.pricingSubtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Basic Plan */}
              <Card className="relative">
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
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative border-primary">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {t('subscription.popular')}
                  </span>
                </div>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{t('plans.pro.name')}</CardTitle>
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
                    <span className="text-sm">{t('subscription.features.prioritySupport')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative">
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
                    <span className="text-sm">{t('subscription.features.dedicatedSupport')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('subscription.features.priorityProcessing')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-8">
              <Button asChild size="lg">
                <Link to="/preturi">
                  {t('landing.viewAllPlans')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {t('landing.ctaTitle')}
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
                {t('landing.ctaSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                  <Link to={user ? "/genereaza-curs" : "/register"}>
                    {t('landing.startNow')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/contact">
                    {t('landing.contact')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}