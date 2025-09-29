"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BallCapsDataService = void 0;
const TNFBallCapsImporter = require('../../public/js/ballcapsImport');
const logger_1 = __importDefault(require("../utils/logger"));
class BallCapsDataService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async saveBallCapsCostData(parsedData) {
        try {
            const actualData = parsedData.data || parsedData;
            logger_1.default.info('Saving already parsed ballcaps cost data:', actualData);
            const costRecord = await this.saveMainCostRecord(actualData);
            logger_1.default.info('Ballcaps cost data saved successfully to databank table');
            return {
                success: true,
                message: 'Ballcaps cost data saved successfully to database',
                data: costRecord
            };
        }
        catch (error) {
            logger_1.default.error('Error saving ballcaps cost data:', error);
            return {
                success: false,
                message: `Failed to save ballcaps cost data: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async saveMainCostRecord(data) {
        const materialTotal = parseFloat(data.totalMaterialCost) || 0;
        const factoryTotal = parseFloat(data.totalFactoryCost) || 0;
        const mainMaterial = data.fabric && data.fabric.length > 0 ? data.fabric[0].material : '';
        const materialConsumption = data.fabric && data.fabric.length > 0 ? data.fabric[0].consumption : '';
        const materialPrice = data.fabric && data.fabric.length > 0 ? data.fabric[0].price : '';
        const trimCost = data.trim ? data.trim.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) : 0;
        const opsCost = data.operations && data.operations.length > 0 ? parseFloat(data.operations[0].cost) || 0 : 0;
        const packagingCost = data.packaging ? data.packaging.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0) : 0;
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
        logger_1.default.info('Saving ballcaps data to databank:', costRecord);
        logger_1.default.info('Data being saved:', {
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
    async saveSectionData(costId, data) {
        logger_1.default.info(`Saving section data for cost ID: ${costId}`);
        logger_1.default.info('Available sections:', {
            fabric: data.fabric?.length || 0,
            embroidery: data.embroidery?.length || 0,
            trim: data.trim?.length || 0,
            operations: data.operations?.length || 0,
            packaging: data.packaging?.length || 0,
            overhead: data.overhead?.length || 0
        });
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
            logger_1.default.info(`Saving ${fabricRecords.length} fabric records:`, fabricRecords);
            await this.supabase.bulkInsert('cost_items', fabricRecords);
        }
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
            logger_1.default.info(`Saving ${embroideryRecords.length} embroidery (OTHER FABRIC/S - TRIM/S) records:`, embroideryRecords);
            await this.supabase.bulkInsert('cost_items', embroideryRecords);
        }
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
            logger_1.default.info(`Saving ${trimRecords.length} trim records:`, trimRecords);
            await this.supabase.bulkInsert('cost_items', trimRecords);
        }
        if (data.operations && data.operations.length > 0) {
            const operationsRecords = data.operations.map(item => ({
                cost_id: costId,
                section: 'operations',
                operation: item.operation,
                time: item.time || item.smv,
                cost: parseFloat(item.cost) || 0,
                total: parseFloat(item.total) || 0,
                is_subtotal: item.isSubtotal || false
            }));
            logger_1.default.info(`Saving ${operationsRecords.length} operations records:`, operationsRecords);
            await this.supabase.bulkInsert('cost_items', operationsRecords);
        }
        if (data.packaging && data.packaging.length > 0) {
            const packagingRecords = data.packaging.map(item => ({
                cost_id: costId,
                section: 'packaging',
                type: item.type,
                notes: item.notes,
                cost: parseFloat(item.cost) || 0,
                is_subtotal: item.isSubtotal || false
            }));
            logger_1.default.info(`Saving ${packagingRecords.length} packaging records:`, packagingRecords);
            await this.supabase.bulkInsert('cost_items', packagingRecords);
        }
        if (data.overhead && data.overhead.length > 0) {
            const overheadRecords = data.overhead.map(item => ({
                cost_id: costId,
                section: 'overhead',
                type: item.type,
                notes: item.notes,
                cost: parseFloat(item.cost) || 0,
                is_subtotal: item.isSubtotal || false
            }));
            logger_1.default.info(`Saving ${overheadRecords.length} overhead records:`, overheadRecords);
            await this.supabase.bulkInsert('cost_items', overheadRecords);
        }
    }
    async getBallCapsCostData(costId) {
        try {
            const { data: costData, error: costError } = await this.supabase.client
                .from('costs')
                .select('*')
                .eq('id', costId)
                .single();
            if (costError)
                throw costError;
            const { data: itemsData, error: itemsError } = await this.supabase.client
                .from('cost_items')
                .select('*')
                .eq('cost_id', costId)
                .order('section', { ascending: true });
            if (itemsError)
                throw itemsError;
            const groupedItems = itemsData.reduce((acc, item) => {
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
        }
        catch (error) {
            logger_1.default.error('Error getting ballcaps cost data:', error);
            throw new Error('Failed to retrieve ballcaps cost data');
        }
    }
    async getAllBallCapsCostData() {
        try {
            const { data, error } = await this.supabase.client
                .from('costs')
                .select('*')
                .eq('product_type', 'ballcaps')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            logger_1.default.error('Error getting all ballcaps cost data:', error);
            throw new Error('Failed to retrieve ballcaps cost data');
        }
    }
}
exports.BallCapsDataService = BallCapsDataService;
//# sourceMappingURL=ballcapsDataService.js.map