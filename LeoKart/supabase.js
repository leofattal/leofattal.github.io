import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.1.0/+esm';

const supabaseUrl = 'https://cyexbkbagdqhpslaenzg.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZXhia2JhZ2RxaHBzbGFlbnpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc4MTA5MSwiZXhwIjoyMDUxMzU3MDkxfQ.KQJn4PeNCodfJEk99eLTaYC0CGSvRj9L1zLUxsHu_A0';
export const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Fetch all rows from the "users" table
        const { data, error } = await supabase.from('track_times').select('*');

        if (error) {
            console.error('Error getting track times:', error);
        } else {
            console.log('Track Times:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Call the function
testConnection();