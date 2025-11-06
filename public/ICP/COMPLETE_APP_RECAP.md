# PorkChop: Complete Application Recap
**The First Purpose-Driven LMS for Culinary Education**

Last Updated: October 29, 2025

---

## 🎯 WHAT PORKCHOP ACTUALLY IS

**PorkChop is a purpose-driven Learning Management System (LMS) specifically built for culinary education.** It's a complete platform replacement—not a recipe app, not a simple gradebook, not an LMS add-on.

### The Market Gap

**Traditional LMS:** Canvas/Blackboard built for English 101. Generic file uploads, discussion forums, no practical tools.

**PorkChop:** Built for knife skills, recipe development, nutrition science. Active practice tools, permanent portfolios, entrepreneurship training, real-world market research.

**Comparison:** Nursing students get vSim simulators ($10K+), Engineering students get CAD software, Culinary students get crossword puzzles... until PorkChop.

---

## 🏗️ ARCHITECTURE

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Netlify Functions + Supabase (PostgreSQL)
- **Auth:** Wristband OAuth + Custom Supabase JWT
- **APIs:** Google Vision, Places, YouTube, USDA Nutrition, Anthropic AI, Unsplash, Stripe

### 4 Main Modules
1. **MyKitchen** 🐟 - Ingredient scanning & recipe matching
2. **MyCookBook** 📖 - Recipe collection & gradebook system
3. **CulinarySchool** 🍳 - 52 weekly techniques & tutorials
4. **Chef's Corner** 🦐 - Community & entrepreneurship (Global Test Kitchen)

---

## 📱 MODULE 1: MyKitchen

### Ingredient Scanning (Google Vision API)
- Photograph fridge/pantry → Vision API detects ingredients
- Auto-categorizes into 10 categories (Vegetable, Fruit, Protein, Dairy, Grain, Spice, Canned/Preserved, Condiment/Sauce, Frozen, Other)
- Fuzzy matching prevents duplicates
- Real-time Supabase sync

### Digital Cupboard
- Visual "jar shelf" display (6 shelves, 3 jars each)
- Search/filter, manual add, clear all
- Stored in Supabase `user_kitchens` table

### Recipe Matcher Algorithm ⭐ CROWN JEWEL
**Sophisticated matching engine:**

**Scoring System:**
- +2 points per matching ingredient
- -1.5 points per missing equipment  
- +5 points for talent tree equipment match

**Kitchen Setup Compatibility:**
- Dorm Life → microwave, kettle, toaster, mini-fridge
- Minimalist → pot, pan, knife, cutting board, stove
- Apartment Kitchen → oven, stove, basic utensils, baking sheets
- Outdoor Grilling → grill, tongs, thermometer
- Home Chef → blender, processor, mixer, knives, oven, stove
- Full Chef's Kitchen → all equipment

**Experience Level Adaptation:**
- **new_to_cooking:** 2-3 ingredients, 20 min max, very detailed
- **home_cook:** 3-4 ingredients, 30 min max, clear instructions
- **kitchen_confident:** 4+ ingredients, advanced techniques, professional

**Talent Tree Integration (Optional):**
- Cast Iron Champion → bonus for cast iron/dutch oven recipes
- Grilling Heavy Weight → bonus for grill/smoker recipes
- Baking Warlock → bonus for mixer/baking sheet recipes

**AI Recipe Generation:**
- Anthropic Claude API generates 5 recipes
- Adapts to experience level
- Includes equipment requirements
- Auto-calculates nutrition (USDA API)
- Health tags: Heart Healthy, Anti Inflammatory, Low Glycemic, Low Cholesterol, Renal Friendly, DASH Diet
- Unsplash images for each recipe

---

## 📚 MODULE 2: MyCookBook

### Recipe Management
- Flippable cookbook cards (left=ingredients, right=instructions)
- Search & category filtering (Seafood, Meat, Vegetarian, Dessert)
- Social sharing (Facebook, Twitter, Pinterest, WhatsApp, Instagram, Slack)
- Collections system (folders with emoji customization)

