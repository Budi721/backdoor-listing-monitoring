import { createClient } from '@supabase/supabase-js'

// Create Supabase client with fallback for build time
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local')
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export as db for backward compatibility
export const db = supabase
