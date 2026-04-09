import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://ijmwlehyttqulbnovroi.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbXdsZWh5dHRxdWxibm92cm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTA5MDAsImV4cCI6MjA5MTE4NjkwMH0.BwjIm862JZUGcKpn-fZa_C9jm0wUklPrKtFX32bwkaE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
export default supabase;
