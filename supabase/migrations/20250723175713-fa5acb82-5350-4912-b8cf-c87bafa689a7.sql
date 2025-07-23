-- Add application limits and payment tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN applications_count INTEGER DEFAULT 0,
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN premium_expires_at TIMESTAMPTZ;

-- Add application viewed tracking to job_applications
ALTER TABLE public.job_applications 
ADD COLUMN viewed_at TIMESTAMPTZ,
ADD COLUMN response_date TIMESTAMPTZ;

-- Create a trigger to update application count when a new application is created
CREATE OR REPLACE FUNCTION update_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET applications_count = applications_count + 1,
      updated_at = now()
  WHERE id = NEW.applicant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for application count
CREATE TRIGGER increment_application_count
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_count();

-- Add index for better performance
CREATE INDEX idx_profiles_premium ON public.profiles(is_premium, premium_expires_at);
CREATE INDEX idx_job_applications_status ON public.job_applications(status, created_at);