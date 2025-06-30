import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/language-context';
import { Database } from '@/types/supabase';

type Job = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type Material = Database['public']['Tables']['materials']['Row'];
type MaterialInsert = Database['public']['Tables']['materials']['Insert'];

interface GenerationParams {
  language: string;
  subject: string;
  context: string;
  level: string;
  audience: string;
  duration: string;
  tone: string;
  generationType?: 'preview' | 'full';
}

interface JobContextProps {
  jobs: Job[];
  currentJob: Job | null;
  materials: Material[];
  loadingJobs: boolean;
  loadingMaterials: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  fetchJob: (jobId: string) => Promise<Job | null>;
  fetchMaterials: (jobId: string) => Promise<Material[]>;
  createJob: (params: GenerationParams) => Promise<Job | null>;
  cancelJob: (jobId: string) => Promise<boolean>;
  retryJob: (jobId: string) => Promise<Job | null>;
}

const JobContext = createContext<JobContextProps | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslation();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  // Set up real-time subscription to job updates
  useEffect(() => {
    if (!user) return;

    const jobSubscription = supabase
      .channel('jobs-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `userId=eq.${user.id}`,
        },
        async (payload) => {
          // Refresh jobs list when there's a change
          await fetchJobs();
          
          // Update current job if it was the one that changed
          if (currentJob && payload.new && payload.new.id === currentJob.id) {
            const updatedJob = payload.new as Job;
            setCurrentJob(updatedJob);
            
            // If job completed, fetch materials
            if (updatedJob.status === 'completed' && !materials.length) {
              fetchMaterials(updatedJob.id);
              
              toast({
                title: t('progress.completed'),
                description: t('progress.viewMaterials'),
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      jobSubscription.unsubscribe();
    };
  }, [user, currentJob]);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoadingJobs(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      setJobs(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchJob = async (jobId: string) => {
    if (!user) return null;
    
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('userId', user.id)
        .single();
      
      if (error) throw error;
      
      setCurrentJob(data);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return null;
    }
  };

  const fetchMaterials = async (jobId: string) => {
    if (!user) return [];
    
    setLoadingMaterials(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('jobId', jobId)
        .order('createdAt', { ascending: true });
      
      if (error) throw error;
      
      setMaterials(data || []);
      return data || [];
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return [];
    } finally {
      setLoadingMaterials(false);
    }
  };

  const createJob = async (params: GenerationParams) => {
    if (!user) return null;
    
    setError(null);
    
    try {
      // Create the job record
      const newJob: JobInsert = {
        userId: user.id,
        status: 'pending',
        progressPercent: 0,
        metadata: params,
      };
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([newJob])
        .select()
        .single();
      
      if (error) throw error;
      
      // Call the serverless function to start the generation process
      // This would be implemented as a Supabase Edge Function
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          jobId: data.id,
          ...params 
        }),
      }).catch(err => {
        console.error('Error calling generate function:', err);
      });
      
      setCurrentJob(data);
      
      // Refresh job list
      await fetchJobs();
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const cancelJob = async (jobId: string) => {
    if (!user) return false;
    
    setError(null);
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'failed', statusMessage: 'Cancelled by user' })
        .eq('id', jobId)
        .eq('userId', user.id);
      
      if (error) throw error;
      
      toast({
        title: t('progress.cancelled'),
        description: t('progress.jobCancelled'),
      });
      
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return false;
    }
  };

  const retryJob = async (jobId: string) => {
    if (!user) return null;
    
    setError(null);
    
    try {
      // Get the job details first
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('userId', user.id)
        .single();
      
      if (jobError) throw jobError;
      
      // Update the job status to pending
      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          status: 'pending', 
          progressPercent: 0,
          error: null,
          statusMessage: 'Retrying...',
          completedAt: null,
          downloadUrl: null,
          downloadExpiry: null,
          currentStep: null,
          currentMaterial: null,
        })
        .eq('id', jobId)
        .eq('userId', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Call the serverless function to restart the generation process
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          jobId: data.id,
          ...job.metadata 
        }),
      }).catch(err => {
        console.error('Error calling generate function:', err);
      });
      
      setCurrentJob(data);
      
      toast({
        title: t('progress.retrying'),
        description: t('progress.jobRetrying'),
      });
      
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return null;
    }
  };

  const value = {
    jobs,
    currentJob,
    materials,
    loadingJobs,
    loadingMaterials,
    error,
    fetchJobs,
    fetchJob,
    fetchMaterials,
    createJob,
    cancelJob,
    retryJob,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJob() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
}