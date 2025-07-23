import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, Briefcase, User, Search, LogOut, MapPin, DollarSign } from 'lucide-react';

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
  };
}

interface Resume {
  id: string;
  file_name: string;
  file_url: string;
  skills: string[];
  experience_years: number;
  job_role: string;
  ats_score: number;
  summary: string;
}

const JobSeekerDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchJobs();
    fetchResumes();
  }, [user, navigate]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles:company_id (
            company_name
          )
        `)
        .eq('status', 'active')
        .limit(6);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const fetchResumes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    setUploading(true);
    setAnalyzing(true);

    try {
      // Upload file to Supabase storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Call AI analysis function
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-resume', {
          body: { 
            fileUrl: urlData.publicUrl,
            fileName: file.name 
          }
        });

      if (analysisError) throw analysisError;

      // Save resume with analysis to database
      const { error: insertError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          skills: analysisData.skills || [],
          experience_years: analysisData.experience_years || 0,
          job_role: analysisData.job_role || '',
          ats_score: analysisData.ats_score || 0,
          summary: analysisData.summary || '',
          recommendations: analysisData.recommendations || [],
          missing_skills: analysisData.missing_skills || [],
          strength_areas: analysisData.strength_areas || []
        });

      if (insertError) throw insertError;

      toast.success('Resume uploaded and analyzed successfully!');
      fetchResumes();
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast.error(error.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    if (!user) {
      toast.error('Please log in to apply for jobs');
      return;
    }

    try {
      // Check if user has already applied to this job
      const { data: existingApplication, error: checkError } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw checkError;
      }

      if (existingApplication) {
        toast.error('You have already applied to this job');
        return;
      }

      // Submit job application
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast.success('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error applying to job:', error);
      toast.error(error.message || 'Failed to submit application');
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hireloop</h1>
              <span className="ml-4 text-sm text-gray-600">Job Seeker Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {profile?.full_name || 'Job Seeker'}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile & Resume */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {profile?.full_name}</p>
                  <p><strong>Email:</strong> {profile?.email}</p>
                  <p><strong>Location:</strong> {profile?.location || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Resume Upload
                </CardTitle>
                <CardDescription>
                  Upload your resume for AI analysis (PDF, DOC, DOCX - Max 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {analyzing ? 'Analyzing resume with AI...' : 'Click to upload or drag and drop'}
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload">
                      <Button
                        variant="outline"
                        disabled={uploading}
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>

                {/* Resume Analysis Results */}
                {resumes.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium">Your Resumes</h4>
                    {resumes.map((resume) => (
                      <div key={resume.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-sm">{resume.file_name}</h5>
                          {resume.ats_score && (
                            <Badge variant="secondary">
                              ATS Score: {resume.ats_score}/100
                            </Badge>
                          )}
                        </div>
                        {resume.job_role && (
                          <p className="text-sm text-gray-600">
                            <strong>Role:</strong> {resume.job_role}
                          </p>
                        )}
                        {resume.experience_years && (
                          <p className="text-sm text-gray-600">
                            <strong>Experience:</strong> {resume.experience_years} years
                          </p>
                        )}
                        {resume.skills && resume.skills.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {resume.skills.slice(0, 6).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {resume.skills.length > 6 && (
                                <Badge variant="outline" className="text-xs">
                                  +{resume.skills.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {resume.summary && (
                          <p className="text-sm text-gray-600">
                            <strong>Summary:</strong> {resume.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Available Jobs
                </CardTitle>
                <CardDescription>Find jobs that match your skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search jobs by title, description, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={() => navigate('/jobs')}>
                    <Search className="h-4 w-4 mr-2" />
                    View All Jobs
                  </Button>
                </div>

                {/* Job Listings */}
                <div className="space-y-4">
                  {filteredJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No jobs found matching your search.</p>
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge variant="secondary">{job.job_type?.replace('_', ' ') || 'Full-time'}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {job.profiles?.company_name || 'Company'}
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
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {job.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApplyToJob(job.id)}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

export default JobSeekerDashboard;