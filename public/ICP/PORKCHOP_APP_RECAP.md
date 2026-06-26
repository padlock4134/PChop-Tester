# PorkChop — Complete App Recap
**Purpose-Built LMS for Trade Education**

*Last Updated: June 26, 2026 (public-safe recap)*

---

## Executive Summary

> This document is a public-safe overview and intentionally omits proprietary implementation details, internal model logic, and sensitive operational specifics.

PorkChop is a vertical SaaS Learning Management System built specifically for trade education institutions. It replaces generic platforms (Canvas, Blackboard) that were designed for lecture halls — not hands-on skill training. The platform combines AI-powered assistance, computer vision, practical skill tracking, gamification, video submission, nutritional analysis, and administrative tools into a single product purpose-built for trade school workflows.

The platform supports **9 fully deployed trade disciplines** through a dynamic skin system that adapts module names, assistant personas, terminology, and branding per discipline. Each discipline includes contextual AI assistance, visual scanning workflows, practical project management, video capabilities, AR-powered practice scenes, and live session features. A custom discipline generator allows schools to instantly spin up new trade programs without any vendor involvement.

PorkChop is a U.S.-based company focused on modernizing trade education infrastructure.

---

## The Problem

- **Community colleges and specialized trade institutions** serve trade students — all underserved by legacy LMS platforms.
- Nursing students get vSim simulators. Engineering students get CAD software. **Trade students get crossword puzzles.**
- Generic LMS platforms have no concept of hands-on skill assessment, technique practice, equipment management, or industry-specific workflows.
- Paper-based skill assessments, no video submission capability, and zero tools for practicing techniques outside the physical classroom.
- **New trade programs require custom development** — schools can't launch new programs without vendor involvement.

---

## The Solution

PorkChop provides trade-specific tools through a multi-discipline platform:

