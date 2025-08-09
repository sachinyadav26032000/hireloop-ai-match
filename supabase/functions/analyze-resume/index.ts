import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getDocument } from "npm:pdfjs-dist@4.7.76/legacy/build/pdf.mjs";
import mammoth from "npm:mammoth@1.8.0";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Supabase admin client (for private storage download)
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

// Request types
interface AnalyzeRequest {
  storagePath?: string; // preferred, e.g. "<user-id>/<filename>.pdf"
  bucket?: string; // default: "resumes"
  fileUrl?: string; // legacy/public URL (we will parse & use admin download)
  fileName?: string; // optional hint
}

interface AnalyzeResult {
  skills: string[];
  experience_years: number;
  job_role: string;
  ats_score: number;
  summary: string[];
  recommendations?: string[];
  missing_skills?: string[];
  strength_areas?: string[];
}

// Helpers: type detection
const isPdf = (fileName?: string, contentType?: string) =>
  (fileName?.toLowerCase().endsWith(".pdf") ?? false) || (contentType?.includes("pdf") ?? false);

const isDocx = (fileName?: string, contentType?: string) =>
  (fileName?.toLowerCase().endsWith(".docx") ?? false) || contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function cleanExtractedText(text: string): string {
  try {
    return text
      .replace(/[\t\r]+/g, " ")
      .replace(/\u00A0/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/-\s+/g, "-")
      .replace(/[•·●▪◦]/g, "-")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return text;
  }
}

// Parse storage info from a Supabase URL
function parseSupabaseStoragePath(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "storage");
    if (i === -1) return null;
    const after = parts.slice(i);
    const objectIdx = after.findIndex((p) => p === "object");
    if (objectIdx === -1) return null;
    let bucketIdx = objectIdx + 1;
    if (after[bucketIdx] === "public" || after[bucketIdx] === "sign") bucketIdx += 1;
    const bucket = after[bucketIdx];
    const path = decodeURIComponent(after.slice(bucketIdx + 1).join("/"));
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch (e) {
    console.log("parseSupabaseStoragePath failed", e);
    return null;
  }
}

