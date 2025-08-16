const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const { code } = JSON.parse(event.body);

  // Connect to Supabase using secure environment variables
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check if the code exists in the database
  const { data, error } = await supabase
   .from('trail_codes')
   .select('*')
   .eq('access_code', code)
   .single(); // We expect only one result

  if (error ||!data) {
    return {
      statusCode: 404,
      body: JSON.stringify({ success: false, message: 'Invalid code.' })
    };
  }

  if (data.is_activated) {
    return {
      statusCode: 403,
      body: JSON.stringify({ success: false, message: 'This code has already been used.' })
    };
  }

  // If code is valid, mark it as activated
  const { error: updateError } = await supabase
   .from('trail_codes')
   .update({ is_activated: true, activated_at: new Date().toISOString() })
   .eq('id', data.id);

  if (updateError) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Could not activate trail. Please try again.' })
    };
  }

  // Return success and the trail name
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, trail: data.trail_name })
  };
};