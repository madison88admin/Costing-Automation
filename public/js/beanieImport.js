// Beanie Template Import Logic
// This file contains all the logic for importing and processing beanie template data

// Make functions available globally
window.beanieImport = {};

// Extract beanie template data from Excel format
window.beanieImport.extractBeanieTemplateData = function(jsonData) {
    console.log('Extracting beanie template data from Excel format');
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
    
    // Look for header information in the top-right area
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
    
    // Extract yarn materials
    window.beanieImport.extractYarnMaterials(jsonData, extractedData);
    
    // Extract fabric materials
    window.beanieImport.extractFabricMaterials(jsonData, extractedData);
    
    // Extract trim materials
    window.beanieImport.extractTrimMaterials(jsonData, extractedData);
    
    // Extract knitting operations
    window.beanieImport.extractKnittingOperations(jsonData, extractedData);
    
    // Extract other operations
    window.beanieImport.extractOtherOperations(jsonData, extractedData);
    
    // Extract packaging
    window.beanieImport.extractPackaging(jsonData, extractedData);
    
    // Extract overhead and profit
    window.beanieImport.extractOverheadProfit(jsonData, extractedData);
    
    // Calculate totals
    window.beanieImport.calculateBeanieTotals(extractedData);
    
    console.log('Beanie extraction result:', extractedData);
    return extractedData;
}

// Extract from structured CSV with mapped headers for beanie
window.beanieImport.extractStructuredBeanieData = function(jsonData) {
    console.log('Extracting from structured CSV with mapped headers for beanie');
    
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
    extractedData.season = getValueByColumn(dataRow, columnMap, ['season', 'seasons', 'season_name']);
    extractedData.customer = getValueByColumn(dataRow, columnMap, ['customer', 'customers', 'client', 'brand']);
    extractedData.styleNumber = getValueByColumn(dataRow, columnMap, ['style_number', 'style#', 'style no', 'style', 'style_code', 'sku']);
    extractedData.styleName = getValueByColumn(dataRow, columnMap, ['style_name', 'style name', 'product_name', 'product', 'description']);
    extractedData.costedQuantity = getValueByColumn(dataRow, columnMap, ['moq', 'quantity', 'qty', 'order_quantity', 'qty_ordered']);
    extractedData.leadtime = getValueByColumn(dataRow, columnMap, ['leadtime', 'lead time', 'lead_time', 'delivery_time']);
    
    // Yarn Materials - try multiple possible column names
    const yarn1 = {
        description: getValueByColumn(dataRow, columnMap, ['yarn_1_description', 'main_yarn', 'yarn', 'yarn_description', 'yarn1']),
        consumption: getValueByColumn(dataRow, columnMap, ['yarn_1_consumption', 'yarn_consumption', 'consumption', 'yarn1_consumption']),
        price: getValueByColumn(dataRow, columnMap, ['yarn_1_price', 'yarn_price', 'price', 'yarn1_price'])
    };
    const yarn2 = {
        description: getValueByColumn(dataRow, columnMap, ['yarn_2_description', 'other_yarn', 'yarn2', 'secondary_yarn']),
        consumption: getValueByColumn(dataRow, columnMap, ['yarn_2_consumption', 'yarn2_consumption', 'other_yarn_consumption']),
        price: getValueByColumn(dataRow, columnMap, ['yarn_2_price', 'yarn2_price', 'other_yarn_price'])
    };
    
    if (yarn1.description) extractedData.yarn.push(yarn1);
    if (yarn2.description) extractedData.yarn.push(yarn2);
    
    // Knitting Operations
    const knitting1 = {
        machine: getValueByColumn(dataRow, columnMap, ['knitting_machine', 'machine', 'knitting1_machine']),
        time: getValueByColumn(dataRow, columnMap, ['knitting_time', 'time', 'knitting1_time']),
        cpm: getValueByColumn(dataRow, columnMap, ['knitting_cpm', 'cpm', 'knitting1_cpm']),
        cost: getValueByColumn(dataRow, columnMap, ['knitting_cost', 'cost', 'knitting1_cost'])
    };
    
    if (knitting1.machine) extractedData.knitting.push(knitting1);
    
    // Operations
    const operation1 = {
        name: getValueByColumn(dataRow, columnMap, ['operation_name', 'operation', 'ops_name']),
        time: getValueByColumn(dataRow, columnMap, ['operation_time', 'ops_time']),
        cost: getValueByColumn(dataRow, columnMap, ['operation_cost', 'ops_cost'])
    };
    
    if (operation1.name) extractedData.operations.push(operation1);
    
    // Final Costs
    const packagingCost = getValueByColumn(dataRow, columnMap, ['packaging_cost', 'packaging']);
    const overheadCost = getValueByColumn(dataRow, columnMap, ['overhead_cost', 'overhead', 'oh']);
    const profitMargin = getValueByColumn(dataRow, columnMap, ['profit_margin', 'profit']);
    
    extractedData.totals.packagingCost = packagingCost || '0.00';
    extractedData.totals.overhead = overheadCost || '0.00';
    extractedData.totals.profit = profitMargin || '0.00';
    
    // Calculate totals
    let materialCost = 0;
    let knittingCost = 0;
    let operationsCost = 0;
    
    // Calculate material cost from yarn
    extractedData.yarn.forEach(item => {
        if (item.consumption && item.price) {
            // Convert price to string and clean it, then parse as float
            const priceStr = item.price.toString();
            const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
            const priceValue = parseFloat(cleanPrice) || 0;
            const consumptionValue = parseFloat(item.consumption) || 0;
            materialCost += consumptionValue * priceValue;
        }
    });
    
    // Calculate knitting cost
    if (extractedData.knitting.length > 0) {
        knittingCost = parseFloat(extractedData.knitting[0].cost || 0);
    }
    
    // Calculate operations cost
    extractedData.operations.forEach(item => {
        if (item.cost) {
            operationsCost += parseFloat(item.cost);
        }
    });
    
    extractedData.totals.materialCost = materialCost.toFixed(2);
    extractedData.totals.knittingCost = knittingCost.toFixed(2);
    extractedData.totals.operationsCost = operationsCost.toFixed(2);
    extractedData.totals.totalFactoryCost = (materialCost + knittingCost + operationsCost + parseFloat(extractedData.totals.packagingCost) + parseFloat(extractedData.totals.overhead) + parseFloat(extractedData.totals.profit)).toFixed(2);
    
    console.log('Structured beanie extraction result:', extractedData);
    return extractedData;
}

