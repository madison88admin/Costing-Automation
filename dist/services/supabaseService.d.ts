import { SupabaseClient } from '@supabase/supabase-js';
import { DataTableQuery, DataTableResponse, TableInfo } from '../types';
export declare class SupabaseService {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    get client(): SupabaseClient;
    getTables(): Promise<string[]>;
    getTableInfo(tableName: string): Promise<TableInfo>;
    private inferType;
    getTableData(query: DataTableQuery): Promise<DataTableResponse>;
    insertRecord(table: string, data: Record<string, any>): Promise<any>;
    updateRecord(table: string, id: string | number, data: Record<string, any>): Promise<any>;
    deleteRecord(table: string, id: string | number): Promise<boolean>;
    bulkInsert(table: string, data: Record<string, any>[]): Promise<any[]>;
    upsertRecord(table: string, data: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=supabaseService.d.ts.map