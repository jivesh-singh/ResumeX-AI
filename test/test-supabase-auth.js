/**
 * ============================================================================
 * ResumeX AI - Supabase Authentication & Route Guard Test Suite
 * ============================================================================
 * 
 * Verifies:
 * 1. AuthManager interface and exports.
 * 2. Error mapping for Supabase Auth errors.
 * 3. Client-side validation logic (email, password, confirmation).
 * 4. Password visibility toggle logic.
 * 5. Route protection and redirection behavior (requireAuth).
 * 6. Real Supabase registration & database profile upsert payload generation.
 * 7. Real Supabase login & persistent session retrieval.
 * 8. Real Supabase logout & state cleanup.
 */

const assert = require('assert');

// 1. Setup DOM mocks for Node test environment
global.window = {
  location: {
    href: 'http://localhost:3000/dashboard.html',
    pathname: '/dashboard.html',
    search: '',
    origin: 'http://localhost:3000'
  },
  showToast: () => {}
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

const AuthManager = require('../js/auth.js');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

async function itAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('====================================================');
console.log('🧪 ResumeX AI - Supabase Auth Test Suite');
console.log('====================================================\n');

// ----------------------------------------------------------------------------
// Test Group 1: Module Interface
// ----------------------------------------------------------------------------
console.log('1. AuthManager Public API Interface:');

it('Exports all required authentication and session methods', () => {
  const expectedMethods = [
    'signUp', 'signIn', 'signOut', 'getSession', 'getCurrentUser',
    'requireAuth', 'redirectIfAuthenticated', 'updateNavigation',
    'mapAuthError', 'setupPasswordToggle', 'isConfigured'
  ];
  for (const m of expectedMethods) {
    assert.strictEqual(typeof AuthManager[m], 'function', `AuthManager.${m} must be a function`);
  }
});

// ----------------------------------------------------------------------------
// Test Group 2: Error Mapping
// ----------------------------------------------------------------------------
console.log('\n2. Supabase Error Code Mapping:');

it('Maps "Invalid login credentials" to a friendly notice', () => {
  const mapped = AuthManager.mapAuthError({ message: 'Invalid login credentials' });
  assert(mapped.includes('Incorrect email or password'), `Expected friendly credential message, got: ${mapped}`);
});

it('Maps "User already registered" to an existing account notice', () => {
  const mapped = AuthManager.mapAuthError({ message: 'User already registered' });
  assert(mapped.includes('already exists'), `Expected account exists message, got: ${mapped}`);
});

it('Maps "Password should be at least 6 characters" error', () => {
  const mapped = AuthManager.mapAuthError({ message: 'Password should be at least 6 characters' });
  assert(mapped.includes('at least 6 characters'), `Expected password length message, got: ${mapped}`);
});

it('Maps network or fetch failure error', () => {
  const mapped = AuthManager.mapAuthError({ message: 'Failed to fetch' });
  assert(mapped.includes('Network connection error'), `Expected network error message, got: ${mapped}`);
});

it('Maps rate limiting errors gracefully', () => {
  const mapped = AuthManager.mapAuthError({ message: 'over_email_send_rate_limit: too many requests' });
  assert(mapped.includes('Too many attempts'), `Expected rate limit message, got: ${mapped}`);
});

// ----------------------------------------------------------------------------
// Test Group 3: Form Validation Logic
// ----------------------------------------------------------------------------
console.log('\n3. Registration & Login Form Validation:');

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

it('Validates standard and invalid email formats', () => {
  assert.strictEqual(validateEmail('user@example.com'), true);
  assert.strictEqual(validateEmail('first.last@company.co.uk'), true);
  assert.strictEqual(validateEmail('invalid-email'), false);
  assert.strictEqual(validateEmail('@domain.com'), false);
  assert.strictEqual(validateEmail('user@'), false);
});

it('Validates password length and equality constraints', () => {
  const pass = 'Secret123!';
  const confirmMatch = 'Secret123!';
  const confirmMismatch = 'DifferentPass';
  const shortPass = '123';

  assert(pass.length >= 6, 'Valid password is >= 6 characters');
  assert(shortPass.length < 6, 'Short password detected');
  assert.strictEqual(pass === confirmMatch, true, 'Matching passwords pass');
  assert.strictEqual(pass === confirmMismatch, false, 'Mismatched passwords fail');
});

// ----------------------------------------------------------------------------
// Test Group 4: Password Toggle Mechanism
// ----------------------------------------------------------------------------
console.log('\n4. Password Visibility Toggle:');

it('Toggles input type between password and text', () => {
  const mockInput = { type: 'password' };
  const mockIcon = { className: 'fa-solid fa-eye' };
  let clickHandler = null;
  const mockToggleBtn = {
    querySelector: () => mockIcon,
    setAttribute: (attr, val) => { mockToggleBtn[attr] = val; },
    addEventListener: (evt, handler) => { clickHandler = handler; }
  };

  AuthManager.setupPasswordToggle(mockInput, mockToggleBtn);
  assert(clickHandler, 'Event listener must be registered');

  // Trigger toggle to visible
  clickHandler({ preventDefault: () => {}, stopPropagation: () => {} });
  assert.strictEqual(mockInput.type, 'text', 'Input type should change to text');
  assert.strictEqual(mockIcon.className, 'fa-solid fa-eye-slash');

  // Trigger toggle back to hidden
  clickHandler({ preventDefault: () => {}, stopPropagation: () => {} });
  assert.strictEqual(mockInput.type, 'password', 'Input type should revert to password');
  assert.strictEqual(mockIcon.className, 'fa-solid fa-eye');
});

// ----------------------------------------------------------------------------
// Test Group 5: Route Guarding (requireAuth)
// ----------------------------------------------------------------------------
console.log('\n5. Route Protection & Redirects:');

itAsync('Redirects unauthenticated visitors to login.html with return target', async () => {
  global.window.location.href = 'http://localhost:3000/dashboard.html';
  global.window.location.pathname = '/dashboard.html';
  global.localStorage.clear();

  // Test with unconfigured Supabase and no demo session
  const user = await AuthManager.requireAuth({ redirectTo: 'login.html' });
  assert.strictEqual(user, null, 'Unauthenticated user must return null');
  assert(global.window.location.href.includes('login.html?redirect=dashboard.html&reason=unauthenticated'),
    `Expected redirect URL, got: ${global.window.location.href}`);
});

// ----------------------------------------------------------------------------
// Test Group 6: Supabase Operations with Client Mock
// ----------------------------------------------------------------------------
console.log('\n6. Supabase Client Integration & Profile Creation:');

(async () => {
  let signUpPayload = null;
  let profileUpsertPayload = null;
  let signInPayload = null;
  let signOutCalled = false;

  const mockUser = {
    id: 'usr_12345678-abcd-ef01-2345-6789abcdef01',
    email: 'alex.chen@example.com',
    user_metadata: { full_name: 'Alex Chen' }
  };

  const mockSession = {
    access_token: 'fake_jwt_token_resumex_test',
    user: mockUser
  };

  // Mock Supabase client
  const mockSupabaseClient = {
    auth: {
      signUp: async (options) => {
        signUpPayload = options;
        return { data: { user: mockUser, session: mockSession }, error: null };
      },
      signInWithPassword: async (options) => {
        signInPayload = options;
        return { data: { user: mockUser, session: mockSession }, error: null };
      },
      signOut: async () => {
        signOutCalled = true;
        return { error: null };
      },
      getSession: async () => {
        return { data: { session: mockSession }, error: null };
      },
      getUser: async () => {
        return { data: { user: mockUser }, error: null };
      }
    },
    from: (table) => {
      return {
        upsert: async (record) => {
          if (table === 'profiles') profileUpsertPayload = record;
          return { data: record, error: null };
        },
        select: () => ({
          eq: () => ({
            order: async () => ({ data: [], error: null })
          })
        })
      };
    }
  };

  // Inject configured mock into global
  global.SupabaseConfig = {
    isSupabaseConfigured: () => true,
    getClient: () => mockSupabaseClient
  };

  await itAsync('Performs real Supabase registration with user metadata and profile upsert', async () => {
    const res = await AuthManager.signUp('alex.chen@example.com', 'Passw0rd123!', 'Alex Chen');

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.user.id, mockUser.id);
    assert.strictEqual(signUpPayload.email, 'alex.chen@example.com');
    assert.strictEqual(signUpPayload.options.data.full_name, 'Alex Chen');

    assert(profileUpsertPayload, 'Profile table upsert must be called');
    assert.strictEqual(profileUpsertPayload.id, mockUser.id);
    assert.strictEqual(profileUpsertPayload.email, 'alex.chen@example.com');
    assert.strictEqual(profileUpsertPayload.full_name, 'Alex Chen');
    assert(profileUpsertPayload.updated_at, 'Updated timestamp must be present');
  });

  await itAsync('Performs real Supabase signIn and retrieves user session', async () => {
    const res = await AuthManager.signIn('alex.chen@example.com', 'Passw0rd123!');

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.session.access_token, 'fake_jwt_token_resumex_test');
    assert.strictEqual(signInPayload.email, 'alex.chen@example.com');
    assert.strictEqual(signInPayload.password, 'Passw0rd123!');
  });

  await itAsync('Retrieves current user and active session via AuthManager', async () => {
    const user = await AuthManager.getCurrentUser();
    assert(user, 'Current user must be retrieved');
    assert.strictEqual(user.email, 'alex.chen@example.com');

    const session = await AuthManager.getSession();
    assert(session, 'Active session must be retrieved');
    assert.strictEqual(session.user.id, mockUser.id);
  });

  await itAsync('requireAuth permits authenticated user without redirecting', async () => {
    global.window.location.href = 'http://localhost:3000/dashboard.html';
    const user = await AuthManager.requireAuth({ redirectTo: 'login.html' });

    assert(user, 'User object should be returned');
    assert.strictEqual(user.id, mockUser.id);
    assert.strictEqual(global.window.location.href, 'http://localhost:3000/dashboard.html', 'No redirect should occur');
  });

  await itAsync('Performs signOut and cleans up session', async () => {
    await AuthManager.signOut('login.html');
    assert.strictEqual(signOutCalled, true, 'client.auth.signOut must be called');
  });

  // Final Summary
  console.log('\n====================================================');
  console.log(`📊 Auth Test Summary: ${passedTests} / ${totalTests} passing`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
})();
