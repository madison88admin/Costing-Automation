"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connections_1 = require("../utils/connections");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.post('/save', async (req, res) => {
    try {
        const { connectionId, manualData } = req.body;
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        if (!manualData) {
            return res.status(400).json({
                success: false,
                error: 'Manual data is required'
            });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        const dbRecord = {
            customer: manualData.customer || '',
            season: manualData.season || '',
            style: manualData.style || '',
            color: manualData.color || '',
            notes: manualData.notes || '',
            fabric_desc: manualData.fabric_desc || '',
            fabric_qty: manualData.fabric_qty || '',
            fabric_price: manualData.fabric_price || '',
            fabric_total: manualData.fabric_total || '',
            trim_desc: manualData.trim_desc || '',
            trim_qty: manualData.trim_qty || '',
            trim_price: manualData.trim_price || '',
            trim_total: manualData.trim_total || '',
            labor_desc: manualData.labor_desc || '',
            labor_qty: manualData.labor_qty || '',
            labor_price: manualData.labor_price || '',
            labor_total: manualData.labor_total || '',
            overhead_desc: manualData.overhead_desc || '',
            overhead_qty: manualData.overhead_qty || '',
            overhead_price: manualData.overhead_price || '',
            overhead_total: manualData.overhead_total || '',
            total_cost: manualData.total_cost || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            data_source: 'manual_entry'
        };
        const result = await connection.query(`INSERT INTO databank (
        customer, season, style, color, notes,
        fabric_desc, fabric_qty, fabric_price, fabric_total,
        trim_desc, trim_qty, trim_price, trim_total,
        labor_desc, labor_qty, labor_price, labor_total,
        overhead_desc, overhead_qty, overhead_price, overhead_total,
        total_cost, created_at, updated_at, data_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            dbRecord.customer, dbRecord.season, dbRecord.style, dbRecord.color, dbRecord.notes,
            dbRecord.fabric_desc, dbRecord.fabric_qty, dbRecord.fabric_price, dbRecord.fabric_total,
            dbRecord.trim_desc, dbRecord.trim_qty, dbRecord.trim_price, dbRecord.trim_total,
            dbRecord.labor_desc, dbRecord.labor_qty, dbRecord.labor_price, dbRecord.labor_total,
            dbRecord.overhead_desc, dbRecord.overhead_qty, dbRecord.overhead_price, dbRecord.overhead_total,
            dbRecord.total_cost, dbRecord.created_at, dbRecord.updated_at, dbRecord.data_source
        ]);
        return res.json({
            success: true,
            message: 'Manual data saved successfully',
            data: result
        });
    }
    catch (error) {
        logger_1.default.error('Error saving manual data:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save manual data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=manualImport.js.map