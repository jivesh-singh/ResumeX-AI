# CareerGuide.AI – AI Career Guidance & ATS Resume Intelligence

A high-performance web platform featuring a sleek obsidian dark theme designed to parse PDF, DOCX, and TXT applicant resumes locally in the browser, calculate an exact **deterministic 100-point ATS compatibility score**, discover **what jobs you can land**, identify **missing skills to add to your resume**, and generate a chronological **4-phase growth roadmap**.

Built with **HTML5**, **CSS3 (Obsidian & Slate Dark System)**, **Vanilla JavaScript**, **Three.js 3D**, **Chart.js**, **PDF.js**, and **Mammoth.js**.

---

## 🚀 Quick Start / How to Run

### Method 1: Local Development Server (Recommended)
Open your terminal inside this folder and run:
```bash
npm start
```
*Or directly:*
```bash
node serve.js
```
Then navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

### Method 2: Direct Browser Launch
Since CareerGuide.AI uses pure Vanilla web technologies with CDN libraries, you can also double-click **`index.html`** or right-click and choose **"Open with Google Chrome"** (or Edge/Brave/Firefox).

### Method 3: Run Automated Test Suite
To execute the comprehensive automated test suite testing PDF/DOCX extraction, deterministic scoring, career guidance benchmark synthesis, and OCR detection:
```bash
npm test
```

---

## 📂 Project Architecture

```
CareerGuide.AI/
├── index.html                  # Landing page with Three.js 3D hero scene, features, how it works, preview, footer
├── analyzer.html               # Career guidance & ATS diagnostic tool with upload, optional job input, job matching & dual charts
├── dashboard.html              # Career command center displaying real scans, score trends, and skill gap insights
├── login.html                  # Dark-themed glassmorphic authentication page (Sign In / Create Account / Guest Demo)
├── serve.js                    # Lightweight zero-dependency local development HTTP server
├── package.json                # Project configuration with start & test scripts
├── css/
│   ├── style.css               # Complete obsidian dark design system (#0a0b10, luminous accents, responsive layout)
│   └── animations.css          # Keyframe animations (floating 3D effects, progress bars, shimmer, glow)
├── js/
│   ├── document-parser.js      # Local PDF.js & Mammoth.js text extraction, file validation, and OCR detection
│   ├── ats-engine.js           # Deterministic 100-point scoring engine (7 criteria), career benchmark synthesis, suggestions, and report compiler
│   ├── analyzer.js             # UI orchestrator, loading states, circular gauge, dark Chart.js charts, local sync
│   ├── dashboard.js            # Dashboard controller, real scan metrics, dark progression & doughnut charts
│   ├── main.js                 # Navigation drawer, header scroll detection, toast notifications, auth state
│   └── three-scene.js          # Three.js 3D dark floating resume, procedural canvas texture, mouse parallax & WebGL fallback
├── test/
│   ├── test-ats-engine.js      # Unit tests for scoring engine, bounds, input variance, career guidance mode, and OCR heuristic
│   ├── test-extraction-and-ats.js # Integration test verifying PDF and DOCX extraction with sample files
│   ├── generate-sample-pdf.js  # Generator for digital text PDF and scanned image-only PDF
│   └── generate-sample-docx.js # Generator for valid Word DOCX zip archive
└── assets/
    ├── logo.svg                # Dark obsidian vector logo with luminous indigo/cyan gradient & compass star
    └── favicon.svg             # Brand vector favicon
```

---

## 🧭 Career Guidance & Dual-Flow Analysis

CareerGuide.AI supports two versatile career workflows:

1. **Resume-Only Career Guidance (Zero Job Description Required)**:
   - Simply upload your resume and click **Get Career Guidance & ATS Score**.
   - The engine automatically parses your skills, experience, and projects to detect your best-fit **Career Archetype** (e.g. *Full-Stack Engineer*, *Frontend Engineer*, *Backend Engineer*, *DevOps / Cloud*, *Data Scientist / ML*, *Cybersecurity*, *Mobile App Developer*, *Product Manager*, etc.).
   - It synthesizes an industry benchmark target, computes your 7-dimension ATS score, and recommends:
     - **What job you can get**: Primary high-compatibility title and seniority tier.
     - **What skills to add**: Critical industry competencies missing from your resume with exact phrasing suggestions.
     - **Alternative & adjacent career tracks**: Lateral moves and pivot roles with required bridge skills.
     - **4-Phase action roadmap**: Chronological steps from immediate resume optimization to interview mastery.

