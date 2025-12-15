# PROVISIONAL PATENT APPLICATION
## PorkChop Ed Tech - AI-Driven Content-Agnostic Curriculum Processing System

**Filing Date:** December 2026  
**Applicant:** Patrick Adukonis  
**Company:** PorkChop  
**Location:** 444 St. John St. 2, Portland, Maine, 04102 
**Phone:** 207-450-9663
**Email:** patrick@porkchopd.com

---

## TITLE OF INVENTION

**AI-Driven Content-Agnostic Curriculum Processing and Intelligent Multi-Module Distribution System for Vocational Education**

---

## ABSTRACT

A computer-implemented system and method for automatically processing vocational education curriculum materials and distributing content to specialized learning modules across any vocational discipline. Schools upload discipline-specific curriculum (culinary, cosmetology, HVAC, welding, automotive, etc.) in unstructured formats (PDF, DOCX). A large language model analyzes content using domain-adapted prompts to extract structured metadata (techniques, equipment, assessments, difficulty) and intelligently routes content to universal learning modules (practice libraries, gradebook systems, video assessments, AR practice generators). The platform architecture remains identical across all disciplines—only AI analysis prompts and UI terminology adapt to the specific domain. This enables a single codebase to serve unlimited vocational trades without requiring separate platform development.

**Key Innovation:** Content-agnostic architecture where the uploaded curriculum defines the domain, not the code.

---

## BACKGROUND

### Field of Invention

Learning management systems for vocational and technical education that use artificial intelligence to process and distribute curriculum content while adapting to different disciplines through prompt engineering.

### Problem Statement

**The Vocational Education Technology Gap:**
- Nursing students receive $10,000+ simulation software (vSim)
- Engineering students receive CAD software and circuit simulators
- Vocational trade students receive generic LMS platforms with PDFs and crossword puzzles

**Manual Curriculum Processing Burden:**
- Instructors spend 40+ hours per course manually uploading and organizing content
- Each assignment, technique, and rubric must be manually created
- Content must be manually categorized into appropriate modules
- No automated extraction of techniques, equipment, or assessment criteria

**Platform Specificity Problem:**
- Existing vocational software is trade-specific (separate platforms for each discipline)
- Schools with multiple vocational programs need multiple systems
- Each new discipline requires 12+ months custom development at $100K+ cost
- No unified solution exists for multi-trade institutions

**No Intelligent Content Distribution:**
- Generic LMS platforms cannot distinguish techniques from recipes from assessments
- No automatic generation of practice exercises from curriculum
- No automatic creation of AR training content from text-based instructions
- Manual organization required for all content

### Prior Art Analysis

**Existing Patents:**

**US11720617B2 - "Automated Generation of Educational Materials" (Granted 2023):**
- Extracts information from pre-existing educational sources
- Divides extracted information into blocks using machine reading
- Generates keywords and confidence scores
- Assembles content into educational materials
- Imports into Learning Management Systems

**Limitation:** Does NOT provide:
- Multi-module intelligent routing based on pedagogical purpose
- Multi-domain adaptation via prompt engineering
- Content-agnostic architecture where curriculum defines domain
- Vocational-specific processing
- Automated AR practice generation from curriculum text

**US20200302296A1 - "Optimizing Educational Outcomes Using AI" (2020):**
- AI categorization of educational content
- Performance assessment data analysis
- Focused on medical education only

**Limitation:** Single domain (medical), no multi-trade adaptability, no curriculum processing

**US20170213473A1 - "AR Simulator for Professional Training" (2017):**
- AR/VR training simulator
- Manually created scenarios by developers

**Limitation:** No automated generation from curriculum, requires technical team to create content

**Generic LMS Platforms (Canvas, Blackboard, Moodle):**
- Manual content upload and organization
- No AI extraction from curriculum documents
- No automated content routing
- No AR practice generation
- Generic across all subjects (not optimized for vocational education)

**Nursing Simulation Software (vSim, Shadow Health):**
- Single domain only (nursing)
- Manually created scenarios ($10,000+ per student reflects content creation cost)
- Not adaptable to other vocational trades
- No curriculum ingestion capability
- Proprietary content only (instructors cannot add their own curriculum)

**What's Missing (Novel Aspects of This Invention):**
No existing system combines:
1. **Content-agnostic architecture** where uploaded curriculum defines the domain
2. **Prompt-driven multi-domain adaptation** (single platform serves unlimited vocational trades)
3. **Intelligent pedagogical routing** (AI understands techniques vs. assessments vs. demonstrations)
4. **Automated AR generation from text curriculum** (not manual developer creation)
5. **School-provided content** defining platform behavior (not proprietary content)

---

## SUMMARY OF THE INVENTION

### Core Innovation

A content-agnostic vocational education platform with **end-to-end GenAI automation** where:

1. **Schools upload THEIR curriculum** (any vocational discipline) - even incomplete
2. **GenAI PROCESSES** uploaded content using domain-adapted prompts
3. **GenAI CREATES missing content** - recipes, assignments, rubrics, lesson plans
4. **GenAI DEPLOYS** across all modules simultaneously
5. **GenAI CONVERTS deployed content** to multiple outputs:
   - AR practice scenes
   - Video assignment rubrics
   - Practice exercises
   - Weekly challenges
   - Interactive assessments
