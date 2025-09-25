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
    const { data, tableName } = JSON.parse(event.body);
    
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
          error: 'Failed to save data to database'
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