import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Brain, 
  Target, 
  Calendar, 
  Users, 
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Star,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OurServices = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: <FileText className="h-12 w-12" />,
      title: "ATS Optimization",
      description: "Advanced resume scanning and optimization to pass Applicant Tracking Systems with 95% success rate.",
      features: ["Keyword optimization", "Format checking", "Score analysis", "Industry-specific tips"],
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Brain className="h-12 w-12" />,
      title: "AI Resume Parsing",
      description: "Intelligent extraction of skills, experience, and qualifications from any resume format.",
      features: ["PDF/DOC support", "Skills extraction", "Experience mapping", "Role detection"],
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Target className="h-12 w-12" />,
      title: "Job Matching",
      description: "Smart matching algorithm that connects candidates with perfect job opportunities.",
      features: ["Skill-based matching", "Location preferences", "Salary alignment", "Cultural fit"],
      color: "from-green-500 to-teal-600"
    },
    {
      icon: <Calendar className="h-12 w-12" />,
      title: "Interview Scheduling",
      description: "Streamlined interview coordination with automated scheduling and reminders.",
      features: ["Calendar integration", "Time zone handling", "Automated reminders", "Reschedule options"],
      color: "from-orange-500 to-red-600"
    },
    {
      icon: <Users className="h-12 w-12" />,
      title: "Candidate Management",
      description: "Comprehensive candidate tracking and communication platform for employers.",
      features: ["Application tracking", "Communication logs", "Status updates", "Team collaboration"],
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: <Zap className="h-12 w-12" />,
      title: "Real-time Analytics",
      description: "Data-driven insights to improve hiring processes and candidate experience.",
      features: ["Performance metrics", "Success rates", "Time-to-hire", "Custom reports"],
      color: "from-violet-500 to-purple-600"
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
            Our <span className="text-gradient">Services</span>
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing the hiring process with AI-powered tools and intelligent automation
            that connects talent with opportunity seamlessly.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="card-modern hover-lift h-full group">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Card className="card-modern glass border-white/20">
            <CardContent className="py-12">
              <div className="flex items-center justify-center mb-8">
                <Star className="h-8 w-8 text-yellow-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">Why Choose HireLoop?</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-white/80">ATS Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">50%</div>
                  <div className="text-white/80">Faster Hiring</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">10x</div>
                  <div className="text-white/80">Better Matches</div>
                </div>
              </div>

              <Button 
                onClick={() => navigate('/register')} 
                className="btn-gradient text-lg px-8 py-3"
              >
                Get Started Today
                <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default OurServices;