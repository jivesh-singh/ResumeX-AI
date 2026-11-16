const fs = require('fs');

function createPdfWithText(textLines) {
  let streamContent = 'BT\n/F1 12 Tf\n72 720 Td\n';
  textLines.forEach((line, i) => {
    // Escape parentheses for PDF text strings
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    if (i === 0) {
      streamContent += `(${escaped}) Tj\n`;
    } else {
      streamContent += `0 -20 Td\n(${escaped}) Tj\n`;
    }
  });
  streamContent += 'ET\n';

  const streamBytes = Buffer.from(streamContent, 'utf8');

  let body = '%PDF-1.4\n';
  const offsets = [];

  // obj 1: Catalog
  offsets.push(Buffer.byteLength(body, 'utf8'));
  body += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // obj 2: Pages
  offsets.push(Buffer.byteLength(body, 'utf8'));
  body += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  // obj 3: Page
  offsets.push(Buffer.byteLength(body, 'utf8'));
  body += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  // obj 4: Contents stream
  offsets.push(Buffer.byteLength(body, 'utf8'));
  body += `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  // obj 5: Font
  offsets.push(Buffer.byteLength(body, 'utf8'));
  body += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  // xref table
  const startXref = Buffer.byteLength(body, 'utf8');
  body += 'xref\n0 6\n0000000000 65535 f \n';
  offsets.forEach(offset => {
    body += String(offset).padStart(10, '0') + ' 00000 n \n';
  });

  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(body, 'utf8');
}

// 1. Digital PDF with readable text
const resumeLines = [
  'ALEX MORGAN',
  'alex.morgan@example.com | 415-555-0192 | San Francisco, CA | github.com/alexmorgan',
  'PROFESSIONAL SUMMARY',
  'Senior Full-Stack Engineer with 6+ years experience in TypeScript, React, Node.js, Python, AWS.',
  'TECHNICAL SKILLS: TypeScript, JavaScript, React, Next.js, Node.js, Python, AWS, Docker, PostgreSQL, Redis, Jest',
  'WORK EXPERIENCE: Senior Engineer at CloudScale Systems. Architected microservices with 99.9% uptime.',
  'EDUCATION: Bachelor of Science in Computer Science, University of California, Berkeley'
];

const resumePdfBuffer = createPdfWithText(resumeLines);
fs.writeFileSync('test/sample-resume.pdf', resumePdfBuffer);
console.log('Successfully created test/sample-resume.pdf (' + resumePdfBuffer.length + ' bytes)');

// 2. Scanned / image-only PDF with 0 extractable text stream
const scannedPdfBuffer = createPdfWithText(['']); // Empty text
fs.writeFileSync('test/sample-scanned.pdf', scannedPdfBuffer);
console.log('Successfully created test/sample-scanned.pdf (' + scannedPdfBuffer.length + ' bytes)');