2. **Targeted Job Description Calibrator**:
   - Paste a specific job description or target role requirements to calibrate the ATS parser against exact employer criteria, keyword frequencies, and required qualifications.

---

## ⚖️ Deterministic ATS Scoring Algorithm (100 Points Total)

CareerGuide.AI does **not** generate random scores or pretend results. Every score is deterministically calculated directly from the extracted resume text against target qualifications across 7 explicit criteria:

| Category | Points | Calculation Logic |
| :--- | :---: | :--- |
| **1. Keyword Matching** | **30 pts** | Extracts key domain unigrams and multi-word phrases (e.g. `ci/cd`, `system design`, `rest api`) and evaluates whole-word token presence in the resume: `Math.round((matched / total) * 30)`. |
| **2. Skills Matching** | **25 pts** | Evaluates explicit technical and domain competencies from a dictionary of 180+ skills (languages, frameworks, databases, cloud, DevOps, AI/ML) required against candidate skills: `Math.round((matched / total) * 25)`. |
| **3. Experience Relevance** | **15 pts** | Detects required years vs candidate years/tenure (up to 6 pts), distinct work history positions (up to 4 pts), quantified achievement metrics with `%`, `$`, or scale numbers (up to 5 pts), and verifies domain alignment. |
| **4. Education Relevance** | **10 pts** | Compares degree requirements against detected candidate credentials. Awards 7 pts for Bachelor's/Master's/Ph.D. degree level + 3 pts for relevant STEM/domain major. Penalizes missing or unrelated degrees. |
| **5. Resume Structure** | **10 pts** | Validates the presence of standard ATS-recognized section headers (Contact, Summary, Experience, Skills, Education) at 2 points per detected section. |
| **6. Contact Information** | **5 pts** | Validates presence of essential contact details: Email address (2 pts), Phone number (1 pt), City/Location (1 pt), and Professional portfolio / LinkedIn link (1 pt). |
| **7. Readability & Formatting** | **5 pts** | Evaluates document word count within optimal 300–1500 range (2 pts), consistent bullet point structure (2 pts), and absence of long run-on sentences (1 pt). |

**Total ATS Compatibility Score**: `Keyword (30) + Skills (25) + Experience (15) + Education (10) + Structure (10) + Contact (5) + Readability (5) = 100 Points`.

---

## ⚡ Supabase Cloud Integration

ResumeX AI is integrated with the official **Supabase JavaScript client** for cloud authentication, database persistence, and document storage.

### 🔑 Exactly Where to Enter Your Supabase Credentials

