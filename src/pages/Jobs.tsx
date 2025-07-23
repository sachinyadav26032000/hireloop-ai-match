import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, MapPin, DollarSign, Briefcase, Building, ArrowLeft, Heart, Home } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  created_at: string;
  profiles: {
    company_name: string;
    full_name: string;
    bio: string;
    website: string;
  };
}

const Jobs = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchAppliedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:company_id (
            company_name,
            full_name,
            bio,
            website
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', user.id);

      if (error) throw error;
      setAppliedJobs(data?.map(app => app.job_id) || []);
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  const applyToJob = async (jobId: string) => {
    if (!user) {
      toast.error('Please log in to apply for jobs');
      navigate('/login');
      return;
    }

    if (profile?.user_type !== 'job_seeker') {
      toast.error('Only job seekers can apply for jobs');
      return;
    }

    try {
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single();

      if (existingApplication) {
        toast.error('You have already applied to this job');
        return;
      }

      // Get user's latest resume
      const { data: resumes } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const resumeId = resumes?.[0]?.id;

      // Submit application
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          resume_id: resumeId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Application submitted successfully!');
      setAppliedJobs(prev => [...prev, jobId]);
    } catch (error: any) {
      console.error('Error applying to job:', error);
      toast.error(error.message || 'Failed to submit application');
    }
  };

  const saveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(prev => prev.filter(id => id !== jobId));
      toast.success('Job removed from saved');
    } else {
      setSavedJobs(prev => [...prev, jobId]);
      toast.success('Job saved successfully');
    }
  };

  // Filter jobs based on search criteria
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesJobType = !jobTypeFilter || jobTypeFilter === 'all' || job.job_type === jobTypeFilter;

    const matchesSalary = !salaryFilter || salaryFilter === 'all' || (() => {
      const minSalary = job.salary_min || 0;
      switch (salaryFilter) {
        case '0-50k': return minSalary < 50000;
        case '50k-100k': return minSalary >= 50000 && minSalary < 100000;
        case '100k-150k': return minSalary >= 100000 && minSalary < 150000;
        case '150k+': return minSalary >= 150000;
        default: return true;
      }
    })();

    return matchesSearch && matchesLocation && matchesJobType && matchesSalary;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Hireloop</h1>
              <span className="ml-4 text-sm text-gray-600">Job Search</span>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {profile?.full_name || 'User'}
                </span>
                <Button
                  variant="outline"
                  onClick={() => {
                    switch (profile?.user_type) {
                      case 'job_seeker':
                        navigate('/dashboard/jobseeker');
                        break;
                      case 'company':
                        navigate('/dashboard/company');
                        break;
                      case 'hr':
                        navigate('/dashboard/hr');
                        break;
                      default:
                        navigate('/');
                    }
                  }}
                >
                  Dashboard
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Find Your Perfect Job
            </CardTitle>
            <CardDescription>
              Search through {jobs.length} active job opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div>
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={salaryFilter} onValueChange={setSalaryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Salary" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Salary</SelectItem>
                    <SelectItem value="0-50k">Under $50k</SelectItem>
                    <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                    <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                    <SelectItem value="150k+">$150k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredJobs.length}</span> of{' '}
            <span className="font-semibold">{jobs.length}</span> jobs
          </p>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search filters to find more opportunities.
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setLocationFilter('');
                setJobTypeFilter('all');
                setSalaryFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Building className="h-4 w-4 mr-2" />
                        <span>{job.profiles?.company_name || job.profiles?.full_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveJob(job.id)}
                        className={savedJobs.includes(job.id) ? 'text-red-500' : 'text-gray-400'}
                      >
                        <Heart className={`h-4 w-4 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                      </Button>
                      <Badge variant="secondary">
                        {job.job_type?.replace('_', ' ') || 'Full-time'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary_min && job.salary_max
                            ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                            : job.salary_min
                            ? `$${job.salary_min.toLocaleString()}+`
                            : `Up to $${job.salary_max?.toLocaleString()}`
                          }
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 line-clamp-3">
                      {job.description}
                    </p>

                    {job.requirements && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-1">Requirements:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {job.requirements}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-xs text-gray-500">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {appliedJobs.includes(job.id) ? (
                          <Button size="sm" disabled>
                            Applied
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => applyToJob(job.id)}
                            disabled={!user || profile?.user_type !== 'job_seeker'}
                          >
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 Hireloop. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Founders: Sachin Yadav and Sudarshan Krishnamurthy
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Jobs;