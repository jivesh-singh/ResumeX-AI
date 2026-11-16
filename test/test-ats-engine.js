/**
 * ResumeX AI - Automated ATS Scoring & Parser Test Suite
 * Tests deterministic scoring algorithm, criteria bounds, input variance,
 * DocumentParser validation, OCR detection heuristics, and report generation.
 */

const assert = require('assert');
const AtsEngine = require('../js/ats-engine.js');
const DocumentParser = require('../js/document-parser.js');

console.log('====================================================');
console.log('🧪 Starting ResumeX AI Test Suite');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

// --- Sample Resumes & Job Descriptions ---

const RESUME_SENIOR_DEV = `
ALEX MORGAN
alex.morgan@example.com | (415) 555-0192 | San Francisco, CA | github.com/alexmorgan | linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Results-driven Senior Full-Stack Engineer with 6+ years of experience architecting high-throughput web applications, microservices, and cloud-native solutions. Proficient in TypeScript, React, Node.js, Python, PostgreSQL, and AWS Cloud infrastructure.

CORE TECHNICAL SKILLS
• Programming Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3, Go
• Frontend Technologies: React, Next.js, Redux, TailwindCSS, Webpack, Responsive Design
• Backend & APIs: Node.js, Express, FastAPI, RESTful APIs, GraphQL, Microservices, System Design
• Databases & Caching: PostgreSQL, MySQL, Redis, MongoDB, Elasticsearch
• DevOps & Cloud: AWS, Docker, Kubernetes, CI/CD, GitHub Actions, Linux
• Testing & Quality: Jest, Cypress, TDD, Unit Testing, Integration Testing, Agile, Scrum

PROFESSIONAL EXPERIENCE
Senior Full-Stack Engineer | CloudScale Systems Inc. | San Francisco, CA
2021 — PRESENT
• Architected and deployed scalable microservices using TypeScript, Node.js, and PostgreSQL, serving 2.5M+ active users.
• Engineered automated CI/CD deployment pipelines on AWS using Docker and GitHub Actions, cutting build-to-deploy cycles by 45%.
• Implemented Redis distributed caching layer, reducing database query latencies by 60% and improving endpoint response times.
• Mentored 6 software engineers in test-driven development (TDD) using Jest and led bi-weekly system architecture reviews.

Software Engineer | NexaTech Labs | San Jose, CA
2018 — 2021
• Developed customer-facing frontend portals using React, Next.js, and TailwindCSS with 99.9% uptime.
• Built high-performance RESTful APIs in Node.js and Python for financial analytics ingestion, processing $15M in daily transactions.
• Collaborated in cross-functional Agile sprints with product designers and backend architects to deliver 14 major feature releases.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley (2014 — 2018)
Graduated with Honors | Relevant Coursework: Data Structures, Algorithms, Distributed Systems
`;

const RESUME_JUNIOR_DATA_SCIENTIST = `
JORDAN LEE
jordan.lee@example.com | (212) 555-4819 | New York, NY | github.com/jordanlee

CAREER OBJECTIVE
Enthusiastic Data Scientist with 2 years of experience building machine learning models, statistical analyses, and data pipelines using Python, PyTorch, and SQL.

TECHNICAL SKILLS
Python, SQL, PyTorch, TensorFlow, Pandas, NumPy, Scikit-learn, Machine Learning, Data Analysis, Git

WORK EXPERIENCE
Junior Data Scientist | DataCorp Analytics (2022 — Present)
• Built predictive regression models using Python, Pandas, and Scikit-learn with 87% accuracy.
• Processed structured datasets using SQL and automated ETL data pipelines.

EDUCATION
Bachelor of Science in Statistics | New York University (2018 — 2022)
`;

const RESUME_BARE_BONES = `
Simple Person
Just a quick note.
Worked at a shop from 2021 to 2022 doing customer support.
No contact number listed.
`;

const JD_SOFTWARE_ENGINEER = `
Position: Senior Full-Stack Engineer (React / Node.js / Cloud Architecture)
Location: San Francisco, CA (Hybrid / Remote)
Experience: 5+ years of software engineering experience

Key Requirements:
• 5+ years of professional software engineering experience building scalable production web applications.
• Strong expertise in TypeScript, JavaScript, React, Next.js, and Node.js.
• Solid background in relational and NoSQL databases, specifically PostgreSQL and Redis.
• Production experience with AWS Cloud services (Lambda, S3, EC2), Docker containers, and CI/CD pipelines.
• Hands-on experience developing RESTful APIs, GraphQL, and microservices architecture.
• Experience writing unit and integration tests with Jest or Cypress.
• Solid understanding of System Design, Agile methodology, and continuous deployment.
• Bachelor's degree in Computer Science, Software Engineering, or equivalent practical experience.
`;

const JD_NURSE = `
Position: Registered Nurse - Intensive Care Unit (ICU)
Location: Chicago, IL
Requirements:
• Active RN license and Bachelor of Science in Nursing (BSN).
• 3+ years of clinical acute care and ICU experience.
• CPR and ACLS certifications required.
• Expertise in patient care, triage, medication administration, vitals monitoring, and electronic health records (EHR).
• Strong compassionate communication and emergency response capabilities.
`;

