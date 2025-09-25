const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    console.log('Raw event body:', event.body);
    console.log('Event body type:', typeof event.body);
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No request body provided'
        })
      };
    }
    
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError.message
        })
      };
    }
    
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    console.log('Request body keys:', Object.keys(requestBody));
    
    // Handle both old format (data, tableName) and new format (connectionId, excelData)
    let data, tableName;
    console.log('Checking format conditions...');
    console.log('Has data && tableName:', !!(requestBody.data && requestBody.tableName));
    console.log('Has excelData && excelData.data:', !!(requestBody.excelData && requestBody.excelData.data));
    
    if (requestBody.data && requestBody.tableName) {
      // Old format
      console.log('Using old format');
      data = requestBody.data;
      tableName = requestBody.tableName;
    } else if (requestBody.excelData && requestBody.excelData.data) {
      // Format from frontend (connectionId may be null)
      console.log('Using frontend format');
      data = requestBody.excelData.data;
      tableName = requestBody.excelData.tableName || 'beanie_costs';
    } else {
      console.log('No matching format found');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid request format. Expected {data, tableName} or {excelData: {data, tableName}}' 
        })
      };
    }
    
    if (!data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'No data provided' 
        })
      };
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing:', {
        url: !!supabaseUrl,
        key: !!supabaseKey
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Supabase configuration missing. Please check environment variables.' 
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use the provided table name or default to 'beanie_costs'
    const finalTableName = tableName || 'beanie_costs';

    // Check if table exists by trying to query it
    const { error: tableError } = await supabase
      .from(finalTableName)
      .select('*')
      .limit(1);

    if (tableError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Table '${finalTableName}' does not exist. Please create it in your Supabase dashboard.`
        })
      };
    }

    // Prepare data for insertion
    console.log('Data to insert:', JSON.stringify(data, null, 2));
    const insertData = {
      customer: data.customer,
      season: data.season,
      style_number: data.styleNumber,
      style_name: data.styleName,
      costed_quantity: data.costedQuantity,
      leadtime: data.leadtime,
      yarn: JSON.stringify(data.yarn || []),
      fabric: JSON.stringify(data.fabric || []),
      trim: JSON.stringify(data.trim || []),
      knitting: JSON.stringify(data.knitting || []),
      operations: JSON.stringify(data.operations || []),
      packaging: JSON.stringify(data.packaging || []),
      overhead: JSON.stringify(data.overhead || []),
      created_at: new Date().toISOString()
    };
    console.log('Insert data prepared:', JSON.stringify(insertData, null, 2));

    // Insert data into Supabase
    const { data: result, error: insertError } = await supabase
      .from(finalTableName)
      .insert([insertData])
      .select();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Failed to save data to database: ${insertError.message}`,
          details: insertError
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Beanie data saved successfully',
        data: result
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      })
    };
  }
};