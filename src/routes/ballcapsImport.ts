import { Router, Request, Response } from 'express';
import { BallCapsDataService } from '../services/ballcapsDataService';
import { getConnection } from '../utils/connections';
import logger from '../utils/logger';

const router = Router();

/**
 * Save ballcaps cost data to database
 */
router.post('/save', async (req: Request, res: Response) => {
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
    const connection = getConnection(connectionId);
    if (!connection) {
      return res.status(400).json({ 
        success: false, 
        error: 'Database connection not found' 
      });
    }

    // Create ballcaps data service
    const ballcapsService = new BallCapsDataService(connection);

    // Save the ballcaps cost data
    const result = await ballcapsService.saveBallCapsCostData(excelData);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Error saving ballcaps cost data:', error);
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
router.get('/:costId', async (req: Request, res: Response) => {
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
    const connection = getConnection(connectionId as string);
    if (!connection) {
      return res.status(400).json({ 
        success: false, 
        error: 'Database connection not found' 
      });
    }

    // Create ballcaps data service
    const ballcapsService = new BallCapsDataService(connection);

    // Get the ballcaps cost data
    const data = await ballcapsService.getBallCapsCostData(parseInt(costId));

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error getting ballcaps cost data:', error);
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
router.get('/', async (req: Request, res: Response) => {
  try {
    const { connectionId } = req.query;

    if (!connectionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Connection ID is required' 
      });
    }

    // Get the database connection
    const connection = getConnection(connectionId as string);
    if (!connection) {
      return res.status(400).json({ 
        success: false, 
        error: 'Database connection not found' 
      });
    }

    // Create ballcaps data service
    const ballcapsService = new BallCapsDataService(connection);

    // Get all ballcaps cost data
    const data = await ballcapsService.getAllBallCapsCostData();

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error getting all ballcaps cost data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get ballcaps cost data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
