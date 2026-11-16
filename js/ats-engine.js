/**
 * ResumeX AI - Deterministic ATS Scoring & Analysis Engine
 * Calculates exact ATS score out of 100 with 7 explicit criteria:
 * 1. Keyword matching: 30 pts
 * 2. Skills matching: 25 pts
 * 3. Experience relevance: 15 pts
 * 4. Education relevance: 10 pts
 * 5. Resume structure: 10 pts
 * 6. Contact information: 5 pts
 * 7. Readability: 5 pts
 * Total: 100 points
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AtsEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Comprehensive Technical & Domain Skills Dictionary
  const SKILLS_DICTIONARY = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby',
    'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'R', 'Scala',
    'Dart', 'Bash', 'Shell', 'PowerShell', 'Perl',

    // Frontend
    'React', 'React.js', 'Next.js', 'Vue', 'Vue.js', 'Nuxt.js', 'Angular', 'Svelte', 'SvelteKit',
    'TailwindCSS', 'Tailwind', 'Bootstrap', 'Redux', 'Zustand', 'MobX', 'Webpack', 'Vite',
    'Three.js', 'WebGL', 'HTML5 Canvas', 'Responsive Design', 'Material UI',

    // Backend & APIs
    'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'FastAPI', 'Flask', 'Spring Boot',
    'Spring', 'ASP.NET', '.NET', 'Ruby on Rails', 'GraphQL', 'REST', 'RESTful APIs', 'REST APIs',
    'gRPC', 'Microservices', 'WebSockets', 'Kafka', 'RabbitMQ',

    // Databases & Caches
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'DynamoDB',
    'Cassandra', 'Snowflake', 'BigQuery', 'Firebase', 'Supabase', 'Prisma', 'TypeORM',

    // Cloud & DevOps
    'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes',
    'Terraform', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'Linux', 'Nginx',
    'Ansible', 'Helm', 'CloudFormation', 'Serverless', 'Lambda',

    // Testing & Quality
    'Jest', 'Cypress', 'Playwright', 'Mocha', 'Chai', 'PyTest', 'JUnit', 'Selenium',
    'TDD', 'Test-Driven Development', 'Unit Testing', 'Integration Testing',

    // Architecture & Concepts
    'System Design', 'System Architecture', 'Agile', 'Scrum', 'OOP', 'Object-Oriented Programming',
    'Design Patterns', 'Event-Driven Architecture', 'Distributed Systems', 'Performance Optimization',
    'Data Structures', 'Algorithms', 'Security', 'Authentication', 'OAuth', 'JWT',

    // AI & Data
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas',
    'NumPy', 'Computer Vision', 'NLP', 'Natural Language Processing', 'Data Analysis', 'LLM',
    'Generative AI'
  ];

  // Stop words to exclude from keyword extraction
  const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
    'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down',
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t',
    'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t',
    'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'must', 'mustn\'t', 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 'same', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
    'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
    'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through',
    'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve',
    'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who',
    'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
    'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
    // Generic job posting boilerplate
    'role', 'position', 'job', 'description', 'responsibilities', 'qualifications', 'requirements',
    'candidate', 'team', 'company', 'looking', 'work', 'working', 'ability', 'experience', 'years',
    'skills', 'opportunity', 'plus', 'preferred', 'must', 'required', 'ideal', 'join', 'help', 'drive',
    'strong', 'active', 'response', 'unit', 'daily', 'level', 'high', 'good', 'great', 'capabilities',
    'building', 'across', 'using', 'leading', 'solid', 'hands-on', 'degree', 'bachelor', 'science', 'master'
  ]);

  /**
   * Helper: Escape string for RegExp
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Helper: Word boundary regex matching (handling words with +, #, ., etc.)
   */
  function matchWord(text, word) {
    const escaped = escapeRegExp(word);
    // If word contains symbols like C++, C#, .NET, boundary might fail, so use lookaround or non-alphanumeric boundary
    const pattern = `(?:^|[^a-zA-Z0-9_])${escaped}(?:$|[^a-zA-Z0-9_])`;
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  }

  /**
   * 1. KEYWORD EXTRACTION & MATCHING (30 Points)
   * Extracts domain keywords and key phrases from Job Description,
   * matches them against resume text.
   */
  function evaluateKeywordMatching(resumeText, jobDesc) {
    const lowerJd = jobDesc.toLowerCase();
    const lowerResume = resumeText.toLowerCase();

    // Multi-word phrases of interest
    const candidatePhrases = [
      'ci/cd', 'rest api', 'restful api', 'system design', 'unit testing',
      'integration testing', 'code review', 'agile development', 'scrum master',
      'cross-functional', 'microservices architecture', 'cloud architecture',
      'test-driven development', 'version control', 'object-oriented',
      'problem solving', 'performance optimization', 'distributed systems',
      'continuous integration', 'continuous deployment', 'user experience',
      'data pipeline', 'technical leadership', 'product roadmap'
    ];

    const jdKeywordsSet = new Set();

    // Check multi-word phrases in JD
    candidatePhrases.forEach(phrase => {
      if (lowerJd.includes(phrase)) {
        jdKeywordsSet.add(phrase);
      }
    });

    // Extract significant unigrams from JD
    const tokens = jobDesc
      .replace(/[^a-zA-Z0-9+#.-]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 2 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));

    // Frequency analysis on tokens
    const freqMap = {};
    tokens.forEach(token => {
      freqMap[token] = (freqMap[token] || 0) + 1;
    });

    // Pick top frequency keywords (up to 15 top words)
    const sortedTokens = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
    sortedTokens.slice(0, 18).forEach(token => jdKeywordsSet.add(token));

    const allJdKeywords = Array.from(jdKeywordsSet);
    const matchedKeywords = [];
    const missingKeywords = [];

    allJdKeywords.forEach(kw => {
      if (matchWord(lowerResume, kw) || lowerResume.includes(kw)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const totalKeywords = allJdKeywords.length;
    let score = 0;
    if (totalKeywords > 0) {
      const ratio = matchedKeywords.length / totalKeywords;
      score = Math.round(ratio * 30);
    } else {
      score = 20; // fallback if JD had no keywords
    }

    score = Math.min(Math.max(score, 0), 30);

    return {
      score: score,
      maxScore: 30,
      matched: matchedKeywords,
      missing: missingKeywords,
      totalCount: totalKeywords,
      matchedCount: matchedKeywords.length,
      missingCount: missingKeywords.length,
      ratio: totalKeywords > 0 ? (matchedKeywords.length / totalKeywords) : 0
    };
  }

  /**
   * 2. SKILLS MATCHING (25 Points)
   * Matches explicit technical and tooling skills from dictionary present in JD against resume.
   */
  function evaluateSkillsMatching(resumeText, jobDesc) {
    const lowerJd = jobDesc.toLowerCase();
    const lowerResume = resumeText.toLowerCase();

    // Find all skills mentioned in the Job Description
    const jdSkills = [];
    SKILLS_DICTIONARY.forEach(skill => {
      if (matchWord(lowerJd, skill)) {
        jdSkills.push(skill);
      }
    });

    // Deduplicate case-insensitively
    const uniqueJdSkills = [];
    const seen = new Set();
    jdSkills.forEach(s => {
      const lower = s.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueJdSkills.push(s);
      }
    });

    // If JD is from a domain outside the tech dictionary (e.g. Healthcare, Finance),
    // extract domain requirements and specialized acronyms from the JD
    let targetSkills = uniqueJdSkills;
    if (targetSkills.length === 0) {
      const domainTerms = extractDomainCompetenciesFromJd(jobDesc);
      targetSkills = domainTerms.length > 0 ? domainTerms : ['Domain Knowledge', 'Core Requirements'];
    }

    const matchedSkills = [];
    const missingSkills = [];

    targetSkills.forEach(skill => {
      if (matchWord(lowerResume, skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const totalSkills = targetSkills.length;
    let score = 0;
    if (totalSkills > 0) {
      const ratio = matchedSkills.length / totalSkills;
      score = Math.round(ratio * 25);
    }

    score = Math.min(Math.max(score, 0), 25);

    return {
      score: score,
      maxScore: 25,
      matched: matchedSkills,
      missing: missingSkills,
      totalCount: totalSkills,
      matchedCount: matchedSkills.length,
      missingCount: missingSkills.length,
      ratio: totalSkills > 0 ? (matchedSkills.length / totalSkills) : 0
    };
  }

  /**
   * Helper: Extracts domain competencies or specialized qualifications from non-tech JDs
   */
  function extractDomainCompetenciesFromJd(jobDesc) {
    const competencies = new Set();

    // 1. Acronyms & certifications (e.g., RN, ICU, BSN, CPR, ACLS, EHR, CPA, PMP)
    const acronyms = jobDesc.match(/\b[A-Z]{2,6}\b/g) || [];
    acronyms.forEach(acr => {
      if (!['THE', 'FOR', 'AND', 'WITH', 'FROM', 'THIS', 'THAT'].includes(acr)) {
        competencies.add(acr);
      }
    });

    // 2. Specific qualification terms from bullet points
    const lines = jobDesc.split('\n');
    lines.forEach(line => {
      const match = line.match(/(?:experience in|expertise in|skills in|knowledge of|proficient in)\s+([a-zA-Z\s,]+)/i);
      if (match) {
        match[1].split(',').forEach(term => {
          const clean = term.trim();
          if (clean.length > 2 && clean.length < 30) {
            competencies.add(clean);
          }
        });
      }
    });

    return Array.from(competencies).slice(0, 10);
  }

  /**
   * 3. EXPERIENCE RELEVANCE (15 Points)
   * Analyzes years of experience requested vs candidate history,
   * career depth, domain relevance, and quantified achievements.
   */
  function evaluateExperienceRelevance(resumeText, jobDesc) {
    const lowerResume = resumeText.toLowerCase();
    const lowerJd = jobDesc.toLowerCase();

    // Check domain overlap between JD and Resume
    const jdKeywords = jobDesc
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));
    
    const uniqueJdWords = Array.from(new Set(jdKeywords));
    let domainOverlap = 0;
    uniqueJdWords.forEach(w => {
      if (lowerResume.includes(w)) domainOverlap++;
    });
    const domainOverlapRatio = uniqueJdWords.length > 0 ? (domainOverlap / uniqueJdWords.length) : 0;
    const isDomainRelated = domainOverlapRatio >= 0.15; // At least 15% domain keyword presence

    // 1. Detect required years in JD
    const jdYearsMatch = jobDesc.match(/(\d+)\+?\s*(?:to\s*\d+\s*)?years?(?:\s*of)?(?:\s*experience)?/i);
    const requiredYears = jdYearsMatch ? parseInt(jdYearsMatch[1], 10) : 3;

    // 2. Detect candidate years mentioned
    const resumeYearsMatch = resumeText.match(/(\d+)\+?\s*years?(?:\s*of)?\s*(?:relevant|software|professional|industry)?\s*experience/i);
    let candidateYears = resumeYearsMatch ? parseInt(resumeYearsMatch[1], 10) : 0;

    // Detect year date ranges (e.g., 2019 - 2023, 2021 - Present)
    const yearMatches = resumeText.match(/(?:20\d{2}|19\d{2})\s*(?:-|–|to)\s*(?:20\d{2}|19\d{2}|present|current)/gi) || [];
    if (!candidateYears && yearMatches.length > 0) {
      candidateYears = Math.min(yearMatches.length * 2, 10);
    }

    // 3. Detect distinct job roles or position markers
    const roleHeaders = resumeText.match(/(?:Senior|Lead|Junior|Staff|Principal|Software|Frontend|Backend|Full[\s-]Stack|Engineer|Developer|Architect|Manager|Consultant|Intern)\b/gi) || [];
    const distinctRoles = Math.min(roleHeaders.length, 6);

    // 4. Detect quantified impact metrics (numbers with %, $, or magnitude)
    const metricsMatches = resumeText.match(/(?:\d+%\s*(?:increase|reduction|growth|boost|faster|improvement)?|\$\d+[\d,.]*(?:[kKmMbB])?|\b\d+(?:x|\+)\b|\b\d+(?:k|M)\b\s*users)/gi) || [];
    const metricsCount = metricsMatches.length;

    // If completely unrelated domain (e.g. Software Engineer applying to Nurse job), cap experience points
    if (!isDomainRelated) {
      return {
        score: 3,
        maxScore: 15,
        requiredYears: requiredYears,
        candidateYears: candidateYears,
        metricsCount: metricsCount,
        distinctRoles: distinctRoles,
        domainRelated: false
      };
    }

    // Points calculation:
    // a) Tenure alignment: up to 6 pts
    let tenurePoints = 0;
    if (candidateYears >= requiredYears) {
      tenurePoints = 6;
    } else if (candidateYears >= requiredYears - 1) {
      tenurePoints = 4;
    } else if (candidateYears > 0) {
      tenurePoints = 2;
    } else {
      tenurePoints = 3;
    }

    // b) Role depth: up to 4 pts
    let rolePoints = 0;
    if (distinctRoles >= 3) rolePoints = 4;
    else if (distinctRoles >= 1) rolePoints = 3;
    else rolePoints = 1;

    // c) Quantified achievements: up to 5 pts
    let impactPoints = 0;
    if (metricsCount >= 3) impactPoints = 5;
    else if (metricsCount >= 2) impactPoints = 4;
    else if (metricsCount === 1) impactPoints = 2;
    else impactPoints = 1;

    const totalScore = Math.min(tenurePoints + rolePoints + impactPoints, 15);

    return {
      score: totalScore,
      maxScore: 15,
      requiredYears: requiredYears,
      candidateYears: candidateYears,
      metricsCount: metricsCount,
      distinctRoles: distinctRoles,
      domainRelated: true
    };
  }

  /**
   * 4. EDUCATION RELEVANCE (10 Points)
   * Detects degree requirements in JD and checks resume academic background.
   */
  function evaluateEducationRelevance(resumeText, jobDesc) {
    const lowerResume = resumeText.toLowerCase();
    const lowerJd = jobDesc.toLowerCase();

    // Check degree levels in resume
    const hasPhd = /\b(ph\.?d|doctorate)\b/i.test(lowerResume);
    const hasMasters = /\b(master'?s|ms|m\.s\.|mba|m\.tech)\b/i.test(lowerResume);
    const hasBachelors = /\b(bachelor'?s|bs|b\.s\.|ba|b\.a\.|b\.tech|b\.e\.|undergraduate)\b/i.test(lowerResume);
    const hasBootcampOrCert = /\b(bootcamp|associate|certification|certified|diploma)\b/i.test(lowerResume);

    // Check specific disciplines in JD
    const jdSpecificFieldMatch = lowerJd.match(/\b(nursing|nurse|bsn|medical|clinical|accounting|finance|law|legal|paralegal)\b/);
    if (jdSpecificFieldMatch) {
      const requiredField = jdSpecificFieldMatch[1];
      const resumeHasRequiredField = lowerResume.includes(requiredField) || (requiredField === 'bsn' && lowerResume.includes('nursing'));
      if (!resumeHasRequiredField) {
        // Candidate has a degree, but in an unrelated / non-qualifying discipline
        return {
          score: hasBachelors || hasMasters || hasPhd ? 3 : 1,
          maxScore: 10,
          degreeDetected: hasBachelors || hasMasters ? 'Degree in Unrelated Field' : 'Not detected',
          stemMajor: false,
          jdRequiresDegree: true
        };
      }
    }

    // Check relevant STEM majors
    const hasStemMajor = /\b(computer science|software engineering|information technology|computer engineering|data science|mathematics|electrical engineering|statistics)\b/i.test(lowerResume);
    const jdRequiresDegree = /\b(bachelor|master|degree in|bs|ms)\b/i.test(lowerJd);

    let score = 0;
    if (hasPhd || hasMasters || hasBachelors) {
      score = 7;
      if (hasStemMajor) score += 3;
      else score += 1;
    } else if (hasBootcampOrCert) {
      score = jdRequiresDegree ? 5 : 7;
    } else if (/education|university|college|school/i.test(lowerResume)) {
      score = 5;
    } else {
      score = 2;
    }

    score = Math.min(Math.max(score, 0), 10);

    let degreeDetected = 'Not detected';
    if (hasPhd) degreeDetected = "Ph.D. / Doctorate";
    else if (hasMasters) degreeDetected = "Master's Degree";
    else if (hasBachelors) degreeDetected = "Bachelor's Degree";
    else if (hasBootcampOrCert) degreeDetected = "Bootcamp / Associate / Certification";

    return {
      score: score,
      maxScore: 10,
      degreeDetected: degreeDetected,
      stemMajor: hasStemMajor,
      jdRequiresDegree: jdRequiresDegree
    };
  }

  /**
   * 5. RESUME STRUCTURE & SECTIONS (10 Points)
   * Validates standard ATS recognized section headers (2 pts each, max 10).
   */
  function evaluateResumeStructure(resumeText) {
    const lower = resumeText.toLowerCase();

    const sections = [
      { name: 'Contact Header', regex: /(?:email|phone|github|linkedin|contact|\.com)/i },
      { name: 'Summary / Profile', regex: /(?:summary|profile|about me|objective|executive summary)/i },
      { name: 'Experience / History', regex: /(?:experience|work history|employment|career history|professional experience)/i },
      { name: 'Skills / Competencies', regex: /(?:skills|technical skills|competencies|technologies|core competencies|tools)/i },
      { name: 'Education / Credentials', regex: /(?:education|academic|university|degree|certifications)/i }
    ];

    const detected = [];
    const missing = [];

    sections.forEach(sec => {
      if (sec.regex.test(lower)) {
        detected.push(sec.name);
      } else {
        missing.push(sec.name);
      }
    });

    const score = detected.length * 2; // 2 points per section up to 10

    return {
      score: score,
      maxScore: 10,
      detectedSections: detected,
      missingSections: missing
    };
  }

  /**
   * 6. CONTACT INFORMATION (5 Points)
   * Validates presence of email (2 pts), phone (1 pt), location (1 pt), and links (1 pt).
   */
  function evaluateContactInfo(resumeText) {
    // Email regex
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    // Phone regex
    const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    // Location regex
    const locationMatch = resumeText.match(/\b[A-Z][a-zA-Z\s.-]+,\s*[A-Z]{2}\b|\b(?:San Francisco|New York|London|Seattle|Austin|Toronto|Berlin|Bangalore|Chicago|Boston|Remote|CA|NY|TX|WA|IL|MA)\b/i);
    // Portfolio / LinkedIn / GitHub
    const linkMatch = resumeText.match(/(?:linkedin\.com\/in\/|github\.com\/|[a-zA-Z0-9.-]+\.(?:dev|io|me|com))/i);

    let score = 0;
    if (emailMatch) score += 2;
    if (phoneMatch) score += 1;
    if (locationMatch) score += 1;
    if (linkMatch) score += 1;

    score = Math.min(Math.max(score, 0), 5);

    return {
      score: score,
      maxScore: 5,
      hasEmail: !!emailMatch,
      hasPhone: !!phoneMatch,
      hasLocation: !!locationMatch,
      hasLinks: !!linkMatch,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null
    };
  }

  /**
   * 7. READABILITY & FORMATTING (5 Points)
   * Evaluates word count (2 pts), bullet structure (2 pts), and text density (1 pt).
   */
  function evaluateReadability(resumeText) {
    const words = resumeText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Bullets check
    const bulletMatches = resumeText.match(/[•\-\*]\s+[A-Z]/g) || [];
    const hasBullets = bulletMatches.length >= 3;

    // Sentence/bullet lengths check (detect run-ons > 60 words without punctuation)
    const lines = resumeText.split('\n').filter(l => l.trim().length > 0);
    let runOnCount = 0;
    lines.forEach(line => {
      const lineWords = line.trim().split(/\s+/).length;
      if (lineWords > 55) runOnCount++;
    });

    let score = 0;

    // Word count in healthy range: 2 pts for 300-1500, 1 pt for 150-2500
    if (wordCount >= 300 && wordCount <= 1500) {
      score += 2;
    } else if (wordCount >= 150 && wordCount <= 2500) {
      score += 1;
    }

    // Bullet points present: 2 pts
    if (hasBullets) {
      score += 2;
    } else if (bulletMatches.length > 0) {
      score += 1;
    }

    // Low run-on count: 1 pt
    if (runOnCount <= 1 && wordCount >= 50) {
      score += 1;
    }

    score = Math.min(Math.max(score, 0), 5);

    return {
      score: score,
      maxScore: 5,
      wordCount: wordCount,
      hasBullets: hasBullets,
      bulletCount: bulletMatches.length
    };
  }

  /**
   * Generates prioritized, actionable improvement recommendations
   */
  function generateSuggestions(breakdown) {
    const suggestions = [];

    // 1. Missing Skills Suggestions
    if (breakdown.skills.missing.length > 0) {
      const topSkills = breakdown.skills.missing.slice(0, 5).join(', ');
      suggestions.push({
        category: 'Technical Skills',
        icon: 'fa-microchip',
        title: `Incorporate High-Priority Missing Skills (${topSkills})`,
        description: `Your target job posting explicitly requires these competencies. Add them to your Technical Skills section and weave them into relevant project bullet points.`
      });
    }

    // 2. Missing Keywords Suggestions
    if (breakdown.keywords.missing.length > 0) {
      const topKeywords = breakdown.keywords.missing.slice(0, 4).join(', ');
      suggestions.push({
        category: 'Keyword Optimization',
        icon: 'fa-crosshairs',
        title: `Align Domain Keywords: ${topKeywords}`,
        description: `ATS keyword scanners prioritize candidates with exact terminology matches. Naturally incorporate these phrases into your work history descriptions.`
      });
    }

    // 3. Structure / Missing Sections
    if (breakdown.structure.missingSections.length > 0) {
      const missingList = breakdown.structure.missingSections.join(' and ');
      suggestions.push({
        category: 'Resume Structure',
        icon: 'fa-folder-tree',
        title: `Add Standard ATS Section: ${missingList}`,
        description: `Applicant Tracking Systems look for standard headings. Create clear, standalone headers for ${missingList} to prevent parsing failures.`
      });
    }

    // 4. Quantified Metrics
    if (breakdown.experience.metricsCount < 3) {
      suggestions.push({
        category: 'Impact Phrasing',
        icon: 'fa-chart-line',
        title: 'Quantify Accomplishments with Specific Numerical Metrics',
        description: 'Only ' + breakdown.experience.metricsCount + ' quantified metric(s) were detected. Frame bullet points using numbers (e.g., "reduced latency by 45%", "led a team of 6 engineers", "served 2M+ users").'
      });
    }

    // 5. Contact Info
    if (!breakdown.contact.hasPhone || !breakdown.contact.hasLocation) {
      const missingContact = [];
      if (!breakdown.contact.hasPhone) missingContact.push('phone number');
      if (!breakdown.contact.hasLocation) missingContact.push('city/location');
      suggestions.push({
        category: 'Contact Info',
        icon: 'fa-address-card',
        title: `Add Missing Contact Detail: ${missingContact.join(' and ')}`,
        description: 'Ensure recruiters can immediately identify your location and contact you directly without needing to search your profiles.'
      });
    }

    // 6. Action Verbs & Readability
    if (breakdown.readability.score < 4) {
      suggestions.push({
        category: 'Readability',
        icon: 'fa-list-check',
        title: 'Use Bullet Points with Action Verbs',
        description: 'Format your experience into concise bullet points (15-25 words each) beginning with strong action verbs (e.g., "Architected", "Spearheaded", "Streamlined").'
      });
    }

    return suggestions;
  }

  /**
   * Main Analysis Function
   * Computes the deterministic 100-point ATS Score and comprehensive breakdown
   * @param {string} resumeText
   * @param {string} jobDescription
   * @returns {Object} Comprehensive ATS Analysis
   */
  function analyzeResume(resumeText, jobDescription) {
    if (!resumeText || resumeText.trim().length < 10) {
      throw new Error('Resume text is empty or too short for ATS evaluation.');
    }
    if (!jobDescription || jobDescription.trim().length < 15) {
      throw new Error('Job description is required to perform ATS matching.');
    }

    const keywords = evaluateKeywordMatching(resumeText, jobDescription);
    const skills = evaluateSkillsMatching(resumeText, jobDescription);
    const experience = evaluateExperienceRelevance(resumeText, jobDescription);
    const education = evaluateEducationRelevance(resumeText, jobDescription);
    const structure = evaluateResumeStructure(resumeText);
    const contact = evaluateContactInfo(resumeText);
    const readability = evaluateReadability(resumeText);

    // Deterministic overall score calculation
    // 30 + 25 + 15 + 10 + 10 + 5 + 5 = 100
    const rawTotal = keywords.score +
                     skills.score +
                     experience.score +
                     education.score +
                     structure.score +
                     contact.score +
                     readability.score;

    const overallScore = Math.min(Math.max(Math.round(rawTotal), 0), 100);

    let verdict = 'Needs Optimization';
    let verdictColor = '#ef4444';
    if (overallScore >= 85) {
      verdict = 'Excellent ATS Compatibility';
      verdictColor = '#10b981';
    } else if (overallScore >= 70) {
      verdict = 'Competitive Match — Minor Gaps';
      verdictColor = '#4f46e5';
    } else if (overallScore >= 50) {
      verdict = 'Moderate Match — Skills Missing';
      verdictColor = '#f59e0b';
    }

    const breakdown = {
      overallScore: overallScore,
      verdict: verdict,
      verdictColor: verdictColor,
      keywords: keywords,
      skills: skills,
      experience: experience,
      education: education,
      structure: structure,
      contact: contact,
      readability: readability
    };

    const suggestions = generateSuggestions(breakdown);

    return {
      overallScore: overallScore,
      verdict: verdict,
      verdictColor: verdictColor,
      scores: {
        keywords: keywords.score,
        skills: skills.score,
        experience: experience.score,
        education: education.score,
        structure: structure.score,
        contact: contact.score,
        readability: readability.score,
        total: overallScore
      },
      maxScores: {
        keywords: 30,
        skills: 25,
        experience: 15,
        education: 10,
        structure: 10,
        contact: 5,
        readability: 5,
        total: 100
      },
      breakdown: breakdown,
      matchedKeywords: keywords.matched,
      missingKeywords: keywords.missing,
      matchedSkills: skills.matched,
      missingSkills: skills.missing,
      detectedSections: structure.detectedSections,
      missingSections: structure.missingSections,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Formats a complete text report for download
   */
  function generateReport(analysis, documentName = 'Resume.pdf') {
    const divider = '='.repeat(68);
    const subDivider = '-'.repeat(68);

    return `${divider}
RESUMEX AI - OFFICIAL ATS COMPLIANCE & DIAGNOSTIC REPORT
Generated: ${new Date().toLocaleString()}
Document:  ${documentName}
${divider}

[OVERALL ATS COMPLIANCE SCORE]
SCORE:   ${analysis.overallScore} / 100
STATUS:  ${analysis.verdict}

${subDivider}
[DETAILED SCORE BREAKDOWN (100 POINTS MAXIMUM)]
${subDivider}
1. Keyword Matching:       ${analysis.scores.keywords.toString().padStart(2)} / 30 pts  (${analysis.matchedKeywords.length} matched, ${analysis.missingKeywords.length} missing)
2. Skills Matching:        ${analysis.scores.skills.toString().padStart(2)} / 25 pts  (${analysis.matchedSkills.length} matched, ${analysis.missingSkills.length} missing)
3. Experience Relevance:   ${analysis.scores.experience.toString().padStart(2)} / 15 pts  (${analysis.breakdown.experience.metricsCount} metrics detected)
4. Education Relevance:    ${analysis.scores.education.toString().padStart(2)} / 10 pts  (${analysis.breakdown.education.degreeDetected})
5. Resume Structure:       ${analysis.scores.structure.toString().padStart(2)} / 10 pts  (${analysis.detectedSections.length} sections verified)
6. Contact Information:    ${analysis.scores.contact.toString().padStart(2)} /  5 pts  (Email: ${analysis.breakdown.contact.hasEmail ? 'Yes' : 'No'}, Phone: ${analysis.breakdown.contact.hasPhone ? 'Yes' : 'No'})
7. Readability & Format:   ${analysis.scores.readability.toString().padStart(2)} /  5 pts  (${analysis.breakdown.readability.wordCount} words)
--------------------------------------------------------------------
TOTAL ATS COMPATIBILITY:   ${analysis.overallScore.toString().padStart(2)} / 100 pts

${subDivider}
[MATCHED TECHNICAL SKILLS]
${subDivider}
${analysis.matchedSkills.length > 0 ? analysis.matchedSkills.join(', ') : 'None detected'}

${subDivider}
[MISSING TECHNICAL SKILLS (SKILL GAP)]
${subDivider}
${analysis.missingSkills.length > 0 ? analysis.missingSkills.join(', ') : 'None (All target skills covered!)'}

${subDivider}
[MATCHED DOMAIN KEYWORDS]
${subDivider}
${analysis.matchedKeywords.length > 0 ? analysis.matchedKeywords.join(', ') : 'None detected'}

${subDivider}
[MISSING DOMAIN KEYWORDS]
${subDivider}
${analysis.missingKeywords.length > 0 ? analysis.missingKeywords.join(', ') : 'None'}

${subDivider}
[DETECTED RESUME SECTIONS]
${subDivider}
• Detected: ${analysis.detectedSections.join(', ')}
• Missing:  ${analysis.missingSections.length > 0 ? analysis.missingSections.join(', ') : 'None (Full standard structure)'}

${subDivider}
[ACTIONABLE IMPROVEMENT SUGGESTIONS]
${subDivider}
${analysis.suggestions.map((s, i) => `${i + 1}. [${s.category}] ${s.title}\n   ${s.description}`).join('\n\n')}

${divider}
Engine: ResumeX AI Deterministic Analyzer (Client-side Privacy Protected)
No resume data was transmitted to external servers.
${divider}`;
  }

  return {
    analyzeResume: analyzeResume,
    generateReport: generateReport,
    SKILLS_DICTIONARY: SKILLS_DICTIONARY
  };
});
