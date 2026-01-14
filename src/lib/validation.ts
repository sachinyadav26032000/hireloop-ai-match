/**
 * Centralized Validation Utilities
 * Progressive validation for user-friendly experience
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

// Common email domains (not exhaustive, but covers most cases)
const VALID_EMAIL_DOMAINS = [
  // Consumer
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
  'zoho.com', 'yandex.com', 'mail.com', 'gmx.com', 'fastmail.com',
  // India-specific
  'rediffmail.com', 'sify.com',
  // Education
  'edu', 'ac.in', 'edu.in',
  // We allow any domain that looks corporate (has at least one dot after @)
];

/**
 * Validate email format and domain
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., name@example.com)' };
  }

  // Extract domain
  const domain = trimmedEmail.split('@')[1];

  // Check for obviously fake domains
  if (domain.length < 4 || !domain.includes('.')) {
    return { valid: false, error: 'Please enter a valid email domain' };
  }

  // Check if it's a known domain or looks like a corporate domain
  const isKnownDomain = VALID_EMAIL_DOMAINS.some(d =>
    domain === d || domain.endsWith('.' + d)
  );

  // Allow corporate domains (anything with proper TLD structure)
  const hasValidTLD = /\.[a-z]{2,}$/.test(domain);

  if (!isKnownDomain && !hasValidTLD) {
    return { valid: false, error: 'Please use a valid email provider (Gmail, Outlook, company email, etc.)' };
  }

  return { valid: true };
}

/**
 * Validate full name (alphabetic + spaces, minimum 2 words)
 */
export function validateFullName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Full name is required' };
  }

  const trimmedName = name.trim();

  // Check for at least 2 words
  const words = trimmedName.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) {
    return { valid: false, error: 'Please enter your full name (first and last name)' };
  }

  // Check alphabetic + spaces only (allow some international characters)
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { valid: false, error: 'Name should contain only letters, spaces, hyphens, or apostrophes' };
  }

  // Each word should be at least 2 characters
  if (words.some(w => w.length < 2)) {
    return { valid: false, error: 'Each part of your name should be at least 2 characters' };
  }

  return { valid: true };
}

/**
 * Normalize LinkedIn URL before validation
 * - Trim whitespace
 * - Remove trailing slashes
 * - Convert to lowercase
 * - Normalize domain to linkedin.com
 */
export function normalizeLinkedInUrl(url: string): string {
  if (!url) return '';

  let normalized = url.trim();

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  return normalized;
}

/**
 * Validate LinkedIn URL (optional but must be valid if provided)
 * Accepts:
 *   - https://www.linkedin.com/in/username
 *   - https://linkedin.com/in/username
 *   - http://www.linkedin.com/in/username
 *   - With or without trailing slash
 *   - Case insensitive
 */
export function validateLinkedInUrl(url: string, required = false): ValidationResult {
  // If not required and empty, it's valid (return early with no error)
  if (!url || url.trim().length === 0) {
    if (required) {
      return { valid: false, error: 'LinkedIn profile URL is required' };
    }
    // Empty is valid when not required - clear any errors
    return { valid: true, warning: 'Adding your LinkedIn URL helps with better optimization' };
  }

  // Normalize the URL before validation
  const normalizedUrl = normalizeLinkedInUrl(url);

  // Check for non-LinkedIn domains first
  if (!normalizedUrl.includes('linkedin.com')) {
    return {
      valid: false,
      error: 'Please enter a LinkedIn URL (e.g., linkedin.com/in/yourname)'
    };
  }

  // Must be a LinkedIn profile URL - regex matches normalized (lowercase, no trailing slash) URL
  // Pattern: https:// or http://, optional www., linkedin.com/in/, username (alphanumeric, hyphens, underscores, percent-encoded)
  const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-z0-9\-_%]+$/;

  if (!linkedInRegex.test(normalizedUrl)) {
    // It contains linkedin.com but doesn't match the profile URL pattern
    // Check for common mistakes
    if (normalizedUrl.includes('linkedin.com/company/')) {
      return {
        valid: false,
        error: 'This appears to be a company page. Please enter your personal profile URL (linkedin.com/in/...)'
      };
    }
    if (normalizedUrl.includes('linkedin.com/pub/')) {
      return {
        valid: false,
        error: 'Please use your updated LinkedIn profile URL (linkedin.com/in/...)'
      };
    }
    if (!normalizedUrl.includes('/in/')) {
      return {
        valid: false,
        error: 'LinkedIn URL must include /in/ followed by your username'
      };
    }
    return {
      valid: false,
      error: 'Invalid LinkedIn profile URL format. Example: https://www.linkedin.com/in/yourname'
    };
  }

  // Extract username and validate
  const match = normalizedUrl.match(/linkedin\.com\/in\/([a-z0-9\-_%]+)$/);
  if (match) {
    const username = match[1];
    // Decode percent-encoded characters for validation
    const decodedUsername = decodeURIComponent(username);

    if (decodedUsername.length < 3) {
      return { valid: false, error: 'LinkedIn username appears too short' };
    }

    if (decodedUsername.length > 100) {
      return { valid: false, error: 'LinkedIn username appears too long' };
    }
  }

  return { valid: true };
}

