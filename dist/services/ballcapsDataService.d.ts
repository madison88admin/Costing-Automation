import { SupabaseService } from './supabaseService';
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
export declare class BallCapsDataService {
    private supabase;
    constructor(supabase: SupabaseService);
    saveBallCapsCostData(parsedData: any): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }>;
    private saveMainCostRecord;
    private saveSectionData;
    getBallCapsCostData(costId: number): Promise<any>;
    getAllBallCapsCostData(): Promise<any[]>;
}
//# sourceMappingURL=ballcapsDataService.d.ts.map