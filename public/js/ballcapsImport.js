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
            totalFactoryCost: "0.00"
        };

        // Parse the Excel data based on the TNF ball caps format
        let currentSection = '';
        let materialCostTotal = 0;
        let factoryCostTotal = 0;

        for (let i = 0; i < excelData.length; i++) {
            const row = excelData[i];
            if (!row || row.length === 0) continue;

            const firstCell = String(row[0] || '').trim();

            // Extract basic info from specific rows
            this.extractBasicInfo(result, row, i);

            // Parse sections
            currentSection = this.parseSectionHeader(firstCell, currentSection);

            // Skip empty rows and headers
            if (!firstCell || firstCell === ' ' || firstCell.includes('TOTAL') || firstCell.includes('SUB TOTAL')) {
                continue;
            }

            // Parse data based on current section
            const costs = this.parseSectionData(result, currentSection, row, firstCell);
            materialCostTotal += costs.material;
            factoryCostTotal += costs.factory;

            // Extract totals
            this.extractTotals(result, firstCell, row);
        }

        // Use calculated totals if extraction didn't work
        if (result.totalMaterialCost === "0.00" && materialCostTotal > 0) {
            result.totalMaterialCost = materialCostTotal.toFixed(2);
        }
        if (result.totalFactoryCost === "0.00" && factoryCostTotal > 0) {
            result.totalFactoryCost = factoryCostTotal.toFixed(2);
        }

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
            'TRIM': 'trim',
            'EMBROIDERY': 'embroidery',
            'OPERATIONS': 'operations',
            'PACKAGING': 'packaging',
            'OVERHEAD/ PROFIT': 'overhead'
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
        return row[1] && row[2] && row[3] && !isNaN(parseFloat(row[3]));
    }

    hasTrimData(row) {
        return row[3] && !isNaN(parseFloat(row[3]));
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
