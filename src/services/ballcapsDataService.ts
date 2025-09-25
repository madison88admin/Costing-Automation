import { SupabaseService } from './supabaseService';
import { TNFBallCapsImporter } from '../../public/js/ballcapsImport';
import logger from '../utils/logger';

export interface BallCapsCostData {
  customer: string;
  season: string;
  styleNumber: string;
  styleName: string;
  costedQuantity: string;
  leadtime: string;
  fabric: any[];
  embroidery: any[];
  trim: any[];
  operations: any[];
  packaging: any[];
  overhead: any[];
  totalMaterialCost: string;
  totalFactoryCost: string;
  images: any[];
}

export class BallCapsDataService {
  private supabase: SupabaseService;

  constructor(supabase: SupabaseService) {
    this.supabase = supabase;
  }

  /**
   * Parse Excel file and save ballcaps cost data to database
   */
  async saveBallCapsCostData(excelData: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Parse the Excel data using the TNFBallCapsImporter
      const importer = new TNFBallCapsImporter();
      const parsedData = importer.parseExcelData(excelData);

      logger.info('Parsed ballcaps cost data:', parsedData);

      // Save the main cost record
      const costRecord = await this.saveMainCostRecord(parsedData);

      // Save section data
      await this.saveSectionData(costRecord.id, parsedData);

      return {
        success: true,
        message: 'Ballcaps cost data saved successfully',
        data: costRecord
      };
    } catch (error) {
      logger.error('Error saving ballcaps cost data:', error);
      return {
        success: false,
        message: `Failed to save ballcaps cost data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Save the main cost record
   */
  private async saveMainCostRecord(data: BallCapsCostData): Promise<any> {
    const costRecord = {
      customer: data.customer,
      season: data.season,
      style_number: data.styleNumber,
      style_name: data.styleName,
      costed_quantity: data.costedQuantity,
      leadtime: data.leadtime,
      total_material_cost: parseFloat(data.totalMaterialCost) || 0,
      total_factory_cost: parseFloat(data.totalFactoryCost) || 0,
      product_type: 'ballcaps',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await this.supabase.insertRecord('costs', costRecord);
  }

  /**
   * Save section data (fabric, embroidery, trim, etc.)
   */
  private async saveSectionData(costId: number, data: BallCapsCostData): Promise<void> {
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

    // Save EMBROIDERY data
    if (data.embroidery && data.embroidery.length > 0) {
      const embroideryRecords = data.embroidery.map(item => ({
        cost_id: costId,
        section: 'embroidery',
        material: item.material,
        consumption: item.consumption,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      await this.supabase.bulkInsert('cost_items', embroideryRecords);
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
   * Get ballcaps cost data by ID
   */
  async getBallCapsCostData(costId: number): Promise<any> {
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
        fabric: groupedItems.fabric || [],
        embroidery: groupedItems.embroidery || [],
        trim: groupedItems.trim || [],
        operations: groupedItems.operations || [],
        packaging: groupedItems.packaging || [],
        overhead: groupedItems.overhead || []
      };
    } catch (error) {
      logger.error('Error getting ballcaps cost data:', error);
      throw new Error('Failed to retrieve ballcaps cost data');
    }
  }

  /**
   * Get all ballcaps cost records
   */
  async getAllBallCapsCostData(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('costs')
        .select('*')
        .eq('product_type', 'ballcaps')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting all ballcaps cost data:', error);
      throw new Error('Failed to retrieve ballcaps cost data');
    }
  }
}
