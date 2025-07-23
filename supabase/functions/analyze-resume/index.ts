import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    
    console.log('Analyzing resume:', fileName);
    
    // For now, return mock analysis data
    // This would typically involve calling an AI service to analyze the resume
    const analysisResult = {
      skills: [
        "JavaScript", "React", "Node.js", "Python", 
        "SQL", "AWS", "Git", "TypeScript"
      ],
      experience_years: 3,
      job_role: "Software Developer",
      ats_score: 85,
      summary: "Experienced software developer with strong skills in web development and cloud technologies. Demonstrates proficiency in multiple programming languages and frameworks.",
      recommendations: [
        "Add more quantifiable achievements",
        "Include relevant certifications",
        "Expand on leadership experience"
      ],
      missing_skills: [
        "Docker", "Kubernetes", "Machine Learning"
      ],
      strength_areas: [
        "Technical Skills", "Problem Solving", "Communication"
      ]
    };

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});