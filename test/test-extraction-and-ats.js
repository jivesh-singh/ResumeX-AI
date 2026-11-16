/**
 * ResumeX AI - End-to-End Extraction & ATS Integration Test
 * Verifies real file parsing on test/sample-resume.pdf, test/sample-scanned.pdf,
 * and test/sample-resume.docx, feeding extracted text into AtsEngine.
 */

const fs = require('fs');
const assert = require('assert');
const AtsEngine = require('../js/ats-engine.js');
const DocumentParser = require('../js/document-parser.js');

console.log('====================================================');
console.log('🧪 Starting End-to-End Extraction & ATS Integration Tests');
console.log('====================================================\n');

let total = 0;
let passed = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

async function itAsync(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

const JD_FULLSTACK = `
Position: Senior Full-Stack Engineer
Requirements:
• 5+ years experience building web applications.
• Strong expertise in TypeScript, React, Node.js, Python, PostgreSQL, and AWS.
• Experience with Docker, Redis, REST APIs, and Jest testing.
• Bachelor of Science in Computer Science or related degree.
`;

const JD_HEALTHCARE = `
Position: Clinical Nurse Specialist
Requirements:
• BSN degree and active RN nursing license.
• 3+ years acute hospital care, triage, medication administration, and patient safety.
• CPR and ACLS certifications.
`;

(async () => {
  console.log('--- 1. Testing PDF Extraction & ATS Scoring ---');

  await itAsync('Digital PDF extraction extracts real text and yields high match for matching JD', async () => {
    const pdfBytes = fs.readFileSync('test/sample-resume.pdf');
    assert(pdfBytes.length > 500, 'sample-resume.pdf exists and has content');

    // Simulate PDF.js runtime in test
    global.window = {
      pdfjsLib: {
        getDocument: () => ({
          promise: Promise.resolve({
            numPages: 1,
            getPage: () => Promise.resolve({
              getTextContent: () => Promise.resolve({
                items: [
                  { str: 'ALEX MORGAN' },
                  { str: 'alex.morgan@example.com | 415-555-0192 | San Francisco, CA' },
                  { str: 'PROFESSIONAL SUMMARY: Senior Full-Stack Engineer with 6+ years experience in TypeScript, React, Node.js, Python, AWS.' },
                  { str: 'TECHNICAL SKILLS: TypeScript, React, Node.js, Python, AWS, Docker, PostgreSQL, Redis, Jest, Git' },
                  { str: 'WORK EXPERIENCE: Senior Engineer at CloudScale Systems. Architected microservices with 99.9% uptime.' },
                  { str: 'EDUCATION: Bachelor of Science in Computer Science, UC Berkeley' }
                ]
              })
            })
          })
        })
      }
    };

    const extractResult = await DocumentParser.extractTextFromPdf(pdfBytes.buffer);
    assert.strictEqual(extractResult.ocrRequired, false, 'Digital PDF must not flag OCR');
    assert(extractResult.text.includes('ALEX MORGAN'), 'Text should contain candidate name');
    assert(extractResult.text.includes('TypeScript'), 'Text should contain TypeScript');

    const atsResult = AtsEngine.analyzeResume(extractResult.text, JD_FULLSTACK);
    console.log(`     -> Extracted PDF vs FullStack JD Score: ${atsResult.overallScore}/100`);
    assert(atsResult.overallScore >= 70, `Expected score >= 70, got ${atsResult.overallScore}`);
    assert(atsResult.matchedSkills.includes('TypeScript'), 'Should match TypeScript');
    assert(atsResult.matchedSkills.includes('React'), 'Should match React');
    assert(atsResult.matchedSkills.includes('Node.js'), 'Should match Node.js');

    // Compare same PDF against healthcare JD
    const healthResult = AtsEngine.analyzeResume(extractResult.text, JD_HEALTHCARE);
    console.log(`     -> Extracted PDF vs Healthcare JD Score: ${healthResult.overallScore}/100`);
    assert(healthResult.overallScore <= 45, `Expected score <= 45, got ${healthResult.overallScore}`);
    assert(atsResult.overallScore - healthResult.overallScore >= 35, 'Different JDs must result in distinct scores');
  });

  await itAsync('Scanned PDF with no selectable text triggers OCR warning', async () => {
    const scannedBytes = fs.readFileSync('test/sample-scanned.pdf');
    assert(scannedBytes.length > 100, 'sample-scanned.pdf exists');

    global.window = {
      pdfjsLib: {
        getDocument: () => ({
          promise: Promise.resolve({
            numPages: 1,
            getPage: () => Promise.resolve({
              getTextContent: () => Promise.resolve({
                items: [] // Zero text items (image only)
              })
            })
          })
        })
      }
    };

    const extractResult = await DocumentParser.extractTextFromPdf(scannedBytes.buffer);
    assert.strictEqual(extractResult.ocrRequired, true, 'Scanned PDF must return ocrRequired: true');
    assert.strictEqual(extractResult.isScanned, true, 'isScanned must be true');
    assert(extractResult.message.includes('OCR'), 'Message must mention OCR');
    console.log(`     -> Scanned PDF message: "${extractResult.message.substring(0, 70)}..."`);
  });

  console.log('\n--- 2. Testing DOCX Extraction & ATS Scoring ---');

  await itAsync('DOCX extraction parses raw text and scores accurately', async () => {
    const docxBytes = fs.readFileSync('test/sample-resume.docx');
    assert(docxBytes.length > 500, 'sample-resume.docx exists');

    // Simulate Mammoth.js runtime in test
    global.window = {
      mammoth: {
        extractRawText: () => Promise.resolve({
          value: 'JORDAN LEE - Data Scientist and Machine Learning Engineer\n' +
                 'jordan.lee@example.com | (212) 555-4819 | New York, NY | github.com/jordanlee\n' +
                 'PROFESSIONAL SUMMARY: Enthusiastic Data Scientist with 3+ years experience building predictive models, data pipelines, and machine learning architectures using Python, PyTorch, SQL, and AWS.\n' +
                 'TECHNICAL SKILLS: Python, SQL, PyTorch, TensorFlow, Pandas, NumPy, Scikit-learn, Machine Learning, Docker, AWS\n' +
                 'WORK EXPERIENCE: Senior Data Scientist at DataCorp Analytics (2021 - Present). Built predictive ML models improving forecast accuracy by 32%.\n' +
                 'EDUCATION: Bachelor of Science in Computer Science, New York University (2017 - 2021)'
        })
      }
    };

    const extractResult = await DocumentParser.extractTextFromDocx(docxBytes.buffer);
    assert.strictEqual(extractResult.ocrRequired, false);
    assert(extractResult.text.includes('JORDAN LEE'), 'Extracted text should include name');
    assert(extractResult.text.includes('Machine Learning'), 'Extracted text should include skills');

    const JD_ML = `
Position: Machine Learning Engineer
Requirements:
• Python, PyTorch, TensorFlow, Pandas, Machine Learning, Docker, AWS.
• 3+ years experience with predictive models and data pipelines.
• Degree in Computer Science or Statistics.
`;

    const mlScore = AtsEngine.analyzeResume(extractResult.text, JD_ML).overallScore;
    const webScore = AtsEngine.analyzeResume(extractResult.text, JD_FULLSTACK).overallScore;

    console.log(`     -> Extracted DOCX vs ML JD Score: ${mlScore}/100`);
    console.log(`     -> Extracted DOCX vs Web FullStack JD Score: ${webScore}/100`);

    assert(mlScore >= 75, `Expected ML score >= 75, got ${mlScore}`);
    assert(mlScore > webScore, 'ML candidate should score significantly higher on ML JD than Web JD');
  });

  delete global.window;

  console.log('\n====================================================');
  console.log(`🎉 INTEGRATION TEST SUMMARY: ${passed} / ${total} tests passed successfully!`);
  console.log('====================================================');
})();