1. **Computer Vision Scanning** — students photograph ingredients/parts/materials and receive automatic identification and category organization
2. **AI Project Matching** — generates relevant projects/recipes/procedures with equipment requirements, health tags, and nutritional analysis
3. **Discipline-Specific AI Assistants** — expert personas with 15 daily chat limits, conversation logging, and curriculum creation capabilities
4. **Video Skill Tracking** — in-app video recording, submission, grading with rubrics, and video library management
5. **Live Streaming Sessions** — Global Test Kitchen with scheduling, recording, classroom integration, and real-time viewer tracking
6. **Scheduled Live Sessions** — full Supabase-backed session scheduling table (dish/project name, cuisine, session type, teacher tagging, discipline silo)
7. **Nutritional Analysis** — real-time nutritional data and health tagging (Heart Healthy, Anti Inflammatory, Low Glycemic, etc.)
8. **AR/VR Practice Scenes** — interactive augmented reality and virtual reality practice with camera-based pose tracking, guided overlays, and step-by-step technique feedback; discipline-specific theme colors; AR/VR mode toggle via `PracticeModeSwitch`; device selection modal for AR-on-device vs. headset modes; rendered by shared `GenericFirstPersonARScene` component; AI-generated per discipline
9. **AR Practice Scene Caching** — server-side caching of AI-generated AR scenes in Supabase to reduce generation latency and API costs
10. **Integrity Monitoring System** — comprehensive academic integrity tracking with plagiarism detection, completion pattern analysis, activity anomaly monitoring, and admin alert review workflow — backed by 4 dedicated Supabase tables (completion_tracking, text_submissions, user_activity_log, integrity_alerts)
11. **Single-Session Enforcement** — active_user_sessions table enforces one live browser/device session per Wristband user per tenant; prior sessions are invalidated on new login
12. **Administrative Dashboard** — 440KB+ Unified Admin Dashboard with user management, analytics, content approval, AI discipline generation, integrity alert management, and multi-discipline oversight; includes Director Vance AI widget (CTE Director persona) for admin guidance
13. **Weekly Challenge System** — rotating discipline-specific challenges with photo submission, XP rewards, and badge earning
14. **Inspirational Quote System** — daily inspiration from industry-specific leaders
15. **Job Timer Suite** — multi-timer system with preset options, serving size calculations, and audio notifications
16. **Auto-Logout Security** — inactivity detection with countdown warning modal and automatic session termination via `useAutoLogout` hook
17. **Close-on-Unload Session** — `useCloseSessionOnUnload` hook uses the Page Visibility API to detect when a tab is hidden; starts a 5-minute timer and calls the auth-close-session endpoint if the tab does not become visible again, preventing false logouts on refresh
18. **Social Timeline** — community feed with posts, likes, comments, live session announcements, and marketplace discoveries
19. **PWA Installation** — service worker registration, install prompts, and offline capabilities across all disciplines
20. **Geolocation Services** — GPS-based location discovery for nearby trade suppliers, markets, and resources
21. **Class Registration System** — student registration for live sessions and classes with confirmation workflow
22. **Terms & Privacy Management** — comprehensive terms of service and privacy policy with modal display system
23. **Unsplash Image Integration** — professional stock photography API for recipe/project images with relevance filtering
24. **YouTube Tutorial Integration** — video tutorial sourcing API (currently disabled to prevent quota issues)
25. **Ingredient Pricing System** — comprehensive price estimates and market type mapping for 300+ ingredients
26. **PDF Export System** — generate downloadable PDFs for menus, work orders, and project packages (jsPDF)
27. **Social Sharing Suite** — share content across Facebook, Twitter, Instagram, WhatsApp, Pinterest, and Slack
28. **Talent Tree System** — skill specialization trees with 9 talents per tree, unlockable at specific levels (10, 14, 25, 30, 36, 42, 48, 55, 60)
29. **WoW-Style Leveling** — 60-level progression system with XP table, level titles, icons, and milestone achievements
30. **Video Source Reliability Layer** — resilient sourcing controls for tutorial content with quota/error protection
31. **Messaging Framework** — in-app messaging center infrastructure (coming soon feature)
32. **Pose Tracking Engine** — real-time pose detection with wrist tracking and smoothing algorithms (`usePoseTracking` hook)
33. **AI Weekly Challenge Generator** — generates discipline-specific weekly challenges with structured parsing and error handling
34. **Discipline-Specific Challenge Pool** — curated weekly challenges per discipline with criteria matching and badge rewards
35. **Serverless Backend Functions** — comprehensive serverless Netlify backend for vision processing, nutrition services, authentication, API routing, AR generation, feedback submission, and download tracking
36. **Secure Vision Proxy Layer** — server-side proxy for ingredient/object detection with confidence thresholds and domain-term enhancement
37. **Nutrition Data Integration** — real-time nutrition analysis and health tagging
38. **AI Service Routing Layer** — dedicated AI routing for different use cases with timeout and error handling
39. **Service Worker Caching** — PWA service worker with cache management and network fallback strategy
40. **AI Curriculum Processor** — advanced content extraction from PDF/DOCX/TXT files with AI-powered module mapping and confidence scoring
41. **Curriculum Syllabus Hook** — `useCurriculumSyllabus` hook for structured syllabus data ingestion and processing
42. **Google Places API Integration** — location-based discovery of trade suppliers with radius search and type filtering; text search variant also available
43. **Download Tracking System** — email notifications and visitor analytics for pitch deck downloads with nodemailer integration
44. **Wristband Authentication API** — enterprise-grade SSO integration with OAuth 2.0 and session management (auth-login, auth-logout, auth-session, auth-token, auth-callback, auth-close-session serverless functions)
45. **CSRF Protection System** — comprehensive Cross-Site Request Forgery protection with token validation and secure cookies
46. **Session Encryption System** — encrypted session management with secure cookies, validation, and automatic expiration
47. **Discipline Language Audit System** — automated auditing tools for detecting language leakage across disciplines with detailed reporting (`npm run audit:discipline-language`)
48. **Comprehensive UI Skinning Framework** — translation mapping system for complete discipline adaptation across all 9 disciplines
49. **PDF Generation System** — jsPDF integration for generating progress reports, menus, work orders, and student documentation
50. **Google Maps Integration** — location-based services with Places API, mapping, and distance calculation for trade suppliers
51. **Skeuomorphic Digital Manuals** — flippable page-turning interfaces for digital cookbooks/manuals with realistic book styling
52. **Import/Export System** — comprehensive data import/export for recipes, procedures, and manual content with modal interfaces
53. **Live Session Viewer Count** — real-time viewer tracking and participant management for streaming sessions
54. **Feedback Submission System** — in-app user feedback collection routed through `submit-feedback` serverless function
55. **Admin Toggle Context** — `AdminToggleProvider` + `useAdminToggle` hook allowing staff-level admin mode switching from within the app
56. **How-To Guides** — draggable floating flier system (`HowToGuides`) for in-app instructional content; accessible from the admin navbar; flier content is easily added via a centralized array
57. **Practice Lesson Selector** — `PracticeLessonSelect` component populates AR/VR lesson pickers from live curriculum data (grouped by course); `PracticeLessonHistorySelect` shows the last practiced lesson
58. **AR/VR Mode Switch** — `PracticeModeSwitch` toggle UI component for switching between AR and VR practice modes with animated pill indicator

