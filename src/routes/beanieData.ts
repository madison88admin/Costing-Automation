import { Router, Request, Response } from 'express';
import { BeanieDataService, BeanieData } from '../services/beanieDataService';
import logger from '../utils/logger';

const router = Router();
const beanieDataService = new BeanieDataService();

/**
 * Save beanie data to database
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { data, tableName } = req.body;
    
    if (!data) {
      return res.status(400).json({ 
        success: false, 
        error: 'No data provided' 
      });
    }

    logger.info('Received beanie data for saving:', {
      customer: data.customer,
      season: data.season,
      styleNumber: data.styleNumber
    });

    // Ensure table exists
    const tableExists = await beanieDataService.ensureTableExists(tableName);
    if (!tableExists) {
      return res.status(400).json({
        success: false,
        error: `Table '${tableName || 'beanie_costs'}' does not exist. Please create it in your Supabase dashboard.`
      });
    }

    // Save data to database
    const result = await beanieDataService.saveBeanieData(data, tableName);
    
    res.json({
      success: true,
      message: 'Beanie data saved successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error saving beanie data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get all beanie records
 */
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.query;
    const records = await beanieDataService.getBeanieRecords(tableName as string);
    
    res.json({
      success: true,
      data: records
    });

  } catch (error) {
    logger.error('Error fetching beanie records:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Update beanie record
 */
router.put('/update/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, tableName } = req.body;
    
    if (!data) {
      return res.status(400).json({ 
        success: false, 
        error: 'No data provided' 
      });
    }

    const result = await beanieDataService.updateBeanieData(id, data, tableName);
    
    res.json({
      success: true,
      message: 'Beanie data updated successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error updating beanie data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Delete beanie record
 */
router.delete('/delete/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tableName } = req.query;
    
    const success = await beanieDataService.deleteBeanieData(id, tableName as string);
    
    res.json({
      success: true,
      message: 'Beanie data deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting beanie data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