// Extract from complex spreadsheet format for beanie
window.beanieImport.extractComplexBeanieData = function(jsonData) {
    console.log('Extracting from complex spreadsheet format for beanie');
    
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
    
    // Extract yarn materials
    window.beanieImport.extractYarnMaterials(jsonData, extractedData);
    
    // Extract knitting operations
    window.beanieImport.extractKnittingOperations(jsonData, extractedData);
    
    // Extract other operations
    window.beanieImport.extractOtherOperations(jsonData, extractedData);
    
    // Extract packaging
    window.beanieImport.extractPackaging(jsonData, extractedData);
    
    // Calculate totals
    window.beanieImport.calculateBeanieTotals(extractedData);
    
    console.log('Complex beanie extraction result:', extractedData);
    return extractedData;
}

// Helper functions for beanie extraction
window.beanieImport.extractFabricMaterials = function(jsonData, extractedData) {
    // Look for fabric sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('fabric') && rowText.includes('consumption')) {
            // Found fabric section header
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const fabricRow = jsonData[j];
                if (!Array.isArray(fabricRow)) continue;
                
                // Look for fabric data rows
                if (fabricRow.length >= 3 && fabricRow[0] && fabricRow[0] !== '') {
                    const consumption = fabricRow[0] ? fabricRow[0].toString().trim() : '';
                    const price = fabricRow[1] ? fabricRow[1].toString().trim() : '';
                    const cost = fabricRow[2] ? fabricRow[2].toString().trim() : '';
                    
                    if (consumption && consumption !== '0' && consumption !== '0.00') {
                        extractedData.fabric.push({
                            description: consumption,
                            consumption: consumption,
                            price: price,
                            cost: cost
                        });
                    }
                } else if (fabricRow.join('').trim() === '' || fabricRow[0] === '') {
                    // Empty row, end of fabric section
                    break;
                }
            }
            break;
        }
    }
}

