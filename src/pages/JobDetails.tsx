import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, MapPin, Briefcase, Calendar, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface JobDetailsData {
  id: string;
  title?: string;
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  job_type?: string;
  company_name?: string;
  created_at?: string;
  [key: string]: any;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<JobDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    document.title = job?.title ? `${job.title} • Job Details` : 'Job Details';
  }, [job?.title]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      // Fetch job
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setJob(null);
        setLoading(false);
        return;
      }

      setJob(data as JobDetailsData);
      setLoading(false);

      // Check if already applied
      if (user) {
        const { data: appData } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle<{ id: string }>();
        setApplied(Boolean(appData));
      }
    };

    fetchJob();
  }, [id, user]);

  const handleApply = async () => {
    if (!user) {
      toast({ title: 'Please log in', description: 'You need to log in to apply for this job.' });
      navigate('/login');
      return;
    }

    if (profile?.user_type !== 'job_seeker') {
      toast({ title: 'Not allowed', description: 'Only job seekers can apply for jobs.' });
      return;
    }

    if (!id) return;

    const { error } = await supabase.from('job_applications').insert({
      job_id: id,
      applicant_id: user.id,
      status: 'applied',
    });

    if (error) {
      toast({ title: 'Application failed', description: error.message });
      return;
    }

    setApplied(true);
    toast({ title: 'Application submitted', description: 'Your application has been recorded.' });
  };

  if (loading) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </main>
    );
  }

  if (!job) {
    return (
      <main className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground mb-6">This job was not found or has been removed.</p>
        <Button onClick={() => navigate(-1)} variant="secondary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </main>
    );
  }

  const salary = (() => {
    const min = job.salary_min ?? job.salaryMin ?? job.min_salary;
    const max = job.salary_max ?? job.salaryMax ?? job.max_salary;
    const currency = job.currency ?? 'INR';
    if (!min && !max) return null;
    const range = [min, max].filter(Boolean).join(' - ');
    return `${currency} ${range}`;
  })();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      <Card className="border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl leading-tight">
                {job.title || 'Job Title'}
              </CardTitle>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company_name || job.company || 'Company'}</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location || 'Location'}</span>
                {job.job_type && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.job_type}</span>
                  </>
                )}
                {salary && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {salary}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {applied ? (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <BookmarkCheck className="h-4 w-4" /> Applied
                </Badge>
              ) : (
                <Button onClick={handleApply}>
                  Apply Now
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Job Description</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {job.description || 'No description provided.'}
            </p>
          </section>

          {/* Optional tags/skills if present */}
          {Array.isArray((job as any).skills) && (job as any).skills.length > 0 && (
            <section>
              <h3 className="text-base font-medium mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(job as any).skills.map((s: string) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
