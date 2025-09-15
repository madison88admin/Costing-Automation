import { DatabaseConfig } from '../types';
export declare class DatabaseConnection {
    private connection;
    private config;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any[]>;
    execute(sql: string, params?: any[]): Promise<any>;
    getTables(): Promise<string[]>;
    getTableInfo(tableName: string): Promise<any[]>;
    private getTablesQuery;
    private getTableInfoQuery;
    close(): Promise<void>;
}
export declare const createDatabaseConnection: (config: DatabaseConfig) => DatabaseConnection;
//# sourceMappingURL=database.d.ts.map