6. **Same platform architecture** serves all vocational trades via prompt engineering

### The GenAI Pipeline (Critical Innovation)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: UPLOAD (even incomplete curriculum)                │
│  School uploads: syllabus PDF, technique list, partial docs │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: GENAI PROCESSES                                    │
│  • Extracts text from PDF/DOCX/images                       │
│  • Domain-adapted prompts analyze content                   │
│  • Identifies: techniques, equipment, assessments, gaps     │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: GENAI CREATES MISSING CONTENT                      │
│  • Missing recipes? GenAI creates them                      │
│  • Missing rubrics? GenAI creates them                      │
│  • Missing assignments? GenAI creates them                  │
│  • Missing lesson plans? GenAI creates them                 │
│  • All adapted to the specific vocational domain            │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: GENAI AUTO-DEPLOYS TO ALL MODULES                  │
│  Content distributed simultaneously to:                     │
│  • Practice Library • Gradebook • Live Sessions             │
│  • Recipe/Procedure DB • Assessment System • Market Dir     │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: GENAI CONVERTS DEPLOYED CONTENT TO OUTPUTS         │
│  • AR practice scenes (motion-tracked interactive practice) │
│  • Video assignment rubrics (auto-grading criteria)         │
│  • Weekly challenges (gamified learning)                    │
│  • Practice exercises (skill-building activities)           │
│  • Assessment quizzes (knowledge verification)              │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

**A. Curriculum Ingestion Engine**
- Accepts PDF, DOCX, TXT, Excel, image files
- Extracts text using format-specific parsers (pdf-parse, mammoth)
- Handles images via OCR (Google Vision API)
- Stores raw content in staging database
- Accepts INCOMPLETE curriculum (GenAI fills gaps)

**B. AI-Driven Content Processor**
- Uses large language model (Anthropic Claude, GPT-4, or equivalent)
- Domain-adapted prompts analyze curriculum content
- Extracts structured metadata:
  - Techniques/procedures
  - Equipment requirements
  - Materials/ingredients/supplies
  - Safety protocols
  - Assessment criteria
  - Difficulty levels
  - Time requirements
  - Learning objectives
- **Identifies content gaps** (missing recipes, rubrics, etc.)

**C. AI Content Generator (Critical Differentiator)**
- **Creates missing curriculum content automatically:**
  - Recipes/procedures from technique descriptions
  - Assessment rubrics from learning objectives
  - Lesson plans from syllabus outlines
  - Practice exercises from skill requirements
  - Weekly challenges from curriculum topics
- All generated content is domain-appropriate via prompt engineering
- Instructor review before deployment

**D. Intelligent Content Router**
- AI analyzes content type and pedagogical purpose
- Generates suggested mappings to specialized modules:
  - Practice technique libraries
  - Content reference databases (recipes/procedures/protocols)
  - Video assignment systems with auto-generated rubrics
  - Augmented reality practice scenes
  - Live instruction scheduling
  - Assessment rubric generators
  - Career services integration
- Presents suggestions to instructor for review/approval
- **One-click distribution to ALL selected modules simultaneously**

**E. AI Output Converters (Post-Deployment)**
- **AR Scene Generator:** Converts deployed techniques to motion-tracked AR practice
- **Video Rubric Generator:** Creates grading criteria for video submissions
- **Challenge Generator:** Creates gamified weekly challenges from curriculum
- **Quiz Generator:** Creates knowledge assessments from lesson content
- **Recipe Generator:** Creates practice recipes from available ingredients

**F. Universal Learning Modules**
- **Practice Library:** Searchable technique database
- **Gradebook System:** Video submissions with auto-generated rubrics
- **Live Sessions:** Real-time demonstrations and practice
- **AR Practice Generator:** Converts text curriculum to interactive AR scenes
- **Market Directory:** Supplier sourcing (adapts to discipline)
- **Data Tracking:** Industry-specific metrics (nutrition, chemical compatibility, HOS compliance, etc.)

**E. Domain Adaptation Layer**
- Prompt engineering adapts AI analysis to specific discipline
- UI terminology translation (ingredients → supplies → parts → materials)
- Module naming adaptation (MyKitchen → MyStation → MyWorkbench)
- API integration swapping (USDA nutrition → chemical compatibility → fluid specs)
- Assessment criteria customization per discipline

### Novel Aspects

**1. Content-Agnostic Architecture**
- Platform does not hard-code any discipline
- Uploaded curriculum defines the domain
- AI infers domain context from content
- Same codebase serves unlimited disciplines

**2. Prompt-Driven Multi-Domain Adaptation**
- Single line change in AI prompt adapts entire system
- Example: "culinary education platform" → "cosmetology education platform"
- No code changes required for new disciplines
- 4-6 weeks to adapt vs. 12+ months to build from scratch

**3. Automated AR Practice Generation**
- AI translates text-based curriculum into AR practice scenes
- Infers motion parameters from written instructions
- Maps to MediaPipe pose tracking landmarks
- Generates step-by-step interactive practice
- Zero manual 3D asset creation required

