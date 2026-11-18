/**
 * CareerGuide.AI - Dashboard Controller
 * Authenticated user view: guards access with AuthManager.requireAuth(),
 * displays logged-in user profile, fetches scan history from Supabase / localStorage,
 * and renders interactive Chart.js metrics and historical scan tables.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await initDashboard();
});

async function initDashboard() {
  // 1. Guard route: redirect if not authenticated
  let user = null;
  if (window.AuthManager && window.AuthManager.requireAuth) {
    user = await window.AuthManager.requireAuth({ redirectTo: 'login.html' });
    if (!user) {
      // Redirection to login.html?redirect=dashboard.html&reason=unauthenticated in progress
      return;
    }
  }

  // 2. Populate Authenticated User Profile Banner
  updateUserProfileDisplay(user);

  // 3. Bind Logout button
  const logoutBtn = document.getElementById('btn-dash-logout');
  if (logoutBtn && window.AuthManager) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await window.AuthManager.signOut('login.html');
    });
  }

  // 4. Fetch scan history: Supabase cloud first, localStorage fallback
  const scans = await loadScansForUser(user);

  const emptyState = document.getElementById('dashboard-empty-state');
  const populatedState = document.getElementById('dashboard-populated-state');
  const btnClearHistory = document.getElementById('btn-clear-history');

  if (scans.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (populatedState) populatedState.style.display = 'none';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    if (populatedState) populatedState.style.display = 'block';
    renderDashboardMetrics(scans);
    renderDashboardCharts(scans);
    renderScansTable(scans);
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your scan history?')) {
        localStorage.removeItem('careerguide_scans');
        localStorage.removeItem('resumex_scans');
        if (window.SupabaseConfig && window.SupabaseConfig.isSupabaseConfigured() && user && user.id) {
          const client = window.SupabaseConfig.getClient();
          if (client) {
            try {
              await client.from('scans').delete().eq('user_id', user.id);
            } catch (e) {
              console.warn('Could not clear remote scans:', e);
            }
          }
        }
        if (window.showToast) window.showToast('Scan history cleared', 'info');
        setTimeout(() => window.location.reload(), 500);
      }
    });
  }

  // Supabase Status and Test in Dashboard
  initSupabaseDashboardStatus();
}

/**
 * Updates user profile name, email, and authentication badge
 * @param {Object} user 
 */
function updateUserProfileDisplay(user) {
  const nameEl = document.getElementById('dash-user-name');
  const emailEl = document.getElementById('dash-user-email');
  const badgeEl = document.getElementById('dash-auth-badge');

  if (!user) return;

  const fullName = user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   (user.email ? user.email.split('@')[0] : 'Applicant');
  const email = user.email || 'user@example.com';
  const isCloud = window.SupabaseConfig && window.SupabaseConfig.isSupabaseConfigured();

  if (nameEl) nameEl.textContent = fullName;
  if (emailEl) emailEl.textContent = email;
  if (badgeEl) {
    if (isCloud) {
      badgeEl.textContent = 'Supabase Verified';
      badgeEl.style.background = 'var(--success-bg)';
      badgeEl.style.color = '#34d399';
      badgeEl.style.borderColor = 'var(--success-border)';
    } else {
      badgeEl.textContent = 'Local Session Active';
      badgeEl.style.background = 'var(--primary-light)';
      badgeEl.style.color = '#a5b4fc';
      badgeEl.style.borderColor = 'rgba(99, 102, 241, 0.3)';
    }
  }
}

/**
 * Loads scans for current user: queries Supabase cloud 'scans' table first,
 * falls back to localStorage 'resumex_scans'
 * @param {Object} user 
 * @returns {Promise<Array>}
 */
async function loadScansForUser(user) {
  // Try Supabase cloud 'scans' table if configured and user id available
  if (window.SupabaseConfig && window.SupabaseConfig.isSupabaseConfigured() && user && user.id) {
    const client = window.SupabaseConfig.getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(s => ({
            id: s.id,
            fileName: s.file_name || 'Resume Document',
            jobTitle: s.job_title || 'Software Engineering Role',
            overallScore: Number(s.overall_score) || 0,
            verdict: s.verdict || 'Analysis Complete',
            date: s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            matchedCount: Array.isArray(s.matched_skills) ? s.matched_skills.length : (s.matched_count || 0),
            missingCount: Array.isArray(s.missing_skills) ? s.missing_skills.length : (s.missing_count || 0),
            timestamp: s.created_at ? new Date(s.created_at).getTime() : Date.now()
          }));
        }
      } catch (err) {
        console.warn('Supabase scans query note:', err);
      }
    }
  }

  // Fallback to localStorage
  const scansJson = localStorage.getItem('careerguide_scans') || localStorage.getItem('resumex_scans');
  try {
    return scansJson ? JSON.parse(scansJson) : [];
  } catch (e) {
    console.warn('Error reading local scans:', e);
    return [];
  }
}

