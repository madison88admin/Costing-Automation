// Cap Template Import Logic
// This file contains all the logic for importing and processing cap template data

// Make functions available globally
window.capImport = {};

// Extract factory cost data from parsed Excel data for Cap template
window.capImport.extractFactoryCostData = function(jsonData, template = null) {
    console.log('Starting data extraction from:', jsonData);
    console.log('Template parameter:', template);
    
    if (!jsonData || jsonData.length === 0) {
        console.log('No data to extract');
        return window.capImport.createEmptyData();
    }
    
    // Use selected template if provided, otherwise auto-detect
    let templateType;
    if (template && (template === 'beanie' || template === 'cap')) {
        templateType = template;
        console.log('Using selected template:', templateType);
    } else {
        templateType = window.capImport.detectTemplateType(jsonData);
        console.log('Auto-detected template type:', templateType);
    }
    console.log('Selected template button was:', template);
    
    // Extract data based on template type
    let extractedData;
    if (templateType === 'beanie') {
        extractedData = window.beanieImport ? window.beanieImport.extractBeanieTemplateData(jsonData) : window.capImport.createEmptyData();
    } else if (templateType === 'cap') {
        extractedData = window.capImport.extractCapTemplateData(jsonData);
    } else {
        extractedData = window.importUtils ? window.importUtils.extractGenericData(jsonData) : window.capImport.createEmptyData();
    }
    
    console.log('Final extracted data:', extractedData);
    return extractedData;
}

// Detect template type from content
window.capImport.detectTemplateType = function(jsonData) {
    const allText = jsonData.flat().join(' ').toLowerCase();
    console.log('Analyzing content for template detection:', allText.substring(0, 200) + '...');
    
    // Check for beanie template indicators
    if (allText.includes('yarn') && allText.includes('knitting') && 
        (allText.includes('beanie') || allText.includes('hat') || allText.includes('glove') || 
         allText.includes('fuzzy wool') || allText.includes('tnf') || allText.includes('consumption (g)'))) {
        console.log('Detected beanie template based on content');
        return 'beanie';
    }
    
    // Check for cap template indicators
    if (allText.includes('fabric') && allText.includes('trim') && 
        (allText.includes('cap') || allText.includes('hat') || allText.includes('brim') || 
         allText.includes('rossignol') || allText.includes('consumption (yard)'))) {
        console.log('Detected cap template based on content');
        return 'cap';
    }
    
    // Check for specific section headers
    if (allText.includes('yarn') && allText.includes('knitting time')) {
        console.log('Detected beanie template based on section headers');
        return 'beanie';
    }
    
    if (allText.includes('fabric/s') && allText.includes('other fabric/s')) {
        console.log('Detected cap template based on section headers');
        return 'cap';
    }
    
    // Default to cap if no clear indicators
    console.log('No clear template indicators found, defaulting to cap');
    return 'cap';
}

