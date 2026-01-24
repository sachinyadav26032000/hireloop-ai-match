import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  Building,
  Users,
  User,
  Briefcase,
  ArrowRight,
  LogIn,
  UserPlus,
  Sparkles,
  FileText,
  Linkedin,
  CheckCircle,
  Zap,
  Target,
  Award,
  TrendingUp,
  Brain,
  Rocket,
  Shield,
  Clock,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-violet-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                HireLoop
              </h1>
              <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-violet-300 text-sm">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                AI-Powered
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-zinc-400">
                    Welcome, <span className="text-violet-300 font-medium">{profile?.full_name || 'User'}</span>
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
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    Dashboard
                  </Button>
                  <Button variant="outline" onClick={signOut} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30"
                  >
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 mb-8 animate-in zoom-in-50 duration-500">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
              <div className="absolute inset-0 bg-violet-400 rounded-full blur animate-ping opacity-30" />
            </div>
            <span className="text-violet-300 text-sm font-medium">AI-Powered Job Assistant</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>

          {/* Main heading with gradient */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">From </span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                "I need a job"
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse" />
            </span>
            <br />
            <span className="text-white">to </span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">
                Job-Ready
              </span>
              <Zap className="absolute -top-4 -right-8 h-8 w-8 text-amber-400 animate-bounce" />
            </span>
          </h1>

          <p className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-in fade-in-0 duration-1000 delay-300">
            Tell us about yourself in <span className="text-violet-300 font-semibold">2-3 sentences</span>. Our AI will create your CV,
            optimize your LinkedIn, and find jobs that <span className="text-emerald-400 font-semibold">match your skills</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
            <Button
              size="lg"
              onClick={() => navigate('/assistant')}
              className="text-lg px-10 py-7 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-violet-500/30 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/50 group"
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Your Journey Starts Here
              <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/jobs')}
              className="text-lg px-8 py-7 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all duration-300"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Browse Jobs
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-8 mt-12 text-zinc-500 animate-in fade-in-0 duration-1000 delay-700">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm">No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-400" />
              <span className="text-sm">Ready in minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm">AI-powered</span>
            </div>
          </div>
        </div>

        {/* How It Works - Enhanced with animations */}
        <div className="mb-20 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000 delay-500">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">How It Works</span>
          </h2>
          <p className="text-zinc-500 text-center mb-12">Your journey to the perfect job in 4 simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: "Tell Us About You", desc: "Write a few sentences about your background and goals", icon: User, color: "violet" },
              { step: 2, title: "AI Analysis", desc: "We identify your skills, experience level, and ideal roles", icon: Brain, color: "purple" },
              { step: 3, title: "Get Your CV", desc: "Download an ATS-optimized CV ready to use", icon: FileText, color: "emerald" },
              { step: 4, title: "Apply to Jobs", desc: "See matched jobs with explanations for why they fit", icon: Target, color: "amber" },
            ].map((item, i) => (
              <div
                key={item.step}
                className="text-center group animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={cn(
                  "relative w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl",
                  `bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/10 border border-${item.color}-500/30 group-hover:shadow-${item.color}-500/20`
                )}>
                  <item.icon className={`h-7 w-7 text-${item.color}-400`} />
                  <div className={cn(
                    "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    `bg-${item.color}-500 text-white`
                  )}>
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {item.desc}
                </p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 right-0 translate-x-1/2 -translate-y-8">
                    <ArrowRight className="h-5 w-5 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Type Cards - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: Briefcase,
              title: "Job Seekers",
              desc: "Find your dream job with AI-powered matching",
              color: "violet",
              features: ["Upload resume with AI analysis", "Get ATS score and skill extraction", "Apply to jobs with one click", "Match with perfect opportunities"]
            },
            {
              icon: Building,
              title: "Companies",
              desc: "Post jobs and find the best talent",
              color: "emerald",
              features: ["Post unlimited job openings", "Manage applications efficiently", "Track hiring analytics", "Find qualified candidates"]
            },
            {
              icon: Users,
              title: "HR & Freelancers",
              desc: "Connect candidates with opportunities",
              color: "amber",
              features: ["Browse all open positions", "Refer qualified candidates", "Track referral success", "Build your network"]
            }
          ].map((card, i) => (
            <Card
              key={card.title}
              className={cn(
                "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-500 cursor-pointer group animate-in fade-in-0 slide-in-from-bottom-8 overflow-hidden relative",
                `hover:shadow-2xl hover:shadow-${card.color}-500/10`
              )}
              style={{ animationDelay: `${i * 200}ms` }}
              onClick={() => navigate('/register')}
            >
              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                `bg-gradient-to-br from-${card.color}-500/5 to-transparent`
              )} />

              <CardHeader className="text-center relative">
                <div className={cn(
                  "mx-auto mb-4 p-4 rounded-2xl w-fit transition-all duration-300 group-hover:scale-110",
                  `bg-gradient-to-br from-${card.color}-500/20 to-${card.color}-600/10 border border-${card.color}-500/30 group-hover:shadow-lg group-hover:shadow-${card.color}-500/20`
                )}>
                  <card.icon className={`h-8 w-8 text-${card.color}-400`} />
                </div>
                <CardTitle className="text-xl text-white group-hover:text-violet-300 transition-colors">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {card.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ul className="space-y-2 text-sm text-zinc-400 mb-4">
                  {card.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform" style={{ transitionDelay: `${j * 50}ms` }}>
                      <CheckCircle className={`h-4 w-4 text-${card.color}-400 flex-shrink-0`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "w-full transition-all duration-300",
                    `bg-gradient-to-r from-${card.color}-600 to-${card.color === 'violet' ? 'purple' : card.color === 'emerald' ? 'teal' : 'orange'}-600 hover:from-${card.color}-500 hover:to-${card.color === 'violet' ? 'purple' : card.color === 'emerald' ? 'teal' : 'orange'}-500 text-white shadow-lg shadow-${card.color}-500/20`
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/register');
                  }}
                >
                  Join as {card.title.replace(' & ', '/')}
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Services Section - Dark & Enhanced */}
        <div className="rounded-3xl p-12 mb-20 relative overflow-hidden animate-in fade-in-0 duration-1000" style={{ background: 'linear-gradient(135deg, rgba(17, 17, 27, 0.8) 0%, rgba(31, 31, 45, 0.8) 100%)' }}>
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Our Services
              </span>
            </h2>
            <p className="text-xl text-zinc-400">Comprehensive hiring solutions powered by <span className="text-violet-300 font-semibold">AI</span></p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, title: "ATS Optimization", desc: "Advanced resume scanning with AI-powered ATS score analysis", features: ["Real-time ATS scoring", "Keyword optimization", "Format compliance check"], color: "violet" },
              { icon: Users, title: "Resume Parsing & Skills", desc: "Intelligent extraction of skills, experience, and qualifications", features: ["PDF/DOCX support", "Technical skill detection", "Experience calculation"], color: "emerald" },
              { icon: Building, title: "Job Matching", desc: "Smart algorithms match candidates with relevant opportunities", features: ["AI-powered matching", "Personalized recommendations", "Skill gap analysis"], color: "purple" },
              { icon: ArrowRight, title: "Interview Scheduling", desc: "Streamlined interview coordination with automated scheduling", features: ["Automated scheduling", "Calendar integration", "Interview reminders"], color: "amber" },
              { icon: Users, title: "Candidate Management", desc: "Comprehensive dashboard for tracking applications", features: ["Application tracking", "Candidate profiles", "Hiring analytics"], color: "cyan" },
              { icon: Briefcase, title: "Real-Time Collaboration", desc: "Enable seamless collaboration between HR teams", features: ["Team collaboration tools", "Real-time updates", "Notification system"], color: "pink" },
            ].map((service, i) => (
              <div
                key={service.title}
                className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/5 group animate-in fade-in-0 slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn(
                  "mb-4 p-3 rounded-xl w-fit transition-all duration-300 group-hover:scale-110",
                  `bg-gradient-to-br from-${service.color}-500/20 to-${service.color}-600/10 border border-${service.color}-500/30`
                )}>
                  <service.icon className={`h-6 w-6 text-${service.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-violet-300 transition-colors">{service.title}</h3>
                <p className="text-zinc-400 mb-4 text-sm">{service.desc}</p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  {service.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform" style={{ transitionDelay: `${j * 30}ms` }}>
                      <span className={`w-1.5 h-1.5 bg-${service.color}-400 rounded-full`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section - Enhanced */}
        <div className="text-center animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
          <Card className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 border-0 overflow-hidden relative">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/50 via-purple-600/50 to-pink-600/50 animate-gradient-x" />
            <div className="absolute inset-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-64 h-64 rounded-full opacity-20 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.5}s`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </div>

            <CardContent className="py-16 relative">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm animate-bounce">
                  <Rocket className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
              <p className="text-lg text-violet-100 mb-8 max-w-2xl mx-auto">
                No account required. Just tell us about yourself and get your CV, LinkedIn tips, and job matches in <span className="font-bold underline">minutes</span>.
              </p>
              <Button
                size="lg"
                variant="white"
                onClick={() => navigate('/assistant')}
                className="text-lg px-10 py-7 transition-all duration-300 hover:scale-105 group"
              >
                <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin" />
                Launch AI Assistant
                <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-zinc-900/50 backdrop-blur-xl border-t border-zinc-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              HireLoop
            </h3>
            <p className="text-sm text-zinc-500 mb-2">
              © 2024 HireLoop. All rights reserved.
            </p>
            <p className="text-sm text-zinc-600">
              Founders: <span className="text-violet-400">Sachin Yadav</span> and <span className="text-purple-400">Sudarshan Krishnamurthy</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Custom animations CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-float {
          animation: float 10s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;
