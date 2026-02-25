/**
 * TNF Ball Caps Cost Breakdown Excel Import Parser
 * Handles parsing of TNF Excel files for ball cap products
 */

class TNFBallCapsImporter {
    constructor() {
        this.supportedFormats = ['.xlsx', '.xls', '.xlsm'];
    }

    extractNumericValue(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const cleaned = String(value).replace(/[$,\s]/g, '').trim();
        if (!cleaned) return null;
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : null;
    }

    normalizeNumericString(value, fallback = '0.00') {
        if (typeof value === 'string') {
            const cleaned = value.replace(/[$,\s]/g, '').trim();
            if (cleaned !== '' && Number.isFinite(Number(cleaned))) {
                return cleaned;
            }
        }
        const numericValue = this.extractNumericValue(value);
        if (numericValue === null) return fallback;
        return String(numericValue);
    }

    formatCalculatedValue(value) {
        if (!Number.isFinite(value)) return '0.00';
        const normalized = value.toFixed(6).replace(/\.?0+$/, '');
        return normalized === '' ? '0.00' : normalized;
    }

    isExcelErrorValue(value) {
        if (value === null || value === undefined) return false;
        const text = String(value).trim().toUpperCase();
        if (!text.startsWith('#')) return false;
        return (
            text.includes('#NAME?') ||
            text.includes('#VALUE!') ||
            text.includes('#DIV/0!') ||
            text.includes('#REF!') ||
            text.includes('#N/A') ||
            text.includes('#NULL!') ||
            text.includes('#NUM!') ||
            text.includes('#SPILL!') ||
            text.includes('#CALC!')
        );
    }

