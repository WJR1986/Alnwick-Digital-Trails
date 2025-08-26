const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Get the trailId from the query string parameters
  const { trailId } = event.queryStringParameters;

  if (!trailId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'trailId is required' }) };
  }

  // Connect to Supabase using the public ANON key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Fetch all location links for the given trail, along with the full location data,
  // and order them by the stop number.
  const { data, error } = await supabase
    .from('trail_locations')
    .select('stop_number, locations(*)')
    .eq('trail_id', trailId)
    .order('stop_number', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not fetch locations.', error: error.message })
    };
  }

  // Success
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};