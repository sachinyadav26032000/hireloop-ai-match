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
            {/* Left spacer for balance */}
            <div className="flex-1" />

            {/* Center - Logo */}
            <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                HireLoop
              </h1>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-violet-300 text-sm">
                <Zap className="h-3.5 w-3.5 animate-pulse" />
                AI-POWERED
              </span>
            </div>

            {/* Right - Navigation */}
            <div className="flex items-center space-x-6 flex-1 justify-end">
              <nav className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                >
                  About Us
                </button>
                <button
                  onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Services
                </button>
                <button
                  onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Pricing
                </button>
              </nav>
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
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
                  <Button variant="outline" size="sm" onClick={signOut} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    size="sm"
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
            <span className="text-violet-300 font-semibold">Empowering careers</span>, one connection at a time.
            We believe everyone deserves a career that <span className="text-emerald-400 font-semibold">inspires them</span> —
            and the tools to make it happen.
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
              <span className="text-sm">Secure & Private</span>
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

        {/* How It Works - Bot-shaped clickable cards */}
        <div className="mb-20 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000 delay-500">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">How It Works</span>
          </h2>
          <p className="text-zinc-500 text-center mb-12">Your journey to the perfect job in 4 simple steps</p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { step: 1, title: "Tell Us About You", desc: "Write a few sentences about your background and goals", icon: User, gradient: "from-violet-500 to-purple-600" },
              { step: 2, title: "AI Analysis", desc: "We identify your skills, experience level, and ideal roles", icon: Brain, gradient: "from-purple-500 to-pink-600" },
              { step: 3, title: "Get Your CV", desc: "Download an ATS-optimized CV ready to use", icon: FileText, gradient: "from-emerald-500 to-teal-600" },
              { step: 4, title: "Apply to Jobs", desc: "See matched jobs with explanations for why they fit", icon: Target, gradient: "from-amber-500 to-orange-600" },
            ].map((item, i) => (
              <button
                key={item.step}
                onClick={() => navigate('/assistant')}
                className="flex flex-col items-center w-40 md:w-48 group cursor-pointer focus:outline-none animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Bot Container */}
                <div className="relative mb-4 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                  {/* Step Number - Top */}
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg z-20",
                    `bg-gradient-to-br ${item.gradient}`
                  )}>
                    {item.step}
                  </div>

                  {/* Bot Body */}
                  <div className="relative w-24 h-28 md:w-28 md:h-32">
                    {/* Bot Head */}
                    <div className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 md:w-24 md:h-24 rounded-2xl",
                      "bg-gradient-to-br from-zinc-800 to-zinc-900",
                      "border-2 border-zinc-700 group-hover:border-zinc-500",
                      "shadow-lg group-hover:shadow-xl transition-all duration-300",
                      "flex flex-col items-center justify-center overflow-hidden"
                    )}>
                      {/* Glow effect on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />

                      {/* Bot Eyes */}
                      <div className="flex gap-3 mb-1.5 relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 group-hover:bg-cyan-400 transition-colors duration-300 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-600 group-hover:bg-cyan-400 transition-colors duration-300 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                      </div>

                      {/* Bot Screen with Icon */}
                      <div className={cn(
                        "w-12 h-9 md:w-14 md:h-10 rounded-lg flex items-center justify-center relative z-10",
                        `bg-gradient-to-br ${item.gradient}`,
                        "shadow-md"
                      )}>
                        <item.icon className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform duration-300" />
                        {/* Scan line */}
                        <div className="absolute inset-0 overflow-hidden rounded-lg">
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/30 animate-scan-slow" />
                        </div>
                      </div>

                      {/* Bot Mouth */}
                      <div className="flex gap-0.5 mt-1.5 relative z-10">
                        <div className="w-1 h-1.5 bg-zinc-600 rounded-full group-hover:bg-zinc-400 transition-colors" />
                        <div className="w-1 h-2 bg-zinc-600 rounded-full group-hover:bg-zinc-400 transition-colors" />
                        <div className="w-1 h-2.5 bg-zinc-600 rounded-full group-hover:bg-zinc-400 transition-colors" />
                        <div className="w-1 h-2 bg-zinc-600 rounded-full group-hover:bg-zinc-400 transition-colors" />
                        <div className="w-1 h-1.5 bg-zinc-600 rounded-full group-hover:bg-zinc-400 transition-colors" />
                      </div>
                    </div>

                    {/* Bot Ears */}
                    <div className="absolute top-8 md:top-10 -left-0.5 w-1.5 h-6 bg-zinc-700 rounded-l group-hover:bg-zinc-600 transition-colors" />
                    <div className="absolute top-8 md:top-10 -right-0.5 w-1.5 h-6 bg-zinc-700 rounded-r group-hover:bg-zinc-600 transition-colors" />

                    {/* Bot Neck */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-3 bg-zinc-700 rounded-b group-hover:bg-zinc-600 transition-colors" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-white text-center mb-1.5 group-hover:text-violet-300 transition-colors duration-300">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs md:text-sm text-zinc-500 text-center leading-snug group-hover:text-zinc-400 transition-colors">
                  {item.desc}
                </p>

                {/* Click indicator on hover */}
                <div className="mt-3 h-6 flex items-center justify-center">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full text-white shadow-md",
                    `bg-gradient-to-r ${item.gradient}`,
                    "opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                  )}>
                    <Sparkles className="h-3 w-3" />
                    Start
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Type Cards - Enhanced */}
        <div id="about-section" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
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
        <div id="services-section" className="rounded-3xl p-12 mb-20 relative overflow-hidden animate-in fade-in-0 duration-1000" style={{ background: 'linear-gradient(135deg, rgba(17, 17, 27, 0.8) 0%, rgba(31, 31, 45, 0.8) 100%)' }}>
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

        {/* Pricing Section */}
        <div id="pricing-section" className="mb-20 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-zinc-400">Choose the plan that fits your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-white">Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">Free</span>
                </div>
                <CardDescription className="text-zinc-500 mt-2">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Basic resume analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    5 job matches per day
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Basic LinkedIn tips
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  variant="outline"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="bg-gradient-to-b from-violet-600/20 to-purple-600/10 border-violet-500/30 hover:border-violet-500/50 transition-all duration-300 hover:scale-[1.05] relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-white">Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">₹499</span>
                  <span className="text-zinc-400 text-sm">/month</span>
                </div>
                <CardDescription className="text-zinc-400 mt-2">For serious job seekers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Advanced AI resume optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Unlimited job matches
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    LinkedIn profile overhaul
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ATS score optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Priority support
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/30"
                  onClick={() => navigate('/register')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-white">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">Custom</span>
                </div>
                <CardDescription className="text-zinc-500 mt-2">For companies & HR teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm text-zinc-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Everything in Professional
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Bulk candidate screening
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Custom integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Dedicated account manager
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  variant="outline"
                  onClick={() => navigate('/register')}
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
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
                Join thousands of professionals who transformed their careers. Get your optimized CV, LinkedIn profile, and job matches in <span className="font-bold underline">minutes</span>.
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

        @keyframes scan-vertical {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(3200%); }
        }

        @keyframes scan-slow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(2800%); }
        }

        @keyframes float-particle {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0); opacity: 0; }
        }

        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.3; }
        }

        .animate-float {
          animation: float 10s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-scan-vertical {
          animation: scan-vertical 2s ease-in-out infinite;
        }

        .animate-scan-slow {
          animation: scan-slow 3s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle 1s ease-out forwards;
        }

        .animate-blink {
          animation: blink 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Index;
