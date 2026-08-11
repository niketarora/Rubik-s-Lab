const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[SUPABASE] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment.');
}

const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseServiceKey || 'mock-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
