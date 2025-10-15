import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eukncrhiukafmjqvpzwe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a25jcmhpdWthZm1qcXZwendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDQ1ODAsImV4cCI6MjA3NjAyMDU4MH0.n8c21WcMVXNyJjK-dj19zGQBHqkowjkLG3k0DsXixJM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
