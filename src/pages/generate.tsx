import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useJob } from '@/context/job-context';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Loader2, FileText, AlertCircle, BookOpen, Clock, Users, Volume2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

// Generate form schema - updated for new system
const generateSchema = z.object({
  language: z.enum(['ro', 'en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'sv', 'da']),
  subject: z.string().min(3, { message: 'Subject must be at least 3 characters' }),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  audience: z.enum(['students', 'professionals', 'managers']),
  duration: z.enum(['30min', '1h', '2h', '4h', '8h']),
  tone: z.enum(['socratic', 'energizing', 'funny', 'professional']),
});

type GenerateFormValues = z.infer<typeof generateSchema>;

// Language options for the form
const languageOptions = [
  { value: 'ro', label: 'Română', flag: '🇷🇴' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { value: 'da', label: 'Dansk', flag: '🇩🇰' },
];

export default function GeneratePage() {
  const t = useTranslation();
  const { createJob } = useJob();
  const { canGenerate, generationsRemaining, subscription } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default form values
  const defaultValues: Partial<GenerateFormValues> = {
    language: 'ro',
    level: 'intermediate',
    audience: 'professionals',
    duration: '2h',
    tone: 'professional',
  };

  const form = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues,
  });

  const onSubmit = async (data: GenerateFormValues) => {
    if (!canGenerate) {
      toast({
        title: t('generate.error.noGenerationsLeft'),
        description: t('generate.error.upgradeOrWait'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const job = await createJob(data);
      
      if (job) {
        toast({
          title: t('generate.success.started'),
          description: t('generate.info.timeEstimate'),
        });
        
        navigate(`/jobs/${job.id}`);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: t('common.error'),
        description: t('generate.error.failed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('generate.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('generate.subtitle')}
          </p>
        </div>
        
        {generationsRemaining <= 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('generate.error.noGenerationsLeft')}</AlertTitle>
            <AlertDescription>
              {t('generate.error.upgradeOrWait')}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('generate.form.title')}
            </CardTitle>
            <CardDescription>
              {t('generate.form.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Language */}
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span>🌐</span>
                          {t('generate.form.language')}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('generate.form.selectLanguage')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languageOptions.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                <div className="flex items-center gap-2">
                                  <span>{lang.flag}</span>
                                  <span>{lang.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Subject */}
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {t('generate.form.subject')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('generate.form.subjectPlaceholder')} 
                            {...field} 
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Level */}
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span>📊</span>
                          {t('generate.form.level')}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('generate.form.selectLevel')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">{t('generate.form.beginner')}</SelectItem>
                            <SelectItem value="intermediate">{t('generate.form.intermediate')}</SelectItem>
                            <SelectItem value="advanced">{t('generate.form.advanced')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Target Audience */}
                  <FormField
                    control={form.control}
                    name="audience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {t('generate.form.audience')}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('generate.form.selectAudience')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="students">{t('generate.form.students')}</SelectItem>
                            <SelectItem value="professionals">{t('generate.form.professionals')}</SelectItem>
                            <SelectItem value="managers">{t('generate.form.managers')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Duration */}
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {t('generate.form.duration')}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('generate.form.selectDuration')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="30min">{t('generate.form.30min')}</SelectItem>
                            <SelectItem value="1h">{t('generate.form.1h')}</SelectItem>
                            <SelectItem value="2h">{t('generate.form.2h')}</SelectItem>
                            <SelectItem value="4h">{t('generate.form.4h')}</SelectItem>
                            <SelectItem value="8h">{t('generate.form.8h')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Tone */}
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          {t('generate.form.tone')}
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('generate.form.selectTone')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="socratic">{t('generate.form.socratic')}</SelectItem>
                            <SelectItem value="energizing">{t('generate.form.energizing')}</SelectItem>
                            <SelectItem value="funny">{t('generate.form.funny')}</SelectItem>
                            <SelectItem value="professional">{t('generate.form.professional')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Info about remaining generations */}
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>{t('generate.info.remaining')}</AlertTitle>
                  <AlertDescription>
                    {t('generate.info.youHave')} <strong>{generationsRemaining}</strong> {t('generate.info.generationsLeft')}
                  </AlertDescription>
                </Alert>
                
                <Button type="submit" className="w-full" disabled={isSubmitting || generationsRemaining <= 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('generate.form.submitting')}
                    </>
                  ) : (
                    t('generate.form.submit')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-start text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span>{t('progress.step1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span>{t('progress.step2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👨‍🏫</span>
              <span>{t('progress.step3')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📚</span>
              <span>{t('progress.step4')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎮</span>
              <span>{t('progress.step5')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span>
              <span>{t('progress.step6')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📖</span>
              <span>{t('progress.step7')}</span>
            </div>
            <p className="mt-4 text-xs">{t('generate.info.timeEstimate')}</p>
            <p className="text-xs">{t('generate.info.notification')}</p>
          </CardFooter>
        </Card>
      </main>
      
      <SiteFooter />
    </div>
  );
}