**4. Intelligent Pedagogical Routing**
- AI understands difference between techniques, recipes, assessments, demonstrations
- Routes content to appropriate modules based on pedagogical purpose
- Not just keyword matching - semantic understanding of educational content

---

## DETAILED DESCRIPTION

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SCHOOL UPLOADS CURRICULUM                   │
│         (PDF/DOCX: Culinary, Cosmetology, HVAC, etc.)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DOCUMENT PARSING & TEXT EXTRACTION              │
│  • PDF → pdf-parse library                                  │
│  • DOCX → mammoth library                                   │
│  • Images → OCR (Google Vision API)                         │
│  • Store in content_staging table                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           AI CONTENT PROCESSOR (Domain-Adapted)              │
│                                                              │
│  Prompt: "You are a curriculum mapping assistant for a      │
│           [DISCIPLINE] education platform..."                │
│                                                              │
│  Extracts:                                                   │
│  • Techniques/procedures                                     │
│  • Equipment requirements                                    │
│  • Materials (ingredients/supplies/parts)                    │
│  • Safety protocols                                          │
│  • Assessment criteria                                       │
│  • Difficulty levels                                         │
│  • Learning objectives                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              INTELLIGENT CONTENT ROUTER                      │
│                                                              │
│  AI analyzes content and suggests module mappings:           │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ Practice       │  │ Gradebook      │                    │
│  │ Library        │  │ Assignments    │                    │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │ AR Practice    │  │ Live Sessions  │                    │
│  │ Scenes         │  │ Schedule       │                    │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  Instructor reviews → Approves → One-click publish          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           AUTOMATED MODULE POPULATION                        │
│                                                              │
│  Content distributed to:                                     │
│  • user_cookbook (recipes/procedures)                       │
│  • assignments (video submissions + rubrics)                │
│  • curriculum_content (technique library)                   │
│  • ar_scenes (practice generators)                          │
│  • scheduled_sessions (live demonstrations)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STUDENT LEARNING EXPERIENCE                     │
│                                                              │
│  Students access:                                            │
│  • Searchable technique library                             │
│  • Video assignment submissions                             │
│  • AR practice with motion tracking                         │
│  • Live instructor demonstrations                           │
│  • Progress tracking and XP system                          │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Curriculum Processing Method

**Step 1: File Upload**
```javascript
// Instructor uploads curriculum via AdminDashboard
// Supported formats: PDF, DOCX, XLSX, TXT, images
const { fileUrl, fileName, fileType } = uploadedFile;
```

**Step 2: Text Extraction**
```javascript
let extractedText = '';

if (fileType === 'application/pdf') {
  const pdfData = await pdfParse(fileBuffer);
  extractedText = pdfData.text;
} else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  extractedText = result.value;
} else if (fileType.startsWith('text/')) {
  extractedText = fileBuffer.toString('utf-8');
}
```

**Step 3: AI Analysis with Domain-Adapted Prompt**

**KEY INNOVATION:** The prompt adapts to the discipline, not the code.

```javascript
// For Culinary:
const aiPrompt = `You are a curriculum mapping assistant for a culinary education platform.

Analyze the following curriculum content and determine:
1. Content type (recipe, assignment, lesson, technique, video, etc.)
2. Which module(s) it belongs to:
   - MyKitchen: Recipe databases, ingredient knowledge, kitchen setups
   - MyCookBook: Assignment templates, grading rubrics, recipe collections
   - CulinarySchool: Lessons, techniques, syllabus structures
   - Chef's Corner: Demo videos, industry insights, live sessions
3. Extracted metadata (title, week number, topics, equipment, etc.)
4. Confidence score (0-100)

Here is the curriculum content to analyze:
${extractedText}`;

// For Cosmetology (SAME CODE, DIFFERENT PROMPT):
const aiPrompt = `You are a curriculum mapping assistant for a cosmetology education platform.

Analyze the following curriculum content and determine:
1. Content type (procedure, assignment, lesson, technique, video, etc.)
2. Which module(s) it belongs to:
   - MyStation: Service procedures, product knowledge, client consultations
   - MyProcedureBook: Assignment templates, grading rubrics, service collections
   - BeautySchool: Lessons, techniques, syllabus structures
   - Stylist's Corner: Demo videos, industry insights, live sessions
3. Extracted metadata (title, week number, topics, products, etc.)
4. Confidence score (0-100)

Here is the curriculum content to analyze:
${extractedText}`;

// For HVAC (SAME CODE, DIFFERENT PROMPT):
const aiPrompt = `You are a curriculum mapping assistant for an HVAC education platform.

Analyze the following curriculum content and determine:
1. Content type (diagnostic procedure, assignment, lesson, technique, video, etc.)
2. Which module(s) it belongs to:
   - MyWorkbench: Diagnostic procedures, parts knowledge, system specs
   - MyServiceManual: Assignment templates, grading rubrics, repair procedures
   - TechnicalSchool: Lessons, techniques, syllabus structures
   - Technician's Corner: Demo videos, industry insights, live sessions
3. Extracted metadata (title, week number, topics, equipment, etc.)
4. Confidence score (0-100)

Here is the curriculum content to analyze:
${extractedText}`;
```