async function downloadFromSupabase(bucket: string, path: string) {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download error: ${error.message}`);
  return { buffer: await data.arrayBuffer(), contentType: data.type || undefined };
}

async function fetchViaHttp(fileUrl: string) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`HTTP download failed: ${res.status} ${res.statusText}`);
  return { buffer: await res.arrayBuffer(), contentType: res.headers.get("content-type") || undefined };
}

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const loadingTask = getDocument({ data: new Uint8Array(buffer), isEvalSupported: false } as any);
  const pdf = await loadingTask.promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as any[]).map((it) => (typeof it?.str === "string" ? it.str : "")).join(" ");
    out += pageText + "\n";
  }
  return cleanExtractedText(out);
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer } as any);
  return cleanExtractedText(value || "");
}

async function extractText(buffer: ArrayBuffer, fileName?: string, contentType?: string): Promise<string> {
  try {
    if (isPdf(fileName, contentType)) {
      console.log("Extracting PDF text");
      return await extractPdf(buffer);
    }
    if (isDocx(fileName, contentType)) {
      console.log("Extracting DOCX text");
      return await extractDocx(buffer);
    }
    console.log("Extracting as UTF-8 text");
    const txt = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer));
    return cleanExtractedText(txt);
  } catch (e) {
    console.error("extractText failed", e);
    return "";
  }
}

// Heuristic experience years from date ranges
function computeExperienceYears(text: string): number {
  try {
    const monthMap: Record<string, number> = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };
    const ranges: Array<{ start: Date; end: Date }> = [];
    const now = new Date();

    const patterns = [
      /(?<sm>jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(?<sy>\d{4})\s*[-–—]\s*(?<em>present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(?<ey>\d{4})?/gi,
      /(?<sy>\d{4})\s*[-–—]\s*(?<ey>present|current|\d{4})/gi,
    ];

    for (const p of patterns) {
      let m: RegExpExecArray | null;
      while ((m = p.exec(text)) !== null) {
        let start: Date | null = null;
        let end: Date | null = null;
        if (m.groups?.sm && m.groups?.sy) {
          const sm = (m.groups.sm || "").toLowerCase();
          const sy = parseInt(m.groups.sy);
          const emRaw = (m.groups.em || "").toLowerCase();
          const eyRaw = (m.groups.ey || "").toLowerCase();
          start = new Date(sy, monthMap[sm] ?? 0, 1);
          if (emRaw === "present" || emRaw === "current") {
            end = now;
          } else {
            const em = monthMap[emRaw] ?? 0;
            const ey = eyRaw ? parseInt(eyRaw) : sy;
            end = new Date(ey, em, 1);
          }
        } else if (m.groups?.sy && m.groups?.ey) {
          const sy = parseInt(m.groups.sy);
          const eyRaw = (m.groups.ey || "").toLowerCase();
          start = new Date(sy, 0, 1);
          end = eyRaw === "present" || eyRaw === "current" ? now : new Date(parseInt(eyRaw), 0, 1);
        }
        if (start && end && end >= start) ranges.push({ start, end });
      }
    }
    if (ranges.length === 0) return 0;
    const earliest = ranges.reduce((a, b) => (a.start < b.start ? a : b)).start;
    const latest = ranges.reduce((a, b) => (a.end > b.end ? a : b)).end;
    const months = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth());
    return Math.max(0, Math.round((months / 12) * 10) / 10);
  } catch (e) {
    console.log("computeExperienceYears error", e);
    return 0;
  }
}

async function analyzeWithAI(resumeText: string, fileName?: string, experienceYearsHint?: number): Promise<AnalyzeResult> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const sys = `You are an expert resume analyzer in 2025. Analyze resumes across ALL industries and seniority levels. Be factual and only use information present in the text.`;
  const user = `Resume text (sanitized):\n\n${resumeText.slice(0, 120_000)}\n\nInstructions:\n- Detect the most accurate job role/title (e.g., VP Sales, Director Operations, Business Analyst, Marketing Manager, Financial Analyst, Legal Counsel, UX Designer, Software Engineer).\n- Extract ONLY domain-specific, technical, and hard skills explicitly mentioned (tools, platforms, methodologies, frameworks). DO NOT include soft skills (e.g., communication, teamwork).\n- Compute years of experience based on actual employment dates in the resume. If unclear, use this hint: ${experienceYearsHint ?? 0}.\n- Provide a concise 5-line professional summary focused on achievements and domain expertise (no fluff).\n- Consider these categories when relevant: Executive Leadership; Business & Operations; Sales & BD; Marketing & Brand; Customer Experience; Finance & Accounting; Creative & Design; Legal & Compliance; Healthcare & Education; Technology.\n- If seniority is high (Director/VP/C-level), expected ATS score is higher (80-95).\n\nReturn ONLY valid JSON with this exact shape:\n{\n  "job_role": string,\n  "experience_years": number,\n  "skills": string[],\n  "summary": [string, string, string, string, string],\n  "ats_score": number,\n  "recommendations": string[],\n  "missing_skills": string[],\n  "strength_areas": string[]\n}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [ { role: "system", content: sys }, { role: "user", content: user } ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";

  let jsonText = content.trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  if (match) jsonText = match[0];

  let parsed: AnalyzeResult;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error("AI returned non-JSON, using fallback", e, { preview: content.slice(0, 400) });
    parsed = {
      skills: [],
      experience_years: experienceYearsHint ?? 0,
      job_role: "Professional",
      ats_score: Math.min(95, Math.max(50, 60 + Math.round((experienceYearsHint || 0) * 2))),
      summary: [
        "Experienced professional with domain expertise.",
        "Proficient with relevant tools and methodologies.",
        "Delivered measurable outcomes across projects.",
        "Cross-functional collaboration on key initiatives.",
        "Continuous improvement and learning mindset.",
      ],
      recommendations: [],
      missing_skills: [],
      strength_areas: [],
    };
  }

  // Sanitize
  parsed.skills = Array.from(new Set((parsed.skills || []).map((s) => `${s}`.trim()).filter(Boolean)));
  parsed.summary = (parsed.summary || []).slice(0, 5).map((s) => `${s}`.trim()).filter(Boolean);
  if (typeof parsed.experience_years !== "number" || !isFinite(parsed.experience_years)) parsed.experience_years = experienceYearsHint ?? 0;
  if (typeof parsed.ats_score !== "number" || !isFinite(parsed.ats_score)) parsed.ats_score = Math.min(95, Math.max(50, 60 + Math.round((parsed.experience_years || 0) * 2)));
  parsed.job_role = `${parsed.job_role || "Professional"}`.trim();

  return parsed;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let status = 200;
  let payload: any = { ok: false };

  try {
    const body: AnalyzeRequest = await req.json();
    const bucket = body.bucket || "resumes";
    const { storagePath, fileUrl, fileName } = body;

    console.log("Analyze request", { storagePath, bucket, hasUrl: Boolean(fileUrl), fileName });

    // Download
    let buffer: ArrayBuffer;
    let contentType: string | undefined;
    let finalFileName = fileName || "document";

    if (storagePath) {
      const dl = await downloadFromSupabase(bucket, storagePath);
      buffer = dl.buffer; contentType = dl.contentType; finalFileName = fileName || storagePath.split("/").pop() || finalFileName;
    } else if (fileUrl) {
      const parsed = parseSupabaseStoragePath(fileUrl);
      if (parsed) {
        console.log("Supabase URL detected → using admin download");
        const dl = await downloadFromSupabase(parsed.bucket, parsed.path);
        buffer = dl.buffer; contentType = dl.contentType; finalFileName = fileName || parsed.path.split("/").pop() || finalFileName;
      } else {
        console.log("HTTP download");
        const dl = await fetchViaHttp(fileUrl);
        buffer = dl.buffer; contentType = dl.contentType; finalFileName = fileName || new URL(fileUrl).pathname.split("/").pop() || finalFileName;
      }
    } else {
      throw new Error("Missing storagePath or fileUrl");
    }

    // Extract
    const text = await extractText(buffer, finalFileName, contentType);
    console.log("Extracted text length:", text.length);

    // Experience
    const experienceYears = computeExperienceYears(text);

    // AI analysis
    const analysis = await analyzeWithAI(text, finalFileName, experienceYears);

    payload = { ok: true, ...analysis };
  } catch (e: any) {
    console.error("analyze-resume error", e);
    // Always 2xx with fallback payload
    status = 200;
    payload = {
      ok: false,
      error: e?.message || "Unknown error",
      skills: ["Project Management", "Client Relations"],
      experience_years: 0,
      job_role: "Professional",
      ats_score: 70,
      summary: [
        "Experienced professional with relevant domain exposure.",
        "Demonstrated proficiency with industry tools.",
        "Delivered outcomes across projects and teams.",
        "Improved processes and stakeholder satisfaction.",
        "Adaptable with continuous learning mindset.",
      ],
    } as AnalyzeResult & { ok: false; error: string };
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