/**
 * Validate experience (0-40 years)
 */
export function validateExperience(years: string | number): ValidationResult {
  if (years === '' || years === undefined || years === null) {
    return { valid: false, error: 'Total experience is required' };
  }

  const numYears = typeof years === 'string' ? parseInt(years, 10) : years;

  if (isNaN(numYears)) {
    return { valid: false, error: 'Experience must be a number' };
  }

  if (numYears < 0) {
    return { valid: false, error: 'Experience cannot be negative' };
  }

  if (numYears > 40) {
    return { valid: false, error: 'Please enter a valid experience (0-40 years)' };
  }

  return { valid: true };
}

/**
 * Validate resume content (optional but recommended for analysis)
 */
export function validateResume(resumeText: string, required = false): ValidationResult {
  if (!resumeText || resumeText.trim().length === 0) {
    if (required) {
      return {
        valid: false,
        error: 'Resume is required for AI analysis. Please paste your resume content.'
      };
    }
    return {
      valid: true,
      warning: 'Adding your resume helps AI provide more accurate analysis'
    };
  }

  const trimmedResume = resumeText.trim();
  const wordCount = trimmedResume.split(/\s+/).length;

  // Minimum word count for a meaningful resume
  if (wordCount < 50) {
    return {
      valid: false,
      error: 'Resume content is too short. Please paste your complete resume (minimum 50 words).'
    };
  }

  // Check for gibberish (no real words)
  const commonWords = ['experience', 'work', 'education', 'skills', 'project', 'company', 'team', 'developed', 'managed', 'led', 'created', 'built', 'years', 'role'];
  const hasRealContent = commonWords.some(word =>
    trimmedResume.toLowerCase().includes(word)
  );

  if (!hasRealContent && wordCount < 100) {
    return {
      valid: false,
      error: 'Resume content does not appear to be valid. Please paste your actual resume.'
    };
  }

  return { valid: true };
}

/**
 * Validate self description (optional but helps with analysis)
 */
export function validateSelfDescription(description: string, required = false): ValidationResult {
  if (!description || description.trim().length === 0) {
    if (required) {
      return { valid: false, error: 'Please describe yourself' };
    }
    return { valid: true };
  }

  const trimmedDesc = description.trim();

  if (trimmedDesc.length < 20) {
    return {
      valid: false,
      error: 'Please provide more detail about yourself (at least 20 characters)'
    };
  }

  // Check for gibberish
  const wordCount = trimmedDesc.split(/\s+/).length;
  if (wordCount < 5) {
    return {
      valid: false,
      error: 'Please write at least a few sentences about your background'
    };
  }

  return { valid: true };
}

/**
 * Validate desired role selection (1-3 roles)
 */
export function validateDesiredRoles(roles: string[]): ValidationResult {
  if (!roles || roles.length === 0) {
    return { valid: false, error: 'Please select at least one desired role' };
  }

  if (roles.length > 3) {
    return { valid: false, error: 'Please select up to 3 roles for focused job matching' };
  }

  return { valid: true };
}

/**
 * Validate skills selection (1+ skills)
 */
