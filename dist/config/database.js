"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseConnection = exports.DatabaseConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const pg_1 = require("pg");
const sqlite3_1 = __importDefault(require("sqlite3"));
const util_1 = require("util");
const supabase_js_1 = require("@supabase/supabase-js");
class DatabaseConnection {
    constructor(config) {
        this.config = config;
    }
    async connect() {
        try {
            switch (this.config.type) {
                case 'mysql':
                    this.connection = await promise_1.default.createConnection({
                        host: this.config.host,
                        port: this.config.port,
                        user: this.config.username,
                        password: this.config.password,
                        database: this.config.database,
                        ssl: this.config.ssl ? 'Amazon RDS' : undefined
                    });
                    break;
                case 'postgresql':
                    this.connection = new pg_1.Pool({
                        host: this.config.host,
                        port: this.config.port,
                        user: this.config.username,
                        password: this.config.password,
                        database: this.config.database,
                        ssl: this.config.ssl
                    });
                    break;
                case 'sqlite':
                    this.connection = new sqlite3_1.default.Database(this.config.filename || ':memory:');
                    break;
                case 'supabase':
                    if (!this.config.supabaseUrl || !this.config.supabaseKey) {
                        throw new Error('Supabase URL and key are required');
                    }
                    this.connection = (0, supabase_js_1.createClient)(this.config.supabaseUrl, this.config.supabaseKey);
                    break;
                default:
                    throw new Error(`Unsupported database type: ${this.config.type}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to connect to database: ${error}`);
        }
    }
    async query(sql, params = []) {
        try {
            if (this.config.type === 'sqlite') {
                const run = (0, util_1.promisify)(this.connection.all.bind(this.connection));
                return await run(sql, params);
            }
            else if (this.config.type === 'supabase') {
                const { data, error } = await this.connection.rpc('execute_sql', {
                    query: sql,
                    params: params
                });
                if (error)
                    throw error;
                return data || [];
            }
            else {
                const [rows] = await this.connection.execute(sql, params);
                return rows;
            }
        }
        catch (error) {
            throw new Error(`Query failed: ${error}`);
        }
    }
    async execute(sql, params = []) {
        try {
            if (this.config.type === 'sqlite') {
                const run = (0, util_1.promisify)(this.connection.run.bind(this.connection));
                return await run(sql, params);
            }
            else {
                const [result] = await this.connection.execute(sql, params);
                return result;
            }
        }
        catch (error) {
            throw new Error(`Execute failed: ${error}`);
        }
    }
    async getTables() {
        const sql = this.getTablesQuery();
        const result = await this.query(sql);
        return result.map((row) => row.table_name || row.name || row.tbl_name);
    }
    async getTableInfo(tableName) {
        const sql = this.getTableInfoQuery(tableName);
        return await this.query(sql);
    }
    getTablesQuery() {
        switch (this.config.type) {
            case 'mysql':
                return `SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.config.database}'`;
            case 'postgresql':
                return `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
            case 'sqlite':
                return `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
            default:
                throw new Error(`Unsupported database type: ${this.config.type}`);
        }
    }
    getTableInfoQuery(tableName) {
        switch (this.config.type) {
            case 'mysql':
                return `DESCRIBE ${tableName}`;
            case 'postgresql':
                return `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
        `;
            case 'sqlite':
                return `PRAGMA table_info(${tableName})`;
            default:
                throw new Error(`Unsupported database type: ${this.config.type}`);
        }
    }
    async close() {
        if (this.connection) {
            if (this.config.type === 'postgresql') {
                await this.connection.end();
            }
            else {
                await this.connection.close();
            }
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
const createDatabaseConnection = (config) => {
    return new DatabaseConnection(config);
};
exports.createDatabaseConnection = createDatabaseConnection;
//# sourceMappingURL=database.js.map