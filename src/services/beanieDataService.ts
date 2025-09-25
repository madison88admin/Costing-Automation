import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

export interface BeanieData {
  customer: string;
  season: string;
  styleNumber: string;
  styleName: string;
  costedQuantity: string;
  leadtime: string;
  yarn: Array<{
    material: string;
    consumption: string;
    price: string;
    cost: string;
  }>;
  fabric: Array<{
    material: string;
    consumption: string;
    price: string;
    cost: string;
  }>;
  trim: Array<{
    material: string;
    consumption: string;
    price: string;
    cost: string;
  }>;
  knitting: Array<{
    machine: string;
    time: string;
    sah: string;
    cost: string;
  }>;
  operations: Array<{
    operation: string;
    time: string;
    cost: string;
    total: string;
  }>;
  packaging: Array<{
    type: string;
    notes: string;
    cost: string;
  }>;
  overhead: Array<{
    type: string;
    notes: string;
    cost: string;
  }>;
  totalMaterialCost: string;
  totalFactoryCost: string;
  images: any[];
}

export interface DatabaseRecord {
  Season: string;
  Customer: string;
  Style_Number: string;
  Style_Name: string;
  Main_Material: string;
  Material_Consumption: string;
  Material_Price: string;
  Trim_Cost: string;
  Total_Material_Cost: string;
  Knitting_Machine: string;
  Knitting_Time: string;
  Knitting_CPM: string;
  Knitting_Cost: string;
  Ops_Cost: string;
  Knitting_Ops_Cost: string;
  Packaging: string;
  OH: string;
  Profit: string;
  FTY_Adjustment: string;
  TTL_FTY_Cost: string;
}

export class BeanieDataService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://icavnpspgmcrrqmsprze.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXZucHNwZ21jcnJxbXNwcnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzEyMzMsImV4cCI6MjA3MzA0NzIzM30.5_-LPYwj5ks_KyCXwCae2mcbI-T7em48RsMiv4Oaurk';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Convert beanie data to database record format
   */
  private convertToDatabaseRecord(data: BeanieData): DatabaseRecord {
    // Get main material (first yarn item)
    const mainMaterial = data.yarn.length > 0 ? data.yarn[0].material : '';
    const materialConsumption = data.yarn.length > 0 ? data.yarn[0].consumption : '';
    const materialPrice = data.yarn.length > 0 ? data.yarn[0].price : '';

    // Calculate trim cost (sum of all trim items)
    const trimCost = data.trim.reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0).toFixed(2);

    // Get knitting machine and details
    const knittingMachine = data.knitting.length > 0 ? data.knitting[0].machine : '';
    const knittingTime = data.knitting.length > 0 ? data.knitting[0].time : '';
    const knittingCPM = data.knitting.length > 0 ? data.knitting[0].sah : '';
    const knittingCost = data.knitting.length > 0 ? data.knitting[0].cost : '';

    // Calculate operations cost (sum of all operations)
    const opsCost = data.operations.reduce((sum, item) => sum + parseFloat(item.total || '0'), 0).toFixed(2);

    // Calculate knitting + ops cost
    const knittingOpsCost = (parseFloat(knittingCost || '0') + parseFloat(opsCost)).toFixed(2);

    // Calculate packaging cost (sum of all packaging items)
    const packagingCost = data.packaging.reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0).toFixed(2);

    // Separate overhead and profit
    const overheadItems = data.overhead.filter(item => item.type !== 'PROFIT');
    const profitItems = data.overhead.filter(item => item.type === 'PROFIT');
    
    const ohCost = overheadItems.reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0).toFixed(2);
    const profitCost = profitItems.reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0).toFixed(2);

    // FTY Adjustment (if any adjustment items exist)
    const ftyAdjustment = data.overhead
      .filter(item => item.type.includes('adjustment') || item.type.includes('support'))
      .reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0)
      .toFixed(2);

    return {
      Season: data.season,
      Customer: data.customer,
      Style_Number: data.styleNumber,
      Style_Name: data.styleName,
      Main_Material: mainMaterial,
      Material_Consumption: materialConsumption,
      Material_Price: materialPrice,
      Trim_Cost: trimCost,
      Total_Material_Cost: data.totalMaterialCost,
      Knitting_Machine: knittingMachine,
      Knitting_Time: knittingTime,
      Knitting_CPM: knittingCPM,
      Knitting_Cost: knittingCost,
      Ops_Cost: opsCost,
      Knitting_Ops_Cost: knittingOpsCost,
      Packaging: packagingCost,
      OH: ohCost,
      Profit: profitCost,
      FTY_Adjustment: ftyAdjustment,
      TTL_FTY_Cost: data.totalFactoryCost
    };
  }

  /**
   * Save beanie data to database
   */
  async saveBeanieData(data: BeanieData, tableName: string = 'beanie_costs'): Promise<any> {
    try {
      logger.info('Converting beanie data to database format...');
      const dbRecord = this.convertToDatabaseRecord(data);
      
      logger.info('Saving beanie data to database:', {
        table: tableName,
        season: dbRecord.Season,
        customer: dbRecord.Customer,
        styleNumber: dbRecord.Style_Number
      });

      const { data: result, error } = await this.supabase
        .from(tableName)
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        logger.error('Database error:', error);
        throw new Error(`Failed to save data: ${error.message}`);
      }

      logger.info('Successfully saved beanie data to database:', result);
      return result;
    } catch (error) {
      logger.error('Error saving beanie data:', error);
      throw error;
    }
  }

  /**
   * Get all beanie records from database
   */
  async getBeanieRecords(tableName: string = 'beanie_costs'): Promise<DatabaseRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Database error:', error);
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching beanie records:', error);
      throw error;
    }
  }

  /**
   * Update existing beanie record
   */
  async updateBeanieData(id: string | number, data: BeanieData, tableName: string = 'beanie_costs'): Promise<any> {
    try {
      const dbRecord = this.convertToDatabaseRecord(data);
      
      const { data: result, error } = await this.supabase
        .from(tableName)
        .update(dbRecord)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Database error:', error);
        throw new Error(`Failed to update data: ${error.message}`);
      }

      logger.info('Successfully updated beanie data:', result);
      return result;
    } catch (error) {
      logger.error('Error updating beanie data:', error);
      throw error;
    }
  }

  /**
   * Delete beanie record
   */
  async deleteBeanieData(id: string | number, tableName: string = 'beanie_costs'): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Database error:', error);
        throw new Error(`Failed to delete data: ${error.message}`);
      }

      logger.info('Successfully deleted beanie data');
      return true;
    } catch (error) {
      logger.error('Error deleting beanie data:', error);
      throw error;
    }
  }

  /**
   * Check if table exists and create if needed
   */
  async ensureTableExists(tableName: string = 'beanie_costs'): Promise<boolean> {
    try {
      // Try to query the table to see if it exists
      const { error } = await this.supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        logger.info(`Table ${tableName} does not exist. Please create it in your Supabase dashboard.`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking table existence:', error);
      return false;
    }
  }
}