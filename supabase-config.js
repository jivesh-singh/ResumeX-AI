/**
 * ============================================================================
 * ResumeX AI - Supabase Configuration & Client Provider
 * ============================================================================
 * 
 * ⚠️ SECURITY INSTRUCTIONS:
 * 1. Enter your Supabase Project URL and Public Anon Key below.
 * 2. NEVER put your 'service_role' key, database password, or secret keys here!
 *    The 'anon' key is designed to be public and safe for frontend browsers
 *    when protected by Row Level Security (RLS).
 * 3. Find your keys in:
 *    Supabase Dashboard -> Project Settings -> API
 *    - Project URL: e.g. https://your-project-id.supabase.co
 *    - Project API Keys: 'anon' (public)
 * ============================================================================
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.supabaseClient = exports.supabase;
    root.SupabaseConfig = exports;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================================================
  // 🔑 ENTER YOUR SUPABASE CREDENTIALS HERE
  // ==========================================================================

  // Step 1: Replace with your actual Project URL (starts with https:// and ends with .supabase.co)
  const SUPABASE_URL = 'https://emudvzwoszmgzekptmzc.supabase.co';

  // Step 2: Replace with your actual anon / public key (starts with eyJ...)
  const SUPABASE_ANON_KEY = 'sb_publishable_whDqzJTzNq2cPGYm0Q7bvw_P82wb8lT';

  // ==========================================================================
  // Helper: Verify if user has replaced placeholder credentials
  // ==========================================================================
  function isSupabaseConfigured() {
    const isDefaultUrl = !SUPABASE_URL ||
      SUPABASE_URL.includes('YOUR_PROJECT_ID') ||
      !SUPABASE_URL.startsWith('https://');

    const isDefaultKey = !SUPABASE_ANON_KEY ||
      SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON') ||
      SUPABASE_ANON_KEY.length < 20;

    return !isDefaultUrl && !isDefaultKey;
  }

  // ==========================================================================
  // Client Instantiation
  // ==========================================================================
  let clientInstance = null;

  function initClient() {
    if (clientInstance) return clientInstance;

    // Check if official Supabase JS is loaded
    let createClientFn = null;

    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      createClientFn = window.supabase.createClient;
    } else if (typeof require === 'function') {
      try {
        const supabasePkg = require('@supabase/supabase-js');
        createClientFn = supabasePkg.createClient;
      } catch (e) {
        // Handled below
      }
    }

    if (!createClientFn) {
      return null;
    }

    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      clientInstance = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return clientInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  // Initialize client if credentials are ready
  const client = initClient();

  // ==========================================================================
  // Live Connection Tester
  // ==========================================================================
  async function testSupabaseConnection() {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        configured: false,
        status: 'PENDING_CREDENTIALS',
        message: 'Supabase credentials are not configured. Please open supabase-config.js and replace the placeholder URL and anon key.',
        url: SUPABASE_URL,
        hasValidUrl: !SUPABASE_URL.includes('YOUR_PROJECT_ID'),
        hasValidKey: !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON')
      };
    }

    // Try using instantiated Supabase client
    const activeClient = initClient();
    if (activeClient) {
      try {
        // Health check ping: fetch current auth session or ping REST root
        const { data, error } = await activeClient.auth.getSession();
        if (error) {
          return {
            success: false,
            configured: true,
            status: 'AUTH_ERROR',
            message: `Supabase authentication error: ${error.message}`,
            error: error
          };
        }

        return {
          success: true,
          configured: true,
          status: 'CONNECTED',
          message: 'Successfully connected to Supabase project! Client is ready for Auth, Database, and Storage operations.',
          url: SUPABASE_URL,
          sessionActive: !!(data && data.session)
        };
      } catch (err) {
        return {
          success: false,
          configured: true,
          status: 'NETWORK_ERROR',
          message: `Network connection failed: ${err.message}`,
          error: err
        };
      }
    }

    // Fallback: Direct HTTPS REST ping if SDK is still loading
    if (typeof fetch !== 'undefined') {
      try {
        const pingUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/`;
        const response = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });

        // A 200 or 401/404 with OpenAPI spec confirms the project endpoint is live
        if (response.ok || response.status === 200 || response.status === 404) {
          return {
            success: true,
            configured: true,
            status: 'CONNECTED',
            statusCode: response.status,
            message: 'Successfully connected to Supabase REST endpoint!',
            url: SUPABASE_URL
          };
        } else {
          return {
            success: false,
            configured: true,
            status: 'HTTP_ERROR',
            statusCode: response.status,
            message: `Supabase server responded with status: ${response.status} ${response.statusText}`,
            url: SUPABASE_URL
          };
        }
      } catch (err) {
        return {
          success: false,
          configured: true,
          status: 'FETCH_ERROR',
          message: `Could not reach Supabase URL (${SUPABASE_URL}): ${err.message}`,
          error: err
        };
      }
    }

    return {
      success: false,
      configured: true,
      status: 'CLIENT_NOT_INITIALIZED',
      message: 'Supabase client could not be initialized. Ensure @supabase/supabase-js library is loaded.'
    };
  }

  // ==========================================================================
  // Public Exports
  // ==========================================================================
  return {
    supabase: client,
    getClient: initClient,
    isSupabaseConfigured: isSupabaseConfigured,
    testSupabaseConnection: testSupabaseConnection,
    getConfig: function () {
      return {
        url: SUPABASE_URL,
        isConfigured: isSupabaseConfigured(),
        keyPreview: SUPABASE_ANON_KEY.substring(0, 10) + '...'
      };
    }
  };
});
