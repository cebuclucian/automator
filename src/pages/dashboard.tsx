import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useJob } from '@/context/job-context';
import { useSubscription } from '@/hooks/use-subscription';
import { formatDistanceToNow, format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  BookCheck, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  FileText, 
  Plus, 
  RefreshCw, 
  XCircle 
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function DashboardPage() {
  const t = useTranslation();
  const { user } = useAuth();
  const { jobs, loadingJobs, fetchJobs } = useJob();
  const { subscription, generationsRemaining, loading: loadingSubscription } = useSubscription();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  // Check for checkout success
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast({
        title: t('subscription.checkoutSuccess'),
        description: t('subscription.checkoutSuccessMessage'),
      });
    } else if (checkoutStatus === 'cancelled') {
      toast({
        title: t('subscription.checkoutCancelled'),
        description: t('subscription.checkoutCancelledMessage'),
        variant: 'destructive',
      });
    }
  }, [searchParams]);

  // Recent jobs - show only the 5 most recent
  const recentJobs = jobs.slice(0, 5);

  // Format renewal date
  const formatRenewalDate = () => {
    if (!subscription?.subscriptionRenewalDate) return '—';
    return format(new Date(subscription.subscriptionRenewalDate), 'PPP', { locale });
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">{t('progress.completed')}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{t('progress.pending')}</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">{t('progress.processing')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('progress.failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date relative to now
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* Welcome section */}
          <section>
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {t('dashboard.welcome')}, {user?.email?.split('@')[0]}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {t('dashboard.title')}
                </p>
              </div>
              <Button asChild className="w-full lg:w-auto">
                <Link to="/genereaza-curs">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('generate.title')}
                </Link>
              </Button>
            </div>
          </section>
          
          <Separator />
          
          {/* Subscription info */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Current plan */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">{t('subscription.currentPlan')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <div className="flex items-center gap-2">
                    <BookCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-xl sm:text-2xl font-bold">
                      {subscription?.planType 
                        ? t(`subscription.${subscription.planType}`)
                        : t('subscription.free')}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/settings">
                    {t('subscription.manage')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Generations remaining */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">{t('dashboard.generationsRemaining')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-xl sm:text-2xl font-bold">
                      {generationsRemaining}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" disabled={generationsRemaining <= 0} className="w-full">
                  <Link to="/genereaza-curs">
                    {t('dashboard.startGenerating')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Renewal date */}
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base sm:text-lg">{t('dashboard.renewalDate')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSubscription ? (
                  <Skeleton className="h-7 w-28" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span className="text-lg sm:text-xl font-bold">
                      {formatRenewalDate()}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground text-xs w-full">
                  <Link to="/settings">
                    {subscription?.planType !== 'free' 
                      ? t('subscription.renewsAutomatically')
                      : t('subscription.upgrade')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </section>
          
          {/* Recent generations */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">{t('dashboard.recentJobs')}</h2>
              {jobs.length > 5 && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/cursuri">
                    {t('dashboard.viewAll')}
                  </Link>
                </Button>
              )}
            </div>
            
            {loadingJobs ? (
              <div className="space-y-3">
                <Skeleton className="h-20 sm:h-24 w-full" />
                <Skeleton className="h-20 sm:h-24 w-full" />
                <Skeleton className="h-20 sm:h-24 w-full" />
              </div>
            ) : recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-0">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              {getStatusBadge(job.status)}
                              <span className="font-medium text-sm sm:text-base">
                                {job.metadata?.subject || 'Untitled Course'}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeDate(job.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {job.status === 'completed' && (
                              <Button asChild size="sm" className="w-full sm:w-auto">
                                <Link to={`/materials/${job.id}`}>
                                  <FileDown className="mr-2 h-4 w-4" />
                                  {t('progress.viewMaterials')}
                                </Link>
                              </Button>
                            )}
                            {job.status === 'processing' && (
                              <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                                <Link to={`/jobs/${job.id}`}>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  {t('progress.viewProgress')}
                                </Link>
                              </Button>
                            )}
                            {job.status === 'pending' && (
                              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                                <Link to={`/jobs/${job.id}`}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  {t('progress.viewStatus')}
                                </Link>
                              </Button>
                            )}
                            {job.status === 'failed' && (
                              <Button asChild size="sm" variant="destructive" className="w-full sm:w-auto">
                                <Link to={`/jobs/${job.id}`}>
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  {t('progress.details')}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-10 px-4 sm:px-6">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">{t('dashboard.noJobs')}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                    {t('dashboard.emptyState')}
                  </p>
                  <Button asChild className="w-full sm:w-auto">
                    <Link to="/genereaza-curs">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('dashboard.startGenerating')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}