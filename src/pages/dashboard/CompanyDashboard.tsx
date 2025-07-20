import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building, Plus, Users, Eye, LogOut, Briefcase, MapPin, DollarSign } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  jobs: {
    title: string;
  };
}

const CompanyDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchJobs();
    fetchApplications();
  }, [user, navigate]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles:applicant_id (
            full_name,
            email
          ),
          jobs (
            title
          )
        `)
        .in('job_id', jobs.map(job => job.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          company_id: user.id,
          title: jobForm.title,
          description: jobForm.description,
          requirements: jobForm.requirements,
          location: jobForm.location,
          salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
          salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
          job_type: jobForm.job_type,
          status: 'active',
        });

      if (error) throw error;

      toast.success('Job posted successfully!');
      setShowJobForm(false);
      setJobForm({
        title: '',
        description: '',
        requirements: '',
        location: '',
        salary_min: '',
        salary_max: '',
        job_type: '',
      });
      fetchJobs();
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error(error.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);

      if (error) throw error;

      toast.success(`Job ${status} successfully!`);
      fetchJobs();
    } catch (error: any) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success(`Application status updated to ${status}!`);
      fetchApplications();
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(job => job.status === 'active').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(app => app.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hireloop</h1>
              <span className="ml-4 text-sm text-gray-600">Company Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {profile?.company_name || profile?.full_name || 'Company'}
              </span>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Posting Form */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    Post New Job
                  </CardTitle>
                  <Button
                    onClick={() => setShowJobForm(!showJobForm)}
                    variant={showJobForm ? "outline" : "default"}
                  >
                    {showJobForm ? 'Cancel' : 'Post Job'}
                  </Button>
                </div>
              </CardHeader>
              {showJobForm && (
                <CardContent>
                  <form onSubmit={handleJobSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          value={jobForm.title}
                          onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                          placeholder="e.g. Senior Software Engineer"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={jobForm.location}
                          onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                          placeholder="e.g. San Francisco, CA"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea
                        id="description"
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        placeholder="Describe the role, responsibilities, and what you're looking for..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requirements">Requirements</Label>
                      <Textarea
                        id="requirements"
                        value={jobForm.requirements}
                        onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                        placeholder="List the required skills, experience, education..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="job_type">Job Type</Label>
                        <Select
                          value={jobForm.job_type}
                          onValueChange={(value) => setJobForm({ ...jobForm, job_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full Time</SelectItem>
                            <SelectItem value="part_time">Part Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="remote">Remote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary_min">Min Salary</Label>
                        <Input
                          id="salary_min"
                          type="number"
                          value={jobForm.salary_min}
                          onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                          placeholder="50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary_max">Max Salary</Label>
                        <Input
                          id="salary_max"
                          type="number"
                          value={jobForm.salary_max}
                          onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                          placeholder="80000"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Posting...' : 'Post Job'}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* Your Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Your Posted Jobs</CardTitle>
                <CardDescription>Manage your job postings and applications</CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No jobs posted yet. Create your first job posting!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge
                            variant={job.status === 'active' ? 'default' : 'secondary'}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1" />
                            {job.job_type?.replace('_', ' ') || 'Full-time'}
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
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex gap-2">
                          {job.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateJobStatus(job.id, 'paused')}
                            >
                              Pause
                            </Button>
                          )}
                          {job.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateJobStatus(job.id, 'active')}
                            >
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, 'closed')}
                          >
                            Close
                          </Button>
                          <Button size="sm">
                            View Applications
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Applications */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recent Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No applications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((application) => (
                      <div key={application.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">
                              {application.profiles?.full_name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {application.jobs?.title}
                            </p>
                          </div>
                          <Badge
                            variant={
                              application.status === 'pending'
                                ? 'outline'
                                : application.status === 'accepted'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {application.profiles?.email}
                        </p>
                        <div className="flex gap-1">
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6"
                                onClick={() => updateApplicationStatus(application.id, 'reviewed')}
                              >
                                Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6"
                                onClick={() => updateApplicationStatus(application.id, 'interview')}
                              >
                                Interview
                              </Button>
                            </>
                          )}
                          {application.status === 'reviewed' && (
                            <Button
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => updateApplicationStatus(application.id, 'accepted')}
                            >
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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

export default CompanyDashboard;