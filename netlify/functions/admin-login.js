exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { password } = JSON.parse(event.body);
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check if the provided password matches the one in our environment variables
    if (password === adminPassword) {
      // Success! Send back a simple token.
      return {
        statusCode: 200,
        body: JSON.stringify({ token: 'admin-access-granted' })
      };
    } else {
      // Failure
      return {
        statusCode: 401, // Unauthorized
        body: JSON.stringify({ message: 'Incorrect password' })
      };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) };
  }
};