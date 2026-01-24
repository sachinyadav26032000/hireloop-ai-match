/**
 * Session Management Service - PRODUCTION GRADE
 *
 * REQUIREMENTS:
 * 1. Each analysis run creates a NEW session
 * 2. No previous session data may leak into a new session
 * 3. Resume upload ALWAYS overrides all previous data
 * 4. Users are identified by email
 * 5. Multiple saved profiles per email are supported
 *
 * SESSION INTEGRITY:
 * - Session IDs are unique per analysis run
 * - Starting fresh clears all previous data
 * - Resume uploads invalidate existing analysis data
 */
import { randomUUID } from "crypto";

// In-memory session store (replace with database in production)
const sessions = new Map();
const userProfiles = new Map(); // email -> profile[]

/**
 * Generate a new unique session ID
 */
export function generateSessionId() {
  return `session_${randomUUID()}`;
}

/**
 * Create a new session for an analysis run
 * CRITICAL: This creates a fresh session with no data from previous sessions
 */
export function createSession(email) {
  const sessionId = generateSessionId();
  const session = {
    id: sessionId,
    email: email?.toLowerCase()?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
    // Analysis data - starts empty
    data: {
      input: null,
      profileAnalysis: null,
      cvData: null,
      linkedinOptimization: null,
      jobMatches: null
    },
    // Warnings and alerts
    warnings: [],
    // Track what has been completed
    completedSteps: [],
    // Resume upload tracking
    resumeUploaded: false,
    resumeFileName: null
  };

  sessions.set(sessionId, session);

  return session;
}

/**
 * Get an existing session by ID
 * Returns null if session doesn't exist or is expired
 */
export function getSession(sessionId) {
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check if session is still active (24 hour expiry)
  const createdAt = new Date(session.createdAt);
  const now = new Date();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

  if (hoursSinceCreation > 24) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Update session data
 * IMPORTANT: Only updates specified fields, preserves others
 */
export function updateSession(sessionId, updates) {
  const session = getSession(sessionId);
  if (!session) return null;

  // Update session data
  if (updates.data) {
    session.data = { ...session.data, ...updates.data };
  }

  if (updates.warnings) {
    session.warnings = [...session.warnings, ...updates.warnings];
  }

  if (updates.completedSteps) {
    session.completedSteps = [...new Set([...session.completedSteps, ...updates.completedSteps])];
  }

  if (updates.resumeUploaded !== undefined) {
    session.resumeUploaded = updates.resumeUploaded;
  }

  if (updates.resumeFileName !== undefined) {
    session.resumeFileName = updates.resumeFileName;
  }

  session.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);

  return session;
}

/**
 * Handle resume upload - invalidates existing analysis data
 * CRITICAL: Resume uploads MUST clear all previous analysis to prevent data leakage
 */
export function handleResumeUpload(sessionId, fileName) {
  const session = getSession(sessionId);
  if (!session) return null;

  // CRITICAL: Clear all analysis data when new resume is uploaded
  session.data = {
    input: null,
    profileAnalysis: null,
    cvData: null,
    linkedinOptimization: null,
    jobMatches: null
  };

  session.completedSteps = [];
  session.resumeUploaded = true;
  session.resumeFileName = fileName;
  session.updatedAt = new Date().toISOString();
  session.warnings = [{
    type: "resume_override",
    message: "New resume uploaded. Previous analysis has been cleared.",
    timestamp: new Date().toISOString()
  }];

  sessions.set(sessionId, session);

  return session;
}

/**
 * Add a warning to the session
 */
export function addSessionWarning(sessionId, warning) {
  const session = getSession(sessionId);
  if (!session) return null;

  session.warnings.push({
    ...warning,
    timestamp: new Date().toISOString()
  });

  session.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);

  return session;
}

/**
 * Mark a step as completed
 */
export function markStepCompleted(sessionId, step) {
  const session = getSession(sessionId);
  if (!session) return null;

  if (!session.completedSteps.includes(step)) {
    session.completedSteps.push(step);
  }

  session.updatedAt = new Date().toISOString();
  sessions.set(sessionId, session);

  return session;
}

/**
 * Save user profile for future resumption
 * Users can have multiple profiles (different resumes/applications)
 */
export function saveUserProfile(email, profileData) {
  if (!email) return null;

  const emailKey = email.toLowerCase().trim();
  const profiles = userProfiles.get(emailKey) || [];

  const profile = {
    id: `profile_${randomUUID()}`,
    email: emailKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: profileData.fullName || null,
    targetRole: profileData.desiredRoles?.[0] || null,
    data: profileData
  };

  // Add to user's profiles (keep last 5)
  profiles.unshift(profile);
  if (profiles.length > 5) {
    profiles.pop();
  }

  userProfiles.set(emailKey, profiles);

  return profile;
}

/**
 * Get user's saved profiles
 */
export function getUserProfiles(email) {
  if (!email) return [];

  const emailKey = email.toLowerCase().trim();
  return userProfiles.get(emailKey) || [];
}

/**
 * Get a specific profile by ID
 */
export function getProfileById(email, profileId) {
  const profiles = getUserProfiles(email);
  return profiles.find(p => p.id === profileId) || null;
}

/**
 * Delete a user profile
 */
export function deleteProfile(email, profileId) {
  if (!email) return false;

  const emailKey = email.toLowerCase().trim();
  const profiles = userProfiles.get(emailKey) || [];

  const newProfiles = profiles.filter(p => p.id !== profileId);
  userProfiles.set(emailKey, newProfiles);

  return true;
}

/**
 * Clear expired sessions (called periodically)
 */
export function cleanupExpiredSessions() {
  const now = new Date();
  const expiredIds = [];

  for (const [sessionId, session] of sessions.entries()) {
    const createdAt = new Date(session.createdAt);
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      expiredIds.push(sessionId);
    }
  }

  for (const id of expiredIds) {
    sessions.delete(id);
  }

  return expiredIds.length;
}

/**
 * Destroy a session (logout/clear)
 */
export function destroySession(sessionId) {
  return sessions.delete(sessionId);
}

/**
 * Get session statistics (for debugging)
 */
export function getSessionStats() {
  return {
    activeSessions: sessions.size,
    userProfiles: userProfiles.size
  };
}

export default {
  generateSessionId,
  createSession,
  getSession,
  updateSession,
  handleResumeUpload,
  addSessionWarning,
  markStepCompleted,
  saveUserProfile,
  getUserProfiles,
  getProfileById,
  deleteProfile,
  cleanupExpiredSessions,
  destroySession,
  getSessionStats
};
