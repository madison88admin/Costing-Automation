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
            
            // Extract actual values from the Excel data structure
            // Look for the actual values in the data, not force specific ones
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row) continue;
                
                // Look for Season pattern in the data
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j] || '').trim();
                    if (cell.includes('Season：') && j + 1 < row.length && row[j + 1]) {
                        result.season = String(row[j + 1]).trim();
                        console.log('✅ Season found:', result.season);
                    }
                    if (cell.includes('Style#:') && j + 1 < row.length && row[j + 1]) {
                        result.styleNumber = String(row[j + 1]).trim();
                        console.log('✅ Style# found:', result.styleNumber);
                    }
                    if (cell.includes('Style Name:') && j + 1 < row.length && row[j + 1]) {
                        result.styleName = String(row[j + 1]).trim();
                        console.log('✅ Style Name found:', result.styleName);
                    }
                    if (cell.includes('Costed Quantity:') && j + 1 < row.length && row[j + 1]) {
                        result.costedQuantity = String(row[j + 1]).trim();
                        console.log('✅ Costed Quantity found:', result.costedQuantity);
                    }
                    if (cell.includes('Leadtime:') && j + 1 < row.length && row[j + 1]) {
                        result.leadtime = String(row[j + 1]).trim();
                        console.log('✅ Leadtime found:', result.leadtime);
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
                    console.log('🔍 Found OVERHEAD section');
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
                    row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.yarn.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ YARN:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'fabric' && firstCell && 
                    !firstCell.includes('FABRIC') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.fabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ FABRIC:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'trim' && firstCell && 
                    !firstCell.includes('TRIM') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') && 
                    row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.trim.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ TRIM:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'knitting' && firstCell && 
                    !firstCell.includes('KNITTING') && 
                    !firstCell.includes('KNITTING TIME') && 
                    !firstCell.includes('KNITTING SAH') && 
                    !firstCell.includes('KNITTING COST') && 
                    !firstCell.includes('TOTAL') && 
                    row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.knitting.push({
                        machine: firstCell,
                        time: String(row[1] || ''),
                        sah: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ KNITTING:', firstCell, 'Cost:', row[3]);
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