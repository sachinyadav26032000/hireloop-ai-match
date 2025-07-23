import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Users, Building, LogOut, Briefcase, MapPin, DollarSign, UserPlus } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  job_type: string;
  profiles: {
    company_name: string;
    full_name: string;
  };
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  location: string;
  resumes: Array<{
    job_role: string;
    experience_years: number;
    skills: string[];
    ats_score: number;
  }>;
}

const HRDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchJobs();
    fetchCandidates();
  }, [user, navigate]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:company_id (
            company_name,
            full_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          resumes (
            job_role,
            experience_years,
            skills,
            ats_score
          )
        `)
        .eq('user_type', 'job_seeker');

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Failed to load candidates');
    }
  };

  const referCandidate = async (jobId: string, candidateId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if already referred
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', candidateId)
        .single();

      if (existingApplication) {
        toast.error('Candidate already applied or referred to this job');
        return;
      }

      // Create application with referred status
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: candidateId,
          status: 'reviewed', // Start with reviewed status for referred candidates
          cover_letter: `Referred by HR: ${profile?.full_name || 'HR Professional'}`
        });

      if (error) throw error;

      toast.success('Candidate referred successfully!');
    } catch (error: any) {
      console.error('Error referring candidate:', error);
      toast.error(error.message || 'Failed to refer candidate');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.profiles?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates.filter(candidate =>
    candidate.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.resumes?.some(resume =>
      resume.job_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const stats = {
    totalJobs: jobs.length,
    totalCandidates: candidates.length,
    experiencedCandidates: candidates.filter(c => 
      c.resumes?.some(r => r.experience_years >= 3)
    ).length,
    highScoreCandidates: candidates.filter(c => 
      c.resumes?.some(r => r.ats_score >= 80)
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
                <Users className="h-4 w-4 mr-2" />
                Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Hireloop</h1>
              <span className="ml-4 text-sm text-gray-600">HR Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {profile?.full_name || 'HR Professional'}
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
                  <p className="text-sm font-medium text-gray-600">Open Positions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Experienced (3+ yrs)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.experiencedCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High ATS Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.highScoreCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Jobs & Candidates
            </CardTitle>
            <CardDescription>
              Find the perfect match between open positions and available candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search jobs, candidates, skills, or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Open Positions ({filteredJobs.length})
              </CardTitle>
              <CardDescription>Active job openings from companies</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No jobs found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge variant="secondary">{job.job_type?.replace('_', ' ') || 'Full-time'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {job.profiles?.company_name || job.profiles?.full_name}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
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
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        View Details & Refer Candidates
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Available Candidates ({filteredCandidates.length})
              </CardTitle>
              <CardDescription>Job seekers looking for opportunities</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No candidates found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCandidates.map((candidate) => {
                    const latestResume = candidate.resumes?.[0];
                    return (
                      <div key={candidate.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{candidate.full_name}</h3>
                          {latestResume?.ats_score && (
                            <Badge 
                              variant={latestResume.ats_score >= 80 ? "default" : "secondary"}
                            >
                              ATS: {latestResume.ats_score}/100
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{candidate.email}</p>
                        {candidate.location && (
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {candidate.location}
                          </div>
                        )}
                        {latestResume && (
                          <div className="mb-3">
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {latestResume.job_role && (
                                <span><strong>Role:</strong> {latestResume.job_role}</span>
                              )}
                              {latestResume.experience_years && (
                                <span><strong>Exp:</strong> {latestResume.experience_years} yrs</span>
                              )}
                            </div>
                            {latestResume.skills && latestResume.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {latestResume.skills.slice(0, 4).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {latestResume.skills.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{latestResume.skills.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {candidate.bio && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                            {candidate.bio}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                          <Button size="sm">
                            Refer to Job
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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

export default HRDashboard;