function initSupabaseDashboardStatus() {
  const dot = document.getElementById('supabase-indicator-dot');
  const text = document.getElementById('supabase-indicator-text');
  const testBtn = document.getElementById('btn-test-supabase-dash');

  function updateStatus() {
    const isConfigured = window.SupabaseConfig && window.SupabaseConfig.isSupabaseConfigured();
    if (dot && text) {
      if (isConfigured) {
        dot.style.color = '#10b981';
        text.textContent = 'Supabase Cloud: Ready & Connected';
      } else {
        dot.style.color = '#f59e0b';
        text.textContent = 'Supabase Cloud: Ready (Credentials pending in supabase-config.js)';
      }
    }
  }

  updateStatus();

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      if (!window.SupabaseConfig) return;
      window.showToast('Testing Supabase cloud connection...', 'info');
      const res = await window.SupabaseConfig.testSupabaseConnection();
      if (res.success) {
        window.showToast('Supabase Connected! Project API is active.', 'success');
      } else {
        window.showToast(res.message, 'error');
      }
      updateStatus();
    });
  }
}

function renderDashboardMetrics(scans) {
  const countEl = document.getElementById('metric-total-scans');
  const highEl = document.getElementById('metric-highest-score');
  const avgEl = document.getElementById('metric-avg-score');
  const keywordsEl = document.getElementById('metric-total-matched');

  const totalScans = scans.length;
  const scores = scans.map(s => Number(s.overallScore) || 0);
  const highest = Math.max(...scores);
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / totalScans);
  const totalMatchedKeywords = scans.reduce((acc, s) => acc + (Number(s.matchedCount) || 0), 0);

  if (countEl) countEl.textContent = totalScans;
  if (highEl) highEl.textContent = `${highest}%`;
  if (avgEl) avgEl.textContent = `${average}%`;
  if (keywordsEl) keywordsEl.textContent = totalMatchedKeywords;

  // Render Career Trajectory Highlight Banner if scans exist
  const careerBanner = document.getElementById('dash-career-role-banner');
  const primaryTitleEl = document.getElementById('dash-primary-role-title');
  const primaryDescEl = document.getElementById('dash-primary-role-desc');
  const targetBadge = document.getElementById('dash-target-role-badge');

  if (scans.length > 0 && careerBanner) {
    const latest = scans[0];
    const roleTitle = latest.targetRole || latest.careerFit?.primaryRole?.title || latest.jobTitle;
    const matchScore = latest.careerFit?.primaryRole?.matchScore || latest.overallScore;

    if (roleTitle) {
      careerBanner.style.display = 'flex';
      if (primaryTitleEl) primaryTitleEl.textContent = roleTitle;
      if (targetBadge) targetBadge.textContent = `${matchScore}% Fit Match`;
      if (primaryDescEl && latest.careerFit?.primaryRole?.summary) {
        primaryDescEl.textContent = latest.careerFit.primaryRole.summary;
      }
    }
  }
}

function renderDashboardCharts(scans) {
  if (typeof Chart === 'undefined') return;

  // 1. History Trend Chart
  const historyCtx = document.getElementById('historyChart')?.getContext('2d');
  if (historyCtx) {
    const reversedScans = [...scans].reverse();
    const labels = reversedScans.map((s, idx) => `Scan #${idx + 1} (${s.jobTitle?.substring(0, 15) || 'Role'})`);
    const data = reversedScans.map(s => s.overallScore);

    new Chart(historyCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ATS Match Score (%)',
          data: data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#12141c',
          pointRadius: 5,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            ticks: { color: '#94a3b8', stepSize: 20 }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // 2. Score Breakdown Doughnut Chart
  const doughnutCtx = document.getElementById('doughnutChart')?.getContext('2d');
  if (doughnutCtx) {
    let tierHigh = 0;
    let tierMid = 0;
    let tierLow = 0;

    scans.forEach(s => {
      const score = Number(s.overallScore);
      if (score >= 85) tierHigh++;
      else if (score >= 70) tierMid++;
      else tierLow++;
    });

    new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Tier 1 (85%+ High)', 'Tier 2 (70-84% Moderate)', 'Tier 3 (<70% Low)'],
        datasets: [{
          data: [tierHigh, tierMid, tierLow],
          backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
          borderWidth: 2,
          borderColor: '#12141c'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        },
        cutout: '68%'
      }
    });
  }
}

function renderScansTable(scans) {
  const tbody = document.getElementById('scans-table-body');
  if (!tbody) return;

  tbody.innerHTML = scans.map((scan, index) => {
    let badgeClass = 'tag-chip matched';
    let statusText = 'Excellent';
    if (scan.overallScore < 70) {
      badgeClass = 'tag-chip missing';
      statusText = 'Needs Focus';
    } else if (scan.overallScore < 85) {
      badgeClass = 'pill-badge';
      statusText = 'Competitive';
    }

    return `
      <tr>
        <td style="font-weight: 600;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i>
            <span>${escapeHtml(scan.fileName)}</span>
          </div>
        </td>
        <td>${escapeHtml(scan.targetRole || scan.jobTitle || 'General Software Engineering')}</td>
        <td>
          <span style="font-weight: 800; font-size: 1.05rem; color: ${scan.overallScore >= 80 ? '#10b981' : '#4f46e5'};">
            ${scan.overallScore}%
          </span>
        </td>
        <td>
          <span class="${badgeClass}" style="font-size: 0.75rem; padding: 3px 8px;">
            ${statusText}
          </span>
        </td>
        <td>
          <span style="font-size: 0.82rem; color: #10b981; font-weight: 600;">${scan.matchedCount || 0} matched</span> / 
          <span style="font-size: 0.82rem; color: #b45309; font-weight: 600;">${scan.missingCount || 0} missing</span>
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${scan.date}</td>
        <td>
          <a href="analyzer.html" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;" title="Run new analysis">
            <i class="fa-solid fa-arrow-rotate-right"></i> Re-test
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
