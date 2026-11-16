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

    // Evaluate Perfect Job Match & Actionable Career Transition Roadmap
    const careerFit = evaluateCareerFit(resumeText, jobDescription, breakdown);

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
      careerFit: careerFit,
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // CAREER ADVISOR & JOB MATCHING SYSTEM
  // ==========================================================================

  const ROLE_ARCHETYPES = [
    {
      id: 'fullstack',
      baseTitle: 'Full-Stack Software Engineer',
      domainKeywords: ['full stack', 'fullstack', 'software engineer', 'web application', 'end to end'],
      coreSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'PostgreSQL', 'HTML', 'CSS', 'REST APIs', 'Git', 'Docker'],
      marketDemand: 'Very High Demand — Top 3 hiring technical domain in 2026',
      typicalSalaryRange: '$120,000 – $170,000 USD / yr',
      summary: 'Your profile demonstrates end-to-end fluency across modern frontend interfaces, resilient backend API services, and relational databases.',
      projectBlueprint: {
        name: 'Enterprise Multi-Tenant SaaS Workspace',
        concept: 'A full-stack collaboration platform featuring real-time state synchronization, role-based access control (RBAC), and containerized microservices.',
        techStack: ['React / TypeScript', 'Node.js / Express', 'PostgreSQL', 'Prisma', 'Docker', 'Redis', 'GitHub Actions'],
        deliverables: [
          'Live interactive application with responsive UI and sub-100ms API responses.',
          'Comprehensive GitHub repository with unit/integration tests and CI/CD automated deployment.',
          'Well-documented RESTful API schema with Swagger / OpenAPI specifications.'
        ]
      },
      interviewTopics: [
        { topic: 'System Design: Scalable URL Shortener / Real-time Feed', tips: 'Detail database indexing, Redis caching strategies, and horizontal scaling vs vertical scaling.' },
        { topic: 'Full-Stack Security & State Management', tips: 'Explain JWT vs session cookies, CSRF/XSS mitigation, and optimistic UI updates.' }
      ]
    },
    {
      id: 'frontend',
      baseTitle: 'Frontend Architect & UI Engineer',
      domainKeywords: ['frontend', 'front end', 'ui engineer', 'ux', 'web developer', 'react developer'],
      coreSkills: ['React', 'Next.js', 'Vue', 'TypeScript', 'JavaScript', 'TailwindCSS', 'CSS3', 'HTML5', 'Redux', 'Three.js', 'Vite', 'Responsive Design'],
      marketDemand: 'High Demand — Essential for customer-facing digital applications',
      typicalSalaryRange: '$115,000 – $165,000 USD / yr',
      summary: 'You specialize in high-performance browser experiences, component architecture, responsive design systems, and client-side state management.',
      projectBlueprint: {
        name: 'High-Performance 3D Analytics & Dashboard Suite',
        concept: 'An interactive operations dashboard combining Three.js 3D data visualization, virtualized tables, and real-time WebSocket feeds.',
        techStack: ['Next.js', 'TypeScript', 'TailwindCSS', 'Three.js', 'Chart.js / D3.js', 'WebSockets'],
        deliverables: [
          'Lighthouse 95+ score across Performance, Accessibility, and Best Practices.',
          'Clean atomic design component library documented via Storybook.',
          'Zero-jank animations and smooth mobile responsive layouts.'
        ]
      },
      interviewTopics: [
        { topic: 'Core Web Vitals & Browser Rendering Pipeline', tips: 'Explain LCP, INP, CLS optimization, SSR vs SSG vs Client Hydration, and bundle tree-shaking.' },
        { topic: 'Complex State & Micro-Frontends', tips: 'Discuss trade-offs between Context, Redux, Zustand, and state colocation.' }
      ]
    },
    {
      id: 'backend',
      baseTitle: 'Backend Systems & API Engineer',
      domainKeywords: ['backend', 'back end', 'api', 'server', 'microservices', 'distributed systems'],
      coreSkills: ['Node.js', 'Express', 'Python', 'FastAPI', 'Java', 'Spring Boot', 'Go', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'Docker'],
      marketDemand: 'High Demand — Core backbone of enterprise digital infrastructure',
      typicalSalaryRange: '$125,000 – $175,000 USD / yr',
      summary: 'Your core competency centers on resilient server-side logic, high-throughput microservices, database schema design, and asynchronous message queues.',
      projectBlueprint: {
        name: 'Event-Driven Distributed Order Processing Engine',
        concept: 'A high-throughput API gateway with distributed rate limiting, Redis caching, and Kafka/RabbitMQ message pub/sub queues.',
        techStack: ['FastAPI / Node.js', 'PostgreSQL', 'Redis', 'Kafka / RabbitMQ', 'Docker', 'Prometheus'],
        deliverables: [
          'Benchmark load test handling 5,000+ requests per second with <50ms p99 latency.',
          'Idempotent transactional architecture handling concurrent updates safely.',
          'Docker Compose multi-container infrastructure with automated health checks.'
        ]
      },
      interviewTopics: [
        { topic: 'Database Concurrency & ACID Guarantees', tips: 'Discuss isolation levels, optimistic vs pessimistic locking, and indexing strategies for high-read vs high-write workloads.' },
        { topic: 'Distributed Systems & Resiliency Patterns', tips: 'Explain circuit breaker patterns, dead letter queues, and eventual consistency.' }
      ]
    },
    {
      id: 'cloud_devops',
      baseTitle: 'Cloud Platform & DevOps Engineer',
      domainKeywords: ['devops', 'cloud', 'sre', 'site reliability', 'infrastructure', 'platform engineer', 'aws', 'kubernetes'],
      coreSkills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Linux', 'Bash', 'Nginx'],
      marketDemand: 'Very High Demand — Highest technical premium compensation',
      typicalSalaryRange: '$135,000 – $185,000 USD / yr',
      summary: 'You excel at automating infrastructure-as-code, building robust CI/CD pipelines, container orchestration, and multi-cloud observability.',
      projectBlueprint: {
        name: 'GitOps Multi-Cluster Kubernetes Deployment',
        concept: 'A complete Infrastructure-as-Code pipeline deploying an auto-scaling containerized application to AWS EKS with ArgoCD, Prometheus, and Grafana.',
        techStack: ['Terraform', 'AWS', 'Kubernetes', 'Helm', 'GitHub Actions', 'Prometheus', 'Grafana'],
        deliverables: [
          'Modular Terraform codebase provisioning VPC, subnets, and Kubernetes cluster.',
          'Zero-downtime rolling update deployment strategy configured via GitHub Actions.',
          'Live Grafana monitoring dashboard tracking cluster CPU, memory, and error rates.'
        ]
      },
      interviewTopics: [
        { topic: 'Infrastructure as Code & Drift Detection', tips: 'Explain Terraform state management, locking with DynamoDB, and GitOps synchronization.' },
        { topic: 'Kubernetes Pod Lifecycle & Networking', tips: 'Discuss Ingress controllers, CNI plugins, readiness/liveness probes, and Horizontal Pod Autoscalers.' }
      ]
    },
    {
      id: 'ai_ml',
      baseTitle: 'AI & Machine Learning Solutions Engineer',
      domainKeywords: ['machine learning', 'ai engineer', 'data scientist', 'deep learning', 'nlp', 'llm', 'generative ai', 'computer vision'],
      coreSkills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'NLP', 'LLM', 'Generative AI', 'SQL'],
      marketDemand: 'Exponential Growth — Highest surge in 2026 tech hiring',
      typicalSalaryRange: '$140,000 – $195,000 USD / yr',
      summary: 'You demonstrate deep competence in statistical modeling, neural network architectures, generative AI integrations, and high-performance inference pipelines.',
      projectBlueprint: {
        name: 'Enterprise Retrieval-Augmented Generation (RAG) System',
        concept: 'A semantic search and document question-answering assistant integrating vector embeddings, hybrid keyword reranking, and local/cloud LLM inference.',
        techStack: ['Python', 'PyTorch / LangChain', 'ChromaDB / Pinecone', 'FastAPI', 'Streamlit', 'Docker'],
        deliverables: [
          'End-to-end inference pipeline processing unstructured PDF documents into chunked vector embeddings.',
          'Rigorous evaluation notebook measuring retrieval precision, context recall, and hallucination reduction.',
          'Interactive web UI allowing instant document upload and verifiable Q&A.'
        ]
      },
      interviewTopics: [
        { topic: 'Transformer Architecture & Attention Mechanisms', tips: 'Explain self-attention, multi-head attention, KV caching, and fine-tuning (LoRA, QLoRA).' },
        { topic: 'Model Evaluation & Overfitting Mitigation', tips: 'Discuss cross-validation, regularization techniques, precision/recall trade-offs, and ROC-AUC curves.' }
      ]
    },
    {
      id: 'data_eng',
      baseTitle: 'Data Engineer & Analytics Architect',
      domainKeywords: ['data engineer', 'big data', 'analytics engineer', 'etl', 'data warehouse', 'data pipeline'],
      coreSkills: ['Python', 'SQL', 'PostgreSQL', 'BigQuery', 'Snowflake', 'Kafka', 'Pandas', 'ETL', 'Docker'],
      marketDemand: 'High Demand — Foundational for all enterprise AI and business intelligence',
      typicalSalaryRange: '$125,000 – $170,000 USD / yr',
      summary: 'You bridge raw operational databases to analytical data warehouses through performant ETL/ELT pipelines and clean dimensional data models.',
      projectBlueprint: {
        name: 'Real-Time Streaming Analytics Pipeline',
        concept: 'A pipeline consuming streaming clickstream events, transforming schemas in real time, and loading modeled metrics into BigQuery or Snowflake.',
        techStack: ['Python', 'SQL', 'Apache Kafka / Redpanda', 'dbt', 'BigQuery / Snowflake', 'Docker'],
        deliverables: [
          'Fault-tolerant streaming pipeline with automated schema evolution and dead-letter queues.',
          'Production dbt project with automated data testing and lineage documentation.',
          'Automated data freshness SLA alerts integrated with Slack/Email.'
        ]
      },
      interviewTopics: [
        { topic: 'Star Schema vs Snowflake Schema & Partitioning', tips: 'Explain surrogate keys, slowly changing dimensions (SCD Type 2), and partitioning/clustering benefits.' },
        { topic: 'Batch vs Streaming Processing Guarantees', tips: 'Detail at-least-once vs exactly-once semantics, watermarking, and backpressure handling.' }
      ]
    },
    {
      id: 'mobile',
      baseTitle: 'Mobile Applications Engineer',
      domainKeywords: ['mobile developer', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
      coreSkills: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'Dart', 'TypeScript', 'JavaScript', 'REST APIs'],
      marketDemand: 'Solid Demand — Ubiquitous enterprise mobile app ecosystems',
      typicalSalaryRange: '$120,000 – $165,000 USD / yr',
      summary: 'You build polished, responsive mobile applications with smooth gesture controls, offline local caching, and reliable background synchronization.',
      projectBlueprint: {
        name: 'Offline-First Cross-Platform Mobile Suite',
        concept: 'A sleek mobile application featuring local SQLite caching, biometric authentication, push notifications, and seamless background cloud sync.',
        techStack: ['React Native / Flutter', 'TypeScript', 'SQLite', 'Redux Toolkit', 'Firebase / Supabase'],
        deliverables: [
          'Polished iOS and Android builds running at constant 60 FPS.',
          'Robust offline queue syncing automatically once network connection restores.',
          'Native hardware integration (Camera, Biometrics, Secure Storage).'
        ]
      },
      interviewTopics: [
        { topic: 'Mobile Memory Management & Threading', tips: 'Explain main thread bottlenecks, background workers, and memory leak diagnosis using Xcode Instruments / Android Profiler.' },
        { topic: 'Offline Caching & State Conflict Resolution', tips: 'Discuss timestamp-based vs CRDT conflict resolution for distributed mobile clients.' }
      ]
    },
    {
      id: 'qa_sdet',
      baseTitle: 'Software Test & Automation Engineer (SDET)',
      domainKeywords: ['qa', 'sdet', 'test automation', 'testing', 'quality assurance', 'cypress', 'playwright', 'selenium'],
      coreSkills: ['Jest', 'Cypress', 'Playwright', 'Selenium', 'PyTest', 'JUnit', 'TypeScript', 'Python', 'CI/CD', 'Git'],
      marketDemand: 'Stable Demand — Critical for modern automated release velocity',
      typicalSalaryRange: '$105,000 – $150,000 USD / yr',
      summary: 'You safeguard software stability through automated end-to-end suites, unit test harnesses, performance load testing, and regression pipelines.',
      projectBlueprint: {
        name: 'End-to-End Enterprise Test Automation Framework',
        concept: 'A modular, headless test suite running in GitHub Actions with parallel test execution, video recording, and visual regression detection.',
        techStack: ['Playwright', 'TypeScript', 'Jest', 'Docker', 'GitHub Actions', 'Allure Reports'],
        deliverables: [
          'Parallel execution running 100+ tests under 3 minutes with zero flaky failures.',
          'Automated CI/CD pull request gate generating visual test coverage reports.',
          'Cross-browser and mobile viewport automated regression matrix.'
        ]
      },
      interviewTopics: [
        { topic: 'Page Object Model (POM) & Test Flakiness', tips: 'Explain explicit vs implicit waits, test isolation, mock servers, and deterministic test data generation.' },
        { topic: 'Testing Pyramid & Performance Testing', tips: 'Discuss the optimal balance between unit, integration, and E2E tests, plus load testing with k6 or JMeter.' }
      ]
    }
  ];

  /**
   * Helper: Extracts all skills present in resume text across SKILLS_DICTIONARY
   */
  function extractAllResumeSkills(resumeText) {
    const lowerResume = resumeText.toLowerCase();
    const detected = [];
    SKILLS_DICTIONARY.forEach(skill => {
      if (matchWord(lowerResume, skill)) {
        detected.push(skill);
      }
    });
    return detected;
  }

  /**
   * Helper: Determines Seniority Level from resume content
   */
  function determineSeniorityLevel(resumeText, experienceBreakdown) {
    const lower = resumeText.toLowerCase();
    let years = 2;
    const match = lower.match(/(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp)/i);
    if (match) {
      years = parseInt(match[1], 10);
    } else if (experienceBreakdown && experienceBreakdown.yearsDetected) {
      years = experienceBreakdown.yearsDetected;
    }

    const hasLeadership = lower.includes('principal') || lower.includes('director') || lower.includes('staff engineer') || lower.includes('head of') || lower.includes('vp');
    const isSenior = lower.includes('senior') || lower.includes('lead') || lower.includes('architect') || years >= 5;
    const isMid = years >= 2 && years < 5;

    if (hasLeadership || years >= 8) {
      return {
        tier: 'Principal / Staff',
        years: Math.max(years, 8),
        titlePrefix: 'Lead '
      };
    } else if (isSenior || years >= 4) {
      return {
        tier: 'Senior',
        years: Math.max(years, 5),
        titlePrefix: 'Senior '
      };
    } else if (isMid) {
      return {
        tier: 'Mid-Level',
        years: Math.max(years, 3),
        titlePrefix: ''
      };
    } else {
      return {
        tier: 'Associate / Junior',
        years: Math.min(years, 2),
        titlePrefix: 'Associate '
      };
    }
  }

  /**
   * Helper: Match skill with synonym normalization (e.g., HTML -> HTML5, REST -> RESTful APIs)
   */
  function matchSkillNormalized(text, skill) {
    if (matchWord(text, skill)) return true;
    const s = skill.toLowerCase();
    if (s === 'html' && matchWord(text, 'html5')) return true;
    if (s === 'html5' && matchWord(text, 'html')) return true;
    if (s === 'css' && matchWord(text, 'css3')) return true;
    if (s === 'css3' && matchWord(text, 'css')) return true;
    if ((s === 'rest apis' || s === 'restful apis' || s === 'rest') && (text.includes('rest') || text.includes('restful'))) return true;
    if (s === 'git' && (text.includes('github') || text.includes('gitlab'))) return true;
    if (s === 'react' && matchWord(text, 'react.js')) return true;
    if (s === 'node.js' && matchWord(text, 'node')) return true;
    if (s === 'vue' && matchWord(text, 'vue.js')) return true;
    return false;
  }

  /**
   * Core Career Advisory Evaluator:
   * Identifies the best-fit job role, adjacent career opportunities,
   * and builds a deterministic 4-phase transition roadmap.
   * @param {string} resumeText
   * @param {string} jobDescription
   * @param {Object} breakdown
   * @returns {Object} Career Fit Analysis
   */
  function evaluateCareerFit(resumeText, jobDescription, breakdown) {
    const lowerResume = resumeText.toLowerCase();
    const lowerJd = (jobDescription || '').toLowerCase();

    const allResumeSkills = extractAllResumeSkills(resumeText);
    const matchedSkills = breakdown.skills ? breakdown.skills.matched : [];
    const missingSkills = breakdown.skills ? breakdown.skills.missing : [];
    const missingKeywords = breakdown.keywords ? breakdown.keywords.missing : [];

    // Determine seniority
    const seniority = determineSeniorityLevel(resumeText, breakdown.experience);

    // Score role archetypes
    const scoredRoles = ROLE_ARCHETYPES.map(archetype => {
      const resumeOverlap = archetype.coreSkills.filter(s => matchSkillNormalized(lowerResume, s));
      const resumeSkillRatio = archetype.coreSkills.length > 0
        ? (resumeOverlap.length / archetype.coreSkills.length)
        : 0;

      let jdDomainScore = 0;
      let jdMatches = 0;
      let titleBoost = 0;

      archetype.domainKeywords.forEach(kw => {
        if (lowerJd.includes(kw)) {
          jdMatches++;
          titleBoost += 10;
        }
        if (lowerResume.includes(kw)) {
          titleBoost += 8;
        }
      });
      if (jdMatches > 0) {
        jdDomainScore = Math.min(jdMatches * 0.35, 1);
      }
      titleBoost = Math.min(titleBoost, 25);

      const jdSkillOverlap = archetype.coreSkills.filter(s => matchSkillNormalized(lowerJd, s));
      const jdSkillRatio = archetype.coreSkills.length > 0
        ? (jdSkillOverlap.length / archetype.coreSkills.length)
        : 0;

      let affinity = Math.round(
        (resumeSkillRatio * 50) +
        (jdDomainScore * 25) +
        (jdSkillRatio * 15) +
        titleBoost
      );

      const matchedArchetypeSkills = matchedSkills.filter(s =>
        archetype.coreSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
      );
      if (matchedArchetypeSkills.length >= 2) {
        affinity += 8;
      }

      const matchScore = Math.min(Math.max(affinity, 40), 98);

      return {
        archetype: archetype,
        matchScore: matchScore,
        resumeOverlap: resumeOverlap,
        matchedArchetypeSkills: matchedArchetypeSkills
      };
    });

    scoredRoles.sort((a, b) => b.matchScore - a.matchScore);

    const best = scoredRoles[0];
    const adjacent = scoredRoles.slice(1, 4);

    const finalPrimaryTitle = `${seniority.titlePrefix}${best.archetype.baseTitle}`.trim();

    let matchTier = 'Optimal Core Match';
    if (best.matchScore < 70) {
      matchTier = 'High Growth Potential Match';
    } else if (best.matchScore < 85) {
      matchTier = 'Competitive Match';
    }

    const whyPerfect = [
      `Strong technical overlap with ${best.resumeOverlap.slice(0, 5).join(', ')} directly validated in your resume.`,
      `Your detected ${seniority.years}+ years of experience align with ${seniority.tier} role expectations.`,
      `High domain market demand: ${best.archetype.marketDemand}.`
    ];

    if (best.matchedArchetypeSkills.length > 0) {
      whyPerfect.push(`Demonstrated mastery of core employer requirements: ${best.matchedArchetypeSkills.slice(0, 4).join(', ')}.`);
    }

    const adjacentRoles = adjacent.map(item => {
      const unownedSkills = item.archetype.coreSkills.filter(s => !matchWord(lowerResume, s));
      const bridgeSkill = unownedSkills.length > 0 ? unownedSkills[0] : 'System Architecture';

      return {
        title: `${seniority.titlePrefix}${item.archetype.baseTitle}`.trim(),
        matchScore: Math.min(item.matchScore, best.matchScore - 3),
        reason: item.archetype.summary,
        keyBridgeSkill: bridgeSkill
      };
    });

    const roadmap = generatePersonalizedRoadmap(
      finalPrimaryTitle,
      best.archetype,
      seniority,
      breakdown,
      missingSkills,
      missingKeywords,
      best.resumeOverlap
    );

    return {
      primaryRole: {
        title: finalPrimaryTitle,
        baseTitle: best.archetype.baseTitle,
        level: seniority.tier,
        matchScore: best.matchScore,
        matchTier: matchTier,
        summary: best.archetype.summary,
        whyPerfect: whyPerfect,
        marketDemand: best.archetype.marketDemand,
        typicalSalaryRange: best.archetype.typicalSalaryRange
      },
      adjacentRoles: adjacentRoles,
      roadmap: roadmap
    };
  }

  /**
   * Generates a 4-Phase Chronological Career Transition Roadmap
   */
  function generatePersonalizedRoadmap(primaryTitle, archetype, seniority, breakdown, missingSkills, missingKeywords, resumeSkills) {
    const kwToInject = (missingKeywords && missingKeywords.length > 0)
      ? missingKeywords.slice(0, 4)
      : (missingSkills.slice(0, 4));

    const phase1Actions = [
      {
        label: 'Inject Role-Specific ATS Keywords',
        detail: kwToInject.length > 0
          ? `Incorporate missing high-priority terms into your work history bullets: "${kwToInject.join('", "')}".`
          : `Ensure high-frequency terms related to ${archetype.baseTitle} are naturally distributed across your work experience.`
      },
      {
        label: 'Quantify Accomplishments (Formula: Verb + Context + Result)',
        detail: (breakdown.experience && breakdown.experience.metricsCount < 3)
          ? 'Add at least 3 numerical metrics to your bullet points (e.g. "Reduced API latency by 35%", "Scaled system to handle 10k daily users").'
          : 'Further refine existing metrics to highlight direct business revenue or efficiency impact.'
      },
      {
        label: 'Standardize Section Architecture',
        detail: (breakdown.structure && breakdown.structure.missingSections && breakdown.structure.missingSections.length > 0)
          ? `Add clear standard headings for missing sections: ${breakdown.structure.missingSections.join(', ')}.`
          : 'Your resume section structure is standard. Ensure your Technical Skills section groups tools cleanly (Languages, Frameworks, Cloud, Databases).'
      }
    ];

    let bridgeSkills = [...missingSkills];
    if (bridgeSkills.length < 3) {
      const extraArchetypeSkills = archetype.coreSkills.filter(s => !resumeSkills.includes(s));
      bridgeSkills = [...bridgeSkills, ...extraArchetypeSkills].slice(0, 3);
    } else {
      bridgeSkills = bridgeSkills.slice(0, 3);
    }

    const skillHoursMap = {
      'Docker': { hours: '4–6 Hours', task: 'Build a multi-stage Dockerfile and docker-compose orchestration file for local dev.' },
      'Kubernetes': { hours: '6–8 Hours', task: 'Deploy a sample service with Ingress, Service, and Horizontal Pod Autoscaler.' },
      'TypeScript': { hours: '3–5 Hours', task: 'Convert a vanilla JavaScript module to TypeScript with strict types and generics.' },
      'React': { hours: '5–8 Hours', task: 'Construct a reusable component library with hooks, Context, and unit tests.' },
      'Next.js': { hours: '4–6 Hours', task: 'Implement App Router with Server Components, SSR, and dynamic API routes.' },
      'Node.js': { hours: '4–6 Hours', task: 'Develop REST/GraphQL endpoints with rate limiting and JWT authentication.' },
      'PostgreSQL': { hours: '3–5 Hours', task: 'Design a normalized relational schema with indexing and foreign key constraints.' },
      'Redis': { hours: '2–3 Hours', task: 'Implement cache-aside pattern with TTL expiration for high-read endpoints.' },
      'AWS': { hours: '5–7 Hours', task: 'Provision an S3 bucket with CloudFront CDN or deploy a container to AWS ECS.' },
      'CI/CD': { hours: '2–4 Hours', task: 'Write a GitHub Actions workflow that lints, tests, and builds on pull request.' },
      'Machine Learning': { hours: '6–8 Hours', task: 'Train and evaluate a supervised classifier with cross-validation and confusion matrix.' },
      'PyTorch': { hours: '6–8 Hours', task: 'Build and fine-tune a neural network with custom DataLoader and training loop.' },
      'Three.js': { hours: '4–6 Hours', task: 'Create an interactive 3D WebGL scene with lighting, meshes, and mouse interaction.' }
    };

    const phase2Actions = bridgeSkills.map(skill => {
      const info = skillHoursMap[skill] || {
        hours: '3–5 Hours',
        task: `Build a focused micro-project implementing ${skill} to verify working competence.`
      };
      return {
        skill: skill,
        timeEstimate: info.hours,
        objective: info.task
      };
    });

    const blueprint = archetype.projectBlueprint;

    const phase4Actions = [
      ...archetype.interviewTopics.map(t => ({
        topic: t.topic,
        tips: t.tips
      })),
      {
        topic: 'Executive STAR Narrative',
        tips: `Prepare two 90-second STAR stories (Situation, Task, Action, Result) focusing on how you tackled high-complexity engineering challenges as a ${seniority.tier} developer.`
      },
      {
        topic: 'Targeted Outreach Strategy',
        tips: `Identify 5 engineering hiring managers per week on LinkedIn in the ${archetype.baseTitle} domain. Share a concise 2-sentence note highlighting your recent ${blueprint.name} project.`
      }
    ];

    return {
      targetRoleTitle: primaryTitle,
      phases: [
        {
          phase: 1,
          title: 'Resume & ATS Tactical Refinements',
          timeframe: 'Days 1 – 3',
          icon: 'fa-file-lines',
          actions: phase1Actions
        },
        {
          phase: 2,
          title: 'High-Priority Skill Bridging',
          timeframe: 'Weeks 1 – 2',
          icon: 'fa-bolt',
          actions: phase2Actions
        },
        {
          phase: 3,
          title: 'Proof-of-Work Portfolio Project',
          timeframe: 'Weeks 3 – 4',
          icon: 'fa-laptop-code',
          projectBlueprint: blueprint
        },
        {
          phase: 4,
          title: 'Interview Mastery & Application Blitz',
          timeframe: 'Weeks 4+',
          icon: 'fa-crosshairs',
          actions: phase4Actions
        }
      ]
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

${analysis.careerFit ? `
${divider}
[🎯 YOUR PERFECT JOB MATCH & ACTIONABLE ROADMAP]
${divider}
TARGET ROLE:       ${analysis.careerFit.primaryRole.title} (${analysis.careerFit.primaryRole.matchScore}% Compatibility)
SENIORITY TIER:    ${analysis.careerFit.primaryRole.level} — ${analysis.careerFit.primaryRole.matchTier}
SALARY BENCHMARK:  ${analysis.careerFit.primaryRole.typicalSalaryRange}
MARKET DEMAND:     ${analysis.careerFit.primaryRole.marketDemand}

WHY THIS ROLE IS PERFECT FOR YOU:
${analysis.careerFit.primaryRole.whyPerfect.map(w => `• ${w}`).join('\n')}

ALTERNATIVE & ADJACENT HIGH-FIT ROLES:
${analysis.careerFit.adjacentRoles.map(r => `• ${r.title} (${r.matchScore}% Match): ${r.reason} [Bridge Skill: ${r.keyBridgeSkill}]`).join('\n')}

${subDivider}
[🚀 HOW TO GET INTO THIS JOB: 4-PHASE ACTION ROADMAP]
${subDivider}
1. RESUME & ATS REFINEMENTS (${analysis.careerFit.roadmap.phases[0].timeframe}):
${analysis.careerFit.roadmap.phases[0].actions.map(a => `   - [${a.label}]: ${a.detail}`).join('\n')}

2. HIGH-PRIORITY SKILL BRIDGING (${analysis.careerFit.roadmap.phases[1].timeframe}):
${analysis.careerFit.roadmap.phases[1].actions.map(a => `   - [${a.skill}] (~${a.timeEstimate}): ${a.objective}`).join('\n')}

3. PROOF-OF-WORK PORTFOLIO PROJECT (${analysis.careerFit.roadmap.phases[2].timeframe}):
   - Project: ${analysis.careerFit.roadmap.phases[2].projectBlueprint.name}
   - Stack:   ${analysis.careerFit.roadmap.phases[2].projectBlueprint.techStack.join(', ')}
   - Scope:   ${analysis.careerFit.roadmap.phases[2].projectBlueprint.concept}
   - Deliverables:
${analysis.careerFit.roadmap.phases[2].projectBlueprint.deliverables.map(d => `     * ${d}`).join('\n')}

4. INTERVIEW & APPLICATION STRATEGY (${analysis.careerFit.roadmap.phases[3].timeframe}):
${analysis.careerFit.roadmap.phases[3].actions.map(a => `   - [${a.topic}]: ${a.tips}`).join('\n')}
` : ''}
${divider}
Engine: ResumeX AI Deterministic Analyzer (Client-side Privacy Protected)
No resume data was transmitted to external servers.
${divider}`;
  }

  return {
    analyzeResume: analyzeResume,
    generateReport: generateReport,
    evaluateCareerFit: evaluateCareerFit,
    ROLE_ARCHETYPES: ROLE_ARCHETYPES,
    SKILLS_DICTIONARY: SKILLS_DICTIONARY
  };
});
