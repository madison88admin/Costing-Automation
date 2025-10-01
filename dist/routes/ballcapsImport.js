"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ballcapsDataService_1 = require("../services/ballcapsDataService");
const connections_1 = require("../utils/connections");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.post('/save', async (req, res) => {
    try {
        const { connectionId, excelData } = req.body;
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        if (!excelData) {
            return res.status(400).json({
                success: false,
                error: 'Excel data is required'
            });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        const ballcapsService = new ballcapsDataService_1.BallCapsDataService(connection);
        const result = await ballcapsService.saveBallCapsCostData(excelData);
        if (result.success) {
            return res.json({
                success: true,
                message: result.message,
                data: result.data
            });
        }
        else {
            return res.status(500).json({
                success: false,
                error: result.message
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error saving ballcaps cost data:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save ballcaps cost data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/:costId', async (req, res) => {
    try {
        const { costId } = req.params;
        const { connectionId } = req.query;
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        const ballcapsService = new ballcapsDataService_1.BallCapsDataService(connection);
        const data = await ballcapsService.getBallCapsCostData(parseInt(costId));
        return res.json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error('Error getting ballcaps cost data:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get ballcaps cost data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const { connectionId } = req.query;
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        const ballcapsService = new ballcapsDataService_1.BallCapsDataService(connection);
        const data = await ballcapsService.getAllBallCapsCostData();
        return res.json({
            success: true,
            data
        });
    }
    catch (error) {
        logger_1.default.error('Error getting all ballcaps cost data:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get ballcaps cost data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ballcapsImport.js.map