    getHeaderText(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    isHeaderLikeRow(row) {
        const rowText = row.map(cell => this.getHeaderText(cell)).join(' | ');
        return rowText.includes('consumption') || rowText.includes('material price') ||
            rowText.includes('material cost') || rowText.includes('operation') ||
            rowText.includes('smv') || rowText.includes('factory notes') || rowText.includes('cost');
    }

    getDefaultSectionMap(section) {
        const defaults = {
            fabric: { name: 0, consumption: 1, price: 2, cost: 3 },
            embroidery: { name: 0, consumption: 1, price: 2, cost: 3 },
            trim: { name: 0, consumption: 1, price: 2, cost: 3 },
            operations: { name: 0, time: 1, costPerMin: 2, total: 3 },
            packaging: { name: 0, notes: 1, cost: 3 },
            overhead: { name: 0, notes: 1, cost: 3 }
        };
        return defaults[section] || { name: 0, notes: 1, cost: 3 };
    }

    inferSectionMap(section, row) {
        const map = { ...this.getDefaultSectionMap(section) };
        row.forEach((cell, idx) => {
            const text = this.getHeaderText(cell);
            if (!text) return;

            if (['fabric', 'embroidery', 'trim'].includes(section)) {
                if (text.includes('name') || text.includes('description')) map.name = idx;
                if (text.includes('consumption')) map.consumption = idx;
                if (text.includes('material price') || (text.includes('price') && !text.includes('cost'))) map.price = idx;
                if (text.includes('material cost') || text === 'cost' || text.includes('operation cost')) map.cost = idx;
            } else if (section === 'operations') {
                if (text.includes('operation') && !text.includes('time') && !text.includes('cost')) map.name = idx;
                if (text.includes('time') || text === 'smv') map.time = idx;
                if (text.includes('cost (usd/min)') || (text.includes('usd/min') && text.includes('cost'))) map.costPerMin = idx;
                if (text.includes('operation cost') || (text === 'cost' && idx !== map.costPerMin)) map.total = idx;
            } else if (['packaging', 'overhead'].includes(section)) {
                if (text.includes('name') || text.includes('type') || text.includes('overhead') || text.includes('profit')) map.name = idx;
                if (text.includes('notes')) map.notes = idx;
                if (text.includes('cost')) map.cost = idx;
            }
        });
        return map;
    }

    getLastNumericValue(row) {
        for (let i = row.length - 1; i >= 0; i--) {
            const value = this.extractNumericValue(row[i]);
            if (value !== null) return value;
        }
        return null;
    }

    getFirstNonEmptyIndex(row) {
        if (!Array.isArray(row)) return -1;
        for (let i = 0; i < row.length; i++) {
            if (String(row[i] || '').trim() !== '') return i;
        }
        return -1;
    }

    /**
     * Parse TNF Excel data into structured format for ball caps
     * @param {Object|Array} excelData - Raw Excel data from XLSX library (can be array or object with data/images)
     * @returns {Object} Parsed cost breakdown data
     */
    parseExcelData(excelData) {
        this.sectionColumnMap = {};
        this.pendingOperationTime = null;
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

                const leadIdx = this.getFirstNonEmptyIndex(row);
                if (leadIdx === -1) continue;
                const firstCell = String(row[leadIdx] || '').trim();
                const firstCellUpper = firstCell.toUpperCase();
                const nextCell = String(row[leadIdx + 1] || '').trim();
                const next2Cell = String(row[leadIdx + 2] || '').trim();
                
                // Detect sections
                if (firstCellUpper === 'FABRIC' || firstCellUpper === 'FABRIC/S') {
                    currentSection = 'fabric';
                    console.log('🔍 Found FABRIC section');
                } else if (firstCellUpper === 'EMBROIDERY' || firstCellUpper === 'OTHER FABRIC/S - TRIM/S') {
                    currentSection = 'embroidery';
                    console.log('🔍 Found OTHER FABRIC/S - TRIM/S section');
                } else if (firstCellUpper === 'TRIM' || firstCellUpper === 'TRIM/S') {
                    currentSection = 'trim';
                    console.log('🔍 Found TRIM section');
                } else if (firstCellUpper === 'OPERATIONS') {
                    currentSection = 'operations';
                    const possibleTime = this.extractNumericValue(row[leadIdx + 1]);
                    this.pendingOperationTime = possibleTime !== null ? possibleTime : null;
                    console.log('🔍 Found OPERATIONS section - switching to operations parsing');
                } else if (firstCellUpper === 'PACKAGING') {
                    currentSection = 'packaging';
                    console.log('🔍 Found PACKAGING section');
                } else if (firstCellUpper === 'OVERHEAD/ PROFIT' || firstCellUpper === 'OVERHEAD/PROFIT' || firstCellUpper === 'OVERHEAD') {
                    currentSection = 'overhead';
                    console.log('🔍 Found OVERHEAD section');
                } else if (firstCellUpper === 'NOTES' || firstCellUpper === 'NOTE' ||
                           firstCellUpper === 'NOTES:' || firstCellUpper === 'NOTE:' ||
                           firstCellUpper === 'OVERALL NOTES' || firstCellUpper === 'OVERALL NOTES:') {
                    currentSection = 'notes';
                    console.log('🔍 Found NOTES section:', firstCell);
                } else if (firstCellUpper === 'TOTAL FACTORY COST') {
                    console.log('🔍 Found TOTAL FACTORY COST');
                    const totalFactoryValue = this.getLastNumericValue(row);
                    if (totalFactoryValue !== null) {
                        result.totalFactoryCost = this.normalizeNumericString(totalFactoryValue, '0.00');
                    }
                    currentSection = '';
                    // Stop parsing cost sections to avoid reading reference tables below totals.
                    break;
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

                if (currentSection && this.isHeaderLikeRow(row)) {
                    this.sectionColumnMap[currentSection] = this.inferSectionMap(currentSection, row);
                }
                
                // Detect header rows and set current section based on context
                if (firstCell.includes('(Name/Code/Description)Description') && nextCell && nextCell.includes('CONSUMPTION')) {
                    // This is a header row, determine section based on context
                    if (nextCell.includes('YARD') && next2Cell && next2Cell.includes('USD/YD')) {
                        currentSection = 'fabric';
                        console.log('🔍 Found FABRIC header row');
                    } else if (nextCell.includes('PIECE') && next2Cell && next2Cell.includes('USD/PC')) {
                        currentSection = 'trim';
                        console.log('🔍 Found TRIM header row');
                    }
                }
                
                // Detect OTHER FABRIC/S - TRIM/S header
                if (firstCellUpper.includes('OTHER FABRIC/S - TRIM/S') && nextCell && nextCell.includes('CONSUMPTION (YARD)')) {
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
                    !firstCell.includes('TOTAL')) {
                    const map = this.sectionColumnMap.fabric || this.getDefaultSectionMap('fabric');
                    const materialName = String(row[map.name] || firstCell || '').trim();
                    if (!materialName || materialName.startsWith('$') || this.extractNumericValue(materialName) !== null) continue;
                    const costRawValue = row[map.cost] !== undefined ? row[map.cost] : row[leadIdx + 3];
                    if (this.extractNumericValue(costRawValue) === null) continue;
                    const costRaw = this.normalizeNumericString(costRawValue, '0.00');
                    result.fabric.push({
                        material: materialName,
                        consumption: String(row[map.consumption] || row[leadIdx + 1] || ''),
                        price: this.normalizeNumericString(row[map.price] !== undefined ? row[map.price] : row[leadIdx + 2], '0.00'),
                        cost: costRaw
                    });
                    console.log('✅ FABRIC:', firstCell, 'Cost:', costRaw);
                }
                
                if (currentSection === 'embroidery' && firstCell && 
                    !firstCell.includes('EMBROIDERY') && 
                    !firstCell.includes('OTHER FABRIC/S') && 
                    !firstCell.includes('(Name/Code/Description)') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST')) {
                    const map = this.sectionColumnMap.embroidery || this.getDefaultSectionMap('embroidery');
                    const materialName = String(row[map.name] || firstCell || '').trim();
                    if (!materialName || materialName.startsWith('$') || this.extractNumericValue(materialName) !== null) continue;
                    const costRawValue = row[map.cost] !== undefined ? row[map.cost] : row[leadIdx + 3];
                    if (this.extractNumericValue(costRawValue) === null) continue;
                    const costRaw = this.normalizeNumericString(costRawValue, '0.00');
                    result.embroidery.push({
                        material: materialName,
                        consumption: String(row[map.consumption] || row[leadIdx + 1] || ''),
                        price: this.normalizeNumericString(row[map.price] !== undefined ? row[map.price] : row[leadIdx + 2], '0.00'),
                        cost: costRaw
                    });
                    console.log('✅ OTHER FABRIC/S - TRIM/S:', firstCell, 'Cost:', costRaw);
                }
                
                if (currentSection === 'trim' && firstCell && 
                    !firstCell.includes('(Name/Code/Description)') && 
                    !firstCell.includes('CONSUMPTION') && 
                    !firstCell.includes('MATERIAL PRICE') && 
                    !firstCell.includes('MATERIAL COST') && 
                    !firstCell.includes('TOTAL') &&
                    !firstCell.includes('SUB TOTAL')) {
                    const map = this.sectionColumnMap.trim || this.getDefaultSectionMap('trim');
                    const materialName = String(row[map.name] || firstCell || '').trim();
                    if (!materialName || materialName.startsWith('$') || this.extractNumericValue(materialName) !== null) continue;
                    const costRawValue = row[map.cost] !== undefined ? row[map.cost] : row[leadIdx + 3];
                    if (this.extractNumericValue(costRawValue) === null) continue;
                    const costRaw = this.normalizeNumericString(costRawValue, '0.00');
                    result.trim.push({
                        material: materialName,
                        consumption: String(row[map.consumption] || row[leadIdx + 1] || ''),
                        price: this.normalizeNumericString(row[map.price] !== undefined ? row[map.price] : row[leadIdx + 2], '0.00'),
                        cost: costRaw
                    });
                    console.log('✅ TRIM:', firstCell, 'Cost:', costRaw);
                }

                if (currentSection === 'operations' &&
                    !firstCell.includes('OPERATIONS') &&
                    !firstCell.includes('SMV') &&
                    !firstCell.includes('COST') &&
                    !firstCell.includes('USD') &&
                    !firstCell.includes('TOTAL') &&
                    !firstCell.includes('SUB TOTAL')) {
                    const map = this.sectionColumnMap.operations || this.getDefaultSectionMap('operations');
                    const col1 = this.extractNumericValue(row[1]);
                    const col2 = this.extractNumericValue(row[2]);
                    const col3 = this.extractNumericValue(row[3]);
                    const isNumericTriple = col1 !== null && col2 !== null && col3 !== null;

                    const operationLabel = String(row[map.name] || row[0] || '').trim();
                    const timeRaw = isNumericTriple ? row[1] : (row[map.time] !== undefined ? row[map.time] : row[1]);
                    const costPerMinRaw = isNumericTriple ? row[2] : (row[map.costPerMin] !== undefined ? row[map.costPerMin] : row[2]);
                    const totalRaw = isNumericTriple ? row[3] : (row[map.total] !== undefined ? row[map.total] : row[3]);

                    const parsedTime = this.isExcelErrorValue(timeRaw) ? null : this.extractNumericValue(timeRaw);
                    const parsedCostPerMin = this.isExcelErrorValue(costPerMinRaw) ? null : this.extractNumericValue(costPerMinRaw);
                    const parsedTotal = this.isExcelErrorValue(totalRaw) ? null : this.extractNumericValue(totalRaw);

                    // Template pattern support:
                    // Row A: "OPERATIONS | 52 | SMV | COST (USD/MIN)"
                    // Row B: "" | "" | 0.02 | 1.04
                    const looksLikeSingleSummaryRow =
                        this.pendingOperationTime !== null &&
                        operationLabel === '' &&
                        parsedTime !== null &&
                        parsedTotal !== null &&
                        this.extractNumericValue(row[1]) === null;

                    // Keep only rows with real numeric operation data.
                    const hasOperationData = parsedTotal !== null || parsedCostPerMin !== null || parsedTime !== null;
                    const canUseUnlabeledRow = looksLikeSingleSummaryRow;
                    const hasValidLabel = operationLabel !== '' && !this.isExcelErrorValue(operationLabel);
                    if (!canUseUnlabeledRow && !hasValidLabel) continue;
                    if (hasOperationData) {
                        const resolvedTime = looksLikeSingleSummaryRow
                            ? this.pendingOperationTime
                            : parsedTime;
                        const resolvedSmv = looksLikeSingleSummaryRow
                            ? parsedTime
                            : parsedTime;
                        const resolvedCostPerMin = looksLikeSingleSummaryRow
                            ? parsedTime
                            : parsedCostPerMin;
                        const operationData = {
                            operation: hasValidLabel ? operationLabel : `Operation ${result.operations.length + 1}`,
                            time: resolvedTime !== null ? this.normalizeNumericString(resolvedTime, '0.00') : String(timeRaw || '').trim(),
                            smv: resolvedSmv !== null ? this.normalizeNumericString(resolvedSmv, '0.00') : '',
                            costPerMin: resolvedCostPerMin !== null ? this.normalizeNumericString(resolvedCostPerMin, '0.00') : '0.00',
                            total: parsedTotal !== null
                                ? this.normalizeNumericString(parsedTotal, '0.00')
                                : ((resolvedTime !== null && resolvedCostPerMin !== null) ? this.formatCalculatedValue(resolvedTime * resolvedCostPerMin) : '')
                        };

                        // Avoid duplicate push when same row gets picked by fallback.
                        const duplicate = result.operations.some(op =>
                            op.operation === operationData.operation &&
                            String(op.smv || op.time || '') === String(operationData.smv || operationData.time || '') &&
                            String(op.costPerMin || '') === String(operationData.costPerMin || '') &&
                            String(op.total || '') === String(operationData.total || '')
                        );
                        if (!duplicate) {
                            result.operations.push(operationData);
                            console.log('✅ OPERATION:', operationData);
                            if (looksLikeSingleSummaryRow) {
                                this.pendingOperationTime = null;
                            }
                        }
                    }
                }
                
                // Fallback operations detection - look for rows with SMV and cost data
                // This runs for ALL rows, not just when no section is detected
                if (currentSection === '' &&
                    !firstCell.includes('FABRIC') && !firstCell.includes('TRIM') && 
                    !firstCell.includes('PACKAGING') && !firstCell.includes('OVERHEAD') &&
                    !firstCell.includes('TOTAL') && !firstCell.includes('SUB TOTAL') &&
                    !firstCell.includes('YARN') && !firstCell.includes('KNITTING') &&
                    !firstCell.includes('OPERATIONS') && !firstCell.includes('SMV') &&
                    !firstCell.includes('COST') && !firstCell.includes('USD')) {
                    
                    // Check if this row has operations-like data:
                    // OPERATION | TIME/SMV | COST (USD/MIN) | OPERATION COST
                    const map = this.sectionColumnMap.operations || this.getDefaultSectionMap('operations');
                    const col1 = this.extractNumericValue(row[1]);
                    const col2 = this.extractNumericValue(row[2]);
                    const col3 = this.extractNumericValue(row[3]);
                    if (!firstCell || this.isExcelErrorValue(firstCell)) continue;
                    const fallbackTimeOrSmv = (col1 !== null && col2 !== null && col3 !== null) ? col1 : (this.isExcelErrorValue(row[map.time]) ? null : this.extractNumericValue(row[map.time]));
                    const fallbackCostPerMin = (col1 !== null && col2 !== null && col3 !== null) ? col2 : (this.isExcelErrorValue(row[map.costPerMin]) ? null : this.extractNumericValue(row[map.costPerMin]));
                    const fallbackOperationCost = (col1 !== null && col2 !== null && col3 !== null) ? col3 : (this.isExcelErrorValue(row[map.total]) ? null : this.extractNumericValue(row[map.total]));
                    if (fallbackOperationCost !== null || (fallbackTimeOrSmv !== null && fallbackCostPerMin !== null)) {
                        console.log(`🔍 Fallback operations detection - Row ${i}:`, firstCell, '|', row[1], '|', row[2], '|', row[3]);
                        
                        let smv = (col1 !== null && col2 !== null && col3 !== null)
                            ? this.normalizeNumericString(row[1], '0.00')
                            : this.normalizeNumericString(row[map.time], '0.00');
                        let costPerMin = (col1 !== null && col2 !== null && col3 !== null)
                            ? this.normalizeNumericString(row[2], '0.00')
                            : this.normalizeNumericString(row[map.costPerMin], '0.00');
                        let total = '';
                        
                        // Prefer provided OPERATION COST, otherwise compute.
                        if (fallbackOperationCost !== null) {
                            total = this.normalizeNumericString(fallbackOperationCost, '0.00');
                        } else if (fallbackTimeOrSmv !== null && fallbackCostPerMin !== null) {
                            total = this.formatCalculatedValue(fallbackTimeOrSmv * fallbackCostPerMin);
                        }
                        
                        const operationData = {
                            operation: firstCell && firstCell.trim() !== '' ? firstCell.trim() : `Operation ${result.operations.length + 1}`,
                            smv: smv,
                            costPerMin: costPerMin,
                            total: total
                        };
                        
                        console.log('🔍 Adding fallback operation:', operationData);
                        result.operations.push(operationData);
                    }
                }
                
                if (currentSection === 'packaging' && firstCell && !firstCell.includes('PACKAGING') && !firstCell.includes('Factory Notes') && !firstCell.includes('TOTAL')) {
                    const map = this.sectionColumnMap.packaging || this.getDefaultSectionMap('packaging');
                    const packagingCostRaw = row[map.cost] !== undefined ? row[map.cost] : row[leadIdx + 2];
                    if (this.extractNumericValue(packagingCostRaw) !== null) {
                        const costRaw = this.normalizeNumericString(packagingCostRaw, '0.00');
                        result.packaging.push({
                            type: firstCell,
                            notes: String(row[map.notes] || row[leadIdx + 1] || ''),
                            cost: costRaw
                        });
                        console.log('✅ PACKAGING:', firstCell, 'Cost:', costRaw);
                    }
                }
                
                if (currentSection === 'overhead' && firstCell && !firstCell.includes('OVERHEAD/ PROFIT') && !firstCell.includes('Factory Notes') && !firstCell.includes('TOTAL')) {
                    console.log(`🔍 Checking OVERHEAD: "${firstCell}" - Row:`, row, 'Cost in col 3:', row[3], 'Is number:', !isNaN(parseFloat(row[3])));
                    const map = this.sectionColumnMap.overhead || this.getDefaultSectionMap('overhead');
                    const overheadCostRaw = row[map.cost] !== undefined ? row[map.cost] : row[leadIdx + 2];
                    if (this.extractNumericValue(overheadCostRaw) !== null) {
                        const costRaw = this.normalizeNumericString(overheadCostRaw, '0.00');
                        result.overhead.push({
                            type: firstCell,
                            notes: String(row[map.notes] || row[leadIdx + 1] || ''),
                            cost: costRaw
                        });
                        console.log('✅ OVERHEAD:', firstCell, 'Notes:', row[1], 'Cost:', costRaw);
                    }
                }
                
                // Parse notes in main loop
                if (currentSection === 'notes' && firstCell && !firstCell.includes('NOTES') && !firstCell.includes('NOTE')) {
                    if (firstCell.trim()) {
                        if (!result.notes) result.notes = '';
                        result.notes += (result.notes ? '\n' : '') + firstCell.trim();
                        console.log('📝 Added note in main loop:', firstCell.trim());
                    }
                }
                
                // Extract totals
                const rowTotalValue = this.getLastNumericValue(row);
                if (firstCell.includes('TOTAL MATERIAL') && rowTotalValue !== null) {
                    result.totalMaterialCost = this.normalizeNumericString(rowTotalValue, '0.00');
                    console.log('✅ Material Total:', result.totalMaterialCost);
                }
                if (firstCell.includes('TOTAL FACTORY') && rowTotalValue !== null) {
                    result.totalFactoryCost = this.normalizeNumericString(rowTotalValue, '0.00');
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
            
            // Look for Notes section header - enhanced detection
            const isNotesHeader = (
                firstCell.toLowerCase() === 'notes' || 
                firstCell.toLowerCase() === 'note' ||
                firstCell.toLowerCase() === 'notes:' ||
                firstCell.toLowerCase() === 'note:' ||
                firstCell.toLowerCase() === 'overall notes' ||
                firstCell.toLowerCase() === 'overall notes:' ||
                allRowContent.toLowerCase() === 'notes' || 
                allRowContent.toLowerCase() === 'note' ||
                allRowContent.toLowerCase() === 'notes:' ||
                allRowContent.toLowerCase() === 'note:' ||
                allRowContent.toLowerCase() === 'overall notes' ||
                allRowContent.toLowerCase() === 'overall notes:' ||
                firstCell.toLowerCase().includes('notes') ||
                allRowContent.toLowerCase().includes('notes')
            );
            
            if (isNotesHeader) {
                inNotesSection = true;
                console.log('✅ Found Notes section header at row', i, ':', firstCell);
                console.log('🔍 Notes header detection - firstCell:', firstCell, 'allRowContent:', allRowContent);
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
                
                // Skip operations header mixed with notes content
                if (allRowContent.includes('OPERATIONS BLANK SMV COST (USD/MIN)')) {
                    console.log('⚠️ Skipped operations header mixed with notes:', allRowContent.trim());
                    continue;
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
            const newNotes = notesContent.join('\n');
            if (result.notes) {
                result.notes = result.notes + '\n' + newNotes;
                console.log('✅ Notes extracted and appended (', notesContent.length, 'lines):', newNotes.substring(0, 200) + '...');
            } else {
                result.notes = newNotes;
                console.log('✅ Notes extracted (', notesContent.length, 'lines):', result.notes.substring(0, 200) + '...');
            }
        } else {
            console.log('⚠️ No notes section found - trying fallback detection');
            
            // Fallback: Look for rows that might contain notes content
            let fallbackNotes = [];
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;
                
                const firstCell = String(row[0] || '').trim();
                const allRowContent = row.filter(cell => cell && String(cell).trim() !== '').join(' ');
                
                // Look for rows that might be notes (contain common note keywords)
                if (allRowContent.toLowerCase().includes('surcharge') || 
                    allRowContent.toLowerCase().includes('suggest') ||
                    allRowContent.toLowerCase().includes('recommend') ||
                    allRowContent.toLowerCase().includes('note') ||
                    allRowContent.toLowerCase().includes('moq') ||
                    allRowContent.toLowerCase().includes('minimum') ||
                    allRowContent.toLowerCase().includes('fabric') ||
                    allRowContent.toLowerCase().includes('color') ||
                    allRowContent.toLowerCase().includes('visor') ||
                    allRowContent.toLowerCase().includes('sweatband')) {
                    
                    // Skip if it looks like data rows (numbers, costs, etc.)
                    if (!allRowContent.match(/^\d+\.?\d*$/) && 
                        !allRowContent.match(/^\$?\d+\.?\d*$/) &&
                        !allRowContent.match(/^\d+ \d+\.?\d* \d+\.?\d*$/)) {
                        
                        fallbackNotes.push(allRowContent.trim());
                        console.log('🔍 Fallback notes found at row', i, ':', allRowContent.trim());
                    }
                }
            }
            
            if (fallbackNotes.length > 0) {
                result.notes = fallbackNotes.join('\n');
                console.log('✅ Fallback notes extracted (', fallbackNotes.length, 'lines):', result.notes.substring(0, 200) + '...');
            } else {
                console.log('❌ No notes found with fallback detection either');
            }
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
                    // OPERATION | TIME/SMV | COST (USD/MIN) | OPERATION COST
                    const col1 = this.extractNumericValue(row[1]);
                    const col2 = this.extractNumericValue(row[2]);
                    const col3 = this.extractNumericValue(row[3]);
                    let smv = (col1 !== null && col2 !== null && col3 !== null) ? String(row[1] || '') : String(row[1] || '');
                    let costPerMin = (col1 !== null && col2 !== null && col3 !== null) ? String(row[2] || '') : String(row[2] || '');
                    let total = '';
                    
                    console.log('🔍 Operations data - SMV:', smv, 'CostPerMin:', costPerMin);
                    
                    // Prefer explicit OPERATION COST (col 3); otherwise compute.
                    const parsedOperationCost = this.extractNumericValue(row[3]);
                    const parsedSmv = this.extractNumericValue(row[1]);
                    const parsedCostPerMin = this.extractNumericValue(row[2]);
                    if (parsedOperationCost !== null) {
                        total = this.normalizeNumericString(parsedOperationCost, '0.00');
                    } else if (parsedSmv !== null && parsedCostPerMin !== null) {
                        total = this.formatCalculatedValue(parsedSmv * parsedCostPerMin);
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
        return this.extractNumericValue(row[3]) !== null;
    }

    hasTrimData(row) {
        return this.extractNumericValue(row[3]) !== null;
    }

    hasEmbroideryData(row) {
        return this.extractNumericValue(row[3]) !== null;
    }

    hasOperationsData(row) {
        // Check for SMV in column 2 and COST in column 3
        const hasSMV = this.extractNumericValue(row[2]) !== null;
        const hasCost = this.extractNumericValue(row[3]) !== null;
        const result = hasSMV || hasCost;
        
        if (result) {
            console.log('🔍 Found operations data in row:', row, 'SMV:', hasSMV, 'Cost:', hasCost);
        }
        
        return result;
    }

    hasPackagingData(row) {
        return this.extractNumericValue(row[3]) !== null;
    }

    hasOverheadData(row) {
        return this.extractNumericValue(row[3]) !== null;
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

