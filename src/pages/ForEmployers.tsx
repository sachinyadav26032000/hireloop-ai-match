import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Clock, 
  Shield, 
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Target,
  Briefcase,
  UserCheck,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForEmployers = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Users className="h-12 w-12" />,
      title: "Quality Candidates",
      description: "Access pre-screened, AI-analyzed candidates with verified skills and experience.",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Clock className="h-12 w-12" />,
      title: "Faster Hiring",
      description: "Reduce time-to-hire by 50% with automated screening and intelligent matching.",
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Target className="h-12 w-12" />,
      title: "Perfect Matches",
      description: "AI-powered matching ensures candidates align with your requirements and culture.",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Shield className="h-12 w-12" />,
      title: "Secure Platform",
      description: "Enterprise-grade security with GDPR compliance and data protection.",
      color: "from-orange-500 to-red-600"
    }
  ];

  const features = [
    {
      title: "Advanced Candidate Search",
      description: "Filter by skills, experience, location, and availability with powerful search tools.",
      icon: <UserCheck className="h-6 w-6" />
    },
    {
      title: "Automated Resume Screening",
      description: "AI analyzes resumes instantly, extracting key information and ranking candidates.",
      icon: <Briefcase className="h-6 w-6" />
    },
    {
      title: "Interview Scheduling",
      description: "Seamless calendar integration with automated reminders and time zone handling.",
      icon: <Clock className="h-6 w-6" />
    },
    {
      title: "Hiring Analytics",
      description: "Track performance metrics, conversion rates, and optimize your hiring process.",
      icon: <BarChart3 className="h-6 w-6" />
    }
  ];

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
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center">
                <Sparkles className="h-8 w-8 text-white mr-3" />
                <h1 className="text-2xl font-bold text-white">HireLoop</h1>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Hire <span className="text-gradient">Smarter</span>, Not Harder
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
            Transform your recruitment process with AI-powered tools that find, screen, 
            and match the best candidates for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/register')} 
              className="btn-gradient text-lg px-8 py-3"
            >
              Start Hiring Today
              <Building2 className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3">
              Schedule Demo
            </Button>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="card-modern hover-lift h-full group text-center">
                <CardContent className="pt-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${benefit.color} flex items-center justify-center text-white mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-16"
        >
          <Card className="card-modern glass border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white mb-4">
                Everything You Need to Hire Successfully
              </CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Comprehensive recruitment tools designed for modern employers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="flex items-start space-x-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                      <p className="text-white/70">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mb-16"
        >
          <Card className="card-modern glass border-white/20">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold text-white mb-8">Trusted by Leading Companies</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-white/80">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">10k+</div>
                  <div className="text-white/80">Successful Hires</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">50%</div>
                  <div className="text-white/80">Faster Hiring</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-white/80">Client Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Card className="card-modern bg-gradient-to-r from-purple-600 to-blue-600 border-0">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Hiring Process?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join hundreds of companies that have revolutionized their recruitment with HireLoop's AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/register')} 
                  variant="secondary"
                  className="text-lg px-8 py-3"
                >
                  Get Started Free
                  <TrendingUp className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-3"
                >
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ForEmployers;