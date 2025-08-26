const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Check for POST request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get the new trail data from the request body
  const newTrail = JSON.parse(event.body);

  // Connect to Supabase using the powerful SERVICE_ROLE_KEY
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Insert the new row into the 'trails' table
  const { data, error } = await supabase
    .from('trails')
    .insert([newTrail])
    .select() // .select() returns the newly created row
    .single();

  if (error) {
    console.error('Error inserting trail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not add trail to the database.', error: error.message })
    };
  }

  // Success
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Trail added successfully!', newTrail: data })
  };
};