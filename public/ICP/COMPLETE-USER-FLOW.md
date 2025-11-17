# PORKCHOP COMPLETE USER FLOW

**Last Updated:** November 6, 2025

---

## 🎓 INSTRUCTOR/ADMIN WORKFLOW

### **Initial Setup**

#### **1. Login & Access Admin Dashboard**
- Navigate to PorkChop app
- Login via Wristband OAuth
- Click **gear icon (⚙️)** in top-right navbar
- Dashboard switches to Admin Dashboard

#### **2. Upload & Distribute Curriculum**
**Location:** Content & Curriculum Tab → Module Integration

- Click **"Module Integration"** button
- **Upload course materials:**
  - Drag & drop syllabus (PDF/Word/Excel)
  - Upload recipes, assignments, lesson plans
  - Upload grading rubrics
  - Upload video content
- **Map content to modules:**
  - **MyKitchen:** Recipe databases, ingredient knowledge bases, dietary restrictions
  - **MyCookBook:** Assignment templates, grading rubrics, recipe collections, video requirements
  - **CulinarySchool:** Custom technique sequences, syllabus structures, lesson plans, learning objectives
  - **Chef's Corner:** Chef demonstration videos, industry insights, live session schedules, market partnerships
- **Set publishing options:**
  - Choose publish date
  - Set visibility (All Students / Specific Classes / Draft)
  - Configure notifications (Notify Students / Silent Update / Email Announcement)
- Click **"Publish to Modules"**

#### **3. Enroll Students**
**Location:** User Management Tab → Student Management

- Click **"Student Management"** button
- **View student overview:**
  - Total students enrolled
  - Active students (last 7 days)
  - Average XP per student
  - Inactive students needing attention
- **Add students (Option A - Bulk Import):**
  - Click **"Import Students (CSV)"**
  - Upload CSV file with columns: email, name
  - System creates accounts and sends invitations
- **Add students (Option B - Manual):**
  - Click **"+ Add Student"**
  - Enter name, email, phone, program
  - Click save
- **Manage individual students:**
  - Edit student information
  - Adjust XP levels manually
  - Remove students from roster
  - View program details

#### **4. Configure Faculty & Permissions**
**Location:** User Management Tab → Faculty Management

- Click **"Faculty Management"** button
- **View faculty overview:**
  - Total faculty count
  - Full-time vs part-time breakdown
  - Platform engagement rates
- **Add faculty members:**
  - Click **"+ Add Faculty"**
  - Enter name, email, role
  - Assign courses
- **Set permission matrix:**
  - Admin Panel access (Full / Limited / None)
  - Grade Management permissions
  - Content Creation permissions
  - Student Reports access
  - Live Sessions hosting rights

#### **5. Customize School Branding**
**Location:** System & Settings Tab → School Branding

- Upload school logo
- Set primary and secondary colors
- Configure school contact information
- Customize platform appearance

#### **6. Track Job Placement & Outcomes**
**Location:** System & Settings Tab → Job Placement Services

- **Employment Tracking:**
  - Monitor graduate employment rates
  - Track job placement statistics
  - Record average starting salaries
- **Industry Partnerships:**
  - Add restaurant/hotel partnerships
  - Track open positions
  - Monitor hiring relationships
- **Career Services:**
  - Schedule job fairs
  - Coordinate internships
  - Manage career counseling
- **Credentialing:**
  - Track ServSafe certifications
  - Monitor Food Handler permits
  - Record culinary certifications

#### **7. Manage Alumni Network**
**Location:** User Management Tab → Alumni Management

- Track graduate success stories
- Maintain alumni database
- Plan networking events and reunions
- Send newsletters to alumni
- Create and manage donation campaigns

#### **8. Export Reports & Analytics**
**Location:** System & Settings Tab → Export Reports

- **Available reports:**
  - Student Progress (skill mastery, learning analytics)
  - Class Analytics (performance metrics, live session data)
  - Culinary Metrics (recipe performance, technique analysis)
  - Operations (kitchen management, safety compliance)
  - Engagement (platform usage, community participation)
  - Session Reports (flagged content, scheduled sessions)

---

## 🎒 STUDENT WORKFLOW

### **Initial Login**

#### **1. Account Creation & Login**
- Navigate to PorkChop app
- Click login button
- Authenticate via Wristband OAuth
- Create account with school email
- Land on Dashboard

