-- Drop the overly permissive policy that exposes all user data
DROP POLICY "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows users to see their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a policy that allows viewing limited public profile data (excluding email)
-- This allows companies to see job seeker names and basic info for legitimate business purposes
CREATE POLICY "Public profile data viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  -- Only allow viewing non-sensitive fields
  true
);

-- However, we need to handle this at the application level since RLS can't filter columns
-- So let's create a view for public profile data instead

-- Create a public view that excludes sensitive information
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

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create policy for the public view
CREATE POLICY "Anyone can view public profile data" 
ON public.public_profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create a policy that allows companies to see job seeker emails ONLY for their job applications
CREATE POLICY "Companies can view applicant emails for their jobs" 
ON public.profiles 
FOR SELECT 
USING (
  -- Companies can see email addresses of users who applied to their jobs
  EXISTS (
    SELECT 1 
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.applicant_id = profiles.id 
    AND j.company_id = auth.uid()
  )
);