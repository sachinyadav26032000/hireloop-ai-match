-- Drop the security definer view and recreate without security definer
DROP VIEW public.public_profiles;

-- Create a standard view (without security definer) that excludes sensitive information
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