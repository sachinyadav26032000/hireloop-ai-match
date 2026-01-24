/**
 * Job API Adapter - Real Job Source Integration
 *
 * Integrates with external job APIs:
 * - Adzuna (primary)
 * - Jooble (fallback)
 *
 * NO MOCK DATA - Returns empty results if APIs are unavailable
 */

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

// Role to search term mapping for better API results
const ROLE_SEARCH_TERMS = {
  "Software Engineer": "software engineer developer",
  "Frontend Developer": "frontend developer react javascript",
  "Backend Developer": "backend developer java python node",
  "Full Stack Developer": "full stack developer",
  "Data Analyst": "data analyst sql",
  "Data Scientist": "data scientist machine learning",
  "Product Manager": "product manager",
  "UX Designer": "ux designer ui",
  "DevOps Engineer": "devops engineer cloud",
  "QA Engineer": "qa engineer testing",
  "Mobile Developer": "mobile developer android ios",
  "Marketing Manager": "marketing manager digital",
  "Sales Executive": "sales executive business development",
  "HR Manager": "hr manager human resources",
  "Customer Success Manager": "customer success manager",
  "Business Analyst": "business analyst",
  "Project Manager": "project manager",
  "Technical Writer": "technical writer",
  "Security Engineer": "security engineer cybersecurity",
  "Cloud Engineer": "cloud engineer aws azure",
};

// Location mapping for API queries
const LOCATION_CODES = {
  // India
  "Bangalore": { adzuna: "in", jooble: "bangalore, india" },
  "Mumbai": { adzuna: "in", jooble: "mumbai, india" },
  "Delhi NCR": { adzuna: "in", jooble: "delhi, india" },
  "Hyderabad": { adzuna: "in", jooble: "hyderabad, india" },
  "Chennai": { adzuna: "in", jooble: "chennai, india" },
  "Pune": { adzuna: "in", jooble: "pune, india" },
  "Kolkata": { adzuna: "in", jooble: "kolkata, india" },
  "Noida": { adzuna: "in", jooble: "noida, india" },
  "Gurugram": { adzuna: "in", jooble: "gurugram, india" },
  // Remote
  "Remote - India": { adzuna: "in", jooble: "remote india" },
  "Remote - Global": { adzuna: "gb", jooble: "remote" },
  // International
  "United States": { adzuna: "us", jooble: "usa" },
  "United Kingdom": { adzuna: "gb", jooble: "uk" },
  "Canada": { adzuna: "ca", jooble: "canada" },
  "Australia": { adzuna: "au", jooble: "australia" },
  "Germany": { adzuna: "de", jooble: "germany" },
  "Singapore": { adzuna: "sg", jooble: "singapore" },
  "Dubai": { adzuna: "ae", jooble: "dubai" },
};

/**
 * Check if job APIs are configured
 */
export function isJobApiConfigured() {
  return !!(ADZUNA_APP_ID && ADZUNA_APP_KEY) || !!JOOBLE_API_KEY;
}

/**
 * Get API configuration status
 */
export function getApiStatus() {
  return {
    adzunaConfigured: !!(ADZUNA_APP_ID && ADZUNA_APP_KEY),
    joobleConfigured: !!JOOBLE_API_KEY,
    anyConfigured: isJobApiConfigured(),
  };
}

/**
 * Search jobs via Adzuna API
 */
async function searchAdzuna(query, location, experienceYears, page = 1) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return { success: false, error: "Adzuna API not configured", jobs: [] };
  }

  try {
    const locationConfig = LOCATION_CODES[location] || { adzuna: "in" };
    const country = locationConfig.adzuna;

    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: "15",
      what: query,
      content_type: "application/json",
    });

    // Add location if available
    if (location && !location.includes("Remote")) {
      params.append("where", location.split(" - ")[0]);
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Adzuna API error:", response.status, errorText);
      return { success: false, error: `Adzuna API returned ${response.status}`, jobs: [] };
    }

    const data = await response.json();

    const jobs = (data.results || []).map(job => ({
      id: `adzuna-${job.id}`,
      title: job.title,
      company: job.company?.display_name || "Company",
      location: job.location?.display_name || location,
      description: job.description || "",
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      currency: country === "us" ? "USD" : country === "in" ? "INR" : "GBP",
      job_type: job.contract_type || "full_time",
      source: "Adzuna",
      sourceOriginal: job.redirect_url ? extractSourceFromUrl(job.redirect_url) : "Job Board",
      postedDate: formatPostedDate(job.created),
      applyUrl: job.redirect_url,
      category: job.category?.label || "",
    }));

    return {
      success: true,
      jobs,
      total: data.count || jobs.length,
    };
  } catch (error) {
    console.error("Adzuna fetch error:", error.message);
    return { success: false, error: error.message, jobs: [] };
  }
}

/**
 * Search jobs via Jooble API
 */
