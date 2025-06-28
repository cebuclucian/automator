import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import supabase from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const t = useTranslation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: t('auth.signInError'),
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: t('auth.signInSuccess'),
        description: t('auth.welcomeBack'),
      });
      
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: t('auth.signInError'),
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        toast({
          title: t('auth.signUpError'),
          description: error.message,
          variant: 'destructive',
        });
        return { error, user: null };
      }
      
      toast({
        title: t('auth.signUpSuccess'),
        description: t('auth.accountCreated'),
      });
      
      return { error: null, user: data.user };
    } catch (err) {
      const error = err as Error;
      toast({
        title: t('auth.signUpError'),
        description: error.message,
        variant: 'destructive',
      });
      return { error, user: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('auth.signedOut'),
      description: t('auth.comeBackSoon'),
    });
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        toast({
          title: t('auth.resetPasswordError'),
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: t('auth.resetPasswordEmailSent'),
        description: t('auth.checkEmailForReset'),
      });
      
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: t('auth.resetPasswordError'),
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}