"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("../utils/logger"));
class SupabaseService {
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    async getTables() {
        try {
            const commonTables = ['databank', 'users', 'products', 'orders', 'customers', 'inventory', 'costs', 'pricing'];
            const existingTables = [];
            for (const tableName of commonTables) {
                try {
                    const { error } = await this.supabase
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
            if (existingTables.length === 0) {
                logger_1.default.info('No common tables found. You may need to create tables in your Supabase database.');
                return ['No tables found - Create tables in Supabase dashboard'];
            }
            return existingTables;
        }
        catch (error) {
            logger_1.default.error('Error getting tables:', error);
            throw new Error('Failed to retrieve tables. Please check your Supabase connection and ensure tables exist.');
        }
    }
    async getTableInfo(tableName) {
        try {
            const { data: sampleData, error: dataError } = await this.supabase
                .from(tableName)
                .select('*')
                .limit(1);
            if (dataError)
                throw dataError;
            const { count, error: countError } = await this.supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            if (countError)
                throw countError;
            const columns = sampleData && sampleData.length > 0
                ? Object.keys(sampleData[0]).map(key => ({
                    name: key,
                    type: this.inferType(sampleData[0][key]),
                    nullable: sampleData[0][key] === null,
                    primaryKey: key === 'id',
                    autoIncrement: key === 'id',
                    defaultValue: null
                }))
                : [];
            return {
                name: tableName,
                columns,
                rowCount: count || 0
            };
        }
        catch (error) {
            logger_1.default.error('Error getting table info:', error);
            throw new Error(`Failed to retrieve table info for ${tableName}. Please ensure the table exists and is accessible.`);
        }
    }
    inferType(value) {
        if (value === null || value === undefined)
            return 'unknown';
        if (typeof value === 'boolean')
            return 'boolean';
        if (typeof value === 'number')
            return 'numeric';
        if (typeof value === 'string') {
            if (!isNaN(Date.parse(value)) && value.includes('-'))
                return 'timestamp';
            return 'text';
        }
        if (value instanceof Date)
            return 'timestamp';
        if (Array.isArray(value))
            return 'array';
        if (typeof value === 'object')
            return 'jsonb';
        return 'text';
    }
    async getTableData(query) {
        try {
            const { table, page = 1, limit = 10, sortBy, sortOrder = 'ASC', filters = {}, search } = query;
            let queryBuilder = this.supabase.from(table).select('*', { count: 'exact' });
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryBuilder = queryBuilder.eq(key, value);
                }
            });
            if (search) {
                const tableInfo = await this.getTableInfo(table);
                const searchableColumns = tableInfo.columns
                    .filter(col => col.type.includes('text') || col.type.includes('character'))
                    .map(col => col.name);
                if (searchableColumns.length > 0) {
                    const searchConditions = searchableColumns.map(col => `${col}.ilike.%${search}%`).join(',');
                    queryBuilder = queryBuilder.or(searchConditions);
                }
            }
            if (sortBy) {
                queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'ASC' });
            }
            if (limit < 50000) {
                const offset = (page - 1) * limit;
                queryBuilder = queryBuilder.range(offset, offset + limit - 1);
            }
            const { data, error, count } = await queryBuilder;
            if (error)
                throw error;
            return {
                data: data || [],
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit)
            };
        }
        catch (error) {
            logger_1.default.error('Error getting table data:', error);
            throw new Error('Failed to retrieve table data');
        }
    }
    async getAllTableData(table) {
        try {
            const countQuery = this.supabase.from(table).select('*', { count: 'exact', head: true });
            const { count, error: countError } = await countQuery;
            if (countError)
                throw countError;
            const totalRecords = count || 0;
            console.log(`Total records to load: ${totalRecords}`);
            if (totalRecords === 0) {
                return {
                    data: [],
                    total: 0,
                    page: 1,
                    limit: 0,
                    totalPages: 1
                };
            }
            const chunkSize = 1000;
            const totalChunks = Math.ceil(totalRecords / chunkSize);
            let allData = [];
            console.log(`Loading ${totalRecords} records in ${totalChunks} chunks of ${chunkSize}...`);
            for (let i = 0; i < totalChunks; i++) {
                const offset = i * chunkSize;
                const limit = Math.min(chunkSize, totalRecords - offset);
                console.log(`Loading chunk ${i + 1}/${totalChunks} (offset: ${offset}, limit: ${limit})`);
                let chunkData = [];
                let chunkError = null;
                let retryCount = 0;
                const maxRetries = 3;
                while (retryCount <= maxRetries) {
                    try {
                        const chunkQuery = this.supabase
                            .from(table)
                            .select('*')
                            .range(offset, offset + limit - 1);
                        const result = await chunkQuery;
                        chunkData = result.data || [];
                        chunkError = result.error;
                        if (chunkError) {
                            if (chunkError.message?.includes('429') || chunkError.message?.includes('rate limit')) {
                                retryCount++;
                                if (retryCount <= maxRetries) {
                                    const backoffDelay = Math.pow(1.5, retryCount) * 1000;
                                    console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${retryCount}/${maxRetries})`);
                                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                                    continue;
                                }
                            }
                            throw chunkError;
                        }
                        break;
                    }
                    catch (error) {
                        if (error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'))) {
                            retryCount++;
                            if (retryCount <= maxRetries) {
                                const backoffDelay = Math.pow(1.5, retryCount) * 1000;
                                console.log(`Rate limit error, retrying in ${backoffDelay}ms (attempt ${retryCount}/${maxRetries})`);
                                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                                continue;
                            }
                        }
                        throw error;
                    }
                }
                if (chunkData && chunkData.length > 0) {
                    allData = allData.concat(chunkData);
                    console.log(`Loaded ${chunkData.length} records, total so far: ${allData.length}`);
                }
                if (i < totalChunks - 1) {
                    const delay = 500 + (i * 100);
                    console.log(`Waiting ${delay}ms before next chunk...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            console.log(`Successfully loaded all ${allData.length} records`);
            return {
                data: allData,
                total: totalRecords,
                page: 1,
                limit: totalRecords,
                totalPages: 1
            };
        }
        catch (error) {
            logger_1.default.error('Error getting all table data:', error);
            throw new Error('Failed to retrieve all table data');
        }
    }
    async insertRecord(table, data) {
        try {
            const { data: result, error } = await this.supabase
                .from(table)
                .insert(data)
                .select()
                .single();
            if (error)
                throw error;
            return result;
        }
        catch (error) {
            logger_1.default.error('Error inserting record:', error);
            throw new Error('Failed to insert record');
        }
    }
    async updateRecord(table, id, data) {
        try {
            const { data: result, error } = await this.supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return result;
        }
        catch (error) {
            logger_1.default.error('Error updating record:', error);
            throw new Error('Failed to update record');
        }
    }
    async deleteRecord(table, id) {
        try {
            const { error } = await this.supabase
                .from(table)
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error deleting record:', error);
            throw new Error('Failed to delete record');
        }
    }
    async bulkInsert(table, data) {
        try {
            const { data: result, error } = await this.supabase
                .from(table)
                .insert(data)
                .select();
            if (error)
                throw error;
            return result || [];
        }
        catch (error) {
            logger_1.default.error('Error bulk inserting records:', error);
            throw new Error('Failed to bulk insert records');
        }
    }
    async upsertRecord(table, data) {
        try {
            const { data: result, error } = await this.supabase
                .from(table)
                .upsert(data)
                .select()
                .single();
            if (error)
                throw error;
            return result;
        }
        catch (error) {
            logger_1.default.error('Error upserting record:', error);
            throw new Error('Failed to upsert record');
        }
    }
}
exports.SupabaseService = SupabaseService;
//# sourceMappingURL=supabaseService.js.map