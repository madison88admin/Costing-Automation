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
            notes: "", // Added notes field
            
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

            // Extract Notes section - look for rows that contain notes information
            console.log('🔍 Extracting Notes section for BallCaps...');
            let notesContent = [];
            let inNotesSection = false;

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                const firstCell = String(row[0] || '').trim();
                const allRowContent = row.filter(cell => cell && String(cell).trim() !== '').join(' ');

                // Look for Notes section header - be more flexible
                if ((firstCell.toLowerCase() === 'notes' || firstCell.toLowerCase() === 'note') ||
                    (allRowContent.toLowerCase() === 'notes' || allRowContent.toLowerCase() === 'note') ||
                    firstCell.toLowerCase().includes('note')) {
                    inNotesSection = true;
                    console.log('✅ Found Notes section header at row', i, ':', firstCell);
                    continue;
                }

                // If we're in notes section, collect content
                if (inNotesSection) {
                    // Stop if we hit another major section or cost data
                    if (firstCell.includes('FABRIC') || firstCell.includes('TRIM') || firstCell.includes('EMBROIDERY') ||
                        firstCell.includes('OPERATIONS') || firstCell.includes('PACKAGING') || firstCell.includes('OVERHEAD') ||
                        firstCell.includes('TOTAL') || firstCell.includes('SUBTOTAL') || firstCell.includes('COST') ||
                        allRowContent.includes('$') || allRowContent.includes('USD') || allRowContent.includes('YARD') ||
                        allRowContent.includes('PIECE') || allRowContent.includes('STITCH')) {
                        console.log('🛑 Stopping notes extraction at row', i, 'due to section/cost data:', firstCell || allRowContent);
                        break;
                    }

                    // Collect non-empty content
                    if (allRowContent.trim()) {
                        notesContent.push(allRowContent.trim());
                        console.log('📝 Added to BallCaps notes:', allRowContent.trim());
                    }
                }
            }

            // Enhanced notes detection - look for specific BallCaps notes patterns
            if (notesContent.length === 0) {
                console.log('🔍 Trying enhanced notes detection for BallCaps...');
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    const firstCell = String(row[0] || '').trim();
                    const allRowContent = row.filter(cell => cell && String(cell).trim() !== '').join(' ');

                    // Look for specific BallCaps notes patterns - be more precise
                    if (allRowContent.includes('add fabric surcharge') || 
                        (allRowContent.includes('fabric surcharge') && allRowContent.includes('USD') && allRowContent.includes('MOQ')) ||
                        (allRowContent.includes('suggest to use') && allRowContent.includes('HU available')) ||
                        allRowContent.includes('visor /sweatband-suggest')) {
                        
                        console.log('📝 Found BallCaps notes pattern at row', i, ':', allRowContent);
                        
                        // Clean up the content - remove operations header if present
                        let cleanContent = allRowContent.trim();
                        if (cleanContent.includes('OPERATIONS SMV COST')) {
                            // Remove the entire operations header including (USD/MIN)
                            cleanContent = cleanContent.replace(/^.*?OPERATIONS SMV COST.*?\(USD\/MIN\)\s*/, '');
                        }
                        
                        // Only add if it looks like actual notes, not cost data
                        if (!cleanContent.match(/\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+/) && // Skip cost breakdown lines
                            !cleanContent.includes('Style Name:') && // Skip duplicate style info
                            !cleanContent.includes('MOQ:') && // Skip duplicate MOQ info
                            !cleanContent.includes('Cost:') && // Skip cost entries
                            cleanContent.length > 10) { // Ensure it's substantial content
                            
                            notesContent.push(cleanContent);
                            console.log('✅ Added cleaned notes:', cleanContent);
                        } else {
                            console.log('❌ Rejected notes (filtered out):', cleanContent);
                        }
                    }
                }
            }

            // Alternative notes detection - look for multi-line notes content in single cells
            if (notesContent.length === 0) {
                console.log('🔍 Trying alternative notes detection for BallCaps...');
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    // Check each cell in the row for multi-line notes content
                    for (let j = 0; j < row.length; j++) {
                        const cellContent = String(row[j] || '').trim();

                        // Look for cells that contain multiple notes lines (contains pricing info and product codes)
                        if (cellContent.includes('$') && 
                            (cellContent.includes('MCQ') || cellContent.includes('pcs') || cellContent.includes('surcharge') ||
                             cellContent.includes('HYDD') || cellContent.includes('RWS') || cellContent.includes('% = '))) {

                            console.log('📝 Found multi-line notes content in BallCaps cell:', j, 'of row:', i);
                            console.log('📝 Raw content:', cellContent);

                            // Split the content by newlines and filter out empty lines
                            const lines = cellContent.split('\n').filter(line => line.trim() !== '');

                            // Extract only the actual notes content
                            lines.forEach(line => {
                                const cleanLine = line.trim();
                                // Look for actual notes patterns
                                if (cleanLine.includes('$') || cleanLine.includes('MCQ') ||
                                    cleanLine.includes('surcharge') || cleanLine.includes('HYDD') ||
                                    cleanLine.includes('RWS') || cleanLine.includes('pcs $') ||
                                    cleanLine.includes('% = ') || (cleanLine.includes('kg') && cleanLine.includes('pcs'))) {

                                    notesContent.push(cleanLine);
                                    console.log('📝 Added BallCaps notes line:', cleanLine);
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
                console.log('✅ BallCaps Notes extracted (', notesContent.length, 'lines):', result.notes.substring(0, 200) + '...');
            } else {
                console.log('⚠️ No notes section found for BallCaps');
            }

            // FLEXIBLE COST DATA PARSING - Search through all rows
            let currentSection = '';
            
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                
                // Detect sections
                if (firstCell === 'FABRIC' || firstCell === 'FABRIC/S' || firstCell.includes('FABRIC')) {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section at row', i);
                } else if (firstCell === 'EMBROIDERY' || firstCell === 'OTHER FABRIC/S - TRIM/S' || firstCell.includes('OTHER FABRIC')) {
                    currentSection = 'embroidery';
                    console.log('🔍 Found OTHER FABRIC/S - TRIM/S section at row', i);
                } else if (firstCell === 'TRIM' || firstCell === 'TRIM/S' || firstCell.includes('TRIM')) {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section at row', i);
                } else if (firstCell === 'OPERATIONS' || firstCell.includes('OPERATIONS')) {
                    currentSection = 'operations';
                    console.log('🔍 Found OPERATIONS section at row', i);
                } else if (firstCell === 'PACKAGING' || firstCell.includes('PACKAGING')) {
                    currentSection = 'packaging';
                    console.log('🔍 Found PACKAGING section at row', i);
                } else if (firstCell === 'OVERHEAD/ PROFIT' || firstCell === 'OVERHEAD/PROFIT' || firstCell === 'OVERHEAD' || firstCell.includes('OVERHEAD')) {
                    currentSection = 'overhead';
                    console.log('🔍 Found OVERHEAD section at row', i);
                } else if (firstCell === 'TOTAL FACTORY COST' || firstCell.includes('TOTAL FACTORY')) {
                    console.log('🔍 Found TOTAL FACTORY COST at row', i);
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
                
                if (currentSection === 'operations' && 
                    !firstCell.includes('OPERATIONS') && 
                    !firstCell.includes('SMV') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('SUB TOTAL') && 
                    !firstCell.includes('TOTAL')) {
                    
                    // More flexible operations parsing - look for any row with operation data
                    let smv = '';
                    let cost = '';
                    let total = '';
                    let operationName = firstCell || 'Operation'; // Use first cell if it's not empty
                    
                    // If first cell is empty but we have operation name in column 2, use that
                    if (!firstCell && row[2] && typeof row[2] === 'string' && !row[2].includes('undefined')) {
                        operationName = row[2];
                    }
                    
                    // Try to find SMV in col 1
                    if (row[1] && !isNaN(parseFloat(row[1]))) {
                        smv = parseFloat(row[1]).toFixed(2);
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
                    
                    // If we have operation name or any meaningful data, add the operation
                    if (operationName !== 'Operation' || smv || cost || total) {
                        // Ensure operation name is meaningful - if it's a number, use a default name
                        let finalOperationName = operationName;
                        if (operationName === 'Operation' && (smv || cost || total)) {
                            finalOperationName = `Operation ${result.operations.length + 1}`;
                        }
                        
                        result.operations.push({
                            operation: String(finalOperationName), // Ensure operation is always a string
                            time: smv, // Map smv to time for HTML template compatibility
                            smv: smv, // Keep smv for backwards compatibility
                            cost: cost,
                            total: total || (smv && cost ? (parseFloat(smv) * parseFloat(cost)).toFixed(2) : '')
                        });
                        console.log('✅ OPERATION:', finalOperationName, 'SMV:', smv, 'Cost:', cost, 'Total:', total);
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
                    if (row[2] !== undefined && row[2] !== null && !isNaN(parseFloat(row[2]))) {
                        cost = parseFloat(row[2]).toFixed(2);
                    } else if (row[3] !== undefined && row[3] !== null && !isNaN(parseFloat(row[3]))) {
                        cost = parseFloat(row[3]).toFixed(2);
                    }
                    
                    // Add the packaging item if we found a cost (including 0.00)
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
                    !firstCell.includes('Factory Notes') && 
                    !firstCell.includes('COST') && 
                    !firstCell.includes('TOTAL') && 
                    !firstCell.includes('SUB TOTAL') &&
                    firstCell.trim() !== '') {
                    
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
                    if (cost !== '' && shouldInclude) {
                        result.overhead.push({
                            type: itemType,
                            cost: cost
                        });
                        console.log('✅ OVERHEAD/PROFIT:', itemType, 'Cost:', cost);
                    } else if (cost !== '' && !shouldInclude) {
                        console.log('❌ Excluded from overhead:', firstCell, 'Cost:', cost);
                    } else if (cost === '') {
                        console.log('❌ No cost found for:', firstCell);
                    }
                    
                    // Special debug for OVERHEAD item
                    if (firstCell.toLowerCase() === 'overhead') {
                        console.log('🔍 OVERHEAD DEBUG - Cost:', cost, 'Type:', typeof cost, 'Should include:', shouldInclude, 'Item type:', itemType);
                    }
                }
                
                // Debug: Show all rows with "TOTAL" to find the correct ones
                if (firstCell && firstCell.includes('TOTAL')) {
                    console.log('🔍 Found TOTAL row', i, ':', firstCell, 'value in col 3:', row[3]);
                }
                
                // Extract totals - enhanced pattern matching
                if ((firstCell.includes('TOTAL MATERIAL') || firstCell.includes('TOTAL MATERIAL AND SUBMATERIALS COST')) && row[3]) {
                    result.totalMaterialCost = parseFloat(row[3]).toFixed(2);
                    console.log('✅ Material Total:', result.totalMaterialCost, 'from row', i, 'cell:', firstCell);
                }
                if (firstCell.includes('TOTAL FACTORY') && row[3]) {
                    result.totalFactoryCost = parseFloat(row[3]).toFixed(2);
                    console.log('✅ Factory Total:', result.totalFactoryCost, 'from row', i, 'cell:', firstCell);
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
        console.log('Notes:', result.notes ? result.notes.substring(0, 100) + '...' : 'None');
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