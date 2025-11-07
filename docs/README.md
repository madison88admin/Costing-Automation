# Costing Automation - Data Management System

A comprehensive TypeScript-based data management system with database connectivity, data table handling, and CSV/Excel import functionality. Built with Express.js and optimized for Supabase integration.

## Features

### 🗄️ Database Management
- **Multi-database support**: MySQL, PostgreSQL, SQLite, and Supabase
- **Connection management**: Secure database connections with connection pooling
- **Table introspection**: Automatic table and column discovery
- **Real-time connectivity**: Test and manage database connections

### 📊 Data Table Operations
- **CRUD operations**: Create, Read, Update, Delete records
- **Advanced querying**: Pagination, sorting, filtering, and searching
- **Bulk operations**: Efficient handling of large datasets
- **Type-safe operations**: Full TypeScript support

### 📁 File Import System
- **CSV Import**: Parse and import CSV files with column mapping
- **Excel Import**: Support for .xlsx files with sheet selection
- **Data validation**: Automatic data type conversion and validation
- **Batch processing**: Efficient handling of large files
- **Preview functionality**: Preview data before import

### 🔧 Technical Features
- **TypeScript**: Full type safety and modern development experience
- **RESTful API**: Clean, well-documented API endpoints
- **Error handling**: Comprehensive error handling and logging
- **Security**: Rate limiting, CORS, and security headers
- **Scalable architecture**: Modular design for easy extension

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (or other supported database)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd Costing-Automation
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start the development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Supabase Setup

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Copy your Project URL and anon key
   - Update `.env` file with your credentials

2. **Configure your database:**
   - The system will automatically connect to your Supabase database
   - No additional setup required for Supabase

## API Endpoints

### Database Management
- `POST /api/database/connect` - Connect to database
- `GET /api/database/tables/:connectionId` - Get all tables
- `GET /api/database/table-info/:connectionId/:tableName` - Get table schema
- `DELETE /api/database/disconnect/:connectionId` - Disconnect from database

### Data Table Operations
- `GET /api/datatable/data/:connectionId` - Get table data with pagination
- `POST /api/datatable/insert/:connectionId` - Insert new record
- `PUT /api/datatable/update/:connectionId` - Update existing record
- `DELETE /api/datatable/delete/:connectionId` - Delete record

### File Import
- `POST /api/import/preview/:connectionId` - Preview file before import
- `POST /api/import/csv/:connectionId` - Import CSV file
- `POST /api/import/excel/:connectionId` - Import Excel file
- `POST /api/import/bulk-insert/:connectionId` - Bulk insert data

## Usage Examples

### Connect to Supabase
```typescript
const response = await fetch('/api/database/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'supabase',
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your-anon-key'
  })
});
```

### Import CSV File
```typescript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('config', JSON.stringify({
  table: 'your_table',
  mappings: [
    { fileColumn: 'name', databaseColumn: 'full_name', required: true },
    { fileColumn: 'email', databaseColumn: 'email_address', required: true },
    { fileColumn: 'age', databaseColumn: 'age', dataType: 'integer' }
  ],
  skipFirstRow: true,
  updateExisting: false,
  batchSize: 100
}));

const response = await fetch('/api/import/csv/connectionId', {
  method: 'POST',
  body: formData
});
```

### Get Table Data with Pagination
```typescript
const response = await fetch('/api/datatable/data/connectionId?table=users&page=1&limit=10&sortBy=created_at&sortOrder=DESC');
const data = await response.json();
```

## Project Structure

```
src/
├── app.ts                 # Main application entry point
├── config/
│   └── database.ts        # Database connection management
├── routes/
│   ├── database.ts        # Database management routes
│   ├── dataTable.ts       # Data table operation routes
│   └── import.ts          # File import routes
├── services/
│   ├── dataTableService.ts # Data table business logic
│   ├── importService.ts    # File import business logic
│   └── supabaseService.ts  # Supabase-specific operations
├── types/
│   └── index.ts           # TypeScript type definitions
└── utils/
    └── logger.ts          # Logging utility
```

## Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests

### Adding New Database Types
1. Extend the `DatabaseConfig` interface in `src/types/index.ts`
2. Add connection logic in `src/config/database.ts`
3. Create a service class in `src/services/` if needed
4. Update route handlers to use the new service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
