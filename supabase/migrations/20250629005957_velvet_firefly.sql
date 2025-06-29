/*
  # Update Database Schema for Course Generation System

  1. Database Types
    - Create or update plan_type enum
    - Create or update job_status enum

  2. Tables
    - Update users table structure
    - Update jobs table for 7-step process
    - Update materials table with step tracking

  3. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
    - Add indexes for performance

  4. Functions and Triggers
    - Handle new user registration
    - Update subscription limits automatically
*/

-- Create or update plan_type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
  ELSE
    -- Add new enum values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'free';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'basic' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'basic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pro' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'pro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'enterprise' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'enterprise';
    END IF;
  END IF;
END $$;

-- Create or update job_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;

-- Create or update users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "planType" plan_type DEFAULT 'free'::plan_type,
  "subscriptionStartDate" TIMESTAMPTZ,
  "generationsRemaining" INTEGER DEFAULT 1,
  "subscriptionRenewalDate" TIMESTAMPTZ
);

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'createdAt') THEN
    ALTER TABLE users ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripeCustomerId') THEN
    ALTER TABLE users ADD COLUMN "stripeCustomerId" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripeSubscriptionId') THEN
    ALTER TABLE users ADD COLUMN "stripeSubscriptionId" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'planType') THEN
    ALTER TABLE users ADD COLUMN "planType" plan_type DEFAULT 'free'::plan_type;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscriptionStartDate') THEN
    ALTER TABLE users ADD COLUMN "subscriptionStartDate" TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'generationsRemaining') THEN
    ALTER TABLE users ADD COLUMN "generationsRemaining" INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscriptionRenewalDate') THEN
    ALTER TABLE users ADD COLUMN "subscriptionRenewalDate" TIMESTAMPTZ;
  END IF;
END $$;

-- Create or update jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status job_status DEFAULT 'pending'::job_status,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  "completedAt" TIMESTAMPTZ,
  "progressPercent" INTEGER DEFAULT 0,
  "statusMessage" TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  "currentStep" INTEGER,
  "totalSteps" INTEGER,
  "downloadUrl" TEXT,
  "downloadExpiry" TIMESTAMPTZ,
  "stepName" TEXT
);

-- Add missing columns to jobs table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'currentStep') THEN
    ALTER TABLE jobs ADD COLUMN "currentStep" INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'totalSteps') THEN
    ALTER TABLE jobs ADD COLUMN "totalSteps" INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'stepName') THEN
    ALTER TABLE jobs ADD COLUMN "stepName" TEXT;
  END IF;
END $$;

-- Create or update materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  format TEXT NOT NULL,
  "downloadUrl" TEXT,
  "downloadExpiry" TIMESTAMPTZ,
  "stepNumber" INTEGER NOT NULL DEFAULT 1
);

-- Add missing columns to materials table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'stepNumber') THEN
    ALTER TABLE materials ADD COLUMN "stepNumber" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own jobs" ON jobs;
CREATE POLICY "Users can read own jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can insert own jobs" ON jobs;
CREATE POLICY "Users can insert own jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
CREATE POLICY "Users can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can read own materials" ON materials;
CREATE POLICY "Users can read own materials"
  ON materials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = materials."jobId" 
      AND jobs."userId" = auth.uid()
    )
  );

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jobs_user_id_idx') THEN
    CREATE INDEX jobs_user_id_idx ON jobs("userId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'jobs_status_idx') THEN
    CREATE INDEX jobs_status_idx ON jobs(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'materials_job_id_idx') THEN
    CREATE INDEX materials_job_id_idx ON materials("jobId");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'materials_step_idx') THEN
    CREATE INDEX materials_step_idx ON materials("stepNumber");
  END IF;
END $$;

-- Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    "createdAt",
    "planType",
    "generationsRemaining"
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    'free'::plan_type,
    1
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "createdAt" = EXCLUDED."createdAt";
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RAISE;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create or replace function to update subscription limits
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Update generations remaining based on plan type
  IF NEW."planType" = 'free' THEN
    NEW."generationsRemaining" = 1;
  ELSIF NEW."planType" = 'basic' THEN
    NEW."generationsRemaining" = 1;
  ELSIF NEW."planType" = 'pro' THEN
    NEW."generationsRemaining" = 5;
  ELSIF NEW."planType" = 'enterprise' THEN
    NEW."generationsRemaining" = 20;
  END IF;
  
  -- Set renewal date to next month if subscription is active
  IF NEW."stripeSubscriptionId" IS NOT NULL AND (OLD."stripeSubscriptionId" IS NULL OR OLD."stripeSubscriptionId" != NEW."stripeSubscriptionId") THEN
    NEW."subscriptionRenewalDate" = (CURRENT_DATE + INTERVAL '1 month')::timestamptz;
    NEW."subscriptionStartDate" = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription updates
DROP TRIGGER IF EXISTS on_subscription_update ON users;
CREATE TRIGGER on_subscription_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD."planType" IS DISTINCT FROM NEW."planType" OR OLD."stripeSubscriptionId" IS DISTINCT FROM NEW."stripeSubscriptionId")
  EXECUTE FUNCTION public.update_subscription_limits();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.materials TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.materials TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_limits() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_subscription_limits() TO authenticated;