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
    console.log('Databank save - Raw event body:', event.body);
    
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
    
    console.log('Databank save - Request body received:', JSON.stringify(requestBody, null, 2));
    
    // Extract data and connectionId
    const { connectionId, data } = requestBody;
    
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
    
    console.log('Databank save - Environment check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('- SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
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

    // Use 'databank' table
    const tableName = 'databank';
    console.log('Databank save - Using table name:', tableName);

    // Check if table exists
    const { error: tableError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (tableError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Table '${tableName}' does not exist. Please create it in your Supabase dashboard.`
        })
      };
    }

    // Prepare data for insertion - handle both beanie and ballcaps data
    console.log('Databank save - Data to insert:', JSON.stringify(data, null, 2));
    
    // Map data to databank table columns
    const insertData = {
      season: data.Season || data.season || '',
      customer: data.Customer || data.customer || '',
      style_number: data['Style Number'] || data.styleNumber || data.style_number || '',
      style_name: data['Style Name'] || data.styleName || data.style_name || '',
      main_material: data['Main Material'] || data.main_material || '',
      material_consumption: data['Material Consumption'] || data.material_consumption || '',
      material_price: data['Material Price'] || data.material_price || '',
      total_material_cost: parseFloat(data['Total Material Cost'] || data.totalMaterialCost || data.total_material_cost || 0),
      product_type: data['Product Type'] || data.productType || data.product_type || '',
      moq: data.MOQ || data.moq || '',
      leadtime: data.Leadtime || data.leadtime || '',
      status: data.Status || data.status || 'Approved',
      approved_by: data['Approved By'] || data.approvedBy || data.approved_by || 'Madison',
      approved_date: data['Approved Date'] || data.approvedDate || data.approved_date || new Date().toLocaleDateString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      remarks: `Databank data saved on ${new Date().toISOString()}`
    };

    // Add any additional fields from the original data
    if (data.OriginalData) {
      insertData.original_data = JSON.stringify(data.OriginalData);
    }

    console.log('Databank save - Insert data prepared:', JSON.stringify(insertData, null, 2));

    // Check for existing records
    console.log('Databank save - Checking for existing records...');
    
    const cleanCustomer = (insertData.customer || '').toString().trim();
    const cleanSeason = (insertData.season || '').toString().trim();
    const cleanStyleNumber = (insertData.style_number || '').toString().trim();
    
    console.log('Databank save - Search criteria:', {
      customer: cleanCustomer,
      season: cleanSeason,
      style_number: cleanStyleNumber
    });
    
    // Check for exact match
    const { data: existingRecords, error: checkError } = await supabase
      .from(tableName)
      .select('id, customer, season, style_number, style_name, created_at')
      .eq('customer', cleanCustomer)
      .eq('season', cleanSeason)
      .eq('style_number', cleanStyleNumber);

    if (checkError) {
      console.error('Databank save - Error checking for existing records:', checkError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Failed to check for existing records: ${checkError.message}`
        })
      };
    }

    let result;
    let action = 'inserted';

    if (existingRecords && existingRecords.length > 0) {
      // Duplicate found - update existing record
      console.log(`Databank save - Found ${existingRecords.length} existing record(s), updating...`);
      const existingRecord = existingRecords[0];
      
      const { data: updateResult, error: updateError } = await supabase
        .from(tableName)
        .update({
          ...insertData,
          id: existingRecord.id,
          updated_at: new Date().toISOString(),
          remarks: `Databank data updated on ${new Date().toISOString()} (was: ${existingRecord.created_at})`
        })
        .eq('id', existingRecord.id)
        .select();

      if (updateError) {
        console.error('Databank save - Update error:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: `Failed to update existing record: ${updateError.message}`,
            details: updateError
          })
        };
      }

      result = updateResult;
      action = 'updated';
    } else {
      // No duplicate found - insert new record
      console.log('Databank save - No existing records found, inserting new record...');
      const { data: insertResult, error: insertError } = await supabase
        .from(tableName)
        .insert([insertData])
        .select();

      if (insertError) {
        console.error('Databank save - Insert error:', insertError);
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

      result = insertResult;
    }

    console.log(`Databank save - Success: Data ${action} successfully`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Databank data ${action} successfully`,
        action: action,
        data: result,
        duplicateFound: action === 'updated'
      })
    };

  } catch (error) {
    console.error('Databank save - Function error:', error);
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
