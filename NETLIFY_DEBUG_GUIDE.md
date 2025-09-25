# Netlify Function Debug Guide

## Current Issue
The beanie-data-save function is returning a 400 error in Netlify but works locally.

## Debugging Steps

### 1. Test the Debug Function
First, test the debug function to check environment variables:
```
https://your-site.netlify.app/.netlify/functions/test-beanie
```

This will show:
- Environment variable status
- Supabase connection test
- Function execution details

### 2. Check Environment Variables in Netlify
Go to your Netlify dashboard:
1. Site settings → Environment variables
2. Add these variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   NODE_ENV=production
   ```

### 3. Check Function Logs
In Netlify dashboard:
1. Go to Functions tab
2. Click on `beanie-data-save`
3. Check the logs for detailed error information

### 4. Test the Function Directly
Use curl or Postman to test the function:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/beanie-data-save \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "test",
    "excelData": {
      "data": {
        "customer": "Test Customer",
        "season": "Test Season",
        "styleNumber": "TEST001",
        "styleName": "Test Style",
        "costedQuantity": 100,
        "leadtime": "4 weeks",
        "yarn": [],
        "fabric": [],
        "trim": [],
        "knitting": [],
        "operations": [],
        "packaging": [],
        "overhead": []
      }
    }
  }'
```

### 5. Common Issues and Solutions

#### Issue: Environment Variables Not Set
**Solution**: Add SUPABASE_URL and SUPABASE_ANON_KEY to Netlify environment variables

#### Issue: Table Doesn't Exist
**Solution**: Ensure the `beanie_costs` table exists in your Supabase database

#### Issue: CORS Errors
**Solution**: The function already includes CORS headers, but check browser console for specific errors

#### Issue: Request Format Mismatch
**Solution**: The updated function now handles multiple request formats:
- `{data, tableName}` (old format)
- `{connectionId, excelData: {data, images}}` (frontend format)
- Direct data object

### 6. Database Table Structure
Ensure your Supabase table has these columns:
```sql
CREATE TABLE beanie_costs (
  id SERIAL PRIMARY KEY,
  customer TEXT,
  season TEXT,
  style_number TEXT,
  style_name TEXT,
  costed_quantity INTEGER,
  leadtime TEXT,
  yarn JSONB,
  fabric JSONB,
  trim JSONB,
  knitting JSONB,
  operations JSONB,
  packaging JSONB,
  overhead JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Redeploy After Changes
After making changes to environment variables:
1. Go to Deploys tab in Netlify
2. Click "Trigger deploy" → "Deploy site"
3. Or push a new commit to trigger automatic deployment

## Next Steps
1. Test the debug function first
2. Check and set environment variables
3. Test the main function with the debug function
4. Check function logs for detailed error messages
