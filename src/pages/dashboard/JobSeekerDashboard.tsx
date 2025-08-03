import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  DollarSign, 
  Search,
  LogOut,
  Eye,
  Plus,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Trash2,
  Calendar,
  Send,
  Download,
  Star,
  Sparkles
} from 'lucide-react';

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

interface Resume {
  id: string;
  file_name: string;
  file_url: string;
  skills: string[];
  experience_years: number;
  job_role: string;
  ats_score: number;
  summary: string | string[];
  recommendations?: string[];
  missing_skills?: string[];
  strength_areas?: string[];
}

interface Application {
  id: string;
  status: string;
  created_at: string;
  viewed_at: string | null;
  response_date: string | null;
  cover_letter: string;
  jobs: {
    title: string;
    profiles: {
      company_name: string;
      full_name: string;
    };
  };
}

const JobSeekerDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [canApply, setCanApply] = useState(true);
  const [applicationsLeft, setApplicationsLeft] = useState(3);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [preferredInterviewDate, setPreferredInterviewDate] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user) return;
      
      try {
        // Load data sequentially to avoid conflicts
        await fetchResumes();
        await fetchApplications(); 
        await fetchJobs();
        await checkApplicationLimits();
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    initializeDashboard();
  }, [user]);

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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    }
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            title,
            profiles:company_id (
              company_name,
              full_name
            )
          )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const checkApplicationLimits = async () => {
    if (!user || !profile) return;

    const isPremium = (profile as any).is_premium && 
      (!(profile as any).premium_expires_at || new Date((profile as any).premium_expires_at) > new Date());
    
    if (isPremium) {
      setCanApply(true);
      setApplicationsLeft(-1); // Unlimited
      return;
    }

    const applicationsCount = (profile as any).applications_count || 0;
    const remaining = Math.max(0, 3 - applicationsCount);
    setApplicationsLeft(remaining);
    setCanApply(remaining > 0);
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

  const handleDeleteResume = async (resumeId: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([filePath]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      // Delete resume record from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (dbError) throw dbError;

      toast.success('Resume deleted successfully');
      fetchResumes();
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
    }
  };

  const handleApplyToJob = (jobId: string) => {
    if (!user) {
      toast.error('Please log in to apply for jobs');
      return;
    }

    if (!canApply) {
      toast.error('You have reached your free application limit. Please upgrade to premium to apply for more jobs.');
      return;
    }

    if (resumes.length === 0) {
      toast.error('Please upload a resume before applying to jobs');
      return;
    }

    setSelectedJobId(jobId);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedResumeId || !preferredInterviewDate) {
      toast.error('Please select a resume and preferred interview date');
      return;
    }

    try {
      // Check if user has already applied to this job
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', selectedJobId)
        .eq('applicant_id', user.id)
        .single();

      if (existingApplication) {
        toast.error('You have already applied to this job');
        return;
      }

      // Get selected resume and job details
      const selectedResume = resumes.find(r => r.id === selectedResumeId);
      const selectedJob = jobs.find(j => j.id === selectedJobId);

      if (!selectedResume || !selectedJob) {
        toast.error('Invalid resume or job selection');
        return;
      }

      // Create new application
      const { data: applicationData, error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          job_id: selectedJobId,
          applicant_id: user.id,
          resume_id: selectedResumeId,
          cover_letter: coverLetter,
          status: 'pending'
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Send email notifications
      const { error: emailError } = await supabase.functions
        .invoke('send-application-email', {
          body: {
            hrEmail: selectedJob.profiles.full_name, // Assume this is email for now
            candidateEmail: user.email,
            candidateName: profile?.full_name || 'Unknown',
            jobTitle: selectedJob.title,
            companyName: selectedJob.profiles.company_name,
            resumeUrl: selectedResume.file_url,
            skills: selectedResume.skills || [],
            preferredInterviewDate,
            coverLetter,
            applicationId: applicationData.id
          }
        });

      if (emailError) {
        console.warn('Email notification failed:', emailError);
      }

      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      setSelectedJobId('');
      setSelectedResumeId('');
      setPreferredInterviewDate('');
      setCoverLetter('');
      
      // Refresh data to update counts
      fetchApplications();
      checkApplicationLimits();
    } catch (error: any) {
      console.error('Error applying to job:', error);
      toast.error(error.message || 'Failed to submit application');
    }
  };

  const getStatusBadge = (status: string, viewedAt: string | null, responseDate: string | null) => {
    if (status === 'accepted') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
    if (viewedAt) {
      return <Badge className="bg-blue-100 text-blue-800"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full floating" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-white/5 rounded-full floating-delayed" />
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-white/10 rounded-full floating" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 glass border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate('/')} className="mr-4 text-white hover:bg-white/10">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div className="flex items-center">
                <Sparkles className="h-8 w-8 text-white mr-3" />
                <h1 className="text-2xl font-bold text-white">HireLoop</h1>
              </div>
              <span className="ml-4 text-sm text-white/80">Job Seeker Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {!canApply && applicationsLeft === 0 && (
                <Badge className="bg-warning/20 text-warning border-warning/30 animate-pulse-glow">
                  <Crown className="h-3 w-3 mr-1" />
                  Upgrade to Premium
                </Badge>
              )}
              <span className="text-sm text-white/90">
                Welcome, {profile?.full_name || 'Job Seeker'}
              </span>
              <Button variant="outline" onClick={signOut} className="border-white/30 text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Application Limits Alert */}
        <AnimatePresence>
          {!canApply && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="mb-6 border-warning/30 bg-warning/10 glass">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span className="text-white/90">
                      You've reached your free application limit (3 applications). 
                      Upgrade to premium for unlimited applications.
                    </span>
                    <Button size="sm" className="ml-4 btn-gradient">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resume AI Analysis - Full Width */}
        {resumes.length > 0 && (
          <Card className="shadow-lg border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-2xl">
                <FileText className="h-7 w-7 mr-3 text-blue-600" />
                AI Resume Analysis
              </CardTitle>
              <CardDescription className="text-lg">
                Advanced ATS scoring and skill extraction powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {resumes.map((resume) => (
                 <motion.div 
                   key={resume.id} 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5 }}
                   className="card-modern rounded-xl p-8 hover-lift"
                 >
                   {/* Header Section */}
                   <div className="flex justify-between items-start mb-8">
                     <div className="flex-1">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-xl font-bold text-gray-900">{resume.file_name}</h3>
                         <div className="flex items-center space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             className="text-gray-600 hover:text-blue-600"
                             onClick={() => window.open(resume.file_url, '_blank')}
                           >
                             <Download className="h-4 w-4 mr-1" />
                             View
                           </Button>
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={() => handleDeleteResume(resume.id, resume.file_url)}
                             className="hover:scale-105 transition-transform"
                           >
                             <Trash2 className="h-4 w-4 mr-1" />
                             Delete
                           </Button>
                         </div>
                       </div>
                       {resume.job_role && (
                         <div className="flex items-center mb-2">
                           <Badge className="badge-gradient text-base px-4 py-2">
                             {resume.job_role}
                           </Badge>
                           {resume.experience_years && (
                             <span className="ml-3 text-gray-600 text-lg flex items-center">
                               <Star className="h-4 w-4 mr-1 text-yellow-500" />
                               {resume.experience_years} years experience
                             </span>
                           )}
                         </div>
                       )}
                     </div>
                     {resume.ats_score && (
                       <motion.div 
                         className="text-center"
                         whileHover={{ scale: 1.05 }}
                         transition={{ duration: 0.2 }}
                       >
                         <div className="relative">
                           <div 
                             className="ats-circle mx-auto mb-3 shadow-glow"
                             style={{ '--percentage': `${resume.ats_score}%` } as React.CSSProperties}
                           >
                             <span className="ats-score-text text-gray-900">
                               {resume.ats_score}
                             </span>
                           </div>
                           <div className="text-sm text-gray-500 font-medium">ATS Score</div>
                           <div className={`text-xs mt-1 font-medium ${
                             resume.ats_score >= 80 ? 'text-success' : 
                             resume.ats_score >= 60 ? 'text-warning' : 'text-destructive'
                           }`}>
                             {resume.ats_score >= 80 ? 'Excellent' : 
                              resume.ats_score >= 60 ? 'Good' : 'Needs Improvement'}
                           </div>
                         </div>
                       </motion.div>
                     )}
                  </div>

                   {/* Skills Section */}
                   {resume.skills && resume.skills.length > 0 && (
                     <motion.div 
                       className="mb-8"
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.2 }}
                     >
                       <h4 className="text-lg font-semibold mb-4 flex items-center">
                         <span className="w-4 h-4 bg-gradient-primary rounded-full mr-2 animate-pulse-glow"></span>
                         Technical Skills ({resume.skills.length})
                       </h4>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                         {resume.skills.map((skill, index) => (
                           <motion.div
                             key={index}
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: index * 0.05 }}
                           >
                             <Badge className="skill-tag w-full justify-center">
                               {skill}
                             </Badge>
                           </motion.div>
                         ))}
                       </div>
                     </motion.div>
                   )}

                   {/* Summary Section */}
                   {resume.summary && (
                     <motion.div 
                       className="mb-8"
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.3 }}
                     >
                       <h4 className="text-lg font-semibold mb-4 flex items-center">
                         <span className="w-4 h-4 bg-success rounded-full mr-2"></span>
                         Professional Summary
                       </h4>
                       <div className="glass p-6 border-l-4 border-gradient-primary rounded-lg">
                         {Array.isArray(resume.summary) ? (
                           <ul className="space-y-4">
                             {resume.summary.map((line, index) => (
                               <motion.li 
                                 key={index} 
                                 className="text-gray-700 text-base leading-relaxed flex items-start"
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: 0.4 + index * 0.1 }}
                               >
                                 <span className="w-2 h-2 bg-gradient-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                 {line}
                               </motion.li>
                             ))}
                           </ul>
                         ) : (
                           <p className="text-gray-700 text-base leading-relaxed">{resume.summary}</p>
                         )}
                       </div>
                     </motion.div>
                   )}

                  {/* Recommendations & Missing Skills */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {resume.recommendations && resume.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <span className="w-4 h-4 bg-orange-500 rounded-full mr-2"></span>
                          Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {resume.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {resume.missing_skills && resume.missing_skills.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                          <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                          Skills to Add
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {resume.missing_skills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-sm border-red-200 text-red-700 bg-red-50"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                 </motion.div>
               ))}
             </CardContent>
           </Card>
        )}

        {/* Application Modal */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2 text-primary" />
                Apply for Job
              </DialogTitle>
              <DialogDescription>
                Complete your application with the details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resume-select">Select Resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.file_name} {resume.job_role && `(${resume.job_role})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="interview-date">Preferred Interview Date</Label>
                <Input
                  id="interview-date"
                  type="datetime-local"
                  value={preferredInterviewDate}
                  onChange={(e) => setPreferredInterviewDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              
              <div>
                <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Tell the employer why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                />
              </div>
              
              {selectedResumeId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Your Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {resumes.find(r => r.id === selectedResumeId)?.skills?.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitApplication} className="btn-gradient">
                <Send className="h-4 w-4 mr-2" />
                Submit Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile & Resume Upload */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Profile Summary */}
            <Card className="card-modern hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </span>
                  {applicationsLeft > 0 ? (
                    <Badge className="bg-green-100 text-green-800">
                      {applicationsLeft} Apps Left
                    </Badge>
                  ) : (profile as any)?.is_premium ? (
                    <Badge className="bg-purple-100 text-purple-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      0 Apps Left
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{profile?.full_name || 'Your Name'}</h3>
                    <p className="text-sm text-gray-600">{profile?.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    {profile?.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {profile.phone}
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {profile.location}
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center text-sm">
                        <Globe className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {profile?.bio && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">About</h4>
                      <p className="text-sm text-gray-600">{profile.bio}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card className="card-modern hover-lift">
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
              </CardContent>
            </Card>

            {/* Application Tracking */}
            <Card className="card-modern hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  My Applications ({applications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-6">
                    <Briefcase className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {applications.map((application) => (
                      <div key={application.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{application.jobs.title}</h4>
                          {getStatusBadge(application.status, application.viewed_at, application.response_date)}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {application.jobs.profiles?.company_name || application.jobs.profiles?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Applied: {new Date(application.created_at).toLocaleDateString()}
                        </p>
                        {application.viewed_at && (
                          <p className="text-xs text-blue-600">
                            Viewed: {new Date(application.viewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Search Jobs */}
            <Card className="card-modern">
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
                     filteredJobs.map((job, index) => (
                       <motion.div 
                         key={job.id} 
                         className="card-modern p-6 hover-lift"
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: index * 0.1 }}
                       >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge variant="secondary">{job.job_type?.replace('_', ' ') || 'Full-time'}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {job.profiles?.company_name || job.profiles?.full_name || 'Company'}
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
                                ? `₹${job.salary_min.toLocaleString('en-IN')} - ₹${job.salary_max.toLocaleString('en-IN')}`
                                : job.salary_min
                                ? `₹${job.salary_min.toLocaleString('en-IN')}+`
                                : `Up to ₹${job.salary_max?.toLocaleString('en-IN')}`
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
                             className="hover-lift"
                           >
                             <Eye className="h-4 w-4 mr-1" />
                             View Details
                           </Button>
                           <Button 
                             size="sm" 
                             onClick={() => handleApplyToJob(job.id)}
                             className="btn-gradient hover-lift"
                             disabled={!canApply}
                           >
                             <Send className="h-4 w-4 mr-1" />
                             {!canApply ? 'Upgrade to Apply' : 'Apply Now'}
                           </Button>
                         </div>
                       </motion.div>
                    ))
                  )}
                </div>
               </CardContent>
             </Card>
           </motion.div>
         </div>
      </div>

      {/* Footer */}
      <motion.footer 
        className="glass border-t mt-16 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-white/80">
              © 2024 HireLoop. All rights reserved.
            </p>
            <p className="text-sm text-white/60 mt-2">
              Founders: Sachin Yadav and Sudarshan Krishnamurthy
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default JobSeekerDashboard;