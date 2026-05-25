
A white-label LMS for trade schools. Schools upload their own curriculum and the platform adapts — content-agnostic by design, with AI-driven module population and discipline-specific theming out of the box.

## Supported Disciplines
- 🍳 **Culinary** — My Kitchen, My Cookbook, Chef's Corner, Culinary School
- ⚡ **Electrical** — My Panel, My Codebook, Wire Lounge, Elec School
- ❄️ **HVAC** — My Shop, My Spec Sheets, Tech Talk, HVAC School
- 🔩 **Plumbing** — My Van, My Pipebook, Pipe Lounge, Plumbing School
- 📦 **Logistics** — My Dock, My Runbook, Dispatch Lounge, Logistics School
- 🔧 **Automotive** — My Garage, My Manual, Gearhead Lounge, Auto School
- 🏗️ **Construction** — My Site, My Blueprints, Hardhat Hub, Build School
- 🏭 **Manufacturing** — My Floor, My Playbook, Shop Talk, Mfg Academy
- ⚙️ **Welding** — My Booth, My Weldbook, Welders Hub, Welding School
- ➕ **Custom disciplines** — configurable via Admin Dashboard + Supabase

## Core Modules (per discipline)
- **Workspace:** Hands-on practice hub (scans, uploads, job tickets, etc.)
- **Notebook:** Save and organize discipline-specific content
- **Community:** Social timeline, group finder, live sessions
- **School:** Syllabus viewer, lesson progress, bench practice
- **AI Assistant:** Contextual curriculum assistant (unique persona per discipline)
- **Admin Dashboard:** School branding, curriculum upload, gradebook, analytics

## Tech Stack
- React + TypeScript + Vite
- TailwindCSS
- Supabase (database, auth, storage)
- Wristband (authentication)
- Anthropic Claude (AI assistants + content processor)
- Stripe (payments)
- Google Vision API (ingredient/material scanning)
- Google Places API (local supplier finder)
- Unsplash (content images)
- Netlify (hosting + serverless functions)

## Setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your API keys
3. Ensure you have the Netlify CLI installed: `npm install -g netlify-cli`
4. Run `npm install`
5. Run `netlify dev`

The React app runs on [http://localhost:3000](http://localhost:3000) (with hot reload), and all user interactions should happen here.

The Netlify functions dev server runs on [http://localhost:8888](http://localhost:8888). Vite proxies all `/.netlify/functions` requests to this port automatically.

## Environment Variables
See `.env.example` for required keys.

## License
MIT