// Extract cap template data from Excel format
window.capImport.extractCapTemplateData = function(jsonData) {
    console.log('Extracting cap template data from Excel format');
    console.log('Raw data sample:', jsonData.slice(0, 10));
    
    const extractedData = {
        customer: '',
        season: '',
        styleNumber: '',
        styleName: '',
        costedQuantity: '',
        leadtime: '',
        yarn: [],
        fabric: [],
        trim: [],
        knitting: [],
        operations: [],
        packaging: [],
        totals: {
            materialCost: '0.00',
            knittingCost: '0.00',
            operationsCost: '0.00',
            packagingCost: '0.00',
            overhead: '0.00',
            profit: '0.00',
            totalFactoryCost: '0.00'
        }
    };
    
    // Look for header information in the top area
    console.log('🔍 Looking for header information in first 20 rows...');
    for (let i = 0; i < Math.min(20, jsonData.length); i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        console.log(`Row ${i}:`, row);
        
        for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (typeof cell === 'string') {
                const cellLower = cell.toLowerCase().trim();
                
                // Extract basic info - look for labels and values in the same row or next cell
                if (cellLower.includes('customer')) {
                    const nextCell = row[j + 1];
                    if (nextCell && typeof nextCell === 'string' && nextCell.trim() !== '') {
                        extractedData.customer = nextCell.trim();
                        console.log('✅ Found customer:', nextCell.trim());
                    }
                } else if (cellLower.includes('season')) {
                    const nextCell = row[j + 1];
                    if (nextCell && typeof nextCell === 'string' && nextCell.trim() !== '') {
                        extractedData.season = nextCell.trim();
                        console.log('✅ Found season:', nextCell.trim());
                    }
                } else if (cellLower.includes('style#') || cellLower.includes('style no')) {
                    const nextCell = row[j + 1];
                    if (nextCell && typeof nextCell === 'string' && nextCell.trim() !== '') {
                        extractedData.styleNumber = nextCell.trim();
                        console.log('✅ Found style number:', nextCell.trim());
                    }
                } else if (cellLower.includes('style name')) {
                    const nextCell = row[j + 1];
                    if (nextCell && typeof nextCell === 'string' && nextCell.trim() !== '') {
                        extractedData.styleName = nextCell.trim();
                        console.log('✅ Found style name:', nextCell.trim());
                    }
                } else if (cellLower.includes('costed quantity') || cellLower.includes('quantity')) {
                    const nextCell = row[j + 1];
                    if (nextCell && typeof nextCell === 'string' && nextCell.trim() !== '') {
                        extractedData.costedQuantity = nextCell.trim();
                        console.log('✅ Found quantity:', nextCell.trim());
                    }
                } else if (cellLower.includes('leadtime') || cellLower.includes('lead time')) {
                    const nextCell = row[j + 1];
                    if (nextCell && typeof nextCell === 'string' && nextCell.trim() !== '') {
                        extractedData.leadtime = nextCell.trim();
                        console.log('✅ Found leadtime:', nextCell.trim());
                    }
                }
            }
        }
    }
    
    console.log('📊 Header extraction results:', {
        customer: extractedData.customer,
        season: extractedData.season,
        styleNumber: extractedData.styleNumber,
        styleName: extractedData.styleName,
        costedQuantity: extractedData.costedQuantity,
        leadtime: extractedData.leadtime
    });
    
    // Extract fabric materials
    window.capImport.extractFabricMaterials(jsonData, extractedData);
    
    // Extract other fabric/trim materials
    window.capImport.extractOtherFabricMaterials(jsonData, extractedData);
    
    // Extract trim materials
    window.capImport.extractTrimMaterials(jsonData, extractedData);
    
    // Extract operations
    window.capImport.extractOperations(jsonData, extractedData);
    
    // Extract packaging
    window.capImport.extractPackaging(jsonData, extractedData);
    
    // Extract overhead and profit
    window.capImport.extractOverheadProfit(jsonData, extractedData);
    
    // Calculate totals
    window.capImport.calculateCapTotals(extractedData);
    
    console.log('Cap extraction result:', extractedData);
    return extractedData;
}

