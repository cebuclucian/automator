import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Download, File, FileDown, FileText, FileType, FileType as FileTypography, RefreshCw, Timer as Time, Timer } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Database } from '@/types/supabase';

// Material type from database
type Material = Database['public']['Tables']['materials']['Row'];

export default function MaterialsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const t = useTranslation();
  const { fetchJob, fetchMaterials, currentJob, materials, loadingMaterials } = useJob();
  const { language } = useLanguage();
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  useEffect(() => {
    if (jobId) {
      fetchJob(jobId);
      fetchMaterials(jobId);
    }
  }, [jobId]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP', { locale });
  };

  // Helper to determine file icon based on format
  const getFileIcon = (format: string) => {
    switch (format) {
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'pptx':
        return <FileTypography className="h-5 w-5 text-orange-600" />;
      case 'pdf':
        return <File className="h-5 w-5 text-red-600" />;
      default:
        return <FileType className="h-5 w-5 text-gray-600" />;
    }
  };

  // Download expiry check
  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const hoursDiff = (expiry.getTime() - now.getTime()) / (1000 * 3600);
    
    return hoursDiff <= 24;
  };

  if (!currentJob) {
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
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('materials.title')}</h1>
              <p className="text-muted-foreground mt-2">
                {courseName}
              </p>
            </div>
            
            {currentJob.downloadUrl && (
              <Button asChild>
                <a href={currentJob.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="mr-2 h-4 w-4" />
                  {t('materials.downloadAll')}
                </a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Download expiry warning */}
        {currentJob.downloadExpiry && (
          <Alert variant={isExpiringSoon(currentJob.downloadExpiry) ? "destructive" : "default"} className="mb-6">
            <Timer className="h-4 w-4" />
            <AlertTitle>
              {isExpiringSoon(currentJob.downloadExpiry) 
                ? t('materials.expiryWarning') 
                : t('materials.expiryNote')}
            </AlertTitle>
            <AlertDescription>
              {t('materials.expiryDate')}: {formatDate(currentJob.downloadExpiry)}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Materials list */}
        {loadingMaterials ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((material) => (
              <Card key={material.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(material.format)}
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                    </div>
                    <div className="text-xs uppercase font-medium text-muted-foreground">
                      {material.format}
                    </div>
                  </div>
                  <CardDescription>
                    {t(`materials.types.${material.type}`)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.type === 'agenda' 
                      ? t('materials.courseAgenda') 
                      : material.type === 'slides' 
                      ? t('materials.presentationSlides')
                      : t('materials.courseMaterial')}
                  </p>
                </CardContent>
                <CardFooter>
                  {material.downloadUrl ? (
                    <Button asChild variant="secondary" size="sm" className="w-full">
                      <a href={material.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        {t('materials.download')}
                      </a>
                    </Button>
                  ) : (
                    <Button disabled variant="outline" size="sm" className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {t('materials.preparing')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 px-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('materials.noMaterials')}</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {t('materials.noMaterialsDescription')}
              </p>
              <Button asChild>
                <Link to={`/jobs/${jobId}`}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('materials.checkProgress')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
}