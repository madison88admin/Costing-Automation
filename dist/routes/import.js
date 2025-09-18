"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const importService_1 = require("../services/importService");
const supabaseService_1 = require("../services/supabaseService");
const connections_1 = require("../utils/connections");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'text/csv'
        ];
        if (allowedTypes.includes(file.mimetype) ||
            file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only CSV files are allowed.'));
        }
    }
});
const connections = new Map();
router.post('/preview/:connectionId', upload.single('file'), async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { maxRows = 10 } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const importService = new importService_1.ImportService(null);
        const preview = await importService.getFilePreview(req.file, parseInt(maxRows));
        return res.json({
            success: true,
            data: preview,
            columns: preview.length > 0 ? Object.keys(preview[0]) : []
        });
    }
    catch (error) {
        logger_1.default.error('Error previewing file:', error);
        return res.status(500).json({
            error: 'Failed to preview file',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/csv/:connectionId', upload.single('file'), async (req, res) => {
    try {
        const { connectionId } = req.params;
        const config = JSON.parse(req.body.config);
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        const importService = new importService_1.ImportService(connection);
        const result = await importService.importCSV(req.file, config);
        return res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error importing CSV:', error);
        return res.status(500).json({
            error: 'Failed to import CSV',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/bulk-insert/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { table, data } = req.body;
        if (!table || !data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Table name and data array are required' });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        if (connection instanceof supabaseService_1.SupabaseService) {
            const result = await connection.bulkInsert(table, data);
            return res.json({
                success: true,
                message: `Successfully inserted ${result.length} records`,
                data: result
            });
        }
        else {
            const importService = new importService_1.ImportService(connection);
            const results = [];
            for (const record of data) {
                try {
                    const result = await importService.insertRecord(table, record);
                    results.push(result);
                }
                catch (error) {
                    logger_1.default.error('Error inserting record:', error);
                }
            }
            return res.json({
                success: true,
                message: `Successfully inserted ${results.length} records`,
                data: results
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error bulk inserting:', error);
        return res.status(500).json({
            error: 'Failed to bulk insert',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=import.js.map