async function searchJooble(query, location, experienceYears, page = 1) {
  if (!JOOBLE_API_KEY) {
    return { success: false, error: "Jooble API not configured", jobs: [] };
  }

  try {
    const locationConfig = LOCATION_CODES[location] || { jooble: "india" };
    const locationQuery = locationConfig.jooble;

    const url = `https://jooble.org/api/${JOOBLE_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keywords: query,
        location: locationQuery,
        page: page.toString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jooble API error:", response.status, errorText);
      return { success: false, error: `Jooble API returned ${response.status}`, jobs: [] };
    }

    const data = await response.json();

    const jobs = (data.jobs || []).map((job, index) => ({
      id: `jooble-${job.id || index}-${Date.now()}`,
      title: job.title,
      company: job.company || "Company",
      location: job.location || location,
      description: job.snippet || "",
      salary_min: parseSalary(job.salary, "min"),
      salary_max: parseSalary(job.salary, "max"),
      currency: detectCurrency(location),
      job_type: job.type || "full_time",
      source: "Jooble",
      sourceOriginal: job.source || extractSourceFromUrl(job.link),
      postedDate: job.updated || "Recent",
      applyUrl: job.link,
      category: "",
    }));

    return {
      success: true,
      jobs,
      total: data.totalCount || jobs.length,
    };
  } catch (error) {
    console.error("Jooble fetch error:", error.message);
    return { success: false, error: error.message, jobs: [] };
  }
}

/**
 * Main job search function - tries all configured APIs
 */
export async function searchJobs(options) {
  const {
    role,
    location = "Bangalore",
    experienceYears = 2,
    skills = [],
    page = 1,
  } = options;

  // Build search query
  const roleTerms = ROLE_SEARCH_TERMS[role] || role;
  const skillTerms = skills.slice(0, 3).join(" ");
  const query = `${roleTerms} ${skillTerms}`.trim();

  const results = {
    jobs: [],
    total: 0,
    sources: [],
    errors: [],
  };

  // Try Adzuna first
  const adzunaResult = await searchAdzuna(query, location, experienceYears, page);
  if (adzunaResult.success) {
    results.jobs.push(...adzunaResult.jobs);
    results.total += adzunaResult.total;
    results.sources.push("Adzuna");
  } else {
    results.errors.push({ source: "Adzuna", error: adzunaResult.error });
  }

  // Try Jooble as supplement/fallback
  const joobleResult = await searchJooble(query, location, experienceYears, page);
  if (joobleResult.success) {
    // Deduplicate by title + company
    const existingKeys = new Set(results.jobs.map(j => `${j.title.toLowerCase()}-${j.company.toLowerCase()}`));
    const newJobs = joobleResult.jobs.filter(j => !existingKeys.has(`${j.title.toLowerCase()}-${j.company.toLowerCase()}`));
    results.jobs.push(...newJobs);
    results.total += newJobs.length;
    results.sources.push("Jooble");
  } else {
    results.errors.push({ source: "Jooble", error: joobleResult.error });
  }

  return results;
}

/**
 * Utility: Extract source website from URL
 */
function extractSourceFromUrl(url) {
  if (!url) return "Job Board";
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const sourceMappings = {
      "linkedin.com": "LinkedIn",
      "indeed.com": "Indeed",
      "in.indeed.com": "Indeed India",
      "naukri.com": "Naukri",
      "glassdoor.com": "Glassdoor",
      "monster.com": "Monster",
      "dice.com": "Dice",
      "lever.co": "Lever",
      "greenhouse.io": "Greenhouse",
      "workday.com": "Workday",
      "jobs.lever.co": "Lever",
      "boards.greenhouse.io": "Greenhouse",
    };
    return sourceMappings[hostname] || capitalizeFirst(hostname.split(".")[0]);
  } catch {
    return "Job Board";
  }
}

/**
 * Utility: Parse salary string to number
 */
function parseSalary(salaryStr, type) {
  if (!salaryStr) return null;
  const numbers = salaryStr.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return null;

  const values = numbers.map(n => parseInt(n.replace(/,/g, ""), 10));
  if (type === "min") return Math.min(...values);
  if (type === "max") return Math.max(...values);
  return values[0];
}

/**
 * Utility: Detect currency from location
 */
function detectCurrency(location) {
  if (!location) return "INR";
  const loc = location.toLowerCase();
  if (loc.includes("us") || loc.includes("united states")) return "USD";
  if (loc.includes("uk") || loc.includes("united kingdom") || loc.includes("london")) return "GBP";
  if (loc.includes("europe") || loc.includes("germany") || loc.includes("france")) return "EUR";
  if (loc.includes("australia") || loc.includes("sydney") || loc.includes("melbourne")) return "AUD";
  if (loc.includes("canada") || loc.includes("toronto")) return "CAD";
  if (loc.includes("singapore")) return "SGD";
  if (loc.includes("dubai") || loc.includes("uae")) return "AED";
  return "INR"; // Default for India
}

/**
 * Utility: Format posted date
 */
function formatPostedDate(dateStr) {
  if (!dateStr) return "Recent";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return "Recent";
  }
}

/**
 * Utility: Capitalize first letter
 */
function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
