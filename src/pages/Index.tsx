import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, Briefcase, ArrowRight, LogIn, UserPlus } from 'lucide-react';

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
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">Hireloop</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The complete job platform connecting talented job seekers with innovative companies. 
            Upload your resume, get AI-powered analysis, and find your perfect match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/jobs')}
              className="text-lg px-8 py-3"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Browse Jobs
            </Button>
            {!user && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/register')}
                className="text-lg px-8 py-3"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            )}
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

        {/* Features Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose Hireloop?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-600">Get instant ATS scores and skill extraction from your resume</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Smart Matching</h3>
              <p className="text-sm text-gray-600">Connect with jobs that match your skills and experience</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Easy Application</h3>
              <p className="text-sm text-gray-600">Apply to multiple jobs with just one click</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <ArrowRight className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-sm text-gray-600">Track your application status in real-time</p>
            </div>
          </div>
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
