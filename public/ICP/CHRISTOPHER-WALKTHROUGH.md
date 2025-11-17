# Christopher Malmberg - User Walkthrough Guide
**1-on-1 Consultative Session (60-90 minutes)**

---

## SESSION CONTEXT

**What Christopher Wants:**
- Help navigating the platform as a user
- Understanding what he's seeing
- One-on-one session (no Jennifer)

**What This Is NOT:**
- ❌ A sales pitch
- ❌ A feature showcase
- ❌ A timed demo

**What This IS:**
- ✅ A training/onboarding session
- ✅ User support and guidance
- ✅ Question-driven exploration
- ✅ Collaborative walkthrough

---

## PRE-MEETING PREP

### Before You Join the Call:
- [ ] Log into your demo environment
- [ ] Have admin view ready
- [ ] Check what role Christopher has (student/instructor/admin?)
- [ ] Review his previous meeting notes
- [ ] Have Zoom ready with screen share
- [ ] Water nearby
- [ ] Notebook for his questions/feedback

### Mental Preparation:
- This is **support**, not **sales**
- Let him drive the conversation
- Answer questions thoroughly
- Be patient - he's learning the platform
- Take notes on confusing areas (product feedback)

---

## SESSION STRUCTURE (Flexible)

### **OPENING (5 minutes)**

**Greeting:**
"Hey Christopher! Thanks for making time. I know you wanted a few more days to explore, so I'm really glad we could schedule this. My goal today is to help you understand anything you're seeing in the platform and answer all your questions."

**Set Expectations:**
"I don't have a specific agenda - this is your session. I'd like to hear:
1. What you've been exploring so far
2. What questions have come up
3. What areas are confusing or unclear

Then we can walk through the platform together at your pace. Does that work?"

**[LET HIM TALK. This sets the tone for the entire session.]**

---

### **DISCOVERY (10 minutes)**

**Ask Open-Ended Questions:**

1. **"What parts of the platform have you explored so far?"**
   - Listen for: MyKitchen, MyCookBook, CulinarySchool, Chef's Corner, Admin
   - Take notes on what he's seen vs. what he hasn't

2. **"What questions came up while you were clicking around?"**
   - These are gold - address them immediately or note them for later

3. **"What's your role going to be - are you thinking instructor, admin, or both?"**
   - This determines which features matter most to him

4. **"What are you trying to accomplish with PorkChop?"**
   - Understand his goals so you can tailor the walkthrough

5. **"Is there a specific feature or area you'd like to start with?"**
   - Let him choose where to begin

