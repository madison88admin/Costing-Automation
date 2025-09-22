/**
 * TNF Beanie Cost Breakdown Excel Import Parser
 * Handles parsing of TNF Excel files for beanie products
 */

class TNFBeanieImporter {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls', '.xlsm'];
    }

    /**
     * Parse TNF Excel data into structured format - DIRECT MAPPING APPROACH
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

        console.log('Processing TNF Beanie Excel data with', data.length, 'rows');
        console.log('=== USING DIRECT MAPPING APPROACH ===');
        console.log('First 10 rows of raw data:', data.slice(0, 10));
        console.log('All rows of raw data:', data);
        console.log('Found', images.length, 'embedded images');
        
        // Check if this is the correct data by looking for VANS
        let hasVANS = false;
        let hasTNF = false;
        for (let i = 0; i < Math.min(20, data.length); i++) {
            const row = data[i];
            if (row) {
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j] || '').trim();
                    if (cell.includes('VANS')) hasVANS = true;
                    if (cell.includes('TNF')) hasTNF = true;
                }
            }
        }
        console.log('🔍 Data contains VANS:', hasVANS);
        console.log('🔍 Data contains TNF:', hasTNF);

        const result = {
            customer: "",
            season: "", 
            styleNumber: "",
            styleName: "",
            costedQuantity: "",
            leadtime: "",
            
            yarn: [],
            fabric: [],
            trim: [],
            knitting: [],
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
                            console.log('🔍 Row with Customer info:', row);
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
                }
            }

            // FLEXIBLE COST DATA PARSING - Search through all rows
            let currentSection = '';
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Detect sections
                if (firstCell === 'YARN') {
                    currentSection = 'yarn';
                    console.log('🔍 Found YARN section');
                } else if (firstCell === 'FABRIC') {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section');
                } else if (firstCell === 'TRIM') {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section');
                } else if (firstCell === 'KNITTING') {
                    currentSection = 'knitting';
                    console.log('🔍 Found KNITTING section');
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
                } else if (firstCell === 'Knitting' && row[1] === 'Knit Cost (Per Min)') {
                    currentSection = 'finished'; // Stop at reference table
                    console.log('🔍 Found reference table - stopping parsing');
                } else if (firstCell === 'Operations Cost (Reference)') {
                    currentSection = 'finished'; // Stop at reference table
                    console.log('🔍 Found Operations reference table - stopping parsing');
                }
                
                // Skip parsing if we're in finished section
                if (currentSection === 'finished') continue;
                
                // Debug: Log what we're processing in each section
                if (currentSection && firstCell && !firstCell.includes('YARN') && !firstCell.includes('FABRIC') && !firstCell.includes('TRIM') && !firstCell.includes('KNITTING') && !firstCell.includes('OPERATIONS') && !firstCell.includes('PACKAGING') && !firstCell.includes('OVERHEAD') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Processing in ${currentSection}: "${firstCell}" - Row data:`, row);
                }
                
                // Parse data based on section
                if (currentSection === 'yarn' && firstCell && !firstCell.includes('YARN') && !firstCell.includes('CONSUMPTION') && !firstCell.includes('MATERIAL') && !firstCell.includes('TOTAL') && row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.yarn.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ YARN:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                
                if (currentSection === 'fabric' && firstCell && !firstCell.includes('FABRIC') && !firstCell.includes('CONSUMPTION') && !firstCell.includes('MATERIAL') && row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0) {
                    result.fabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ FABRIC:', firstCell, 'Consumption:', row[1], 'Price:', row[2], 'Cost:', row[3]);
                }
                
                if (currentSection === 'trim' && firstCell && !firstCell.includes('TRIM') && !firstCell.includes('CONSUMPTION') && !firstCell.includes('MATERIAL') && row[3] && !isNaN(parseFloat(row[3]))) {
                    result.trim.push({
                        material: firstCell,
                        consumption: String(row[1] || ''),
                        price: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ TRIM:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'knitting' && firstCell && !firstCell.includes('KNITTING') && !firstCell.includes('TIME') && !firstCell.includes('SAH') && row[3] && !isNaN(parseFloat(row[3]))) {
                    result.knitting.push({
                        machine: firstCell,
                        time: String(row[1] || ''),
                        sah: parseFloat(row[2] || 0).toFixed(2),
                        cost: parseFloat(row[3]).toFixed(2)
                    });
                    console.log('✅ KNITTING:', firstCell, 'Cost:', row[3]);
                }
                
                if (currentSection === 'operations' && firstCell && !firstCell.includes('OPERATIONS') && !firstCell.includes('TIME') && !firstCell.includes('COST') && !firstCell.includes('SUB TOTAL') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OPERATIONS: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    if (row[3] && !isNaN(parseFloat(row[3]))) {
                        result.operations.push({
                            operation: firstCell,
                            time: String(row[1] || ''),
                            cost: parseFloat(row[3] || 0).toFixed(2),
                            total: parseFloat(row[3] || 0).toFixed(2)
                        });
                        console.log('✅ OPERATION:', firstCell, 'Time:', row[1], 'Cost:', row[3]);
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
            console.error('Error in direct mapping:', error);
        }

        console.log('=== FINAL RESULT ===');
        console.log('Customer:', result.customer);
        console.log('Season:', result.season);
        console.log('Style#:', result.styleNumber);
        console.log('Style Name:', result.styleName);
        console.log('YARN items:', result.yarn.length, result.yarn);
        console.log('FABRIC items:', result.fabric.length, result.fabric);
        console.log('TRIM items:', result.trim.length, result.trim);
        console.log('TRIM data details:', JSON.stringify(result.trim, null, 2));
        console.log('KNITTING items:', result.knitting.length, result.knitting);
        console.log('OPERATIONS items:', result.operations.length, result.operations);
        console.log('PACKAGING items:', result.packaging.length, result.packaging);
        console.log('OVERHEAD items:', result.overhead.length, result.overhead);
        console.log('Material Total:', result.totalMaterialCost);
        console.log('Factory Total:', result.totalFactoryCost);
        console.log('=== END RESULT ===');
        
        return result;
    }

    /**
     * Extract basic product information from specific rows and columns
     */
    extractBasicInfo(result, row, rowIndex) {
        // Based on debug output, customer/product info is in columns 4-5
        if (row[4] && row[5]) {
            const label = String(row[4] || '').trim();
            const value = String(row[5] || '').trim();
            
            console.log(`Row ${rowIndex}: "${label}" = "${value}"`);
            
            if (label.includes('Customer')) {
                result.customer = value;
                console.log(`✅ Found Customer: ${value}`);
            } else if (label.includes('Season')) {
                result.season = value;
                console.log(`✅ Found Season: ${value}`);
            } else if (label.includes('Style#') || label.includes('Style:')) {
                result.styleNumber = value;
                console.log(`✅ Found Style#: ${value}`);
            } else if (label.includes('Style Name')) {
                result.styleName = value;
                console.log(`✅ Found Style Name: ${value}`);
            } else if (label.includes('Costed Quantity')) {
                result.costedQuantity = value;
                console.log(`✅ Found Quantity: ${value}`);
            } else if (label.includes('Leadtime')) {
                result.leadtime = value;
                console.log(`✅ Found Leadtime: ${value}`);
            }
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
            'YARN': 'yarn',
            'FABRIC': 'fabric',
            'TRIM': 'trim',
            'KNITTING': 'knitting',
            'OPERATIONS': 'operations',
            'PACKAGING': 'packaging',
            'OVERHEAD/ PROFIT': 'overhead'
        };

        return sectionMap[firstCell] || currentSection;
    }

    /**
     * Parse data for specific sections based on actual TNF format
     */
    parseSectionData(result, section, row, firstCell, rowIndex) {
        let materialCost = 0;
        let factoryCost = 0;

        switch (section) {
            case 'yarn':
                // TNF YARN format: Material, Consumption (G), Material Price (USD/KG), Material Cost
                if (this.hasYarnData(row)) {
                    result.yarn.push({
                        material: firstCell,
                        consumption: String(row[1] || ''), // Consumption (G)
                        price: parseFloat(row[2] || 0).toFixed(2),       // Material Price (USD/KG)
                        cost: parseFloat(row[3] || 0).toFixed(2)         // Material Cost
                    });
                    materialCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed YARN: ${firstCell}, Cost: ${row[3]}`);
                }
                break;

            case 'fabric':
                // TNF FABRIC format: Material, Consumption (YARDS), Material Price (USD/YD), Material Cost
                if (this.hasFabricData(row)) {
                    result.fabric.push({
                        material: firstCell,
                        consumption: String(row[1] || ''), // Consumption (YARDS)
                        price: parseFloat(row[2] || 0).toFixed(2),       // Material Price (USD/YD)
                        cost: parseFloat(row[3] || 0).toFixed(2)         // Material Cost
                    });
                    materialCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed FABRIC: ${firstCell}, Cost: ${row[3]}`);
                }
                break;

            case 'trim':
                // TNF TRIM format: Material, Consumption (PIECE), Material Price (USD/PC), Material Cost
                if (this.hasTrimData(row)) {
                    result.trim.push({
                        material: firstCell,
                        consumption: String(row[1] || ''), // Consumption (PIECE)
                        price: parseFloat(row[2] || 0).toFixed(2),       // Material Price (USD/PC)
                        cost: parseFloat(row[3] || 0).toFixed(2)         // Material Cost
                    });
                    materialCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed TRIM: ${firstCell}, Cost: ${row[3]}`);
                }
                break;

            case 'knitting':
                // TNF KNITTING format: Machine, Knitting Time (Mins), Knitting SAH (USD/Min), Knitting Cost
                if (this.hasKnittingData(row)) {
                    result.knitting.push({
                        machine: firstCell,                // Machine
                        time: String(row[1] || ''),        // Knitting Time (Mins)
                        sah: parseFloat(row[2] || 0).toFixed(2),         // Knitting SAH (USD/Min)
                        cost: parseFloat(row[3] || 0).toFixed(2)         // Knitting Cost
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed KNITTING: ${firstCell}, Cost: ${row[3]}`);
                }
                break;

            case 'operations':
                // TNF OPERATIONS format: Operation, Operation Time (Mins), Operation Cost (USD/Min), Operation Cost
                if (this.hasOperationsData(row)) {
                    result.operations.push({
                        operation: firstCell,              // Operation
                        time: String(row[1] || ''),        // Operation Time (Mins)
                        cost: parseFloat(row[3] || 0).toFixed(2),        // Operation Cost (USD/Min)
                        total: parseFloat(row[3] || 0).toFixed(2)        // Operation Cost (Total)
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed OPERATIONS: ${firstCell}, Cost: ${row[3]}`);
                }
                break;

            case 'packaging':
                // TNF PACKAGING format: Packaging Type, Factory Notes, Cost (in column 3)
                if (this.hasPackagingData(row)) {
                    result.packaging.push({
                        type: firstCell,                   // Packaging Type
                        notes: String(row[1] || ''),       // Factory Notes
                        cost: parseFloat(row[3] || 0).toFixed(2)         // Cost (column 3)
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed PACKAGING: ${firstCell}, Cost: ${row[3]}`);
                }
                break;

            case 'overhead':
                // TNF OVERHEAD/PROFIT format: Type, Factory Notes, Cost (in column 3)
                if (this.hasOverheadData(row)) {
                    result.overhead.push({
                        type: firstCell,                   // Type (OVERHEAD/PROFIT)
                        notes: String(row[1] || ''),       // Factory Notes
                        cost: parseFloat(row[3] || 0).toFixed(2)         // Cost (column 3)
                    });
                    factoryCost = parseFloat(row[3]) || 0;
                    console.log(`Parsed OVERHEAD: ${firstCell}, Cost: ${row[3]}`);
                }
                break;
        }

        return { material: materialCost, factory: factoryCost };
    }

    /**
     * Validation methods for each section - more flexible for TNF format
     */
    hasYarnData(row) {
        // YARN needs: material name, consumption, price, and cost
        const hasMaterial = row[0] && String(row[0]).trim() && !String(row[0]).includes('YARN');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0;
        return hasMaterial && hasCost;
    }

    hasFabricData(row) {
        // FABRIC needs: material name and cost
        const hasMaterial = row[0] && String(row[0]).trim() && !String(row[0]).includes('FABRIC');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0;
        return hasMaterial && hasCost;
    }

    hasTrimData(row) {
        // TRIM needs: material name and cost
        const hasMaterial = row[0] && String(row[0]).trim() && !String(row[0]).includes('TRIM');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0;
        return hasMaterial && hasCost;
    }

    hasKnittingData(row) {
        // KNITTING needs: machine name, time, SAH, and cost
        const hasMachine = row[0] && String(row[0]).trim() && !String(row[0]).includes('KNITTING');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) > 0;
        return hasMachine && hasCost;
    }

    hasOperationsData(row) {
        // OPERATIONS needs: operation name and cost (allow 0 cost)
        const hasOperation = row[0] && String(row[0]).trim() && !String(row[0]).includes('OPERATIONS');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) >= 0;
        console.log(`Checking OPERATIONS: "${row[0]}" cost: ${row[3]} - hasOp: ${hasOperation}, hasCost: ${hasCost}`);
        return hasOperation && hasCost;
    }

    hasPackagingData(row) {
        // PACKAGING needs: type and cost (cost in column 3 for TNF format)
        const hasType = row[0] && String(row[0]).trim() && !String(row[0]).includes('PACKAGING');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])) && parseFloat(row[3]) >= 0; // Allow 0 cost
        console.log(`Checking PACKAGING: "${row[0]}" cost: ${row[3]} - hasType: ${hasType}, hasCost: ${hasCost}`);
        return hasType && hasCost;
    }

    hasOverheadData(row) {
        // OVERHEAD needs: type and cost (cost in column 3 for TNF format)
        const hasType = row[0] && String(row[0]).trim() && !String(row[0]).includes('OVERHEAD');
        const hasCost = row[3] && !isNaN(parseFloat(row[3])); // Allow negative costs for profit reduction
        console.log(`Checking OVERHEAD: "${row[0]}" cost: ${row[3]} - hasType: ${hasType}, hasCost: ${hasCost}`);
        return hasType && hasCost;
    }

    /**
     * Extract total costs from specific rows - based on actual structure
     */
    extractTotals(result, firstCell, row) {
        // Based on debug output:
        // Row 17: "TOTAL MATERIAL AND SUBMATERIALS COST" with cost in column 3
        if (firstCell.includes('TOTAL MATERIAL') && row[3]) {
            result.totalMaterialCost = parseFloat(row[3]).toFixed(2);
            console.log(`Found Material Total: ${result.totalMaterialCost}`);
        }
        
        // Row 42: "TOTAL FACTORY COST" with cost in column 3
        if (firstCell.includes('TOTAL FACTORY') && row[3]) {
            result.totalFactoryCost = parseFloat(row[3]).toFixed(2);
            console.log(`Found Factory Total: ${result.totalFactoryCost}`);
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

// Debug function for testing
if (typeof window !== 'undefined') {
    window.debugTNFImport = function(excelData) {
        console.log('=== DEBUGGING TNF IMPORT ===');
        console.log('Raw Excel Data:', excelData);
        
        const importer = new TNFBeanieImporter();
        const result = importer.parseExcelData(excelData);
        
        console.log('Parsed Result:', result);
        return result;
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TNFBeanieImporter;
} else {
    window.TNFBeanieImporter = TNFBeanieImporter;
}