**Step 4: AI Response Processing**
```javascript
const anthropicResponse = await fetch('/.netlify/functions/anthropic-proxy', {
  method: 'POST',
  body: JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    messages: [{ role: 'user', content: aiPrompt }],
    temperature: 0.3
  })
});

const aiSuggestion = {
  contentType: "lesson" | "assignment" | "recipe" | "technique",
  modules: {
    Module1: { include: true/false, reason: "why" },
    Module2: { include: true/false, reason: "why" },
    Module3: { include: true/false, reason: "why" },
    Module4: { include: true/false, reason: "why" }
  },
  metadata: {
    title: "extracted title",
    weekNumber: number,
    topics: ["topic1", "topic2"],
    equipment: ["equipment1", "equipment2"],
    difficulty: "beginner" | "intermediate" | "advanced"
  },
  confidence: 85
};
```

**Step 5: Instructor Review & Approval**
```javascript
// AdminDashboard presents AI suggestions
// Instructor can:
// - Approve all suggestions
// - Modify individual mappings
// - Add/remove modules
// - Edit metadata
// - One-click publish to all selected modules
```

**Step 6: Automated Module Population**
```javascript
// Based on approved mappings, content is distributed:

// To Practice Library (Module 1)
if (moduleSelection.Module1.techniques) {
  await supabase.from('curriculum_content').insert({
    title: metadata.title,
    content_type: 'technique',
    topics: metadata.topics,
    equipment: metadata.equipment,
    difficulty: metadata.difficulty
  });
}

// To Gradebook (Module 2)
if (moduleSelection.Module2.assignments) {
  await supabase.from('assignments').insert({
    title: metadata.title,
    description: `Week ${metadata.weekNumber}: ${metadata.topics.join(', ')}`,
    rubric: {
      criteria: metadata.topics,
      equipment: metadata.equipment,
      difficulty: metadata.difficulty
    }
  });
}

// To AR Practice Generator (Module 3)
if (moduleSelection.Module3.arScenes) {
  const arScene = await generateARScene(metadata);
  await supabase.from('ar_scenes').insert(arScene);
}
```

#### 2. AR Practice Scene Generation

**Innovation:** AI translates text curriculum into interactive AR practice.

```javascript
async function generateARScene(technique) {
  // AI generates AR scene from technique description
  const prompt = `Generate an AR practice scene for: ${technique.description}
  
  Create step-by-step instructions with:
  - Motion parameters (which body parts move, angles, positions)
  - MediaPipe landmarks to track
  - Success criteria for each step
  - Audio/haptic/visual feedback triggers
  
  Return as JSON with steps array.`;
  
  const arScene = await claudeAPI(prompt);
  
  // Maps to MediaPipe Pose landmarks (0-32)
  // Example: Right wrist = landmark 16
  // Example: Right elbow = landmark 13
  
  return {
    scene_id: technique.id,
    title: technique.name,
    steps: arScene.steps.map((step, i) => ({
      step_number: i + 1,
      instruction: step.instruction,
      tracked_landmarks: step.landmarks, // [16, 13, 11] for arm motion
      success_threshold: 0.85,
      feedback: {
        audio: `step_${i}_audio.mp3`,
        haptic: step.haptic_pattern,
        visual: step.visual_cue
      }
    }))
  };
}
```

#### 3. Domain Adaptation Examples

**How the SAME platform serves different disciplines:**

| Feature | Culinary | Cosmetology | HVAC | Welding |
|---------|----------|-------------|------|---------|
| **Module 1 Name** | MyKitchen | MyStation | MyWorkbench | MyShop |
| **Module 2 Name** | MyCookBook | MyProcedureBook | MyServiceManual | MyProjectBook |
| **Inventory Items** | Ingredients | Products | Parts | Materials |
| **Practice Content** | Recipes | Services | Repairs | Fabrications |
| **Equipment** | Knives, pans | Scissors, dryers | Gauges, tools | Welders, torches |
| **Data Tracking** | Nutrition (USDA) | Chemical compatibility | Fluid specs | Material specs |
| **Market Directory** | Food suppliers | Beauty supply | Parts stores | Metal yards |
| **52 Techniques** | Knife skills, sauces | Cutting, coloring | Diagnostics, repairs | MIG, TIG, Stick |
| **Challenges** | Recipe challenges | Style challenges | Repair challenges | Weld challenges |

**Implementation:** Change ONE variable in the prompt, swap UI labels, configure API integrations. Platform code remains identical.

---

## CLAIMS

### Prior Art Acknowledgment

This invention acknowledges US11720617B2 ("Automated Generation of Educational Materials") which discloses extracting educational content from documents and assembling into learning management systems. The present invention differs fundamentally by:

1. Providing a **content-agnostic architecture** where uploaded curriculum defines the vocational domain without platform code changes
2. Enabling **multi-domain adaptation via prompt engineering** to serve unlimited vocational trades with a single codebase
3. **GenAI content creation** - automatically generating missing curriculum content (recipes, rubrics, assignments, lesson plans) from incomplete uploads
4. Implementing **intelligent pedagogical routing** that understands content purpose (techniques vs. assessments vs. demonstrations) and routes to specialized modules
5. **Post-deployment GenAI conversion** - converting deployed content to multiple outputs (AR scenes, video rubrics, challenges, quizzes)
6. Maintaining **identical platform architecture** across all vocational disciplines through prompt adaptation rather than separate platform development

