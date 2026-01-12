# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HireLoop AI Match is a job matching platform with AI-powered resume analysis. It connects job seekers, companies, and HR professionals through role-specific dashboards.

## Commands

### Frontend (Vite + React)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (Express + Node.js)
```bash
cd backend
npm install          # Install dependencies
npm start            # Start server at http://localhost:5000
```

Backend requires `ANTHROPIC_API_KEY` in `backend/.env`.

## Architecture

### Frontend (`src/`)
- **React + TypeScript + Vite** with SWC for fast compilation
- **Supabase** for auth and database (`src/integrations/supabase/`)
- **shadcn/ui** components in `src/components/ui/` (uses Radix UI primitives)
- **TanStack Query** for server state management
- **react-router-dom** for routing

### Authentication Flow
- `useAuth` hook (`src/hooks/useAuth.tsx`) provides auth context
- `ProtectedRoute` component (`src/components/ProtectedRoute.tsx`) guards routes by user type
- Three user types: `job_seeker`, `company`, `hr` - each has a dedicated dashboard

### Route Structure
```
/                       → Landing page
/login, /register       → Auth pages
/dashboard/jobseeker    → Job seeker dashboard (protected)
/dashboard/company      → Company dashboard (protected)
/dashboard/hr           → HR dashboard (protected)
/jobs                   → Job listings
```

### Backend (`backend/`)
- Express server with Claude AI integration for resume/career analysis
- `/analyze` endpoint uses Anthropic SDK to analyze user career data
- Claude client initialized in `backend/services/claude.js`

### Database (Supabase)
Tables defined in `src/integrations/supabase/types.ts`:
- `profiles` - User profiles with `user_type` field
- `jobs` - Job postings linked to company profiles
- `job_applications` - Applications linking job seekers to jobs
- `resumes` - Uploaded resumes with AI-generated analysis (ATS score, skills, recommendations)

### Path Aliases
`@/` maps to `src/` directory (configured in `vite.config.ts` and `tsconfig.json`)

## Key Patterns

- Supabase client uses singleton pattern (`getSupabaseClient()`)
- Auth state changes trigger profile fetching via `onAuthStateChange`
- UI components follow shadcn/ui conventions with `cn()` utility for className merging
- Forms use `react-hook-form` with `zod` validation
