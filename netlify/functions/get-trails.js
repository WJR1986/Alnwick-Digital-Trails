// netlify/functions/get-trails.js

const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  try {
    // Connect to Supabase using the public ANON key, as this is public data.
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY // Note: Use the ANON key here
    );

    // Fetch all records from the 'trails' table
    const { data, error } = await supabase
      .from('trails')
      .select('*');

    if (error) {
      throw error;
    }

    // Return a successful response with the trail data
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (error) {
    // Handle any potential errors
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching trails', error: error.message })
    };
  }
};