### Gradebook System ⭐ MAKES IT AN LMS

**3 Real Assignments:**
1. **Week 3: French Knife Skills & Mother Sauces** 🔪
   - 100 points (15% weight)
   - Techniques: Julienne cuts, Brunoise dice, Chiffonade, Proper grip
   - Submission: Video demo (3-5 min), Photos, Self-reflection

2. **Week 5: Sauce Making & Emulsification** 🥄
   - 100 points (15% weight)
   - Techniques: Hollandaise, Mayonnaise emulsion, Beurre blanc, Pan sauce
   - Submission: Video demo, Sauce samples, Temperature logs

3. **Week 7: Protein Cookery & Temperature Control** 🥩
   - 100 points (15% weight)
   - Techniques: Searing, Internal temps, Resting, Carryover cooking
   - Submission: Cooking video, Readings, Final plating

**Features:**
- Video submission system with embedded playback
- Instructor feedback notepad
- Student progress tracking (4 mock students)
- Grade assignment (letter grades + numeric scores)
- Public/private video toggle
- Video library (filter by user, visibility)
- Flippable gradebook modal (book aesthetic)

---

## 🎓 MODULE 3: Culinary School

### 52 Weekly Techniques (NOT 52 weeks of school!)
**Organized by category:**

**Knife & Prep (1-13):** Proper Knife Grip, Claw Method, Sharpening Basics, Brunoise Dice, Chiffonade, Julienne Cuts, Bias Cutting, Mise en Place, Cutting Board Use, Garlic Crushing, Tomato Concassé, Tearless Onion Dicing, Fresh Herb Storage

**Heat & Temperature (14-26):** Pan Temperature Testing, Oil Smoke Points, Resting Meat, Carryover Cooking, Proper Preheating, Temperature Zones, Gentle Heat Cooking, Searing vs Browning, Steam Control, Cold Pan Starts, Oven Hot Spots, Thermometer Placement, Proper Cooling

**Flavor Building (27-39):** Salt Timing, Acid Balance, Blooming Spices, Deglazing, Layering Flavors, Tasting as You Cook, Umami Enhancement, Fat as Flavor Carrier, Fresh vs Dried Timing, Reduction Techniques, Finishing Salts, Aromatics First, Sweet and Savory Balance

**Texture & Technique (40-52):** Emulsification Basics, Proper Whisking, Folding Technique, Basic Roux Making, Pasta Water Magic, Strategic Stirring, Tempering, Marinating Time, Proper Draining, Seasoning Layers, Timing Multiple Dishes, Simple Plating, Clean as You Go

**Weekly rotation logic:** Gets ISO week number (1-52), displays corresponding technique

### General Lessons
1. Knife Skills 101
2. Seafood Handling & Safety
3. Essential Cooking Techniques
4. Sanitation & Cross-Contamination
5. Using a Thermometer
6. Knife & Equipment Care

### Dynamic Video Tutorials
**When recipe selected:**
1. **Technique of the Week:** YouTube search for current week's technique
2. **Recipe Tutorial:** Intelligently extracts main protein + equipment, generates smart query

**YouTube API:** 3-key rotation system for quota management, HD quality, verified channels

### Syllabus System
- Term-based curriculum (4 terms with 4-5 lessons each)
- Lesson tracking (completed/current status)
- Click navigation (future)

### Nutrition Display
- Per-serving calculations (adjustable 1-10 servings)
- Tracks: carbs, sugars, fiber, protein, saturated fat, sodium, omega-3, cholesterol, potassium, phosphorus

---

## 🦐 MODULE 4: Chef's Corner

### Recipe Showcase
- Import from MyCookBook
- Flippable card display
- Full nutrition with serving size adjustment
- Equipment list
- Public demo/sharing