### Dynamic Discipline System

PorkChop uses a sophisticated skin system that adapts the entire platform experience per discipline:

1. **9 Fully Deployed Trade Disciplines** — Culinary, Plumbing, Automotive, Construction, Electrical, HVAC, Manufacturing, Logistics, Welding — each with full module, routing, AI assistant, and UI skin
2. **Dynamic UI Adaptation** — module names, assistant personas, terminology, and branding automatically adjust per discipline
3. **Discipline-Specific AI Assistants** — Chef Freddie (Culinary), Pete the Plumber (Plumbing), Garage Puddy (Automotive), Foreman Frank (Construction), Sparky the Lineman (Electrical), Freon Frankie (HVAC), Button Pusher Max (Manufacturing), Gear Jamming Daniel (Logistics), Ironworker Jake (Welding)
4. **Tojimaster Kito** — admin-facing curriculum assistant persona, available in the Unified Admin Dashboard for creating assignments, lesson plans, rubrics, and mapping curriculum to modules
5. **Director Vance** — CTE Director AI persona available inside the admin dashboard for institutional guidance on student management, reports, and platform operations
6. **Custom Program Creation** — admins can instantly generate new trade disciplines using AI with custom names and context; custom disciplines load from Supabase (`custom_disciplines` table) and receive generic module routes (`/my-workspace`, `/my-notebook`, `/community`, `/school`) rendering culinary base components
7. **Row-Level Security Silos** — user_kitchen and user_cookbook tables enforce discipline-level data isolation via RLS policies; custom discipline slugs are supported
8. **Administrative Tools** — comprehensive Unified Admin Dashboard for user management, analytics, content approval, integrity monitoring, and multi-discipline oversight

**Result:** Programs that once required significant custom setup can be launched much faster, helping schools respond to workforce demand with less technical overhead.

---

## Platform Overview

- **Progressive Web App** — mobile-friendly, installable on devices, offline-capable with responsive design across desktop, tablet, and mobile
- **Service Worker Integration** — automatic registration, offline caching, and install prompts with cache management and network fallback
- **Enterprise-grade authentication** — Wristband OAuth 2.0 multi-tenant architecture so each school operates in its own secure environment; Wristband JWT is passed to Supabase for RLS-enforced data access
- **Single-Session Enforcement** — `active_user_sessions` table prevents concurrent logins; session state is tri-state: `current`, `orphaned`, or `superseded`; superseded sessions receive 401 and are forced to re-authenticate; fails open if the table is unavailable to avoid hard blocking users
- **Auto-Logout Security** — inactivity detection with countdown warning modal and automatic session termination
- **Multi-discipline architecture** — 9 built-in trade programs with dynamic skin system + unlimited custom program generation
- **AI-powered core** — computer vision, natural language AI (Anthropic Claude), and discipline-specific intelligence woven throughout
- **Multi-language support** — internationalized (English + Spanish, extensible to additional languages) via i18next + react-i18next
- **Subscription billing** — built-in payment infrastructure for institutional licensing
- **Secure by design** — all sensitive operations handled server-side via Netlify Functions; session management with auto-logout; cost controls on AI usage; CSRF protection; encrypted session management; OAuth 2.0 SSO; RLS on every Supabase table
- **Code protection** — JavaScript obfuscation in production builds via `javascript-obfuscator` + `rollup-plugin-obfuscator`
- **Purpose-built for trades** — specifically designed for hands-on skill training, not adapted from academic platforms

---

## 9 Deployed Disciplines — Module Name Map

| Discipline | Workspace | Notebook | Community | School |
|---|---|---|---|---|
| **Culinary** | My Kitchen | My CookBook | Chef's Corner | Culinary School |
| **Plumbing** | My Van | My PipeBook | Pipe Lounge | Plumbing School |
| **Automotive** | My Garage | My Manual | Gearhead Lounge | Auto School |
| **Construction** | My Site | My Blueprints | Hardhat Hub | Build School |
| **Electrical** | My Panel | My CodeBook | Wire Lounge | Elec School |
| **HVAC** | My Shop | My SpecSheets | Tech Talk | HVAC School |
| **Manufacturing** | My Floor | My Playbook | Shop Talk | MFG Academy |
| **Logistics** | My Dock | My Runbook | Dispatch Lounge | Logistics School |
| **Welding** | My Booth | My WeldBook | Welders Hub | Welding School |