const JD_DATA_SCIENTIST = `
Position: Machine Learning Engineer / Data Scientist
Location: Remote
Requirements:
• 2+ years of experience in Machine Learning, Deep Learning, and predictive modeling.
• Strong proficiency in Python, PyTorch, TensorFlow, Scikit-learn, and Pandas.
• Strong SQL skills for querying distributed data warehouses.
• Experience building data pipelines and deploying ML models.
• Degree in Statistics, Computer Science, or Mathematics.
`;

// --- TEST SUITE EXECUTION ---

console.log('--- 1. Deterministic ATS Scoring & Bounds Tests ---');

it('Scoring algorithm returns exact sum of 7 criteria out of 100', () => {
  const result = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_SOFTWARE_ENGINEER);
  
  const sum = result.scores.keywords +
              result.scores.skills +
              result.scores.experience +
              result.scores.education +
              result.scores.structure +
              result.scores.contact +
              result.scores.readability;

  assert.strictEqual(result.overallScore, sum, 'overallScore must equal exact sum of all 7 criteria');
  assert(result.overallScore >= 0 && result.overallScore <= 100, 'Score must be between 0 and 100');
});

it('Individual criteria scores stay strictly within defined maximum bounds', () => {
  const result = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_SOFTWARE_ENGINEER);
  
  assert(result.scores.keywords <= 30 && result.scores.keywords >= 0, 'Keyword score max 30');
  assert(result.scores.skills <= 25 && result.scores.skills >= 0, 'Skills score max 25');
  assert(result.scores.experience <= 15 && result.scores.experience >= 0, 'Experience score max 15');
  assert(result.scores.education <= 10 && result.scores.education >= 0, 'Education score max 10');
  assert(result.scores.structure <= 10 && result.scores.structure >= 0, 'Structure score max 10');
  assert(result.scores.contact <= 5 && result.scores.contact >= 0, 'Contact score max 5');
  assert(result.scores.readability <= 5 && result.scores.readability >= 0, 'Readability score max 5');
});

console.log('\n--- 2. Input Variance & Differentiation Tests ---');

it('Matching resume against target job description yields high score (>= 80)', () => {
  const matchResult = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_SOFTWARE_ENGINEER);
  console.log(`     -> Developer Resume vs Dev JD Score: ${matchResult.overallScore}/100`);
  assert(matchResult.overallScore >= 80, `Expected >= 80, got ${matchResult.overallScore}`);
  assert(matchResult.matchedSkills.length >= 6, 'Should match at least 6 core skills');
  assert(matchResult.matchedSkills.includes('TypeScript'), 'Should match TypeScript');
  assert(matchResult.matchedSkills.includes('React'), 'Should match React');
  assert(matchResult.matchedSkills.includes('Node.js'), 'Should match Node.js');
  assert(matchResult.matchedSkills.includes('AWS'), 'Should match AWS');
});

it('Same developer resume against unrelated Nurse JD yields significantly lower score (<= 45)', () => {
  const mismatchResult = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_NURSE);
  console.log(`     -> Developer Resume vs Nurse JD Score: ${mismatchResult.overallScore}/100`);
  assert(mismatchResult.overallScore <= 45, `Expected <= 45, got ${mismatchResult.overallScore}`);
  assert.strictEqual(mismatchResult.matchedSkills.length, 0, 'Developer has zero nursing skills');
  assert(mismatchResult.missingKeywords.includes('patient care') || mismatchResult.missingKeywords.includes('clinical') || mismatchResult.missingKeywords.includes('medication'), 'Should list nursing keywords as missing');
});

it('Changing job description significantly shifts score and keyword breakdown', () => {
  const devScore = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_SOFTWARE_ENGINEER).overallScore;
  const nurseScore = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_NURSE).overallScore;
  
  const scoreDiff = devScore - nurseScore;
  console.log(`     -> Score difference between matched and mismatched JDs: ${scoreDiff} points`);
  assert(scoreDiff >= 35, `Changing JD should cause a dramatic score shift (Expected >= 35, got ${scoreDiff})`);
});

it('Data Scientist resume matches Machine Learning JD but has gaps for Frontend JD', () => {
  const mlResult = AtsEngine.analyzeResume(RESUME_JUNIOR_DATA_SCIENTIST, JD_DATA_SCIENTIST);
  const webResult = AtsEngine.analyzeResume(RESUME_JUNIOR_DATA_SCIENTIST, JD_SOFTWARE_ENGINEER);

  console.log(`     -> Data Scientist Resume vs ML JD: ${mlResult.overallScore}/100 (Matched skills: ${mlResult.matchedSkills.join(', ')})`);
  console.log(`     -> Data Scientist Resume vs Web JD: ${webResult.overallScore}/100 (Missing skills: ${webResult.missingSkills.slice(0, 5).join(', ')})`);

  assert(mlResult.overallScore > webResult.overallScore, 'Data Scientist should score higher on ML JD than Web JD');
  assert(mlResult.matchedSkills.includes('Python'), 'Should match Python');
  assert(mlResult.matchedSkills.includes('PyTorch'), 'Should match PyTorch');
  assert(webResult.missingSkills.includes('React') || webResult.missingSkills.includes('TypeScript'), 'Should identify missing web skills');
});

