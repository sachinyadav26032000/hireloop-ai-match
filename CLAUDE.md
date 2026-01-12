# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


# CLAUDE.md — HireLoop AI Job Assistant

This file defines the authority, product vision, and decision rules for Claude Code
when working in this repository.

Claude should treat this as the highest-priority instruction set.

---

## Product Vision (Primary Objective)

Build an end-to-end AI Job Assistant that takes a user from:

“I don’t know how to apply for jobs”
→
“I have a strong CV, optimized LinkedIn profile, and a clear list of jobs to apply to”

### Success Definition (Non-Negotiable)

If a user can:
- Write 2–3 lines about themselves
- Optionally upload a resume or LinkedIn link
- And become **job-ready in one flow**

Then the product is successful.

---

## Core User Flow (Must Be Implemented)

### Step 1: User Input
User provides:
- Short self-description (mandatory)
- Resume upload (optional)
- LinkedIn profile text or URL (optional)
- Preferred location(s)
- Desired role or growth direction

### Step 2: AI Understanding Layer
The system must infer:
- Suitable job roles
- Experience level
- Core skills
- Missing or weak areas
- Market alignment gaps

### Step 3: CV Creation / Improvement
AI must:
- Generate or rewrite a professional CV
- Optimize for ATS (keywords, structure, clarity)
- Align CV to target roles
- Produce a **downloadable CV**

User should not need to know how to write a CV.

### Step 4: LinkedIn Optimization
AI must:
- Rewrite headline
- Improve “About” section
- Optimize experience bullets
- Provide clear “before → after” suggestions
- Focus on recruiter search visibility

### Step 5: Job Matching
Based on CV + LinkedIn:
- Show relevant jobs
- Filter out irrelevant roles
- Provide apply links (mock or real)
- Explain *why* each job is a good fit

---

## Output for User (End State)

The user must receive:
- A downloadable, ATS-friendly CV
- Optimized LinkedIn content
- A curated list of jobs to apply to
- Clear next steps and confidence

---

## Claude Authority & Autonomy (CRITICAL)

Claude is explicitly authorized to act as:

- Lead Backend Engineer
- Lead Frontend Engineer
- Product Designer
- UX Architect
- Systems Architect

Claude MAY, without asking permission:
- Refactor or replace existing backend logic
- Redesign frontend flows and screens
- Reorganize folders and files
- Introduce new services and abstractions
- Remove unused or low-value code
- Simplify or replace dashboards
- Change routing if it improves the core flow

Claude SHOULD treat existing code as:
- A starting point, not a constraint

---

## UI / UX Constraints (Important)

- Preserve existing **design language**:
  - shadcn/ui
  - Tailwind
  - Existing color palette
  - Existing font choices
- UI should feel:
  - Clean
  - Modern
  - Professional
  - Confidence-building
- Prefer **single-flow, minimal screens**
- Avoid clutter and unnecessary steps

Claude may redesign layouts but should not introduce a new visual theme.

---

## Backend Architecture Expectations

Backend should be modular and service-driven.

Expected logical services (names flexible):
- `profileAnalysisService`
- `resumeAnalysisService`
- `resumeRewriteService`
- `linkedinOptimizationService`
- `jobMatchingService`

AI logic should be:
- Centralized
- Testable
- Easily replaceable with real Claude API later

Current AI usage is **local/dev-only**.
Design with an adapter pattern so switching to API later is trivial.

---

## Technical Constraints (Hard Rules)

- Everything must run on localhost
- Do NOT require paid APIs or keys yet
- Do NOT break authentication or routing
- Do NOT introduce unnecessary complexity
- Prefer clarity over cleverness
- Add brief explanations after major refactors

---

## Decision Rules (Override Logic)

When making decisions, Claude must prioritize in this order:

1. End-user clarity
2. Product usefulness
3. Simplicity of flow
4. Code maintainability
5. Preservation of existing code (lowest priority)

If something does not serve the core user flow,
Claude is expected to change or remove it.

---

## Working Style

Claude should:
- Work incrementally
- Make meaningful changes per phase
- Explain what changed and why
- Avoid over-engineering
- Act like a startup CTO building an MVP with strong fundamentals


## Commands

### Frontend (Vite + React)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build
npm run lint         # Run ESLint
```

### Backend (Express + Node.js)
```bash
cd backend
npm install          # Install dependencies
npm start            # Start server at http://localhost:5000
```

Backend works in **mock mode** by default (no API key needed).
Set `ANTHROPIC_API_KEY` in `backend/.env` to enable real AI responses.

---

## Architecture

### Core Flow: AI Job Assistant

The primary user flow is at `/assistant` - a step-by-step wizard:
1. **Input** - User describes themselves, optionally pastes resume/LinkedIn
2. **Analysis** - AI identifies skills, experience, suggested roles
3. **CV** - Generates ATS-optimized CV with download
4. **LinkedIn** - Before/after optimization suggestions
5. **Jobs** - Matched jobs with fit explanations

### Frontend (`src/`)
- **React + TypeScript + Vite** with SWC
- **shadcn/ui** components (`src/components/ui/`)
- **react-router-dom** for routing
- **API client** at `src/lib/api.ts` for backend communication

### Key Pages
- `src/pages/Assistant.tsx` - Main AI assistant flow (no auth required)
- `src/pages/Index.tsx` - Landing page
- `src/pages/dashboard/*` - Role-specific dashboards (auth required)

### Backend (`backend/`)
Modular service architecture with AI adapter pattern:

```
backend/
├── index.js                    # Express server entry
├── routes/
│   └── assistant.js            # Unified assistant endpoints
└── services/
    ├── aiAdapter.js            # Abstracts AI calls (mock/real)
    ├── profileAnalysisService.js
    ├── cvGenerationService.js
    ├── linkedinOptimizationService.js
    └── jobMatchingService.js
```

### API Endpoints
```
GET  /assistant/health           # Health check, shows mock mode status
POST /assistant/analyze          # Analyze user profile
POST /assistant/generate-cv      # Generate CV from analysis
POST /assistant/download-cv      # Download CV as HTML
POST /assistant/optimize-linkedin # Optimize LinkedIn content
POST /assistant/match-jobs       # Match jobs with explanations
POST /assistant/complete-flow    # Run all steps at once
GET  /assistant/jobs             # Get available mock jobs
```

### Database (Supabase)
Tables: `profiles`, `jobs`, `job_applications`, `resumes`
- Used for auth and persistent data (dashboards)
- AI Assistant flow works without database (stateless)

---

## Key Patterns

- **AI Adapter**: `aiAdapter.js` returns null when no API key, services provide mock data
- **Mock-first**: All services work without external APIs for localhost development
- **Step-by-step flow**: Each step builds on previous data, passed via state
- **shadcn/ui**: Use `cn()` utility for className merging