*Custom disciplines use generic routes: My Workspace / My Notebook / Community / School*

---

## Core Modules

*Module names adapt to each discipline across all 9 tracks. All functionality remains consistent.*

### 1. Workspace Module — Resource Management & Project Matching

Students photograph their available ingredients/parts/materials. Computer vision identifies and categorizes items. AI generates projects matched to what they actually have.

- **AI-powered scanning** — photograph ingredients/parts/materials for automatic identification and categorization via secure server-side vision proxy
- **Digital inventory** — persistent Supabase storage organized by categories (discipline-specific; culinary has 10 categories)
- **Intelligent matching** — AI generates projects/recipes/procedures adapted to skill level and available materials
- **Category management** — organized storage with search and filtering capabilities
- **Discipline-level data silo** — RLS enforced per discipline slug; custom discipline slugs supported

### 2. Notebook Module — Project Portfolio & Academic Gradebook

A digital project portfolio that doubles as a grading system for each program.

- **Content management** — save, organize, search, and filter projects with comprehensive import/export capabilities
- **Interactive skeuomorphic UI** — page-turning interface with realistic book styling (`FlippableCookbook`)
- **Collections & sharing** — themed groupings and social sharing across multiple platforms
- **Video submission system** — students record technique videos directly in-app with grading rubrics
- **Assignment management** — weekly assignments with points, weights, and due dates
- **Gradebook** — instructor grading with customizable rubrics (knife skills, plating, safety, etc.)
- **Video library** — categorized video archive for practice review with viewer tracking
- **Discipline-level data silo** — user_cookbook table RLS enforced per discipline slug

### 3. School Module — Educational Content, AR Practice & Challenges

Structured learning with techniques, tutorials, AR-powered hands-on practice, and weekly challenges.

- **Educational techniques** — fundamental skills organized across domains appropriate to each discipline
- **Automatic tutorial sourcing** — matched video content for projects and techniques
- **Built-in timing tools** — for practice sessions and timed exercises
- **AR/VR Practice Integration** — interactive AR and VR practice scenes with pose tracking, guided overlays, and step-by-step technique feedback; discipline-specific theme colors; AR/VR mode toggle and device selection modal; shared `GenericFirstPersonARScene` renderer; scenes AI-generated per discipline by `generate-ar-practice` serverless function and cached in Supabase
- **Job Timer Suite** — multi-timer system with preset options, serving size calculations, and audio notifications
- **AI Weekly Challenge Generator** — discipline-specific challenges generated via Anthropic with structured parsing and error handling
- **Educational content display** — structured course content and lessons

### 4. Community Module — Live Streaming, Scheduling & Local Resources

Social hub with live streaming, session scheduling, local resource discovery, and business skill development.

- **Global Test Kitchen** — live streaming sessions with scheduling, recording, classroom integration, and real-time viewer tracking
- **Scheduled Sessions** — full schedule management backed by `schedule_sessions` Supabase table (dish/project, cuisine, session type, teacher tag, discipline silo, date/time)
- **Market Directory** — discover nearby grocery stores, markets, and specialty shops with mapping
- **Build Menu** — create menus from saved recipes with serving size adjustments, PDF export with jsPDF, and social sharing
- **Content Showcase** — feature projects with full nutritional breakdown, serving adjustments, and social media sharing
- **Local Resources** — location-based discovery of trade-specific suppliers and services with GPS geolocation and pricing estimates
- **Import/Export System** — comprehensive data import/export for recipes, procedures, and manual content with modal interfaces
- **Skeuomorphic Digital Manuals** — flippable page-turning interfaces for digital manuals with realistic book styling
- **Social Timeline** — community feed with posts, likes, comments, live session announcements, and marketplace discoveries

---

## Cross-Cutting Features

### Discipline-Specific AI Assistants
A contextual AI assistant available on every page, customized to each discipline:

