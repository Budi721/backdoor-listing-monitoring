import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!

// Client with anon key (for client-side - respects RLS)
export const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Client with service_role key (for server-side API routes - bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Export as db for backward compatibility (use admin for server-side)
export const db = supabaseAdmin
