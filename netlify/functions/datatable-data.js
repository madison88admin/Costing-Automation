const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse query parameters - allow unlimited records
    const { table, limit = 999999, offset = 0 } = event.queryStringParameters || {};

    if (!table) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Table name is required'
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

    // Get data from the specified table
    let records, error;
    
    if (parseInt(limit) > 10000) {
      // For very large datasets, fetch all data in batches
      console.log('Large dataset requested, fetching all data...');
      records = [];
      let currentOffset = parseInt(offset);
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore && records.length < parseInt(limit)) {
        const endOffset = Math.min(currentOffset + batchSize - 1, parseInt(offset) + parseInt(limit) - 1);
        const { data: batch, error: batchError } = await supabase
          .from(table)
          .select('*')
          .range(currentOffset, endOffset);
          
        if (batchError) {
          error = batchError;
          break;
        }
        
        if (batch && batch.length > 0) {
          records.push(...batch);
          currentOffset += batchSize;
          console.log(`Fetched batch: ${batch.length} records (total: ${records.length})`);
          
          if (batch.length < batchSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }
    } else {
      // For smaller datasets, use regular query
      const { data, error: queryError } = await supabase
        .from(table)
        .select('*')
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      records = data;
      error = queryError;
    }

    if (error) {
      console.error('Supabase query error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch data from database',
          details: error.message
        })
      };
    }

    // Get total count
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: records,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
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