it('Bare-bones resume with missing sections, contact, and metrics gets heavily penalized', () => {
  const bareResult = AtsEngine.analyzeResume(RESUME_BARE_BONES, JD_SOFTWARE_ENGINEER);
  console.log(`     -> Bare Bones Resume Score: ${bareResult.overallScore}/100`);
  assert(bareResult.overallScore < 30, `Bare bones resume should score < 30, got ${bareResult.overallScore}`);
  assert(bareResult.detectedSections.length <= 2, 'Should detect at most 2 sections');
  assert(bareResult.breakdown.contact.hasPhone === false, 'Should flag missing phone');
  assert(bareResult.breakdown.contact.hasEmail === false, 'Should flag missing email');
  assert(bareResult.suggestions.length >= 3, 'Should generate multiple improvement suggestions');
});

console.log('\n--- 3. DocumentParser Validation & Heuristics Tests ---');

it('DocumentParser validates allowed file extensions correctly', () => {
  assert.strictEqual(DocumentParser.validateFile({ name: 'resume.pdf', size: 1000 }).valid, true);
  assert.strictEqual(DocumentParser.validateFile({ name: 'resume.docx', size: 1000 }).valid, true);
  assert.strictEqual(DocumentParser.validateFile({ name: 'resume.txt', size: 1000 }).valid, true);

  const invalidExt = DocumentParser.validateFile({ name: 'resume.exe', size: 1000 });
  assert.strictEqual(invalidExt.valid, false);
  assert(invalidExt.error.includes('Unsupported file format'));

  const invalidJpg = DocumentParser.validateFile({ name: 'scan.jpg', size: 1000 });
  assert.strictEqual(invalidJpg.valid, false);
});

it('DocumentParser rejects empty (0 byte) and oversized (>10MB) files', () => {
  const emptyFile = DocumentParser.validateFile({ name: 'resume.pdf', size: 0 });
  assert.strictEqual(emptyFile.valid, false);
  assert(emptyFile.error.includes('empty'));

  const hugeFile = DocumentParser.validateFile({ name: 'huge.pdf', size: 15 * 1024 * 1024 });
  assert.strictEqual(hugeFile.valid, false);
  assert(hugeFile.error.includes('10MB limit'));
});

it('DocumentParser formatBytes formats correctly', () => {
  assert.strictEqual(DocumentParser.formatBytes(0), '0 Bytes');
  assert.strictEqual(DocumentParser.formatBytes(1024), '1 KB');
  assert.strictEqual(DocumentParser.formatBytes(1048576), '1 MB');
  assert.strictEqual(DocumentParser.formatBytes(1572864), '1.5 MB');
});

it('DocumentParser detects scanned / image-only PDFs and flags OCR required', async () => {
  // Mock a PDF.js result where a 2-page scanned PDF yields 0 text tokens
  global.window = {
    pdfjsLib: {
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 2,
          getPage: () => Promise.resolve({
            getTextContent: () => Promise.resolve({ items: [] })
          })
        })
      })
    }
  };

  const result = await DocumentParser.extractTextFromPdf(new ArrayBuffer(64));
  assert.strictEqual(result.ocrRequired, true, 'Scanned image PDF must trigger ocrRequired: true');
  assert.strictEqual(result.isScanned, true, 'isScanned must be true');
  assert(result.message.includes('OCR'), 'Message must explain OCR requirement');
  delete global.window;
});

console.log('\n--- 4. Report Generator & Suggestions Tests ---');

it('generateReport compiles a full text report with all 7 criteria and data', () => {
  const analysis = AtsEngine.analyzeResume(RESUME_SENIOR_DEV, JD_SOFTWARE_ENGINEER);
  const report = AtsEngine.generateReport(analysis, 'Alex_Morgan_Resume.pdf');

  assert(report.includes('RESUMEX AI - OFFICIAL ATS COMPLIANCE'), 'Header present');
  assert(report.includes(`SCORE:   ${analysis.overallScore} / 100`), 'Overall score present');
  assert(report.includes('1. Keyword Matching:'), 'Criterion 1 present');
  assert(report.includes('2. Skills Matching:'), 'Criterion 2 present');
  assert(report.includes('3. Experience Relevance:'), 'Criterion 3 present');
  assert(report.includes('4. Education Relevance:'), 'Criterion 4 present');
  assert(report.includes('5. Resume Structure:'), 'Criterion 5 present');
  assert(report.includes('6. Contact Information:'), 'Criterion 6 present');
  assert(report.includes('7. Readability & Format:'), 'Criterion 7 present');
  assert(report.includes('[MATCHED TECHNICAL SKILLS]'), 'Matched skills present');
  assert(report.includes('[ACTIONABLE IMPROVEMENT SUGGESTIONS]'), 'Suggestions present');
});

console.log('\n====================================================');
console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} tests passed successfully!`);
console.log('====================================================');