- **Chef Freddie** (Culinary) — recipes, techniques, nutrition
- **Pete the Plumber** (Plumbing) — systems, codes, troubleshooting
- **Garage Puddy** (Automotive) — diagnostics, repairs, brake/engine procedures
- **Foreman Frank** (Construction) — blueprints, framing, site safety
- **Sparky the Lineman** (Electrical) — circuits, NEC code, panel installation
- **Freon Frankie** (HVAC) — refrigeration, heat pumps, EPA 608 prep
- **Button Pusher Max** (Manufacturing) — quality control, lean manufacturing, precision measurement
- **Gear Jamming Daniel** (Logistics) — supply chain, freight routing, warehouse operations
- **Ironworker Jake** (Welding) — welding techniques, electrode angles, process selection (SMAW/GMAW/GTAW/FCAW)

Each assistant is trained on discipline-specific knowledge, adapts its persona to the trade, and maintains conversation history for institutional analytics.

### Integrity Monitoring System
A fully operational academic integrity infrastructure backed by 4 dedicated Supabase tables:

- **completion_tracking** — detects bot-like or unusually fast module completions; `duration_seconds` computed column auto-calculates from start/end timestamps
- **text_submissions** — stores assignment/post text for plagiarism detection with similarity scoring and `similar_submissions` JSONB
- **user_activity_log** — logs logins, page events, and other activities with IP address, user agent, and JSONB metadata for anomaly detection
- **integrity_alerts** — admin-reviewable alerts with severity levels, review workflow (reviewed_by, review_notes), and full RLS gating
- **Integrity service layer** — `integrityMonitoring.ts` service (13KB) with typed functions for inserting and querying all four tables
- **Admin UI** — integrated integrity alert management in Unified Admin Dashboard with review/dismiss workflow

### Gamification System
- **60-level progression** inspired by WoW Classic with comprehensive XP table and milestone achievements
- **Level titles** follow real trade hierarchies with discipline-specific icons
- **XP rewards** for meaningful actions: daily logins, project completions, lesson progress, challenge completions, and more
- **Badges** across multiple categories: Weekly Challenge, Milestone, Difficulty, Theme, Streak, Community, and Special
- **Weekly Challenge System** — rotating themed challenges with photo submission, XP rewards, and unique badges
- **Tip of the Day** — daily educational tips with 365-day rotation and lightbulb interface
- **Talent Tree System** — skill specialization trees with 9 talents per tree, unlockable at specific levels (10, 14, 25, 30, 36, 42, 48, 55, 60)

### Unified Admin Dashboard
A 440KB+ single-component institutional administration panel:

- **User management** — student, faculty, and alumni directories with multi-discipline filtering
- **Analytics** — activity tracking, program performance, enrollment health, content analytics
- **Multi-discipline filtering** — view data across all programs or filter by specific discipline (including custom disciplines loaded from Supabase)
- **AI Curriculum Processor** — upload syllabi and course documents; AI extracts and maps content to platform modules with confidence scoring for admin review
- **Dynamic Discipline Generator** — `aiDisciplineGenerator.ts` service (9KB); create new trade programs instantly via AI-powered configuration
- **Integrity Alert Management** — review and manage plagiarism alerts, completion pattern anomalies, and activity monitoring with full review workflow
- **Tojimaster Kito widget** — curriculum assistant for building assignments, rubrics, and lesson plans directly from the admin panel
- **Director Vance widget** — CTE Director AI persona for institutional operational guidance
- **Branding & configuration** — school-specific customization and module toggling
- **Job placement tracking** — post-graduation employment data
- **Data export** — institutional reporting tools
- **Enterprise SSO Integration** — OAuth 2.0 Wristband authentication with session management

### Authentication & Session Security
- **Wristband OAuth 2.0** — 6 serverless auth functions (login, logout, session, token, callback, close-session)
- **JWT bridge** — Wristband JWT injected into Supabase client via `setSupabaseJwt()` before first authenticated request
- **Single-session enforcement** — `active_user_sessions` Supabase table; new login invalidates all prior sessions per tenant
- **Auto-logout** — `useAutoLogout` hook with configurable inactivity timeout, countdown warning modal, and hard termination
- **Close-on-unload** — `useCloseSessionOnUnload` hook uses Page Visibility API; 5-minute hidden-tab timer before firing auth-close-session; cancels on tab refocus to prevent false logouts on reload
- **CSRF protection** — token validation and secure cookies on all mutating serverless endpoints
- **Session encryption** — iron-webcrypto encrypted session cookies with automatic expiration

### Student Progress Dashboard
- Curriculum progress tracking
- Skills assessment overview
- Engagement metrics
- Live session discovery

