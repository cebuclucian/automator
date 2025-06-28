import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useJob } from '@/context/job-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Download, 
  Loader2,
  FileText,
  Presentation,
  Users,
  Activity,
  BarChart3,
  BookOpen
} from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { Database } from '@/types/supabase';

type Material = Database['public']['Tables']['materials']['Row'];

export default function CourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslation();
  const { fetchJob, fetchMaterials, currentJob, materials, loadingMaterials } = useJob();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [editedMaterials, setEditedMaterials] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchJob(id);
      fetchMaterials(id);
    }
  }, [id]);

  // Initialize edited materials when materials are loaded
  useEffect(() => {
    if (materials.length > 0) {
      const initialEdits: Record<string, string> = {};
      materials.forEach(material => {
        initialEdits[material.id] = material.content || '';
      });
      setEditedMaterials(initialEdits);
    }
  }, [materials]);

  const handleContentChange = (materialId: string, content: string) => {
    setEditedMaterials(prev => ({
      ...prev,
      [materialId]: content
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, this would save the edited content to the database
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: t('common.success'),
        description: 'Modificările au fost salvate cu succes',
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Salvarea a eșuat. Încercați din nou.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'foundation':
        return <FileText className="h-5 w-5" />;
      case 'slides':
        return <Presentation className="h-5 w-5" />;
      case 'facilitator':
        return <Users className="h-5 w-5" />;
      case 'participant':
        return <BookOpen className="h-5 w-5" />;
      case 'activities':
        return <Activity className="h-5 w-5" />;
      case 'evaluation':
        return <BarChart3 className="h-5 w-5" />;
      case 'resources':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (!currentJob) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        
        <main className="flex-1 container py-8 max-w-6xl">
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

  // Only allow editing if the job is completed
  if (currentJob.status !== 'completed') {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        
        <main className="flex-1 container py-8 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/cursuri">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold tracking-tight">{t('common.edit')}</h1>
            <p className="text-muted-foreground mt-2">
              {courseName}
            </p>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 px-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Cursul nu poate fi editat</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Cursul trebuie să fie complet generat pentru a putea fi editat.
              </p>
              <Button asChild>
                <Link to={`/jobs/${id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('progress.viewProgress')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/cursuri">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('common.edit')}</h1>
              <p className="text-muted-foreground mt-2">
                {courseName}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to={`/curs/${id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('materials.preview')}
                </Link>
              </Button>
              
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('common.save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {loadingMaterials ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : materials.length > 0 ? (
          <Tabs defaultValue={materials[0]?.type || 'foundation'} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              {materials
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((material) => (
                  <TabsTrigger 
                    key={material.id} 
                    value={material.type}
                    className="flex items-center gap-1 text-xs"
                  >
                    {getMaterialIcon(material.type)}
                    <span className="hidden sm:inline">
                      {t(`materials.types.${material.type}`)}
                    </span>
                  </TabsTrigger>
                ))}
            </TabsList>
            
            {materials
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((material) => (
                <TabsContent key={material.id} value={material.type}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getMaterialIcon(material.type)}
                          <CardTitle>{material.name}</CardTitle>
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
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Titlu material
                          </label>
                          <Input 
                            value={material.name}
                            onChange={(e) => {
                              // In a real implementation, this would update the material name
                              console.log('Update material name:', e.target.value);
                            }}
                            placeholder="Numele materialului"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Conținut
                          </label>
                          <Textarea
                            value={editedMaterials[material.id] || ''}
                            onChange={(e) => handleContentChange(material.id, e.target.value)}
                            placeholder="Conținutul materialului..."
                            className="min-h-[400px] font-mono text-sm"
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Pasul {material.stepNumber}/7
                      </div>
                      
                      {material.downloadUrl && (
                        <Button asChild variant="outline" size="sm">
                          <a href={material.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            {t('materials.download')}
                          </a>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>
              ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 px-6">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('materials.noMaterials')}</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {t('materials.noMaterialsDescription')}
              </p>
              <Button asChild>
                <Link to={`/jobs/${id}`}>
                  <Eye className="mr-2 h-4 w-4" />
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