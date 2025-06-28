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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  FileDown, 
  FileText, 
  Package, 
  Timer,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function DownloadCenterPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const t = useTranslation();
  const { fetchJob, fetchMaterials, currentJob, materials, loadingMaterials } = useJob();
  const { language } = useLanguage();
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  useEffect(() => {
    if (sessionId) {
      fetchJob(sessionId);
      fetchMaterials(sessionId);
    }
  }, [sessionId]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP', { locale });
  };

  // Check if downloads are expiring soon
  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const hoursDiff = (expiry.getTime() - now.getTime()) / (1000 * 3600);
    
    return hoursDiff <= 24;
  };

  // Helper to determine file icon based on format
  const getFileIcon = (format: string) => {
    switch (format) {
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'pptx':
        return <FileText className="h-5 w-5 text-orange-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
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
  const courseName = jobMeta?.subject || 'Curs fără titlu';

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
              <h1 className="text-3xl font-bold tracking-tight">Centru de descărcare</h1>
              <p className="text-muted-foreground mt-2">
                {courseName}
              </p>
            </div>
            
            {currentJob.downloadUrl && (
              <Button asChild size="lg">
                <a href={currentJob.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Package className="mr-2 h-5 w-5" />
                  Descarcă tot (ZIP)
                </a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Download Status */}
        {currentJob.status === 'completed' && currentJob.downloadExpiry && (
          <Alert 
            variant={isExpiringSoon(currentJob.downloadExpiry) ? "destructive" : "default"} 
            className="mb-6"
          >
            {isExpiringSoon(currentJob.downloadExpiry) ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Timer className="h-4 w-4" />
            )}
            <AlertTitle>
              {isExpiringSoon(currentJob.downloadExpiry) 
                ? 'Atenție! Link-urile expiră în curând' 
                : 'Informații despre descărcare'}
            </AlertTitle>
            <AlertDescription>
              Link-urile de descărcare expiră pe: {formatDate(currentJob.downloadExpiry)}
              <br />
              {isExpiringSoon(currentJob.downloadExpiry) 
                ? 'Te rugăm să descarci materialele cât mai curând posibil.'
                : 'Ai timp suficient să descarci toate materialele.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Course Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Curs generat cu succes
            </CardTitle>
            <CardDescription>
              Toate materialele sunt gata pentru descărcare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Limbă</p>
                <p className="font-semibold">{jobMeta?.language === 'ro' ? 'Română' : 'English'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nivel</p>
                <p className="font-semibold capitalize">{jobMeta?.level || 'Intermediar'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durată</p>
                <p className="font-semibold">{jobMeta?.duration || '2h'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Materiale</p>
                <p className="font-semibold">{materials.length} fișiere</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Individual Materials */}
        {loadingMaterials ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(material.format)}
                        <CardTitle className="text-lg">{material.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Pasul {material.stepNumber}
                      </Badge>
                    </div>
                    <CardDescription>
                      {t(`materials.types.${material.type}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Format:</span>
                        <span className="font-medium uppercase">{material.format}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Creat:</span>
                        <span className="font-medium">{formatDate(material.createdAt)}</span>
                      </div>
                      {material.downloadExpiry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Expiră:</span>
                          <span className={`font-medium ${
                            isExpiringSoon(material.downloadExpiry) 
                              ? 'text-red-600' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatDate(material.downloadExpiry)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {material.downloadUrl ? (
                      <Button asChild className="w-full">
                        <a href={material.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Descarcă
                        </a>
                      </Button>
                    ) : (
                      <Button disabled variant="outline" className="w-full">
                        <FileDown className="mr-2 h-4 w-4" />
                        Se pregătește...
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
              <h3 className="text-lg font-medium mb-2">Nu există materiale disponibile</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Materialele se generează încă sau a apărut o problemă.
              </p>
              <Button asChild>
                <Link to={`/jobs/${sessionId}`}>
                  Verifică progresul
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ajutor și suport</CardTitle>
            <CardDescription>
              Informații utile despre descărcarea materialelor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Cum să descarc materialele?</h4>
              <p className="text-sm text-muted-foreground">
                Poți descărca fiecare material individual sau toate materialele într-un singur fișier ZIP folosind butonul "Descarcă tot".
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Cât timp sunt disponibile link-urile?</h4>
              <p className="text-sm text-muted-foreground">
                Link-urile de descărcare sunt valabile 72 de ore de la finalizarea generării. După expirare, va trebui să regenerezi cursul.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Ce formate sunt disponibile?</h4>
              <p className="text-sm text-muted-foreground">
                Materialele sunt disponibile în format DOCX pentru documente text și PPTX pentru prezentări. Toate formatele sunt editabile.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link to="/contact">
                Contactează suportul
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <SiteFooter />
    </div>
  );
}