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
/**
 * Save ballcaps cost data to database
 */
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
        // Get the database connection
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        // Create ballcaps data service
        const ballcapsService = new ballcapsDataService_1.BallCapsDataService(connection);
        // Save the ballcaps cost data
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
/**
 * Get ballcaps cost data by ID
 */
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
        // Get the database connection
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        // Create ballcaps data service
        const ballcapsService = new ballcapsDataService_1.BallCapsDataService(connection);
        // Get the ballcaps cost data
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
/**
 * Get all ballcaps cost records
 */
router.get('/', async (req, res) => {
    try {
        const { connectionId } = req.query;
        if (!connectionId) {
            return res.status(400).json({
                success: false,
                error: 'Connection ID is required'
            });
        }
        // Get the database connection
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(400).json({
                success: false,
                error: 'Database connection not found'
            });
        }
        // Create ballcaps data service
        const ballcapsService = new ballcapsDataService_1.BallCapsDataService(connection);
        // Get all ballcaps cost data
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
