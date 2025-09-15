import { DatabaseConnection } from '../config/database';
import { ImportResult, FileUpload, ImportConfig } from '../types';
export declare class ImportService {
    private db;
    constructor(database: DatabaseConnection);
    importCSV(file: FileUpload, config: ImportConfig): Promise<ImportResult>;
    importExcel(file: FileUpload, config: ImportConfig, sheetName?: string): Promise<ImportResult>;
    private parseCSV;
    private parseExcel;
    private processData;
    private validateMappings;
    private processBatch;
    private mapRowData;
    private convertDataType;
    insertRecord(table: string, data: Record<string, any>): Promise<void>;
    private upsertRecord;
    private chunkArray;
    getFilePreview(file: FileUpload, maxRows?: number): Promise<any[]>;
}
//# sourceMappingURL=importService.d.ts.map