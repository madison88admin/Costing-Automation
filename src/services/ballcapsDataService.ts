import { SupabaseService } from './supabaseService';
const TNFBallCapsImporter = require('../../public/js/ballcapsImport');
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
   * Save already parsed ballcaps cost data to database
   */
  async saveBallCapsCostData(parsedData: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Data is already parsed by the frontend, extract the actual data
      const actualData = parsedData.data || parsedData;
      logger.info('Saving already parsed ballcaps cost data:', actualData);

      // Save the main cost record to databank table
      const costRecord = await this.saveMainCostRecord(actualData);

      logger.info('Ballcaps cost data saved successfully to databank table');

      return {
        success: true,
        message: 'Ballcaps cost data saved successfully to database',
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
    // Calculate totals from parsed data
    const materialTotal = parseFloat(data.totalMaterialCost) || 0;
    const factoryTotal = parseFloat(data.totalFactoryCost) || 0;
    
    // Get main material (first fabric item)
    const mainMaterial = data.fabric && data.fabric.length > 0 ? data.fabric[0].material : '';
    const materialConsumption = data.fabric && data.fabric.length > 0 ? data.fabric[0].consumption : '';
    const materialPrice = data.fabric && data.fabric.length > 0 ? data.fabric[0].price : '';
    
    // Calculate trim cost (sum of all trim items)
    const trimCost = data.trim ? data.trim.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) : 0;
    
    // Get operations cost
    const opsCost = data.operations && data.operations.length > 0 ? parseFloat(data.operations[0].cost) || 0 : 0;
    
    // Get packaging cost
    const packagingCost = data.packaging ? data.packaging.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) : 0;
    
    // Get overhead and profit
    const overhead = data.overhead ? data.overhead.find(item => item.type === 'OVERHEAD') : null;
    const profit = data.overhead ? data.overhead.find(item => item.type === 'PROFIT') : null;
    const ohCost = overhead ? parseFloat(overhead.cost) || 0 : 0;
    const profitCost = profit ? parseFloat(profit.cost) || 0 : 0;
    
    const costRecord = {
      customer: data.customer,
      season: data.season,
      style_number: data.styleNumber,
      style_name: data.styleName,
      main_material: mainMaterial,
      material_consumption: materialConsumption,
      material_price: materialPrice,
      trim_cost: trimCost,
      total_material_cost: materialTotal,
      ops_cost: opsCost,
      packaging: packagingCost,
      oh: ohCost,
      profit: profitCost,
      ttl_fty_cost: factoryTotal
    };

    logger.info('Saving ballcaps data to databank:', costRecord);
    logger.info('Data being saved:', {
      customer: data.customer,
      season: data.season,
      styleNumber: data.styleNumber,
      styleName: data.styleName,
      costedQuantity: data.costedQuantity,
      leadtime: data.leadtime,
      totalMaterialCost: data.totalMaterialCost,
      totalFactoryCost: data.totalFactoryCost,
      sections: {
        fabric: data.fabric?.length || 0,
        embroidery: data.embroidery?.length || 0,
        trim: data.trim?.length || 0,
        operations: data.operations?.length || 0,
        packaging: data.packaging?.length || 0,
        overhead: data.overhead?.length || 0
      }
    });

    return await this.supabase.insertRecord('databank', costRecord);
  }

  /**
   * Save section data (fabric, embroidery, trim, etc.)
   */
  private async saveSectionData(costId: number, data: BallCapsCostData): Promise<void> {
    logger.info(`Saving section data for cost ID: ${costId}`);
    logger.info('Available sections:', {
      fabric: data.fabric?.length || 0,
      embroidery: data.embroidery?.length || 0,
      trim: data.trim?.length || 0,
      operations: data.operations?.length || 0,
      packaging: data.packaging?.length || 0,
      overhead: data.overhead?.length || 0
    });

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
      logger.info(`Saving ${fabricRecords.length} fabric records:`, fabricRecords);
      await this.supabase.bulkInsert('cost_items', fabricRecords);
    }

    // Save EMBROIDERY data (OTHER FABRIC/S - TRIM/S)
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
      logger.info(`Saving ${embroideryRecords.length} embroidery (OTHER FABRIC/S - TRIM/S) records:`, embroideryRecords);
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
      logger.info(`Saving ${trimRecords.length} trim records:`, trimRecords);
      await this.supabase.bulkInsert('cost_items', trimRecords);
    }

    // Save OPERATIONS data
    if (data.operations && data.operations.length > 0) {
      const operationsRecords = data.operations.map(item => ({
        cost_id: costId,
        section: 'operations',
        operation: item.operation,
        time: item.time || item.smv, // Support both time and smv fields
        cost: parseFloat(item.cost) || 0,
        total: parseFloat(item.total) || 0,
        is_subtotal: item.isSubtotal || false
      }));
      logger.info(`Saving ${operationsRecords.length} operations records:`, operationsRecords);
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
      logger.info(`Saving ${packagingRecords.length} packaging records:`, packagingRecords);
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
      logger.info(`Saving ${overheadRecords.length} overhead records:`, overheadRecords);
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
