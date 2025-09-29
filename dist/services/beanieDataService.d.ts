import { SupabaseService } from './supabaseService';
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
export declare class BeanieDataService {
    private supabase;
    constructor(supabase: SupabaseService);
    saveBeanieCostData(parsedData: any): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }>;
    private saveMainCostRecord;
    private saveSectionData;
    getBeanieCostData(costId: number): Promise<any>;
    getAllBeanieCostData(): Promise<any[]>;
}
//# sourceMappingURL=beanieDataService.d.ts.map