### Independent Claims

**CLAIM 1: Content-Agnostic Multi-Domain Vocational Education Platform System**

A content-agnostic platform system for providing vocational education across multiple distinct vocational disciplines using a single platform architecture, comprising:

a) A curriculum ingestion module configured to receive unstructured educational documents from educational institutions in formats including PDF, DOCX, XLSX, and image files;

b) An artificial intelligence processing engine configured to:
   - Extract text from said documents using format-specific parsers,
   - Analyze said text using domain-adapted prompts that specify the vocational discipline,
   - Wherein said domain-adapted prompts are modified to specify different vocational disciplines (culinary, cosmetology, HVAC, welding, automotive, nursing, etc.) while maintaining identical prompt structure,
   - Extract structured pedagogical metadata including techniques, equipment, materials, safety protocols, assessment criteria, and difficulty levels;

c) An intelligent pedagogical routing module configured to:
   - Analyze said metadata to determine content purpose (technique instruction, assessment rubric, demonstration procedure, practice exercise),
   - Generate suggested mappings to a plurality of specialized learning modules based on pedagogical purpose,
   - Wherein said routing is based on semantic understanding of educational content, not keyword matching;

d) A plurality of specialized learning modules including:
   - Practice technique library with searchable database,
   - Gradebook system with video submission capability and auto-generated rubrics,
   - Live demonstration scheduling system,
   - Augmented reality practice scene generator,
   - Market directory for supplier sourcing,
   - Data tracking module with industry-specific metrics;

e) An instructor review interface configured to:
   - Present AI-generated mapping suggestions,
   - Receive instructor approval or modification,
   - Enable one-click distribution to all approved modules;

f) An auto-population engine configured to format and deploy content to each of said specialized learning modules simultaneously based on approved mappings;

g) A domain adaptation layer configured to:
   - Modify AI analysis prompts based on vocational discipline by changing a single prompt variable,
   - Translate user interface terminology to discipline-appropriate labels (ingredients→supplies→parts→materials),
   - Configure API integrations for discipline-specific data sources (USDA nutrition→chemical compatibility→fluid specifications),
   - Maintain identical platform code across all disciplines;

h) Wherein said platform serves multiple distinct vocational disciplines using a single codebase, with domain adaptation achieved through prompt engineering and configuration rather than separate platform development;

i) Wherein uploaded curriculum content defines the vocational domain without requiring platform code changes.

**CLAIM 2: Content-Agnostic Multi-Domain Platform System**

A system for providing vocational education across multiple distinct vocational disciplines using a single platform architecture, comprising:

a) A curriculum ingestion module configured to receive and parse educational documents from educational institutions;

b) An artificial intelligence processing engine configured to extract pedagogical metadata from said documents using domain-adapted prompts that specify the vocational discipline;

c) An intelligent routing module configured to analyze said metadata and determine optimal distribution across a plurality of specialized learning modules;

d) An auto-population engine configured to format and deploy content to each of said specialized learning modules simultaneously;

e) A domain adaptation layer configured to:
   - Modify AI analysis prompts based on vocational discipline,
   - Translate user interface terminology to discipline-appropriate labels,
   - Configure API integrations for discipline-specific data sources,
   - Maintain identical platform code across all disciplines;

f) Wherein said system serves multiple distinct vocational disciplines (culinary, cosmetology, HVAC, welding, automotive, nursing, etc.) using a single codebase, with domain adaptation achieved through prompt engineering and configuration rather than separate platform development.

**CLAIM 3: GenAI Content Creation from Incomplete Curriculum**

A method for automatically generating missing vocational education content from incomplete curriculum uploads, comprising:

a) Receiving incomplete curriculum documents from an educational institution, wherein said documents contain partial information (e.g., technique names without procedures, learning objectives without assignments, syllabus outlines without lesson plans);

b) Analyzing said incomplete documents using a large language model to identify content gaps, including:
   - Missing recipes/procedures for named techniques,
   - Missing assessment rubrics for learning objectives,
   - Missing assignments for curriculum topics,
   - Missing lesson plans for syllabus items,
   - Missing practice exercises for skill requirements;

c) Generating missing content using domain-adapted GenAI prompts, wherein:
   - Generated content matches the vocational discipline specified,
   - Generated content aligns with existing curriculum structure,
   - Generated content includes appropriate terminology, equipment, and safety protocols for the discipline;

d) Presenting generated content to instructor for review and approval;

e) Deploying approved generated content to specialized learning modules alongside uploaded content;

f) Wherein said method enables schools to upload incomplete curriculum and receive a fully-populated learning platform.

**CLAIM 4: Post-Deployment GenAI Content Conversion**

A method for automatically converting deployed educational content into multiple learning output formats, comprising:

a) Receiving deployed content from a plurality of learning modules (techniques, procedures, recipes, assignments);

b) Converting said deployed content using GenAI into multiple output formats including:
   - **AR Practice Scenes:** Interactive motion-tracked practice sessions with step-by-step overlays,
   - **Video Assignment Rubrics:** Auto-generated grading criteria for video submissions,
   - **Weekly Challenges:** Gamified learning exercises derived from curriculum topics,
   - **Practice Quizzes:** Knowledge verification assessments from lesson content,
   - **Recipe/Procedure Generation:** Creating practice content from available materials/ingredients;