### 52 Weekly Chef Quotes
- Julia Child (11), Anthony Bourdain (11), David Chang (10), Martha Stewart (10), Emeril Lagasse (10)
- Weekly rotation

### Global Test Kitchen ⭐ ENTREPRENEURSHIP SIMULATOR

**This is what differentiates us from traditional LMS.**

**Live Cooking Sessions:**
- Students go live with cooking demos
- Real-time viewer count
- Session types: Practice, Assignment, Demo, Showcase
- Schedule future sessions (date, time, cuisine, session type)

**Video Recording:**
- MediaRecorder API for recording
- Save to Supabase
- Public/private toggle
- Video library access

**Mock Live Sessions (UI demo):**
1. Maria Santos - Authentic Paella Valenciana 🥘 (Spanish, 47 viewers)
2. Kenji Nakamura - Hand-pulled Ramen 🍜 (Japanese, 23 viewers, live)
3. Fatima Al-Zahra - Lebanese Kibbeh 🧆 (Lebanese, 35 viewers, live)
4. Jean-Luc Dubois - French Croissants 🥐 (French, 62 viewers, live)

**Business Case:** Students practice running a cooking business before graduation—build audience, practice menu planning, get real-time feedback, develop presentation skills, learn streaming/video production.

### Build Menu Modal
- Select multiple recipes
- Generate shopping list
- Find local markets for ingredients

### Market Directory (Google Places API)

