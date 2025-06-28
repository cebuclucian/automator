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
  XCircle,
  Zap,
  FileText,
  Presentation,
  Users,
  Activity,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function GenerationProgressPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const t = useTranslation();
  const { fetchJob, currentJob, cancelJob, retryJob } = useJob();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  useEffect(() => {
    if (sessionId) {
      // Initial fetch
      fetchJob(sessionId);
      
      // Set up interval for jobs in progress
      const interval = setInterval(() => {
        fetchJob(sessionId);
      }, 3000); // Poll every 3 seconds for real-time updates
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [sessionId]);

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
          fetchJob(sessionId!);
        }, 3000);
        
        setRefreshInterval(interval);
      } else {
        setRefreshInterval(null);
        
        // Redirect to materials page when completed
        if (currentJob.status === 'completed') {
          setTimeout(() => {
            navigate(`/materials/${currentJob.id}`);
          }, 2000);
        }
      }
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [currentJob?.status]);

  const handleCancel = async () => {
    if (!sessionId) return;
    
    const confirmed = window.confirm(t('progress.confirmCancel'));
    if (!confirmed) return;
    
    const success = await cancelJob(sessionId);
    
    if (success) {
      toast({
        title: t('progress.cancelled'),
        description: t('progress.jobCancelled'),
      });
      navigate('/dashboard');
    } else {
      toast({
        title: t('common.error'),
        description: t('progress.cancelFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleRetry = async () => {
    if (!sessionId) return;
    
    const updatedJob = await retryJob(sessionId);
    
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

  // Get step icon
  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return <FileText className="h-5 w-5" />;
      case 2:
        return <Presentation className="h-5 w-5" />;
      case 3:
        return <Users className="h-5 w-5" />;
      case 4:
        return <BookOpen className="h-5 w-5" />;
      case 5:
        return <Activity className="h-5 w-5" />;
      case 6:
        return <BarChart3 className="h-5 w-5" />;
      case 7:
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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
              {t('common.loading')}
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
      
      <main className="flex-1 container py-8 max-w-4xl">
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
        
        {/* Main Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {t('progress.generatingCourse')}
            </CardTitle>
            <CardDescription>
              {t('progress.created')}: {formatDate(currentJob.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {t('progress.title')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {currentJob.progressPercent}%
                </span>
              </div>
              <Progress value={currentJob.progressPercent} className="h-3" />
              
              {currentJob.currentStep && currentJob.totalSteps && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {t('progress.step')} {currentJob.currentStep}/{currentJob.totalSteps}
                  </span>
                  <span>
                    {currentJob.stepName}
                  </span>
                </div>
              )}
            </div>
            
            {/* Current Status */}
            {currentJob.statusMessage && (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-start gap-3">
                  {currentJob.status === 'processing' ? (
                    <RefreshCw className="h-5 w-5 text-primary animate-spin mt-0.5" />
                  ) : currentJob.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {currentJob.statusMessage}
                    </p>
                    {currentJob.status === 'processing' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('generate.info.timeEstimate')}
                      </p>
                    )}
                  </div>
                </div>
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
        
        {/* 7-Step Process Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Procesul de generare în 7 pași</CardTitle>
            <CardDescription>
              Urmărește progresul pentru fiecare pas al generării
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => {
                const isCompleted = currentJob.currentStep ? stepNum < currentJob.currentStep : false;
                const isCurrent = currentJob.currentStep === stepNum;
                const isPending = currentJob.currentStep ? stepNum > currentJob.currentStep : true;
                
                return (
                  <div key={stepNum} className={`flex items-center gap-4 p-3 rounded-lg border ${
                    isCurrent ? 'bg-primary/5 border-primary' : 
                    isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
                    'bg-muted/30'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCurrent ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isCurrent ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{stepNum}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      {getStepIcon(stepNum)}
                      <span className={`font-medium ${
                        isCurrent ? 'text-primary' :
                        isCompleted ? 'text-green-700 dark:text-green-300' :
                        'text-muted-foreground'
                      }`}>
                        {t(`progress.step${stepNum}`)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {isCompleted ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Completat
                        </Badge>
                      ) : isCurrent ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          În progres
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          În așteptare
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Course Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalii curs</CardTitle>
            <CardDescription>
              Configurația cursului care se generează
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="text-muted-foreground">{t('generate.form.language')}</div>
              <div className="font-medium">{jobMeta?.language === 'ro' ? 'Română' : 'English'}</div>
              
              <div className="text-muted-foreground">{t('generate.form.level')}</div>
              <div className="font-medium">{t(`generate.form.${jobMeta?.level || 'intermediate'}`)}</div>
              
              <div className="text-muted-foreground">{t('generate.form.audience')}</div>
              <div className="font-medium">{t(`generate.form.${jobMeta?.audience || 'professionals'}`)}</div>
              
              <div className="text-muted-foreground">{t('generate.form.duration')}</div>
              <div className="font-medium">{jobMeta?.duration || '2h'}</div>
              
              <div className="text-muted-foreground">{t('generate.form.tone')}</div>
              <div className="font-medium">{t(`generate.form.${jobMeta?.tone || 'professional'}`)}</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Time estimates for pending/processing jobs */}
        {(currentJob.status === 'pending' || currentJob.status === 'processing') && (
          <Alert className="mt-6">
            <Clock className="h-4 w-4" />
            <AlertTitle>{t('progress.timeEstimate')}</AlertTitle>
            <AlertDescription>
              {t('generate.info.timeEstimate')}
              <br />
              {t('generate.info.notification')}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Success message for completed jobs */}
        {currentJob.status === 'completed' && (
          <Alert className="mt-6 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              {t('progress.completed')}!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Cursul tău a fost generat cu succes. Vei fi redirecționat către pagina de materiale în câteva secunde.
            </AlertDescription>
          </Alert>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}