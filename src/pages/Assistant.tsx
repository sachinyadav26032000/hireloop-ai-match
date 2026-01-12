import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  assistantApi,
  ProfileAnalysis,
  CVData,
  LinkedInOptimization,
  JobMatchResult,
} from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle,
  Download,
  FileText,
  Linkedin,
  Loader2,
  MapPin,
  Sparkles,
  Target,
  User,
  Copy,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

type Step = "input" | "analysis" | "cv" | "linkedin" | "jobs" | "complete";

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "input", label: "About You", icon: User },
  { id: "analysis", label: "Analysis", icon: Target },
  { id: "cv", label: "Your CV", icon: FileText },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "jobs", label: "Jobs", icon: Briefcase },
];

export default function Assistant() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);

  // Form state
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [desiredRole, setDesiredRole] = useState("");
  const [location, setLocation] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Results state
  const [profileAnalysis, setProfileAnalysis] = useState<ProfileAnalysis | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [linkedinOptimization, setLinkedinOptimization] = useState<LinkedInOptimization | null>(null);
  const [jobMatches, setJobMatches] = useState<JobMatchResult | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const handleAnalyze = async () => {
    if (!selfDescription.trim() || selfDescription.length < 10) {
      toast.error("Please write at least a few sentences about yourself");
      return;
    }

    setLoading(true);
    try {
      const result = await assistantApi.analyzeProfile({
        selfDescription,
        resumeText,
        linkedinText,
        desiredRole,
        locations: location ? [location] : undefined,
      });

      setProfileAnalysis(result.data);
      setCurrentStep("analysis");
      toast.success("Profile analyzed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCV = async () => {
    if (!profileAnalysis) return;

    setLoading(true);
    try {
      const result = await assistantApi.generateCV(
        profileAnalysis,
        { fullName, email, location },
        resumeText
      );

      setCvData(result.data);
      setCurrentStep("cv");
      toast.success("CV generated!");
    } catch (error: any) {
      toast.error(error.message || "CV generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!cvData) return;

    try {
      await assistantApi.downloadCV(cvData);
      toast.success("CV downloaded!");
    } catch (error: any) {
      toast.error("Download failed");
    }
  };

  const handleOptimizeLinkedIn = async () => {
    if (!profileAnalysis) return;

    setLoading(true);
    try {
      const result = await assistantApi.optimizeLinkedIn(
        profileAnalysis,
        { fullName, email, location },
        { about: linkedinText }
      );

      setLinkedinOptimization(result.data);
      setCurrentStep("linkedin");
      toast.success("LinkedIn optimized!");
    } catch (error: any) {
      toast.error(error.message || "LinkedIn optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMatchJobs = async () => {
    if (!profileAnalysis) return;

    setLoading(true);
    try {
      const result = await assistantApi.matchJobs(profileAnalysis, cvData || undefined);

      setJobMatches(result.data);
      setCurrentStep("jobs");
      toast.success("Jobs matched!");
    } catch (error: any) {
      toast.error(error.message || "Job matching failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Job Assistant</h1>
                <p className="text-sm text-gray-500">Get job-ready in minutes</p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  i <= stepIndex ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < stepIndex
                      ? "bg-blue-600 text-white"
                      : i === stepIndex
                      ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                      : "bg-gray-100"
                  }`}
                >
                  {i < stepIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Step 1: Input */}
        {currentStep === "input" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tell us about yourself
              </CardTitle>
              <CardDescription>
                Write 2-3 sentences about your background. The more you share, the better we can help.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="self">About You *</Label>
                <Textarea
                  id="self"
                  placeholder="I'm a software developer with 3 years of experience in React and Node.js. I've built e-commerce platforms and enjoy solving complex problems..."
                  value={selfDescription}
                  onChange={(e) => setSelfDescription(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-gray-500">
                  {selfDescription.length} characters (minimum 10)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Desired Role (optional)</Label>
                  <Input
                    id="role"
                    placeholder="Software Engineer, Product Manager..."
                    value={desiredRole}
                    onChange={(e) => setDesiredRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Preferred Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, Remote..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Paste Resume Text (optional)</Label>
                <Textarea
                  id="resume"
                  placeholder="Paste your current resume content here for better analysis..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn About Section (optional)</Label>
                <Textarea
                  id="linkedin"
                  placeholder="Paste your LinkedIn About section for optimization..."
                  value={linkedinText}
                  onChange={(e) => setLinkedinText(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading || selfDescription.length < 10}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze My Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Analysis Results */}
        {currentStep === "analysis" && profileAnalysis && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Career Analysis
                </CardTitle>
                <CardDescription>{profileAnalysis.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Suggested Roles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profileAnalysis.suggestedRoles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Experience Level
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className="capitalize">{profileAnalysis.experienceLevel}</Badge>
                      <span className="text-sm text-gray-500">
                        ~{profileAnalysis.yearsOfExperience} years
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Core Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileAnalysis.coreSkills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      Areas to Improve
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      {profileAnalysis.weakAreas.map((area, i) => (
                        <li key={i}>• {area}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-blue-600">
                      <Sparkles className="h-4 w-4" />
                      Market Opportunities
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      {profileAnalysis.marketGaps.map((gap, i) => (
                        <li key={i}>• {gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep("input")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Edit Info
              </Button>
              <Button onClick={handleGenerateCV} disabled={loading} className="flex-1">
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate My CV
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: CV */}
        {currentStep === "cv" && cvData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Your Professional CV
                    </CardTitle>
                    <CardDescription>ATS-optimized and ready to download</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      ATS Score: {cvData.atsScore}/100
                    </Badge>
                    <Button onClick={handleDownloadCV}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white space-y-6">
                  {/* Header */}
                  <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold">{cvData.fullName}</h2>
                    <p className="text-gray-600">{cvData.title}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span>{cvData.email}</span>
                      <span>{cvData.phone}</span>
                      <span>{cvData.location}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="font-semibold mb-2">Professional Summary</h3>
                    <p className="text-sm text-gray-700">{cvData.summary}</p>
                  </div>

                  {/* Experience */}
                  <div>
                    <h3 className="font-semibold mb-3">Experience</h3>
                    {cvData.experience.map((exp, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{exp.title}</p>
                            <p className="text-sm text-gray-600">{exp.company}</p>
                          </div>
                          <span className="text-sm text-gray-500">{exp.duration}</span>
                        </div>
                        <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                          {exp.bullets.map((bullet, j) => (
                            <li key={j}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {[...cvData.skills.technical, ...cvData.skills.soft].map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h3 className="font-semibold mb-2">Education</h3>
                    {cvData.education.map((edu, i) => (
                      <p key={i} className="text-sm">
                        <span className="font-medium">{edu.degree}</span> - {edu.institution}, {edu.year}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                {cvData.improvements.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Tips to Improve</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {cvData.improvements.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep("analysis")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleOptimizeLinkedIn} disabled={loading} className="flex-1">
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Linkedin className="h-4 w-4 mr-2" />
                )}
                Optimize LinkedIn
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: LinkedIn */}
        {currentStep === "linkedin" && linkedinOptimization && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5" />
                      LinkedIn Optimization
                    </CardTitle>
                    <CardDescription>Copy these improvements to your profile</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    Score: {linkedinOptimization.overallScore}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="headline" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="headline">Headline</TabsTrigger>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="tips">Tips</TabsTrigger>
                  </TabsList>

                  <TabsContent value="headline" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">Before</p>
                        <p className="text-gray-700">{linkedinOptimization.headline.before}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm text-green-600">After</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(linkedinOptimization.headline.after, "Headline")
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {linkedinOptimization.headline.after}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {linkedinOptimization.headline.tips.join(" • ")}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">Before</p>
                        <p className="text-gray-700 text-sm whitespace-pre-line">
                          {linkedinOptimization.about.before}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm text-green-600">After</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(linkedinOptimization.about.after, "About section")
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-gray-900 text-sm whitespace-pre-line">
                          {linkedinOptimization.about.after}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tips" className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Top Recommendations</h4>
                      {linkedinOptimization.topRecommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Keywords to Include</h4>
                      <div className="flex flex-wrap gap-2">
                        {linkedinOptimization.keywords.map((kw) => (
                          <Badge key={kw} variant="outline">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep("cv")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleMatchJobs} disabled={loading} className="flex-1">
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Briefcase className="h-4 w-4 mr-2" />
                )}
                Find Matching Jobs
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Jobs */}
        {currentStep === "jobs" && jobMatches && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Jobs Matched For You
                </CardTitle>
                <CardDescription>
                  Based on your skills and preferences, here are the best matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobMatches.matches.map((match) => (
                  <div key={match.jobId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{match.job.title}</h3>
                        <p className="text-gray-600">{match.job.company}</p>
                      </div>
                      <Badge
                        variant={match.matchScore >= 80 ? "default" : "secondary"}
                        className="text-lg px-3"
                      >
                        {match.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {match.job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${match.job.salary_min?.toLocaleString()} - ${match.job.salary_max?.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{match.job.description}</p>

                    <div className="bg-green-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Why this is a good fit:</p>
                      <ul className="text-sm text-green-700">
                        {match.fitReasons.map((reason, i) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-3">
                      {match.skillsMatched.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Skills Matched</p>
                          <div className="flex gap-1">
                            {match.skillsMatched.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-green-600">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {match.skillsGap.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Skills to Learn</p>
                          <div className="flex gap-1">
                            {match.skillsGap.map((skill) => (
                              <Badge key={skill} variant="outline" className="text-orange-600">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{match.recommendation}</Badge>
                      <Button>Apply Now</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Top Skills in Demand</p>
                  <div className="flex flex-wrap gap-2">
                    {jobMatches.overallInsights.topSkillsInDemand.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Suggested Upskilling</p>
                  <div className="flex flex-wrap gap-2">
                    {jobMatches.overallInsights.suggestedUpskilling.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setCurrentStep("linkedin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep("input")} variant="outline" className="flex-1">
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
