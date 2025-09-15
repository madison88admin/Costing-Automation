import { createClient } from '@supabase/supabase-js';

export async function testSupabaseConnection(url: string, key: string) {
  try {
    const supabase = createClient(url, key);
    
    // Test basic connection
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // This error means the table doesn't exist, but connection is working
      console.log('✅ Supabase connection successful (table not found is expected)');
      return { success: true, message: 'Connection successful' };
    }
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return { success: false, message: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    console.log('❌ Supabase connection error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getSupabaseTables(url: string, key: string) {
  try {
    const supabase = createClient(url, key);
    
    // Try to get tables using a more reliable method
    // We'll try common table names and see which ones exist
    const commonTables = [
      'databank', 'users', 'customers', 'products', 'orders', 'inventory', 
      'costs', 'pricing', 'items', 'transactions', 'sales',
      'suppliers', 'categories', 'brands', 'locations'
    ];
    
    const existingTables: string[] = [];
    
    for (const tableName of commonTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }
    
    return existingTables;
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
}
