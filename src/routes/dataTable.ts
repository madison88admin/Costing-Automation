import { Router, Request, Response } from 'express';
import { DataTableQuery } from '../types';
import { DataTableService } from '../services/dataTableService';
import { SupabaseService } from '../services/supabaseService';
import { getConnection } from '../utils/connections';
import logger from '../utils/logger';

const router = Router();

router.get('/data/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const query: DataTableQuery = {
      table: req.query.table as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC',
      filters: req.query.filters ? JSON.parse(req.query.filters as string) : {},
      search: req.query.search as string
    };

    if (!query.table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let dataTableService: DataTableService | SupabaseService;
    
    if (connection instanceof SupabaseService) {
      dataTableService = connection;
    } else {
      dataTableService = new DataTableService(connection);
    }

    const result = await dataTableService.getTableData(query);
    return res.json(result);
  } catch (error) {
    logger.error('Error getting table data:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve table data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/insert/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { table, data } = req.body;

    if (!table || !data) {
      return res.status(400).json({ error: 'Table name and data are required' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let dataTableService: DataTableService | SupabaseService;
    
    if (connection instanceof SupabaseService) {
      dataTableService = connection;
    } else {
      dataTableService = new DataTableService(connection);
    }

    const result = await dataTableService.insertRecord(table, data);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error inserting record:', error);
    return res.status(500).json({ 
      error: 'Failed to insert record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/update/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { table, id, data } = req.body;

    if (!table || !id || !data) {
      return res.status(400).json({ error: 'Table name, ID, and data are required' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let dataTableService: DataTableService | SupabaseService;
    
    if (connection instanceof SupabaseService) {
      dataTableService = connection;
    } else {
      dataTableService = new DataTableService(connection);
    }

    const result = await dataTableService.updateRecord(table, id, data);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error updating record:', error);
    return res.status(500).json({ 
      error: 'Failed to update record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/delete/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { table, id } = req.body;

    if (!table || !id) {
      return res.status(400).json({ error: 'Table name and ID are required' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    let dataTableService: DataTableService | SupabaseService;
    
    if (connection instanceof SupabaseService) {
      dataTableService = connection;
    } else {
      dataTableService = new DataTableService(connection);
    }

    const success = await dataTableService.deleteRecord(table, id);
    return res.json({ success, message: success ? 'Record deleted successfully' : 'Record not found' });
  } catch (error) {
    logger.error('Error deleting record:', error);
    return res.status(500).json({ 
      error: 'Failed to delete record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
