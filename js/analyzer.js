/**
 * ResumeX AI - Analyzer UI Orchestrator
 * Connects DocumentParser and AtsEngine with the Analyzer interface.
 * Implements deterministic scoring, Chart.js visualizations, OCR warnings,
 * reset functionality, and report export.
 */

(function () {
  'use strict';

  // Guard against duplicate initialization
  if (window.__resumexAnalyzerInitialized) return;
  window.__resumexAnalyzerInitialized = true;

  // Sample data for demonstration
  const SAMPLE_RESUME_TEXT = `
ALEX MORGAN
alex.morgan@example.com | (415) 555-0192 | San Francisco, CA | github.com/alexmorgan | linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Results-driven Senior Full-Stack Engineer with 6+ years of experience architecting high-throughput web applications, microservices, and cloud-native solutions. Proficient in TypeScript, React, Node.js, Python, PostgreSQL, and AWS Cloud infrastructure.

CORE TECHNICAL SKILLS
• Programming Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3, Go
• Frontend Technologies: React, Next.js, Redux, TailwindCSS, Webpack, Responsive Design
• Backend & APIs: Node.js, Express, FastAPI, RESTful APIs, GraphQL, Microservices, System Design
• Databases & Caching: PostgreSQL, MySQL, Redis, MongoDB, Elasticsearch
• DevOps & Cloud: AWS (EC2, S3, Lambda, CloudFront), Docker, Kubernetes, CI/CD, GitHub Actions, Linux
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
Graduated with Honors | Relevant Coursework: Data Structures, Algorithms, Distributed Systems, Database Management
`;

  const SAMPLE_JOB_DESCRIPTION = `
Position: Senior Full-Stack Engineer (React / Node.js / Cloud Architecture)
Location: San Francisco, CA (Hybrid / Remote)
Experience: 5+ years of software engineering experience

About the Role:
We are seeking an experienced Senior Full-Stack Engineer to architect, build, and scale our core SaaS platform.

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

  // State management
  let currentFile = null;
  let currentResumeText = '';
  let lastAnalysis = null;
  let skillChartInstance = null;
  let scoreBreakdownChartInstance = null;

  document.addEventListener('DOMContentLoaded', () => {
    initElements();
  });

  function initElements() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('resume-file-input');
    const filePreviewChip = document.getElementById('file-preview-chip');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const fileIcon = document.getElementById('file-icon-type');
    const removeFileBtn = document.getElementById('btn-remove-file');
    const jobDescInput = document.getElementById('job-desc-input');
    const charCountEl = document.getElementById('char-count');
    const btnSampleJob = document.getElementById('btn-sample-job');
    const btnSampleResume = document.getElementById('btn-sample-resume');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnResetTop = document.getElementById('btn-reset-top');
    const btnResetBottom = document.getElementById('btn-reset-analysis');
    const btnDownloadReport = document.getElementById('btn-download-report');
    const validationMsg = document.getElementById('validation-msg');
    const ocrAlertBanner = document.getElementById('ocr-alert-banner');
    const ocrAlertMsg = document.getElementById('ocr-alert-message');

    // 1. Dropzone interactions
    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-active');
        }, false);
      });

      ['dragleave', 'drop'].forEach(name => {
        dropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-active');
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleSelectedFile(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleSelectedFile(e.target.files[0]);
        }
      });
    }

    // 2. Remove file button
    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedFile();
      });
    }

    // 3. Job Description typing & counter
    if (jobDescInput && charCountEl) {
      jobDescInput.addEventListener('input', () => {
        const length = jobDescInput.value.length;
        charCountEl.textContent = `${length} characters`;
        if (length >= 30) {
          clearValidationError();
        }
      });
    }

    // 4. Sample Loaders
    if (btnSampleJob && jobDescInput && charCountEl) {
      btnSampleJob.addEventListener('click', () => {
        jobDescInput.value = SAMPLE_JOB_DESCRIPTION.trim();
        charCountEl.textContent = `${jobDescInput.value.length} characters`;
        clearValidationError();
        if (window.showToast) window.showToast('Sample Senior Full-Stack job description loaded!', 'success');
      });
    }

    if (btnSampleResume) {
      btnSampleResume.addEventListener('click', () => {
        currentFile = { name: 'Alex_Morgan_Senior_Engineer_Resume.pdf', size: 148500 };
        currentResumeText = SAMPLE_RESUME_TEXT.trim();
        updateFilePreviewUI(currentFile.name, '148 KB (Sample)', 'pdf');
        clearValidationError();
        hideOcrWarning();
        if (window.showToast) window.showToast('Sample candidate resume loaded for instant testing!', 'success');
      });
    }

    // 5. Analyze Button
    if (btnAnalyze) {
      btnAnalyze.addEventListener('click', () => {
        runAnalysis();
      });
    }

    // 6. Reset Buttons
    if (btnResetTop) {
      btnResetTop.addEventListener('click', resetAll);
    }
    if (btnResetBottom) {
      btnResetBottom.addEventListener('click', resetAll);
    }

    // 7. Download Report Button
    if (btnDownloadReport) {
      btnDownloadReport.addEventListener('click', downloadReport);
    }
  }

  /**
   * Handles user file selection with validation and DocumentParser
   */
  async function handleSelectedFile(file) {
    clearValidationError();
    hideOcrWarning();

    const validation = window.DocumentParser.validateFile(file);
    if (!validation.valid) {
      showValidationError(validation.error);
      return;
    }

    currentFile = file;
    const lower = file.name.toLowerCase();
    const type = lower.endsWith('.pdf') ? 'pdf' : (lower.endsWith('.docx') ? 'docx' : 'txt');
    updateFilePreviewUI(file.name, window.DocumentParser.formatBytes(file.size), type);

    // Show parsing loading toast
    if (window.showToast) window.showToast(`Reading ${file.name}...`, 'info');

    try {
      const parsed = await window.DocumentParser.parseDocument(file);

      if (!parsed.success) {
        if (parsed.ocrRequired) {
          showOcrWarning(parsed.error);
        } else {
          showValidationError(parsed.error || 'Failed to extract text from document.');
        }
        currentResumeText = '';
        return;
      }

      currentResumeText = parsed.text;
      if (window.showToast) {
        window.showToast(`Extracted ${parsed.wordCount} words from ${file.name}`, 'success');
      }
    } catch (err) {
      console.error('Document parsing exception:', err);
      showValidationError(`Document parsing failed: ${err.message}`);
      currentResumeText = '';
    }
  }

  function updateFilePreviewUI(name, formattedSize, type) {
    const filePreviewChip = document.getElementById('file-preview-chip');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const fileIcon = document.getElementById('file-icon-type');

    if (fileNameEl) fileNameEl.textContent = name;
    if (fileSizeEl) fileSizeEl.textContent = formattedSize;

    if (fileIcon) {
      fileIcon.className = '';
      if (type === 'pdf') fileIcon.className = 'fa-solid fa-file-pdf';
      else if (type === 'docx') fileIcon.className = 'fa-solid fa-file-word';
      else fileIcon.className = 'fa-solid fa-file-lines';
    }

    if (filePreviewChip) filePreviewChip.classList.add('active');
  }

  function clearSelectedFile() {
    currentFile = null;
    currentResumeText = '';
    const fileInput = document.getElementById('resume-file-input');
    const filePreviewChip = document.getElementById('file-preview-chip');
    if (fileInput) fileInput.value = '';
    if (filePreviewChip) filePreviewChip.classList.remove('active');
    hideOcrWarning();
    if (window.showToast) window.showToast('Resume file removed', 'info');
  }

  function showOcrWarning(message) {
    const ocrAlertBanner = document.getElementById('ocr-alert-banner');
    const ocrAlertMsg = document.getElementById('ocr-alert-message');
    if (ocrAlertMsg && message) ocrAlertMsg.textContent = message;
    if (ocrAlertBanner) ocrAlertBanner.classList.add('active');
    if (window.showToast) window.showToast('OCR Warning: Image-based scanned PDF detected', 'error');
  }

  function hideOcrWarning() {
    const ocrAlertBanner = document.getElementById('ocr-alert-banner');
    if (ocrAlertBanner) ocrAlertBanner.classList.remove('active');
  }

  function showValidationError(msg) {
    const validationMsg = document.getElementById('validation-msg');
    if (validationMsg) {
      validationMsg.textContent = msg;
      validationMsg.classList.add('active');
    }
    if (window.showToast) window.showToast(msg, 'error');
  }

  function clearValidationError() {
    const validationMsg = document.getElementById('validation-msg');
    if (validationMsg) {
      validationMsg.textContent = '';
      validationMsg.classList.remove('active');
    }
  }

  /**
   * Executes deterministic ATS analysis
   */
  async function runAnalysis() {
    const jobDescInput = document.getElementById('job-desc-input');
    const jobDesc = jobDescInput ? jobDescInput.value.trim() : '';

    if (!currentFile || !currentResumeText) {
      showValidationError('Please upload a resume file (.pdf, .docx, or .txt) or load the sample resume before analyzing.');
      return;
    }

    if (!jobDesc || jobDesc.length < 30) {
      showValidationError('Please enter a target job description (at least 30 characters) to calibrate ATS scoring.');
      return;
    }

    clearValidationError();
    hideOcrWarning();

    // Start UI scanning animation
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnResetTop = document.getElementById('btn-reset-top');
    const loader = document.getElementById('analysis-loader');
    const results = document.getElementById('results-section');
    const progressBar = document.getElementById('progress-bar');
    const stageTitle = document.getElementById('loader-stage-title');
    const stageDesc = document.getElementById('loader-stage-desc');

    if (btnAnalyze) btnAnalyze.disabled = true;
    if (results) results.classList.remove('active');
    if (loader) loader.classList.add('active');
    if (btnResetTop) btnResetTop.style.display = 'inline-flex';

    const stages = [
      { pct: 25, title: 'Extracting text streams & structural headers...', desc: 'Verifying ATS section readability, contact details, and document hierarchy' },
      { pct: 55, title: 'Parsing job requirements & technical taxonomy...', desc: 'Extracting required programming languages, tools, frameworks, and qualifications' },
      { pct: 80, title: 'Executing 7-point deterministic scoring algorithm...', desc: 'Computing keyword matching, skills coverage, experience alignment, and formatting' },
      { pct: 100, title: 'Compiling diagnostic report & gap matrix...', desc: 'Finalizing charts and prioritized action items' }
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        const st = stages[stageIdx];
        if (progressBar) progressBar.style.width = `${st.pct}%`;
        if (stageTitle) stageTitle.textContent = st.title;
        if (stageDesc) stageDesc.textContent = st.desc;
        stageIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          try {
            const analysis = window.AtsEngine.analyzeResume(currentResumeText, jobDesc);
            lastAnalysis = analysis;
            renderResultsUI(analysis);
            saveAnalysisToStorage(analysis, currentFile ? currentFile.name : 'Resume.pdf', jobDesc);

            if (loader) loader.classList.remove('active');
            if (btnAnalyze) btnAnalyze.disabled = false;
            if (results) {
              results.classList.add('active');
              results.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (window.showToast) {
              window.showToast(`Analysis Complete! Overall ATS Score: ${analysis.overallScore}/100`, 'success');
            }
          } catch (err) {
            console.error('ATS Engine error:', err);
            if (loader) loader.classList.remove('active');
            if (btnAnalyze) btnAnalyze.disabled = false;
            showValidationError(`Analysis error: ${err.message}`);
          }
        }, 350);
      }
    }, 400);
  }

  /**
   * Renders the complete analysis result to the UI
   */
  function renderResultsUI(analysis) {
    // 1. Overall Score & Circular Gauge
    const scoreVal = document.getElementById('score-value');
    const circleFill = document.getElementById('score-circle-fill');
    const scoreVerdict = document.getElementById('score-verdict');
    const scoreExplanation = document.getElementById('score-explanation');
    const docBadge = document.getElementById('results-doc-badge');

    if (scoreVal) scoreVal.textContent = analysis.overallScore;
    if (circleFill) {
      const perimeter = 440; // 2 * PI * 70
      const offset = perimeter - (perimeter * (analysis.overallScore / 100));
      circleFill.style.strokeDashoffset = offset;
    }

    if (scoreVerdict) {
      scoreVerdict.textContent = analysis.verdict;
      scoreVerdict.style.color = analysis.verdictColor;
    }

    if (scoreExplanation) {
      scoreExplanation.textContent = `Scored deterministically across 7 ATS criteria: ${analysis.scores.keywords}/30 keywords, ${analysis.scores.skills}/25 skills, ${analysis.scores.experience}/15 experience, and ${analysis.scores.structure}/10 structure.`;
    }

    if (docBadge && currentFile) {
      docBadge.textContent = currentFile.name;
    }

    // 2. 7-Criteria Detailed Breakdown List
    const breakdownTotalBadge = document.getElementById('breakdown-total-badge');
    if (breakdownTotalBadge) {
      breakdownTotalBadge.textContent = `Total: ${analysis.overallScore} / 100`;
    }

    setCriteriaRow('score-keywords-val', 'score-keywords-bar', analysis.scores.keywords, 30);
    setCriteriaRow('score-skills-val', 'score-skills-bar', analysis.scores.skills, 25);
    setCriteriaRow('score-experience-val', 'score-experience-bar', analysis.scores.experience, 15);
    setCriteriaRow('score-education-val', 'score-education-bar', analysis.scores.education, 10);
    setCriteriaRow('score-structure-val', 'score-structure-bar', analysis.scores.structure, 10);
    setCriteriaRow('score-contact-val', 'score-contact-bar', analysis.scores.contact, 5);
    setCriteriaRow('score-readability-val', 'score-readability-bar', analysis.scores.readability, 5);

    // 3. Render Charts
    renderSkillMatchingChart(analysis);
    renderScoreBreakdownChart(analysis);

    // 4. Render Skills Tags (Matched vs Missing)
    renderTagCloud('matched-skills-container', 'matched-skills-badge', analysis.matchedSkills, true, 'skills');
    renderTagCloud('missing-skills-container', 'missing-skills-badge', analysis.missingSkills, false, 'skills');

    // 5. Render Keywords Tags (Matched vs Missing)
    renderTagCloud('matched-keywords-container', 'matched-keywords-badge', analysis.matchedKeywords, true, 'keywords');
    renderTagCloud('missing-keywords-container', 'missing-keywords-badge', analysis.missingKeywords, false, 'keywords');

    // 6. Render Detected Sections Badges
    renderSectionBadges(analysis.detectedSections, analysis.missingSections);

    // 7. Render Improvement Suggestions
    renderSuggestionsList(analysis.suggestions);

    // 8. Render Career Advisory: Perfect Job Match & 4-Phase Roadmap
    if (analysis.careerFit) {
      renderCareerAdvisory(analysis.careerFit);
    }
  }

  function setCriteriaRow(valId, barId, score, max) {
    const valEl = document.getElementById(valId);
    const barEl = document.getElementById(barId);
    if (valEl) valEl.textContent = `${score} / ${max} pts`;
    if (barEl) {
      const pct = Math.round((score / max) * 100);
      barEl.style.width = `${pct}%`;
    }
  }

  /**
   * Chart 1: Skill Matching Chart (Doughnut: Matched green vs Missing red/orange)
   */
  function renderSkillMatchingChart(analysis) {
    const canvas = document.getElementById('skillMatchingChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (skillChartInstance) {
      skillChartInstance.destroy();
    }

    const matchedCount = analysis.matchedSkills.length;
    const missingCount = analysis.missingSkills.length;
    const badge = document.getElementById('skill-chart-badge');
    if (badge) {
      const total = matchedCount + missingCount;
      const pct = total > 0 ? Math.round((matchedCount / total) * 100) : 0;
      badge.textContent = `${pct}% Matched`;
    }

    const ctx = canvas.getContext('2d');
    skillChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [`Matched Skills (${matchedCount})`, `Missing Skills (${missingCount})`],
        datasets: [{
          data: [matchedCount || (missingCount === 0 ? 1 : 0), missingCount],
          backgroundColor: ['#10b981', '#ef4444'], // Green for matched, Red for missing
          hoverBackgroundColor: ['#059669', '#dc2626'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} skills`
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  /**
   * Chart 2: Score Breakdown Chart (Horizontal Bar Chart showing 7 criteria)
   */
  function renderScoreBreakdownChart(analysis) {
    const canvas = document.getElementById('scoreBreakdownChart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (scoreBreakdownChartInstance) {
      scoreBreakdownChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const labels = [
      'Keywords (30)',
      'Skills (25)',
      'Experience (15)',
      'Education (10)',
      'Structure (10)',
      'Contact (5)',
      'Readability (5)'
    ];

    const earned = [
      analysis.scores.keywords,
      analysis.scores.skills,
      analysis.scores.experience,
      analysis.scores.education,
      analysis.scores.structure,
      analysis.scores.contact,
      analysis.scores.readability
    ];

    const maxes = [30, 25, 15, 10, 10, 5, 5];

    scoreBreakdownChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Earned Points',
            data: earned,
            backgroundColor: '#4f46e5',
            borderRadius: 4
          },
          {
            label: 'Max Possible',
            data: maxes,
            backgroundColor: 'rgba(226, 232, 240, 0.7)',
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 0,
            max: 30,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' } }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          }
        }
      }
    });
  }

  /**
   * Renders tag cloud for skills and keywords
   */
  function renderTagCloud(containerId, badgeId, items, isMatched, category) {
    const container = document.getElementById(containerId);
    const badge = document.getElementById(badgeId);

    if (badge) {
      badge.textContent = `${items.length} ${isMatched ? 'Matched' : 'Missing'}`;
    }

    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = isMatched
        ? '<p style="font-size:0.85rem; color:#94a3b8; padding:4px 0;">No overlapping terms detected in document.</p>'
        : '<p style="font-size:0.85rem; color:#10b981; padding:4px 0;"><i class="fa-solid fa-check-circle"></i> Exceptional coverage! All target items detected.</p>';
      return;
    }

    const chipClass = isMatched ? 'tag-chip matched' : 'tag-chip missing';
    const iconClass = isMatched ? 'fa-solid fa-check' : 'fa-solid fa-plus';

    container.innerHTML = items.map(item => `
      <span class="${chipClass}">
        <i class="${iconClass}"></i> ${escapeHtml(item)}
      </span>
    `).join('');
  }

  /**
   * Renders badges for detected and missing resume sections
   */
  function renderSectionBadges(detected, missing) {
    const wrap = document.getElementById('sections-badges-wrap');
    const badgeCount = document.getElementById('sections-count-badge');

    if (badgeCount) {
      badgeCount.textContent = `${detected.length} / ${detected.length + missing.length} Standard Sections`;
    }

    if (!wrap) return;

    const detectedHtml = detected.map(name => `
      <div class="section-badge detected">
        <i class="fa-solid fa-circle-check"></i> ${escapeHtml(name)}
      </div>
    `).join('');

    const missingHtml = missing.map(name => `
      <div class="section-badge missing">
        <i class="fa-solid fa-circle-exclamation"></i> Missing: ${escapeHtml(name)}
      </div>
    `).join('');

    wrap.innerHTML = detectedHtml + missingHtml;
  }

  /**
   * Renders actionable improvement suggestions list
   */
  function renderSuggestionsList(suggestions) {
    const list = document.getElementById('recommendations-list');
    if (!list) return;

    if (!suggestions || suggestions.length === 0) {
      list.innerHTML = `
        <li class="recommendation-item">
          <i class="fa-solid fa-trophy rec-icon" style="color:#10b981;"></i>
          <div class="rec-content">
            <h5>Resume Meets High ATS Standards</h5>
            <p>Your resume matches all core competencies and structure. Proceed to application with confidence.</p>
          </div>
        </li>
      `;
      return;
    }

    list.innerHTML = suggestions.map(sug => `
      <li class="recommendation-item">
        <i class="fa-solid ${sug.icon || 'fa-lightbulb'} rec-icon"></i>
        <div class="rec-content">
          <h5>${escapeHtml(sug.title)}</h5>
          <p>${escapeHtml(sug.description)}</p>
        </div>
      </li>
    `).join('');
  }

  /**
   * Renders the Career Advisory & Job Matching section
   */
  function renderCareerAdvisory(careerFit) {
    if (!careerFit) return;

    // 1. Render Hero Primary Match Card
    const heroCard = document.getElementById('career-hero-card');
    if (heroCard && careerFit.primaryRole) {
      const p = careerFit.primaryRole;
      heroCard.innerHTML = `
        <div class="career-hero-top">
          <div class="career-role-title-group">
            <div class="career-role-eyebrow">
              <i class="fa-solid fa-crown" style="color:#eab308;"></i> Highest Compatibility Match
            </div>
            <h3 class="career-role-title">${escapeHtml(p.title)}</h3>
            <div class="career-hero-badges">
              <span class="pill-badge" style="background:var(--success-bg); color:#065f46; border-color:var(--success-border); font-size:0.75rem;">
                <i class="fa-solid fa-layer-group"></i> ${escapeHtml(p.level)} Tier
              </span>
              <span class="pill-badge" style="font-size:0.75rem;">
                <i class="fa-solid fa-sparkles" style="color:var(--primary);"></i> ${escapeHtml(p.matchTier)}
              </span>
            </div>
          </div>
          <div class="career-score-pill">
            <span class="career-score-pill-number">${p.matchScore}%</span>
            <div class="career-score-pill-label">
              Role Match<br>Affinity
            </div>
          </div>
        </div>

        <div class="career-meta-grid">
          <div class="career-meta-item">
            <span class="career-meta-label"><i class="fa-solid fa-chart-line"></i> Market Demand</span>
            <span class="career-meta-value">${escapeHtml(p.marketDemand)}</span>
          </div>
          <div class="career-meta-item">
            <span class="career-meta-label"><i class="fa-solid fa-money-bill-wave"></i> Typical Compensation</span>
            <span class="career-meta-value" style="color:var(--primary);">${escapeHtml(p.typicalSalaryRange)}</span>
          </div>
          <div class="career-meta-item" style="grid-column: 1 / -1;">
            <span class="career-meta-label"><i class="fa-solid fa-compass"></i> Role Foundation</span>
            <span class="career-meta-value" style="font-weight: 500; font-size: 0.88rem; color: var(--text-body); line-height: 1.5;">${escapeHtml(p.summary)}</span>
          </div>
        </div>

        <div class="career-hero-why">
          <h4><i class="fa-solid fa-circle-check" style="color:var(--success);"></i> Why This Job Is Perfect For You</h4>
          <ul>
            ${p.whyPerfect.map(item => `
              <li>
                <i class="fa-solid fa-check"></i>
                <span>${escapeHtml(item)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // 2. Render Adjacent / Alternative Roles Grid
    const adjacentGrid = document.getElementById('adjacent-roles-grid');
    if (adjacentGrid && Array.isArray(careerFit.adjacentRoles)) {
      adjacentGrid.innerHTML = careerFit.adjacentRoles.map(role => `
        <div class="adjacent-role-card">
          <div>
            <div class="adjacent-role-top">
              <h4 class="adjacent-role-title">${escapeHtml(role.title)}</h4>
              <span class="adjacent-role-score">${role.matchScore}% Match</span>
            </div>
            <p class="adjacent-role-desc">${escapeHtml(role.reason)}</p>
          </div>
          <div class="adjacent-role-bridge">
            <i class="fa-solid fa-arrow-right" style="color:var(--primary); margin-right:4px;"></i> Key Bridge Skill: <strong>${escapeHtml(role.keyBridgeSkill)}</strong>
          </div>
        </div>
      `).join('');
    }

    // 3. Render 4-Phase Chronological Roadmap
    const roadmapTimeline = document.getElementById('roadmap-timeline');
    const roadmapRoleBadge = document.getElementById('roadmap-role-badge');
    if (roadmapRoleBadge && careerFit.roadmap) {
      roadmapRoleBadge.textContent = careerFit.roadmap.targetRoleTitle;
    }

    if (roadmapTimeline && careerFit.roadmap && Array.isArray(careerFit.roadmap.phases)) {
      roadmapTimeline.innerHTML = careerFit.roadmap.phases.map(phase => {
        let bodyHtml = '';

        if (phase.phase === 1) {
          // Resume Refinements
          bodyHtml = `
            <div class="roadmap-items-list">
              ${phase.actions.map(act => `
                <div class="roadmap-action-box">
                  <div class="roadmap-action-box-title">
                    <i class="fa-solid fa-check-circle" style="color:var(--primary);"></i>
                    <span>${escapeHtml(act.label)}</span>
                  </div>
                  <div class="roadmap-action-box-desc">${escapeHtml(act.detail)}</div>
                </div>
              `).join('')}
            </div>
          `;
        } else if (phase.phase === 2) {
          // Skill Bridging
          bodyHtml = `
            <div class="roadmap-items-list">
              ${phase.actions.map(act => `
                <div class="roadmap-action-box">
                  <div class="roadmap-action-box-title" style="justify-content: space-between;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      <i class="fa-solid fa-bolt" style="color:#f59e0b;"></i>
                      <span>${escapeHtml(act.skill)}</span>
                    </div>
                    <span class="pill-badge" style="font-size:0.7rem; background:#fffbeb; color:#b45309; border-color:#fde68a;">
                      <i class="fa-regular fa-clock"></i> ~${escapeHtml(act.timeEstimate)}
                    </span>
                  </div>
                  <div class="roadmap-action-box-desc">${escapeHtml(act.objective)}</div>
                </div>
              `).join('')}
            </div>
          `;
        } else if (phase.phase === 3) {
          // Portfolio Project Blueprint
          const bp = phase.projectBlueprint;
          bodyHtml = `
            <div class="roadmap-action-box" style="background:#ffffff; border-color:rgba(99, 102, 241, 0.3);">
              <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                <h5 style="font-size:0.95rem; font-weight:800; color:var(--text-main); margin:0;">
                  <i class="fa-solid fa-laptop-code" style="color:var(--primary); margin-right:6px;"></i>
                  ${escapeHtml(bp.name)}
                </h5>
                <span class="pill-badge" style="font-size:0.7rem; background:var(--gradient-soft); color:var(--primary);">
                  Flagship Proof-of-Work
                </span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px; line-height:1.5;">
                ${escapeHtml(bp.concept)}
              </p>
              <div style="margin-bottom:12px;">
                <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.04em;">Recommended Tech Stack:</span>
                <div class="blueprint-meta-row">
                  ${bp.techStack.map(tech => `
                    <span class="pill-badge" style="font-size:0.75rem; background:#f1f5f9; color:var(--text-body); border-color:#e2e8f0;">${escapeHtml(tech)}</span>
                  `).join('')}
                </div>
              </div>
              <div>
                <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.04em;">Key Deliverables to Prove Competence:</span>
                <ul class="blueprint-deliverables-list">
                  ${bp.deliverables.map(d => `
                    <li>
                      <i class="fa-solid fa-circle-check"></i>
                      <span>${escapeHtml(d)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          `;
        } else if (phase.phase === 4) {
          // Interview Mastery
          bodyHtml = `
            <div class="roadmap-items-list">
              ${phase.actions.map(act => `
                <div class="roadmap-action-box">
                  <div class="roadmap-action-box-title">
                    <i class="fa-solid fa-comments" style="color:var(--primary);"></i>
                    <span>${escapeHtml(act.topic)}</span>
                  </div>
                  <div class="roadmap-action-box-desc">${escapeHtml(act.tips)}</div>
                </div>
              `).join('')}
            </div>
          `;
        }

        return `
          <div class="roadmap-step">
            <div class="roadmap-step-badge">
              <i class="fa-solid ${phase.icon || 'fa-check'}"></i>
            </div>
            <div class="roadmap-step-content">
              <div class="roadmap-step-title-row">
                <h4 class="roadmap-step-title">
                  <span>Phase ${phase.phase}:</span> ${escapeHtml(phase.title)}
                </h4>
                <span class="roadmap-timeframe-badge">
                  <i class="fa-regular fa-calendar-check"></i> ${escapeHtml(phase.timeframe)}
                </span>
              </div>
              ${bodyHtml}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  /**
   * Resets the entire analyzer form and state
   */
  function resetAll() {
    clearSelectedFile();
    const jobDescInput = document.getElementById('job-desc-input');
    const charCountEl = document.getElementById('char-count');
    const results = document.getElementById('results-section');
    const btnResetTop = document.getElementById('btn-reset-top');

    if (jobDescInput) jobDescInput.value = '';
    if (charCountEl) charCountEl.textContent = '0 characters';
    if (results) results.classList.remove('active');
    if (btnResetTop) btnResetTop.style.display = 'none';

    clearValidationError();
    hideOcrWarning();
    lastAnalysis = null;

    if (skillChartInstance) {
      skillChartInstance.destroy();
      skillChartInstance = null;
    }
    if (scoreBreakdownChartInstance) {
      scoreBreakdownChartInstance.destroy();
      scoreBreakdownChartInstance = null;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.showToast) window.showToast('Analyzer reset. Ready for new resume upload.', 'info');
  }

  /**
   * Downloads the generated ATS report
   */
  function downloadReport() {
    if (!lastAnalysis) {
      if (window.showToast) window.showToast('No active analysis to download.', 'error');
      return;
    }

    const docName = currentFile ? currentFile.name : 'Resume.pdf';
    const reportText = window.AtsEngine.generateReport(lastAnalysis, docName);

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ResumeX_ATS_Report_${docName.replace(/\.[^/.]+$/, '')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast('Official ATS compliance report downloaded successfully!', 'success');
    }
  }

  /**
   * Saves completed analysis to localStorage for Dashboard synchronization
   */
  function saveAnalysisToStorage(analysis, fileName, jobDesc) {
    try {
      const scans = JSON.parse(localStorage.getItem('resumex_scans') || '[]');
      const firstLine = jobDesc.split('\n')[0].replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      const jobTitle = firstLine.substring(0, 32) || 'Target Software Role';
      const targetRole = (analysis.careerFit && analysis.careerFit.primaryRole)
        ? analysis.careerFit.primaryRole.title
        : jobTitle;

      const scanEntry = {
        fileName: fileName,
        jobTitle: jobTitle,
        targetRole: targetRole,
        overallScore: analysis.overallScore,
        verdict: analysis.verdict,
        careerFit: analysis.careerFit || null,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        matchedCount: analysis.matchedSkills.length + analysis.matchedKeywords.length,
        missingCount: analysis.missingSkills.length + analysis.missingKeywords.length,
        timestamp: Date.now()
      };

      scans.unshift(scanEntry);
      if (scans.length > 20) scans.pop();
      localStorage.setItem('resumex_scans', JSON.stringify(scans));

      // Optional cloud sync if Supabase is configured and user is authenticated
      if (window.SupabaseConfig && window.SupabaseConfig.isSupabaseConfigured()) {
        const client = window.SupabaseConfig.getClient();
        if (client) {
          client.auth.getUser().then(({ data: userData }) => {
            if (userData && userData.user) {
              client.from('scans').insert({
                user_id: userData.user.id,
                file_name: fileName,
                job_title: jobTitle,
                overall_score: analysis.overallScore,
                verdict: analysis.verdict,
                scores: analysis.scores,
                matched_skills: analysis.matchedSkills,
                missing_skills: analysis.missingSkills,
                created_at: new Date().toISOString()
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Could not persist scan to localStorage:', e);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