Open [supabase-config.js](file:///c:/Users/jives/OneDrive/Desktop/CarrerGuide.AI/supabase-config.js) in your editor:

```javascript
// Step 1: Replace with your actual Project URL (starts with https:// and ends with .supabase.co)
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';

// Step 2: Replace with your actual anon / public key (starts with eyJ...)
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_PUBLISHABLE_KEY';
```

#### Where to find your credentials in Supabase:
1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click the **Project Settings** (gear icon) in the left navigation sidebar.
4. Go to **API**.
5. Copy **Project URL** (e.g. `https://abcdefghijklm.supabase.co`) and paste into `SUPABASE_URL`.
6. Copy the key labeled **`anon` `public`** under **Project API Keys** and paste into `SUPABASE_ANON_KEY`.

> ⚠️ **CRITICAL SECURITY RULE**: Never paste your `service_role` key, database passwords, or JWT secrets into frontend JavaScript. The `service_role` key bypasses Row Level Security (RLS) and grants complete administrative control to anyone inspecting your browser code. Use **only** the `anon` public key.

### 🧪 How to Test the Connection
Run the automated Supabase diagnostics command:
```bash
npm run test:supabase
```
You can also test the connection live directly in the browser by clicking the **"Test Supabase"** button in [dashboard.html](file:///c:/Users/jives/OneDrive/Desktop/CarrerGuide.AI/dashboard.html) or [login.html](file:///c:/Users/jives/OneDrive/Desktop/CarrerGuide.AI/login.html).

---

## 🎯 Career Advisory & Perfect Job Matching

CareerGuide.AI does more than calculate ATS scores — it acts as a strategic career advisor by cross-referencing your verified resume skills and target job description to pinpoint:

1. **Primary Highest-Compatibility Role**:
   - Synthesizes technical overlap, domain keywords, and detected experience years into a precise title (e.g. *Senior Full-Stack Software Engineer*, *AI & Machine Learning Solutions Engineer*, *Cloud Platform & DevOps Engineer*).
   - Calibrates accurate seniority tiers (*Associate*, *Mid-Level*, *Senior*, *Lead / Principal*).
   - Displays real-world 2026 market demand trends and salary benchmarks.

2. **Alternative & Adjacent Roles**:
   - Identifies secondary career tracks (e.g. *Frontend Architect*, *Backend Systems Engineer*) with match percentages and the key **bridge skill** needed to transition.

3. **4-Phase Chronological Transition Roadmap ("How To Land This Job")**:
   - **Phase 1: Resume & ATS Tweaks (Days 1–3)**: Targeted keyword injection, metric quantification (`[Verb] + [Context] + [Result]`), and standard section heading fixes.
   - **Phase 2: High-Priority Skill Bridging (Weeks 1–2)**: Concrete learning objectives and estimated hours for your top missing skills.
   - **Phase 3: Proof-of-Work Portfolio Blueprint (Weeks 3–4)**: Tailored flagship project concepts with recommended tech stack and verifiable deliverables.
   - **Phase 4: Interview & Application Strategy (Weeks 4+)**: Role-specific system design topics, STAR behavioral story prompts, and strategic LinkedIn outreach.

---

## ⚡ Real Supabase Authentication & Database Setup

CareerGuide.AI integrates official Supabase Auth (@supabase/supabase-js) with persistent sessions and route guarding:

- **Registration & Login**: Native email/password authentication with validation and clear error mapping.
- **Route Guarding**: Unauthenticated visits to [dashboard.html](file:///c:/Users/jives/OneDrive/Desktop/CarrerGuide.AI/dashboard.html) automatically redirect to `login.html?redirect=dashboard.html&reason=unauthenticated`.
- **Navigation State Sync**: Header navigation across all pages reflects the authenticated user's name and **Sign Out** button.

### Supabase Database SQL Schema
Run this script in your **Supabase Dashboard > SQL Editor** to initialize the required tables and Row Level Security (RLS) policies:

```sql
-- 1. Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Scans Table (Analysis History)
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  file_name text not null,
  job_title text not null,
  overall_score integer not null,
  verdict text not null,
  scores jsonb,
  matched_skills text[],
  missing_skills text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.scans enable row level security;
create policy "Users can view their own scans" on public.scans for select using (auth.uid() = user_id);
create policy "Users can insert their own scans" on public.scans for insert with check (auth.uid() = user_id);
create policy "Users can delete their own scans" on public.scans for delete using (auth.uid() = user_id);
```

---

## 🔒 Client-Side Privacy Guarantee

- All document parsing (PDF extraction via **PDF.js** and Word extraction via **Mammoth.js**) executes **100% locally in the browser**.
- No resume documents, contact details, or job descriptions are transmitted to external servers or third-party APIs during this frontend stage.
- Configured with official PDF.js web worker (`pdf.worker.min.js`) for non-blocking asynchronous PDF processing.
- Image-only or scanned PDFs are automatically detected with an **OCR Required** diagnostic warning.

---

## 📦 How to Upload / Push to GitHub

To publish this project to your GitHub account:

### Step 1: Create a New Repository on GitHub
1. Open [https://github.com/new](https://github.com/new) in your browser.
2. Enter Repository name: `careerguide-ai` (or your preferred name).
3. Set visibility to **Public** or **Private**.
4. Leave **"Initialize this repository with a README"** **UNCHECKED** (we already have a complete README and git history).
5. Click **Create repository**.

### Step 2: Link Remote & Push from Terminal
In your terminal, run:

```bash
# 1. Add your GitHub repository as remote origin (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/careerguide-ai.git

# 2. Stage all latest files
git add .

# 3. Commit the updates
git commit -m "feat: Redesign to CareerGuide.AI with obsidian dark theme and automated career matching"

# 4. Set default branch to main and push
git branch -M main
git push -u origin main
```

---

## 🔌 Remaining Limitations & Next Phase Integration

1. **OCR for Scanned PDFs**:
   - *Current State*: Scanned/image-only PDFs are detected and flagged with an informative warning explaining that machine-readable text is required.
   - *Next Phase*: Integrate Tesseract.js client-side OCR worker or Google Cloud Vision OCR backend for automatic optical character recognition of scanned paper resumes.

2. **Generative AI Coaching (Gemini API)**:
   - *Current State*: Suggestions are dynamically compiled from missing keywords, missing skills, missing sections, and metric density.
   - *Next Phase*: Connect Google Gemini 1.5 Flash/Pro to provide natural-language bullet point rewriting and STAR-method accomplishments phrasing.