c) Wherein each conversion uses domain-adapted prompts specific to the vocational discipline;

d) Wherein said conversions occur automatically after content deployment without manual developer intervention;

e) Wherein said method enables a single curriculum upload to generate multiple learning experiences across all platform modules.

**CLAIM 5: Automated AR Practice Scene Generation from Curriculum**

A method for automatically generating augmented reality practice scenes from text-based vocational curriculum, comprising:

a) Receiving text-based curriculum describing a vocational technique or procedure;

b) Transmitting said text to a large language model with instructions to:
   - Infer motion parameters from written instructions,
   - Identify body parts and movements required,
   - Map movements to pose tracking landmarks,
   - Define success criteria for each step,
   - Generate feedback triggers (audio, haptic, visual);

c) Receiving from said AI system a structured AR scene specification comprising:
   - Step-by-step instructions,
   - Tracked body landmarks for each step,
   - Success thresholds,
   - Feedback mechanisms;

d) Rendering said AR scene using pose tracking technology (MediaPipe, ARKit, ARCore);

e) Providing real-time feedback to students based on tracked body positions compared to success criteria;

f) Wherein AR practice content is generated automatically from curriculum text without manual 3D asset creation or developer intervention.

### Dependent Claims

**CLAIM 4:** The method of Claim 1, wherein said vocational discipline is culinary arts and said techniques include knife skills, cooking methods, and food preparation procedures.

**CLAIM 5:** The method of Claim 1, wherein said vocational discipline is cosmetology and said techniques include hair cutting, coloring, and styling procedures.

**CLAIM 6:** The method of Claim 1, wherein said vocational discipline is HVAC and said techniques include system diagnostics, repair procedures, and safety protocols.

**CLAIM 7:** The method of Claim 1, wherein said vocational discipline is welding and said techniques include MIG, TIG, Stick welding, and fabrication processes.

**CLAIM 8:** The system of Claim 2, wherein said domain adaptation layer modifies AI prompts by changing a single prompt variable specifying the vocational discipline name while maintaining identical prompt structure.

**CLAIM 9:** The system of Claim 2, wherein said user interface terminology translation comprises mapping:
- "ingredients" to "supplies" for cosmetology,
- "ingredients" to "parts" for automotive,
- "ingredients" to "materials" for welding,
- "recipes" to "procedures" for HVAC,
- "recipes" to "services" for cosmetology.

**CLAIM 10:** The method of Claim 3, wherein said pose tracking technology utilizes MediaPipe Pose estimation with 33 body landmarks.

**CLAIM 11:** The method of Claim 1, wherein said large language model is selected from: Anthropic Claude, OpenAI GPT-4, Google Gemini, or equivalent transformer-based language model.

**CLAIM 12:** The system of Claim 2, wherein said specialized learning modules include:
- Practice technique library with searchable database,
- Gradebook system with video submission capability,
- Live demonstration scheduling system,
- Augmented reality practice generator,
- Market directory for supplier sourcing,
- Data tracking module with industry-specific metrics.

**CLAIM 13:** The method of Claim 1, wherein content updates to source curriculum automatically propagate to all populated specialized learning modules with version control.

**CLAIM 14:** The system of Claim 2, wherein said platform serves educational institutions across multiple vocational disciplines simultaneously, with each institution's uploaded curriculum defining the domain for that institution's instance.

**CLAIM 15:** The method of Claim 3, wherein said AR scenes include haptic feedback patterns, audio instruction files, and visual highlighting of correct body positions.

---

## EXAMPLES

### Example 1: Culinary Education (Knife Skills)

**Input:** Instructor uploads PDF syllabus "Week 3: French Knife Skills"

**AI Extraction:**
```json
{
  "techniques": ["Julienne", "Brunoise", "Chiffonade"],
  "equipment": ["8-inch chef's knife", "cutting board", "vegetables"],
  "safety": ["Proper grip", "Claw hand", "Stable surface"],
  "assessment": {
    "technique": 40,
    "uniformity": 30,
    "speed": 20,
    "safety": 10
  },
  "difficulty": "intermediate"
}
```

**Routing Suggestions:**
- ✅ MyKitchen: Add techniques to practice library
- ✅ MyCookBook: Create "Demonstrate Julienne" video assignment with rubric
- ✅ AR Scenes: Generate "Julienne Practice" with motion tracking
- ✅ Assessment: Auto-create grading criteria

**AR Scene Generated:**
```json
{
  "scene_id": "julienne_practice",
  "steps": [
    {
      "step": 1,
      "instruction": "Grip knife with pinch grip",
      "tracked_landmarks": [15, 16, 17, 18, 19, 20],
      "success_criteria": "thumb_and_forefinger_on_blade",
      "feedback": "audio: 'Good grip!' when correct"
    },
    {
      "step": 2,
      "instruction": "Position guide hand in claw shape",
      "tracked_landmarks": [21, 22, 23, 24],
      "success_criteria": "fingertips_curled_inward",
      "feedback": "haptic: pulse if fingers exposed"
    }
  ]
}
```

