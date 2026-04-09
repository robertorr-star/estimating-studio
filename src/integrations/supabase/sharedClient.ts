// Shared Supabase client for cross-studio communication
// This connects to the shared Supabase project used by PM Studio and Financial Studio.
// Auth remains on Lovable Cloud; this client handles estimate data operations.
import { createClient } from '@supabase/supabase-js';

const SHARED_SUPABASE_URL = 'https://uxiszlspxwtknpxinjoe.supabase.co';
const SHARED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aXN6bHNweHd0a25weGluam9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzQ1OTksImV4cCI6MjA5MDc1MDU5OX0.BJmvGcPChoK9Vvf0khj1yoQNVE24F0SX4TxY5oeRryg';

export const sharedSupabase = createClient(SHARED_SUPABASE_URL, SHARED_SUPABASE_ANON_KEY, {
  auth: {
    // Don't manage auth sessions on the shared client — auth stays on Lovable Cloud
    persistSession: false,
    autoRefreshToken: false,
  },
});
