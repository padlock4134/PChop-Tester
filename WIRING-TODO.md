# 🔧 PORKCHOP WIRING TODO

**Last Updated:** October 28, 2025  
**Status:** 85% Complete - Final admin wiring push TODAY! 🚀

**Recent Wins:**
- ✅ Build Menu feature complete (recipe selection, PDF export, market finder)
- ✅ Ingredient mapping expanded (150+ ingredients with pricing)
- ✅ Local markets modal with deduplication
- ✅ Chef Freddie curriculum assistant in admin dashboard

---

## 📊 QUICK STATS

- ✅ **Core Features:** 100% complete (all 4 modules working)
- ✅ **Build Menu Feature:** 100% complete (NEW!)
- ⚠️ **Admin Dashboard:** 20% complete (3/20 functions working)
- ⚠️ **Database Schema:** 70% complete (11 tables missing)
- ✅ **API Integrations:** Working (Anthropic, Google Vision, Places)

---

## 🗄️ STEP 1: CREATE MISSING DATABASE TABLES

Copy/paste these SQL statements into Supabase SQL Editor:

```sql
-- 1. User Activity (GlobalTestKitchen line 57)
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  component TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);

-- 2. Session Reports (GlobalTestKitchen line 197)
CREATE TABLE session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_session_reports_session_id ON session_reports(session_id);

-- 3. Scheduled Sessions (GlobalTestKitchen line 259)
CREATE TABLE scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  teacher TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_scheduled_sessions_user_id ON scheduled_sessions(user_id);
CREATE INDEX idx_scheduled_sessions_date ON scheduled_sessions(scheduled_date);

-- 4. Chat Logs (ChefFreddie analytics)
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chat_logs_user_id ON chat_logs(user_id);
CREATE INDEX idx_chat_logs_created_at ON chat_logs(created_at);

-- 5. Faculty
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'teaching_assistant', 'department_head')),
  courses TEXT[],
  students_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_faculty_user_id ON faculty(user_id);

-- 6. Alumni
CREATE TABLE alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  graduation_year INTEGER,
  current_employer TEXT,
  current_position TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  testimonial TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_alumni_user_id ON alumni(user_id);
CREATE INDEX idx_alumni_graduation_year ON alumni(graduation_year);

-- 7. Alumni Events
CREATE TABLE alumni_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('networking', 'reunion', 'career_fair', 'workshop')),
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_alumni_events_date ON alumni_events(event_date);

-- 8. Donation Campaigns
CREATE TABLE donation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Employment Records
CREATE TABLE employment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employer TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date DATE,
  salary DECIMAL(10,2),
  placement_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_employment_user_id ON employment_records(user_id);

-- 10. Industry Partners
CREATE TABLE industry_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  students_hired INTEGER DEFAULT 0,
  open_positions INTEGER DEFAULT 0,
  partnership_since INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Career Events
CREATE TABLE career_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('career_fair', 'resume_workshop', 'interview_prep', 'networking')),
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_career_events_date ON career_events(event_date);
```

---

## 🔧 STEP 2: WIRE UP 17 ADMIN DASHBOARD FUNCTIONS

**File:** `src/components/AdminDashboard.tsx`

### ✅ Already Working (3):
1. **XP Update** (lines 234-241) - ✅ DONE
2. **Chat Count Reset** (lines 254-261) - ✅ DONE
3. **CSV Import** (lines 265-379) - ✅ DONE (full implementation!)

### ⚠️ Need to Replace `alert()` with Real Functions (17):

#### Quick Actions Section:

**4. Send Announcement** (line 3473)
- Current: `alert('Announcement sent to all recipients!')`
- Wire to: Insert into `notifications` table
```typescript
const { error } = await supabase
  .from('notifications')
  .insert(
    allUsers.map(user => ({
      user_id: user.id,
      message: announcementText,
      read: false
    }))
  );
```

**5. Export Student Data** (line 3567)
- Current: `alert('Student data exported successfully!')`
- Wire to: Query profiles + generate CSV download
```typescript
const { data } = await supabase
  .from('profiles')
  .select('email, username, xp, level, created_at');
// Convert to CSV and trigger download
const csv = convertToCSV(data);
downloadFile(csv, 'student-data.csv');
```

#### Faculty Management Section:

**6. Add New Faculty** (line 3657)
- Current: `alert('Faculty member added successfully!')`
- Wire to: Insert into `faculty` table
```typescript
const { error } = await supabase
  .from('faculty')
  .insert({
    full_name: facultyName,
    email: facultyEmail,
    role: facultyRole,
    courses: selectedCourses
  });
```

**7. Manage Permissions** (line 3752)
- Current: `alert('Permissions updated successfully!')`
- Wire to: Update `faculty` table
```typescript
const { error } = await supabase
  .from('faculty')
  .update({ role: newRole })
  .eq('id', facultyId);
```

**8. Faculty Reports** (line 3858)
- Current: `alert('Exporting faculty report...')`
- Wire to: Query `faculty` table + generate report
```typescript
const { data } = await supabase
  .from('faculty')
  .select('full_name, role, students_count, rating');
// Generate report and download
```

