/*
  # Updated Database Schema for Optimized Course Generation System

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - References auth.users.id
      - `email` (text, not null)
      - `createdAt` (timestamptz, default now())
      - `stripeCustomerId` (text, nullable)
      - `stripeSubscriptionId` (text, nullable)
      - `planType` (enum, default 'basic') - Updated default
      - `subscriptionStartDate` (timestamptz, nullable)
      - `generationsRemaining` (integer, default 1) - Updated for new plans
      - `subscriptionRenewalDate` (timestamptz, nullable)
    
    - `jobs`
      - `id` (uuid, primary key)
      - `userId` (uuid, not null) - References users.id
      - `status` (enum, default pending)
      - `createdAt` (timestamptz, default now())
      - `updatedAt` (timestamptz, default now())
      - `completedAt` (timestamptz, nullable)
      - `progressPercent` (integer, default 0)
      - `currentStep` (integer, nullable) - For 7-step process
      - `totalSteps` (integer, default 7) - Updated for 7 steps
      - `stepName` (text, nullable) - Current step name
      - `statusMessage` (text, nullable)
      - `error` (text, nullable)
      - `metadata` (jsonb, default '{}')
      - `downloadUrl` (text, nullable)
      - `downloadExpiry` (timestamptz, nullable)
    
    - `materials`
      - `id` (uuid, primary key)
      - `jobId` (uuid, not null) - References jobs.id
      - `type` (text, not null) - foundation, slides, facilitator, participant, activities, evaluation, resources
      - `name` (text, not null)
      - `content` (text, nullable)
      - `createdAt` (timestamptz, default now())
      - `format` (text, not null) - docx, pptx, pdf
      - `downloadUrl` (text, nullable)
      - `downloadExpiry` (timestamptz, nullable)
      - `stepNumber` (integer, not null) - Which step generated this material

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create ENUM types
CREATE TYPE plan_type AS ENUM ('basic', 'pro', 'enterprise');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "planType" plan_type DEFAULT 'basic'::plan_type,
  "subscriptionStartDate" TIMESTAMPTZ,
  "generationsRemaining" INTEGER DEFAULT 1,
  "subscriptionRenewalDate" TIMESTAMPTZ
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status job_status DEFAULT 'pending'::job_status,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  "completedAt" TIMESTAMPTZ,
  "progressPercent" INTEGER DEFAULT 0,
  "currentStep" INTEGER,
  "totalSteps" INTEGER DEFAULT 7,
  "stepName" TEXT,
  "statusMessage" TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  "downloadUrl" TEXT,
  "downloadExpiry" TIMESTAMPTZ
);

-- Create materials table
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
  "stepNumber" INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for jobs table
CREATE POLICY "Users can read own jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId");

-- Create policies for materials table
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

-- Create indexes for better performance
CREATE INDEX jobs_user_id_idx ON jobs("userId");
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX materials_job_id_idx ON materials("jobId");
CREATE INDEX materials_step_idx ON materials("stepNumber");

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, "createdAt", "planType", "generationsRemaining")
  VALUES (new.id, new.email, new.created_at, 'basic', 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create trigger to add new users to our users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update subscription limits
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Update generations remaining based on plan type
  IF NEW."planType" = 'basic' THEN
    NEW."generationsRemaining" = 1;
  ELSIF NEW."planType" = 'pro' THEN
    NEW."generationsRemaining" = 5;
  ELSIF NEW."planType" = 'enterprise' THEN
    NEW."generationsRemaining" = 20;
  END IF;
  
  -- Set renewal date to next month if subscription is active
  IF NEW."stripeSubscriptionId" IS NOT NULL AND OLD."stripeSubscriptionId" IS NULL THEN
    NEW."subscriptionRenewalDate" = (CURRENT_DATE + INTERVAL '1 month')::timestamptz;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription updates
CREATE TRIGGER on_subscription_update
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD."planType" IS DISTINCT FROM NEW."planType" OR OLD."stripeSubscriptionId" IS DISTINCT FROM NEW."stripeSubscriptionId")
  EXECUTE FUNCTION public.update_subscription_limits();