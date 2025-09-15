    export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlite' | 'supabase';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  ssl?: boolean;
  filename?: string; // for SQLite
  supabaseUrl?: string; // for Supabase
  supabaseKey?: string; // for Supabase
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  defaultValue?: any;
}

export interface TableInfo {
  name: string;
  columns: TableColumn[];
  rowCount: number;
}

export interface DataTableQuery {
  table: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
  search?: string;
}

export interface DataTableResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ImportResult {
  success: boolean;
  message: string;
  rowsProcessed: number;
  rowsInserted: number;
  errors: string[];
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ColumnMapping {
  fileColumn: string;
  databaseColumn: string;
  required: boolean;
  dataType?: string;
}

export interface ImportConfig {
  table: string;
  mappings: ColumnMapping[];
  skipFirstRow: boolean;
  updateExisting: boolean;
  batchSize: number;
}
