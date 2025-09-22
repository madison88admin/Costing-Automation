/**
 * beanieImport.js
 * TNF Beanie Cost Breakdown Excel Import Parser
 * Specifically tuned for TNF format accuracy
 * FIXED VERSION - Handles initialization properly
 */

var TNFBeanieImporter = class TNFBeanieImporter {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls', '.xlsm', '.csv'];
        this.debugMode = true; // Set to false to reduce console output
        
        // Flexible column mappings
        this.columnMappings = {
            // For material sections (yarn, fabric, trim)
            material: {
                name: 0,       // Column A: Material name
                consumption: 1, // Column B: Consumption
                price: 2,      // Column C: Price per unit
                cost: 3        // Column D: Total cost
            },
            // For manufacturing sections (knitting, operations)
            manufacturing: {
                name: 0,      // Column A: Operation name
                time: 1,      // Column B: Time/SAH
                rate: 2,      // Column C: Rate per unit
                cost: 3       // Column D: Total cost
            },
            // For overhead and packaging
            other: {
                name: 0,      // Column A: Item name
                notes: 1,     // Column B: Notes/description
                cost: 3       // Column D: Cost
            }
        };
    }

    /**
     * Parse Excel data into structured format - TNF OPTIMIZED
     * @param {Object|Array} excelData - Raw Excel data from XLSX library
     * @returns {Object} Parsed cost breakdown data
     */
    parseExcelData(excelData) {
        // Handle both old array format and new object format with images
        let data = excelData;
        let images = [];
        
        if (excelData && typeof excelData === 'object' && !Array.isArray(excelData)) {
            data = excelData.data || excelData;
            images = excelData.images || [];
        }
        
        if (!data || data.length === 0) {
            throw new Error('No data found in the Excel file');
        }
        
        // Clean up data - remove empty rows and normalize cell values
        data = data.filter(row => row && row.some(cell => this.cleanCell(cell) !== ''))
                   .map(row => row.map(cell => this.cleanCell(cell)));
        
        // Try to detect column structure from headers
        this.detectColumnStructure(data);

        this.log('Processing TNF beanie Excel data with', data.length, 'rows');
        this.log('Found', images.length, 'embedded images');
        
        // Debug: Show first few rows to understand structure
        this.log('First 5 rows of data:');
        for (let i = 0; i < Math.min(5, data.length); i++) {
            this.log(`Row ${i}:`, data[i]);
        }
        
        // Initialize result structure
        const result = this.initializeResult(images);
        
        try {
            // Extract basic product information from specific locations
            this.extractProductInfo(data, result);
            
            // Extract cost breakdown data using TNF-specific logic
            this.extractCostData(data, result);
            
            // Extract totals from specific rows
            this.extractTotals(data, result);
            
        } catch (error) {
            console.error('Error parsing TNF beanie data:', error);
            throw error;
        }

        this.logFinalResult(result);
        return result;
    }

    /**
     * Initialize result object with TNF-specific structure
     */
    initializeResult(images = []) {
        return {
            // Product Information
            customer: "",
            brand: "",
            season: "", 
            styleNumber: "",
            styleName: "",
            description: "",
            costedQuantity: "",
            leadtime: "",
            
            // Cost Breakdown Categories (TNF specific)
            yarn: [],
            fabric: [],
            trim: [],
            accessories: [],
            knitting: [],
            operations: [],
            manufacturing: [],
            packaging: [],
            overhead: [],
            profit: [],
            
            // Totals
            totalMaterialCost: "0.00",
            totalFactoryCost: "0.00",
            totalCost: "0.00",
            
            // Metadata
            images: images,
            manufacturer: "TNF",
            currency: "USD"
        };
    }

    /**
     * Extract product information from TNF format (typically in top-right area)
     */
    extractProductInfo(data, result) {
        this.log('🔍 Extracting product info...');
        
        // Search all rows and columns for product info
        for (let i = 0; i < Math.min(20, data.length); i++) {
            const row = data[i];
            if (!row) continue;
            
            // Check all possible columns for labels and values
            for (let j = 0; j < row.length - 1; j++) {
                const label = this.cleanCell(row[j]);
                const value = this.cleanCell(row[j + 1]);
                
                if (!label || !value) continue;
                
                // Map various possible label formats
                const labelMap = {
                    'customer:': 'customer',
                    'customer：': 'customer',
                    'season:': 'season',
                    'season：': 'season',
                    'style#:': 'styleNumber',
                    'style#：': 'styleNumber',
                    'style#': 'styleNumber',
                    'style:': 'styleNumber',
                    'style：': 'styleNumber',
                    'style name:': 'styleName',
                    'style name：': 'styleName',
                    'costed quantity:': 'costedQuantity',
                    'costed quantity：': 'costedQuantity',
                    'leadtime:': 'leadtime',
                    'leadtime：': 'leadtime'
                };
                
                const cleanLabel = label.toLowerCase().trim();
                const field = labelMap[cleanLabel];
                
                if (field) {
                    result[field] = value;
                    this.log(`✅ Found ${field}: ${value}`);
                }
            }
        }
    }

    /**
     * Check specific columns for product information
     */
    checkInfoColumns(row, result, labelCol, valueCol, rowIndex) {
        if (!row[labelCol] || !row[valueCol]) return;
        
        const label = this.cleanCell(row[labelCol]);
        const value = this.cleanCell(row[valueCol]);
        
        if (!label || !value) return;
        
        this.log(`Row ${rowIndex}: Checking "${label}" = "${value}"`);
        
        const labelLower = label.toLowerCase();
        
        if (labelLower.includes('customer')) {
            result.customer = value;
            this.log('✅ Customer:', value);
        } else if (labelLower.includes('season')) {
            result.season = value;
            this.log('✅ Season:', value);
        } else if (labelLower.includes('style#') || labelLower.includes('style:')) {
            result.styleNumber = value;
            this.log('✅ Style#:', value);
        } else if (labelLower.includes('style name')) {
            result.styleName = value;
            this.log('✅ Style Name:', value);
        } else if (labelLower.includes('costed quantity') || labelLower.includes('quantity')) {
            result.costedQuantity = value;
            this.log('✅ Quantity:', value);
        } else if (labelLower.includes('leadtime')) {
            result.leadtime = value;
            this.log('✅ Leadtime:', value);
        }
    }

    /**
     * Extract cost data using TNF-specific section detection
     */
    extractCostData(data, result) {
        let currentSection = '';
        
        this.log('🔍 Extracting cost data...');
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row) continue;
            
            const firstCell = this.cleanCell(row[0]);
            this.log(`Row ${i}: "${firstCell}" - Row data:`, row);
            
            // Stop at reference tables FIRST - before any other processing
            if (this.isReferenceTable(firstCell, row)) {
                this.log('🔍 Found reference table - stopping cost parsing');
                break;
            }
            
            // Detect section headers
            const detectedSection = this.detectTNFSection(firstCell);
            if (detectedSection) {
                currentSection = detectedSection;
                this.log(`🔍 Entering ${detectedSection.toUpperCase()} section at row ${i}`);
                continue;
            }
            
            // Parse data within sections
            if (currentSection && firstCell && !this.isHeaderOrTotalRow(firstCell)) {
                this.parseTNFSectionRow(currentSection, row, result, firstCell, i);
            }
        }
    }

    /**
     * Detect TNF-specific sections
     */
    detectTNFSection(firstCell) {
        if (!firstCell) return null;
        
        const cellUpper = firstCell.toUpperCase().trim();
        
        // Only detect actual section headers, not items that contain section words
        const exactSections = {
            'YARN': 'yarn',
            'FABRIC': 'fabric', 
            'TRIM': 'trim',
            'KNITTING': 'knitting',
            'OPERATIONS': 'operations',
            'PACKAGING': 'packaging',
            'OVERHEAD/ PROFIT': 'overhead',
            'OVERHEAD/PROFIT': 'overhead'
        };
        
        // Check for exact matches first
        if (exactSections[cellUpper]) {
            this.log(`🔍 Detected section "${cellUpper}" from header "${firstCell}"`);
            return exactSections[cellUpper];
        }
        
        // Only allow "OVERHEAD" and "PROFIT" as sections when they are standalone
        if (cellUpper === 'OVERHEAD') {
            this.log(`🔍 Detected section "OVERHEAD" from header "${firstCell}"`);
            return 'overhead';
        }
        
        if (cellUpper === 'PROFIT') {
            this.log(`🔍 Detected section "PROFIT" from header "${firstCell}"`);
            return 'profit';
        }
        
        // Don't treat items like "Standard Packaging" as section headers
        return null;
    }

    /**
     * Check if row is a header or total row that should be skipped
     */
    isHeaderOrTotalRow(firstCell) {
        const cellLower = firstCell.toLowerCase();
        const skipPatterns = [
            'consumption', 'material price', 'material cost', 'time', 'sah', 'cost',
            'sub total', 'subtotal', 'total material', 'total factory', 'factory notes'
        ];
        
        return skipPatterns.some(pattern => cellLower.includes(pattern));
    }

    /**
     * Parse a row within a TNF section
     */
    parseTNFSectionRow(section, row, result, itemName, rowIndex) {
        // Skip completely empty rows
        if (!row.some(cell => this.cleanCell(cell) !== '')) {
            return;
        }

        // Get the appropriate column mapping based on section type
        const mapping = this.getColumnMapping(section);
        if (!mapping) {
            this.log(`❌ No column mapping found for section: ${section}`);
            return;
        }

        // TNF typically uses column 3 for costs, but check multiple columns
        let cost = null;
        let costColumn = -1;

        // Check the configured cost column first, then try others
        const costCols = [
            mapping.cost,  // Try configured column first
            3, 4, 5       // Then try standard positions
        ].filter((col, index, arr) => arr.indexOf(col) === index); // Remove duplicates

        for (let col of costCols) {
            const potentialCost = this.parseFloat(row[col]);
            if (potentialCost !== null) {
                cost = potentialCost;
                costColumn = col;
                break;
            }
        }
        
        if (cost === null) {
            this.log(`❌ No valid cost found for ${itemName} in row ${rowIndex}`);
            return;
        }
        
        // For material sections (yarn, fabric, trim), only include positive costs
        // For packaging, overhead, profit sections, include all costs (including negative)
        const materialSections = ['yarn', 'fabric', 'trim'];
        if (materialSections.includes(section) && cost <= 0) {
            this.log(`❌ Skipping ${itemName} - zero/negative cost in material section`);
            return;
        }
        
        // For packaging/overhead/profit, include zero and negative costs
        const allowZeroSections = ['packaging', 'overhead', 'profit'];
        if (allowZeroSections.includes(section) && cost === 0 && itemName.toLowerCase().includes('special')) {
            // Skip "Special Packaging" with 0 cost, but keep others
            this.log(`❌ Skipping ${itemName} - zero cost special item`);
            return;
        }
        
        // Build item based on section
        const item = this.buildTNFItem(section, row, itemName, cost);
        
        if (item && result[section]) {
            result[section].push(item);
            this.log(`✅ ${section.toUpperCase()}: "${itemName}" - Cost: ${cost.toFixed(2)} (col ${costColumn})`);
        }
    }

    /**
     * Build item object for TNF format
     */
    buildTNFItem(section, row, itemName, cost) {
        const baseItem = {
            name: itemName,
            cost: this.formatCurrency(cost)
        };
        
        switch (section) {
            case 'yarn':
            case 'fabric':
            case 'trim':
                return {
                    ...baseItem,
                    material: itemName,
                    consumption: this.cleanCell(row[1]) || '',
                    price: this.formatCurrency(row[2]) || '0.00'
                };
                
            case 'knitting':
                return {
                    ...baseItem,
                    machine: itemName,
                    time: this.cleanCell(row[1]) || '',
                    sah: this.formatCurrency(row[2]) || '0.00'
                };
                
            case 'operations':
                return {
                    ...baseItem,
                    operation: itemName,
                    time: this.cleanCell(row[1]) || '',
                    rate: this.formatCurrency(row[2]) || '0.00',
                    total: this.formatCurrency(cost)
                };
                
            case 'packaging':
                return {
                    ...baseItem,
                    type: itemName,
                    notes: this.cleanCell(row[1]) || ''
                };
                
            case 'overhead':
            case 'profit':
                return {
                    ...baseItem,
                    type: itemName,
                    notes: this.cleanCell(row[1]) || ''
                };
                
            default:
                return baseItem;
        }
    }

    /**
     * Extract totals from TNF format
     */
    extractTotals(data, result) {
        this.log('🔍 Extracting totals...');
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row) continue;
            
            const firstCell = this.cleanCell(row[0]);
            
            // Look for total rows
            if (firstCell.includes('TOTAL MATERIAL')) {
                const total = this.findCostInRow(row);
                if (total !== null) {
                    result.totalMaterialCost = this.formatCurrency(total);
                    this.log('✅ Material Total:', result.totalMaterialCost, 'from row', i);
                }
            }
            
            if (firstCell.includes('TOTAL FACTORY')) {
                const total = this.findCostInRow(row);
                if (total !== null) {
                    result.totalFactoryCost = this.formatCurrency(total);
                    this.log('✅ Factory Total:', result.totalFactoryCost, 'from row', i);
                }
            }
            
            // Also check for SUB TOTAL rows
            if (firstCell.includes('SUB TOTAL')) {
                const total = this.findCostInRow(row);
                if (total !== null) {
                    this.log('📊 Sub Total found:', this.formatCurrency(total), 'at row', i);
                }
            }
        }
        
        // Calculate totals if not found
        if (result.totalMaterialCost === "0.00") {
            this.calculateMaterialTotal(result);
        }
        
        if (result.totalFactoryCost === "0.00") {
            this.calculateFactoryTotal(result);
        }
        
        // Set total cost
        result.totalCost = result.totalFactoryCost;
    }

    /**
     * Find cost value in a row by checking multiple columns
     */
    findCostInRow(row) {
        // Check columns 3, 4, 5, 2 for cost values
        for (let col of [3, 4, 5, 2]) {
            const cost = this.parseFloat(row[col]);
            if (cost !== null) {
                return cost;
            }
        }
        return null;
    }

    /**
     * Calculate material total from individual items
     */
    calculateMaterialTotal(result) {
        let total = 0;
        const materialSections = ['yarn', 'fabric', 'trim'];
        
        materialSections.forEach(section => {
            if (result[section]) {
                result[section].forEach(item => {
                    total += parseFloat(item.cost) || 0;
                });
            }
        });
        
        result.totalMaterialCost = this.formatCurrency(total);
        this.log('📊 Calculated Material Total:', result.totalMaterialCost);
    }

    /**
     * Calculate factory total from all sections
     */
    calculateFactoryTotal(result) {
        let total = parseFloat(result.totalMaterialCost) || 0;
        const factorySections = ['knitting', 'operations', 'packaging', 'overhead', 'profit'];
        
        factorySections.forEach(section => {
            if (result[section]) {
                result[section].forEach(item => {
                    total += parseFloat(item.cost) || 0;
                });
            }
        });
        
        result.totalFactoryCost = this.formatCurrency(total);
        this.log('📊 Calculated Factory Total:', result.totalFactoryCost);
    }

    /**
     * Check if we've reached a reference table
     */
    isReferenceTable(firstCell, row) {
        // Check if this is the start of the reference table (row 43 in your data)
        // This is where "Knitting" appears with "Knit Cost (Per Min)" in column 2
        if (firstCell === 'Knitting' && 
            row[1] && this.cleanCell(row[1]).includes('Knit Cost') && 
            row[2] && this.cleanCell(row[2]).includes('Operations')) {
            this.log('🔍 Found reference table at Knitting row - stopping parsing');
            return true;
        }
        
        // Also check for other reference patterns
        const referencePatterns = [
            'Knitting Cost (Reference)',
            'Operations Cost (Reference)', 
            'Per Min',
            'Reference'
        ];
        
        return referencePatterns.some(pattern => 
            firstCell.includes(pattern) || 
            (row[1] && this.cleanCell(row[1]).includes(pattern)) ||
            (row[2] && this.cleanCell(row[2]).includes(pattern))
        );
    }

    // UTILITY METHODS

    /**
     * Clean and normalize cell content
     */
    cleanCell(cell) {
        if (cell === null || cell === undefined) return '';
        return String(cell).trim();
    }

    /**
     * Parse float value safely
     */
    parseFloat(value) {
        if (value === null || value === undefined) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }

    /**
     * Format currency value
     */
    formatCurrency(value) {
        const num = this.parseFloat(value);
        return num !== null ? num.toFixed(2) : '0.00';
    }

    /**
     * Logging utility
     */
    log(...args) {
        if (this.debugMode) {
            console.log(...args);
        }
    }

    /**
     * Log final result summary
     */
    logFinalResult(result) {
        this.log('=== FINAL TNF RESULT SUMMARY ===');
        this.log('Customer:', result.customer);
        this.log('Season:', result.season);
        this.log('Style#:', result.styleNumber);
        this.log('Style Name:', result.styleName);
        this.log('Quantity:', result.costedQuantity);
        this.log('Leadtime:', result.leadtime);
        
        const sections = ['yarn', 'fabric', 'trim', 'knitting', 'operations', 'packaging', 'overhead', 'profit'];
        
        sections.forEach(section => {
            if (result[section] && result[section].length > 0) {
                this.log(`${section.toUpperCase()} items:`, result[section].length);
                result[section].forEach(item => {
                    this.log(`  - ${item.name}: $${item.cost}`);
                });
            }
        });
        
        this.log('Material Total:', result.totalMaterialCost);
        this.log('Factory Total:', result.totalFactoryCost);
        this.log('Grand Total:', result.totalCost);
        this.log('=== END TNF RESULT ===');
    }

    /**
     * Validate if file is supported format
     */
    isSupportedFile(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        return this.supportedFormats.some(format => fileName.toLowerCase().endsWith(format));
    }

    /**
     * Get the appropriate column mapping for a section
     */
    getColumnMapping(section) {
        if (['yarn', 'fabric', 'trim'].includes(section)) {
            return this.columnMappings.material;
        }
        if (['knitting', 'operations'].includes(section)) {
            return this.columnMappings.manufacturing;
        }
        return this.columnMappings.other;
    }

    /**
     * Validate an item based on section-specific rules
     */
    validateItemForSection(item, section) {
        if (['yarn', 'fabric', 'trim'].includes(section)) {
            // Material sections require at least a name and either consumption or cost
            return item.name && (
                (item.consumption && item.consumption !== '0' && item.consumption !== '0.00') ||
                (item.cost && parseFloat(item.cost) > 0)
            );
        }
        
        if (['knitting', 'operations'].includes(section)) {
            // Manufacturing sections require name and cost
            return item.name && item.cost && parseFloat(item.cost) >= 0;
        }
        
        // Other sections (packaging, overhead) just need name and cost
        return item.name && item.cost !== undefined;
    }

    /**
     * Detect potential row structures by analyzing headers
     */
    detectColumnStructure(data) {
        // Look through first 10 rows for column headers
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i] || [];
            const headers = row.map(cell => String(cell || '').toLowerCase().trim());
            
            // Look for common column patterns
            if (headers.includes('material') && headers.includes('consumption')) {
                const materialCol = headers.indexOf('material');
                const consumptionCol = headers.indexOf('consumption');
                const priceCol = headers.findIndex(h => h.includes('price') || h.includes('rate'));
                const costCol = headers.findIndex(h => h.includes('cost') && !h.includes('price'));
                
                if (materialCol !== -1 && consumptionCol !== -1) {
                    this.log('📊 Detected material column structure:', {
                        name: materialCol,
                        consumption: consumptionCol,
                        price: priceCol !== -1 ? priceCol : 2,
                        cost: costCol !== -1 ? costCol : 3
                    });
                    
                    // Update material column mapping
                    this.columnMappings.material = {
                        name: materialCol,
                        consumption: consumptionCol,
                        price: priceCol !== -1 ? priceCol : 2,
                        cost: costCol !== -1 ? costCol : 3
                    };
                }
            }
            
            if (headers.includes('operation') || headers.includes('process')) {
                const nameCol = headers.findIndex(h => h.includes('operation') || h.includes('process'));
                const timeCol = headers.findIndex(h => h.includes('time') || h.includes('sah'));
                const rateCol = headers.findIndex(h => h.includes('rate') || h.includes('cost/min'));
                const costCol = headers.findIndex(h => h.includes('total') || (h.includes('cost') && !h.includes('rate')));
                
                if (nameCol !== -1) {
                    this.log('📊 Detected operation column structure:', {
                        name: nameCol,
                        time: timeCol !== -1 ? timeCol : 1,
                        rate: rateCol !== -1 ? rateCol : 2,
                        cost: costCol !== -1 ? costCol : 3
                    });
                    
                    // Update manufacturing column mapping
                    this.columnMappings.manufacturing = {
                        name: nameCol,
                        time: timeCol !== -1 ? timeCol : 1,
                        rate: rateCol !== -1 ? rateCol : 2,
                        cost: costCol !== -1 ? costCol : 3
                    };
                }
            }
        }
    }

    /**
     * Get file type for processing
     */
    getFileType(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        return extension === 'csv' ? 'csv' : 'excel';
    }

    /**
     * Set debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

// FIXED INITIALIZATION SYSTEM
// This ensures everything loads properly before use

// Initialize utilities when dependencies are ready
function initializeTNFUtilities() {
    return new Promise((resolve, reject) => {
        // Check if required dependencies are available
        const checkDependencies = () => {
            if (typeof window !== 'undefined') {
                // Browser environment - check for XLSX if needed
                if (typeof XLSX !== 'undefined' || !window.requiresXLSX) {
                    window.TNFBeanieImporter = TNFBeanieImporter;
                    console.log('✅ TNF Beanie Importer ready');
                    resolve(TNFBeanieImporter);
                } else {
                    console.log('⏳ Waiting for XLSX library...');
                    setTimeout(checkDependencies, 100);
                }
            } else {
                // Node.js environment
                resolve(TNFBeanieImporter);
            }
        };
        
        checkDependencies();
        
        // Timeout after 10 seconds
        setTimeout(() => {
            reject(new Error('TNF utilities initialization timeout'));
        }, 10000);
    });
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    // Browser environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeTNFUtilities().catch(console.error);
        });
    } else {
        // Document already loaded
        setTimeout(() => initializeTNFUtilities().catch(console.error), 100);
    }
} else {
    // Node.js environment - export immediately
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TNFBeanieImporter;
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.TNFBeanieImporter = TNFBeanieImporter;
    window.initializeTNFUtilities = initializeTNFUtilities;
    
    // Debug function for testing
    window.debugTNFImport = function(excelData) {
        console.log('=== DEBUGGING TNF IMPORT ===');
        console.log('Raw Excel Data:', excelData);
        
        const importer = new TNFBeanieImporter();
        const result = importer.parseExcelData(excelData);
        
        console.log('Parsed Result:', result);
        return result;
    };
}