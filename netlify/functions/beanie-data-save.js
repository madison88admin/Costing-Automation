const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers - Updated for databank table
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
    console.log('=== FUNCTION DEPLOYED VERSION TEST ===');
    
    // Handle multiple formats: old format (data, tableName), new format (connectionId, excelData), and direct data
    let data, tableName;
    console.log('Checking format conditions...');
    console.log('Has data && tableName:', !!(requestBody.data && requestBody.tableName));
    console.log('Has excelData:', !!requestBody.excelData);
    console.log('Has connectionId:', !!requestBody.connectionId);
    console.log('Request body keys:', Object.keys(requestBody));
    
    if (requestBody.data && requestBody.tableName) {
      // Old format: {data, tableName}
      console.log('Using old format');
      data = requestBody.data;
      tableName = requestBody.tableName;
    } else if (requestBody.excelData) {
      // Frontend format: {connectionId, excelData: {data, images}}
      console.log('Using frontend format');
      if (requestBody.excelData.data) {
        data = requestBody.excelData.data;
        tableName = requestBody.excelData.tableName || 'databank';
      } else {
        // If excelData itself is the data object
        data = requestBody.excelData;
        tableName = 'databank';
      }
    } else if (requestBody.customer || requestBody.season || requestBody.styleNumber) {
      // Direct data format - the data object itself
      console.log('Using direct data format');
      data = requestBody;
      tableName = 'databank';
    } else {
      console.log('No matching format found');
      console.log('Available keys:', Object.keys(requestBody));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid request format. Expected {data, tableName}, {excelData: {data, tableName}}, or direct data object' 
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
    
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('- SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing:', {
        url: !!supabaseUrl,
        key: !!supabaseKey,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Supabase configuration missing. Please check environment variables.',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            availableEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
          }
        })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use the provided table name or default to 'databank' - FORCE REDEPLOY
    const finalTableName = tableName || 'databank';
    console.log('=== FORCE REDEPLOY - Using table name:', finalTableName, '===');

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
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data));
    
    // Validate required fields - make it less strict for debugging
    console.log('Validation check:');
    console.log('- customer:', data.customer);
    console.log('- season:', data.season);
    console.log('- styleNumber:', data.styleNumber);
    console.log('- All data keys:', Object.keys(data));
    
    // Only require at least one field to be present
    const hasAnyData = data.customer || data.season || data.styleNumber || data.style_name || data.costed_quantity;
    if (!hasAnyData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid data format. No valid data fields found',
          receivedData: Object.keys(data),
          dataSample: data
        })
      };
    }
    
    const insertData = {
      customer: data.customer || '',
      season: data.season || '',
      style_number: data.styleNumber || data.style_number || '',
      style_name: data.styleName || data.style_name || '',
      costed_quantity: data.costedQuantity || data.costed_quantity || 0,
      leadtime: data.leadtime || '',
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
