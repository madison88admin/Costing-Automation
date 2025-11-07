# 🗄️ Supabase Database Setup Guide

## The Issue
Your Supabase database is connected successfully, but it doesn't have any tables yet. That's why the connection appears to fail when trying to list tables.

## ✅ Quick Fix - Create Sample Tables

### Option 1: Use the SQL Script (Recommended)

1. **Open your Supabase Dashboard**:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account
   - Select your project: `icavnpspgmcrrqmsprze`

2. **Open the SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**:
   - Copy the contents of `supabase-setup.sql` (in your project folder)
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify Tables Created**:
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `products`
     - `customers` 
     - `orders`
     - `order_items`
     - `costs`

### Option 2: Create Tables Manually

If you prefer to create your own tables, here's a simple example:

```sql
-- Create a simple products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample data
INSERT INTO products (name, price, description) VALUES
('Sample Product 1', 29.99, 'A great product'),
('Sample Product 2', 19.99, 'Another great product');
```

## 🔧 Test Your Setup

After creating tables, test the connection:

1. **Open your browser** and go to: `http://localhost:3000/test-supabase`
2. **You should see**:
   ```json
   {
     "connection": {"success": true, "message": "Connection successful"},
     "tables": ["products", "customers", "orders", "order_items", "costs"],
     "message": "Found 5 tables: products, customers, orders, order_items, costs"
   }
   ```

3. **Then test the main interface**:
   - Go to `http://localhost:3000`
   - Click "Connect to Database"
   - You should now see your tables listed!

## 🎯 What the Sample Tables Include

The setup script creates a complete costing automation system with:

- **Products**: Product catalog with pricing
- **Customers**: Customer information
- **Orders**: Order management
- **Order Items**: Order line items
- **Costs**: Costing data for automation

Each table includes sample data so you can immediately start testing the system.

## 🚀 Next Steps

Once you have tables created:

1. **Connect to Database**: Use the web interface to connect
2. **Browse Data**: View and edit your table data
3. **Import Files**: Upload CSV/Excel files to populate more data
4. **Customize**: Modify tables or create new ones as needed

## 🔍 Troubleshooting

If you still have issues:

1. **Check Supabase Project**: Make sure you're in the right project
2. **Verify API Keys**: Ensure your anon key is correct
3. **Check RLS Policies**: If you enabled Row Level Security, make sure policies allow access
4. **Test Connection**: Use the `/test-supabase` endpoint to debug

## 📞 Need Help?

The system is designed to work with any Supabase database structure. Once you have tables created, all the features (data browsing, file import, etc.) will work perfectly!
