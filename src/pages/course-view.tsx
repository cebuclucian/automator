import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useJob } from '@/context/job-context';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  FileDown, 
  FileText, 
  RefreshCw, 
  Calendar,
  Clock,
  Users,
  Globe,
  Volume2,
  BarChart3
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function CourseViewPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslation();
  const { fetchJob, fetchMaterials, currentJob, materials, loadingMaterials } = useJob();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  useEffect(() => {
    if (id) {
      fetchJob(id);
      fetchMaterials(id);
    }
  }, [id]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP', { locale });
  };

  // Get status badge
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

  if (!currentJob) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        
        <main className="flex-1 container py-8 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/cursuri">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
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
  const courseName = jobMeta?.subject || t('materials.untitledCourse');

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/cursuri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{courseName}</h1>
              <p className="text-muted-foreground mt-2">
                {t('progress.created')}: {formatDate(currentJob.createdAt)}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusBadge(currentJob.status)}
            </div>
          </div>
        </div>
        
        {/* Course Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('materials.courseAgenda')}
            </CardTitle>
            <CardDescription>
              {t('generate.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('generate.form.language')}</p>
                  <p className="text-sm text-muted-foreground">
                    {jobMeta?.language === 'ro' ? 'Română' : 'English'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('generate.form.level')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`generate.form.${jobMeta?.level || 'intermediate'}`)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('generate.form.audience')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`generate.form.${jobMeta?.audience || 'professionals'}`)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('generate.form.duration')}</p>
                  <p className="text-sm text-muted-foreground">
                    {jobMeta?.duration || '2h'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('generate.form.tone')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`generate.form.${jobMeta?.tone || 'professional'}`)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('progress.status')}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentJob.progressPercent}% {t('progress.completed').toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            {currentJob.status === 'completed' && (
              <>
                <Button asChild>
                  <Link to={`/materials/${currentJob.id}`}>
                    <FileDown className="mr-2 h-4 w-4" />
                    {t('materials.downloadAll')}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/curs/${currentJob.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </Link>
                </Button>
              </>
            )}
            
            {currentJob.status === 'processing' && (
              <Button asChild variant="secondary">
                <Link to={`/jobs/${currentJob.id}`}>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('progress.viewProgress')}
                </Link>
              </Button>
            )}
            
            {currentJob.status === 'failed' && (
              <Button asChild variant="destructive">
                <Link to={`/jobs/${currentJob.id}`}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('progress.retry')}
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Materials Preview */}
        {currentJob.status === 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('materials.title')}</CardTitle>
              <CardDescription>
                {t('materials.expiryNote')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMaterials ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-3">
                  {materials.slice(0, 3).map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{material.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {t(`materials.types.${material.type}`)} • {material.format.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      {material.downloadUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={material.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {materials.length > 3 && (
                    <div className="text-center pt-3">
                      <Button asChild variant="ghost">
                        <Link to={`/materials/${currentJob.id}`}>
                          {t('dashboard.viewAll')} ({materials.length - 3} {t('common.more')})
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t('materials.noMaterials')}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}