import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting cleanup of old notifications...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();
    
    console.log(`Deleting notifications older than: ${cutoffDate}`);
    
    // Delete notifications older than 30 days
    const { data, error, count } = await supabase
      .from('user_notifications')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');
    
    if (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
    
    const deletedCount = data?.length || 0;
    console.log(`Successfully deleted ${deletedCount} old notifications`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedCount,
        cutoff_date: cutoffDate
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in cleanup-old-notifications:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
