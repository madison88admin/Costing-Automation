import { SupabaseService } from './supabaseService';
import { TNFBeanieImporter } from '../../public/js/beanieImport';
import logger from '../utils/logger';

export interface BeanieCostData {
  customer: string;
  season: string;
  styleNumber: string;
  styleName: string;
  costedQuantity: string;
  leadtime: string;
  yarn: any[];
  fabric: any[];
  trim: any[];
  knitting: any[];
  operations: any[];
  packaging: any[];
  overhead: any[];
  totalMaterialCost: string;
  totalFactoryCost: string;
  images: any[];
}

export class BeanieDataService {
  private supabase: SupabaseService;

  constructor(supabase: SupabaseService) {
    this.supabase = supabase;
  }

  /**
   * Parse Excel file and save beanie cost data to database
   */
  async saveBeanieCostData(excelData: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Parse the Excel data using the TNFBeanieImporter
      const importer = new TNFBeanieImporter();
      const parsedData = importer.parseExcelData(excelData);

      logger.info('Parsed beanie cost data:', parsedData);

      // Save the main cost record
      const costRecord = await this.saveMainCostRecord(parsedData);

      // Save section data
      await this.saveSectionData(costRecord.id, parsedData);

      return {
        success: true,
        message: 'Beanie cost data saved successfully',
        data: costRecord
      };
    } catch (error) {
      logger.error('Error saving beanie cost data:', error);
      return {
        success: false,
        message: `Failed to save beanie cost data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save the main cost record
   */
  private async saveMainCostRecord(data: BeanieCostData): Promise<any> {
    const costRecord = {
      customer: data.customer,
      season: data.season,
      style_number: data.styleNumber,
      style_name: data.styleName,
      costed_quantity: data.costedQuantity,
      leadtime: data.leadtime,
      total_material_cost: parseFloat(data.totalMaterialCost) || 0,
      total_factory_cost: parseFloat(data.totalFactoryCost) || 0,
      product_type: 'beanie',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await this.supabase.insertRecord('costs', costRecord);
  }

  /**
   * Save section data (yarn, fabric, trim, etc.)
   */
  private async saveSectionData(costId: number, data: BeanieCostData): Promise<void> {
    // Save YARN data
    if (data.yarn && data.yarn.length > 0) {
      const yarnRecords = data.yarn.map(item => ({
        cost_id: costId,
        section: 'yarn',
        material: item.material,
        consumption: item.consumption,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', yarnRecords);
    }

    // Save FABRIC data
    if (data.fabric && data.fabric.length > 0) {
      const fabricRecords = data.fabric.map(item => ({
        cost_id: costId,
        section: 'fabric',
        material: item.material,
        consumption: item.consumption,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', fabricRecords);
    }

    // Save TRIM data
    if (data.trim && data.trim.length > 0) {
      const trimRecords = data.trim.map(item => ({
        cost_id: costId,
        section: 'trim',
        material: item.material,
        consumption: item.consumption,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', trimRecords);
    }

    // Save KNITTING data
    if (data.knitting && data.knitting.length > 0) {
      const knittingRecords = data.knitting.map(item => ({
        cost_id: costId,
        section: 'knitting',
        operation: item.machine,
        time: item.time,
        cost: parseFloat(item.cost) || 0,
        total: parseFloat(item.total) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', knittingRecords);
    }

    // Save OPERATIONS data
    if (data.operations && data.operations.length > 0) {
      const operationsRecords = data.operations.map(item => ({
        cost_id: costId,
        section: 'operations',
        operation: item.operation,
        time: item.time,
        cost: parseFloat(item.cost) || 0,
        total: parseFloat(item.total) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', operationsRecords);
    }

    // Save PACKAGING data
    if (data.packaging && data.packaging.length > 0) {
      const packagingRecords = data.packaging.map(item => ({
        cost_id: costId,
        section: 'packaging',
        type: item.type,
        notes: item.notes,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', packagingRecords);
    }

    // Save OVERHEAD data
    if (data.overhead && data.overhead.length > 0) {
      const overheadRecords = data.overhead.map(item => ({
        cost_id: costId,
        section: 'overhead',
        type: item.type,
        notes: item.notes,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', overheadRecords);
    }
  }

  /**
   * Get beanie cost data by ID
   */
  async getBeanieCostData(costId: number): Promise<any> {
    try {
      // Get main cost record
      const { data: costData, error: costError } = await this.supabase.supabase
        .from('costs')
        .select('*')
        .eq('id', costId)
        .single();

      if (costError) throw costError;

      // Get cost items
      const { data: itemsData, error: itemsError } = await this.supabase.supabase
        .from('cost_items')
        .select('*')
        .eq('cost_id', costId)
        .order('section', { ascending: true });

      if (itemsError) throw itemsError;

      // Group items by section
      const groupedItems = itemsData.reduce((acc: any, item: any) => {
        if (!acc[item.section]) {
          acc[item.section] = [];
        }
        acc[item.section].push(item);
        return acc;
      }, {});

      return {
        ...costData,
        yarn: groupedItems.yarn || [],
        fabric: groupedItems.fabric || [],
        trim: groupedItems.trim || [],
        knitting: groupedItems.knitting || [],
        operations: groupedItems.operations || [],
        packaging: groupedItems.packaging || [],
        overhead: groupedItems.overhead || []
      };
    } catch (error) {
      logger.error('Error getting beanie cost data:', error);
      throw new Error('Failed to retrieve beanie cost data');
    }
  }

  /**
   * Get all beanie cost records
   */
  async getAllBeanieCostData(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('costs')
        .select('*')
        .eq('product_type', 'beanie')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting all beanie cost data:', error);
      throw new Error('Failed to retrieve beanie cost data');
    }
  }
}
