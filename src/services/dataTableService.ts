import { DatabaseConnection } from '../config/database';
import { DataTableQuery, DataTableResponse, TableInfo } from '../types';
import logger from '../utils/logger';

export class DataTableService {
  private db: DatabaseConnection;

  constructor(database: DatabaseConnection) {
    this.db = database;
  }

  async getTables(): Promise<string[]> {
    try {
      return await this.db.getTables();
    } catch (error) {
      logger.error('Error getting tables:', error);
      throw new Error('Failed to retrieve tables');
    }
  }

  async getTableInfo(tableName: string): Promise<TableInfo> {
    try {
      const columns = await this.db.getTableInfo(tableName);
      const rowCountResult = await this.db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = rowCountResult[0]?.count || 0;

      return {
        name: tableName,
        columns: columns.map((col: any) => ({
          name: col.column_name || col.Field || col.name,
          type: col.data_type || col.Type || col.type,
          nullable: col.is_nullable === 'YES' || col.Null === 'YES' || col.notnull === 0,
          primaryKey: col.column_key === 'PRI' || col.pk === 1,
          autoIncrement: col.extra === 'auto_increment' || col.autoincrement === 1,
          defaultValue: col.column_default || col.Default
        })),
        rowCount: parseInt(rowCount)
      };
    } catch (error) {
      logger.error('Error getting table info:', error);
      throw new Error(`Failed to retrieve table info for ${tableName}`);
    }
  }

  async getTableData(query: DataTableQuery): Promise<DataTableResponse> {
    try {
      const { table, page = 1, limit = 10, sortBy, sortOrder = 'ASC', filters = {}, search } = query;
      
      // Build WHERE clause
      let whereClause = '';
      const params: any[] = [];
      
      if (search) {
        const tableInfo = await this.getTableInfo(table);
        const searchableColumns = tableInfo.columns
          .filter(col => col.type.includes('varchar') || col.type.includes('text'))
          .map(col => col.name);
        
        if (searchableColumns.length > 0) {
          const searchConditions = searchableColumns.map(col => `${col} LIKE ?`).join(' OR ');
          whereClause += ` WHERE (${searchConditions})`;
          searchableColumns.forEach(() => params.push(`%${search}%`));
        }
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const operator = whereClause ? 'AND' : 'WHERE';
          whereClause += ` ${operator} ${key} = ?`;
          params.push(value);
        }
      });

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM ${table}${whereClause}`;
      const countResult = await this.db.query(countSql, params);
      const total = countResult[0]?.total || 0;

      // Build ORDER BY clause
      let orderClause = '';
      if (sortBy) {
        orderClause = ` ORDER BY ${sortBy} ${sortOrder}`;
      }

      // Build LIMIT clause
      const offset = (page - 1) * limit;
      const limitClause = ` LIMIT ${limit} OFFSET ${offset}`;

      // Get data
      const dataSql = `SELECT * FROM ${table}${whereClause}${orderClause}${limitClause}`;
      const data = await this.db.query(dataSql, params);

      return {
        data,
        total: parseInt(total),
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error getting table data:', error);
      throw new Error('Failed to retrieve table data');
    }
  }

  async insertRecord(table: string, data: Record<string, any>): Promise<any> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const result = await this.db.execute(sql, values);
      
      return { id: result.insertId || result.lastID, ...data };
    } catch (error) {
      logger.error('Error inserting record:', error);
      throw new Error('Failed to insert record');
    }
  }

  async updateRecord(table: string, id: string | number, data: Record<string, any>): Promise<any> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      await this.db.execute(sql, [...values, id]);
      
      return { id, ...data };
    } catch (error) {
      logger.error('Error updating record:', error);
      throw new Error('Failed to update record');
    }
  }

  async deleteRecord(table: string, id: string | number): Promise<boolean> {
    try {
      const sql = `DELETE FROM ${table} WHERE id = ?`;
      const result = await this.db.execute(sql, [id]);
      
      return result.affectedRows > 0 || result.changes > 0;
    } catch (error) {
      logger.error('Error deleting record:', error);
      throw new Error('Failed to delete record');
    }
  }
}
