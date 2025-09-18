"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const logger_1 = __importDefault(require("../utils/logger"));
class ImportService {
    constructor(database) {
        this.db = database;
    }
    async importCSV(file, config) {
        try {
            const data = await this.parseCSV(file.buffer);
            return await this.processData(data, config);
        }
        catch (error) {
            logger_1.default.error('CSV import error:', error);
            return {
                success: false,
                message: `CSV import failed: ${error}`,
                rowsProcessed: 0,
                rowsInserted: 0,
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
    async parseCSV(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];
            const stream = stream_1.Readable.from(buffer);
            stream
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }
    async processData(data, config) {
        const errors = [];
        let rowsProcessed = 0;
        let rowsInserted = 0;
        try {
            this.validateMappings(data, config.mappings);
            const batchSize = config.batchSize || 100;
            const batches = this.chunkArray(data, batchSize);
            for (const batch of batches) {
                const batchResult = await this.processBatch(batch, config);
                rowsProcessed += batchResult.processed;
                rowsInserted += batchResult.inserted;
                errors.push(...batchResult.errors);
            }
            return {
                success: errors.length === 0,
                message: `Import completed. Processed: ${rowsProcessed}, Inserted: ${rowsInserted}`,
                rowsProcessed,
                rowsInserted,
                errors
            };
        }
        catch (error) {
            logger_1.default.error('Data processing error:', error);
            return {
                success: false,
                message: `Data processing failed: ${error}`,
                rowsProcessed,
                rowsInserted,
                errors: [...errors, error instanceof Error ? error.message : String(error)]
            };
        }
    }
    validateMappings(data, mappings) {
        if (data.length === 0) {
            throw new Error('No data to import');
        }
        const sampleRow = data[0];
        const fileColumns = Object.keys(sampleRow);
        for (const mapping of mappings) {
            if (mapping.required && !fileColumns.includes(mapping.fileColumn)) {
                throw new Error(`Required column "${mapping.fileColumn}" not found in file`);
            }
        }
    }
    async processBatch(batch, config) {
        const errors = [];
        let inserted = 0;
        for (const row of batch) {
            try {
                const mappedData = this.mapRowData(row, config.mappings);
                if (config.updateExisting) {
                    await this.upsertRecord(config.table, mappedData);
                }
                else {
                    await this.insertRecord(config.table, mappedData);
                }
                inserted++;
            }
            catch (error) {
                errors.push(`Row processing error: ${error}`);
                logger_1.default.error('Row processing error:', error);
            }
        }
        return {
            processed: batch.length,
            inserted,
            errors
        };
    }
    mapRowData(row, mappings) {
        const mappedData = {};
        for (const mapping of mappings) {
            const value = row[mapping.fileColumn];
            if (value !== undefined && value !== null && value !== '') {
                mappedData[mapping.databaseColumn] = this.convertDataType(value, mapping.dataType);
            }
            else if (mapping.required) {
                throw new Error(`Required field "${mapping.fileColumn}" is empty`);
            }
        }
        return mappedData;
    }
    convertDataType(value, dataType) {
        if (!dataType)
            return value;
        switch (dataType.toLowerCase()) {
            case 'integer':
            case 'int':
                return parseInt(value);
            case 'float':
            case 'decimal':
                return parseFloat(value);
            case 'boolean':
            case 'bool':
                return Boolean(value);
            case 'date':
                return new Date(value);
            case 'string':
            case 'text':
            default:
                return String(value);
        }
    }
    async insertRecord(table, data) {
        if (!this.db) {
            throw new Error('Database connection not available');
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        await this.db.execute(sql, values);
    }
    async upsertRecord(table, data) {
        if (!this.db) {
            throw new Error('Database connection not available');
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        const updateClause = columns.map(col => `${col} = ?`).join(', ');
        const sql = `
      INSERT INTO ${table} (${columns.join(', ')}) 
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET ${updateClause}
    `;
        await this.db.execute(sql, [...values, ...values]);
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    async getFilePreview(file, maxRows = 10) {
        try {
            let data = [];
            if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
                data = await this.parseCSV(file.buffer);
            }
            else {
                throw new Error('Unsupported file type');
            }
            return data.slice(0, maxRows);
        }
        catch (error) {
            logger_1.default.error('File preview error:', error);
            throw new Error(`Failed to preview file: ${error}`);
        }
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=importService.js.map