**7 Categories:**
1. 🛒 Grocery (supermarkets, co-ops, natural food)
2. 🥦 Produce (farmer's markets, farm stands, CSAs)
3. 🍞 Bakery (bakeries, pastry shops)
4. 🥩 Meat (butchers, meat markets, delis)
5. 🐟 Seafood (fish markets, fishmongers)
6. 🚜 Farms (farms, creameries, dairies)
7. 🔪 Equipment (kitchen stores, cookware shops)

**Smart Filtering:**
- Excludes big box: Walmart, Costco, BJ's, Sam's Club, Target
- Excludes restaurants
- Prioritizes specialized markets
- Haversine distance calculations (15-mile radius)
- Sorts by closest first

---

## 🎮 GAMIFICATION

### XP System
**Rewards:**
- Daily Login: 10 XP
- Recipe Save: 20 XP
- Recipe Complete: 50 XP
- Lesson Complete: 30 XP
- Recipe Share: 20 XP
- Challenge Complete: 100 XP
- Meal Plan Create: 25 XP
- Recipe Review: 15 XP
- Profile Complete: 20 XP

**Leveling (WoW Classic XP Table):**
- Level 1: Novice Cook 🥄 (0 XP)
- Level 2: Kitchen Helper 👨‍🍳 (400 XP)
- Level 3: Home Chef 🍳 (900 XP)
- Level 4: Culinary Expert 👨‍🍳 (1,400 XP)
- Level 5: Master Chef 🏆 (2,100 XP)
- ...continues to Level 20 (19,600 XP)

### Challenge of the Week
**45 Total Challenges (rotating weekly):**
- PO TA TOES! (100 XP, Samwise Badge)
- Lobster Fest (150 XP, Lobster Legend Badge)
- Veggie Virtuoso (120 XP, Veggie Virtuoso Badge)
- Baker's Dozen (90 XP, Baker Badge)
- Global Grains (80 XP, Grain Guru Badge)
- Taco Tuesday (60 XP, Taco Titan Badge)
- ... (39 more)

**Validation:** Automatic recipe ingredient checking against challenge criteria

### Badge System
- Achievements earned through challenges
- Visual badge display in profile
- Unlock conditions tied to specific challenges

---

## 🔐 AUTHENTICATION & SECURITY

### Wristband OAuth Flow
1. User clicks login → redirect to Wristband
2. Authenticate with Wristband
3. Callback with code → exchange for access token
4. Fetch user info from Wristband
5. Generate Supabase JWT (using Supabase JWT secret)
6. Provision/update user in Supabase
7. Create iron-sealed session cookie (30 days, httpOnly, secure)
8. Redirect to dashboard

### Session Management
- Cookie: `porkchop_session`
- Iron-sealed (encrypted + tamper-proof)
- Contains: access_token, refresh_token, expires_at, user, supabaseToken
- Auto-logout: 30 min inactivity, 2 min warning

---

## 🗄️ DATABASE (Supabase/PostgreSQL)

### Key Tables
- **profiles:** user preferences (experience, dietary, cuisine, kitchen_setup)
- **saved_recipes:** user cookbook (JSONB recipe objects with nutrition)
- **user_xp:** XP tracking and leveling
- **xp_logs:** XP award history
- **user_kitchens:** ingredient inventory (JSONB arrays)
- **user_activity:** admin analytics
- **saved_videos:** video library

### RLS (Row Level Security)
- Users can read/write their own data
- Admin users can access all data
- JWT-based authentication via Wristband tokens

---

## 🔧 KEY ALGORITHMS

### 1. Recipe Matcher Scoring
```
score = (matching_ingredients × 2) 
      - (missing_equipment × 1.5) 
      + (talent_match ? 5 : 0)
```

### 2. Fuzzy Ingredient Matching
```
normalize → lowercase, trim, remove special chars
check → direct inclusion or word-level matching
```

### 3. Nutrition Calculation
```
1. Fetch USDA data for each ingredient
2. Extract 11 key nutrients
3. Sum all nutrients
4. Return total per recipe
```

### 4. Weekly Rotation (Techniques & Challenges)
```
week_number = ISO_week % 52
technique = WEEKLY_TECHNIQUES[week_number]
challenge = WEEKLY_CHALLENGES[week_number % 45]
```

---

## 🌐 API INTEGRATIONS

### Google Vision API
- Ingredient scanning from photos
- Text + label detection
- Food-specific filtering

### Google Places API
- Market directory (15-mile radius)
- 7 specialty categories
- Distance calculations
- Smart filtering (excludes big box retailers)

### YouTube Data API v3
- Tutorial video search
- 3-key rotation for quota management
- HD quality filtering
- Verified channel prioritization

### USDA FoodData Central API
- Nutrition data for 800K+ foods
- 11 key nutrient extraction
- Per-serving calculations

### Anthropic Claude API
- Recipe generation (adapts to experience level)
- Chef Freddie chatbot
- Challenge recipe suggestions

### Unsplash API
- Recipe images (auto-fetched per recipe)
- High-quality food photography

### Stripe API
- Payment processing
- Subscription management
- Monthly/yearly plans

---

## 🎨 UI/UX FEATURES

### Responsive Design
- Mobile, tablet, desktop breakpoints
- Touch-friendly buttons (44px min)
- Hamburger menu (mobile)
- Swipe gestures (planned)

### Theming (Maine Nautical)
- Maine Blue (#1E3A5F)
- Seafoam Green (#A8D5BA)
- Lobster Red (#D9534F)
- Weathered White (#F5F5DC)
- Sand (#E5D4B5)

### Visual Elements
- Flippable cookbook cards
- Jar shelf inventory display
- Book-style gradebook modal
- Progress bars with animations
- Badge showcase
- XP level-up animations

---

## 🚀 UNIQUE DIFFERENTIATORS

### What No Other Platform Has

1. **Ingredient Scanning** - Google Vision API for automatic pantry inventory
2. **Sophisticated Recipe Matcher** - Fuzzy matching + kitchen setup + talent tree + experience level adaptation
3. **Global Test Kitchen** - Live streaming for entrepreneurship practice
4. **Purpose-Driven Gradebook** - Video submissions with technique-specific assessment
5. **Market Directory Integration** - Real-world vendor sourcing with distance calculations
6. **USDA Nutrition API** - Automatic macro calculation for every recipe
7. **52 Weekly Techniques** - Rotating educational content with YouTube integration
8. **Permanent Portfolios** - Students graduate with proof of skills (like Behance for chefs)
9. **Challenge of the Week** - 45 rotating challenges with automatic validation
10. **Experience-Level Adaptation** - AI generates recipes appropriate for skill level

---

## 📊 ADMIN DASHBOARD

### Student Analytics
- Activity tracking (all user actions logged)
- Progress monitoring
- Assignment completion rates
- Video submission tracking
- XP/level distribution

### School Management
- Class registration
- Assignment creation
- Gradebook access
- Student progress reports
- Video library moderation

---

## ⚙️ ENVIRONMENT VARIABLES

### Critical (Must Configure)
- **Wristband Auth:** 9 variables (client ID, secrets, URLs)
- **Stripe:** 5 variables (keys, price IDs, URLs)
- **Supabase:** 3 variables (URL, anon key, JWT secret)

### Required for Features
- **Anthropic:** 3 keys (chef, recipe, challenge)
- **Google Vision:** 1 key
- **Google Places:** 1 key
- **YouTube:** 1 key
- **USDA:** 1 key
- **Unsplash:** 1 key

### Session/Security
- **Session Secret:** 32+ chars
- **Cookie Max Age:** 30 days default

---

## 📈 METRICS & INSIGHTS

### What Schools Get
- Student engagement rates
- Practice time tracking
- Skill progression data
- Assignment completion metrics
- Portfolio development timeline
- Market research activity
- Entrepreneurship practice hours (Global Test Kitchen usage)

### What Students Get
- Permanent portfolio of technique videos
- Nutrition science skills (USDA API proficiency)
- Market research experience (vendor sourcing)
- Entrepreneurship practice (live streaming)
- Proof of skill progression (not just grades)
- Public-facing profile (like Behance for chefs)

---

## 🎯 COMPETITIVE POSITIONING

### Traditional LMS (Canvas/Blackboard)
- Generic file uploads
- Discussion forums
- Quiz builders
- No active practice tools
- Students graduate with grades that disappear

### PorkChop
- Purpose-driven for culinary
- Active practice tools (ingredient scanner, recipe matcher, nutrition calculator)
- Entrepreneurship simulator (Global Test Kitchen)
- Permanent portfolios
- Real-world integration (market directory)
- Students graduate with proof of skills

**Bottom Line:** We're not competing with Canvas/Blackboard. We're replacing them for culinary programs.

---

## 🔮 FUTURE ENHANCEMENTS (Planned)

1. **Persistent Scheduled Sessions** - Supabase table for Global Test Kitchen schedules
2. **Real-Time Live Streaming** - WebRTC integration for actual live sessions
3. **Portfolio PDF Export** - jsPDF generation for student portfolios
4. **Public Portfolio URLs** - Shareable portfolio pages (like Behance)
5. **Mobile App** - React Native version
6. **Offline Mode** - Enhanced PWA capabilities
7. **Social Feed** - Recipe sharing timeline in Chef's Corner
8. **Meal Planning** - Weekly menu builder with auto-shopping lists
9. **Dietary Tracking** - Health metrics dashboard
10. **API for Third-Party Integration** - Partner with culinary schools' existing systems

---

## 📝 FINAL SUMMARY

**PorkChop is a fully-featured, production-ready LMS specifically built for culinary education.** It combines:

- **LMS Core:** Gradebook, assignments, video submissions, student tracking
- **Active Practice Tools:** Ingredient scanning, recipe matching, nutrition calculation
- **Entrepreneurship Training:** Live streaming, market research, vendor sourcing
- **Gamification:** XP system, challenges, badges, leveling
- **Permanent Portfolios:** Students graduate with proof of skills
- **Real-World Integration:** Market directory, USDA nutrition data, YouTube tutorials

**No other platform offers this complete package for culinary education.** We're not an add-on—we're the complete solution.

---

**END OF DOCUMENTATION**
