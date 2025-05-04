import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.1.0/+esm';

const supabaseUrl = 'https://qbtfnnvbpxkbkykrnckk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidGZubnZicHhrYmt5a3JuY2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMTkyMDIsImV4cCI6MjA2MTg5NTIwMn0.c5OZ7HcNIMP14t7vcE_6TmcbA1neuyDCFmVK2sI3C7Y';

export const supabase = createClient(supabaseUrl, supabaseKey);