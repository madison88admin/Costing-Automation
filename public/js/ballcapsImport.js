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
                    console.log('🔍 Found OPERATIONS section - switching to operations parsing');
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
                    if (currentSection === 'operations') {
                        console.log(`🔍 Operations row data:`, row);
                        console.log(`🔍 Has operations data:`, this.hasOperationsData(row));
                    }
                }
                
                // Debug: Log all section detections
                if (firstCell && (firstCell.includes('OPERATION') || firstCell.includes('SMV') || firstCell.includes('COST'))) {
                    console.log(`🔍 Potential operations row ${i}:`, firstCell, '|', row[1], '|', row[2], '|', row[3]);
                }
                
                // Detect header rows and set current section based on context
                if (firstCell.includes('(Name/Code/Description)Description') && row[1] && row[1].includes('CONSUMPTION')) {
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
                
                // Fallback operations detection - look for rows with SMV and cost data
                // This runs for ALL rows, not just when no section is detected
                if (firstCell && firstCell.trim() !== '' && 
                    !firstCell.includes('FABRIC') && !firstCell.includes('TRIM') && 
                    !firstCell.includes('PACKAGING') && !firstCell.includes('OVERHEAD') &&
                    !firstCell.includes('TOTAL') && !firstCell.includes('SUB TOTAL') &&
                    !firstCell.includes('YARN') && !firstCell.includes('KNITTING') &&
                    !firstCell.includes('OPERATIONS') && !firstCell.includes('SMV') &&
                    !firstCell.includes('COST') && !firstCell.includes('USD')) {
                    
                    // Check if this row has operations-like data (SMV in col 2, cost in col 3)
                    if (row[2] && !isNaN(parseFloat(row[2])) && row[3] && !isNaN(parseFloat(row[3]))) {
                        console.log(`🔍 Fallback operations detection - Row ${i}:`, firstCell, '|', row[1], '|', row[2], '|', row[3]);
                        
                        let smv = String(row[2] || '');
                        let costPerMin = String(row[3] || '');
                        let total = '';
                        
                        // Calculate total: SMV * COST (USD/MIN)
                        if (smv && costPerMin && !isNaN(parseFloat(smv)) && !isNaN(parseFloat(costPerMin))) {
                            total = (parseFloat(smv) * parseFloat(costPerMin)).toFixed(2);
                        }
                        
                        const operationData = {
                            operation: `Operation ${result.operations.length + 1}`,
                            smv: smv,
                            costPerMin: costPerMin,
                            total: total
                        };
                        
                        console.log('🔍 Adding fallback operation:', operationData);
                        result.operations.push(operationData);
                    }
                }
                
                if (currentSection === 'packaging' && firstCell && !firstCell.includes('PACKAGING') && !firstCell.includes('Factory Notes') && !firstCell.includes('TOTAL')) {
                    if (row[3] !== undefined && !isNaN(parseFloat(row[3]))) {
                        result.packaging.push({
                            type: firstCell,
                            notes: String(row[1] || ''),
                            cost: parseFloat(row[3]).toFixed(2)
                        });
                        console.log('✅ PACKAGING:', firstCell, 'Cost:', row[3]);
                    }
                }
                
                if (currentSection === 'overhead' && firstCell && !firstCell.includes('OVERHEAD/ PROFIT') && !firstCell.includes('Factory Notes') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OVERHEAD: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    if (row[3] !== undefined && !isNaN(parseFloat(row[3]))) {
                        result.overhead.push({
                            type: firstCell,
                            notes: String(row[1] || ''),
                            cost: parseFloat(row[3]).toFixed(2)
                        });
                        console.log('✅ OVERHEAD:', firstCell, 'Notes:', row[1], 'Cost:', row[3]);
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

        // Extract Notes section - look for rows that contain notes information
        console.log('🔍 Extracting Notes section...');
        let notesContent = [];
        let inNotesSection = false;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const firstCell = String(row[0] || '').trim();
            const allRowContent = row.filter(cell => cell && String(cell).trim() !== '').join(' ');
            
            // Look for Notes section header
            if ((firstCell.toLowerCase() === 'notes' || firstCell.toLowerCase() === 'note') ||
                (allRowContent.toLowerCase() === 'notes' || allRowContent.toLowerCase() === 'note')) {
                inNotesSection = true;
                console.log('✅ Found Notes section header at row', i, ':', firstCell);
                continue;
            }
            
            // If we're in notes section, collect content
            if (inNotesSection) {
                // Stop if we hit another major section
                if (firstCell.includes('FABRIC') || firstCell.includes('TRIM') || 
                    firstCell.includes('OPERATIONS') || firstCell.includes('PACKAGING') || 
                    firstCell.includes('OVERHEAD') || firstCell.includes('TOTAL') || 
                    firstCell.includes('SUBTOTAL')) {
                    console.log('🛑 Stopping notes extraction at row', i, 'due to section:', firstCell);
                    break;
                }
                
                // Collect non-empty content
                if (allRowContent.trim()) {
                    notesContent.push(allRowContent.trim());
                    console.log('📝 Added to notes:', allRowContent.trim());
                }
            }
        }
        
        // Join all notes content
        if (notesContent.length > 0) {
            result.notes = notesContent.join('\n');
            console.log('✅ Notes extracted (', notesContent.length, 'lines):', result.notes.substring(0, 200) + '...');
        } else {
            console.log('⚠️ No notes section found');
        }

        console.log('=== FINAL RESULT ===');
        console.log('Customer:', result.customer);
        console.log('Season:', result.season);
        console.log('Style#:', result.styleNumber);
        console.log('Style Name:', result.styleName);
        console.log('Notes:', result.notes ? result.notes.substring(0, 100) + '...' : 'None');
        console.log('FABRIC items:', result.fabric.length, result.fabric);
        console.log('EMBROIDERY items:', result.embroidery.length, result.embroidery);
        console.log('TRIM items:', result.trim.length, result.trim);
        console.log('OPERATIONS items:', result.operations.length, result.operations);
        console.log('🔍 OPERATIONS DEBUG - Full operations data:', result.operations);
        console.log('PACKAGING items:', result.packaging.length, result.packaging);
        console.log('OVERHEAD items:', result.overhead.length, result.overhead);
        console.log('Material Total:', result.totalMaterialCost);
        console.log('Factory Total:', result.totalFactoryCost);
        console.log('=== END RESULT ===');

        console.log('Parsed TNF Ball Caps data:', result);
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
                    console.log('🔍 Processing operations row:', row);
                    // Updated to match new header structure: OPERATION | BLANK | SMV | COST (USD/MIN)
                    let smv = String(row[2] || '');
                    let costPerMin = String(row[3] || '');
                    let total = '';
                    
                    console.log('🔍 Operations data - SMV:', smv, 'CostPerMin:', costPerMin);
                    
                    // Calculate total: SMV * COST (USD/MIN)
                    if (smv && costPerMin && !isNaN(parseFloat(smv)) && !isNaN(parseFloat(costPerMin))) {
                        total = (parseFloat(smv) * parseFloat(costPerMin)).toFixed(2);
                        console.log('🔍 Calculated total:', total);
                    }
                    
                    const operationData = {
                        operation: `Operation ${result.operations.length + 1}`,
                        smv: smv,
                        costPerMin: costPerMin,
                        total: total
                    };
                    
                    console.log('🔍 Adding operation:', operationData);
                    result.operations.push(operationData);
                    factoryCost = parseFloat(total) || 0;
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
        return row[1] && row[2] && row[3] && !isNaN(parseFloat(row[3]));
    }

    hasTrimData(row) {
        return row[3] && !isNaN(parseFloat(row[3]));
    }

    hasEmbroideryData(row) {
        return row[1] && row[2] && row[3] && !isNaN(parseFloat(row[3]));
    }

    hasOperationsData(row) {
        // Check for SMV in column 2 and COST in column 3
        const hasSMV = row[2] && !isNaN(parseFloat(row[2]));
        const hasCost = row[3] && !isNaN(parseFloat(row[3]));
        const result = hasSMV || hasCost;
        
        if (result) {
            console.log('🔍 Found operations data in row:', row, 'SMV:', hasSMV, 'Cost:', hasCost);
        }
        
        return result;
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
