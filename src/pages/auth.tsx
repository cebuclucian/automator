import { useTranslation } from '@/context/language-context';
import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BookCheck, ArrowLeft, Loader2 } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

// Login form schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Register form schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reset password schema
const resetSchema = z.object({
  email: z.string().email(),
});

export default function AuthPage() {
  const t = useTranslation();
  
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 container max-w-md mx-auto px-4 py-8">
        <Routes>
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
          <Route path="reset-password" element={<ResetPasswordForm />} />
        </Routes>
      </main>
      
      <SiteFooter />
    </div>
  );
}

function LoginForm() {
  const t = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (!error) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <BookCheck className="h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">{t('auth.signIn')}</h1>
        <p className="text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/auth/register" className="text-primary underline-offset-4 hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl>
                  <Input placeholder="example@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="text-right">
            <Link to="/auth/reset-password" className="text-sm text-primary underline-offset-4 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.signIn')
            )}
          </Button>
        </form>
      </Form>
      
      <div className="text-center">
        <Link to="/" className="text-sm text-muted-foreground flex items-center justify-center gap-1 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
}

function RegisterForm() {
  const t = useTranslation();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const { error, user } = await signUp(values.email, values.password);
      if (!error && user) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <BookCheck className="h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">{t('auth.signUp')}</h1>
        <p className="text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link to="/auth/login" className="text-primary underline-offset-4 hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.email')}</FormLabel>
                <FormControl>
                  <Input placeholder="example@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
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
                <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.signUp')
            )}
          </Button>
        </form>
      </Form>
      
      <div className="text-center">
        <Link to="/" className="text-sm text-muted-foreground flex items-center justify-center gap-1 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const t = useTranslation();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (!error) {
        setIsSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-2">
        <BookCheck className="h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">{t('auth.resetPassword')}</h1>
        {!isSuccess && (
          <p className="text-muted-foreground">
            {t('auth.checkEmailForReset')}
          </p>
        )}
      </div>

      {isSuccess ? (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
          <p className="text-green-800 dark:text-green-300 font-medium">
            {t('auth.resetPasswordEmailSent')}
          </p>
          <p className="text-green-700 dark:text-green-400 text-sm mt-2">
            {t('auth.checkEmailForReset')}
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth/login">
              {t('auth.signIn')}
            </Link>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder="example@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.resetPassword')
              )}
            </Button>
          </form>
        </Form>
      )}
      
      <div className="text-center">
        <Link to="/auth/login" className="text-sm text-muted-foreground flex items-center justify-center gap-1 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')} {t('auth.signIn')}
        </Link>
      </div>
    </div>
  );
}