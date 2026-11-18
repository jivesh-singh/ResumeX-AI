/**
 * ============================================================================
 * CareerGuide.AI - Supabase Authentication & Session Management Module
 * ============================================================================
 * 
 * Handles real Supabase email/password registration, login, logout,
 * session persistence, route protection, and navigation state.
 * Uses official Supabase Auth (@supabase/supabase-js).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AuthManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Helper: Retrieve initialized Supabase client
   * @returns {Object|null}
   */
  function getClient() {
    if (typeof window !== 'undefined' && window.SupabaseConfig && typeof window.SupabaseConfig.getClient === 'function') {
      return window.SupabaseConfig.getClient();
    }
    if (typeof window !== 'undefined' && window.supabaseClient) {
      return window.supabaseClient;
    }
    if (typeof global !== 'undefined' && global.SupabaseConfig && typeof global.SupabaseConfig.getClient === 'function') {
      return global.SupabaseConfig.getClient();
    }
    return null;
  }

  /**
   * Helper: Check if Supabase has real credentials configured
   * @returns {boolean}
   */
  function isConfigured() {
    if (typeof window !== 'undefined' && window.SupabaseConfig && typeof window.SupabaseConfig.isSupabaseConfigured === 'function') {
      return window.SupabaseConfig.isSupabaseConfigured();
    }
    if (typeof global !== 'undefined' && global.SupabaseConfig && typeof global.SupabaseConfig.isSupabaseConfigured === 'function') {
      return global.SupabaseConfig.isSupabaseConfigured();
    }
    return false;
  }

  /**
   * Translates Supabase authentication error codes into clear user-friendly messages
   * @param {Object|string} error
   * @returns {string}
   */
  function mapAuthError(error) {
    if (!error) return 'An unexpected authentication error occurred.';
    const msg = (typeof error === 'string' ? error : (error.message || '')).toLowerCase();

    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Incorrect email or password. Please verify your credentials and try again.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (msg.includes('password should be at least') || msg.includes('weak password')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Your email address has not been confirmed yet. Please check your inbox for the Supabase confirmation link.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Too many attempts. Please wait a few moments before trying again.';
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Network connection error. Please verify your internet connection and Supabase URL.';
    }

    return error.message || 'Authentication failed. Please try again.';
  }

  /**
   * Registers a new user with Supabase Auth and creates a database profile
   * @param {string} email
   * @param {string} password
   * @param {string} fullName
   * @returns {Promise<{ success: boolean, user?: Object, session?: Object, confirmationRequired?: boolean, error?: string }>}
   */
  async function signUp(email, password, fullName) {
    const client = getClient();
    if (!client) {
      return {
        success: false,
        error: 'Supabase client is not configured. Please enter your Project URL and anon key in supabase-config.js.'
      };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      const user = data.user;
      const session = data.session;

      // Create / upsert profile record in 'profiles' table if session active
      if (user && session) {
        try {
          await client.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName.trim(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (profileErr) {
          console.warn('Profile table sync note (create table profiles in Supabase if not present):', profileErr);
        }
      }

      // If email confirmation is enabled in Supabase project
      const confirmationRequired = !session;

      return {
        success: true,
        user: user,
        session: session,
        confirmationRequired: confirmationRequired
      };
    } catch (err) {
      return {
        success: false,
        error: mapAuthError(err)
      };
    }
  }

  /**
   * Signs in an existing user with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, user?: Object, session?: Object, error?: string }>}
   */
  async function signIn(email, password) {
    const client = getClient();
    if (!client) {
      return {
        success: false,
        error: 'Supabase client is not configured. Please enter your Project URL and anon key in supabase-config.js.'
      };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        return {
          success: false,
          error: mapAuthError(error)
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (err) {
      return {
        success: false,
        error: mapAuthError(err)
      };
    }
  }

  /**
   * Signs out current user from Supabase and redirects to login
   * @param {string} [redirectTo='login.html']
   * @returns {Promise<void>}
   */
  async function signOut(redirectTo = 'login.html') {
    const client = getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }

    // Clear any local offline demo user state
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('careerguide_demo_user');
      localStorage.removeItem('resumex_demo_user');
    }

    if (typeof window !== 'undefined') {
      if (window.showToast) window.showToast('You have been signed out.', 'info');
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 400);
    }
  }

  /**
   * Retrieves active Supabase session
   * @returns {Promise<Object|null>}
   */
  async function getSession() {
    const client = getClient();
    if (!client) return null;

    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data) return null;
      return data.session;
    } catch (err) {
      console.warn('Error reading Supabase session:', err);
      return null;
    }
  }

  /**
   * Retrieves current authenticated Supabase user
   * @returns {Promise<Object|null>}
   */
  async function getCurrentUser() {
    const client = getClient();
    if (!client) {
      // Check offline demo fallback
      if (typeof localStorage !== 'undefined') {
        const demo = localStorage.getItem('careerguide_demo_user') || localStorage.getItem('resumex_demo_user');
        if (demo) {
          try { return JSON.parse(demo); } catch (e) { return null; }
        }
      }
      return null;
    }

    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data || !data.user) {
        // Fallback: check session if getUser fails
        const session = await getSession();
        return session ? session.user : null;
      }
      return data.user;
    } catch (err) {
      console.warn('Error getting Supabase user:', err);
      return null;
    }
  }

  /**
   * Route Guard: Protects pages (e.g. dashboard.html).
   * Redirects unauthenticated visitors to login.html with a redirect parameter.
   * @param {Object} [options]
   * @param {string} [options.redirectTo='login.html']
   * @returns {Promise<Object|null>} returns authenticated user or redirects
   */
  async function requireAuth(options = {}) {
    const redirectTo = options.redirectTo || 'login.html';

    // Check if client is configured
    if (!isConfigured()) {
      // In unconfigured state, check if user activated offline demo mode
      if (typeof localStorage !== 'undefined') {
        const demoUser = localStorage.getItem('careerguide_demo_user') || localStorage.getItem('resumex_demo_user');
        if (demoUser) {
          try {
            return JSON.parse(demoUser);
          } catch (e) {
            // Fall through to redirect
          }
        }
      }

      // If not even in demo mode, redirect to login
      if (typeof window !== 'undefined') {
        const currentPath = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
        window.location.href = `${redirectTo}?redirect=${currentPath}&reason=unauthenticated`;
      }
      return null;
    }

    const session = await getSession();
    if (!session || !session.user) {
      if (typeof window !== 'undefined') {
        const currentPath = encodeURIComponent(window.location.pathname.split('/').pop() || 'dashboard.html');
        window.location.href = `${redirectTo}?redirect=${currentPath}&reason=unauthenticated`;
      }
      return null;
    }

    return session.user;
  }

  /**
   * Redirects already logged-in users away from login.html to dashboard.html
   * @param {string} [target='dashboard.html']
   */
  async function redirectIfAuthenticated(target = 'dashboard.html') {
    if (!isConfigured()) return;

    const session = await getSession();
    if (session && session.user && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      const destination = redirectParam ? decodeURIComponent(redirectParam) : target;
      window.location.href = destination;
    }
  }

  /**
   * Synchronizes navigation bar across pages based on Supabase session state
   */
  async function updateNavigation() {
    if (typeof document === 'undefined') return;

    const navAuthContainer = document.querySelector('.nav-actions');
    const existingAuthBtn = document.getElementById('nav-auth-btn');
    if (!navAuthContainer) return;

    const user = await getCurrentUser();

    if (user) {
      const fullName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       (user.email ? user.email.split('@')[0] : 'Member');
      const email = user.email || '';

      // Replace or update Sign In button with User dropdown / Sign out
      if (existingAuthBtn) {
        existingAuthBtn.style.display = 'none';
      }

      let userNavGroup = document.getElementById('nav-user-group');
      if (!userNavGroup) {
        userNavGroup = document.createElement('div');
        userNavGroup.id = 'nav-user-group';
        userNavGroup.className = 'nav-user-group';
        userNavGroup.style.display = 'flex';
        userNavGroup.style.alignItems = 'center';
        userNavGroup.style.gap = '10px';

        userNavGroup.innerHTML = `
          <a href="dashboard.html" class="btn btn-ghost btn-sm" id="nav-user-profile-link" title="${escapeHtml(email)}" style="font-weight: 600;">
            <i class="fa-solid fa-circle-user" style="color: var(--primary); font-size: 1.1rem;"></i>
            <span id="nav-user-name">${escapeHtml(fullName)}</span>
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-nav-signout" title="Sign out of Supabase">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Sign Out</span>
          </button>
        `;

        navAuthContainer.insertBefore(userNavGroup, navAuthContainer.firstChild);

        const signoutBtn = document.getElementById('btn-nav-signout');
        if (signoutBtn) {
          signoutBtn.addEventListener('click', () => {
            signOut('login.html');
          });
        }
      } else {
        const nameEl = document.getElementById('nav-user-name');
        if (nameEl) nameEl.textContent = fullName;
      }
    } else {
      // Logged out
      const userNavGroup = document.getElementById('nav-user-group');
      if (userNavGroup) userNavGroup.remove();
      if (existingAuthBtn) {
        existingAuthBtn.style.display = 'inline-flex';
        existingAuthBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In';
        existingAuthBtn.setAttribute('href', 'login.html');
      }
    }
  }

  /**
   * Password visibility toggle utility
   * @param {HTMLInputElement} inputEl
   * @param {HTMLElement} toggleBtn
   */
  function setupPasswordToggle(inputEl, toggleBtn) {
    if (!inputEl || !toggleBtn) return;

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isPassword = inputEl.type === 'password';
      inputEl.type = isPassword ? 'text' : 'password';

      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
      toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Auto-listen to auth state changes if running in browser
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      const client = getClient();
      if (client && client.auth) {
        client.auth.onAuthStateChange((event, session) => {
          updateNavigation();
        });
      }
      updateNavigation();
    });
  }

  return {
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    requireAuth: requireAuth,
    redirectIfAuthenticated: redirectIfAuthenticated,
    updateNavigation: updateNavigation,
    mapAuthError: mapAuthError,
    setupPasswordToggle: setupPasswordToggle,
    isConfigured: isConfigured
  };
});
