/*
  # Update Database Schema for Optimized Course Generation

  1. Updates to existing tables and types
    - Update plan_type enum to include new values
    - Update users table structure
    - Update jobs table for 7-step process
    - Update materials table with step tracking

  2. Security
    - Maintain RLS policies
    - Update indexes for performance
    - Add new triggers for subscription management
*/

-- Update plan_type enum to include new values if needed
DO $$ 
BEGIN
  -- Check if plan_type exists and update it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    -- Add new enum values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'basic' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'basic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pro' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'pro';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'enterprise' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'plan_type')) THEN
      ALTER TYPE plan_type ADD VALUE 'enterprise';
    END IF;
  ELSE
    -- Create the enum if it doesn't exist
    CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
  END IF;
END $$;

-- Create job_status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;

-- Update users table structure
DO $$
BEGIN
  -- Add new columns if they don't exist
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

-- Update jobs table structure for 7-step process
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'currentStep') THEN
    ALTER TABLE jobs ADD COLUMN "currentStep" INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'totalSteps') THEN
    ALTER TABLE jobs ADD COLUMN "totalSteps" INTEGER DEFAULT 7;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'stepName') THEN
    ALTER TABLE jobs ADD COLUMN "stepName" TEXT;
  END IF;
  
  -- Remove old columns that are no longer needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'milestone') THEN
    ALTER TABLE jobs DROP COLUMN milestone;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'currentMaterial') THEN
    ALTER TABLE jobs DROP COLUMN "currentMaterial";
  END IF;
END $$;

-- Update materials table structure
DO $$
BEGIN
  -- Add stepNumber column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'stepNumber') THEN
    ALTER TABLE materials ADD COLUMN "stepNumber" INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

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

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, "createdAt", "planType", "generationsRemaining")
  VALUES (new.id, new.email, new.created_at, 'free', 1)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "createdAt" = EXCLUDED."createdAt";
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Recreate trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update subscription limits
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

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to handle any changes
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