// Helper functions for cap extraction
window.capImport.extractFabricMaterials = function(jsonData, extractedData) {
    console.log('🔍 Looking for fabric materials...');
    // Look for fabric sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('fabric') && (rowText.includes('consumption') || rowText.includes('yard'))) {
            console.log('✅ Found fabric section at row', i, ':', row);
            // Found fabric section header
            for (let j = i + 1; j < Math.min(i + 15, jsonData.length); j++) {
                const fabricRow = jsonData[j];
                if (!Array.isArray(fabricRow)) continue;
                
                console.log(`Checking fabric row ${j}:`, fabricRow);
                
                // Look for fabric data rows
                if (fabricRow.length >= 4 && fabricRow[0] && fabricRow[0] !== '') {
                    const description = fabricRow[0] ? fabricRow[0].toString().trim() : '';
                    const consumption = fabricRow[1] ? fabricRow[1].toString().trim() : '';
                    const price = fabricRow[2] ? fabricRow[2].toString().trim() : '';
                    const cost = fabricRow[3] ? fabricRow[3].toString().trim() : '';
                    
                    console.log('Fabric row data:', { description, consumption, price, cost });
                    
                    // Check if this looks like a fabric material row - be more inclusive
                    if (description && description !== '0' && description !== '0.00' && 
                        (description.includes('Cotton') || description.includes('Twill') ||
                         description.includes('polyester') || description.includes('trucker') ||
                         description.includes('mesh') || description.includes('BCI') ||
                         description.includes('412N') || description.includes('289N') ||
                         description.includes('recycled') || description.includes('YARD') ||
                         description.includes('panel') || description.includes('button') ||
                         description.includes('brim') || description.includes('sweatband') ||
                         description.includes('AW0419') || description.includes('trucker') ||
                         description.length > 5)) {
                        console.log('✅ Adding fabric material:', { description, consumption, price, cost });
                        extractedData.fabric.push({
                            description: description,
                            consumption: consumption,
                            price: price,
                            cost: cost
                        });
                    }
                } else if (fabricRow.join('').trim() === '' || fabricRow[0] === '') {
                    // Empty row, end of fabric section
                    console.log('End of fabric section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Fabric extraction results:', extractedData.fabric);
}

window.capImport.extractOtherFabricMaterials = function(jsonData, extractedData) {
    console.log('🔍 Looking for other fabric/trim materials...');
    // Look for other fabric/trim sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('other fabric') && rowText.includes('trim')) {
            console.log('✅ Found other fabric/trim section at row', i, ':', row);
            // Found other fabric/trim section header
            for (let j = i + 1; j < Math.min(i + 15, jsonData.length); j++) {
                const otherFabricRow = jsonData[j];
                if (!Array.isArray(otherFabricRow)) continue;
                
                console.log(`Checking other fabric row ${j}:`, otherFabricRow);
                
                // Look for other fabric data rows
                if (otherFabricRow.length >= 4 && otherFabricRow[0] && otherFabricRow[0] !== '') {
                    const description = otherFabricRow[0] ? otherFabricRow[0].toString().trim() : '';
                    const consumption = otherFabricRow[1] ? otherFabricRow[1].toString().trim() : '';
                    const price = otherFabricRow[2] ? otherFabricRow[2].toString().trim() : '';
                    const cost = otherFabricRow[3] ? otherFabricRow[3].toString().trim() : '';
                    
                    console.log('Other fabric row data:', { description, consumption, price, cost });
                    
                    // Check if this looks like an other fabric material row
                    if (description && description !== '0' && description !== '0.00' && 
                        (description.includes('seam tape') || description.includes('sandwich') ||
                         description.includes('padding') || description.includes('sweatband') ||
                         description.includes('interlining') || description.includes('buckram') ||
                         description.includes('polyester') || description.includes('resin') ||
                         description.includes('089N') || description.includes('102N') ||
                         description.length > 10)) {
                        console.log('✅ Adding other fabric material:', { description, consumption, price, cost });
                        extractedData.fabric.push({
                            description: description,
                            consumption: consumption,
                            price: price,
                            cost: cost
                        });
                    }
                } else if (otherFabricRow.join('').trim() === '' || otherFabricRow[0] === '') {
                    // Empty row, end of other fabric section
                    console.log('End of other fabric section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Other fabric extraction results:', extractedData.fabric);
}

window.capImport.extractTrimMaterials = function(jsonData, extractedData) {
    console.log('🔍 Looking for trim materials...');
    // Look for trim sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('trim') && rowText.includes('piece')) {
            console.log('✅ Found trim section at row', i, ':', row);
            // Found trim section header
            for (let j = i + 1; j < Math.min(i + 15, jsonData.length); j++) {
                const trimRow = jsonData[j];
                if (!Array.isArray(trimRow)) continue;
                
                console.log(`Checking trim row ${j}:`, trimRow);
                
                // Look for trim data rows
                if (trimRow.length >= 4 && trimRow[0] && trimRow[0] !== '') {
                    const description = trimRow[0] ? trimRow[0].toString().trim() : '';
                    const consumption = trimRow[1] ? trimRow[1].toString().trim() : '';
                    const price = trimRow[2] ? trimRow[2].toString().trim() : '';
                    const cost = trimRow[3] ? trimRow[3].toString().trim() : '';
                    
                    console.log('Trim row data:', { description, consumption, price, cost });
                    
                    // Check if this looks like a trim material row
                    if (description && description !== '0' && description !== '0.00' && 
                        (description.includes('plastic board') || description.includes('button') ||
                         description.includes('snap') || description.includes('patch') ||
                         description.includes('label') || description.includes('strap') ||
                         description.includes('provided') || description.includes('M88') ||
                         description.includes('nominated') || description.includes('woven') ||
                         description.length > 5)) {
                        console.log('✅ Adding trim material:', { description, consumption, price, cost });
                        extractedData.trim.push({
                            description: description,
                            consumption: consumption,
                            price: price,
                            cost: cost
                        });
                    }
                } else if (trimRow.join('').trim() === '' || trimRow[0] === '') {
                    // Empty row, end of trim section
                    console.log('End of trim section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Trim extraction results:', extractedData.trim);
}

window.capImport.extractOperations = function(jsonData, extractedData) {
    console.log('🔍 Looking for operations...');
    // Look for operations sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('operations') && (rowText.includes('smv') || rowText.includes('cost'))) {
            console.log('✅ Found operations section at row', i, ':', row);
            // Found operations section header
            for (let j = i + 1; j < Math.min(i + 20, jsonData.length); j++) {
                const operationRow = jsonData[j];
                if (!Array.isArray(operationRow)) continue;
                
                console.log(`Checking operation row ${j}:`, operationRow);
                
                // Look for operation data rows
                if (operationRow.length >= 3 && operationRow[0] && operationRow[0] !== '') {
                    const description = operationRow[0] ? operationRow[0].toString().trim() : '';
                    const smv = operationRow[1] ? operationRow[1].toString().trim() : '';
                    const cost = operationRow[2] ? operationRow[2].toString().trim() : '';
                    
                    console.log('Operation row data:', { description, smv, cost });
                    
                    // Check if this looks like an operation row - be more inclusive
                    if (description && description !== '0' && description !== '0.00' && 
                        description !== '#REF!' && description !== 'REF!' &&
                        (description.includes('operation') || description.includes('sewing') ||
                         description.includes('cutting') || description.includes('assembly') ||
                         description.includes('finishing') || description.includes('quality') ||
                         description.includes('inspection') || description.includes('55') ||
                         description.length > 2)) {
                        console.log('✅ Adding operation:', { description, smv, cost });
                        extractedData.operations.push({
                            description: description,
                            smv: smv,
                            cost: cost
                        });
                    }
                } else if (operationRow.join('').trim() === '' || operationRow[0] === '') {
                    // Empty row, end of operations section
                    console.log('End of operations section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Operations extraction results:', extractedData.operations);
}

window.capImport.extractPackaging = function(jsonData, extractedData) {
    console.log('🔍 Looking for packaging...');
    // Look for packaging sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('packaging') && (rowText.includes('cost') || rowText.includes('factory'))) {
            console.log('✅ Found packaging section at row', i, ':', row);
            // Found packaging section header
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const packagingRow = jsonData[j];
                if (!Array.isArray(packagingRow)) continue;
                
                console.log(`Checking packaging row ${j}:`, packagingRow);
                
                // Look for packaging data rows
                if (packagingRow.length >= 2 && packagingRow[0] && packagingRow[0] !== '') {
                    const description = packagingRow[0] ? packagingRow[0].toString().trim() : '';
                    const cost = packagingRow[1] ? packagingRow[1].toString().trim() : '';
                    
                    console.log('Packaging row data:', { description, cost });
                    
                    // Check if this looks like a packaging row
                    if (description && (description.toLowerCase().includes('standard') ||
                         description.toLowerCase().includes('special') ||
                         description.toLowerCase().includes('packaging') ||
                         description.toLowerCase().includes('cost'))) {
                        console.log('✅ Adding packaging:', { description, cost });
                        extractedData.packaging.push({
                            description: description,
                            cost: cost
                        });
                    }
                } else if (packagingRow.join('').trim() === '' || packagingRow[0] === '') {
                    // Empty row, end of packaging section
                    console.log('End of packaging section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Packaging extraction results:', extractedData.packaging);
}

window.capImport.extractOverheadProfit = function(jsonData, extractedData) {
    console.log('🔍 Looking for overhead/profit...');
    // Look for overhead/profit sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('overhead') && rowText.includes('profit')) {
            console.log('✅ Found overhead/profit section at row', i, ':', row);
            // Found overhead/profit section header
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const overheadRow = jsonData[j];
                if (!Array.isArray(overheadRow)) continue;
                
                console.log(`Checking overhead/profit row ${j}:`, overheadRow);
                
                // Look for overhead and profit rows
                if (overheadRow.length >= 2 && overheadRow[0] && overheadRow[0] !== '') {
                    const description = overheadRow[0] ? overheadRow[0].toString().trim() : '';
                    const cost = overheadRow[1] ? overheadRow[1].toString().trim() : '';
                    
                    console.log('Overhead/Profit row data:', { description, cost });
                    
                    if (description.toLowerCase().includes('overhead')) {
                        extractedData.totals.overhead = cost;
                        console.log('✅ Found overhead:', cost);
                    } else if (description.toLowerCase().includes('profit')) {
                        extractedData.totals.profit = cost;
                        console.log('✅ Found profit:', cost);
                    }
                } else if (overheadRow.join('').trim() === '' || overheadRow[0] === '') {
                    // Empty row, end of section
                    console.log('End of overhead/profit section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Overhead/Profit extraction results:', {
        overhead: extractedData.totals.overhead,
        profit: extractedData.totals.profit
    });
}

window.capImport.calculateCapTotals = function(extractedData) {
    let materialCost = 0;
    let operationsCost = 0;
    let packagingCost = 0;
    
    // Calculate material cost from fabric and trim
    [...extractedData.fabric, ...extractedData.trim].forEach(item => {
        if (item.consumption && item.price && 
            item.price !== '#REF!' && item.price !== 'REF!' &&
            item.consumption !== '#REF!' && item.consumption !== 'REF!') {
            // Convert price to string and clean it, then parse as float
            const priceStr = item.price.toString();
            const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
            const priceValue = parseFloat(cleanPrice) || 0;
            const consumptionValue = parseFloat(item.consumption) || 0;
            materialCost += consumptionValue * priceValue;
        } else if (item.cost && item.cost !== '#REF!' && item.cost !== 'REF!') {
            // If cost is directly provided
            const costStr = item.cost.toString();
            const cleanCost = costStr.replace(/[^0-9.-]/g, '');
            materialCost += parseFloat(cleanCost) || 0;
        }
    });
    
    // Calculate operations cost
    extractedData.operations.forEach(item => {
        if (item.cost && item.cost !== '#REF!' && item.cost !== 'REF!') {
            const costStr = item.cost.toString();
            const cleanCost = costStr.replace(/[^0-9.-]/g, '');
            operationsCost += parseFloat(cleanCost) || 0;
        }
    });
    
    // Calculate packaging cost
    extractedData.packaging.forEach(item => {
        if (item.cost && item.cost !== '#REF!' && item.cost !== 'REF!') {
            const costStr = item.cost.toString();
            const cleanCost = costStr.replace(/[^0-9.-]/g, '');
            packagingCost += parseFloat(cleanCost) || 0;
        }
    });
    
    // Get overhead and profit from totals
    const overhead = parseFloat(extractedData.totals.overhead) || 0;
    const profit = parseFloat(extractedData.totals.profit) || 0;
    
    // Update totals
    extractedData.totals.materialCost = materialCost.toFixed(2);
    extractedData.totals.operationsCost = operationsCost.toFixed(2);
    extractedData.totals.packagingCost = packagingCost.toFixed(2);
    
    // Calculate total factory cost
    const totalFactoryCost = materialCost + operationsCost + packagingCost + overhead + profit;
    extractedData.totals.totalFactoryCost = totalFactoryCost.toFixed(2);
    
    console.log('📊 Cap cost calculation breakdown:', {
        materialCost: materialCost.toFixed(2),
        operationsCost: operationsCost.toFixed(2),
        packagingCost: packagingCost.toFixed(2),
        overhead: overhead.toFixed(2),
        profit: profit.toFixed(2),
        totalFactoryCost: totalFactoryCost.toFixed(2)
    });
}

// Extract from structured CSV with mapped headers
window.capImport.extractStructuredCapData = function(jsonData) {
    console.log('Extracting from structured CSV with mapped headers');
    
    const extractedData = {
        customer: '',
        season: '',
        styleNumber: '',
        styleName: '',
        costedQuantity: '',
        leadtime: '',
        yarn: [],
        fabric: [],
        trim: [],
        knitting: [],
        operations: [],
        packaging: [],
        totals: {
            materialCost: '0.00',
            knittingCost: '0.00',
            operationsCost: '0.00',
            packagingCost: '0.00',
            overhead: '0.00',
            profit: '0.00',
            totalFactoryCost: '0.00'
        }
    };
    
    // Find header row and create column mapping
    let headerRowIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row.length > 0) {
            const rowStr = row.join(' ').toLowerCase();
            if (rowStr.includes('season') || rowStr.includes('customer') || rowStr.includes('style_number')) {
                headerRowIndex = i;
                headers = row;
                break;
            }
        }
    }
    
    if (headerRowIndex === -1) {
        headerRowIndex = 0;
        headers = jsonData[0] || [];
    }
    
    console.log('Structured CSV headers found:', headers);
    
    // Create column mapping with more flexible matching
    const columnMap = {};
    headers.forEach((header, index) => {
        if (header && typeof header === 'string') {
            const cleanHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            columnMap[cleanHeader] = index;
            // Also add original header for exact matches
            columnMap[header.toLowerCase().trim()] = index;
        }
    });
    
    console.log('Column mapping created:', columnMap);
    console.log('Available column names:', headers);
    console.log('Total columns:', headers.length);
    
    // Extract data from first data row
    const dataRow = jsonData[headerRowIndex + 1] || [];
    console.log('Data row:', dataRow);
    console.log('Data row length:', dataRow.length);
    
    // Basic Information Mapping with more flexible column names
    // For this specific Excel format, we need to look in the first few rows for the data
    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Look for customer info
        if (rowText.includes('customer') && !extractedData.customer) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('customer')) {
                    extractedData.customer = row[j + 1] || '';
                    break;
                }
            }
        }
        
        // Look for season info
        if (rowText.includes('season') && !extractedData.season) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('season')) {
                    extractedData.season = row[j + 1] || '';
                    break;
                }
            }
        }
        
        // Look for style number
        if (rowText.includes('style#') && !extractedData.styleNumber) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('style#')) {
                    extractedData.styleNumber = row[j + 1] || '';
                    break;
                }
            }
        }
        
        // Look for style name
        if (rowText.includes('style name') && !extractedData.styleName) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('style name')) {
                    extractedData.styleName = row[j + 1] || '';
                    break;
                }
            }
        }
        
        // Look for MOQ
        if (rowText.includes('moq') && !extractedData.costedQuantity) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('moq')) {
                    extractedData.costedQuantity = row[j + 1] || '';
                    break;
                }
            }
        }
        
        // Look for leadtime
        if (rowText.includes('leadtime') && !extractedData.leadtime) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('leadtime')) {
                    extractedData.leadtime = row[j + 1] || '';
                    break;
                }
            }
        }
    }
    
    // Extract fabric materials from the specific Excel format
    // Look for fabric sections in the data
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Look for fabric section
        if (rowText.includes('fabric') && rowText.includes('description') && rowText.includes('consumption')) {
            // Found fabric section, extract data from next few rows
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const fabricRow = jsonData[j];
                if (Array.isArray(fabricRow) && fabricRow.length > 0 && fabricRow[0] && fabricRow[0].toString().trim()) {
                    // Check if this row has fabric data (not empty and not a header)
                    if (!fabricRow[0].toString().toLowerCase().includes('fabric') && 
                        !fabricRow[0].toString().toLowerCase().includes('consumption') &&
                        !fabricRow[0].toString().toLowerCase().includes('price') &&
                        !fabricRow[0].toString().toLowerCase().includes('total')) {
                        
                        const fabric = {
                            description: fabricRow[0] || '',
                            consumption: fabricRow[1] || '',
                            price: fabricRow[2] || '',
                            cost: fabricRow[3] || ''
                        };
                        
                        if (fabric.description && fabric.description.trim()) {
                            extractedData.fabric.push(fabric);
                        }
                    }
                }
            }
            break;
        }
    }
    
    // Extract trim materials from the specific Excel format
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Look for trim section
        if (rowText.includes('trim') && rowText.includes('consumption') && rowText.includes('piece')) {
            // Found trim section, extract data from next few rows
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const trimRow = jsonData[j];
                if (Array.isArray(trimRow) && trimRow.length > 0 && trimRow[0] && trimRow[0].toString().trim()) {
                    // Check if this row has trim data (not empty and not a header)
                    if (!trimRow[0].toString().toLowerCase().includes('trim') && 
                        !trimRow[0].toString().toLowerCase().includes('consumption') &&
                        !trimRow[0].toString().toLowerCase().includes('price') &&
                        !trimRow[0].toString().toLowerCase().includes('total')) {
                        
                        const trim = {
                            description: trimRow[0] || '',
                            consumption: trimRow[1] || '',
                            price: trimRow[2] || '',
                            cost: trimRow[3] || ''
                        };
                        
                        if (trim.description && trim.description.trim()) {
                            extractedData.trim.push(trim);
                        }
                    }
                }
            }
            break;
        }
    }
    
    // Extract operations from the specific Excel format
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Look for operations section
        if (rowText.includes('operations') && rowText.includes('smv') && rowText.includes('cost')) {
            // Found operations section, extract data from next few rows
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const opsRow = jsonData[j];
                if (Array.isArray(opsRow) && opsRow.length > 0 && opsRow[1] && opsRow[1].toString().trim()) {
                    // Check if this row has operations data (has SMV value)
                    if (!isNaN(parseFloat(opsRow[1]))) {
                        const operation = {
                            name: 'Operations',
                            smv: opsRow[1] || '',
                            costPerMin: opsRow[2] || '',
                            cost: opsRow[3] || ''
                        };
                        
                        if (operation.smv) {
                            extractedData.operations.push(operation);
                        }
                    }
                }
            }
            break;
        }
    }
    
    // Extract packaging and overhead costs
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Look for packaging section
        if (rowText.includes('packaging') && rowText.includes('cost')) {
            for (let j = i + 1; j < Math.min(i + 5, jsonData.length); j++) {
                const packRow = jsonData[j];
                if (Array.isArray(packRow) && packRow.length > 0) {
                    if (packRow[0] && packRow[0].toString().toLowerCase().includes('standard')) {
                        extractedData.totals.packagingCost = packRow[3] || '0.00';
                    }
                }
            }
        }
        
        // Look for overhead/profit section
        if (rowText.includes('overhead') && rowText.includes('profit')) {
            for (let j = i + 1; j < Math.min(i + 5, jsonData.length); j++) {
                const ohRow = jsonData[j];
                if (Array.isArray(ohRow) && ohRow.length > 0) {
                    if (ohRow[0] && ohRow[0].toString().toLowerCase().includes('overhead')) {
                        extractedData.totals.overhead = ohRow[3] || '0.00';
                    }
                    if (ohRow[0] && ohRow[0].toString().toLowerCase().includes('profit')) {
                        extractedData.totals.profit = ohRow[3] || '0.00';
                    }
                }
            }
        }
    }
    
    // Calculate totals
    let materialCost = 0;
    let operationsCost = 0;
    
    // Calculate material cost from fabric and trim
    [...extractedData.fabric, ...extractedData.trim].forEach(item => {
        if (item.consumption && item.price) {
            // Convert price to string and clean it, then parse as float
            const priceStr = item.price.toString();
            const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
            const priceValue = parseFloat(cleanPrice) || 0;
            const consumptionValue = parseFloat(item.consumption) || 0;
            materialCost += consumptionValue * priceValue;
        }
    });
    
    // Calculate operations cost
    if (extractedData.operations.length > 0) {
        operationsCost = parseFloat(extractedData.operations[0].cost || 0);
    }
    
    extractedData.totals.materialCost = materialCost.toFixed(2);
    extractedData.totals.operationsCost = operationsCost.toFixed(2);
    extractedData.totals.totalFactoryCost = (materialCost + operationsCost + parseFloat(extractedData.totals.packagingCost) + parseFloat(extractedData.totals.overhead) + parseFloat(extractedData.totals.profit)).toFixed(2);
    
    console.log('Structured extraction result:', extractedData);
    console.log('Fabric data found:', extractedData.fabric);
    console.log('Trim data found:', extractedData.trim);
    console.log('Operations data found:', extractedData.operations);
    console.log('Totals data found:', extractedData.totals);
    return extractedData;
}