### Example 2: Cosmetology (Hair Cutting)

**Input:** Instructor uploads Word document "Layered Bob Technique.docx"

**Same Platform, Different Prompt:**
```
"You are a curriculum mapping assistant for a cosmetology education platform..."
```

**AI Extraction:**
```json
{
  "techniques": ["Sectioning", "Elevation angles", "Point cutting"],
  "equipment": ["Cutting shears", "Comb", "Clips", "Spray bottle"],
  "safety": ["Sanitize tools", "Client draping", "Sharp scissors only"],
  "assessment": {
    "precision": 35,
    "client_safety": 30,
    "technique": 25,
    "cleanup": 10
  },
  "difficulty": "advanced"
}
```

**Routing Suggestions:**
- ✅ MyStation: Add techniques to practice library
- ✅ MyProcedureBook: Create "Layered Bob on Mannequin" video assignment
- ✅ AR Scenes: Generate "Elevation Angle Practice"
- ✅ Assessment: Auto-create grading criteria

**UI Terminology Automatically Adapted:**
- "MyCookBook" → "MyProcedureBook"
- "Recipe" → "Service Procedure"
- "Ingredient" → "Product"
- "Cooking Technique" → "Beauty Technique"

### Example 3: HVAC (System Diagnostics)

**Input:** Instructor uploads Excel "Refrigerant Cycle Troubleshooting.xlsx"

**Same Platform, Different Prompt:**
```
"You are a curriculum mapping assistant for an HVAC education platform..."
```

**AI Extraction:**
```json
{
  "techniques": ["Pressure testing", "Temperature differential", "Leak detection"],
  "equipment": ["Manifold gauge set", "Digital thermometer", "Leak detector", "PPE"],
  "safety": ["EPA 608 certification required", "Ventilated area", "Proper PPE"],
  "assessment": {
    "diagnostic_accuracy": 40,
    "safety_compliance": 30,
    "procedure_sequence": 20,
    "documentation": 10
  },
  "certifications_required": ["EPA 608 Type II"],
  "difficulty": "advanced"
}
```

**Routing Suggestions:**
- ✅ MyWorkbench: Add diagnostic procedures
- ✅ MyServiceManual: Create "Diagnose Low Cooling" video assignment
- ✅ AR Scenes: Generate "Gauge Connection Practice"
- ✅ Certifications: Link EPA 608 requirement

**UI Terminology Automatically Adapted:**
- "MyCookBook" → "MyServiceManual"
- "Recipe" → "Service Procedure"
- "Ingredient" → "Part/Component"
- Assessment focus: Safety and accuracy prioritized

---

## ADVANTAGES OVER PRIOR ART

### Advantage 1: Single Platform, Unlimited Disciplines

**Prior Art:** Separate platforms required for each vocational trade
- Culinary platform: 12 months development, $100K
- Cosmetology platform: 12 months development, $100K
- HVAC platform: 12 months development, $100K
- Total: 36 months, $300K for 3 disciplines

**This Invention:** One platform serves all disciplines
- Initial platform: 10 months development
- New discipline: 4-6 weeks adaptation (prompt + UI labels + API config)
- Total: 10 months + 2 weeks per additional discipline
- Cost: 90% reduction

### Advantage 2: School-Provided Content

**Prior Art:** Proprietary content only
- vSim: Manually created scenarios, cannot add custom content
- Welding simulators: Pre-built exercises only
- Schools forced to adapt curriculum to software

**This Invention:** Schools upload their own curriculum
- Platform adapts to school's content
- Schools maintain curriculum ownership
- No vendor lock-in
- White-label capability

### Advantage 3: Automated Content Processing

**Prior Art:** Manual upload and organization
- Canvas/Blackboard: 40+ hours per course
- Each assignment manually created
- Each rubric manually built
- No extraction of techniques or equipment

**This Invention:** AI automates processing
- Upload curriculum once
- AI extracts all metadata
- Auto-generates assignments and rubrics
- Auto-populates all modules
- 2 hours vs. 40 hours

### Advantage 4: Intelligent Content Distribution

**Prior Art:** Manual categorization
- Instructor decides where content goes
- Time-consuming and inconsistent
- No understanding of content type

**This Invention:** AI understands pedagogical purpose
- Distinguishes techniques from assessments from demonstrations
- Routes to appropriate modules automatically
- Semantic understanding of educational content
- Instructor reviews and approves

### Advantage 5: Automated AR Practice Generation

**Prior Art:** Manual AR content creation
- Requires 3D artists and developers
- Weeks per exercise
- Expensive ($10K+ per scenario)

**This Invention:** AI generates AR from text
- No manual asset creation
- Minutes per exercise
- Free (included in platform)

### Competitive Differentiation Matrix

| Feature | PorkChop | Teachfloor | US11720617B2 | Generic LMS |
|---------|----------|------------|--------------|-------------|
| Upload incomplete curriculum | ✅ | ❌ | ❌ | ❌ |
| AI creates MISSING content | ✅ | ❌ | ❌ | ❌ |
| Multi-domain via prompts | ✅ | ❌ | ❌ | ❌ |
| Single codebase, unlimited trades | ✅ | ❌ | ❌ | ❌ |
| Intelligent pedagogical routing | ✅ | ❌ | ❌ | ❌ |
| Post-deployment conversion to multiple outputs | ✅ | ❌ | ❌ | ❌ |
| AR practice from curriculum text | ✅ | ❌ | ❌ | ❌ |
| Vocational-specific modules | ✅ | ❌ | ❌ | ❌ |
| School-uploaded content defines domain | ✅ | ❌ | ❌ | ❌ |

