import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/hooks/use-subscription';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  FileText, 
  Loader2, 
  Lock, 
  Settings, 
  User, 
  X 
} from 'lucide-react';
import { format } from 'date-fns';
import { ro, enUS } from 'date-fns/locale';
import { useLanguage } from '@/context/language-context';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useToast } from '@/hooks/use-toast';

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password must be at least 6 characters",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters",
  }),
  confirmPassword: z.string().min(6, {
    message: "Confirm password must be at least 6 characters",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const t = useTranslation();
  const { user, signOut } = useAuth();
  const { subscription, loading: loadingSubscription, initializeStripeCheckout, cancelSubscription } = useSubscription();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  
  // Date formatting locale
  const locale = language === 'ro' ? ro : enUS;

  // Form for changing password
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'PPP', { locale });
  };

  const onSubmitPasswordChange = async (values: z.infer<typeof passwordSchema>) => {
    setIsUpdatingPassword(true);
    try {
      // This would be implemented with Supabase's update password functionality
      // For now, let's just simulate a successful password change
      setTimeout(() => {
        toast({
          title: t('settings.passwordUpdated'),
          description: t('settings.passwordUpdateSuccess'),
        });
        form.reset();
      }, 1000);
    } catch (error) {
      toast({
        title: t('settings.passwordUpdateError'),
        description: t('settings.passwordUpdateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpgradeSubscription = async (planType: string) => {
    setIsLoadingCheckout(true);
    
    try {
      let priceId;
      
      // Map plan types to Stripe price IDs (these would be actual IDs in production)
      switch (planType) {
        case 'basic':
          priceId = 'price_basic';
          break;
        case 'pro':
          priceId = 'price_pro';
          break;
        case 'enterprise':
          priceId = 'price_enterprise';
          break;
        default:
          throw new Error('Invalid plan type');
      }
      
      const checkoutUrl = await initializeStripeCheckout(priceId);
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: t('subscription.upgradeError'),
        description: t('subscription.upgradeFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;
    
    const confirmed = window.confirm(t('subscription.confirmCancel'));
    if (!confirmed) return;
    
    setIsCancellingSubscription(true);
    
    try {
      const success = await cancelSubscription();
      
      if (success) {
        toast({
          title: t('subscription.cancelSuccess'),
          description: t('subscription.cancelMessage'),
        });
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: t('subscription.cancelError'),
        description: t('subscription.cancelFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

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
          
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('settings.description')}
          </p>
        </div>
        
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('settings.account')}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('settings.subscription')}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('settings.security')}
            </TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.accountDetails')}</CardTitle>
                <CardDescription>
                  {t('settings.accountDetailsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('auth.email')}
                  </h3>
                  <p>{user?.email}</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('settings.accountCreated')}
                  </h3>
                  <p>{user?.created_at ? formatDate(user.created_at) : '—'}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => signOut()}>
                  <X className="mr-2 h-4 w-4" />
                  {t('auth.signOut')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Subscription Settings */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('subscription.currentPlan')}</CardTitle>
                  <CardDescription>
                    {t('subscription.currentPlanDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">
                        {subscription?.planType 
                          ? t(`subscription.${subscription.planType}`)
                          : t('subscription.basic')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.planType === 'basic' 
                          ? t('plans.basic.description')
                          : subscription?.planType === 'pro'
                          ? t('plans.pro.description')
                          : subscription?.planType === 'enterprise'
                          ? t('plans.enterprise.description')
                          : t('plans.basic.description')}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-2xl font-bold">
                        {subscription?.planType === 'basic' 
                          ? t('plans.basic.price')
                          : subscription?.planType === 'pro'
                          ? t('plans.pro.price')
                          : subscription?.planType === 'enterprise'
                          ? t('plans.enterprise.price')
                          : t('plans.basic.price')}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {t('subscription.monthly')}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {t('dashboard.generationsRemaining')}
                        </span>
                      </div>
                      <p>
                        {subscription?.generationsRemaining || 0}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {t('dashboard.renewalDate')}
                        </span>
                      </div>
                      <p>
                        {formatDate(subscription?.subscriptionRenewalDate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                  {subscription?.planType !== 'basic' && subscription?.stripeSubscriptionId && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={isCancellingSubscription}
                    >
                      {isCancellingSubscription ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      {t('subscription.cancel')}
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* Available Plans */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{t('subscription.availablePlans')}</h2>
                
                {/* Basic Plan */}
                <Card className={subscription?.planType === 'basic' ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle>{t('plans.basic.name')}</CardTitle>
                    <CardDescription>
                      {t('plans.basic.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{t('plans.basic.price')}</span>
                      <span className="text-muted-foreground ml-1">{t('subscription.monthly')}</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>✓ 1 {t('generate.info.courses')}</li>
                      <li>✓ {t('subscription.features.fullGeneration')}</li>
                      <li>✓ {t('subscription.features.downloads')}</li>
                      <li>✓ {t('subscription.features.support')}</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {subscription?.planType === 'basic' ? (
                      <Button disabled variant="outline" className="w-full">
                        {t('subscription.currentPlan')}
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => handleUpgradeSubscription('basic')}
                        disabled={isLoadingCheckout}
                      >
                        {isLoadingCheckout ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          t('subscription.upgrade')
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                
                {/* Pro Plan */}
                <Card className={subscription?.planType === 'pro' ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="-mt-2 mb-3 flex justify-center">
                      <span className="inline-flex rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                        {t('subscription.popular')}
                      </span>
                    </div>
                    <CardTitle>{t('plans.pro.name')}</CardTitle>
                    <CardDescription>
                      {t('plans.pro.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{t('plans.pro.price')}</span>
                      <span className="text-muted-foreground ml-1">{t('subscription.monthly')}</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>✓ 5 {t('generate.info.courses')}</li>
                      <li>✓ {t('subscription.features.fullGeneration')}</li>
                      <li>✓ {t('subscription.features.downloads')}</li>
                      <li>✓ {t('subscription.features.prioritySupport')}</li>
                      <li>✓ {t('subscription.features.extendedDownloads')}</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {subscription?.planType === 'pro' ? (
                      <Button disabled variant="outline" className="w-full">
                        {t('subscription.currentPlan')}
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => handleUpgradeSubscription('pro')}
                        disabled={isLoadingCheckout}
                      >
                        {isLoadingCheckout ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          t('subscription.upgrade')
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
                
                {/* Enterprise Plan */}
                <Card className={subscription?.planType === 'enterprise' ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle>{t('plans.enterprise.name')}</CardTitle>
                    <CardDescription>
                      {t('plans.enterprise.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{t('plans.enterprise.price')}</span>
                      <span className="text-muted-foreground ml-1">{t('subscription.monthly')}</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>✓ 20 {t('generate.info.courses')}</li>
                      <li>✓ {t('subscription.features.fullGeneration')}</li>
                      <li>✓ {t('subscription.features.downloads')}</li>
                      <li>✓ {t('subscription.features.dedicatedSupport')}</li>
                      <li>✓ {t('subscription.features.extendedDownloads')}</li>
                      <li>✓ {t('subscription.features.priorityProcessing')}</li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {subscription?.planType === 'enterprise' ? (
                      <Button disabled variant="outline" className="w-full">
                        {t('subscription.currentPlan')}
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => handleUpgradeSubscription('enterprise')}
                        disabled={isLoadingCheckout}
                      >
                        {isLoadingCheckout ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          t('subscription.upgrade')
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
              
              {/* Payment info */}
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertTitle>{t('subscription.billingInfo')}</AlertTitle>
                <AlertDescription>
                  {t('subscription.billingManagedByStripe')}
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.changePassword')}</CardTitle>
                <CardDescription>
                  {t('settings.changePasswordDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitPasswordChange)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.currentPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.newPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.confirmPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        t('settings.updatePassword')
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Account Deletion */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-destructive">{t('settings.deleteAccount')}</CardTitle>
                <CardDescription>
                  {t('settings.deleteAccountDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTitle>{t('settings.warning')}</AlertTitle>
                  <AlertDescription>
                    {t('settings.deleteAccountWarning')}
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button variant="destructive">
                  {t('settings.deleteAccount')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <SiteFooter />
    </div>
  );
}