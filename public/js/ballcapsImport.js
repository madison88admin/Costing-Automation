/**
 * TNF Ball Caps Cost Breakdown Excel Import Parser
 * Handles parsing of TNF Excel files for ball cap products
 */

class TNFBallCapsImporter {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls', '.xlsm'];
    }

    /**
     * Parse TNF Excel data into structured format for ball caps
     * @param {Object|Array} excelData - Raw Excel data from XLSX library (can be array or object with data/images)
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

        console.log('Processing TNF Ball Caps Excel data with', data.length, 'rows');
        console.log('Found', images.length, 'embedded images');

        const result = {
            customer: "TNF",
            season: "F25", 
            styleNumber: "",
            styleName: "",
            costedQuantity: "",
            leadtime: "",
            
            // Ball caps specific sections
            fabric: [],
            trim: [],
            embroidery: [],
            operations: [],
            packaging: [],
            overhead: [],
            
            totalMaterialCost: "0.00",
            totalFactoryCost: "0.00",
            
            // Add images array
            images: images
        };

        // FLEXIBLE PARSING - Search through all rows for data patterns
        try {
            // Search for basic info in any row
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row) continue;
                
                // Look for Customer info
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
                    if (cell.includes('MOQ') && j + 1 < row.length && row[j + 1]) {
                        result.costedQuantity = String(row[j + 1]).trim();
                        console.log('✅ MOQ:', result.costedQuantity);
                    }
                    if (cell.includes('Leadtime') && j + 1 < row.length && row[j + 1]) {
                        result.leadtime = String(row[j + 1]).trim();
                        console.log('✅ Leadtime:', result.leadtime);
                    }
                }
            }

            // FLEXIBLE COST DATA PARSING - Search through all rows
            let currentSection = '';
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Detect sections
                if (firstCell === 'FABRIC' || firstCell === 'FABRIC/S') {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section');
                } else if (firstCell === 'EMBROIDERY' || firstCell === 'OTHER FABRIC/S - TRIM/S') {
                    currentSection = 'embroidery';
                    console.log('🔍 Found OTHER FABRIC/S - TRIM/S section');
                } else if (firstCell === 'TRIM' || firstCell === 'TRIM/S') {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section');
                } else if (firstCell === 'OPERATIONS') {
                    currentSection = 'operations';
                    console.log('🔍 Found OPERATIONS section');
                } else if (firstCell === 'PACKAGING') {
                    currentSection = 'packaging';
                    console.log('🔍 Found PACKAGING section');
                } else if (firstCell === 'OVERHEAD/ PROFIT' || firstCell === 'OVERHEAD/PROFIT' || firstCell === 'OVERHEAD') {
                    currentSection = 'overhead';
                    console.log('🔍 Found OVERHEAD section');
                } else if (firstCell === 'TOTAL FACTORY COST') {
                    console.log('🔍 Found TOTAL FACTORY COST');
                }
                
                // Debug: Log current section and row data for operations/overhead
                if (currentSection === 'operations' || currentSection === 'overhead') {
                    console.log(`🔍 Current section: ${currentSection}, Row ${i}:`, firstCell, '|', row[1], '|', row[2], '|', row[3]);
                }
                
                // Detect header rows and set current section based on context
                if (firstCell.includes('(Name/Code/Description)') && row[1] && row[1].includes('CONSUMPTION')) {
                    // This is a header row, determine section based on context
                    if (row[1].includes('YARD') && row[2] && row[2].includes('USD/YD')) {
                        currentSection = 'fabric';
                        console.log('🔍 Found FABRIC header row');
                    } else if (row[1].includes('PIECE') && row[2] && row[2].includes('USD/PC')) {
                        currentSection = 'trim';
                        console.log('🔍 Found TRIM header row');
                    }
                }
                
                // Detect OTHER FABRIC/S - TRIM/S header
                if (firstCell.includes('OTHER FABRIC/S - TRIM/S') && row[1] && row[1].includes('CONSUMPTION (YARD)')) {
                    currentSection = 'embroidery';
                    console.log('🔍 Found OTHER FABRIC/S - TRIM/S header row');
                }
                
                // Parse data based on section
                if (currentSection === 'fabric' && firstCell && 
                    !firstCell.includes('FABRIC') && 
                    !firstCell.includes('(Name/Code/Description)') && 
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
                
                if (currentSection === 'embroidery' && firstCell && 
                    !firstCell.includes('EMBROIDERY') && 
                    !firstCell.includes('OTHER FABRIC/S') && 
                    !firstCell.includes('(Name/Code/Description)') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    row[3] && !isNaN(parseFloat(row[3]))) {
                    result.embroidery.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ OTHER FABRIC/S - TRIM/S:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'trim' && firstCell && 
                    !firstCell.includes('(Name/Code/Description)') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    row[3] !== undefined && !isNaN(parseFloat(row[3]))) {
                    result.trim.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ TRIM:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'operations' && !firstCell.includes('OPERATIONS') && !firstCell.includes('TIME') && !firstCell.includes('COST') && !firstCell.includes('SUB TOTAL') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OPERATIONS: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    // Check if this row has operations data (SMV in col 1, cost in col 3)
                    if (row[1] && !isNaN(parseFloat(row[1])) && row[3] && !isNaN(parseFloat(row[3]))) {
                        result.operations.push({
                            operation: firstCell,
                            smv: parseFloat(row[1]).toFixed(2),
                            cost: parseFloat(row[3]).toFixed(2),
                            total: (parseFloat(row[1]) * parseFloat(row[3])).toFixed(2)
                        });
                        console.log('✅ OPERATION:', firstCell, 'SMV:', row[1], 'Cost:', row[3]);
                    }
                }
                
                if (currentSection === 'packaging' && firstCell && 
                    !firstCell.includes('PACKAGING') && 
                    !firstCell.includes('Factory Notes') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('TOTAL') && 
                    row[2] && !isNaN(parseFloat(row[2]))) {
                    result.packaging.push({
                        type: firstCell,
                        notes: String(row[1] || ''),
                        cost: parseFloat(row[2]).toFixed(2)
                    });
                    console.log('✅ PACKAGING:', firstCell, 'Cost:', row[2]);
                }
                
                if (currentSection === 'overhead' && firstCell && 
                    !firstCell.includes('OVERHEAD') && 
                    !firstCell.includes('Factory Notes') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('TOTAL') && 
                    row[2] && !isNaN(parseFloat(row[2]))) {
                    result.overhead.push({
                        type: firstCell,
                        notes: String(row[1] || ''),
                        cost: parseFloat(row[2]).toFixed(2)
                    });
                    console.log('✅ OVERHEAD:', firstCell, 'Notes:', row[1], 'Cost:', row[2]);
                }
                
                // Extract totals - enhanced pattern matching
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
            console.error('Error in flexible parsing:', error);
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
        console.log('FABRIC items:', result.fabric.length, result.fabric);
        console.log('OTHER FABRIC/S - TRIM/S items:', result.embroidery.length, result.embroidery);
        console.log('TRIM items:', result.trim.length, result.trim);
        console.log('OPERATIONS items:', result.operations.length, result.operations);
        console.log('PACKAGING items:', result.packaging.length, result.packaging);
        console.log('OVERHEAD items:', result.overhead.length, result.overhead);
        console.log('Material Total:', result.totalMaterialCost);
        console.log('Factory Total:', result.totalFactoryCost);
        console.log('=== END RESULT ===');

        console.log('Parsed TNF Ball Caps data:', result);
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TNFBallCapsImporter;
}