**No existing system combines all nine differentiating features.** This combination represents a novel and non-obvious invention in vocational education technology.

---

## INDUSTRIAL APPLICABILITY

### Target Market

**Primary Market: Vocational Schools and Community Colleges**
- 1,200+ community colleges in US
- 50+ culinary programs per state
- 100+ cosmetology programs per state
- 75+ HVAC programs per state
- 50+ welding programs per state
- Total addressable market: 10,000+ vocational programs

**Secondary Market: Corporate Training**
- Restaurant chains (standardized training)
- Salon franchises (consistent techniques)
- HVAC service companies (technician certification)
- Manufacturing (welding/fabrication training)

**Tertiary Market: White-Label Licensing**
- EdTech companies serving specific trades
- Professional associations (NRA, ACF, etc.)
- Certification bodies (ServSafe, EPA, etc.)
- Textbook publishers expanding to digital

### Commercial Benefits

**For Educational Institutions:**
- Replace generic LMS for vocational programs
- Reduce instructor curriculum upload time by 95%
- Provide students with practice tools comparable to nursing/engineering
- Cost-neutral switch ($49/student/year vs. $30-100 for Canvas/Blackboard)
- Improve student outcomes through increased practice opportunities

**For Students:**
- Practice vocational skills at home (like nursing students with vSim)
- Build professional portfolios (like art students with Behance)
- Access AR practice without expensive equipment
- Receive real-time feedback on technique
- Graduate with demonstrable skills

**For Platform Provider:**
- Single codebase serves unlimited disciplines
- Rapid market expansion (4-6 weeks per new discipline)
- Recurring revenue ($49/student/year)
- White-label licensing opportunities
- Network effects (more schools → more content → more value)

---

## TECHNICAL SPECIFICATIONS

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS for styling
- A-Frame for AR rendering
- MediaPipe for pose tracking

**Backend:**
- Netlify Serverless Functions (Node.js)
- Supabase (PostgreSQL database)
- Wristband OAuth authentication
- Stripe payment processing

**AI/ML:**
- Anthropic Claude API (curriculum processing)
- OpenAI GPT-4 (alternative)
- MediaPipe Pose (motion tracking)
- Google Vision API (OCR for images)

**APIs:**
- USDA FoodData Central (nutrition - culinary)
- Google Places API (market directory)
- YouTube Data API (video tutorials)
- Unsplash API (imagery)
- Industry-specific APIs (swap per discipline)

### Database Schema

**Key Tables:**
- `users` - User authentication and profiles
- `content_staging` - Uploaded curriculum files
- `curriculum_content` - Extracted techniques/procedures
- `assignments` - Auto-generated video assignments
- `ar_scenes` - Generated AR practice scenes
- `user_cookbook` - Student practice content
- `profiles` - Student progress and XP
- `user_subscriptions` - Payment and access control

### Security & Compliance

- OAuth 2.0 authentication (Wristband)
- TLS 1.3 encryption in transit
- AES-256 encryption at rest
- Row-Level Security (RLS) policies
- FERPA compliant (student data isolation)
- GDPR ready (data export/deletion)

---

## CONCLUSION

This invention solves a critical problem in vocational education: the lack of specialized learning tools comparable to those available in nursing and engineering. By using AI-driven prompt engineering to create a content-agnostic platform architecture, a single codebase can serve unlimited vocational disciplines without requiring separate platform development.

**Key Innovations:**
1. **Content-agnostic architecture** where uploaded curriculum defines the domain
2. **Prompt-driven multi-domain adaptation** (change one line, serve new discipline)
3. **Automated curriculum processing** (40 hours → 2 hours)
4. **Intelligent pedagogical routing** (AI understands content purpose)
5. **Automated AR practice generation** (text → interactive AR in minutes)

**Commercial Viability:**
- Proven with culinary implementation (October 2025)
- Design partner validation (MNDA executed)
- Active sales pipeline (100+ schools)
- Clear path to market expansion (4-6 weeks per discipline)

**Patent Strength:**
- Novel combination of AI + LMS + multi-domain + AR
- No prior art for content-agnostic vocational platform
- Working proof-of-concept demonstrates feasibility
- Clear commercial value and market demand

---

## INVENTOR DECLARATION

I, Patrick Adukonis, declare that:

1. I am the original and first inventor of the subject matter disclosed in this application
2. I conceived this invention in February 2025
3. I reduced this invention to practice in October 2025 with a working prototype
4. I have reviewed and understand the contents of this application
5. I acknowledge the duty to disclose all material information to the USPTO

**Date:** December 2025  
**Inventor:** Patrick Adukonis  
**Company:** PorkChop (LLC Filed 12/12/2025)
**Location:** Portland, Maine

**END OF PROVISIONAL PATENT APPLICATION**
