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
    console.log('=== DEBUG REQUEST ===');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Raw body:', event.body);
    console.log('Body type:', typeof event.body);
    
    let requestBody;
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
        console.log('Parsed body:', JSON.stringify(requestBody, null, 2));
        console.log('Body keys:', Object.keys(requestBody));
        
        if (requestBody.excelData) {
          console.log('ExcelData keys:', Object.keys(requestBody.excelData));
          if (requestBody.excelData.data) {
            console.log('Data keys:', Object.keys(requestBody.excelData.data));
            console.log('Data sample:', JSON.stringify(requestBody.excelData.data, null, 2));
          }
        }
      } catch (parseError) {
        console.log('Parse error:', parseError.message);
        requestBody = null;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Request debug info logged to console',
        requestInfo: {
          httpMethod: event.httpMethod,
          hasBody: !!event.body,
          bodyLength: event.body ? event.body.length : 0,
          parsedSuccessfully: !!requestBody,
          bodyKeys: requestBody ? Object.keys(requestBody) : null
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Debug function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
