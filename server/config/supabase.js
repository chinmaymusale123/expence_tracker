const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_PROJECT_URL' || !supabaseKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables!');
  supabase = {
    from: () => {
      const errorMsg = { message: 'Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Environment Variables.' };
      const chain = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        delete: () => chain,
        eq: () => chain,
        neq: () => chain,
        gte: () => chain,
        lte: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => Promise.resolve({ data: null, error: errorMsg }),
        then: (resolve) => Promise.resolve({ data: null, error: errorMsg }).then(resolve),
        catch: (reject) => Promise.resolve({ data: null, error: errorMsg }).catch(reject)
      };
      return chain;
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Supabase client initialized:', supabaseUrl);
}

module.exports = supabase;