// Extract from complex spreadsheet format
window.capImport.extractComplexCapData = function(jsonData) {
    console.log('Extracting from complex spreadsheet format');
    
    const extractedData = {
        customer: '',
        season: '',
        styleNumber: '',
        styleName: '',
        costedQuantity: '',
        leadtime: '',
        yarn: [],
        fabric: [],
        trim: [],
        knitting: [],
        operations: [],
        packaging: [],
        totals: {
            materialCost: '0.00',
            knittingCost: '0.00',
            operationsCost: '0.00',
            packagingCost: '0.00',
            overhead: '0.00',
            profit: '0.00',
            totalFactoryCost: '0.00'
        }
    };
    
    // Convert 2D array to searchable text for better pattern matching
    const allText = jsonData.flat().join(' ').toLowerCase();
    console.log('All text sample:', allText.substring(0, 500));
    
    // Extract basic information using more flexible patterns
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Extract customer info - look for "Customer：" or "Customer:"
        if (rowText.includes('customer：') || rowText.includes('customer:')) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('customer')) {
                    extractedData.customer = row[j + 1] || '';
                    console.log('Found customer:', extractedData.customer);
                    break;
                }
            }
        }
        
        // Extract season - look for "Season：" or "Season:"
        if (rowText.includes('season：') || rowText.includes('season:')) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('season')) {
                    extractedData.season = row[j + 1] || '';
                    console.log('Found season:', extractedData.season);
                    break;
                }
            }
        }
        
        // Extract style number - look for "Style：" or "Style:"
        if (rowText.includes('style：') || rowText.includes('style:')) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('style')) {
                    extractedData.styleNumber = row[j + 1] || '';
                    console.log('Found style number:', extractedData.styleNumber);
                    break;
                }
            }
        }
        
        // Extract style name - look for "Style Name：" or "Style Name:"
        if (rowText.includes('style name：') || rowText.includes('style name:')) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('style name')) {
                    extractedData.styleName = row[j + 1] || '';
                    console.log('Found style name:', extractedData.styleName);
                    break;
                }
            }
        }
        
        // Extract quantity - look for "Quantity：" or "Quantity:"
        if (rowText.includes('quantity：') || rowText.includes('quantity:')) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('quantity')) {
                    extractedData.costedQuantity = row[j + 1] || '';
                    console.log('Found quantity:', extractedData.costedQuantity);
                    break;
                }
            }
        }
        
        // Extract leadtime - look for "Leadtime：" or "Leadtime:"
        if (rowText.includes('leadtime：') || rowText.includes('leadtime:')) {
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('leadtime')) {
                    extractedData.leadtime = row[j + 1] || '';
                    console.log('Found leadtime:', extractedData.leadtime);
                    break;
                }
            }
        }
    }
    
    // Extract fabric materials
    extractFabricMaterials(jsonData, extractedData);
    
    // Extract trim materials
    extractTrimMaterials(jsonData, extractedData);
    
    // Extract operations
    extractOperations(jsonData, extractedData);
    
    // Extract packaging
    extractPackaging(jsonData, extractedData);
    
    // Calculate totals
    calculateTotals(extractedData);
    
    console.log('Complex extraction result:', extractedData);
    return extractedData;
}

