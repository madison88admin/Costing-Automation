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
      tableName = requestBody.excelData.tableName || 'costs';
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
    const finalTableName = tableName || 'costs';

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
      total_material_cost: parseFloat(data.materialTotal) || 0,
      total_factory_cost: parseFloat(data.factoryTotal) || 0,
      product_type: 'beanie',
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

    // Save detailed cost items to cost_items table
    if (result && result.length > 0) {
      const costId = result[0].id;
      const costItems = [];
      
      // Add yarn items
      if (data.yarn && data.yarn.length > 0) {
        data.yarn.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'yarn',
            material: item.material || '',
            consumption: item.consumption || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Add fabric items
      if (data.fabric && data.fabric.length > 0) {
        data.fabric.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'fabric',
            material: item.material || '',
            consumption: item.consumption || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Add trim items
      if (data.trim && data.trim.length > 0) {
        data.trim.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'trim',
            material: item.material || '',
            consumption: item.consumption || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Add knitting items
      if (data.knitting && data.knitting.length > 0) {
        data.knitting.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'knitting',
            operation: item.operation || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Add operations items
      if (data.operations && data.operations.length > 0) {
        data.operations.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'operations',
            operation: item.operation || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Add packaging items
      if (data.packaging && data.packaging.length > 0) {
        data.packaging.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'packaging',
            operation: item.operation || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Add overhead items
      if (data.overhead && data.overhead.length > 0) {
        data.overhead.forEach(item => {
          costItems.push({
            cost_id: costId,
            section: 'overhead',
            operation: item.operation || '',
            price: parseFloat(item.price) || 0,
            cost: parseFloat(item.cost) || 0
          });
        });
      }
      
      // Insert cost items if any exist
      if (costItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('cost_items')
          .insert(costItems);
          
        if (itemsError) {
          console.error('Error inserting cost items:', itemsError);
          // Don't fail the whole operation, just log the error
        }
      }
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