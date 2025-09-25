# 🗄️ Beanie & Ballcaps Database Setup Guide

## Overview
This guide will help you set up the database to store both beanie and ballcaps cost data from Excel files.

## ✅ Quick Setup

### 1. **Create Database Tables**
Run the SQL script in your Supabase dashboard:

1. **Open Supabase Dashboard**: Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Open SQL Editor**: Click "SQL Editor" → "New Query"
3. **Run Setup Script**: Copy and paste the contents of `supabase-beanie-setup.sql` (now includes both beanie and ballcaps)
4. **Execute**: Click "Run" to create the tables

### 2. **Verify Tables Created**
After running the script, you should see these tables:
- `costs` - Main cost records
- `cost_items` - Section data (yarn, fabric, trim, etc.)
- `cost_summary` - View for easy querying (both beanie and ballcaps)

### 3. **Test the Setup**
1. **Start the server**: `npm run dev`
2. **Open the app**: Go to `http://localhost:3000`
3. **Connect to database**: Use the "Connect to Database" button
4. **Upload Excel file**: Upload a beanie or ballcaps Excel file
5. **Save to database**: Click the "💾 Save to Database" button

## 📊 Database Structure

### `costs` Table
Stores main cost information:
- `id` - Primary key
- `customer` - Customer name (e.g., "TNF")
- `season` - Season (e.g., "F27")
- `style_number` - Style number (e.g., "TNFF27-014")
- `style_name` - Style name (e.g., "Fuzzy Wool Blend Beanie")
- `costed_quantity` - Quantity (e.g., "2000pcs")
- `leadtime` - Lead time (e.g., "45 days")
- `total_material_cost` - Total material cost
- `total_factory_cost` - Total factory cost
- `product_type` - Product type ("beanie" or "ballcaps")
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### `cost_items` Table
Stores section data:
- `id` - Primary key
- `cost_id` - Foreign key to costs table
- `section` - Section type (yarn, fabric, embroidery, trim, knitting, operations, packaging, overhead)
- `material` - Material name/description
- `operation` - Operation name (for operations/knitting)
- `type` - Item type (for packaging/overhead)
- `consumption` - Consumption amount
- `price` - Price per unit
- `cost` - Total cost
- `time` - Time value
- `total` - Total value
- `notes` - Additional notes
- `is_subtotal` - Whether this is a subtotal row
- `created_at` - Creation timestamp

## 🔧 API Endpoints

### Save Beanie Data
```
POST /api/beanie/save
Content-Type: application/json

{
  "connectionId": "supabase_1234567890",
  "excelData": {
    "data": { /* parsed beanie data */ },
    "images": [ /* embedded images */ ]
  }
}
```

### Get Beanie Data
```
GET /api/beanie/:costId?connectionId=supabase_1234567890
```

### Get All Beanie Data
```
GET /api/beanie?connectionId=supabase_1234567890
```

### Save Ballcaps Data
```
POST /api/ballcaps/save
Content-Type: application/json

{
  "connectionId": "supabase_1234567890",
  "excelData": {
    "data": { /* parsed ballcaps data */ },
    "images": [ /* embedded images */ ]
  }
}
```

### Get Ballcaps Data
```
GET /api/ballcaps/:costId?connectionId=supabase_1234567890
```

### Get All Ballcaps Data
```
GET /api/ballcaps?connectionId=supabase_1234567890
```

## 🎯 How It Works

1. **Upload Excel File**: User uploads a beanie or ballcaps Excel file
2. **Parse Data**: The `TNFBeanieImporter` or `TNFBallCapsImporter` parses the Excel data
3. **Display Data**: Data is displayed in the cost breakdown table
4. **Save to Database**: User clicks "Save to Database" button
5. **Store Data**: Data is saved to `costs` and `cost_items` tables
6. **Retrieve Data**: Data can be retrieved using the API endpoints

## 📝 Sample Data

The setup script includes sample data for testing:

**Beanie Sample:**
- **Customer**: TNF
- **Season**: F27
- **Style#**: TNFF27-014
- **Style Name**: Fuzzy Wool Blend Beanie
- **Quantity**: 2000pcs
- **Leadtime**: 45 days
- **Material Cost**: $1.92
- **Factory Cost**: $4.57

**Ballcaps Sample:**
- **Customer**: TNF
- **Season**: F27
- **Style#**: TNFF27-015
- **Style Name**: Classic Logo Ballcap
- **Quantity**: 3000pcs
- **Leadtime**: 30 days
- **Material Cost**: $2.15
- **Factory Cost**: $5.20

## 🚀 Next Steps

1. **Test the complete flow**: Upload → Parse → Save → Retrieve
2. **Customize tables**: Modify the SQL script for your specific needs
3. **Add more sections**: Extend the database schema as needed
4. **Set up permissions**: Configure Row Level Security (RLS) if needed

## 🔍 Troubleshooting

### Common Issues:
1. **"No database connection found"**: Make sure you're connected to Supabase
2. **"Failed to save data"**: Check that the tables were created successfully
3. **"No data to save"**: Make sure you've uploaded and parsed an Excel file first

### Debug Steps:
1. Check browser console for errors
2. Verify database connection in Supabase dashboard
3. Check that tables exist and have the correct structure
4. Test the API endpoints directly

## 📞 Need Help?

If you encounter issues:
1. Check the server logs for error messages
2. Verify your Supabase connection settings
3. Ensure all tables were created successfully
4. Test with the sample data first