// Helper function to get value by column mapping
window.capImport.getValueByColumn = function(dataRow, columnMap, possibleHeaders) {
    for (const header of possibleHeaders) {
        // Try exact match first
        let columnIndex = columnMap[header.toLowerCase()];
        if (columnIndex !== undefined && dataRow[columnIndex] !== undefined) {
            return dataRow[columnIndex].toString().trim();
        }
        
        // Try partial match
        for (const [mapHeader, index] of Object.entries(columnMap)) {
            if (mapHeader.includes(header.toLowerCase()) || header.toLowerCase().includes(mapHeader)) {
                if (dataRow[index] !== undefined) {
                    return dataRow[index].toString().trim();
                }
            }
        }
    }
    return '';
}

// Create empty data structure as fallback
window.capImport.createEmptyData = function() {
    return {
        customer: 'No Data',
        season: '',
        styleNumber: 'N/A',
        styleName: 'No Product Data',
        costedQuantity: '',
        leadtime: '',
        yarn: [],
        fabric: [],
        trim: [],
        knitting: [],
        operations: [],
        packaging: [],
        totals: {
            materialCost: '0.00',
            knittingCost: '0.00',
            operationsCost: '0.00',
            packagingCost: '0.00',
            overhead: '0.00',
            profit: '0.00',
            totalFactoryCost: '0.00'
        }
    };
}

