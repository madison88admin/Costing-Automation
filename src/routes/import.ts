import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ImportConfig } from '../types';
import { ImportService } from '../services/importService';
import { SupabaseService } from '../services/supabaseService';
import { getConnection } from '../utils/connections';
import logger from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ];
    
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.xlsm'];
    const extension = file.originalname.split('.').pop();
    const fileExtension = extension ? '.' + extension.toLowerCase() : '';
    
    if (allowedTypes.includes(file.mimetype) || 
        allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files (.csv, .xlsx, .xls, .xlsm) are allowed.'));
    }
  }
});

// Store active connections (same as other routes)
const connections = new Map<string, any>();

router.post('/preview/:connectionId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { maxRows = 10 } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const importService = new ImportService(null as any); // We don't need DB connection for preview
    const preview = await importService.getFilePreview(req.file, parseInt(maxRows as string));

    return res.json({ 
      success: true, 
      data: preview,
      columns: preview.length > 0 ? Object.keys(preview[0]) : []
    });
  } catch (error) {
    logger.error('Error previewing file:', error);
    return res.status(500).json({ 
      error: 'Failed to preview file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/csv/:connectionId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const config: ImportConfig = JSON.parse(req.body.config);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const importService = new ImportService(connection);
    const result = await importService.importCSV(req.file, config);

    return res.json(result);
  } catch (error) {
    logger.error('Error importing CSV:', error);
    return res.status(500).json({ 
      error: 'Failed to import CSV',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/excel/:connectionId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const config: ImportConfig = JSON.parse(req.body.config);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    const importService = new ImportService(connection);
    const result = await importService.importExcel(req.file, config);

    return res.json(result);
  } catch (error) {
    logger.error('Error importing Excel:', error);
    return res.status(500).json({ 
      error: 'Failed to import Excel',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


router.post('/bulk-insert/:connectionId', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { table, data } = req.body;

    if (!table || !data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Table name and data array are required' });
    }

    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection instanceof SupabaseService) {
      const result = await connection.bulkInsert(table, data);
      return res.json({ 
        success: true, 
        message: `Successfully inserted ${result.length} records`,
        data: result
      });
    } else {
      // For other database types, insert one by one
      const importService = new ImportService(connection);
      const results = [];
      
      for (const record of data) {
        try {
          const result = await importService.insertRecord(table, record);
          results.push(result);
        } catch (error) {
          logger.error('Error inserting record:', error);
        }
      }
      
      return res.json({ 
        success: true, 
        message: `Successfully inserted ${results.length} records`,
        data: results
      });
    }
  } catch (error) {
    logger.error('Error bulk inserting:', error);
    return res.status(500).json({ 
      error: 'Failed to bulk insert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
