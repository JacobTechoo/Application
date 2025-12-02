import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://msfufzoltkzxozollers.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZnVmem9sdGt6eG96b2xsZXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjU1MTQsImV4cCI6MjA4MDE0MTUxNH0.rZRxSNvBjKli-dFypxGFvucPa6xLhdIvw3Zcmm3be58';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
