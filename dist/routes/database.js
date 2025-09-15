"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const supabaseService_1 = require("../services/supabaseService");
const connections_1 = require("../utils/connections");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.post('/connect', async (req, res) => {
    try {
        const config = req.body;
        if (config.type === 'supabase') {
            if (!config.supabaseUrl || !config.supabaseKey) {
                return res.status(400).json({ error: 'Supabase URL and key are required' });
            }
            const supabaseService = new supabaseService_1.SupabaseService(config.supabaseUrl, config.supabaseKey);
            const connectionId = `supabase_${Date.now()}`;
            (0, connections_1.addConnection)(connectionId, supabaseService);
            await supabaseService.getTables();
            return res.json({
                success: true,
                message: 'Connected to Supabase successfully',
                connectionId
            });
        }
        else {
            const db = (0, database_1.createDatabaseConnection)(config);
            await db.connect();
            const connectionId = `${config.type}_${Date.now()}`;
            (0, connections_1.addConnection)(connectionId, db);
            return res.json({
                success: true,
                message: `Connected to ${config.type} successfully`,
                connectionId
            });
        }
    }
    catch (error) {
        logger_1.default.error('Database connection error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to connect to database',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/tables/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        const tables = await connection.getTables();
        return res.json({ tables });
    }
    catch (error) {
        logger_1.default.error('Error getting tables:', error);
        return res.status(500).json({
            error: 'Failed to retrieve tables',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/table-info/:connectionId/:tableName', async (req, res) => {
    try {
        const { connectionId, tableName } = req.params;
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        const tableInfo = await connection.getTableInfo(tableName);
        return res.json(tableInfo);
    }
    catch (error) {
        logger_1.default.error('Error getting table info:', error);
        return res.status(500).json({
            error: 'Failed to retrieve table info',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/disconnect/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        if (connection.close) {
            await connection.close();
        }
        (0, connections_1.removeConnection)(connectionId);
        return res.json({ success: true, message: 'Disconnected successfully' });
    }
    catch (error) {
        logger_1.default.error('Error disconnecting:', error);
        return res.status(500).json({
            error: 'Failed to disconnect',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=database.js.map