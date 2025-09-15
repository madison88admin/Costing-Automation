"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataTableService_1 = require("../services/dataTableService");
const supabaseService_1 = require("../services/supabaseService");
const connections_1 = require("../utils/connections");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.get('/data/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const query = {
            table: req.query.table,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder || 'ASC',
            filters: req.query.filters ? JSON.parse(req.query.filters) : {},
            search: req.query.search
        };
        if (!query.table) {
            return res.status(400).json({ error: 'Table name is required' });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        let dataTableService;
        if (connection instanceof supabaseService_1.SupabaseService) {
            dataTableService = connection;
        }
        else {
            dataTableService = new dataTableService_1.DataTableService(connection);
        }
        const result = await dataTableService.getTableData(query);
        return res.json(result);
    }
    catch (error) {
        logger_1.default.error('Error getting table data:', error);
        return res.status(500).json({
            error: 'Failed to retrieve table data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/insert/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { table, data } = req.body;
        if (!table || !data) {
            return res.status(400).json({ error: 'Table name and data are required' });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        let dataTableService;
        if (connection instanceof supabaseService_1.SupabaseService) {
            dataTableService = connection;
        }
        else {
            dataTableService = new dataTableService_1.DataTableService(connection);
        }
        const result = await dataTableService.insertRecord(table, data);
        return res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('Error inserting record:', error);
        return res.status(500).json({
            error: 'Failed to insert record',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.put('/update/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { table, id, data } = req.body;
        if (!table || !id || !data) {
            return res.status(400).json({ error: 'Table name, ID, and data are required' });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        let dataTableService;
        if (connection instanceof supabaseService_1.SupabaseService) {
            dataTableService = connection;
        }
        else {
            dataTableService = new dataTableService_1.DataTableService(connection);
        }
        const result = await dataTableService.updateRecord(table, id, data);
        return res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('Error updating record:', error);
        return res.status(500).json({
            error: 'Failed to update record',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.delete('/delete/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { table, id } = req.body;
        if (!table || !id) {
            return res.status(400).json({ error: 'Table name and ID are required' });
        }
        const connection = (0, connections_1.getConnection)(connectionId);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        let dataTableService;
        if (connection instanceof supabaseService_1.SupabaseService) {
            dataTableService = connection;
        }
        else {
            dataTableService = new dataTableService_1.DataTableService(connection);
        }
        const success = await dataTableService.deleteRecord(table, id);
        return res.json({ success, message: success ? 'Record deleted successfully' : 'Record not found' });
    }
    catch (error) {
        logger_1.default.error('Error deleting record:', error);
        return res.status(500).json({
            error: 'Failed to delete record',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dataTable.js.map