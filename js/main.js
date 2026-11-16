/**
 * ResumeX AI - Main Application Script
 * Handles global UI, navigation, header states, and notifications
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeaderScroll();
  initFooterYear();
  initAuthState();
});

/**
 * Initializes mobile menu toggle and active page highlighting
 */
function initNavigation() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
      toggleBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });

    // Close on link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
      });
    });
  }

  // Active page link detection
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/**
 * Adds shadow & background opacity on scroll
 */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * Sets current year in footer
 */
function initFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * Checks client-side auth state in localStorage
 */
function initAuthState() {
  const userJson = localStorage.getItem('resumex_user');
  const authBtn = document.getElementById('nav-auth-btn');

  if (userJson && authBtn) {
    try {
      const user = JSON.parse(userJson);
      const name = user.name || (user.email ? user.email.split('@')[0] : 'Member');
      authBtn.innerHTML = `<i class="fa-solid fa-user-circle"></i> ${name}`;
      authBtn.setAttribute('href', 'dashboard.html');
      authBtn.classList.remove('btn-secondary');
      authBtn.classList.add('btn-ghost');
    } catch (e) {
      console.warn('Could not parse user session:', e);
    }
  }
}

/**
 * Displays global toast notification
 * @param {string} message - Message to display
 * @param {'info' | 'success' | 'error'} type - Notification type
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'circle-info';
  if (type === 'success') icon = 'circle-check';
  if (type === 'error') icon = 'circle-exclamation';

  toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3500);
}

// Export showToast globally
window.showToast = showToast;
