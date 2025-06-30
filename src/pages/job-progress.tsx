import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useJob } from '@/context/job-context';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  FileDown, 
  RefreshCw, 
  XCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function JobProgressPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const t = useTranslation();
  const { fetchJob, currentJob, cancelJob, retryJob } = useJob();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  useEffect(() => {
    if (jobId) {
      // Initial fetch
      fetchJob(jobId);
      
      // Set up interval for jobs in progress
      const interval = setInterval(() => {
        fetchJob(jobId);
      }, 5000); // Poll every 5 seconds
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [jobId]);

  // Update polling strategy based on job status
  useEffect(() => {
    if (currentJob) {
      // Clear existing interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      // Only set up polling for pending or processing jobs
      if (currentJob.status === 'pending' || currentJob.status === 'processing') {
        const interval = setInterval(() => {
          fetchJob(jobId!);
        }, 5000);
        
        setRefreshInterval(interval);
      } else {
        setRefreshInterval(null);
      }
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [currentJob?.status]);

  const handleCancel = async () => {
    if (!jobId) return;
    
    const confirmed = window.confirm(t('progress.confirmCancel'));
    if (!confirmed) return;
    
    const success = await cancelJob(jobId);
    
    if (success) {
      toast({
        title: t('progress.cancelled'),
        description: t('progress.jobCancelled'),
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('progress.cancelFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleRetry = async () => {
    if (!jobId) return;
    
    const updatedJob = await retryJob(jobId);
    
    if (updatedJob) {
      toast({
        title: t('progress.retrying'),
        description: t('progress.jobRetrying'),
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('progress.retryFailed'),
        variant: 'destructive',
      });
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP p', { locale });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t('progress.completed')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('progress.pending')}
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {t('progress.processing')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t('progress.failed')}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!currentJob) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        
        <main className="flex-1 container py-8 max-w-3xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold tracking-tight">{t('progress.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('progress.loading')}
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </main>
        
        <SiteFooter />
      </div>
    );
  }

  const jobMeta = currentJob.metadata as Record<string, any>;

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('progress.title')}</h1>
              <p className="text-muted-foreground mt-2">
                {jobMeta?.subject || t('progress.generatingCourse')}
              </p>
            </div>
            
            <div className="flex items-center">
              {getStatusBadge(currentJob.status)}
            </div>
          </div>
        </div>
        
        {/* Progress card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('progress.details')}</CardTitle>
            <CardDescription>
              {t('progress.created')}: {formatDate(currentJob.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentJob.progressPercent}%</span>
                {currentJob.currentStep && currentJob.totalSteps && (
                  <span>
                    {t('progress.step')} {currentJob.currentStep}/{currentJob.totalSteps}
                  </span>
                )}
              </div>
              <Progress value={currentJob.progressPercent} />
            </div>
            
            {/* Current status message */}
            {currentJob.statusMessage && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">
                  {currentJob.stepName && (
                    <span className="text-primary">{currentJob.stepName}: </span>
                  )}
                  {currentJob.statusMessage}
                </p>
              </div>
            )}
            
            {/* Error message for failed jobs */}
            {currentJob.status === 'failed' && currentJob.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('progress.error')}</AlertTitle>
                <AlertDescription>
                  {currentJob.error}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Job details */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">{t('generate.form.language')}</div>
                <div>{jobMeta?.language === 'ro' ? 'Română' : 'English'}</div>
                
                <div className="text-muted-foreground">{t('generate.form.context')}</div>
                <div>{t(`generate.form.${jobMeta?.context || 'corporate'}`)}</div>
                
                <div className="text-muted-foreground">{t('generate.form.level')}</div>
                <div>{t(`generate.form.${jobMeta?.level || 'intermediate'}`)}</div>
                
                <div className="text-muted-foreground">{t('generate.form.audience')}</div>
                <div>{t(`generate.form.${jobMeta?.audience || 'professionals'}`)}</div>
                
                <div className="text-muted-foreground">{t('generate.form.duration')}</div>
                <div>{jobMeta?.duration || '2h'}</div>
                
                <div className="text-muted-foreground">{t('generate.form.tone')}</div>
                <div>{t(`generate.form.${jobMeta?.tone || 'professional'}`)}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3 justify-between">
            <div>
              {currentJob.status === 'pending' || currentJob.status === 'processing' ? (
                <Button variant="destructive" size="sm" onClick={handleCancel}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('progress.cancel')}
                </Button>
              ) : currentJob.status === 'failed' ? (
                <Button variant="default" size="sm" onClick={handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('progress.retry')}
                </Button>
              ) : null}
            </div>
            
            {currentJob.status === 'completed' && (
              <Button asChild>
                <Link to={`/materials/${currentJob.id}`}>
                  <FileDown className="mr-2 h-4 w-4" />
                  {t('progress.viewMaterials')}
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Time estimates for pending/processing jobs */}
        {(currentJob.status === 'pending' || currentJob.status === 'processing') && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>{t('progress.timeEstimate')}</AlertTitle>
            <AlertDescription>
              {t('generate.info.timeEstimate')}
              <br />
              {t('generate.info.notification')}
            </AlertDescription>
          </Alert>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}