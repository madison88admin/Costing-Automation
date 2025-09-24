import { Router, Request, Response } from 'express';
import { BeanieDataService } from '../services/beanieDataService';
import { getConnection } from '../utils/connections';
import logger from '../utils/logger';

const router = Router();

/**
 * Save beanie cost data to database
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

    // Create beanie data service
    const beanieService = new BeanieDataService(connection);

    // Save the beanie cost data
    const result = await beanieService.saveBeanieCostData(excelData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    logger.error('Error saving beanie cost data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save beanie cost data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get beanie cost data by ID
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

    // Create beanie data service
    const beanieService = new BeanieDataService(connection);

    // Get the beanie cost data
    const data = await beanieService.getBeanieCostData(parseInt(costId));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error getting beanie cost data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get beanie cost data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all beanie cost records
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

    // Create beanie data service
    const beanieService = new BeanieDataService(connection);

    // Get all beanie cost data
    const data = await beanieService.getAllBeanieCostData();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error getting all beanie cost data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get beanie cost data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
