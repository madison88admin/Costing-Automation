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
    console.log('=== BALLCAPS FUNCTION DEPLOYED VERSION TEST ===');
    
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
    console.log('=== BALLCAPS FORCE REDEPLOY - Using table name:', finalTableName, '===');

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
    
    // Map ballcaps data to databank table columns
    const insertData = {
      season: data.season || '',
      customer: data.customer || '',
      style_number: data.styleNumber || data.style_number || '',
      style_name: data.styleName || data.style_name || '',
      main_material: data.fabric && data.fabric[0] ? data.fabric[0].material : '',
      material_consumption: data.fabric && data.fabric[0] ? data.fabric[0].consumption : '',
      material_price: data.fabric && data.fabric[0] ? data.fabric[0].price : '',
      trim_cost: data.trim && data.trim.length > 0 ? data.trim.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0) : 0,
      total_material_cost: parseFloat(data.totalMaterialCost || 0),
      knitting_machine: '', // Ballcaps don't have knitting
      knitting_time: '',
      knitting_cpm: '',
      knitting_cost: 0,
      ops_cost: data.operations && data.operations.length > 0 ? data.operations.reduce((sum, item) => sum + parseFloat(item.cost || 0), 0) : 0,
      knitting_ops_cost: 0, // Will calculate below
      packaging: data.packaging && data.packaging[0] ? parseFloat(data.packaging[0].cost || 0) : 0,
      oh: 0, // Will calculate from overhead
      profit: 0, // Will calculate from overhead
      fty_adjustment: 0,
      ttl_fty_cost: parseFloat(data.totalFactoryCost || 0),
      main_material_cost: parseFloat(data.totalMaterialCost || 0),
      label: '',
      trims: JSON.stringify(data.trim || []),
      packaging2: JSON.stringify(data.packaging || []),
      total_material: parseFloat(data.totalMaterialCost || 0),
      material_code: data.fabric && data.fabric[0] ? data.fabric[0].material : '',
      material_consumption3: data.fabric && data.fabric[0] ? data.fabric[0].consumption : '',
      material_price4: data.fabric && data.fabric[0] ? data.fabric[0].price : '',
      finance_percent: 0,
      finance_usd: 0,
      smv: 0,
      average_efficiency: 0,
      oh2: 0,
      oh_ratio: 0,
      bom_cost_tot_mat_finance: parseFloat(data.totalMaterialCost || 0),
      direct_labor_costs: 0,
      labor_oh_usd: 0,
      bom_lo: 0,
      others: 0,
      profit_percent: 0,
      profit_usd: 0,
      fob_adj_usd: 0,
      total_lop: parseFloat(data.totalFactoryCost || 0),
      product_testing_cost: 0,
      freight_to_port: 0,
      total_fob: parseFloat(data.totalFactoryCost || 0),
      sample_wt_with_tag_qc_sample_check_form_grams: 0,
      remarks: `Ballcaps data imported on ${new Date().toISOString()}`
    };

    // Calculate derived fields
    insertData.knitting_ops_cost = insertData.knitting_cost + insertData.ops_cost;
    
    // Calculate overhead and profit from overhead array
    if (data.overhead && data.overhead.length > 0) {
      data.overhead.forEach(item => {
        if (item.type === 'PROFIT') {
          insertData.profit = parseFloat(item.cost || 0);
        } else if (item.type.includes('OVERHEAD') || item.type.includes('OH')) {
          insertData.oh = parseFloat(item.cost || 0);
        }
      });
    }
    console.log('Insert data prepared:', JSON.stringify(insertData, null, 2));

    // Check for existing records before inserting
    console.log('Checking for existing ballcaps records...');
    
    // Clean the search criteria (trim whitespace and normalize)
    const cleanCustomer = (insertData.customer || '').toString().trim();
    const cleanSeason = (insertData.season || '').toString().trim();
    const cleanStyleNumber = (insertData.style_number || '').toString().trim();
    
    console.log('Cleaned search criteria:', {
      customer: cleanCustomer,
      season: cleanSeason,
      style_number: cleanStyleNumber
    });
    
    // Try multiple approaches to find duplicates
    let existingRecords = [];
    let checkError = null;
    
    // First try exact match with cleaned data
    const { data: exactMatch, error: exactError } = await supabase
      .from(finalTableName)
      .select('id, customer, season, style_number, style_name, created_at')
      .eq('customer', cleanCustomer)
      .eq('season', cleanSeason)
      .eq('style_number', cleanStyleNumber);
    
    if (exactError || !exactMatch || exactMatch.length === 0) {
      console.log('Exact match failed, trying case-insensitive...');
      // Try case-insensitive match
      const { data: caseInsensitive, error: caseError } = await supabase
        .from(finalTableName)
        .select('id, customer, season, style_number, style_name, created_at')
        .ilike('customer', cleanCustomer)
        .ilike('season', cleanSeason)
        .ilike('style_number', cleanStyleNumber);
      
      if (caseError || !caseInsensitive || caseInsensitive.length === 0) {
        console.log('Case-insensitive match failed, trying partial match...');
        // Try partial match
        const { data: partialMatch, error: partialError } = await supabase
          .from(finalTableName)
          .select('id, customer, season, style_number, style_name, created_at')
          .ilike('customer', `%${cleanCustomer}%`)
          .ilike('season', `%${cleanSeason}%`)
          .ilike('style_number', `%${cleanStyleNumber}%`);
        
        existingRecords = partialMatch || [];
        checkError = partialError;
      } else {
        existingRecords = caseInsensitive || [];
        checkError = caseError;
      }
    } else {
      existingRecords = exactMatch || [];
      checkError = exactError;
    }
    
    console.log('Duplicate check result:', {
      existingRecords: existingRecords,
      count: existingRecords ? existingRecords.length : 0,
      error: checkError
    });

    if (checkError) {
      console.error('Error checking for existing records:', checkError);
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

    // If no duplicates found with main criteria, try a more lenient approach
    if (!existingRecords || existingRecords.length === 0) {
      console.log('No duplicates found with main criteria, trying lenient matching...');
      
      // Try matching just customer and season (more lenient)
      const { data: lenientMatch, error: lenientError } = await supabase
        .from(finalTableName)
        .select('id, customer, season, style_number, style_name, created_at')
        .ilike('customer', `%${cleanCustomer}%`)
        .ilike('season', `%${cleanSeason}%`);
      
      if (lenientMatch && lenientMatch.length > 0) {
        console.log(`Found ${lenientMatch.length} potential duplicate(s) with lenient matching`);
        existingRecords = lenientMatch;
      }
    }

    if (existingRecords && existingRecords.length > 0) {
      // Duplicate found - update existing record
      console.log(`Found ${existingRecords.length} existing ballcaps record(s), updating...`);
      const existingRecord = existingRecords[0];
      
      // Update the existing record
      const { data: updateResult, error: updateError } = await supabase
        .from(finalTableName)
        .update({
          ...insertData,
          id: existingRecord.id, // Keep the original ID
          updated_at: new Date().toISOString(),
          remarks: `Ballcaps data updated on ${new Date().toISOString()} (was: ${existingRecord.created_at})`
        })
        .eq('id', existingRecord.id)
        .select();

      if (updateError) {
        console.error('Supabase update error:', updateError);
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
      console.log('No existing ballcaps records found, inserting new record...');
      const { data: insertResult, error: insertError } = await supabase
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

      result = insertResult;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Ballcaps data ${action} successfully`,
        action: action,
        data: result,
        duplicateFound: action === 'updated'
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
