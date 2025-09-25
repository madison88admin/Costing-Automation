const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Supabase configuration missing'
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get a sample record to see the structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('databank')
      .select('*')
      .limit(1);

    if (sampleError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Error querying databank: ${sampleError.message}`,
          details: sampleError
        })
      };
    }

    const columnNames = sampleData && sampleData[0] ? Object.keys(sampleData[0]) : [];
    const sampleRecord = sampleData && sampleData[0] ? sampleData[0] : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Databank table structure',
        columnNames: columnNames,
        sampleRecord: sampleRecord,
        totalColumns: columnNames.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Check columns function error:', error);
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