// Helper functions for complex extraction
function extractFabricMaterials(jsonData, extractedData) {
    // Look for fabric sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('fabric') && rowText.includes('description')) {
            // Found fabric section, extract data from next few rows
            for (let j = i + 1; j < Math.min(i + 5, jsonData.length); j++) {
                const dataRow = jsonData[j];
                if (Array.isArray(dataRow) && dataRow.length > 0) {
                    const fabric = {
                        description: dataRow[0] || '',
                        consumption: dataRow[1] || '',
                        price: dataRow[2] || ''
                    };
                    if (fabric.description) {
                        extractedData.fabric.push(fabric);
                    }
                }
            }
            break;
        }
    }
}

function extractTrimMaterials(jsonData, extractedData) {
    // Look for trim sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('trim') && rowText.includes('description')) {
            // Found trim section, extract data from next few rows
            for (let j = i + 1; j < Math.min(i + 5, jsonData.length); j++) {
                const dataRow = jsonData[j];
                if (Array.isArray(dataRow) && dataRow.length > 0) {
                    const trim = {
                        description: dataRow[0] || '',
                        consumption: dataRow[1] || '',
                        price: dataRow[2] || ''
                    };
                    if (trim.description) {
                        extractedData.trim.push(trim);
                    }
                }
            }
            break;
        }
    }
}

