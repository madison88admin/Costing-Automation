import { SupabaseService } from './supabaseService';
const TNFBeanieImporter = require('../../public/js/beanieImport');
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


export class BeanieDataService {
  private supabase: SupabaseService;

  constructor(supabase: SupabaseService) {
    this.supabase = supabase;
  }

  /**
   * Save already parsed beanie cost data to database
   */
  async saveBeanieCostData(parsedData: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Data is already parsed by the frontend, extract the actual data
      const actualData = parsedData.data || parsedData;
      logger.info('Saving already parsed beanie cost data:', actualData);

      // Save the main cost record to databank table
      const costRecord = await this.saveMainCostRecord(actualData);

      logger.info('Beanie cost data saved successfully to databank table');

    return {
        success: true,
        message: 'Beanie cost data saved successfully to database',
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
  private async saveMainCostRecord(data: BeanieData): Promise<any> {
    // Calculate totals from parsed data
    const materialTotal = parseFloat(data.totalMaterialCost) || 0;
    const factoryTotal = parseFloat(data.totalFactoryCost) || 0;
    
    // Get main material (first yarn or fabric item)
    const mainMaterial = (data.yarn && data.yarn.length > 0 ? data.yarn[0].material : '') || 
                        (data.fabric && data.fabric.length > 0 ? data.fabric[0].material : '');
    const materialConsumption = (data.yarn && data.yarn.length > 0 ? data.yarn[0].consumption : '') || 
                               (data.fabric && data.fabric.length > 0 ? data.fabric[0].consumption : '');
    const materialPrice = (data.yarn && data.yarn.length > 0 ? data.yarn[0].price : '') || 
                         (data.fabric && data.fabric.length > 0 ? data.fabric[0].price : '');
    
    // Calculate trim cost (sum of all trim items)
    const trimCost = data.trim ? data.trim.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) : 0;
    
    // Get knitting cost
    const knittingCost = data.knitting && data.knitting.length > 0 ? parseFloat(data.knitting[0].cost) || 0 : 0;
    
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
      knitting_cost: knittingCost,
      ops_cost: opsCost,
      packaging: packagingCost,
      oh: ohCost,
      profit: profitCost,
      ttl_fty_cost: factoryTotal
    };

    logger.info('Saving beanie data to databank:', costRecord);

    return await this.supabase.insertRecord('databank', costRecord);
  }

  /**
   * Save section data (yarn, fabric, trim, knitting, operations, packaging, overhead)
   */
  private async saveSectionData(costId: number, data: BeanieData): Promise<void> {
    // Save YARN data
    if (data.yarn && data.yarn.length > 0) {
      const yarnRecords = data.yarn.map(item => ({
        cost_id: costId,
        section: 'yarn',
        material: item.material,
        consumption: item.consumption,
        price: parseFloat(item.price) || 0,
        cost: parseFloat(item.cost) || 0,
        is_subtotal: false
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
        is_subtotal: false
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
        is_subtotal: false
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
        total: parseFloat(item.cost) || 0,
        is_subtotal: false
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
        is_subtotal: false
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
        is_subtotal: false
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
        is_subtotal: false
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