#### **2. Dashboard Overview**
**What students see:**
- Weekly Challenge banner (rotating challenges with XP rewards)
- XP Progress bar (current level and title)
- Last earned badge
- 4 main module cards:
  - 🍳 My Kitchen
  - 📖 My Cookbook
  - 🏫 Culinary School
  - 👨‍🍳 Chef's Corner
- Chef Freddie widget (bottom-right corner)

---

### **Module 1: 🍳 MyKitchen**

#### **Purpose:** "What can I cook with what I have?"

**Workflow:**
1. Click **"My Kitchen"** card from dashboard
2. **Scan ingredients:**
   - Click camera icon
   - Take photo of pantry/fridge/ingredients
   - Google Vision API identifies ingredients
   - Ingredients auto-populate in kitchen inventory
3. **Organize inventory:**
   - 10 categories: Proteins, Vegetables, Fruits, Grains, Dairy, Spices, Oils, Canned Goods, Baking, Frozen
   - Add/remove items manually
   - Set kitchen setup type (Dorm Life / Minimalist / Full Chef's Kitchen)
4. **Find recipe matches:**
   - Click **"Find Recipes"** button
   - Algorithm analyzes available ingredients
   - Shows recipes sorted by:
     - What you can make NOW (100% match)
     - What you're close to making (80%+ match)
     - Skill level compatibility
5. **Save recipes:**
   - Click heart icon to save to MyCookBook
   - Recipes sync to personal collection

**Key Features:**
- Fuzzy ingredient matching
- Kitchen setup consideration
- Talent tree integration
- User experience level adaptation

---

### **Module 2: 📖 MyCookBook**

#### **Purpose:** "My assignments, recipes, and gradebook"

**Workflow:**

#### **A. View Assignments (Gradebook)**
1. Click **"My Cookbook"** card from dashboard
2. Click **"View Gradebook"** button
3. **See instructor assignments:**
   - Assignment title (e.g., "Week 3: French Knife Skills & Mother Sauces")
   - Due date
   - Point value
   - Weight percentage
   - Status (Not Started / In Progress / Submitted / Graded)
4. **Submit assignment:**
   - Click assignment card
   - Read requirements and rubric
   - Click **"Submit Video"**
   - Choose option:
     - Record new video
     - Upload existing video
     - Link from Global Test Kitchen recording
   - Add notes/comments
   - Click **"Submit"**
5. **View feedback:**
   - See instructor comments
   - View grade/points earned
   - Watch instructor feedback video (if provided)

#### **B. Manage Recipe Collection**
1. **View saved recipes:**
   - All recipes saved from MyKitchen
   - Recipes from instructor curriculum
   - Recipes from Chef Freddie suggestions
2. **Create collections:**
   - Click **"Create Collection"**
   - Name collection (e.g., "Week 5 Sauces")
   - Add emoji icon
   - Drag recipes into collection
3. **Share recipes:**
   - Click share icon
   - Choose platform (Facebook, Twitter, WhatsApp, Email)
   - Send to classmates

**Key Features:**
- Video submission system
- Instructor feedback integration
- Recipe organization
- Social sharing

---

### **Module 3: 🏫 CulinarySchool**

#### **Purpose:** "Learn techniques and curriculum content"

**Workflow:**
1. Click **"Culinary School"** card from dashboard
2. **Browse curriculum:**
   - See instructor's uploaded curriculum structure
   - Organized by terms/weeks/units (as configured by instructor)
   - View technique sequences mapped by instructor
3. **Access lessons:**
   - Click on technique/lesson
   - Watch tutorial videos
   - Read lesson plans and instructions
   - View learning objectives
4. **Complete lessons:**
   - Mark lessons as complete
   - Earn XP for completion
   - Track progress through curriculum
5. **General lessons:**
   - Access core topics (Knife Skills, Seafood Safety, etc.)
   - Instructor-uploaded supplemental content

**Key Features:**
- Instructor-customized curriculum
- Video tutorials
- Progress tracking
- XP rewards

---

### **Module 4: 👨‍🍳 Chef's Corner**

#### **Purpose:** "Live sessions, community, and sourcing"

**Workflow:**

#### **A. Global Test Kitchen (Live Sessions)**
1. Click **"Chef's Corner"** card from dashboard
2. Click **"Global Test Kitchen"** button
3. **Join live session:**
   - See instructor's live cooking demo
   - Watch in real-time
   - View viewer count
   - See session type (Practice / Assignment / Demo / Showcase)
4. **Schedule your own session:**
   - Click **"Schedule Session"**
   - Enter dish name
   - Choose cuisine type
   - Add description
   - Set date and time
   - Add teacher tag (optional)
   - Click **"Schedule"**
5. **Go live:**
   - Click **"Go Live"** on scheduled session
   - Camera/microphone activates
   - Cook and demonstrate
   - End session
   - Choose to save video to Supabase Storage
6. **View session timeline:**
   - See upcoming sessions
   - Browse past recordings
   - Filter by cuisine type

#### **B. Market Directory**
1. Click **"Find Markets"** button
2. **Search for ingredients:**
   - Enter location or use current location
   - Choose category:
     - Seafood Markets
     - Butcher Shops
     - Produce Stands
     - Farms & Co-ops
     - Equipment Suppliers
   - View results sorted by distance
   - See ratings and hours
   - Get directions

#### **C. Build Menu**
1. Click **"Build Menu"** button
2. **Select recipes:**
   - Choose from saved recipes
   - Set serving sizes
   - Add multiple courses
3. **Generate menu:**
   - View ingredient list
   - See cost estimates
   - Export as PDF
   - Find local markets for ingredients

**Key Features:**
- Live streaming capability
- Video recording and storage
- Market integration (Google Places API)
- Menu building and costing

---

### **Always Available: 💬 Chef Freddie**

#### **Purpose:** "24/7 AI cooking assistant"

**Access:** Click chat widget in bottom-right corner (any page)

**Workflow:**
1. Click Chef Freddie widget
2. **Ask questions:**
   - "How do I make hollandaise sauce?"
   - "What can I substitute for eggs?"
   - "How long do I cook a medium-rare steak?"
3. **Get recipe suggestions:**
   - "Give me a recipe for chicken thighs"
   - "I have tomatoes and pasta, what can I make?"
4. **Troubleshoot techniques:**
   - "My sauce broke, how do I fix it?"
   - "Why is my bread dense?"
5. **Receive AI-generated responses:**
   - Powered by Anthropic Claude
   - Context-aware answers
   - Recipe generation
   - Technique explanations

**Key Features:**
- Anthropic AI integration
- Conversation history
- Recipe generation
- Technique troubleshooting

---

### **Gamification System: 🏆 XP & Badges**

#### **How Students Earn XP:**
- Complete assignments: 50-100 XP
- Finish lessons: 25 XP
- Complete weekly challenges: 75 XP
- Save recipes: 5 XP
- Host live sessions: 30 XP
- Submit videos: 40 XP

#### **Leveling System:**
- Level 1: Dishwasher 🧽 (0-100 XP)
- Level 2: Prep Cook 🔪 (100-250 XP)
- Level 3: Line Cook 🍳 (250-500 XP)
- Level 4: Sous Chef 👨‍🍳 (500-1000 XP)
- Level 5: Executive Chef 👑 (1000+ XP)

#### **Weekly Challenges:**
- 15+ rotating challenges (PO TA TOES, Lobster Fest, etc.)
- New challenge every week
- Complete challenge → earn badge
- Badges displayed on profile
- Last badge shown in navbar

**Badge Examples:**
- 🥔 Potato Master
- 🦞 Lobster Legend
- 🍝 Pasta Pro
- 🥩 Grill Master
- 🍰 Baking Boss

---

## 🔄 TYPICAL WEEKLY CYCLE

### **Monday Morning:**
**Instructor:**
- Publishes Week 5 assignment in Module Integration
- Sets due date for Friday
- Configures notification to "Notify Students"

**Student:**
- Logs in, sees notification
- Clicks MyCookBook → sees new assignment
- Reads requirements: "Demonstrate 5 mother sauces"

### **Tuesday-Thursday:**
**Student:**
- Uses MyKitchen to check ingredients
- Watches CulinarySchool tutorial on mother sauces
- Asks Chef Freddie: "What's the difference between hollandaise and béarnaise?"
- Practices techniques

### **Friday:**
**Student:**
- Cooks all 5 sauces
- Records video demonstration
- Submits via MyCookBook gradebook
- Earns 50 XP for submission

### **Weekend:**
**Instructor:**
- Reviews submitted videos in admin dashboard
- Leaves feedback comments
- Assigns grades (85/100)
- Student receives notification

### **Next Monday:**
**Student:**
- Checks feedback
- Sees grade
- Earns additional 35 XP for completion
- Levels up from Prep Cook to Line Cook
- Unlocks new badge

---

## 📊 ADMIN MONITORING & REPORTING

### **Real-Time Dashboard Metrics:**
- Total students enrolled
- Active students (last 7 days)
- Total recipes saved across all students
- Total XP earned
- Subscription status breakdown
- Inactive students needing attention

### **Student Activity Tracking:**
- Individual student XP levels
- Assignment completion rates
- Video submission status
- Chef Freddie usage
- Last login dates
- Chat counts

### **Content Analytics:**
- Most popular recipes
- Most accessed techniques
- Live session attendance
- Assignment completion rates
- Module engagement metrics

### **Export Capabilities:**
- Student roster (CSV)
- Gradebook export
- Employment data
- Alumni database
- Faculty reports
- Accreditation reports

---

## 🔐 PERMISSION LEVELS

### **Admin (Full Access):**
- All dashboard features
- Upload/publish curriculum
- Manage all students and faculty
- Configure school branding
- Export all reports
- Manage job placement
- Alumni network management

### **Instructor (Limited Access):**
- View assigned students only
- Grade assignments
- Create content for assigned courses
- Host live sessions
- View student reports
- Cannot manage faculty or school settings

### **Teaching Assistant (Restricted Access):**
- View assigned students
- Grade assignments (with approval)
- Cannot create content
- Cannot access admin settings

### **Student (No Admin Access):**
- Access 4 main modules
- Submit assignments
- Host live practice sessions
- Use Chef Freddie
- View own progress only

---

## 🎯 KEY DIFFERENTIATORS

### **What PorkChop Does That Traditional LMS Cannot:**

1. **Ingredient Scanning & Recipe Matching**
   - AI-powered ingredient identification
   - Real-time recipe matching based on available ingredients
   - Kitchen inventory management

2. **Video Portfolio System**
   - Students build cooking demonstration portfolios
   - Instructor video feedback
   - Live session recording and storage

3. **Live Cooking Sessions**
   - Real-time instruction
   - Global Test Kitchen streaming
   - Session scheduling and recording

4. **Gamification**
   - XP and leveling system
   - Weekly challenges
   - Badge achievements
   - Progress visualization

5. **Local Market Integration**
   - Google Places API integration
   - Ingredient sourcing recommendations
   - Distance-based market search

6. **Menu Building Tools**
   - Recipe cost estimation
   - PDF menu export
   - Ingredient aggregation

7. **24/7 AI Assistant**
   - Anthropic Claude integration
   - Recipe generation
   - Technique troubleshooting
   - Context-aware cooking help

8. **Nutrition Tracking**
   - USDA API integration
   - Health tag generation
   - Per-serving calculations

9. **Social Features**
   - Recipe sharing
   - Collection creation
   - Live session community
   - Peer collaboration

10. **Industry-Specific Tools**
    - Job placement tracking
    - Credentialing management
    - Alumni network
    - Industry partnerships

---

## 📱 PLATFORM ARCHITECTURE

### **Frontend:**
- React + TypeScript
- Vite build system
- TailwindCSS styling
- Responsive design (mobile/tablet/desktop)

### **Backend:**
- Netlify Functions (serverless)
- Supabase database
- Real-time subscriptions

### **Authentication:**
- Wristband OAuth integration
- Iron-sealed session cookies
- JWT token management

### **APIs & Integrations:**
- Google Vision API (ingredient scanning)
- Google Places API (market directory)
- Anthropic Claude (Chef Freddie)
- USDA API (nutrition data)
- YouTube API (video tutorials)
- Unsplash API (recipe images)
- Stripe (payments/subscriptions)

### **Storage:**
- Supabase Storage (videos, images, files)
- Database tables for all user data
- Real-time sync across sessions

---

## ✅ CURRENT STATUS

### **Fully Built (UI Complete):**
- All 4 student modules
- Complete admin dashboard
- All modals and forms
- Permission matrices
- Content distribution system
- Gamification system
- Video submission system
- Live streaming interface

### **Needs Backend Wiring:**
- 17 admin functions (currently show alerts)
- Database table creation (11 tables)
- Chef Freddie conversation logging
- Real-time dashboard updates
- Persistent scheduled sessions

### **Ready for Demo:**
- Complete user flow walkthrough
- All UI elements functional
- Mock data in place
- Professional design and branding

---

**END OF COMPLETE USER FLOW DOCUMENTATION**
