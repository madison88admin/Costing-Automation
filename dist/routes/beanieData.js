"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const beanieDataService_1 = require("../services/beanieDataService");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
const beanieDataService = new beanieDataService_1.BeanieDataService();
router.post('/save', async (req, res) => {
    try {
        const { data, tableName } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }
        logger_1.default.info('Received beanie data for saving:', {
            customer: data.customer,
            season: data.season,
            styleNumber: data.styleNumber
        });
        const tableExists = await beanieDataService.ensureTableExists(tableName);
        if (!tableExists) {
            return res.status(400).json({
                success: false,
                error: `Table '${tableName || 'beanie_costs'}' does not exist. Please create it in your Supabase dashboard.`
            });
        }
        const result = await beanieDataService.saveBeanieData(data, tableName);
        res.json({
            success: true,
            message: 'Beanie data saved successfully',
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error saving beanie data:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.get('/records', async (req, res) => {
    try {
        const { tableName } = req.query;
        const records = await beanieDataService.getBeanieRecords(tableName);
        res.json({
            success: true,
            data: records
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching beanie records:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, tableName } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }
        const result = await beanieDataService.updateBeanieData(id, data, tableName);
        res.json({
            success: true,
            message: 'Beanie data updated successfully',
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error updating beanie data:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { tableName } = req.query;
        const success = await beanieDataService.deleteBeanieData(id, tableName);
        res.json({
            success: true,
            message: 'Beanie data deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting beanie data:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});
exports.default = router;
//# sourceMappingURL=beanieData.js.map