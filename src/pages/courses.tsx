import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useJob } from '@/context/job-context';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2, 
  Clock, 
  FileDown, 
  Plus, 
  RefreshCw, 
  Search, 
  XCircle,
  Filter
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function CoursesPage() {
  const t = useTranslation();
  const { jobs, loadingJobs, fetchJobs } = useJob();
  const { language } = useLanguage();
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  useEffect(() => {
    fetchJobs();
  }, []);

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale });
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

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('nav.courses')}</h1>
              <p className="text-muted-foreground mt-2">
                Gestionează și descarcă cursurile tale generate
              </p>
            </div>
            
            <Button asChild>
              <Link to="/genereaza-curs">
                <Plus className="mr-2 h-4 w-4" />
                {t('generate.title')}
              </Link>
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Caută cursuri..." 
                className="pl-10"
              />
            </div>
            
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                <SelectItem value="completed">{t('progress.completed')}</SelectItem>
                <SelectItem value="processing">{t('progress.processing')}</SelectItem>
                <SelectItem value="pending">{t('progress.pending')}</SelectItem>
                <SelectItem value="failed">{t('progress.failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Courses List */}
          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const jobMeta = job.metadata as Record<string, any>;
                
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {jobMeta?.subject || 'Curs fără titlu'}
                          </CardTitle>
                          <CardDescription>
                            {formatRelativeTime(job.createdAt)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Limbă:</span>
                          <div className="font-medium">
                            {jobMeta?.language === 'ro' ? 'Română' : 'English'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Nivel:</span>
                          <div className="font-medium capitalize">
                            {jobMeta?.level || 'Intermediar'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Durată:</span>
                          <div className="font-medium">
                            {jobMeta?.duration || '2h'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Public:</span>
                          <div className="font-medium capitalize">
                            {jobMeta?.audience || 'Profesioniști'}
                          </div>
                        </div>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progres</span>
                            <span>{job.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${job.progressPercent}%` }}
                            />
                          </div>
                          {job.stepName && (
                            <p className="text-xs text-muted-foreground">
                              {job.stepName}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex gap-2">
                      {job.status === 'completed' && (
                        <Button asChild className="flex-1">
                          <Link to={`/materials/${job.id}`}>
                            <FileDown className="mr-2 h-4 w-4" />
                            {t('materials.download')}
                          </Link>
                        </Button>
                      )}
                      
                      {job.status === 'processing' && (
                        <Button asChild variant="secondary" className="flex-1">
                          <Link to={`/jobs/${job.id}`}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('progress.viewProgress')}
                          </Link>
                        </Button>
                      )}
                      
                      {job.status === 'pending' && (
                        <Button asChild variant="outline" className="flex-1">
                          <Link to={`/jobs/${job.id}`}>
                            <Clock className="mr-2 h-4 w-4" />
                            {t('progress.viewStatus')}
                          </Link>
                        </Button>
                      )}
                      
                      {job.status === 'failed' && (
                        <Button asChild variant="destructive" className="flex-1">
                          <Link to={`/jobs/${job.id}`}>
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('progress.details')}
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nu ai cursuri generate încă</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                  Începe să creezi primul tău curs cu AI. Procesul durează doar 15-30 de minute.
                </p>
                <Button asChild>
                  <Link to="/genereaza-curs">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('generate.title')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
}