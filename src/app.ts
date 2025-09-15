import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import databaseRoutes from './routes/database';
import dataTableRoutes from './routes/dataTable';
import importRoutes from './routes/import';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/api/database', databaseRoutes);
app.use('/api/datatable', dataTableRoutes);
app.use('/api/import', importRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test Supabase connection endpoint
app.get('/test-supabase', async (req: Request, res: Response) => {
  try {
    const { testSupabaseConnection, getSupabaseTables } = await import('./utils/supabaseTest');
    
    const url = 'https://icavnpspgmcrrqmsprze.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYXZucHNwZ21jcnJxbXNwcnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzEyMzMsImV4cCI6MjA3MzA0NzIzM30.5_-LPYwj5ks_KyCXwCae2mcbI-T7em48RsMiv4Oaurk';
    
    const connectionTest = await testSupabaseConnection(url, key);
    const tables = await getSupabaseTables(url, key);
    
    res.json({
      connection: connectionTest,
      tables: tables,
      message: tables.length > 0 
        ? `Found ${tables.length} tables: ${tables.join(', ')}`
        : 'No tables found. You may need to create tables in your Supabase dashboard.'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
