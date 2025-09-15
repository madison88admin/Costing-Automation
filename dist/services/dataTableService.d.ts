import { DatabaseConnection } from '../config/database';
import { DataTableQuery, DataTableResponse, TableInfo } from '../types';
export declare class DataTableService {
    private db;
    constructor(database: DatabaseConnection);
    getTables(): Promise<string[]>;
    getTableInfo(tableName: string): Promise<TableInfo>;
    getTableData(query: DataTableQuery): Promise<DataTableResponse>;
    insertRecord(table: string, data: Record<string, any>): Promise<any>;
    updateRecord(table: string, id: string | number, data: Record<string, any>): Promise<any>;
    deleteRecord(table: string, id: string | number): Promise<boolean>;
}
//# sourceMappingURL=dataTableService.d.ts.map