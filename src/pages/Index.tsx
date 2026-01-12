import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, Briefcase, ArrowRight, LogIn, UserPlus, Sparkles, FileText, Linkedin, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hireloop</h1>
              <span className="ml-4 text-sm text-gray-600">Job Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
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
                  <Button variant="outline" onClick={signOut}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Job Assistant
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            From "I need a job" to <span className="text-blue-600">Job-Ready</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Tell us about yourself in 2-3 sentences. Our AI will create your CV,
            optimize your LinkedIn, and find jobs that match your skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/assistant')}
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start AI Assistant
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/jobs')}
              className="text-lg px-8 py-6"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Browse Jobs
            </Button>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Tell Us About You</h3>
              <p className="text-sm text-gray-600">Write a few sentences about your background and goals</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">We identify your skills, experience level, and ideal roles</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Get Your CV</h3>
              <p className="text-sm text-gray-600">Download an ATS-optimized CV ready to use</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Apply to Jobs</h3>
              <p className="text-sm text-gray-600">See matched jobs with explanations for why they fit</p>
            </div>
          </div>
        </div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/register')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Job Seekers</CardTitle>
              <CardDescription>Find your dream job with AI-powered matching</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Upload resume with AI analysis</li>
                <li>• Get ATS score and skill extraction</li>
                <li>• Apply to jobs with one click</li>
                <li>• Match with perfect opportunities</li>
              </ul>
              <Button className="w-full mt-4" onClick={() => navigate('/register')}>
                Join as Job Seeker
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/register')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Companies</CardTitle>
              <CardDescription>Post jobs and find the best talent</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Post unlimited job openings</li>
                <li>• Manage applications efficiently</li>
                <li>• Track hiring analytics</li>
                <li>• Find qualified candidates</li>
              </ul>
              <Button className="w-full mt-4" onClick={() => navigate('/register')}>
                Join as Company
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/register')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">HR & Freelancers</CardTitle>
              <CardDescription>Connect candidates with opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Browse all open positions</li>
                <li>• Refer qualified candidates</li>
                <li>• Track referral success</li>
                <li>• Build your network</li>
              </ul>
              <Button className="w-full mt-4" onClick={() => navigate('/register')}>
                Join as HR/Freelancer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Our Services Section */}
        <div className="bg-gray-900 text-white rounded-2xl p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-gray-300">Comprehensive hiring solutions powered by AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="mb-4 p-3 bg-blue-500 rounded-full w-fit">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">ATS Optimization</h3>
              <p className="text-gray-300 mb-4">Advanced resume scanning with AI-powered ATS score analysis to improve your job application success rate.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Real-time ATS scoring</li>
                <li>• Keyword optimization</li>
                <li>• Format compliance check</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="mb-4 p-3 bg-green-500 rounded-full w-fit">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Resume Parsing & Skills Extraction</h3>
              <p className="text-gray-300 mb-4">Intelligent extraction of skills, experience, and qualifications from any resume format.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• PDF/DOCX support</li>
                <li>• Technical skill detection</li>
                <li>• Experience calculation</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="mb-4 p-3 bg-purple-500 rounded-full w-fit">
                <Building className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Job Matching & Recommendations</h3>
              <p className="text-gray-300 mb-4">Smart algorithms match candidates with relevant opportunities based on skills and experience.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• AI-powered matching</li>
                <li>• Personalized recommendations</li>
                <li>• Skill gap analysis</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="mb-4 p-3 bg-orange-500 rounded-full w-fit">
                <ArrowRight className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interview Scheduling</h3>
              <p className="text-gray-300 mb-4">Streamlined interview coordination with automated scheduling and candidate management.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Automated scheduling</li>
                <li>• Calendar integration</li>
                <li>• Interview reminders</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="mb-4 p-3 bg-indigo-500 rounded-full w-fit">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Candidate Management</h3>
              <p className="text-gray-300 mb-4">Comprehensive dashboard for tracking applications, candidate progress, and hiring analytics.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Application tracking</li>
                <li>• Candidate profiles</li>
                <li>• Hiring analytics</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="mb-4 p-3 bg-teal-500 rounded-full w-fit">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-Time Collaboration</h3>
              <p className="text-gray-300 mb-4">Enable seamless collaboration between HR teams, candidates, and hiring managers.</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Team collaboration tools</li>
                <li>• Real-time updates</li>
                <li>• Notification system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
                No account required. Just tell us about yourself and get your CV, LinkedIn tips, and job matches in minutes.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/assistant')}
                className="text-lg px-8 py-6"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Launch AI Assistant
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
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

export default Index;
