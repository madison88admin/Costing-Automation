// Shared utilities for import functionality
// This file contains common functions used by both cap and beanie import modules

// Make functions available globally
window.importUtils = {};

// Helper function to get value by column mapping
window.importUtils.getValueByColumn = function(dataRow, columnMap, possibleHeaders) {
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
window.importUtils.createEmptyData = function() {
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

// Generic data extraction for unknown formats
window.importUtils.extractGenericData = function(jsonData) {
    console.log('Extracting generic data from unknown format');
    
    const extractedData = window.importUtils.createEmptyData();
    
    // Try to extract basic information from any row
    for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (!Array.isArray(row)) continue;
        
        const rowText = row.join(' ').toLowerCase();
        
        // Look for any recognizable patterns
        if (rowText.includes('customer') && !extractedData.customer) {
            extractedData.customer = row.find(cell => cell && cell.toString().trim() && !cell.toString().toLowerCase().includes('customer')) || '';
        }
        
        if (rowText.includes('season') && !extractedData.season) {
            extractedData.season = row.find(cell => cell && cell.toString().trim() && !cell.toString().toLowerCase().includes('season')) || '';
        }
        
        if (rowText.includes('style') && !extractedData.styleNumber) {
            extractedData.styleNumber = row.find(cell => cell && cell.toString().trim() && !cell.toString().toLowerCase().includes('style')) || '';
        }
    }
    
    return extractedData;
}

// Parse Excel/CSV file and extract factory cost data
window.importUtils.simulateExcelScan = async function(file, template = null) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                let jsonData;
                
                if (file.name.toLowerCase().endsWith('.csv')) {
                    // Handle CSV files
                    const csvText = e.target.result;
                    console.log('CSV content:', csvText);
                    
                    // Parse CSV manually
                    const lines = csvText.split('\n').filter(line => line.trim());
                    jsonData = lines.map(line => {
                        // Simple CSV parsing - split by comma and handle quoted values
                        const result = [];
                        let current = '';
                        let inQuotes = false;
                        
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                inQuotes = !inQuotes;
                            } else if (char === ',' && !inQuotes) {
                                result.push(current.trim());
                                current = '';
                            } else {
                                current += char;
                            }
                        }
                        result.push(current.trim());
                        return result;
                    });
                } else {
                    // Handle Excel files
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get the first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON with header row
                    jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                }
                
                console.log('File data parsed:', jsonData);
                console.log('Number of rows:', jsonData.length);
                
                // Extract data based on template
                let extractedData;
                if (template === 'beanie') {
                    extractedData = window.beanieImport ? window.beanieImport.extractBeanieTemplateData(jsonData) : window.importUtils.createEmptyData();
                } else if (template === 'cap') {
                    extractedData = window.capImport ? window.capImport.extractCapTemplateData(jsonData) : window.importUtils.createEmptyData();
                } else {
                    extractedData = window.importUtils.extractGenericData(jsonData);
                }
                
                resolve(extractedData);
            } catch (error) {
                console.error('Error parsing file:', error);
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        // Use text for CSV, array buffer for Excel
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// Generate column mappings for display
window.importUtils.generateColumnMappings = function(data, template = null) {
    console.log('Generating column mappings for template:', template);
    console.log('Data received for mapping:', data);
    
    let mainMaterial = '';
    let materialConsumption = '';
    let materialPrice = '';
    let knittingMachine = '';
    let knittingTime = '';
    let knittingCPM = '';
    
    if (template === 'beanie') {
        // For beanie template, use yarn data
        if (data.yarn && data.yarn.length > 0) {
            mainMaterial = data.yarn[0].description || '';
            materialConsumption = data.yarn[0].consumption || '';
            materialPrice = data.yarn[0].price || '';
        }
        if (data.knitting && data.knitting.length > 0) {
            knittingMachine = data.knitting[0].machine || '';
            knittingTime = data.knitting[0].time || '';
            knittingCPM = data.knitting[0].cpm || data.knitting[0].sah || '';
        }
    } else if (template === 'cap') {
        // For cap template, use fabric data
        if (data.fabric && data.fabric.length > 0) {
            mainMaterial = data.fabric[0].description || '';
            materialConsumption = data.fabric[0].consumption || '';
            materialPrice = data.fabric[0].price || '';
        }
    }
    
    // Calculate totals
    let totalMaterialCost = 0;
    let knittingCost = 0;
    let operationsCost = 0;
    let packagingCost = 0;
    let overhead = 0;
    let profit = 0;
    
    // Calculate material costs
    if (template === 'beanie' && data.yarn) {
        data.yarn.forEach(item => {
            if (item.consumption && item.price) {
                // Convert price to string and clean it, then parse as float
                const priceStr = item.price.toString();
                const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
                const priceValue = parseFloat(cleanPrice) || 0;
                const consumptionValue = parseFloat(item.consumption) || 0;
                totalMaterialCost += consumptionValue * priceValue;
            }
        });
    } else if (template === 'cap' && data.fabric) {
        data.fabric.forEach(item => {
            if (item.consumption && item.price) {
                // Convert price to string and clean it, then parse as float
                const priceStr = item.price.toString();
                const cleanPrice = priceStr.replace(/[^0-9.-]/g, '');
                const priceValue = parseFloat(cleanPrice) || 0;
                const consumptionValue = parseFloat(item.consumption) || 0;
                totalMaterialCost += consumptionValue * priceValue;
            }
        });
    }
    
    // Calculate other costs
    if (data.knitting && data.knitting.length > 0) {
        knittingCost = parseFloat(data.knitting[0].cost || 0);
    }
    
    if (data.operations && data.operations.length > 0) {
        data.operations.forEach(op => {
            operationsCost += parseFloat(op.cost || 0);
        });
    }
    
    packagingCost = parseFloat(data.totals?.packagingCost || 0);
    overhead = parseFloat(data.totals?.overhead || 0);
    profit = parseFloat(data.totals?.profit || 0);
    
    const totalFactoryCost = totalMaterialCost + knittingCost + operationsCost + packagingCost + overhead + profit;
    
    return {
        'Season': data.season || '',
        'Customer': data.customer || '',
        'Style Number': data.styleNumber || '',
        'Style Name': data.styleName || '',
        'Main Material': mainMaterial,
        'Material Consumption': materialConsumption,
        'Material Price': materialPrice,
        'Trim Cost': (data.trim && data.trim.length > 0 ? data.trim[0].price : '0.00'),
        'Total Material Cost': totalMaterialCost.toFixed(2),
        'Knitting Machine': knittingMachine,
        'Knitting Time': knittingTime,
        'Knitting CPM': knittingCPM,
        'Knitting Cost': knittingCost.toFixed(2),
        'Ops Cost': operationsCost.toFixed(2),
        'Knitting + Ops Cost': (knittingCost + operationsCost).toFixed(2),
        'Packaging': packagingCost.toFixed(2),
        'OH': overhead.toFixed(2),
        'Profit': profit.toFixed(2),
        'FTY Adjustment': '0.00',
        'TTL FTY Cost': totalFactoryCost.toFixed(2)
    };
}
