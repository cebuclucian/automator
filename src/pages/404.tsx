import { useTranslation } from '@/context/language-context';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function NotFoundPage() {
  const t = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-2xl mx-auto">
        <div className="text-center">
          <Card>
            <CardHeader>
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-bold text-muted-foreground">404</span>
              </div>
              <CardTitle className="text-3xl">{t('404.title')}</CardTitle>
              <CardDescription className="text-lg">
                {t('404.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('404.suggestion')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link to="/">
                    <Home className="mr-2 h-4 w-4" />
                    {t('404.goHome')}
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link to="/contact">
                    <Search className="mr-2 h-4 w-4" />
                    {t('404.contact')}
                  </Link>
                </Button>
              </div>
              
              <div className="pt-4">
                <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('404.goBack')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}