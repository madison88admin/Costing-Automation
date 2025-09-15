"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSupabaseConnection = testSupabaseConnection;
exports.getSupabaseTables = getSupabaseTables;
const supabase_js_1 = require("@supabase/supabase-js");
async function testSupabaseConnection(url, key) {
    try {
        const supabase = (0, supabase_js_1.createClient)(url, key);
        const { data, error } = await supabase
            .from('_test_connection')
            .select('*')
            .limit(1);
        if (error && error.code === 'PGRST116') {
            console.log('✅ Supabase connection successful (table not found is expected)');
            return { success: true, message: 'Connection successful' };
        }
        if (error) {
            console.log('❌ Supabase connection failed:', error.message);
            return { success: false, message: error.message };
        }
        console.log('✅ Supabase connection successful');
        return { success: true, message: 'Connection successful' };
    }
    catch (error) {
        console.log('❌ Supabase connection error:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}
async function getSupabaseTables(url, key) {
    try {
        const supabase = (0, supabase_js_1.createClient)(url, key);
        const commonTables = [
            'databank', 'users', 'customers', 'products', 'orders', 'inventory',
            'costs', 'pricing', 'items', 'transactions', 'sales',
            'suppliers', 'categories', 'brands', 'locations'
        ];
        const existingTables = [];
        for (const tableName of commonTables) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);
                if (!error) {
                    existingTables.push(tableName);
                }
            }
            catch (e) {
            }
        }
        return existingTables;
    }
    catch (error) {
        console.error('Error getting tables:', error);
        return [];
    }
}
//# sourceMappingURL=supabaseTest.js.map