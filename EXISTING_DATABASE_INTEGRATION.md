# 🗄️ Integration with Existing Database

## Overview
I can see you already have a Supabase database with existing tables (`databank` and `costing_projects`). This guide will help you add beanie and ballcaps functionality to your existing database without affecting your current data.

## ✅ Quick Setup

### 1. **Add New Tables to Existing Database**
Since you already have a database, we'll add the new tables alongside your existing ones:

1. **Open Supabase Dashboard**: Go to your existing project
2. **Open SQL Editor**: Click "SQL Editor" → "New Query"
3. **Run Integration Script**: Copy and paste the contents of `supabase-integration-setup.sql`
4. **Execute**: Click "Run" to add the new tables

### 2. **Verify New Tables Created**
After running the script, you should see these **new** tables alongside your existing ones:
- `costs` - Main cost records for beanie/ballcaps
- `cost_items` - Section data (yarn, fabric, embroidery, trim, etc.)
- `cost_summary` - View for easy querying

**Your existing tables (`databank`, `costing_projects`) will remain unchanged!**

### 3. **Test the Integration**
1. **Start the server**: `npm run dev`
2. **Open the app**: Go to `http://localhost:3000`
3. **Connect to database**: Use the "Connect to Database" button
4. **Upload Excel file**: Upload a beanie or ballcaps Excel file
5. **Save to database**: Click the "💾 Save to Database" button

## 📊 Database Structure

### **New Tables Added:**

#### `costs` Table
Stores main cost information for beanie/ballcaps:
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

#### `cost_items` Table
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

### **Beanie Endpoints:**
- `POST /api/beanie/save` - Save beanie cost data
- `GET /api/beanie/:costId` - Get specific beanie cost data
- `GET /api/beanie/` - Get all beanie cost records

### **Ballcaps Endpoints:**
- `POST /api/ballcaps/save` - Save ballcaps cost data
- `GET /api/ballcaps/:costId` - Get specific ballcaps cost data
- `GET /api/ballcaps/` - Get all ballcaps cost records

## 🎯 How It Works

1. **Upload Excel File**: User uploads a beanie or ballcaps Excel file
2. **Parse Data**: The `TNFBeanieImporter` or `TNFBallCapsImporter` parses the Excel data
3. **Display Data**: Data is displayed in the cost breakdown table
4. **Save to Database**: User clicks "Save to Database" button
5. **Store Data**: Data is saved to the **new** `costs` and `cost_items` tables
6. **Retrieve Data**: Data can be retrieved using the API endpoints

## 📝 Sample Data

The integration script includes sample data for testing:

**Beanie Sample:**
- Customer: TNF, Season: F27, Style#: TNFF27-014
- Style Name: Fuzzy Wool Blend Beanie
- Quantity: 2000pcs, Leadtime: 45 days
- Material Cost: $1.92, Factory Cost: $4.57

**Ballcaps Sample:**
- Customer: TNF, Season: F27, Style#: TNFF27-015
- Style Name: Classic Logo Ballcap
- Quantity: 3000pcs, Leadtime: 30 days
- Material Cost: $2.15, Factory Cost: $5.20

## 🔍 Database Sections Supported

### **Beanie Sections:**
- YARN (materials, consumption, price, cost)
- FABRIC (materials, consumption, price, cost)
- TRIM (materials, consumption, price, cost)
- KNITTING (machine, time, cost, total)
- OPERATIONS (operation, time, cost, total)
- PACKAGING (type, notes, cost)
- OVERHEAD (type, notes, cost)

### **Ballcaps Sections:**
- FABRIC (materials, consumption, price, cost)
- EMBROIDERY (materials, consumption, price, cost)
- TRIM (materials, consumption, price, cost)
- OPERATIONS (operation, time, cost, total)
- PACKAGING (type, notes, cost)
- OVERHEAD (type, notes, cost)

## 🚀 Next Steps

1. **Run the integration script** in your Supabase dashboard
2. **Test the complete flow**: Upload → Parse → Save → Retrieve
3. **Your existing data remains untouched** - only new tables are added
4. **Use the new functionality** alongside your existing databank system

## 🔍 Troubleshooting

### Common Issues:
1. **"No database connection found"**: Make sure you're connected to Supabase
2. **"Failed to save data"**: Check that the new tables were created successfully
3. **"No data to save"**: Make sure you've uploaded and parsed an Excel file first

### Debug Steps:
1. Check browser console for errors
2. Verify database connection in Supabase dashboard
3. Check that the new tables exist and have the correct structure
4. Test the API endpoints directly

## 📞 Need Help?

If you encounter issues:
1. Check the server logs for error messages
2. Verify your Supabase connection settings
3. Ensure the new tables were created successfully
4. Test with the sample data first

**Your existing database and data will remain completely unchanged!** 🎉
