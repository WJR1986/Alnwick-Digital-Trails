const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { locationData, trailId } = JSON.parse(event.body);

  if (!locationData || !trailId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing location data or trailId' }) };
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Step 1: Find the next stop number for this trail
    const { count, error: countError } = await supabase
      .from('trail_locations')
      .select('*', { count: 'exact', head: true })
      .eq('trail_id', trailId);

    if (countError) throw countError;
    const nextStopNumber = count + 1;

    // Step 2: Insert the new location into the 'locations' table
    const { data: newLocation, error: locationError } = await supabase
      .from('locations')
      .insert([locationData])
      .select()
      .single();

    if (locationError) throw locationError;

    // Step 3: Create the link in the 'trail_locations' table
    const { error: linkError } = await supabase
      .from('trail_locations')
      .insert([{
        trail_id: trailId,
        location_id: newLocation.id,
        stop_number: nextStopNumber
      }]);

    if (linkError) throw linkError;

    // Success
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Location added successfully!' })
    };

  } catch (error) {
    console.error('Error creating location:', error);
    // In case of failure, it might be good practice to delete the orphaned location record
    // but for now, we'll just return the error.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not add location.', error: error.message })
    };
  }
};