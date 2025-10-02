/**
 * beanieImport.js
 * TNF Beanie Cost Breakdown Excel Import Parser
 * Handles parsing of TNF Excel files for beanie products
 * Based on the actual Excel structure from the Factory Cost Breakdown image
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
     * Parse TNF Excel data into structured format for beanie
     * @param {Object|Array} excelData - Raw Excel data from XLSX library (can be array or object with data/images)
     * @returns {Object} Parsed cost breakdown data
     */
    parseExcelData(excelData) {
        console.log('🔍 BEANIE IMPORTER: Starting to parse Excel data...');
        
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

        console.log('Processing TNF Beanie Excel data with', data.length, 'rows');
        console.log('Found', images.length, 'embedded images');

        const result = {
            customer: "TNF",
            season: "F25", 
            styleNumber: "",
            styleName: "",
            description: "",
            costedQuantity: "",
            leadtime: "",
            notes: "",
            
            // Beanie specific sections - match the actual Excel structure
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
            
            // Add images array
            images: images
        };

        // BEANIE-SPECIFIC PARSING - Based on actual Excel structure from image
        try {
            console.log('🔍 Starting beanie-specific field extraction...');
            
            // INTELLIGENT FIELD EXTRACTION - Extract actual values from Excel data
            console.log('🔍 Extracting actual values from Excel data...');
            
            // Convert all data to a searchable string for comprehensive searching
            let allDataString = '';
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row) {
                    allDataString += row.join('|') + '\n';
                }
            }
            
            console.log('🔍 All data string length:', allDataString.length);
            console.log('🔍 First 500 chars of data:', allDataString.substring(0, 500));
            console.log('🔍 Full data array for debugging:', data);
            console.log('🔍 Looking for Customer, Season, Style# patterns in data...');
            
            // Debug: Show all rows that contain "Customer", "Season", "Style#" etc.
            data.forEach((row, rowIndex) => {
                if (row && row.length > 0) {
                    const rowString = row.join(' | ');
                    if (rowString.toLowerCase().includes('customer') || 
                        rowString.toLowerCase().includes('season') || 
                        rowString.toLowerCase().includes('style') ||
                        rowString.toLowerCase().includes('notes')) {
                        console.log(`🔍 Row ${rowIndex}:`, rowString);
                    }
                }
            });
            
            // Extract actual values from the Excel data structure
            // Look for the actual values in the data, not force specific ones
            console.log('🔍 Starting extraction with enhanced pattern matching...');
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row) continue;
                
                // Debug: Show the first few rows to understand structure
                if (i < 10) {
                    console.log(`🔍 Row ${i}:`, row);
                }
                
                // Look for basic info patterns in the data - try multiple patterns
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j] || '').trim();
                    
                    // Customer extraction - try multiple patterns
                    if ((cell.includes('Customer:') || cell.includes('Customer') || cell === 'Customer') && j + 1 < row.length && row[j + 1]) {
                        result.customer = String(row[j + 1]).trim();
                        console.log('✅ Customer found:', result.customer, 'from row', i, 'column', j+1);
                    }
                    
                    // Season extraction - try multiple patterns
                    if ((cell.includes('Season:') || cell.includes('Season') || cell === 'Season') && j + 1 < row.length && row[j + 1]) {
                        result.season = String(row[j + 1]).trim();
                        console.log('✅ Season found:', result.season, 'from row', i, 'column', j+1);
                    }
                    
                    // Style# extraction - be more specific to avoid confusion with Style Name
                    if ((cell.includes('Style#:') || cell.includes('Style#') || cell === 'Style#') && j + 1 < row.length && row[j + 1]) {
                        result.styleNumber = String(row[j + 1]).trim();
                        console.log('✅ Style# found:', result.styleNumber, 'from row', i, 'column', j+1);
                    }
                    
                    // Style Name extraction - try multiple patterns
                    if ((cell.includes('Style Name:') || cell.includes('Style Name') || cell === 'Style Name') && j + 1 < row.length && row[j + 1]) {
                        result.styleName = String(row[j + 1]).trim();
                        console.log('✅ Style Name found:', result.styleName, 'from row', i, 'column', j+1);
                    }
                    
                    // Costed Quantity extraction - try multiple patterns
                    if ((cell.includes('Costed Quantity:') || cell.includes('Costed Quantity') || cell === 'Costed Quantity') && j + 1 < row.length && row[j + 1]) {
                        result.costedQuantity = String(row[j + 1]).trim();
                        console.log('✅ Costed Quantity found:', result.costedQuantity, 'from row', i, 'column', j+1);
                    }
                    
                    // Leadtime extraction - try multiple patterns
                    if ((cell.includes('Leadtime:') || cell.includes('Leadtime') || cell === 'Leadtime') && j + 1 < row.length && row[j + 1]) {
                        result.leadtime = String(row[j + 1]).trim();
                        console.log('✅ Leadtime found:', result.leadtime, 'from row', i, 'column', j+1);
                    }
                }
            }
            
            // Fallback to original extraction if not found
            if (!result.season || !result.styleNumber || !result.styleName || !result.costedQuantity) {
                console.log('🔍 Fallback to original extraction method...');
                
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row) continue;
                    
                    // Look for Customer info - can be in various positions
                    for (let j = 0; j < row.length; j++) {
                        const cell = String(row[j] || '').trim();
                        if (cell.includes('Customer') && j + 1 < row.length && row[j + 1]) {
                            result.customer = String(row[j + 1]).trim();
                            console.log('✅ Customer:', result.customer);
                        }
                        if (cell.includes('Season') && j + 1 < row.length && row[j + 1]) {
                            result.season = String(row[j + 1]).trim();
                            console.log('✅ Season:', result.season);
                        }
                        if ((cell.includes('Style#') || cell.includes('Style:')) && j + 1 < row.length && row[j + 1]) {
                            result.styleNumber = String(row[j + 1]).trim();
                            console.log('✅ Style#:', result.styleNumber);
                        }
                        if (cell.includes('Style Name') && j + 1 < row.length && row[j + 1]) {
                            result.styleName = String(row[j + 1]).trim();
                            console.log('✅ Style Name:', result.styleName);
                        }
                        if ((cell.includes('Costed Quantity') || cell.includes('MOQ')) && j + 1 < row.length && row[j + 1]) {
                            result.costedQuantity = String(row[j + 1]).trim();
                            console.log('✅ Costed Quantity:', result.costedQuantity);
                        }
                        if (cell.includes('Leadtime') && j + 1 < row.length && row[j + 1]) {
                            result.leadtime = String(row[j + 1]).trim();
                            console.log('✅ Leadtime:', result.leadtime);
                        }
                    }
                }
            }
            
            console.log('🔍 Field extraction completed. Results:');
            console.log('🔍 Customer:', result.customer);
            console.log('🔍 Season:', result.season);
            console.log('🔍 Style Number:', result.styleNumber);
            console.log('🔍 Style Name:', result.styleName);
            console.log('🔍 Costed Quantity:', result.costedQuantity);
            console.log('🔍 Leadtime:', result.leadtime);

            // FLEXIBLE COST DATA PARSING - Search through all rows (matching ballcaps approach)
            let currentSection = '';
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Detect sections with flexible matching (like ballcaps)
                if (firstCell === 'YARN' || firstCell === 'MATERIAL' || firstCell.includes('YARN')) {
                    currentSection = 'yarn';
                    console.log('🔍 Found YARN section');
                } else if (firstCell === 'FABRIC' || firstCell === 'FABRIC/S' || firstCell.includes('FABRIC')) {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section');
                } else if (firstCell === 'TRIM' || firstCell === 'TRIM/S' || firstCell.includes('TRIM')) {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section');
                } else if (firstCell === 'KNITTING' || firstCell.includes('KNITTING')) {
                    currentSection = 'knitting';
                    console.log('🔍 Found KNITTING section');
                } else if (firstCell === 'OPERATIONS' || firstCell.includes('OPERATIONS')) {
                    currentSection = 'operations';
                    console.log('🔍 Found OPERATIONS section');
                } else if (firstCell === 'PACKAGING' || firstCell.includes('PACKAGING')) {
                    currentSection = 'packaging';
                    console.log('🔍 Found PACKAGING section');
                } else if (firstCell === 'OVERHEAD/ PROFIT' || firstCell === 'OVERHEAD/PROFIT' || firstCell === 'OVERHEAD' || firstCell.includes('OVERHEAD')) {
                    currentSection = 'overhead';
                    console.log('🔍 Found OVERHEAD section at row', i, ':', firstCell);
                    console.log('🔍 OVERHEAD section row data:', row);
                } else if (firstCell === 'TOTAL FACTORY COST' || firstCell.includes('TOTAL FACTORY')) {
                    console.log('🔍 Found TOTAL FACTORY COST');
                }
                
                // Debug: Log current section and row data for operations/overhead
                if (currentSection === 'operations' || currentSection === 'overhead') {
                    console.log(`🔍 Current section: ${currentSection}, Row ${i}:`, firstCell, '|', row[1], '|', row[2], '|', row[3]);
                }
                
                // Detect header rows and set current section based on context (like ballcaps)
                if (firstCell.includes('(Name/Code/Description)') && row[1] && row[1].includes('CONSUMPTION')) {
                    // This is a header row, determine section based on context
                    if (row[1].includes('G') && row[2] && row[2].includes('USD/KG')) {
                        currentSection = 'yarn';
                        console.log('🔍 Found YARN header row');
                    } else if (row[1].includes('YARD') && row[2] && row[2].includes('USD/YD')) {
                        currentSection = 'fabric';
                        console.log('🔍 Found FABRIC header row');
                    } else if (row[1].includes('PIECE') && row[2] && row[2].includes('USD/PC')) {
                        currentSection = 'trim';
                        console.log('🔍 Found TRIM header row');
                    }
                }
                
                // Detect KNITTING header
                if (firstCell.includes('KNITTING') && row[1] && row[1].includes('KNITTING TIME')) {
                    currentSection = 'knitting';
                    console.log('🔍 Found KNITTING header row');
                }
                
                // Detect OPERATIONS header
                if (firstCell.includes('OPERATIONS') && row[1] && row[1].includes('OPERATION TIME')) {
                    currentSection = 'operations';
                    console.log('🔍 Found OPERATIONS header row');
                }
                
                // Parse data based on current section (matching ballcaps logic)
                if (currentSection === 'yarn' && firstCell && 
                    !firstCell.includes('YARN') && 
                    !firstCell.includes('(Name/Code/Description)') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    // Calculate cost if not provided or if consumption and price are available
                    let cost = '';
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: (consumption in grams / 1000) * price per kg
                        const consumptionKg = parseFloat(row[1]) / 1000;
                        const pricePerKg = parseFloat(row[2]);
                        cost = (consumptionKg * pricePerKg).toFixed(2);
                    }
                    
                    if (cost) {
                        result.yarn.push({
                            material: firstCell,
                            consumption: String(row[1] || ''),
                            price: parseFloat(row[2] || 0).toFixed(2),
                            cost: cost
                        });
                        console.log('✅ YARN:', firstCell, 'Cost:', cost);
                    }
                }
                
                if (currentSection === 'fabric' && firstCell && 
                    !firstCell.includes('FABRIC') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    // Calculate cost if not provided or if consumption and price are available
                    let cost = '';
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: consumption * price
                        const consumption = parseFloat(row[1]);
                        const price = parseFloat(row[2]);
                        cost = (consumption * price).toFixed(2);
                    }
                    
                    if (cost) {
                        result.fabric.push({
                            material: firstCell,
                            consumption: String(row[1] || ''),
                            price: parseFloat(row[2] || 0).toFixed(2),
                            cost: cost
                        });
                        console.log('✅ FABRIC:', firstCell, 'Cost:', cost);
                    }
                }
                
                if (currentSection === 'trim' && firstCell && 
                    !firstCell.includes('TRIM') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    // Calculate cost if not provided or if consumption and price are available
                    let cost = '';
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: consumption * price
                        const consumption = parseFloat(row[1]);
                        const price = parseFloat(row[2]);
                        cost = (consumption * price).toFixed(2);
                    }
                    
                    if (cost) {
                        result.trim.push({
                            material: firstCell,
                            consumption: String(row[1] || ''),
                            price: parseFloat(row[2] || 0).toFixed(2),
                            cost: cost
                        });
                        console.log('✅ TRIM:', firstCell, 'Cost:', cost);
                    }
                }
                
                if (currentSection === 'knitting' && firstCell && 
                    !firstCell.includes('KNITTING') && 
                    !firstCell.includes('KNITTING TIME') && 
                    !firstCell.includes('KNITTING SAH') && 
                    !firstCell.includes('KNITTING COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    // Calculate cost if not provided or if time and rate are available
                    let cost = '';
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: time * rate
                        const time = parseFloat(row[1]);
                        const rate = parseFloat(row[2]);
                        cost = (time * rate).toFixed(2);
                    }
                    
                    if (cost) {
                        result.knitting.push({
                            machine: firstCell,
                            time: String(row[1] || ''),
                            sah: parseFloat(row[2] || 0).toFixed(2),
                            cost: cost
                        });
                        console.log('✅ KNITTING:', firstCell, 'Cost:', cost);
                    }
                }
                
                if (currentSection === 'operations' && firstCell && 
                    !firstCell.includes('OPERATIONS') && 
                    !firstCell.includes('TIME') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('SUB TOTAL') && 
                    !firstCell.includes('TOTAL') &&
                    firstCell.trim() !== '') {
                    console.log(`🔍 Checking OPERATIONS: "${firstCell}" - Row:`, row);
                    
                    // More flexible operations parsing - look for any row with operation name and some cost data
                    let time = '';
                    let cost = '';
                    let total = '';
                    
                    // Try to find time in col 1
                    if (row[1] && !isNaN(parseFloat(row[1]))) {
                        time = parseFloat(row[1]).toFixed(2);
                    }
                    
                    // Try to find cost in col 2 or col 3
                    if (row[2] && !isNaN(parseFloat(row[2]))) {
                        cost = parseFloat(row[2]).toFixed(2);
                    } else if (row[3] && !isNaN(parseFloat(row[3]))) {
                        cost = parseFloat(row[3]).toFixed(2);
                    }
                    
                    // Try to find total in col 3 or col 4
                    if (row[3] && !isNaN(parseFloat(row[3])) && !cost) {
                        total = parseFloat(row[3]).toFixed(2);
                    } else if (row[4] && !isNaN(parseFloat(row[4]))) {
                        total = parseFloat(row[4]).toFixed(2);
                    }
                    
                    // If we have any meaningful data, add the operation
                    if (time || cost || total) {
                        let operationName = firstCell || `Operation ${result.operations.length + 1}`;
                        result.operations.push({
                            operation: String(operationName), // Ensure operation is always a string
                            time: time,
                            cost: cost,
                            total: total || (time && cost ? (parseFloat(time) * parseFloat(cost)).toFixed(2) : '')
                        });
                        console.log('✅ OPERATION:', operationName, 'Time:', time, 'Cost:', cost, 'Total:', total);
                    }
                }
                
                if (currentSection === 'packaging' && firstCell && 
                    !firstCell.includes('PACKAGING') && 
                    !firstCell.includes('Factory Notes') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    // Look for cost in different columns
                    let cost = '';
                    let notes = String(row[1] || '');
                    
                    // Try to find cost in col 2 or col 3
                    if (row[2] && !isNaN(parseFloat(row[2]))) {
                        cost = parseFloat(row[2]).toFixed(2);
                    } else if (row[3] && !isNaN(parseFloat(row[3]))) {
                        cost = parseFloat(row[3]).toFixed(2);
                    }
                    
                    // If we found a cost (including 0.00), add the packaging item
                    if (cost !== '') {
                        result.packaging.push({
                            type: firstCell,
                            notes: notes,
                            cost: cost
                        });
                        console.log('✅ PACKAGING:', firstCell, 'Notes:', notes, 'Cost:', cost);
                    }
                }
                
                if (currentSection === 'overhead' && firstCell && 
                    !firstCell.includes('OVERHEAD') && 
                    !firstCell.includes('Factory Notes') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    console.log('🔍 Processing OVERHEAD item:', firstCell, 'Row:', row);
                    
                    // Look for cost in different columns
                    let cost = '';
                    
                    // Try to find cost in the last column (most likely position for cost)
                    // Check from right to left to find the first valid cost value
                    console.log(`🔍 Searching for cost in row for ${firstCell}:`, row);
                    for (let colIndex = row.length - 1; colIndex >= 2; colIndex--) {
                        console.log(`🔍 Checking column ${colIndex}:`, row[colIndex], 'isNaN:', isNaN(parseFloat(row[colIndex])));
                        if (row[colIndex] !== undefined && row[colIndex] !== null && !isNaN(parseFloat(row[colIndex]))) {
                            cost = parseFloat(row[colIndex]).toFixed(2);
                            console.log(`🔍 Found cost ${cost} in column ${colIndex} for ${firstCell}`);
                            break;
                        }
                    }
                    
                    // Special handling for OVERHEAD/PROFIT section
                    // Only include actual overhead and profit items, not knitting machines or operations
                    let itemType = firstCell;
                    let shouldInclude = false;
                    
                    // Only include items that are actually overhead or profit
                    if (firstCell.toLowerCase() === 'overhead' || firstCell.toLowerCase() === 'profit') {
                        shouldInclude = true;
                        if (firstCell.toLowerCase() === 'profit') {
                            itemType = 'PROFIT'; // Use all caps to match Excel format
                        } else {
                            itemType = 'OVERHEAD';
                        }
                        console.log('🔍 Confirmed overhead/profit item:', itemType, 'Cost:', cost, 'Should include:', shouldInclude);
                    } else {
                        // Check if this looks like a knitting machine or operation (should be excluded)
                        const knittingMachines = ['scripto', 'flat-', 'circular', 'automatic', 'jacquard', 'hand knit'];
                        const operations = ['finger linking', 'cutting', 'sewing', 'blind sewing', 'hand sewing', 'labeling', 'embroidery', 'printing', 'washing', 'overlock', 'linking', 'neaten', 'steaming', 'packing', 'closing', 'lining', 'poms', 'tassel', 'braid'];
                        
                        const isKnittingMachine = knittingMachines.some(machine => firstCell.toLowerCase().includes(machine));
                        const isOperation = operations.some(op => firstCell.toLowerCase().includes(op));
                        
                        if (isKnittingMachine || isOperation) {
                            console.log('🔍 Excluding knitting machine/operation from overhead:', firstCell);
                            shouldInclude = false;
                        } else {
                            // If it's not clearly a knitting machine or operation, include it
                            shouldInclude = true;
                            console.log('🔍 Including item in overhead:', firstCell);
                        }
                    }
                    
                    // If we found a cost and should include this item, add the overhead item
                    console.log('🔍 Final check - Cost:', cost, 'Should include:', shouldInclude, 'Item:', firstCell);
                    if (cost && shouldInclude) {
                        result.overhead.push({
                            type: itemType,
                            cost: cost
                        });
                        console.log('✅ OVERHEAD/PROFIT:', itemType, 'Cost:', cost);
                    } else if (cost && !shouldInclude) {
                        console.log('❌ Excluded from overhead:', firstCell, 'Cost:', cost);
                    } else if (!cost) {
                        console.log('❌ No cost found for:', firstCell);
                    }
                    
                    // Special debug for OVERHEAD item
                    if (firstCell.toLowerCase() === 'overhead') {
                        console.log('🔍 OVERHEAD DEBUG - Cost:', cost, 'Type:', typeof cost, 'Should include:', shouldInclude, 'Item type:', itemType);
                    }
                }
                
                // Extract totals - enhanced pattern matching (matching ballcaps approach)
                if ((firstCell.includes('TOTAL MATERIAL') || firstCell.includes('TOTAL MATERIAL AND SUBMATERIALS COST')) && row[3]) {
                    result.totalMaterialCost = parseFloat(row[3]).toFixed(2);
                    console.log('✅ Material Total:', result.totalMaterialCost);
                }
                if (firstCell.includes('TOTAL FACTORY') && row[3]) {
                    result.totalFactoryCost = parseFloat(row[3]).toFixed(2);
                    console.log('✅ Factory Total:', result.totalFactoryCost);
                }
            }

            // Extract Notes section - look for rows that contain notes information
            console.log('🔍 Extracting Notes section with enhanced detection...');
            let notesContent = [];
            let inNotesSection = false;
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                const allRowContent = row.filter(cell => cell && String(cell).trim() !== '').join(' ');
                
                // Look for Notes section header - be more specific to avoid false positives
                if ((firstCell.toLowerCase() === 'notes' || firstCell.toLowerCase() === 'note') ||
                    (allRowContent.toLowerCase() === 'notes' || allRowContent.toLowerCase() === 'note')) {
                    inNotesSection = true;
                    console.log('✅ Found Notes section header at row', i, ':', firstCell);
                    continue;
                }
                
                // If we're in notes section, collect content
                if (inNotesSection) {
                    // Stop if we hit another major section or knitting machine data
                    if (firstCell.includes('FABRIC') || firstCell.includes('YARN') || firstCell.includes('TRIM') || 
                        firstCell.includes('OPERATIONS') || firstCell.includes('PACKAGING') || firstCell.includes('OVERHEAD') ||
                        firstCell.includes('TOTAL') || firstCell.includes('SUBTOTAL') || firstCell.includes('KNITTING') ||
                        allRowContent.includes('Flat-') || allRowContent.includes('Circular') || allRowContent.includes('Scripto') ||
                        allRowContent.includes('Automatic') || allRowContent.includes('Jacquard')) {
                        console.log('🛑 Stopping notes extraction at row', i, 'due to section/machine data:', firstCell || allRowContent);
                        break;
                    }
                    
                    // Collect non-empty content, but skip machine/technical data
                    if (allRowContent.trim() && !allRowContent.match(/^[A-Za-z-]+ \d+ \d+\.?\d* \d+\.?\d*$/)) {
                        notesContent.push(allRowContent.trim());
                        console.log('📝 Added to notes:', allRowContent.trim());
                    } else if (allRowContent.trim()) {
                        console.log('⚠️ Skipped machine/technical data:', allRowContent.trim());
                    }
                }
            }
            
            // Alternative notes detection - look for multi-line notes content in single cells
            if (notesContent.length === 0) {
                console.log('🔍 Trying alternative notes detection - looking for multi-line notes content...');
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;
                    
                    // Check each cell in the row for multi-line notes content
                    for (let j = 0; j < row.length; j++) {
                        const cellContent = String(row[j] || '').trim();
                        
                        // Look for cells that contain multiple notes lines (contains both (UJ-F19-011) and pricing info)
                        if (cellContent.includes('(UJ-F19-011)') && 
                            (cellContent.includes('MCQ') || cellContent.includes('$') || cellContent.includes('pcs'))) {
                            
                            console.log('📝 Found multi-line notes content in cell:', j, 'of row:', i);
                            console.log('📝 Raw content:', cellContent);
                            
                            // Split the content by newlines and filter out empty lines
                            const lines = cellContent.split('\n').filter(line => line.trim() !== '');
                            
                            // Extract only the actual notes content (skip headers and technical data)
                            lines.forEach(line => {
                                const cleanLine = line.trim();
                                // Look for actual notes patterns
                                if (cleanLine.includes('(UJ-F19-011)') || 
                                    cleanLine.includes('MCQ') || 
                                    cleanLine.includes('surcharge') ||
                                    cleanLine.includes('HYDD') ||
                                    cleanLine.includes('RWS TC') ||
                                    cleanLine.includes('pcs $') ||
                                    cleanLine.includes('% = ') ||
                                    (cleanLine.includes('kg') && cleanLine.includes('pcs'))) {
                                    
                                    notesContent.push(cleanLine);
                                    console.log('📝 Added notes line:', cleanLine);
                                }
                            });
                            
                            break; // Found notes, stop looking in this row
                        }
                    }
                }
            }
            
            // Join all notes content
            if (notesContent.length > 0) {
                result.notes = notesContent.join('\n');
                console.log('✅ Notes extracted (', notesContent.length, 'lines):', result.notes.substring(0, 200) + '...');
            } else {
                console.log('⚠️ No notes section found - checking if data structure is different');
                // Debug: Show all rows that might contain notes
                for (let i = 0; i < Math.min(20, data.length); i++) {
                    const row = data[i];
                    if (row && row.length > 0) {
                        const rowContent = row.join(' | ');
                        if (rowContent.includes('$') || rowContent.includes('MCQ') || rowContent.includes('pcs')) {
                            console.log(`🔍 Potential notes row ${i}:`, rowContent);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error in parsing:', error);
            // Re-throw the error so it can be caught by the calling code
            throw error;
        }

        console.log('=== FINAL RESULT ===');
        console.log('Customer:', result.customer);
        console.log('Season:', result.season);
        console.log('Style#:', result.styleNumber);
        console.log('Style Name:', result.styleName);
        console.log('Costed Quantity:', result.costedQuantity);
        console.log('Leadtime:', result.leadtime);
        console.log('Notes:', result.notes ? result.notes.substring(0, 100) + '...' : 'None');
        console.log('YARN items:', result.yarn.length, result.yarn);
        console.log('FABRIC items:', result.fabric.length, result.fabric);
        console.log('TRIM items:', result.trim.length, result.trim);
        console.log('KNITTING items:', result.knitting.length, result.knitting);
        console.log('OPERATIONS items:', result.operations.length, result.operations);
        console.log('PACKAGING items:', result.packaging.length, result.packaging);
        console.log('OVERHEAD items:', result.overhead.length, result.overhead);
        console.log('Material Total:', result.totalMaterialCost);
        console.log('Factory Total:', result.totalFactoryCost);
        console.log('=== END RESULT ===');

        console.log('Parsed TNF Beanie data:', result);
        return result;
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TNFBeanieImporter;
}