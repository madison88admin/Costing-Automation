import { Router, Request, Response } from 'express';
import { DatabaseConfig } from '../types';
import { createDatabaseConnection } from '../config/database';
import { SupabaseService } from '../services/supabaseService';
import { addConnection, getConnection, removeConnection } from '../utils/connections';
import logger from '../utils/logger';

const router = Router();

router.post('/connect', async (req: Request, res: Response) => {
  try {
    const config: DatabaseConfig = req.body;
    
    if (config.type === 'supabase') {
      if (!config.supabaseUrl || !config.supabaseKey) {
        return res.status(400).json({ error: 'Supabase URL and key are required' });
      }
      
      const supabaseService = new SupabaseService(config.supabaseUrl, config.supabaseKey);
      const connectionId = `supabase_${Date.now()}`;
      addConnection(connectionId, supabaseService);
      
      // Test connection
      await supabaseService.getTables();
      
      return res.json({ 
        success: true, 
        message: 'Connected to Supabase successfully',
        connectionId 
      });
    } else {
      const db = createDatabaseConnection(config);
      await db.connect();
      
      const connectionId = `${config.type}_${Date.now()}`;
      addConnection(connectionId, db);
      
      return res.json({ 
        success: true, 
        message: `Connected to ${config.type} successfully`,
        connectionId 
      });
    }
  } catch (error) {
    logger.error('Database connection error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to connect to database',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/tables/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const connection = getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    const tables = await connection.getTables();
    return res.json({ tables });
  } catch (error) {
    logger.error('Error getting tables:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve tables',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/table-info/:connectionId/:tableName', async (req: Request, res: Response) => {
  try {
    const { connectionId, tableName } = req.params;
    const connection = getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    const tableInfo = await connection.getTableInfo(tableName);
    return res.json(tableInfo);
  } catch (error) {
    logger.error('Error getting table info:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve table info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/disconnect/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const connection = getConnection(connectionId);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    if (connection.close) {
      await connection.close();
    }
    
    removeConnection(connectionId);
    return res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    logger.error('Error disconnecting:', error);
    return res.status(500).json({ 
      error: 'Failed to disconnect',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
