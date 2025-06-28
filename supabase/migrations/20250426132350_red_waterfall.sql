/*
  # Initial Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - References auth.users.id
      - `email` (text, not null)
      - `createdAt` (timestamptz, default now())
      - `stripeCustomerId` (text, nullable)
      - `stripeSubscriptionId` (text, nullable)
      - `planType` (enum, nullable)
      - `subscriptionStartDate` (timestamptz, nullable)
      - `generationsRemaining` (integer, default 1)
      - `subscriptionRenewalDate` (timestamptz, nullable)
    
    - `jobs`
      - `id` (uuid, primary key)
      - `userId` (uuid, not null) - References users.id
      - `status` (enum, default pending)
      - `createdAt` (timestamptz, default now())
      - `updatedAt` (timestamptz, default now())
      - `completedAt` (timestamptz, nullable)
      - `progressPercent` (integer, default 0)
      - `milestone` (text, nullable)
      - `statusMessage` (text, nullable)
      - `error` (text, nullable)
      - `metadata` (jsonb, default '{}')
      - `currentStep` (integer, nullable)
      - `totalSteps` (integer, nullable)
      - `currentMaterial` (text, nullable)
      - `downloadUrl` (text, nullable)
      - `downloadExpiry` (timestamptz, nullable)
    
    - `materials`
      - `id` (uuid, primary key)
      - `jobId` (uuid, not null) - References jobs.id
      - `type` (text, not null)
      - `name` (text, not null)
      - `content` (text, nullable)
      - `createdAt` (timestamptz, default now())
      - `format` (text, not null)
      - `downloadUrl` (text, nullable)
      - `downloadExpiry` (timestamptz, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create ENUM types
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create users table
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

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status job_status DEFAULT 'pending'::job_status,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  "completedAt" TIMESTAMPTZ,
  "progressPercent" INTEGER DEFAULT 0,
  milestone TEXT,
  "statusMessage" TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  "currentStep" INTEGER,
  "totalSteps" INTEGER,
  "currentMaterial" TEXT,
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
  "downloadExpiry" TIMESTAMPTZ
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
CREATE INDEX materials_job_id_idx ON materials("jobId");

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, "createdAt", "planType", "generationsRemaining")
  VALUES (new.id, new.email, new.created_at, 'free', 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create trigger to add new users to our users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();