window.beanieImport.extractTrimMaterials = function(jsonData, extractedData) {
    console.log('🔍 Looking for trim materials...');
    // Look for trim sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('trim') && rowText.includes('consumption')) {
            console.log('✅ Found trim section at row', i, ':', row);
            // Found trim section header
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const trimRow = jsonData[j];
                if (!Array.isArray(trimRow)) continue;
                
                console.log(`Checking trim row ${j}:`, trimRow);
                
                // Look for trim data rows
                if (trimRow.length >= 3 && trimRow[0] && trimRow[0] !== '') {
                    const description = trimRow[0] ? trimRow[0].toString().trim() : '';
                    const consumption = trimRow[1] ? trimRow[1].toString().trim() : '';
                    const price = trimRow[2] ? trimRow[2].toString().trim() : '';
                    const cost = trimRow[3] ? trimRow[3].toString().trim() : '';
                    
                    console.log('Trim row data:', { description, consumption, price, cost });
                    
                    // Check if this looks like a trim material row
                    if (description && description !== '0' && description !== '0.00' && 
                        (description.toLowerCase().includes('sewing') ||
                         description.toLowerCase().includes('thread') ||
                         description.toLowerCase().includes('coats') ||
                         description.toLowerCase().includes('ecov') ||
                         description.toLowerCase().includes('trim') ||
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

window.beanieImport.extractOverheadProfit = function(jsonData, extractedData) {
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

window.beanieImport.extractYarnMaterials = function(jsonData, extractedData) {
    console.log('🔍 Looking for yarn materials...');
    // Look for yarn sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('yarn') && (rowText.includes('consumption') || rowText.includes('material'))) {
            console.log('✅ Found yarn section at row', i, ':', row);
            // Found yarn section header
            for (let j = i + 1; j < Math.min(i + 15, jsonData.length); j++) {
                const yarnRow = jsonData[j];
                if (!Array.isArray(yarnRow)) continue;
                
                console.log(`Checking yarn row ${j}:`, yarnRow);
                
                // Look for yarn data rows - check for material description in first column
                if (yarnRow.length >= 4 && yarnRow[0] && yarnRow[0] !== '') {
                    const description = yarnRow[0] ? yarnRow[0].toString().trim() : '';
                    const consumption = yarnRow[1] ? yarnRow[1].toString().trim() : '';
                    const price = yarnRow[2] ? yarnRow[2].toString().trim() : '';
                    const cost = yarnRow[3] ? yarnRow[3].toString().trim() : '';
                    
                    console.log('Yarn row data:', { description, consumption, price, cost });
                    
                    // Check if this looks like a yarn material row - be more inclusive
                    if (description && description !== '0' && description !== '0.00' && 
                        (description.includes('Nylon') || description.includes('Wool') || 
                         description.includes('Yarn') || description.includes('100%') ||
                         description.includes('Merino') || description.includes('RWS') ||
                         description.includes('UJ-F19') || description.includes('HYDD') ||
                         description.includes('ECO') || description.includes('Nm') ||
                         description.includes('mic') || description.includes('G') ||
                         description.includes('(') || description.includes(')') ||
                         description.length > 10)) { // Include longer descriptions
                        console.log('✅ Adding yarn material:', { description, consumption, price, cost });
                        extractedData.yarn.push({
                            description: description,
                            consumption: consumption,
                            price: price,
                            cost: cost
                        });
                    }
                } else if (yarnRow.join('').trim() === '' || yarnRow[0] === '') {
                    // Empty row, end of yarn section
                    console.log('End of yarn section at row', j);
                    break;
                }
            }
            break;
        }
    }
    console.log('📊 Yarn extraction results:', extractedData.yarn);
}

window.beanieImport.extractKnittingOperations = function(jsonData, extractedData) {
    // Look for knitting sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('knitting') && (rowText.includes('time') || rowText.includes('sah'))) {
            // Found knitting section header
            for (let j = i + 1; j < Math.min(i + 10, jsonData.length); j++) {
                const knittingRow = jsonData[j];
                if (!Array.isArray(knittingRow)) continue;
                
                // Look for knitting data rows
                if (knittingRow.length >= 4 && knittingRow[0] && knittingRow[0] !== '') {
                    const machine = knittingRow[0] ? knittingRow[0].toString().trim() : '';
                    const time = knittingRow[1] ? knittingRow[1].toString().trim() : '';
                    const sah = knittingRow[2] ? knittingRow[2].toString().trim() : '';
                    const cost = knittingRow[3] ? knittingRow[3].toString().trim() : '';
                    
                    if (machine && machine !== '0' && machine !== '0.00') {
                        extractedData.knitting.push({
                            machine: machine,
                            time: time,
                            sah: sah,
                            cost: cost
                        });
                    }
                } else if (knittingRow.join('').trim() === '' || knittingRow[0] === '') {
                    // Empty row, end of knitting section
                    break;
                }
            }
            break;
        }
    }
}

window.beanieImport.extractOtherOperations = function(jsonData, extractedData) {
    console.log('🔍 Looking for operations...');
    // Look for operations sections
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('operations') && (rowText.includes('time') || rowText.includes('cost'))) {
            console.log('✅ Found operations section at row', i, ':', row);
            // Found operations section header
            for (let j = i + 1; j < Math.min(i + 20, jsonData.length); j++) {
                const operationRow = jsonData[j];
                if (!Array.isArray(operationRow)) continue;
                
                console.log(`Checking operation row ${j}:`, operationRow);
                
                // Look for operation data rows
                if (operationRow.length >= 3 && operationRow[0] && operationRow[0] !== '') {
                    const description = operationRow[0] ? operationRow[0].toString().trim() : '';
                    const time = operationRow[1] ? operationRow[1].toString().trim() : '';
                    const cost = operationRow[2] ? operationRow[2].toString().trim() : '';
                    
                    console.log('Operation row data:', { description, time, cost });
                    
                    // Check if this looks like an operation row - be more inclusive
                    if (description && description !== '0' && description !== '0.00' && 
                        (description.toLowerCase().includes('labeling') ||
                         description.toLowerCase().includes('neaten') ||
                         description.toLowerCase().includes('steaming') ||
                         description.toLowerCase().includes('packing') ||
                         description.toLowerCase().includes('linking') ||
                         description.toLowerCase().includes('washing') ||
                         description.toLowerCase().includes('hand closing') ||
                         description.toLowerCase().includes('operation') ||
                         description.toLowerCase().includes('beanie') ||
                         description.toLowerCase().includes('hat') ||
                         description.toLowerCase().includes('glove') ||
                         description.toLowerCase().includes('cuff') ||
                         description.toLowerCase().includes('gg') ||
                         description.length > 5)) {
                        console.log('✅ Adding operation:', { description, time, cost });
                        extractedData.operations.push({
                            description: description,
                            time: time,
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

window.beanieImport.extractPackaging = function(jsonData, extractedData) {
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

window.beanieImport.calculateBeanieTotals = function(extractedData) {
    let materialCost = 0;
    let knittingCost = 0;
    let operationsCost = 0;
    let packagingCost = 0;
    
    // Calculate material cost from yarn, fabric, and trim
    [...extractedData.yarn, ...extractedData.fabric, ...extractedData.trim].forEach(item => {
        if (item.consumption && item.price) {
            // Convert price to string and clean it, then parse as float
            const priceStr = item.price.toString();
            const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
            const priceValue = parseFloat(cleanPrice) || 0;
            const consumptionValue = parseFloat(item.consumption) || 0;
            materialCost += consumptionValue * priceValue;
        } else if (item.cost) {
            // If cost is directly provided
            const costStr = item.cost.toString();
            const cleanCost = costStr.replace(/[^0-9.-]/g, '');
            materialCost += parseFloat(cleanCost) || 0;
        }
    });
    
    // Calculate knitting cost
    extractedData.knitting.forEach(item => {
        if (item.cost) {
            const costStr = item.cost.toString();
            const cleanCost = costStr.replace(/[^0-9.-]/g, '');
            knittingCost += parseFloat(cleanCost) || 0;
        }
    });
    
    // Calculate operations cost
    extractedData.operations.forEach(item => {
        if (item.cost) {
            const costStr = item.cost.toString();
            const cleanCost = costStr.replace(/[^0-9.-]/g, '');
            operationsCost += parseFloat(cleanCost) || 0;
        }
    });
    
    // Calculate packaging cost
    extractedData.packaging.forEach(item => {
        if (item.cost) {
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
    extractedData.totals.knittingCost = knittingCost.toFixed(2);
    extractedData.totals.operationsCost = operationsCost.toFixed(2);
    extractedData.totals.packagingCost = packagingCost.toFixed(2);
    
    // Calculate total factory cost
    const totalFactoryCost = materialCost + knittingCost + operationsCost + packagingCost + overhead + profit;
    extractedData.totals.totalFactoryCost = totalFactoryCost.toFixed(2);
}
