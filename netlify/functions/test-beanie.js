const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Test environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    const envCheck = {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlLength: supabaseUrl ? supabaseUrl.length : 0,
      supabaseKeyLength: supabaseKey ? supabaseKey.length : 0,
      allEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    };

    // Test Supabase connection if credentials are available
    let connectionTest = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('beanie_costs')
          .select('*')
          .limit(1);
        
        connectionTest = {
          success: !error,
          error: error ? error.message : null,
          hasData: !!data
        };
      } catch (connError) {
        connectionTest = {
          success: false,
          error: connError.message
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test function working',
        timestamp: new Date().toISOString(),
        environment: envCheck,
        connection: connectionTest,
        requestInfo: {
          httpMethod: event.httpMethod,
          path: event.path,
          hasBody: !!event.body,
          bodyLength: event.body ? event.body.length : 0
        }
      })
    };

  } catch (error) {
    console.error('Test function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
