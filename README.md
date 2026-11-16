# ResumeX AI – AI Resume Analyzer & Career Advisor

A modern, high-performance web platform designed to parse PDF and DOCX applicant resumes locally in the browser, calculate an exact **deterministic 100-point ATS compatibility score**, identify skill gaps, and provide actionable career trajectory recommendations.

Built with **HTML5**, **CSS3**, **Vanilla JavaScript**, **Three.js**, **Chart.js**, **PDF.js**, and **Mammoth.js**.

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
Since ResumeX AI uses pure Vanilla web technologies with CDN libraries, you can also double-click **`index.html`** or right-click and choose **"Open with Google Chrome"** (or Edge/Brave/Firefox).

### Method 3: Run Automated Test Suite
To execute the comprehensive automated test suite testing PDF/DOCX extraction, deterministic scoring, input differentiation, and OCR detection:
```bash
npm test
```

---

## 📂 Project Architecture

```
ResumeX AI/
├── index.html                  # Landing page with Three.js 3D hero scene, features, how it works, preview, footer
├── analyzer.html               # Interactive resume diagnostic tool with upload, job input, keyword matching & dual charts
├── dashboard.html              # Applicant command center displaying real scans, score trends, and skill gap insights
├── login.html                  # Premium glassmorphic authentication page (Sign In / Create Account / Guest Demo)
├── serve.js                    # Lightweight zero-dependency local development HTTP server
├── package.json                # Project configuration with start & test scripts
├── css/
│   ├── style.css               # Complete design system (light theme, glassmorphism, responsive layout, breakdown bars)
│   └── animations.css          # Keyframe animations (floating 3D effects, progress bars, shimmer, glow)
├── js/
│   ├── document-parser.js      # Local PDF.js & Mammoth.js text extraction, file validation, and OCR detection
│   ├── ats-engine.js           # Deterministic 100-point scoring engine (7 criteria), suggestions, and report compiler
│   ├── analyzer.js             # UI orchestrator, loading states, circular gauge, dual Chart.js charts, local sync
│   ├── dashboard.js            # Dashboard controller, real scan metrics, progression & doughnut charts
│   ├── main.js                 # Navigation drawer, header scroll detection, toast notifications, auth state
│   └── three-scene.js          # Three.js 3D floating resume, procedural canvas texture, mouse parallax & WebGL fallback
├── test/
│   ├── test-ats-engine.js      # Unit tests for scoring engine, bounds, input variance, and OCR heuristic
│   ├── test-extraction-and-ats.js # Integration test verifying PDF and DOCX extraction with sample files
│   ├── generate-sample-pdf.js  # Generator for digital text PDF and scanned image-only PDF
│   └── generate-sample-docx.js # Generator for valid Word DOCX zip archive
└── assets/
    ├── logo.svg                # Premium vector gradient logo
    └── favicon.svg             # Brand vector favicon
```

---

## ⚖️ Deterministic ATS Scoring Algorithm (100 Points Total)

ResumeX AI does **not** generate random scores or pretend results. Every score is deterministically calculated directly from the extracted resume text against the target job description across 7 explicit criteria:

| Category | Points | Calculation Logic |
| :--- | :---: | :--- |
| **1. Keyword Matching** | **30 pts** | Extracts key domain unigrams and multi-word phrases (e.g. `ci/cd`, `system design`, `rest api`) from the job description and evaluates whole-word token presence in the resume: `Math.round((matched / total) * 30)`. |
| **2. Skills Matching** | **25 pts** | Evaluates explicit technical and domain competencies from a dictionary of 180+ skills (languages, frameworks, databases, cloud, DevOps, AI/ML) required by the JD against candidate skills: `Math.round((matched / total) * 25)`. |
| **3. Experience Relevance** | **15 pts** | Detects required years in JD vs candidate years/tenure (up to 6 pts), distinct work history positions (up to 4 pts), quantified achievement metrics with `%`, `$`, or scale numbers (up to 5 pts), and verifies domain alignment. |
| **4. Education Relevance** | **10 pts** | Compares degree requirements in the JD against detected candidate credentials. Awards 7 pts for Bachelor's/Master's/Ph.D. degree level + 3 pts for relevant STEM/domain major. Penalizes missing or unrelated degrees. |
| **5. Resume Structure** | **10 pts** | Validates the presence of standard ATS-recognized section headers (Contact, Summary, Experience, Skills, Education) at 2 points per detected section. |
| **6. Contact Information** | **5 pts** | Validates presence of essential contact details: Email address (2 pts), Phone number (1 pt), City/Location (1 pt), and Professional portfolio / LinkedIn link (1 pt). |
| **7. Readability & Formatting** | **5 pts** | Evaluates document word count within optimal 300–1500 range (2 pts), consistent bullet point structure (2 pts), and absence of long run-on sentences (1 pt). |

**Total ATS Compatibility Score**: `Keyword (30) + Skills (25) + Experience (15) + Education (10) + Structure (10) + Contact (5) + Readability (5) = 100 Points`.

---

## ⚡ Supabase Cloud Integration

ResumeX AI is integrated with the official **Supabase JavaScript client** for cloud authentication, database persistence, and document storage.

### 🔑 Exactly Where to Enter Your Supabase Credentials

Open [supabase-config.js](file:///c:/Users/jives/OneDrive/Desktop/ResumeX%20AI/supabase-config.js) in your editor:

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
You can also test the connection live directly in the browser by clicking the **"Test Supabase"** button in [dashboard.html](file:///c:/Users/jives/OneDrive/Desktop/ResumeX%20AI/dashboard.html) or [login.html](file:///c:/Users/jives/OneDrive/Desktop/ResumeX%20AI/login.html).

---

## 🔒 Client-Side Privacy Guarantee

- All document parsing (PDF extraction via **PDF.js** and Word extraction via **Mammoth.js**) executes **100% locally in the browser**.
- No resume documents, contact details, or job descriptions are transmitted to external servers or third-party APIs during this frontend stage.
- Configured with official PDF.js web worker (`pdf.worker.min.js`) for non-blocking asynchronous PDF processing.
- Image-only or scanned PDFs are automatically detected with an **OCR Required** diagnostic warning.

---

## 🔌 Remaining Limitations & Next Phase Integration

1. **OCR for Scanned PDFs**:
   - *Current State*: Scanned/image-only PDFs are detected and flagged with an informative warning explaining that machine-readable text is required.
   - *Next Phase*: Integrate Tesseract.js client-side OCR worker or Google Cloud Vision OCR backend for automatic optical character recognition of scanned paper resumes.

2. **Generative AI Coaching (Gemini API)**:
   - *Current State*: Suggestions are dynamically compiled from missing keywords, missing skills, missing sections, and metric density.
   - *Next Phase*: Connect Google Gemini 1.5 Flash/Pro to provide natural-language bullet point rewriting and STAR-method accomplishments phrasing.

3. **Cloud Database & User Persistence (Supabase)**:
   - *Current State*: Native Supabase Auth with email/password registration, login, persistent sessions, route guards, and profile creation is implemented and fully tested.
   - *Next Phase*: Add Google/GitHub OAuth providers and cloud resume document bucket storage.

---

## 🐙 Connecting to GitHub

1. Create a new empty repository on [GitHub](https://github.com/new) named `resumex-ai` (leave **Add a README file**, **.gitignore**, and **license** unchecked).
2. Connect your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/resumex-ai.git
   git branch -M main
   git push -u origin main
   ```
3. Your local commits will sync to your remote repository on GitHub.