**[TAKE DETAILED NOTES. Let silence happen. Don't rush.]**

---

## WALKTHROUGH MODULES (60-75 minutes)

**⚠️ IMPORTANT: Let Christopher's questions guide the order. Below is reference material for each module.**

---

### **MODULE 1: MyKitchen (If He Asks)**

**What This Module Does:**
"MyKitchen is where students manage their home ingredients and find recipes they can make with what they have."

**Key Features to Show:**

1. **Ingredient Scanner**
   - "This uses Google Vision API to scan their fridge/pantry."
   - Demo: Hold up your phone or use webcam on real food
   - "It auto-categorizes ingredients into 10 categories."
   - Show the jar shelf display

2. **Recipe Matcher Algorithm**
   - "The core of MyKitchen is the recipe matcher."
   - Click "Find Recipes"
   - "It considers: ingredients they have, kitchen setup, experience level, equipment."
   - Show match scores and highlighted ingredients (green = have, red = need)

3. **Kitchen Setup Profiles**
   - "Students set their kitchen type: Dorm Life, Minimalist, Full Chef's Kitchen"
   - "This filters recipes based on equipment they actually have."

**Address Questions Like:**
- "How accurate is the scanner?" → Show live demo
- "Where do recipes come from?" → Explain Anthropic AI + curated database
- "Can instructors add recipes?" → Show admin capabilities
- "What if students don't have a kitchen?" → Explain dorm-friendly filtering

---

### **MODULE 2: MyCookBook (If He Asks)**

**What This Module Does:**
"MyCookBook is the gradebook and assignment system - it's the LMS core."

**Key Features to Show:**

1. **Gradebook System**
   - Open the gradebook modal (book-style design)
   - "This is where instructors create assignments and students submit videos."
   - Show the sample assignments:
     - Week 3: French Knife Skills & Mother Sauces
     - Week 5: Sauce Making & Emulsification
     - Week 7: Protein Cookery & Temperature Control

2. **Video Grading**
   - "The killer feature is timestamp feedback while watching."
   - Click on an assignment
   - Play a student video
   - Pause and add timestamp comment: "0:23 - Great knife grip!"
   - "Students see exactly when in the video you're commenting."
   - Show grade assignment (letter grade + numeric score)

3. **Student View**
   - "Students see their assignments, can upload videos directly."
   - "They build a video portfolio of their techniques."

4. **Collections**
   - "Students can organize recipes into custom folders."
   - Show collection creation and emoji customization

**Address Questions Like:**
- "How do students upload videos?" → Show submission interface
- "What's the file size limit?" → Provide technical specs
- "Can multiple instructors grade?" → Explain permissions
- "How do students share their portfolios?" → Show sharing options

---

### **MODULE 3: CulinarySchool (If He Asks)**

**What This Module Does:**
"CulinarySchool is the curriculum library - 52 weekly techniques organized by category."

**Key Features to Show:**

1. **52 Weekly Techniques**
   - "Not 52 weeks of school - just 52 techniques organized by category."
   - Show categories:
     - Knife & Prep (1-13)
     - Heat & Temperature (14-26)
     - Flavor Building (27-39)
     - Texture & Technique (40-52)

2. **Syllabus System**
   - "Instructors can organize techniques into terms and lessons."
   - Show general lessons: Knife Skills, Seafood Safety, Protein Basics, etc.

3. **Integration with Recipes**
   - "Each technique can link to specific recipes for practice."
   - "Students see technique tutorials alongside practical applications."

**Address Questions Like:**
- "Can we customize the curriculum?" → Explain customization options
- "Where do tutorials come from?" → Show YouTube API integration
- "How does this map to our existing syllabus?" → Discuss mapping process

---

### **MODULE 4: Chef's Corner (If He Asks)**

**What This Module Does:**
"Chef's Corner is the entrepreneurship and community module."

**Key Features to Show:**

1. **Global Test Kitchen**
   - "Students can go live and practice running mock pop-ups."
   - Show scheduling interface
   - "They practice menu planning, presentation, time management."
   - Show session types: practice, assignment, demo, showcase

2. **Market Directory**
   - "Google Places API integration for local vendor research."
   - Show categories: Seafood, Meat, Produce, Farms, Equipment
   - "Students learn to source from real vendors, compare pricing."
   - "Filters out big box retailers automatically."

3. **Weekly Chef Quotes**
   - "52 rotating quotes from Julia Child, Bourdain, etc."
   - "Keeps students inspired and engaged."

4. **Challenge of the Week**
   - "15+ rotating weekly challenges with XP rewards."
   - Show examples: PO TA TOES, Lobster Fest, etc.
   - "Anthropic AI validates submissions based on ingredients."

**Address Questions Like:**
- "How does live streaming work?" → Explain video recording/streaming
- "Is this like Twitch for cooking?" → Position as entrepreneurship training
- "Can instructors create challenges?" → Show admin capabilities

---

### **MODULE 5: AdminDashboard (If He's Admin)**

**What This Module Does:**
"The admin dashboard is school-level management and analytics."

**Key Features to Show:**

1. **User Management**
   - Show student and instructor lists
   - Explain role management and permissions

2. **Subscription Management**
   - Show active/expired subscriptions
   - Explain pricing tiers

3. **Analytics & Reporting**
   - Show engagement metrics
   - Recipe counts, XP totals, activity tracking

4. **School Branding**
   - Show logo upload and color scheme customization
   - School-specific settings

5. **API Key Management**
   - Show where API keys are configured
   - Explain which services need keys (Vision, Anthropic, Places, etc.)

**Address Questions Like:**
- "How do we onboard students?" → Explain user provisioning
- "Can we export data?" → Show export options
- "How do we integrate with our SIS?" → Discuss API integration
- "What reports can we generate?" → Show analytics capabilities

---

## QUESTION HANDLING (Throughout Session)

### **How to Answer Questions:**

1. **Listen Fully**
   - Don't interrupt
   - Let him finish the entire question
   - Pause before answering

2. **Clarify If Needed**
   - "Just to make sure I understand - you're asking about [X]?"
   - Better to clarify than answer the wrong question

3. **Answer Thoroughly**
   - Don't rush
   - Show, don't just tell
   - Use the live platform to demonstrate

4. **Check Understanding**
   - "Does that answer your question?"
   - "Want me to show that again?"

5. **Note Patterns**
   - If he asks about the same thing multiple times, it's confusing
   - Note for product improvements

### **If You Don't Know the Answer:**

**Don't BS. Ever.**

Say: "That's a great question. I don't know off the top of my head, but I can find out and get back to you by [timeframe]. Can I note that down?"

---

## HANDLING TECHNICAL ISSUES

### **If Something Doesn't Work During Demo:**

1. **Stay Calm**
   - "Hmm, that's interesting. Let me try this instead."
   - Never blame the platform or get flustered

2. **Explain What Should Happen**
   - "Normally when you click here, [X] should happen."
   - "Let me refresh and try again."

3. **Turn It Into a Learning Moment**
   - "Actually, this is a good opportunity to show you the alternative way to do this."

4. **Follow Up**
   - Note the bug/issue
   - Tell Patrick immediately after the call
   - Follow up with Christopher: "Hey, I figured out what happened with [X]..."

---

## TAKING NOTES DURING THE CALL

**Note These Things:**

1. **Questions He Asks**
   - Exact wording (reveals confusion points)
   - How many times he asks the same thing

2. **Features He's Excited About**
   - What makes him lean forward?
   - What does he say "Oh wow" about?

3. **Features He's Confused About**
   - What makes him go silent?
   - What requires multiple explanations?

4. **His Use Case**
   - What's he trying to accomplish?
   - How does he see using PorkChop?

5. **Product Feedback**
   - "It would be great if..."
   - "I wish this did..."
   - "This is confusing because..."

**[These notes are GOLD for Patrick and for product development]**

---

## WRAPPING UP (5-10 minutes)

### **Check Satisfaction:**
"Okay, I want to make sure I covered everything. What questions do you still have?"

**[Give him time to think. Silence is okay.]**

### **Summarize What You Covered:**
"Just to recap, we walked through:
- [List the modules you covered]
- [Highlight key features he was interested in]
- [Note any follow-ups you promised]"

### **Next Steps:**

**Ask:**
"What would be helpful next? Do you want to:
1. Schedule another session after you explore more?
2. Get access for other faculty to try it?
3. Discuss implementation for a specific class?
4. Something else?"

**[Let him decide the next step.]**

### **Follow-Up Plan:**

"I'm going to send you:
1. My contact info (email/phone) for any questions
2. [Any resources he requested]
3. [Answers to questions you didn't have]
4. [Technical documentation if needed]

Does [timeframe] work for follow-up?"

### **Thank Him:**
"Thanks so much for the time today, Christopher. I really appreciate you digging into the platform and asking great questions. Feel free to reach out anytime - I'm here to help."

---

## POST-MEETING CHECKLIST

**Within 1 Hour:**
- [ ] Send follow-up email with summary
- [ ] Send any resources you promised
- [ ] Note all product feedback
- [ ] Update HubSpot with meeting notes
- [ ] Slack Patrick with key insights

**Within 24 Hours:**
- [ ] Research answers to questions you didn't know
- [ ] Send those answers to Christopher
- [ ] Create any documentation he requested
- [ ] Note any bugs/issues for engineering

**Within 1 Week:**
- [ ] Follow up: "How's it going? Any other questions?"
- [ ] Send relevant resources (new features, updates, etc.)

---

## FOLLOW-UP EMAIL TEMPLATE

**Subject:** Great session today - Resources for [School Name]

Hi Christopher,

Thanks for taking the time to walk through PorkChop today! I really enjoyed hearing your questions and helping you navigate the platform.

**What we covered:**
- [List modules you explored]
- [Key features he was interested in]
- [Use cases discussed]

**Resources:**
- [Link to any documentation]
- [Answers to questions you researched]
- [Technical specs if needed]

**Questions I'm still researching:**
- [Question 1] - I'll have an answer for you by [date]
- [Question 2] - Checking with our engineering team, will follow up

**My Contact Info:**
- Email: [Your Email]
- Phone: [Your Phone]
- Best time to reach me: [Your availability]

Don't hesitate to reach out as you continue exploring. I'm here to help!

Best,
Patrick

---

## KEY MINDSET REMINDERS

### **This Is Not a Demo, It's Training**
- He's already interested
- He's already in the platform
- He needs help, not convincing

### **Be Patient**
- Let him drive
- Don't rush
- Repeat explanations if needed

### **Be Honest**
- If something doesn't work, say so
- If you don't know, say so
- If a feature isn't ready, say so

### **Be Helpful**
- Focus on his success
- Answer every question thoroughly
- Follow through on every promise

### **Be Curious**
- Ask about his use case
- Understand his goals
- Learn from his confusion

---

## CHRISTOPHER-SPECIFIC NOTES

**From His Email:**
- Wants more time to explore before meeting ✅
- One-on-one session (no Jennifer) ✅
- Wants help navigating as a user ✅
- Available: Wed between 11-3, or Thurs before 11 ✅

**LinkedIn Research:**
- [Add notes after you look him up]
- School/institution:
- Role:
- Background:

**Previous Meeting Notes:**
- [Review what was discussed with Jennifer]
- [What questions came up?]
- [What was his reaction?]

---

## FINAL CHECKLIST

Before you join the call, ask yourself:

- [ ] Do I know what Christopher wants from this session?
- [ ] Am I prepared to let him drive the conversation?
- [ ] Do I have the platform ready to demonstrate anything?
- [ ] Am I ready to take detailed notes?
- [ ] Do I have his previous meeting context?
- [ ] Am I in the right mindset (helper, not seller)?

---

**You've got this, Patrick. This is a consultative session - just be helpful, be patient, and be honest.**

**Remember: A confused user who gets great support becomes a champion. Make Christopher feel supported.** 🥂

---

**END OF WALKTHROUGH GUIDE**
