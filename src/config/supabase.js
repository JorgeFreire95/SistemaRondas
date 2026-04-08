import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijmwlehyttqulbnovroi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbXdsZWh5dHRxdWxibm92cm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTA5MDAsImV4cCI6MjA5MTE4NjkwMH0.BwjIm862JZUGcKpn-fZa_C9jm0wUklPrKtFX32bwkaE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
