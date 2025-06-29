export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          createdAt: string;
          stripeCustomerId: string | null;
          stripeSubscriptionId: string | null;
          planType: 'free' | 'basic' | 'pro' | 'enterprise' | null;
          subscriptionStartDate: string | null;
          generationsRemaining: number;
          subscriptionRenewalDate: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          createdAt?: string;
          stripeCustomerId?: string | null;
          stripeSubscriptionId?: string | null;
          planType?: 'free' | 'basic' | 'pro' | 'enterprise' | null;
          subscriptionStartDate?: string | null;
          generationsRemaining?: number;
          subscriptionRenewalDate?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          createdAt?: string;
          stripeCustomerId?: string | null;
          stripeSubscriptionId?: string | null;
          planType?: 'free' | 'basic' | 'pro' | 'enterprise' | null;
          subscriptionStartDate?: string | null;
          generationsRemaining?: number;
          subscriptionRenewalDate?: string | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          userId: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          createdAt: string;
          updatedAt: string;
          completedAt: string | null;
          progressPercent: number;
          statusMessage: string | null;
          error: string | null;
          metadata: Json;
          currentStep: number | null;
          totalSteps: number | null;
          stepName: string | null;
        };
        Insert: {
          id?: string;
          userId: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          createdAt?: string;
          updatedAt?: string;
          completedAt?: string | null;
          progressPercent?: number;
          statusMessage?: string | null;
          error?: string | null;
          metadata?: Json;
          currentStep?: number | null;
          totalSteps?: number | null;
          stepName?: string | null;
        };
        Update: {
          id?: string;
          userId?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          createdAt?: string;
          updatedAt?: string;
          completedAt?: string | null;
          progressPercent?: number;
          statusMessage?: string | null;
          error?: string | null;
          metadata?: Json;
          currentStep?: number | null;
          totalSteps?: number | null;
          stepName?: string | null;
        };
      };
      materials: {
        Row: {
          id: string;
          jobId: string;
          type: string;
          name: string;
          content: string | null;
          createdAt: string;
          format: string;
          downloadUrl: string | null;
          downloadExpiry: string | null;
          stepNumber: number;
        };
        Insert: {
          id?: string;
          jobId: string;
          type: string;
          name: string;
          content?: string | null;
          createdAt?: string;
          format: string;
          downloadUrl?: string | null;
          downloadExpiry?: string | null;
          stepNumber?: number;
        };
        Update: {
          id?: string;
          jobId?: string;
          type?: string;
          name?: string;
          content?: string | null;
          createdAt?: string;
          format?: string;
          downloadUrl?: string | null;
          downloadExpiry?: string | null;
          stepNumber?: number;
        };
      };
    };
  };
}