#### Alumni Network Section:

**9. Alumni Newsletter** (line 3930)
- Current: `alert('Newsletter sent to all alumni!')`
- Wire to: Email service (Gmail env vars exist) OR insert into notifications
- **Note:** Can use existing `notifications` table as fallback

**10. Plan Alumni Event** (line 4027)
- Current: `alert('Event created and invitations sent!')`
- Wire to: Insert into `alumni_events` table
```typescript
const { error } = await supabase
  .from('alumni_events')
  .insert({
    name: eventName,
    event_type: eventType,
    event_date: eventDate,
    event_time: eventTime,
    location: eventLocation,
    description: eventDescription
  });
```

**11. Gifting & Donations** (line 4122)
- Current: `alert('New campaign created!')`
- Wire to: Insert/update `donation_campaigns` table
```typescript
const { error } = await supabase
  .from('donation_campaigns')
  .insert({
    name: campaignName,
    goal_amount: goalAmount,
    description: campaignDescription,
    status: 'active'
  });
```

#### Job Placement Section:

**12. View Employment Data** (line 4200)
- Current: `alert('Exporting employment report...')`
- Wire to: Query `employment_records` table + export
```typescript
const { data } = await supabase
  .from('employment_records')
  .select('*, profiles(username, email)');
// Generate report with employment stats
```

**13. Manage Partners** (line 4303)
- Current: `alert('Partner added successfully!')`
- Wire to: Insert into `industry_partners` table
```typescript
const { error } = await supabase
  .from('industry_partners')
  .insert({
    name: partnerName,
    location: partnerLocation,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    open_positions: openPositions
  });
```

**14. Career Services** (line 4394)
- Current: `alert('Event scheduled successfully!')`
- Wire to: Insert into `career_events` table
```typescript
const { error } = await supabase
  .from('career_events')
  .insert({
    name: eventName,
    event_type: eventType,
    event_date: eventDate,
    event_time: eventTime,
    description: eventDescription,
    status: 'upcoming'
  });
```

**15. Alumni Database** (line 4488)
- Current: `alert('Exporting alumni database...')`
- Wire to: Query `alumni` table + export
```typescript
const { data } = await supabase
  .from('alumni')
  .select('full_name, graduation_year, current_employer, current_position');
// Generate CSV export
```

#### Settings/Config Section (Lower Priority):

**16. Export Reports** (line 748)
- Current: `alert('Generating selected reports...')`
- Wire to: Generate reports from existing data
- **Note:** Can skip for now

**17. Branding Settings** (line 985)
- Current: `alert('Branding settings saved successfully!')`
- Wire to: Store in profiles or new settings table
- **Note:** Can skip for now - cosmetic feature

**18. Configuration Settings** (line 2901)
- Current: `alert('Configuration settings saved successfully!')`
- Wire to: Store in settings table
- **Note:** Can skip for now - cosmetic feature

**19. Browse Files Upload** (line 3001)
- Current: `alert('Files uploaded successfully!')`
- Wire to: Supabase Storage upload
- **Note:** Can skip for now - not critical

**20. API Key Generation** (lines 3059, 3087)
- Current: `alert('API Key saved...')`
- Wire to: Generate and store API keys
- **Note:** Can skip for now - not critical

---

## 🤖 STEP 3: ADD CHEF FREDDIE LOGGING

**File:** `src/api/chefFreddie.ts`

**Current:** Line 60 returns response but doesn't log to database

