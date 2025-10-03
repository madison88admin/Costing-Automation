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
                    console.log('🔍 Found YARN section at row', i, ':', firstCell);
                } else if (firstCell === 'FABRIC' || firstCell === 'FABRIC/S' || firstCell.includes('FABRIC')) {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section at row', i, ':', firstCell);
                } else if (firstCell === 'TRIM' || firstCell === 'TRIM/S' || firstCell.includes('TRIM')) {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section at row', i, ':', firstCell);
                } else if (firstCell === 'KNITTING' || firstCell.includes('KNITTING')) {
                    currentSection = 'knitting';
                    console.log('🔍 Found KNITTING section at row', i, ':', firstCell);
                } else if (firstCell === 'OPERATIONS' || firstCell.includes('OPERATIONS')) {
                    currentSection = 'operations';
                    console.log('🔍 Found OPERATIONS section at row', i, ':', firstCell);
                } else if (firstCell === 'PACKAGING' || firstCell.includes('PACKAGING')) {
                    currentSection = 'packaging';
                    console.log('🔍 Found PACKAGING section at row', i, ':', firstCell);
                } else if (firstCell === 'OVERHEAD/ PROFIT' || firstCell === 'OVERHEAD/PROFIT' || firstCell === 'OVERHEAD' || firstCell.includes('OVERHEAD')) {
                    currentSection = 'overhead';
                    console.log('🔍 Found OVERHEAD section at row', i, ':', firstCell);
                } else if (firstCell === 'TOTAL FACTORY COST' || firstCell.includes('TOTAL FACTORY')) {
                    console.log('🔍 Found TOTAL FACTORY COST at row', i, ':', firstCell);
                }
                
                // Additional YARN section detection - look for rows that might be YARN data
                if (!currentSection && firstCell && firstCell.trim() !== '' && 
                    !firstCell.includes('FABRIC') && !firstCell.includes('TRIM') && 
                    !firstCell.includes('OPERATIONS') && !firstCell.includes('PACKAGING') && 
                    !firstCell.includes('OVERHEAD') && !firstCell.includes('TOTAL') &&
                    !firstCell.includes('(Name/Code/Description)') && !firstCell.includes('CONSUMPTION') &&
                    !firstCell.includes('MATERIAL PRICE') && !firstCell.includes('MATERIAL COST')) {
                    
                    // Check if this looks like YARN data (has consumption in grams and price per kg)
                    if (row[1] && row[2] && row[3] && 
                        (row[1].toString().includes('G') || !isNaN(parseFloat(row[1]))) &&
                        (row[2].toString().includes('USD/KG') || !isNaN(parseFloat(row[2]))) &&
                        (!isNaN(parseFloat(row[3])) || row[3].toString().includes('$'))) {
                        
                        // Check if we're in a context that suggests this is YARN
                        let isYarnContext = false;
                        
                        // Look back a few rows to see if we recently saw YARN section
                        for (let j = Math.max(0, i - 10); j < i; j++) {
                            const prevRow = data[j];
                            if (prevRow && prevRow[0]) {
                                const prevFirstCell = String(prevRow[0] || '').trim();
                                if (prevFirstCell === 'YARN' || prevFirstCell.includes('YARN') || 
                                    (prevFirstCell.includes('(Name/Code/Description)') && prevRow[1] && prevRow[1].includes('CONSUMPTION') && 
                                     prevRow[1].includes('G') && prevRow[2] && prevRow[2].includes('USD/KG'))) {
                                    isYarnContext = true;
                                    break;
                                }
                            }
                        }
                        
                        if (isYarnContext) {
                            currentSection = 'yarn';
                            console.log('🔍 Detected YARN data by context at row', i, ':', firstCell);
                        }
                    }
                }
                
                // Debug: Log current section and row data for operations/overhead
                if (currentSection === 'operations' || currentSection === 'overhead') {
                    console.log(`🔍 Current section: ${currentSection}, Row ${i}:`, firstCell, '|', row[1], '|', row[2], '|', row[3]);
                }
                
                // Debug: Log current section and row data for material sections
                if (currentSection === 'yarn' || currentSection === 'fabric' || currentSection === 'trim') {
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
                    
                    console.log(`🔍 Processing YARN row: "${firstCell}" - Row data:`, row);
                    console.log(`🔍 YARN section active, processing row ${i}:`, firstCell);
                    
                    // Calculate cost if not provided or if consumption and price are available
                    let cost = '';
                    let consumption = String(row[1] || '');
                    let price = String(row[2] || '');
                    
                    console.log(`🔍 YARN data - Material: "${firstCell}", Consumption: "${consumption}", Price: "${price}"`);
                    
                    // First try to get cost directly from column 3 (D)
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                        console.log('  ✅ Found cost in col 3:', cost);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: (consumption in grams / 1000) * price per kg
                        const consumptionKg = parseFloat(row[1]) / 1000;
                        const pricePerKg = parseFloat(row[2]);
                        cost = (consumptionKg * pricePerKg).toFixed(2);
                        console.log('  ✅ Calculated cost:', cost, 'from consumption:', row[1], 'and price:', row[2]);
                    } else {
                        console.log('  ⚠️ No valid cost found - consumption:', row[1], 'price:', row[2], 'cost:', row[3]);
                    }
                    
                    // Always add the item, even if cost is empty (for debugging)
                    result.yarn.push({
                        material: firstCell,
                        consumption: consumption,
                        price: price,
                        cost: cost || '0.00'
                    });
                    console.log('✅ YARN added:', firstCell, 'Consumption:', consumption, 'Price:', price, 'Cost:', cost || '0.00');
                }
                
                if (currentSection === 'fabric' && firstCell && 
                    !firstCell.includes('FABRIC') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    console.log(`🔍 Processing FABRIC row: "${firstCell}" - Row data:`, row);
                    
                    // Calculate cost if not provided or if consumption and price are available
                    let cost = '';
                    let consumption = String(row[1] || '');
                    let price = String(row[2] || '');
                    
                    // First try to get cost directly from column 3 (D)
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                        console.log('  Found cost in col 3:', cost);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: consumption * price
                        const consumptionVal = parseFloat(row[1]);
                        const priceVal = parseFloat(row[2]);
                        cost = (consumptionVal * priceVal).toFixed(2);
                        console.log('  Calculated cost:', cost, 'from consumption:', row[1], 'and price:', row[2]);
                    }
                    
                    // Always add the item, even if cost is empty (for debugging)
                    result.fabric.push({
                        material: firstCell,
                        consumption: consumption,
                        price: price,
                        cost: cost || '0.00'
                    });
                    console.log('✅ FABRIC added:', firstCell, 'Consumption:', consumption, 'Price:', price, 'Cost:', cost || '0.00');
                }
                
                if (currentSection === 'trim' && firstCell && 
                    !firstCell.includes('TRIM') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    console.log(`🔍 Processing TRIM row: "${firstCell}" - Row data:`, row);
                    
                    // Calculate cost if not provided or if consumption and price are available
                    let cost = '';
                    let consumption = String(row[1] || '');
                    let price = String(row[2] || '');
                    
                    // First try to get cost directly from column 3 (D)
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        cost = parseFloat(row[3]).toFixed(2);
                        console.log('  Found cost in col 3:', cost);
                    } else if (row[1] && row[2] && !isNaN(parseFloat(row[1])) && !isNaN(parseFloat(row[2]))) {
                        // Calculate: consumption * price
                        const consumptionVal = parseFloat(row[1]);
                        const priceVal = parseFloat(row[2]);
                        cost = (consumptionVal * priceVal).toFixed(2);
                        console.log('  Calculated cost:', cost, 'from consumption:', row[1], 'and price:', row[2]);
                    }
                    
                    // Always add the item, even if cost is empty (for debugging)
                    result.trim.push({
                        material: firstCell,
                        consumption: consumption,
                        price: price,
                        cost: cost || '0.00'
                    });
                    console.log('✅ TRIM added:', firstCell, 'Consumption:', consumption, 'Price:', price, 'Cost:', cost || '0.00');
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
                    !firstCell.includes('OPERATION') && 
                    !firstCell.includes('OPERATIONS') && 
                    !firstCell.includes('SMV') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('USD/MIN') &&
                    !firstCell.includes('SUB TOTAL') && 
                    !firstCell.includes('TOTAL') &&
                    firstCell.trim() !== '') {
                    console.log(`🔍 Checking OPERATIONS: "${firstCell}" - Row:`, row);
                    
                    // Updated operations parsing to match new header structure:
                    // OPERATION | BLANK | SMV | COST (USD/MIN)
                    let smv = '';
                    let costPerMin = '';
                    let total = '';
                    
                    // SMV is in col 2 (index 2)
                    if (row[2] && !isNaN(parseFloat(row[2]))) {
                        smv = parseFloat(row[2]).toFixed(2);
                    }
                    
                    // COST (USD/MIN) is in col 3 (index 3)
                    if (row[3] && !isNaN(parseFloat(row[3]))) {
                        costPerMin = parseFloat(row[3]).toFixed(2);
                    }
                    
                    // Calculate total: SMV * COST (USD/MIN)
                    if (smv && costPerMin) {
                        total = (parseFloat(smv) * parseFloat(costPerMin)).toFixed(2);
                    }
                    
                    // If we have any meaningful data, add the operation
                    if (smv || costPerMin || total) {
                        let operationName = `Operation ${result.operations.length + 1}`;
                        result.operations.push({
                            operation: String(operationName),
                            smv: smv,
                            costPerMin: costPerMin,
                            total: total
                        });
                        console.log('✅ OPERATION:', operationName, 'SMV:', smv, 'Cost/Min:', costPerMin, 'Total:', total);
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
                    
                    // If we found a cost, add the packaging item
                    if (cost) {
                        result.packaging.push({
                            type: firstCell,
                            notes: notes,
                            cost: cost
                        });
                        console.log('✅ PACKAGING:', firstCell, 'Notes:', notes, 'Cost:', cost);
                    }
                }
                
                if (currentSection === 'overhead' && firstCell && 
                    !firstCell.includes('Factory Notes') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
                    // Read exact values from Excel file for OVERHEAD and PROFIT
                    if (firstCell === 'OVERHEAD' || firstCell === 'PROFIT') {
                        console.log('🔍 Processing OVERHEAD/PROFIT from Excel:', firstCell, '| Row data:', row);
                        
                        // Look for cost in different columns (prioritize Excel values)
                        let cost = '';
                        let notes = String(row[1] || '');
                        
                        // Try to find cost in col 2 or col 3
                        if (row[2] !== undefined && row[2] !== null && !isNaN(parseFloat(row[2]))) {
                            cost = parseFloat(row[2]).toFixed(2);
                            console.log('  Found cost in col 2:', cost);
                        } else if (row[3] !== undefined && row[3] !== null && !isNaN(parseFloat(row[3]))) {
                            cost = parseFloat(row[3]).toFixed(2);
                            console.log('  Found cost in col 3:', cost);
                        }
                        
                        // If no cost found in Excel, use default values
                        if (cost === '') {
                            if (firstCell === 'OVERHEAD') {
                                cost = '0.20';
                                console.log('  Using default OVERHEAD cost: 0.20');
                            } else if (firstCell === 'PROFIT') {
                                cost = '0.59';
                                console.log('  Using default PROFIT cost: 0.59');
                            }
                        }
                        
                        // Add the overhead item with Excel or default cost
                        if (cost !== '') {
                        result.overhead.push({
                            type: firstCell,
                                notes: notes,
                                cost: cost
                            });
                            console.log('✅ OVERHEAD/PROFIT:', firstCell, 'Notes:', notes, 'Cost:', cost);
                        }
                    } else if (firstCell.toLowerCase().includes('scripto')) {
                        console.log('🔍 Converting Scripto to OVERHEAD:', firstCell);
                        result.overhead.push({
                            type: 'OVERHEAD',
                            notes: '',
                            cost: '0.59'
                        });
                        console.log('✅ Converted Scripto to OVERHEAD: Cost: 0.59');
                    } else {
                        // Look for cost in different columns for other items
                        let cost = '';
                        let notes = String(row[1] || '');
                        
                        // Try to find cost in col 2 or col 3
                        if (row[2] && !isNaN(parseFloat(row[2]))) {
                            cost = parseFloat(row[2]).toFixed(2);
                        } else if (row[3] && !isNaN(parseFloat(row[3]))) {
                            cost = parseFloat(row[3]).toFixed(2);
                        }
                        
                        // If we found a cost, add the overhead item
                        if (cost) {
                        result.overhead.push({
                            type: firstCell,
                                notes: notes,
                                cost: cost
                        });
                            console.log('✅ OVERHEAD:', firstCell, 'Notes:', notes, 'Cost:', cost);
                        }
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

                // Extract OVERHEAD SUB TOTAL from Excel file (read like other features)
                if (currentSection === 'overhead' && firstCell && firstCell.includes('SUB TOTAL')) {
                    console.log('🔍 Found SUB TOTAL row in Excel:', firstCell, '| Row data:', row);
                    
                    // Look for cost in different columns (same as OVERHEAD and PROFIT)
                    let cost = '';
                    let notes = String(row[1] || '');
                    
                    // Try to find cost in col 2 or col 3 (same logic as other items)
                    if (row[2] !== undefined && row[2] !== null && !isNaN(parseFloat(row[2]))) {
                        cost = parseFloat(row[2]).toFixed(2);
                        console.log('  Found SUB TOTAL cost in col 2:', cost);
                    } else if (row[3] !== undefined && row[3] !== null && !isNaN(parseFloat(row[3]))) {
                        cost = parseFloat(row[3]).toFixed(2);
                        console.log('  Found SUB TOTAL cost in col 3:', cost);
                    } else if (row[4] !== undefined && row[4] !== null && !isNaN(parseFloat(row[4]))) {
                        cost = parseFloat(row[4]).toFixed(2);
                        console.log('  Found SUB TOTAL cost in col 4:', cost);
                    }
                    
                    if (cost !== '') {
                        result.overheadSubTotal = cost;
                        console.log('✅ OVERHEAD SUB TOTAL from Excel:', result.overheadSubTotal, 'from row', i, 'cell:', firstCell);
                    } else {
                        console.log('❌ SUB TOTAL row found but no valid cost value');
                    }
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

        // Calculate accurate totals from parsed data
        console.log('🔍 Calculating accurate totals from parsed data...');
        
        // Calculate Material Total (YARN + FABRIC + TRIM)
        let calculatedMaterialTotal = 0;
        
        // Sum YARN costs
        result.yarn.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            calculatedMaterialTotal += cost;
            console.log('  YARN cost:', item.material, '=', cost);
        });
        
        // Sum FABRIC costs
        result.fabric.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            calculatedMaterialTotal += cost;
            console.log('  FABRIC cost:', item.material, '=', cost);
        });
        
        // Sum TRIM costs
        result.trim.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            calculatedMaterialTotal += cost;
            console.log('  TRIM cost:', item.material, '=', cost);
        });
        
        // Update material total with calculated value
        if (calculatedMaterialTotal > 0) {
            result.totalMaterialCost = calculatedMaterialTotal.toFixed(2);
            console.log('✅ Calculated Material Total:', result.totalMaterialCost);
        }
        
        // Calculate Factory Total (Material + KNITTING + OPERATIONS + PACKAGING + OVERHEAD)
        let calculatedFactoryTotal = calculatedMaterialTotal;
        
        // Sum KNITTING costs
        result.knitting.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            calculatedFactoryTotal += cost;
            console.log('  KNITTING cost:', item.machine, '=', cost);
        });
        
        // Sum OPERATIONS costs - Updated to use new structure
        result.operations.forEach(item => {
            const cost = parseFloat(item.total) || parseFloat(item.cost) || 0;
            calculatedFactoryTotal += cost;
            console.log('  OPERATIONS cost:', item.operation, '=', cost);
        });
        
        // Sum PACKAGING costs
        result.packaging.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            calculatedFactoryTotal += cost;
            console.log('  PACKAGING cost:', item.type, '=', cost);
        });
        
        // Sum OVERHEAD costs
        result.overhead.forEach(item => {
            const cost = parseFloat(item.cost) || 0;
            calculatedFactoryTotal += cost;
            console.log('  OVERHEAD cost:', item.type, '=', cost);
        });
        
        // Update factory total with calculated value
        if (calculatedFactoryTotal > 0) {
            result.totalFactoryCost = calculatedFactoryTotal.toFixed(2);
            console.log('✅ Calculated Factory Total:', result.totalFactoryCost);
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

    /**
     * Make existing UI text editable by converting table cells to input fields
     * @param {Object} data - Parsed data to populate
     */
    makeUIEditable(data) {
        console.log('🎨 Making UI text editable...');
        
        // Make all table cells editable
        this.makeTableCellsEditable();
        
        // Populate with data
        this.populateEditableFields(data);
        
        console.log('✅ UI is now editable');
    }

    /**
     * Convert table cells to editable input fields
     */
    makeTableCellsEditable() {
        // Find all tables in the document
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            
            rows.forEach((row, rowIndex) => {
                // Skip header rows
                if (rowIndex === 0) return;
                
                const cells = row.querySelectorAll('td');
                
                cells.forEach((cell, cellIndex) => {
                    // Skip if already editable
                    if (cell.querySelector('input, textarea')) return;
                    
                    const originalText = cell.textContent.trim();
                    
                    // Create input field
                    let input;
                    if (cellIndex === 0) {
                        // First column (material) - use textarea for longer text
                        input = document.createElement('textarea');
                        input.rows = 2;
                        input.style.cssText = `
                            width: 100%;
                            border: none;
                            padding: 4px;
                            resize: vertical;
                            min-height: 30px;
                            font-family: inherit;
                            font-size: inherit;
                            background: transparent;
                        `;
                    } else {
                        // Other columns - use input
                        input = document.createElement('input');
                        input.type = 'text';
                        input.style.cssText = `
                            width: 100%;
                            border: none;
                            padding: 4px;
                            font-family: inherit;
                            font-size: inherit;
                            background: transparent;
                        `;
                    }
                    
                    // Set value and placeholder
                    input.value = originalText;
                    input.placeholder = originalText || 'Enter value...';
                    
                    // Add hover and focus effects
                    input.addEventListener('mouseenter', () => {
                        input.style.backgroundColor = '#f8f9fa';
                        input.style.border = '1px solid #007bff';
                        input.style.borderRadius = '3px';
                    });
                    
                    input.addEventListener('mouseleave', () => {
                        if (document.activeElement !== input) {
                            input.style.backgroundColor = 'transparent';
                            input.style.border = 'none';
                            input.style.borderRadius = '0';
                        }
                    });
                    
                    input.addEventListener('focus', () => {
                        input.style.backgroundColor = '#fff';
                        input.style.border = '2px solid #007bff';
                        input.style.borderRadius = '3px';
                        input.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
                    });
                    
                    input.addEventListener('blur', () => {
                        input.style.backgroundColor = 'transparent';
                        input.style.border = 'none';
                        input.style.borderRadius = '0';
                        input.style.boxShadow = 'none';
                    });
                    
                    // Clear cell content and add input
                    cell.innerHTML = '';
                    cell.appendChild(input);
                });
            });
        });
    }

    /**
     * Populate editable fields with data
     * @param {Object} data - Data to populate
     */
    populateEditableFields(data) {
        // Make header fields editable and populate them
        this.makeHeaderFieldsEditable();
        this.populateHeaderFields(data);
        
        // Populate material sections
        this.populateMaterialSection('yarn', data.yarn);
        this.populateMaterialSection('fabric', data.fabric);
        this.populateMaterialSection('trim', data.trim);
        this.populateMaterialSection('knitting', data.knitting);
        this.populateMaterialSection('embroidery', data.embroidery);
    }

    /**
     * Make header fields editable by converting them to input fields
     */
    makeHeaderFieldsEditable() {
        // Find and make all info-value spans editable
        const infoValues = document.querySelectorAll('.info-value');
        infoValues.forEach(span => {
            this.makeFieldEditable(span);
        });
    }

    /**
     * Make a specific field editable
     * @param {string|Element} selector - CSS selector for the field or element
     * @param {string} value - Value to set (optional)
     */
    makeFieldEditable(selector, value = null) {
        const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];
        elements.forEach(element => {
            // Skip if already editable
            if (element.querySelector('input, textarea')) return;
            
            const originalText = element.textContent.trim();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value !== null ? value : originalText;
            input.placeholder = originalText || 'Enter value...';
            input.style.cssText = `
                width: 100%;
                border: none;
                padding: 4px;
                font-family: inherit;
                font-size: inherit;
                background: transparent;
                text-align: inherit;
            `;
            
            // Add hover and focus effects
            input.addEventListener('mouseenter', () => {
                input.style.backgroundColor = '#f8f9fa';
                input.style.border = '1px solid #007bff';
                input.style.borderRadius = '3px';
            });
            
            input.addEventListener('mouseleave', () => {
                if (document.activeElement !== input) {
                    input.style.backgroundColor = 'transparent';
                    input.style.border = 'none';
                    input.style.borderRadius = '0';
                }
            });
            
            input.addEventListener('focus', () => {
                input.style.backgroundColor = '#fff';
                input.style.border = '2px solid #007bff';
                input.style.borderRadius = '3px';
                input.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
            });
            
            input.addEventListener('blur', () => {
                input.style.backgroundColor = 'transparent';
                input.style.border = 'none';
                input.style.borderRadius = '0';
                input.style.boxShadow = 'none';
            });
            
            // Clear element content and add input
            element.innerHTML = '';
            element.appendChild(input);
        });
    }

    /**
     * Populate header fields with data
     * @param {Object} data - Data to populate
     */
    populateHeaderFields(data) {
        this.setFieldValue('input[name="customer"]', data.customer);
        this.setFieldValue('input[name="season"]', data.season);
        this.setFieldValue('input[name="styleNumber"]', data.styleNumber);
        this.setFieldValue('input[name="styleName"]', data.styleName);
        this.setFieldValue('input[name="costedQuantity"]', data.costedQuantity);
        this.setFieldValue('input[name="leadtime"]', data.leadtime);
        this.setFieldValue('input[name="totalMaterialCost"]', data.totalMaterialCost);
        this.setFieldValue('input[name="totalFactoryCost"]', data.totalFactoryCost);
    }

    /**
     * Set field value by selector
     * @param {string} selector - CSS selector
     * @param {string} value - Value to set
     */
    setFieldValue(selector, value) {
        const field = document.querySelector(selector);
        if (field) {
            field.value = value || '';
        }
    }

    /**
     * Populate material section data
     * @param {string} sectionName - Name of the section
     * @param {Array} items - Array of items
     */
    populateMaterialSection(sectionName, items) {
        // Find table rows that might contain this section
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
            
            // Check if this table has material-related headers
            if (headers.includes('material') && headers.includes('consumption')) {
                const rows = table.querySelectorAll('tr');
                
                // Skip header row
                for (let i = 1; i < rows.length && i - 1 < items.length; i++) {
                    const cells = rows[i].querySelectorAll('td');
                    const item = items[i - 1];
                    
                    if (cells.length >= 4 && item) {
                        // Material
                        const materialInput = cells[0].querySelector('input, textarea');
                        if (materialInput) materialInput.value = item.material || '';
                        
                        // Consumption
                        const consumptionInput = cells[1].querySelector('input');
                        if (consumptionInput) consumptionInput.value = item.consumption || '';
                        
                        // Price
                        const priceInput = cells[2].querySelector('input');
                        if (priceInput) priceInput.value = item.price || '';
                        
                        // Cost
                        const costInput = cells[3].querySelector('input');
                        if (costInput) costInput.value = item.cost || '';
                    }
                }
            }
        });
    }

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TNFBeanieImporter;
}
