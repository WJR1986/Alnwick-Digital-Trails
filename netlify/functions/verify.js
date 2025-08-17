const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const { code } = JSON.parse(event.body);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Find the access code and the trail it belongs to
  const { data: accessData, error: accessError } = await supabase
    .from('access_codes')
    .select('*, trails(*)') // Select the code and all data from the related trail
    .eq('access_code', code)
    .single();

  if (accessError || !accessData) {
    return {
      statusCode: 404,
      body: JSON.stringify({ success: false, message: 'Invalid access code.' })
    };
  }

  // Optional: Check if the code has already been used
  if (accessData.is_activated) {
    // You can decide if you want to allow re-use or not
  }

  // 2. Get all locations for that trail, ordered by stop number
  const { data: locationsData, error: locationsError } = await supabase
    .from('trail_locations')
    .select('*, locations(*)') // Get the link table entry and all data from the related location
    .eq('trail_id', accessData.trail_id)
    .order('stop_number', { ascending: true });

  if (locationsError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Could not fetch trail locations.' })
    };
  }

  // 3. Mark the code as activated (optional)
  await supabase
    .from('access_codes')
    .update({ is_activated: true, activated_at: new Date().toISOString() })
    .eq('id', accessData.id);

  // 4. Combine the data into a single "trail package" to send to the app
  const responsePayload = {
    success: true,
    trail: accessData.trails, // The trail's own details
    locations: locationsData.map(join => join.locations) // An ordered array of location objects
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responsePayload)
  };
};