### Profile & Preferences
- **Editable profile** with discipline-specific preferences (dietary, cuisine, kitchen setup, vehicle types, certifications, etc.)
- **XP display** with discipline-specific level titles and icons from Novice to Master tier
- **AI-generated progress reports** exportable to PDF with jsPDF integration
- **Fully responsive** across all device types with adaptive UI
- **i18n support** — English + Spanish with profile-level i18n guards enforced by `check:profile-i18n` CI script

---

## Serverless Backend (Netlify Functions)

| Function | Purpose |
|---|---|
| `auth-login` | Wristband OAuth login initiation |
| `auth-logout` | Session termination + redirect |
| `auth-session` | Session validation + JWT extraction |
| `auth-token` | Token exchange |
| `auth-callback` | OAuth callback handler |
| `auth-close-session` | Explicit session close (tab unload) |
| `vision-proxy` | Server-side computer vision with confidence thresholds |
| `anthropic-proxy` | General Anthropic AI routing |
| `chefFreddieQuery` | Discipline assistant query handler |
| `generate-ar-practice` | AI-generated AR/VR practice scenes per discipline (TypeScript, Anthropic claude-opus-4-5); checks `ar_scenes_cache` first |
| `content-processor` | PDF/DOCX/TXT syllabus extraction + AI module mapping; discipline-aware prompts for Culinary, Plumbing, HVAC (generic fallback for others); detects single-lesson vs. multi-lesson syllabus |
| `usda-nutrition` | USDA nutrition data lookup |
| `get-places` | Google Places radius search |
| `text-search-places` | Google Places text search |
| `track-download` | Pitch deck download analytics + nodemailer notifications |
| `submit-feedback` | In-app user feedback collection |

---

## Database Schema Highlights (Supabase)

| Table | Purpose | Added |
|---|---|---|
| `users` | Core user profiles | Base |
| `user_kitchen` | Workspace inventory (discipline-siloed RLS) | Apr 2026 |
| `user_cookbook` | Notebook content (discipline-siloed RLS) | Jun 3, 2026 |
| `custom_disciplines` | AI-generated custom discipline registry | Mar 2025 |
| `completion_tracking` | Integrity: module completion timing | Jun 8, 2026 |
| `text_submissions` | Integrity: plagiarism detection store | Jun 8, 2026 |
| `user_activity_log` | Integrity: activity anomaly tracking | Jun 8, 2026 |
| `integrity_alerts` | Integrity: admin-reviewable flagged events | Jun 8, 2026 |
| `ar_scenes_cache` | Cached AI-generated AR practice scenes | Jun 9, 2026 |
| `active_user_sessions` | Single-session enforcement per tenant | Jun 10, 2026 |
| `schedule_sessions` | Live session scheduling (discipline-siloed) | Jun 15, 2026 |

---

## Monetization Model

- **B2B SaaS** — sold to culinary schools and trade institutions
- **Multi-tenant** — each school is an isolated environment
- **Subscription billing** — institutional licensing with built-in payment infrastructure
- **Marketplace** — future revenue stream via a built-in marketplace for trade products and services

---

## Competitive Positioning

| Capability | Legacy LMS (Blackboard/Canvas) | PorkChop |
|-----------|-------------------------------|----------|
| Discipline-specific tools | No | Purpose-built for 9 trade disciplines |
| Multi-discipline support | Generic modules only | Native support across all trade programs |
| Custom program creation | Requires vendor development | Instant AI-powered generation |
| AI resource scanning | No | Computer vision with auto-categorization |
| AI project generation | No | Skill-adapted project matching |
| Video skill assessment | Basic file upload | In-app recording + rubric grading |
| AR guided practice | No | AI-generated AR scenes with pose tracking per discipline |
| Academic integrity monitoring | Basic | 4-table RLS-enforced integrity system with admin review workflow |
| Single-session enforcement | No | Per-tenant active session enforcement |
| Discipline-specific data | No | Real industry data (nutrition, specs, etc.) |
| Gamification | Basic badges | 60-level progression + 120 badges + talent trees |
| Interactive practice | No | Guided AR technique practice with cached scenes |
| Resource discovery | No | Nearby resource finder with mapping |
| Curriculum auto-mapping | No | AI content processor with confidence scoring |
| Multi-tenant white-label | Limited | Full school branding + tenant isolation + RLS silos |
| Session scheduling | No | Full schedule table with discipline silo + teacher tagging |

---

*PorkChop — Because trade students deserve better than crossword puzzles.*
