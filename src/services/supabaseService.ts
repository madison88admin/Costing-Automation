import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataTableQuery, DataTableResponse, TableInfo } from '../types';
import logger from '../utils/logger';

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getTables(): Promise<string[]> {
    try {
      // For Supabase, we'll use a different approach
      // First, let's try to get tables by querying a known table or using RPC
      // Since we can't directly access information_schema, we'll use a workaround
      
      // Try to get tables by attempting to query common table names
      // This is a simplified approach - in production you might want to use RPC functions
      const commonTables = ['databank', 'users', 'products', 'orders', 'customers', 'inventory', 'costs', 'pricing'];
      const existingTables: string[] = [];
      
      for (const tableName of commonTables) {
        try {
          const { error } = await this.supabase
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
      
      // If no common tables found, return a message suggesting to create tables
      if (existingTables.length === 0) {
        logger.info('No common tables found. You may need to create tables in your Supabase database.');
        return ['No tables found - Create tables in Supabase dashboard'];
      }
      
      return existingTables;
    } catch (error) {
      logger.error('Error getting tables:', error);
      throw new Error('Failed to retrieve tables. Please check your Supabase connection and ensure tables exist.');
    }
  }

  async getTableInfo(tableName: string): Promise<TableInfo> {
    try {
      // For Supabase, we'll get a sample row to determine columns
      // This is a simplified approach since we can't access information_schema directly
      
      const { data: sampleData, error: dataError } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (dataError) throw dataError;

      // Get row count
      const { count, error: countError } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Infer column types from sample data
      const columns = sampleData && sampleData.length > 0 
        ? Object.keys(sampleData[0]).map(key => ({
            name: key,
            type: this.inferType(sampleData[0][key]),
            nullable: sampleData[0][key] === null,
            primaryKey: key === 'id', // Assume 'id' is primary key
            autoIncrement: key === 'id', // Assume 'id' is auto-increment
            defaultValue: null
          }))
        : [];

      return {
        name: tableName,
        columns,
        rowCount: count || 0
      };
    } catch (error) {
      logger.error('Error getting table info:', error);
      throw new Error(`Failed to retrieve table info for ${tableName}. Please ensure the table exists and is accessible.`);
    }
  }

  private inferType(value: any): string {
    if (value === null || value === undefined) return 'unknown';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'numeric';
    if (typeof value === 'string') {
      // Check if it's a date
      if (!isNaN(Date.parse(value)) && value.includes('-')) return 'timestamp';
      return 'text';
    }
    if (value instanceof Date) return 'timestamp';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'jsonb';
    return 'text';
  }

  async getTableData(query: DataTableQuery): Promise<DataTableResponse> {
    try {
      const { table, page = 1, limit = 10, sortBy, sortOrder = 'ASC', filters = {}, search } = query;
      
      // For large datasets, we need to handle this differently
      // If limit is very high (like 5000+), we'll fetch all data without pagination
      const isLargeDataset = limit > 1000;
      
      let queryBuilder = this.supabase.from(table).select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryBuilder = queryBuilder.eq(key, value);
        }
      });

      // Apply search
      if (search) {
        // This is a simplified search - you might want to implement full-text search
        const tableInfo = await this.getTableInfo(table);
        const searchableColumns = tableInfo.columns
          .filter(col => col.type.includes('text') || col.type.includes('character'))
          .map(col => col.name);

        if (searchableColumns.length > 0) {
          const searchConditions = searchableColumns.map(col => `${col}.ilike.%${search}%`).join(',');
          queryBuilder = queryBuilder.or(searchConditions);
        }
      }

      // Apply sorting
      if (sortBy) {
        queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'ASC' });
      }

      let data, error, count;

      if (isLargeDataset) {
        // For large datasets, fetch all data without pagination
        // First, get the total count
        const countQuery = this.supabase.from(table).select('*', { count: 'exact', head: true });
        const { count: totalCount, error: countError } = await countQuery;
        
        if (countError) {
          error = countError;
          logger.error('Error getting total count:', countError);
        } else {
          logger.info(`Total records in database: ${totalCount}`);
          // Now fetch all data in batches
          const allData = [];
          let offset = 0;
          const batchSize = 1000; // Supabase's max per request
          let hasMoreData = true;

          while (hasMoreData) {
            const batchQuery = queryBuilder.range(offset, offset + batchSize - 1);
            const { data: batchData, error: batchError } = await batchQuery;
            
            if (batchError) {
              logger.error('Error fetching batch:', batchError);
              // Skip this batch and continue with the next one
              offset += batchSize;
              continue;
            }

            if (batchData && batchData.length > 0) {
              allData.push(...batchData);
              offset += batchSize;
              logger.info(`Fetched batch: ${batchData.length} records (total so far: ${allData.length})`);
              
              // If we got less than batchSize, we've reached the end
              if (batchData.length < batchSize) {
                hasMoreData = false;
              }
            } else {
              hasMoreData = false;
            }
          }

          data = allData;
          count = totalCount; // Use the actual count from database, not data length
          logger.info(`Final result: ${allData.length} records loaded, total count: ${totalCount}`);
        }
      } else {
        // For normal pagination, use the original approach
        const offset = (page - 1) * limit;
        queryBuilder = queryBuilder.range(offset, offset + limit - 1);
        const result = await queryBuilder;
        data = result.data;
        error = result.error;
        count = result.count;
      }

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      logger.error('Error getting table data:', error);
      // Return partial data if available, don't fail completely
      return {
        data: allData || [],
        total: allData?.length || 0,
        page: 1,
        limit: allData?.length || 0,
        totalPages: 1
      };
    }
  }

  async insertRecord(table: string, data: Record<string, any>): Promise<any> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error('Error inserting record:', error);
      throw new Error('Failed to insert record');
    }
  }

  async updateRecord(table: string, id: string | number, data: Record<string, any>): Promise<any> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error('Error updating record:', error);
      throw new Error('Failed to update record');
    }
  }

  async deleteRecord(table: string, id: string | number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting record:', error);
      throw new Error('Failed to delete record');
    }
  }

  async bulkInsert(table: string, data: Record<string, any>[]): Promise<any[]> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return result || [];
    } catch (error) {
      logger.error('Error bulk inserting records:', error);
      throw new Error('Failed to bulk insert records');
    }
  }

  async upsertRecord(table: string, data: Record<string, any>): Promise<any> {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .upsert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error('Error upserting record:', error);
      throw new Error('Failed to upsert record');
    }
  }
}
