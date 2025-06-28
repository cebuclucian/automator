import { useTranslation } from '@/context/language-context';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookCheck, Target, Zap, Users, Globe, CheckCircle } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function AboutPage() {
  const t = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold tracking-tight">{t('about.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">{t('about.mission.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">
                {t('about.mission.description1')}
              </p>
              <p className="text-muted-foreground">
                {t('about.mission.description2')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 7-Step Methodology */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">{t('about.methodology.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.methodology.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step1')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step1Description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step2')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step2Description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step3')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step3Description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step4')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step4Description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">5</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step5')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step5Description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">6</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step6')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step6Description')}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">7</span>
                  </div>
                  <CardTitle className="text-lg">{t('progress.step7')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('about.step7Description')}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">{t('about.whyChoose.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('about.whyChoose.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('about.advantage1.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.advantage1.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('about.advantage2.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.advantage2.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('about.advantage3.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.advantage3.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('about.advantage4.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.advantage4.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('about.advantage5.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.advantage5.description')}
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{t('about.advantage6.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('about.advantage6.description')}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">{t('about.cta.title')}</h2>
              <p className="text-primary-foreground/80 mb-6 max-w-2xl mx-auto">
                {t('about.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/register">
                    {t('about.cta.startNow')}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/preturi">
                    {t('about.cta.viewPricing')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}