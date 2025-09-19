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
     * @param {Array} excelData - Raw Excel data from XLSX library
     * @returns {Object} Parsed cost breakdown data
     */
    parseExcelData(excelData) {
        if (!excelData || excelData.length === 0) {
            throw new Error('No data found in the Excel file');
        }

        console.log('Processing TNF Ball Caps Excel data with', excelData.length, 'rows');
        console.log('=== USING BALL CAPS IMPORTER ===');
        console.log('First 10 rows of raw data:', excelData.slice(0, 10));
        console.log('All rows of raw data:', excelData);

        const result = {
            customer: "TNF",
            season: "F25", 
            styleNumber: "",
            styleName: "",
            costedQuantity: "",
            leadtime: "",
            
            // Ball caps specific sections
            fabric: [],
            otherFabric: [],
            trim: [],
            embroidery: [],
            operations: [],
            packaging: [],
            overhead: [],
            
            totalMaterialCost: "0.00",
            totalFactoryCost: "0.00"
        };

        // FLEXIBLE PARSING - Search through all rows for data patterns
        try {
            // Search for basic info in any row
            for (let i = 0; i < excelData.length; i++) {
                const row = excelData[i];
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
                    if (cell.includes('Costed Quantity') && j + 1 < row.length && row[j + 1]) {
                        result.costedQuantity = String(row[j + 1]).trim();
                        console.log('✅ Quantity:', result.costedQuantity);
                    }
                    if (cell.includes('Leadtime') && j + 1 < row.length && row[j + 1]) {
                        result.leadtime = String(row[j + 1]).trim();
                        console.log('✅ Leadtime:', result.leadtime);
                    }
                    if (cell.includes('MOQ') && j + 1 < row.length && row[j + 1]) {
                        result.costedQuantity = String(row[j + 1]).trim();
                        console.log('✅ MOQ:', result.costedQuantity);
                    }
                }
            }

            // FLEXIBLE COST DATA PARSING - Search through all rows (using beanie approach)
            let currentSection = '';
            
            for (let i = 0; i < excelData.length; i++) {
                const row = excelData[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Debug: Log all section headers we encounter
                if (firstCell && (firstCell.includes('FABRIC') || firstCell.includes('TRIM') || firstCell.includes('OPERATIONS') || firstCell.includes('PACKAGING') || firstCell.includes('OVERHEAD') || firstCell.includes('TOTAL'))) {
                    console.log('🔍 Section header found:', firstCell);
                }
                
                // Detect sections - using flexible matching for ballcaps headers
                if (firstCell === 'FABRIC' || firstCell === 'FABRIC/S' || firstCell.startsWith('FABRIC/S')) {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section');
                } else if (firstCell === 'OTHER FABRIC/S - TRIM/S') {
                    currentSection = 'otherFabric';
                    console.log('🔍 Found OTHER FABRIC/S - TRIM/S section');
                } else if (firstCell === 'TRIM' || firstCell === 'TRIM/S' || firstCell.startsWith('TRIM/S')) {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section');
                } else if (firstCell === 'EMBROIDERY') {
                    currentSection = 'embroidery';
                    console.log('🔍 Found EMBROIDERY section');
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
                    // Don't stop parsing here - continue to get the total
                    console.log('🔍 Found TOTAL FACTORY COST');
                }
                
                // Debug: Log what we're processing in each section
                if (currentSection && firstCell && !firstCell.includes('FABRIC') && !firstCell.includes('TRIM') && !firstCell.includes('EMBROIDERY') && !firstCell.includes('OPERATIONS') && !firstCell.includes('PACKAGING') && !firstCell.includes('OVERHEAD') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Processing in ${currentSection}: "${firstCell}" - Row data:`, row);
                }
                
                // Parse data based on section - using same logic as beanie import
                if (currentSection === 'fabric' && firstCell && !firstCell.includes('FABRIC') && !firstCell.includes('CONSUMPTION') && !firstCell.includes('MATERIAL') && !firstCell.includes('TOTAL') && row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.fabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ FABRIC:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                
                if (currentSection === 'otherFabric' && firstCell && !firstCell.includes('FABRIC') && !firstCell.includes('CONSUMPTION') && !firstCell.includes('MATERIAL') && !firstCell.includes('TOTAL') && row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.otherFabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ OTHER FABRIC:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                
                if (currentSection === 'trim' && firstCell && !firstCell.includes('TRIM') && !firstCell.includes('CONSUMPTION') && !firstCell.includes('MATERIAL') && !firstCell.includes('TOTAL') && row[3] && !isNaN(parseFloat(row[3]))) {
                    result.trim.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ TRIM:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                
                if (currentSection === 'operations' && firstCell && !firstCell.includes('OPERATIONS') && !firstCell.includes('TIME') && !firstCell.includes('COST') && !firstCell.includes('SUB TOTAL') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OPERATIONS: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    // For ballcaps, operations data might be in different columns
                    // Check if there's a valid cost in any column
                    let operationCost = null;
                    let operationTime = null;
                    
                    // Look for cost in column 3 (SMV) or column 4 (COST)
                    if (row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                        operationCost = parseFloat(row[3]);
                        operationTime = row[1] || '';
                    } else if (row[4] && !isNaN(parseFloat(row[4])) && parseFloat(row[4]) > 0) {
                        operationCost = parseFloat(row[4]);
                        operationTime = row[2] || '';
                    }
                    
                    if (operationCost !== null) {
                        result.operations.push({
                            operation: firstCell,
                            time: String(operationTime),
                            cost: operationCost.toFixed(2),
                            total: operationCost.toFixed(2)
                        });
                        console.log('✅ OPERATION:', firstCell, 'Time:', operationTime, 'Cost:', operationCost);
                    }
                }
                
                if (currentSection === 'packaging' && firstCell && !firstCell.includes('PACKAGING') && !firstCell.includes('Factory Notes') && !firstCell.includes('SUB TOTAL') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking PACKAGING: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    if (row[3] !== undefined && !isNaN(parseFloat(row[3]))) {
                        result.packaging.push({
                            type: firstCell,
                            notes: String(row[1] || ''),
                            cost: parseFloat(row[3]).toFixed(2)
                        });
                        console.log('✅ PACKAGING:', firstCell, 'Notes:', row[1], 'Cost:', row[3]);
                    }
                }
                
                if (currentSection === 'overhead' && firstCell && !firstCell.includes('OVERHEAD') && !firstCell.includes('PROFIT') && !firstCell.includes('Factory Notes') && !firstCell.includes('SUB TOTAL') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OVERHEAD: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    if (row[3] !== undefined && !isNaN(parseFloat(row[3]))) {
                        result.overhead.push({
                            type: firstCell,
                            notes: String(row[1] || ''),
                            cost: parseFloat(row[3]).toFixed(2)
                        });
                        console.log('✅ OVERHEAD:', firstCell, 'Notes:', row[1], 'Cost:', row[3]);
                    }
                } else if (currentSection === 'overhead' && firstCell && (firstCell.includes('OVERHEAD') || firstCell.includes('PROFIT')) && !firstCell.includes('Factory Notes') && !firstCell.includes('SUB TOTAL') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OVERHEAD (direct): "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    if (row[3] !== undefined && !isNaN(parseFloat(row[3]))) {
                        result.overhead.push({
                            type: firstCell,
                            notes: String(row[1] || ''),
                            cost: parseFloat(row[3]).toFixed(2)
                        });
                        console.log('✅ OVERHEAD (direct):', firstCell, 'Notes:', row[1], 'Cost:', row[3]);
                    }
                }
                
                // Extract totals
                if (firstCell.includes('TOTAL MATERIAL') && row[3]) {
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
        }

        // Use calculated totals if extraction didn't work
        if (result.totalMaterialCost === "0.00" && materialCostTotal > 0) {
            result.totalMaterialCost = materialCostTotal.toFixed(2);
        }
        if (result.totalFactoryCost === "0.00" && factoryCostTotal > 0) {
            result.totalFactoryCost = factoryCostTotal.toFixed(2);
        }

        console.log('=== FINAL RESULT ===');
        console.log('Customer:', result.customer);
        console.log('Season:', result.season);
        console.log('Style#:', result.styleNumber);
        console.log('Style Name:', result.styleName);
        console.log('FABRIC items:', result.fabric.length, result.fabric);
        console.log('OTHER FABRIC items:', result.otherFabric.length, result.otherFabric);
        console.log('TRIM items:', result.trim.length, result.trim);
        console.log('EMBROIDERY items:', result.embroidery.length, result.embroidery);
        console.log('OPERATIONS items:', result.operations.length, result.operations);
        console.log('PACKAGING items:', result.packaging.length, result.packaging);
        console.log('OVERHEAD items:', result.overhead.length, result.overhead);
        console.log('Material Total:', result.totalMaterialCost);
        console.log('Factory Total:', result.totalFactoryCost);
        console.log('=== END RESULT ===');
        
        return result;
    }

    /**
     * Extract basic product information from specific rows
     */
    extractBasicInfo(result, row, rowIndex) {
        // Extract from row 1
        if (rowIndex === 1) {
            result.customer = this.extractValue(row[4], 'Customer：') || result.customer;
            result.season = this.extractValue(row[5], 'Season：') || result.season;
        }

        // Extract from row 2
        if (rowIndex === 2) {
            result.styleNumber = this.extractValue(row[4], 'Style#:') || result.styleNumber;
            result.styleName = this.extractValue(row[7], 'Style Name:') || result.styleName;
        }

        // Extract from row 4
        if (rowIndex === 4) {
            result.costedQuantity = this.extractValue(row[4], 'Costed Quantity:') || result.costedQuantity;
        }

        // Extract from row 5
        if (rowIndex === 5) {
            result.leadtime = this.extractValue(row[4], 'Leadtime:') || result.leadtime;
        }
    }

    /**
     * Extract value from cell, removing prefix if present
     */
    extractValue(cell, prefix) {
        if (!cell) return '';
        return String(cell).replace(prefix, '').trim();
    }

    /**
     * Parse section headers and return current section
     */
    parseSectionHeader(firstCell, currentSection) {
        const sectionMap = {
            'FABRIC': 'fabric',
            'FABRIC/S': 'fabric',
            'OTHER FABRIC/S - TRIM/S': 'otherFabric',
            'TRIM': 'trim',
            'TRIM/S': 'trim',
            'EMBROIDERY': 'embroidery',
            'OPERATIONS': 'operations',
            'PACKAGING': 'packaging',
            'OVERHEAD/ PROFIT': 'overhead',
            'OVERHEAD/PROFIT': 'overhead'
        };

        return sectionMap[firstCell] || currentSection;
    }

    /**
     * Parse data for specific sections
     */
    parseSectionData(result, section, row, firstCell) {
        let materialCost = 0;
        let factoryCost = 0;

        switch (section) {
            case 'fabric':
                if (this.hasFabricData(row)) {
                    result.fabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: String(row[2] || ''),
                        cost: String(row[3] || '')
                    });
                    materialCost = parseFloat(row[3]) || 0;
                    console.log('✅ FABRIC:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                break;

            case 'otherFabric':
                if (this.hasFabricData(row)) {
                    result.otherFabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: String(row[2] || ''),
                        cost: String(row[3] || '')
                    });
                    materialCost = parseFloat(row[3]) || 0;
                    console.log('✅ OTHER FABRIC:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                break;

            case 'trim':
                if (this.hasTrimData(row)) {
                    result.trim.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: String(row[2] || ''),
                        cost: String(row[3] || '')
                    });
                    materialCost = parseFloat(row[3]) || 0;
                    console.log('✅ TRIM:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                break;

            case 'embroidery':
                if (this.hasEmbroideryData(row)) {
                    result.embroidery.push({
                        design: firstCell,
                        stitches: String(row[1] || ''),
                        price: String(row[2] || ''),
                        cost: String(row[3] || '')
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                }
                break;

            case 'operations':
                if (this.hasOperationsData(row)) {
                    result.operations.push({
                        operation: firstCell,
                        time: String(row[1] || ''),
                        cost: String(row[2] || ''),
                        total: String(row[3] || '')
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                }
                break;

            case 'packaging':
                if (this.hasPackagingData(row)) {
                    result.packaging.push({
                        type: firstCell,
                        notes: String(row[1] || ''),
                        cost: String(row[3] || '')
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                }
                break;

            case 'overhead':
                if (this.hasOverheadData(row)) {
                    result.overhead.push({
                        type: firstCell,
                        notes: String(row[1] || ''),
                        cost: String(row[3] || '')
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                }
                break;
        }

        return { material: materialCost, factory: factoryCost };
    }

    /**
     * Validation methods for each section
     */
    hasFabricData(row) {
        // FABRIC needs: material name, consumption, price, and cost
        const hasMaterial = row[0] && String(row[0]).trim() && !String(row[0]).includes('FABRIC') && !String(row[0]).includes('CONSUMPTION') && !String(row[0]).includes('MATERIAL');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0;
        return hasMaterial && hasCost;
    }

    hasTrimData(row) {
        // TRIM needs: material name and cost
        const hasMaterial = row[0] && String(row[0]).trim() && !String(row[0]).includes('TRIM') && !String(row[0]).includes('CONSUMPTION') && !String(row[0]).includes('MATERIAL');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) >= 0;
        return hasMaterial && hasCost;
    }

    hasEmbroideryData(row) {
        return row[1] && row[2] && row[3] && !isNaN(parseFloat(row[3]));
    }

    hasOperationsData(row) {
        return row[3] && !isNaN(parseFloat(row[3]));
    }

    hasPackagingData(row) {
        return row[3] && !isNaN(parseFloat(row[3]));
    }

    hasOverheadData(row) {
        return row[3] && !isNaN(parseFloat(row[3]));
    }

    /**
     * Extract total costs from specific rows
     */
    extractTotals(result, firstCell, row) {
        if (firstCell === 'TOTAL MATERIAL AND SUBMATERIALS COST' && row[3]) {
            result.totalMaterialCost = String(row[3] || '');
        }
        if (firstCell === 'TOTAL FACTORY COST' && row[3]) {
            result.totalFactoryCost = String(row[3] || '');
        }
    }

    /**
     * Validate if file is supported format
     */
    isSupportedFile(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        return this.supportedFormats.some(format => fileName.toLowerCase().endsWith(format));
    }

    /**
     * Get file type for processing
     */
    getFileType(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        return extension === 'csv' ? 'csv' : 'excel';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TNFBallCapsImporter;
} else {
    window.TNFBallCapsImporter = TNFBallCapsImporter;
}
