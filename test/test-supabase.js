/**
 * CareerGuide.AI - Supabase Connection Test
 * Executes live diagnostics on the Supabase client configuration.
 */

const SupabaseConfig = require('../supabase-config.js');

console.log('====================================================');
console.log('🔌 CareerGuide.AI - Supabase Connection Diagnostics');
console.log('====================================================\n');

(async () => {
  const config = SupabaseConfig.getConfig();
  console.log('1. Configuration Inspection:');
  console.log(`   • Project URL:  ${config.url}`);
  console.log(`   • Key Preview:  ${config.keyPreview}`);
  console.log(`   • Configured:   ${config.isConfigured ? 'YES (Real credentials set)' : 'NO (Using placeholder values)'}\n`);

  console.log('2. Running Connection Verification Test:');
  try {
    const result = await SupabaseConfig.testSupabaseConnection();

    console.log(`   • Status:      ${result.status}`);
    console.log(`   • Configured:  ${result.configured}`);
    console.log(`   • Success:     ${result.success ? 'TRUE' : 'FALSE'}`);
    console.log(`   • Message:     ${result.message}`);

    if (result.error) {
      console.log(`   • Error Details:`, result.error);
    }

    console.log('\n====================================================');
    if (!result.configured) {
      console.log('📋 VERIFICATION RESULT: Pending User Credentials');
      console.log('   The Supabase client is correctly configured and initialized,');
      console.log('   waiting for your real Supabase Project URL and Public Anon Key.');
      console.log('   Open "supabase-config.js" to insert your credentials.');
    } else if (result.success) {
      console.log('🎉 VERIFICATION RESULT: Connected Successfully to Supabase!');
    } else {
      console.log(`⚠️ VERIFICATION RESULT: Connection failed (${result.status})`);
    }
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Unexpected Diagnostic Error:', err.message);
  }
})();