**Add after line 59:**
```typescript
// Log conversation for admin analytics
try {
  await supabase.from('chat_logs').insert({
    user_id: userId,
    prompt: prompt,
    response: data.content?.[0]?.text || 'No response'
  });
} catch (logError) {
  console.error('Failed to log chat:', logError);
  // Don't fail the request if logging fails
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Database Setup:
- [ ] Create `user_activity` table
- [ ] Create `session_reports` table
- [ ] Create `scheduled_sessions` table
- [ ] Create `chat_logs` table
- [ ] Create `faculty` table
- [ ] Create `alumni` table
- [ ] Create `alumni_events` table
- [ ] Create `donation_campaigns` table
- [ ] Create `employment_records` table
- [ ] Create `industry_partners` table
- [ ] Create `career_events` table

### Admin Dashboard Functions:
- [x] XP Update (working)
- [x] Chat Count Reset (working)
- [x] CSV Import (working)
- [ ] Send Announcement
- [ ] Export Student Data
- [ ] Add New Faculty
- [ ] Manage Permissions
- [ ] Faculty Reports
- [ ] Alumni Newsletter
- [ ] Plan Alumni Event
- [ ] Gifting & Donations
- [ ] View Employment Data
- [ ] Manage Partners
- [ ] Career Services
- [ ] Alumni Database
- [ ] Export Reports (optional)
- [ ] Branding Settings (optional)
- [ ] Configuration Settings (optional)
- [ ] Browse Files Upload (optional)
- [ ] API Key Generation (optional)

### Other:
- [ ] Add ChefFreddie chat logging
- [ ] Test GlobalTestKitchen with new tables
- [ ] Verify all Supabase queries work

---

## 🎯 TODAY'S BATTLE PLAN

### Phase 1: Database Setup (30 minutes)
1. **Create all 11 tables** - Copy/paste SQL into Supabase SQL Editor
2. **Verify tables created** - Check Supabase dashboard
3. **Test RLS policies** - Make sure permissions work

### Phase 2: Core Admin Functions (3-4 hours)
**Priority 1 (Must Have):**
4. Send Announcement → notifications table
5. Export Student Data → CSV download
6. Add New Faculty → faculty table
7. Manage Permissions → faculty table
8. View Employment Data → employment_records table
9. Manage Partners → industry_partners table

**Priority 2 (Nice to Have):**
10. Plan Alumni Event → alumni_events table
11. Gifting & Donations → donation_campaigns table
12. Career Services → career_events table
13. Alumni Database → alumni table
14. Faculty Reports → faculty table query
15. Alumni Newsletter → notifications fallback

**Priority 3 (Skip for Now):**
16-20. Settings/Config features (not critical for demo)

### Phase 3: Logging & Testing (1 hour)
- Add ChefFreddie chat logging
- Test GlobalTestKitchen with new tables
- Verify all queries work
- Remove obvious mock data

### Phase 4: Demo Prep (30 minutes)
- Create test data (3-5 students, 2 faculty)
- Test full admin workflow
- Verify all features work

**Total Time:** 5-6 hours
**Goal:** Demo-ready by end of day! 🎯

---

## 📝 NOTES

**✅ FULLY WORKING:**
- **MyKitchen:** Ingredient scanning, recipe matcher, kitchen inventory
- **MyCookBook:** Gradebook, video submissions, assignments
- **CulinarySchool:** 52 techniques, syllabus system, tutorials
- **Chef's Corner:** Global Test Kitchen, market directory, Build Menu
- **Build Menu:** Recipe selection, PDF export, market finder, cost estimation
- **Chef Freddie:** Widget + Admin curriculum assistant
- **XP System:** Leveling, badges, challenges
- **Auth Flow:** Wristband + Supabase
- **Video Storage:** Supabase Storage

**⚠️ NEEDS WIRING:**
- Admin dashboard backend (17 functions)
- 11 database tables
- Chef Freddie logging

**Overall Status:** App is 85% complete. TODAY we finish the admin wiring!

---

## 🐛 KNOWN ISSUES

**Critical (Fix Today):**
- [ ] GlobalTestKitchen tries to insert into tables that don't exist yet (user_activity, session_reports, scheduled_sessions)
- [ ] Admin dashboard has 17 placeholder `alert()` calls
- [ ] ChefFreddie conversations not logged for analytics

**Non-Critical (Can wait):**
- ⚠️ Environment variable typos in .env.example (GOOLGE vs GOOGLE)
- ⚠️ Scheduled sessions not persistent (only in React state)
- ⚠️ Some mock data in GlobalTestKitchen timeline

---

## 💡 HELPER FUNCTIONS YOU'LL NEED

### CSV Export Helper:
```typescript
function convertToCSV(data: any[]) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
  ].join('\n');
  return csv;
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

---

## 🧹 STEP 4: REMOVE MOCK DATA (FINAL CLEANUP)

After everything is wired up and working, remove all mock/placeholder data:

### Files to Check for Mock Data:

**1. AdminDashboard.tsx**
- Mock student data in state (if any)
- Placeholder stats/metrics
- Test user accounts

**2. GlobalTestKitchen.tsx**
- Mock live sessions
- Test scheduled sessions
- Placeholder viewer counts

**3. ChallengeOfTheWeek.tsx**
- Should be fine - uses real weekly rotation

**4. Profile.tsx**
- Mock talent tree data (if any)
- Test user profiles

**5. TestRunModal.tsx**
- Pre-populated test ingredients
- Mock recipe data
- This is intentionally a "test" feature - decide if you want to keep it

**6. Any component with:**
```typescript
// Look for patterns like:
const mockData = [...]
const testUsers = [...]
const sampleRecipes = [...]
```

### What to Keep:
- ✅ Default/empty state values
- ✅ Placeholder text in inputs
- ✅ Example data in documentation
- ✅ TestRunModal (it's a demo feature)

### What to Remove:
- ❌ Hardcoded user lists
- ❌ Fake statistics
- ❌ Pre-populated forms with test data
- ❌ Mock API responses
- ❌ Development-only data

### How to Find Mock Data:
```bash
# Search for common mock data patterns
grep -r "mock" src/
grep -r "test.*=.*\[" src/
grep -r "sample.*=.*\[" src/
grep -r "dummy" src/
grep -r "fake" src/
```

---

**Good luck! The hard work is done - this is just connecting the dots. 🚀**

**Take a break after that 7-hour debugging session! You earned it. 😴**
