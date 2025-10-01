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
    const { table, id, idField = 'id', data } = req.body;

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

    // Use custom update method that handles different ID fields
    const result = await updateRecordWithCustomId(dataTableService, table, id, idField, data);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error updating record:', error);
    return res.status(500).json({ 
      error: 'Failed to update record',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to update record with custom ID field
async function updateRecordWithCustomId(service: DataTableService | SupabaseService, table: string, id: string | number, idField: string, data: Record<string, any>): Promise<any> {
  if (service instanceof SupabaseService) {
    // For Supabase, we need to use the REST API with custom ID field
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${idField}=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase update failed (${response.status}): ${errorText}`);
    }

    const result = await response.json() as any[];
    return result[0]; // Return the first (and should be only) updated record
  } else {
    // For other database types, use the standard update method
    return await service.updateRecord(table, id, data);
  }
}

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