export function validateSkills(skills: string[]): ValidationResult {
  if (!skills || skills.length === 0) {
    return { valid: false, error: 'Please select at least one skill' };
  }

  return { valid: true };
}

/**
 * Validate location selection
 */
export function validateLocation(location: string): ValidationResult {
  if (!location || location.trim().length === 0) {
    return { valid: false, error: 'Preferred location is required' };
  }

  return { valid: true };
}

/**
 * Core required fields for proceeding (progressive validation)
 * These are the minimum fields to proceed to AI analysis
 */
export interface CoreFormData {
  fullName: string;
  email: string;
  desiredRoles: string[];
  location: string;
  experienceYears: string;
}

export interface CoreValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  canProceed: boolean;
}

/**
 * Validate only core required fields (for proceeding)
 * Full Name, Email, At least 1 Role, Location, Experience
 */
export function validateCoreFields(data: CoreFormData): CoreValidationResult {
  const errors: Record<string, string> = {};

  // Full name validation
  const nameResult = validateFullName(data.fullName);
  if (!nameResult.valid) errors.fullName = nameResult.error!;

  // Email validation
  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  // Desired roles validation
  const rolesResult = validateDesiredRoles(data.desiredRoles);
  if (!rolesResult.valid) errors.desiredRoles = rolesResult.error!;

  // Location validation
  const locationResult = validateLocation(data.location);
  if (!locationResult.valid) errors.location = locationResult.error!;

  // Experience validation
  const expResult = validateExperience(data.experienceYears);
  if (!expResult.valid) errors.experienceYears = expResult.error!;

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    canProceed: valid
  };
}

/**
 * Full form validation for AI analysis
 * Includes resume as required for accurate AI analysis
 */
export interface FullFormData extends CoreFormData {
  selfDescription?: string;
  resumeText: string;
  linkedinUrl?: string;
  selectedSkills: string[];  // Required for analysis
}

export interface FullValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

export function validateFullForm(data: FullFormData): FullValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Core fields (all required)
  const nameResult = validateFullName(data.fullName);
  if (!nameResult.valid) errors.fullName = nameResult.error!;

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) errors.email = emailResult.error!;

  const rolesResult = validateDesiredRoles(data.desiredRoles);
  if (!rolesResult.valid) errors.desiredRoles = rolesResult.error!;

  const locationResult = validateLocation(data.location);
  if (!locationResult.valid) errors.location = locationResult.error!;

  const expResult = validateExperience(data.experienceYears);
  if (!expResult.valid) errors.experienceYears = expResult.error!;

  // Resume - required for AI analysis
  const resumeResult = validateResume(data.resumeText, true);
  if (!resumeResult.valid) errors.resumeText = resumeResult.error!;

  // Skills - required (at least 1)
  const skillsResult = validateSkills(data.selectedSkills || []);
  if (!skillsResult.valid) errors.selectedSkills = skillsResult.error!;

  // Optional fields - validation failures are WARNINGS, not blocking errors
  if (data.selfDescription) {
    const descResult = validateSelfDescription(data.selfDescription);
    if (!descResult.valid) {
      // Self description is optional - invalid input is a warning
      warnings.selfDescription = descResult.error!;
    }
  }

  // LinkedIn URL is OPTIONAL - validation failure should NOT block form submission
  if (data.linkedinUrl && data.linkedinUrl.trim().length > 0) {
    const linkedinResult = validateLinkedInUrl(data.linkedinUrl);
    if (!linkedinResult.valid) {
      // LinkedIn is optional - invalid URL is a warning, NOT a blocking error
      warnings.linkedinUrl = linkedinResult.error!;
    }
  } else {
    warnings.linkedinUrl = 'Adding your LinkedIn URL helps with better optimization';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Legacy compatibility - comprehensive form validation
 */
export interface FormData {
  fullName: string;
  email: string;
  selfDescription: string;
  desiredRoles: string[];
  location: string;
  experienceYears: string;
  linkedinUrl: string;
  resumeText: string;
}

export interface FormValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateForm(data: FormData): FormValidationResult {
  const result = validateFullForm({
    ...data,
    selectedSkills: [] // Optional in legacy
  });
  return {
    valid: result.valid,
    errors: result.errors
  };
}
