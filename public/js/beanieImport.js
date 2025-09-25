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
                    !firstCell.includes('OVERHEAD') && 
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
     * Save parsed data to database
     */
    async saveToDatabase(data, tableName = 'beanie_costs') {
        try {
            console.log('💾 Saving beanie data to database...');
            console.log('📊 Data to save:', {
                customer: data.customer,
                season: data.season,
                styleNumber: data.styleNumber,
                styleName: data.styleName,
                totalMaterialCost: data.totalMaterialCost,
                totalFactoryCost: data.totalFactoryCost
            });

            const response = await fetch('/.netlify/functions/beanie-data-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: data,
                    tableName: tableName
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Beanie data saved successfully to database!');
                console.log('📋 Saved record:', result.data);
                return result.data;
            } else {
                console.error('❌ Failed to save beanie data:', result.error);
                throw new Error(result.error || 'Failed to save data');
            }
        } catch (error) {
            console.error('❌ Error saving beanie data to database:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TNFBeanieImporter;
}