function extractOperations(jsonData, extractedData) {
    // Look for operations sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('operation') || rowText.includes('smv')) {
            // Found operations section, extract data
            const operation = {
                name: 'Operations',
                smv: row[1] || '',
                costPerMin: row[2] || '',
                cost: row[3] || ''
            };
            if (operation.smv) {
                extractedData.operations.push(operation);
            }
            break;
        }
    }
}

function extractPackaging(jsonData, extractedData) {
    // Look for packaging sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('packaging')) {
            // Found packaging section, extract data
            extractedData.totals.packagingCost = row[1] || '0.00';
            break;
        }
    }
}

function calculateTotals(extractedData) {
    let materialCost = 0;
    let operationsCost = 0;
    
    // Calculate material cost from fabric and trim
    [...extractedData.fabric, ...extractedData.trim].forEach(item => {
        if (item.consumption && item.price) {
            // Convert price to string and clean it, then parse as float
            const priceStr = item.price.toString();
            const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
            const priceValue = parseFloat(cleanPrice) || 0;
            const consumptionValue = parseFloat(item.consumption) || 0;
            materialCost += consumptionValue * priceValue;
        }
    });
    
    // Calculate operations cost
    if (extractedData.operations.length > 0) {
        operationsCost = parseFloat(extractedData.operations[0].cost || 0);
    }
    
    extractedData.totals.materialCost = materialCost.toFixed(2);
    extractedData.totals.operationsCost = operationsCost.toFixed(2);
    extractedData.totals.totalFactoryCost = (materialCost + operationsCost + parseFloat(extractedData.totals.packagingCost) + parseFloat(extractedData.totals.overhead) + parseFloat(extractedData.totals.profit)).toFixed(2);
}
