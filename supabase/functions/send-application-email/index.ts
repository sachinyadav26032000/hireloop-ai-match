import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  hrEmail: string;
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  resumeUrl: string;
  skills: string[];
  preferredInterviewDate: string;
  coverLetter?: string;
  applicationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      hrEmail,
      candidateEmail,
      candidateName,
      jobTitle,
      companyName,
      resumeUrl,
      skills,
      preferredInterviewDate,
      coverLetter,
      applicationId
    }: ApplicationEmailRequest = await req.json();

    // Send email to HR
    const hrEmailResponse = await resend.emails.send({
      from: "HireLoop <noreply@hireloop.app>",
      to: [hrEmail],
      subject: `New Application: ${candidateName} for ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Job Application</h1>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Application Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>Candidate:</strong> ${candidateName}</p>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Email:</strong> ${candidateEmail}</p>
              <p><strong>Preferred Interview Date:</strong> ${preferredInterviewDate}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin-bottom: 15px;">Skills</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${skills.map(skill => `<span style="background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${skill}</span>`).join('')}
              </div>
            </div>

            ${coverLetter ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e293b; margin-bottom: 15px;">Cover Letter</h3>
              <p style="line-height: 1.6; color: #475569;">${coverLetter}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resumeUrl}" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Resume</a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              Application ID: ${applicationId}
            </p>
          </div>
        </div>
      `,
    });

    // Send confirmation email to candidate
    const candidateEmailResponse = await resend.emails.send({
      from: "HireLoop <noreply@hireloop.app>",
      to: [candidateEmail],
      subject: `Application Received: ${jobTitle} at ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Received!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b;">Hi ${candidateName},</h2>
            
            <p style="color: #475569; line-height: 1.6;">
              Thank you for applying to the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. 
              We have received your application and our team will review it soon.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-bottom: 15px;">Application Summary</h3>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Preferred Interview Date:</strong> ${preferredInterviewDate}</p>
              <p><strong>Application ID:</strong> ${applicationId}</p>
            </div>

            <p style="color: #475569; line-height: 1.6;">
              What happens next:
            </p>
            <ul style="color: #475569; line-height: 1.6;">
              <li>Our HR team will review your application</li>
              <li>If selected, we'll contact you to schedule an interview</li>
              <li>You can track your application status in your dashboard</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Application Status</a>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              Best regards,<br>
              The HireLoop Team
            </p>
          </div>
        </div>
      `,
    });

    console.log("HR Email sent:", hrEmailResponse);
    console.log("Candidate Email sent:", candidateEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        hrEmailId: hrEmailResponse.data?.id,
        candidateEmailId: candidateEmailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);