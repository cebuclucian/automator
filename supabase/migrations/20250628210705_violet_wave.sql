/*
  # Fix User Registration Trigger

  1. Database Functions
    - Update `handle_new_user` function to properly handle user creation
    - Ensure function has proper security definer permissions
    - Add error handling and logging

  2. Triggers
    - Ensure trigger is properly configured on auth.users table
    - Handle edge cases in user creation

  3. Security
    - Ensure RLS policies allow proper user creation
    - Add INSERT policy for new user registration
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new user into public.users table
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
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (this will appear in Supabase logs)
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    -- Re-raise the exception to prevent user creation if there's an issue
    RAISE;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow user creation
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow the trigger to insert data by creating a policy for the service role
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Ensure the function can be executed
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;