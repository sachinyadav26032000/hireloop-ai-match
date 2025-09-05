-- Drop the overly permissive policy that exposes all user data
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows users to see their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a policy that allows companies to see job seeker profiles (including email) 
-- ONLY for users who applied to their jobs
CREATE POLICY "Companies can view applicant profiles for their jobs" 
ON public.profiles 
FOR SELECT 
USING (
  -- Companies can see profiles of users who applied to their jobs
  EXISTS (
    SELECT 1 
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.applicant_id = profiles.id 
    AND j.company_id = auth.uid()
  )
);

-- Create a public view that excludes sensitive information like email and phone
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  user_type,
  company_name,
  website,
  bio,
  location,
  avatar_url,
  created_at,
  applications_count,
  is_premium
FROM public.profiles;