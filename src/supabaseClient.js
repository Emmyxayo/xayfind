import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://onxrbphchowrairsoegp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHJicGhjaG93cmFpcnNvZWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzk1NDEsImV4cCI6MjA5Mzc1NTU0MX0.NJjHJ2rbSw-k0tSDFciKnNde17xMQW0_-e1n4IYvhT0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
