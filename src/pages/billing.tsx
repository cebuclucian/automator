import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Download, FileText, Calendar, DollarSign } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function BillingPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const { subscription, loading: loadingSubscription } = useSubscription();
  const { language } = useLanguage();
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP', { locale });
  };

  // Mock billing history data
  const billingHistory = [
    {
      id: '1',
      date: '2024-01-15',
      amount: '€39.00',
      status: 'paid',
      description: 'Pro Plan - Ianuarie 2024',
      invoiceUrl: '#'
    },
    {
      id: '2',
      date: '2023-12-15',
      amount: '€39.00',
      status: 'paid',
      description: 'Pro Plan - Decembrie 2023',
      invoiceUrl: '#'
    },
    {
      id: '3',
      date: '2023-11-15',
      amount: '€39.00',
      status: 'paid',
      description: 'Pro Plan - Noiembrie 2023',
      invoiceUrl: '#'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">{t('subscription.billingInfo')}</h1>
            <p className="text-muted-foreground text-lg">
              Gestionează facturarea și istoricul plăților tale
            </p>
          </div>
        </div>

        {/* Current Subscription */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('subscription.currentPlan')}
              </CardTitle>
              <CardDescription>
                Detaliile abonamentului tău actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscription ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Plan actual</p>
                    <p className="text-lg font-semibold">
                      {subscription?.planType 
                        ? t(`subscription.${subscription.planType}`)
                        : t('subscription.free')}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Preț lunar</p>
                    <p className="text-lg font-semibold">
                      {subscription?.planType === 'basic' 
                        ? t('plans.basic.price')
                        : subscription?.planType === 'pro'
                        ? t('plans.pro.price')
                        : subscription?.planType === 'enterprise'
                        ? t('plans.enterprise.price')
                        : '€0'}
                      {subscription?.planType !== 'free' && (
                        <span className="text-sm text-muted-foreground ml-1">
                          {t('subscription.monthly')}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('dashboard.renewalDate')}</p>
                    <p className="text-lg font-semibold">
                      {formatDate(subscription?.subscriptionRenewalDate)}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-green-600">
                      {subscription?.planType !== 'free' ? 'Activ' : 'Gratuit'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodă de plată
              </CardTitle>
              <CardDescription>
                Metoda de plată asociată contului tău
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription?.planType !== 'free' ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">****</span>
                    </div>
                    <div>
                      <p className="font-medium">**** **** **** 4242</p>
                      <p className="text-sm text-muted-foreground">Expiră 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Actualizează
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nu ai o metodă de plată configurată
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/abonament">
                      Actualizează planul
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Istoric facturare
              </CardTitle>
              <CardDescription>
                Istoricul facturilor și plăților tale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription?.planType !== 'free' ? (
                <div className="space-y-4">
                  {billingHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.description}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(invoice.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{invoice.amount}</p>
                          <p className="text-sm text-green-600">Plătit</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nu ai istoric de facturare
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Facturile vor apărea aici după ce actualizezi planul
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stripe Information */}
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Securitate și confidențialitate</AlertTitle>
          <AlertDescription>
            Toate plățile sunt procesate în siguranță prin Stripe. Nu stocăm informațiile tale de plată pe serverele noastre.
          </AlertDescription>
        </Alert>
      </main>
      
      <SiteFooter />
    </div>
  );
}