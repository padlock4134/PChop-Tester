# Content Distribution System

## Overview
The PorkChop Admin Dashboard allows schools to upload their curriculum materials and automatically distribute them to the appropriate modules using AI-powered content mapping.

---

## Upload Methods

### Method 1: Manual File Upload
- Admin clicks **"Browse Files"** button
- Selects curriculum files (PDF, DOCX, XLSX, PPTX, images)
- Files uploaded to Supabase Storage

### Method 2: API Key Integration
- Admin clicks **"Generate API Key"** button
- Receives unique API key for automated content ingestion
- External systems can push curriculum via API endpoints

---

## AI Auto-Mapping Process

### Step 1: Content Analysis
AI analyzes uploaded files and extracts:
- **Content Type**: Recipe, Assignment, Lesson, Technique, Video, etc.
- **Metadata**: Title, difficulty, objectives, equipment needed
- **Structure**: Week numbers, learning goals, prerequisites

### Step 2: Module Mapping
AI automatically maps content to modules:

#### **MyKitchen Module**
- Recipe databases → Feeds recipe matcher algorithm
- Ingredient knowledge bases → Enhances fuzzy matching
- Kitchen setup configurations → Equipment recommendations
- Dietary restriction mappings → Health tag generation

#### **MyCookBook Module**
- Assignment templates → Creates new gradebook assignments
- Grading rubrics → Video submission evaluation criteria
- Recipe collections → Organized by curriculum structure
- Video requirements → Student demonstration specifications

#### **CulinarySchool Module**
- Lessons and techniques → Educational content
- Syllabus structures → Course organization
- Lesson plans → Structured learning paths
- Learning objectives → Student achievement goals

#### **Chef's Corner Module**
- Chef demonstration videos → Global Test Kitchen content
- Industry insights → Professional tips and knowledge
- Live session schedules → Planned cooking demonstrations
- Market partnerships → Local sourcing connections

### Step 3: Confidence Scoring
AI provides confidence score for each mapping:
- **High (90-100%)**: Clear content type, automatic mapping
- **Medium (70-89%)**: Likely correct, admin review recommended
- **Low (<70%)**: Manual review required

---

## Admin Review & Confirmation

### Review Interface
Admin sees:
```
📄 "Culinary Fundamentals Week 5.pdf"

AI Detected:
✓ Content Type: Lesson + Assignment
✓ Mapped To: CulinarySchool (Lesson) + MyCookBook (Assignment)
✓ Confidence: 95%

Extracted Data:
- Title: Sauce Making & Emulsification
- Topics: Hollandaise, Mayonnaise, Beurre Blanc
- Equipment: Double boiler, whisk, thermometer
- Assignments: Video demonstration, sauce samples
```

### Admin Actions
- **✓ Confirm**: Accept AI mapping and distribute content
- **✏️ Edit**: Modify which modules receive content
- **✗ Reject**: Don't distribute this content

---

## Content Distribution

### On Confirmation
Content is inserted into appropriate Supabase tables:

**MyKitchen:**
- Recipes → `user_cookbook` table (available to all users)
- Ingredients → Recipe matcher database

**MyCookBook:**
- Assignments → `assignments` table (new)
- Rubrics → Assignment metadata

**CulinarySchool:**
- Lessons → `curriculum_content` table (new)
- Techniques → Weekly technique structure

**Chef's Corner:**
- Videos → Supabase Storage + metadata
- Sessions → `schedule_sessions` table

### Real-time Updates
- All connected users see new content immediately
- Admin dashboard shows distribution status
- Modules refresh with new curriculum

---

## Chef Freddie Integration

### Curriculum Assistant
Admin can ask Chef Freddie to:
- **Create assignments**: "Generate a Week 5 sauce making assignment"
- **Build lesson plans**: "Create a knife skills lesson plan"
- **Design rubrics**: "Make a rubric for protein cookery"
- **Apply to modules**: Automatically distribute generated content

### AI-Generated Content
Chef Freddie uses Anthropic Claude to:
1. Generate structured curriculum content
2. Map to appropriate modules
3. Create assignments with rubrics
4. Suggest learning objectives

---

## API Key System

### Generated Keys
- Unique identifier for external integrations
- Scoped permissions (read/write access per module)
- Stored in `api_keys` table with metadata

### API Endpoints
```
POST /api/curriculum/upload
- Upload course materials
- Requires: API key, file, optional module hints

GET /api/students/progress
- Retrieve student progress data
- Requires: API key, student filters

POST /api/assignments/create
- Create new assignments programmatically
- Requires: API key, assignment data
```

---

## Technical Implementation

### Required Components

**Netlify Function:**
- `content-processor.js` - AI analysis and mapping
- Uses Anthropic API key (new or existing)
- Extracts text from PDFs/DOCX
- Returns structured mapping data

**Supabase Tables:**
- `content_staging` - Pending content awaiting confirmation
- `curriculum_content` - Distributed lesson content
- `assignments` - MyCookBook assignments
- `api_keys` - Generated API keys with permissions

**Frontend Updates:**
- File upload handler with progress tracking
- AI mapping review interface
- Module distribution checkboxes
- Confirmation workflow

---

## Content Flow Diagram

```
┌─────────────────┐
│ Admin Uploads   │
│ Curriculum File │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Analyzes &   │
│ Maps to Modules │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Reviews   │
│ & Confirms      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Content         │
│ Distributed to  │
│ Modules         │
└─────────────────┘
```

---

## Example Use Cases

### Use Case 1: Upload Full Syllabus
1. Admin uploads "Culinary Arts Syllabus.pdf"
2. AI extracts 16 weeks of content
3. Maps Week 1-8 to CulinarySchool, Week 9-16 to MyCookBook
4. Admin confirms
5. All students see new curriculum structure

### Use Case 2: Add Single Assignment
1. Admin uploads "Knife Skills Assignment.docx"
2. AI detects assignment with rubric
3. Maps to MyCookBook gradebook
4. Admin confirms
5. Assignment appears in student gradebooks

### Use Case 3: API Integration
1. School's LMS generates API key
2. LMS pushes weekly recipes via API
3. AI maps recipes to MyKitchen
4. Auto-confirms (if confidence >95%)
5. Recipes available to students immediately

---

## Security & Permissions

### Access Control
- Only admin users can upload content
- API keys have scoped permissions
- Content staging requires admin approval
- Students see only published content

### Data Privacy
- Uploaded files stored in private Supabase bucket
- API keys encrypted in database
- Content distribution logged for audit trail
- Admin actions tracked in `user_activity` table

---

## Future Enhancements

### Planned Features
- Bulk upload with ZIP files
- Content versioning and rollback
- Scheduled content publishing
- Multi-language curriculum support
- Content templates library
- Analytics on content usage

---

## Summary

**The content distribution system automates curriculum management by:**
1. Accepting uploads via UI or API
2. Using AI to intelligently map content to modules
3. Allowing admin review and confirmation
4. Distributing content to appropriate Supabase tables
5. Making content immediately available to students

**No templates. No fixed structure. Just AI reading your curriculum and putting it where it belongs.**
