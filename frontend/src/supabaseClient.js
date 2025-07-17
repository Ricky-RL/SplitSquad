import { createClient } from '@supabase/supabase-js';
// Set these in your .env file at the project root (Vite will expose them as import.meta.env)
// VITE_SUPABASE_URL=your-supabase-url
// VITE_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
