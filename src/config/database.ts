import { DatabaseConfig } from '../types';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

export class DatabaseConnection {
  private connection: any;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'mysql':
          this.connection = await mysql.createConnection({
            host: this.config.host,
            port: this.config.port,
            user: this.config.username,
            password: this.config.password,
            database: this.config.database,
            ssl: this.config.ssl ? 'Amazon RDS' : undefined
          });
          break;

        case 'postgresql':
          this.connection = new Pool({
            host: this.config.host,
            port: this.config.port,
            user: this.config.username,
            password: this.config.password,
            database: this.config.database,
            ssl: this.config.ssl
          });
          break;

        case 'sqlite':
          this.connection = new sqlite3.Database(this.config.filename || ':memory:');
          break;

        case 'supabase':
          if (!this.config.supabaseUrl || !this.config.supabaseKey) {
            throw new Error('Supabase URL and key are required');
          }
          this.connection = createClient(this.config.supabaseUrl, this.config.supabaseKey);
          break;

        default:
          throw new Error(`Unsupported database type: ${this.config.type}`);
      }
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    try {
      if (this.config.type === 'sqlite') {
        const run = promisify(this.connection.all.bind(this.connection));
        return await run(sql, params);
      } else if (this.config.type === 'supabase') {
        // For Supabase, we'll use the REST API for complex queries
        // This is a simplified implementation - you might want to use RPC functions for complex queries
        const { data, error } = await this.connection.rpc('execute_sql', { 
          query: sql, 
          params: params 
        });
        if (error) throw error;
        return data || [];
      } else {
        const [rows] = await this.connection.execute(sql, params);
        return rows;
      }
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    try {
      if (this.config.type === 'sqlite') {
        const run = promisify(this.connection.run.bind(this.connection));
        return await run(sql, params);
      } else {
        const [result] = await this.connection.execute(sql, params);
        return result;
      }
    } catch (error) {
      throw new Error(`Execute failed: ${error}`);
    }
  }

  async getTables(): Promise<string[]> {
    const sql = this.getTablesQuery();
    const result = await this.query(sql);
    return result.map((row: any) => row.table_name || row.name || row.tbl_name);
  }

  async getTableInfo(tableName: string): Promise<any[]> {
    const sql = this.getTableInfoQuery(tableName);
    return await this.query(sql);
  }

  private getTablesQuery(): string {
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

  private getTableInfoQuery(tableName: string): string {
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

  async close(): Promise<void> {
    if (this.connection) {
      if (this.config.type === 'postgresql') {
        await this.connection.end();
      } else {
        await this.connection.close();
      }
    }
  }
}

export const createDatabaseConnection = (config: DatabaseConfig): DatabaseConnection => {
  return new DatabaseConnection(config);
};
