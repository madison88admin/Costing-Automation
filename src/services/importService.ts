import csv from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { DatabaseConnection } from '../config/database';
import { ImportResult, FileUpload, ImportConfig, ColumnMapping } from '../types';
import logger from '../utils/logger';

export class ImportService {
  private db: DatabaseConnection;

  constructor(database: DatabaseConnection) {
    this.db = database;
  }

  async importCSV(file: FileUpload, config: ImportConfig): Promise<ImportResult> {
    try {
      const data = await this.parseCSV(file.buffer);
      return await this.processData(data, config);
    } catch (error) {
      logger.error('CSV import error:', error);
      return {
        success: false,
        message: `CSV import failed: ${error}`,
        rowsProcessed: 0,
        rowsInserted: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async importExcel(file: FileUpload, config: ImportConfig): Promise<ImportResult> {
    try {
      const data = await this.parseExcel(file.buffer);
      return await this.processData(data, config);
    } catch (error) {
      logger.error('Excel import error:', error);
      return {
        success: false,
        message: `Excel import failed: ${error}`,
        rowsProcessed: 0,
        rowsInserted: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }


  private async parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async parseExcel(buffer: Buffer): Promise<any[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      return data;
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error}`);
    }
  }


  private async processData(data: any[], config: ImportConfig): Promise<ImportResult> {
    const errors: string[] = [];
    let rowsProcessed = 0;
    let rowsInserted = 0;

    try {
      // Validate mappings
      this.validateMappings(data, config.mappings);

      // Process data in batches
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
    } catch (error) {
      logger.error('Data processing error:', error);
      return {
        success: false,
        message: `Data processing failed: ${error}`,
        rowsProcessed,
        rowsInserted,
        errors: [...errors, error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private validateMappings(data: any[], mappings: ColumnMapping[]): void {
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

  private async processBatch(batch: any[], config: ImportConfig): Promise<{ processed: number; inserted: number; errors: string[] }> {
    const errors: string[] = [];
    let inserted = 0;

    for (const row of batch) {
      try {
        const mappedData = this.mapRowData(row, config.mappings);
        
        if (config.updateExisting) {
          await this.upsertRecord(config.table, mappedData);
        } else {
          await this.insertRecord(config.table, mappedData);
        }
        
        inserted++;
      } catch (error) {
        errors.push(`Row processing error: ${error}`);
        logger.error('Row processing error:', error);
      }
    }

    return {
      processed: batch.length,
      inserted,
      errors
    };
  }

  private mapRowData(row: any, mappings: ColumnMapping[]): Record<string, any> {
    const mappedData: Record<string, any> = {};

    for (const mapping of mappings) {
      let value = row[mapping.fileColumn];
      if (value !== undefined && value !== null && value !== '') {
        // Apply data type conversion if specified
        mappedData[mapping.databaseColumn] = this.convertDataType(value, mapping.dataType);
      } else if (mapping.required) {
        throw new Error(`Required field "${mapping.fileColumn}" is empty`);
      } else {
        // Default empty values to 0 for numeric types, or '' for text
        if (mapping.dataType && ['integer', 'int', 'float', 'decimal'].includes(mapping.dataType.toLowerCase())) {
          mappedData[mapping.databaseColumn] = 0;
        } else {
          mappedData[mapping.databaseColumn] = '';
        }
      }
    }

    return mappedData;
  }

  private convertDataType(value: any, dataType?: string): any {
    if (!dataType) return value;

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

  async insertRecord(table: string, data: Record<string, any>): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available');
    }
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    await this.db.execute(sql, values);
  }

  private async upsertRecord(table: string, data: Record<string, any>): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not available');
    }
    
    // This is a simplified upsert - you might want to implement a more sophisticated one
    // based on your specific database and requirements
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

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getFilePreview(file: FileUpload, maxRows: number = 10): Promise<any[]> {
    try {
      let data: any[] = [];
      
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        data = await this.parseCSV(file.buffer);
      } else if (
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel.sheet.macroEnabled.12' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls') ||
        file.originalname.endsWith('.xlsm')
      ) {
        data = await this.parseExcel(file.buffer);
      } else {
        throw new Error('Unsupported file type');
      }

      return data.slice(0, maxRows);
    } catch (error) {
      logger.error('File preview error:', error);
      throw new Error(`Failed to preview file: ${error}`);
    }
  }
}
