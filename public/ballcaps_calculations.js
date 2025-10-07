/**
 * Ballcaps Costing Template - Calculation Functions
 * Extracted from the main application for standalone use
 */

class BallcapsCalculator {
    constructor() {
        this.debugMode = true;
    }

    /**
     * Calculate cost for a single row
     * @param {HTMLElement} cell - The cell that was edited
     */
    calculateRowCost(cell) {
        const row = cell.closest('.cost-row');
        if (!row) {
            this.log('❌ No row found for cell');
            return;
        }
        
        const cells = row.querySelectorAll('.cost-cell');
        this.log('🔍 Row has', cells.length, 'cells');
        
        if (cells.length >= 4) {
            // For 4-column sections: description, consumption, price, cost
            const consumptionCell = cells[1];
            const priceCell = cells[2];
            const costCell = cells[3];
            
            const consumption = parseFloat(consumptionCell.textContent) || 0;
            const price = parseFloat(priceCell.textContent) || 0;
            const cost = consumption * price;
            
            this.log('🧮 Calculation:', consumption, '×', price, '=', cost);
            
            if (consumption > 0 && price > 0) {
                costCell.textContent = '$' + cost.toFixed(2);
                this.log('✅ Updated cost cell to:', costCell.textContent);
            }
        } else if (cells.length === 3) {
            // For 3-column sections: description, notes, cost
            this.log('ℹ️ 3-column section - no automatic calculation');
        }
    }

    /**
     * Calculate total for a specific section
     * @param {HTMLElement} section - The section element
     * @returns {number} - The total cost for the section
     */
    calculateSectionTotal(section) {
        let total = 0;
        const rows = section.querySelectorAll('.cost-row:not(.header-row):not(.subtotal-row)');
        this.log('🔍 Calculating section total for', rows.length, 'rows');
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('.cost-cell');
            if (cells.length >= 4) {
                // For ballcaps sections with 4 columns: description, consumption, price, cost
                const costText = cells[3].textContent.replace('$', '').trim();
                const cost = parseFloat(costText) || 0;
                this.log(`Row ${index}: cost="${costText}" -> ${cost}`);
                total += cost;
            } else if (cells.length === 3) {
                // For sections with 3 columns: description, notes, cost
                const costText = cells[2].textContent.replace('$', '').trim();
                const cost = parseFloat(costText) || 0;
                this.log(`Row ${index}: cost="${costText}" -> ${cost}`);
                total += cost;
            }
        });
        
        this.log('📊 Section total:', total);
        return total;
    }

    /**
     * Update subtotal for a section
     * @param {HTMLElement} section - The section element
     * @param {number} total - The total to display
     */
    updateSubtotal(section, total) {
        const subtotalRow = section.querySelector('.subtotal-row');
        if (subtotalRow) {
            const costCell = subtotalRow.querySelector('.cost-cell:last-child');
            if (costCell) {
                costCell.textContent = '$' + total.toFixed(2);
                this.log('✅ Updated subtotal to:', costCell.textContent);
            } else {
                this.log('❌ No cost cell found in subtotal row');
            }
        } else {
            this.log('❌ No subtotal row found in section');
        }
    }

    /**
     * Calculate and update all ballcaps template calculations
     */
    calculateBallCapsTemplate() {
        this.log('🧮 Calculating ballcaps template...');
        
        // Find sections by their headers
        const sections = document.querySelectorAll('#ballcapsBreakdown .cost-section');
        this.log('Found', sections.length, 'sections in ballcaps template');
        
        let fabricSection = null;
        let otherFabricSection = null;
        let trimSection = null;
        let operationsSection = null;
        let packagingSection = null;
        let overheadSection = null;
        
        sections.forEach((section, index) => {
            const header = section.querySelector('.section-header');
            if (header) {
                const headerText = header.textContent.trim();
                this.log(`Section ${index}: "${headerText}"`);
                
                if (headerText === 'FABRIC/S') {
                    fabricSection = section;
                    this.log('✅ Found FABRIC/S section');
                } else if (headerText === 'OTHER FABRIC/S - TRIM/S') {
                    otherFabricSection = section;
                    this.log('✅ Found OTHER FABRIC/S - TRIM/S section');
                } else if (headerText === 'TRIM/S') {
                    trimSection = section;
                    this.log('✅ Found TRIM/S section');
                } else if (headerText === 'OPERATIONS') {
                    operationsSection = section;
                    this.log('✅ Found OPERATIONS section');
                } else if (headerText === 'PACKAGING') {
                    packagingSection = section;
                    this.log('✅ Found PACKAGING section');
                } else if (headerText === 'OVERHEAD/PROFIT') {
                    overheadSection = section;
                    this.log('✅ Found OVERHEAD/PROFIT section');
                }
            }
        });
        
        // Calculate material costs
        let totalMaterialCost = 0;
        
        if (fabricSection) {
            const fabricTotal = this.calculateSectionTotal(fabricSection);
            this.log('🧮 FABRIC/S total:', fabricTotal);
            this.updateSubtotal(fabricSection, fabricTotal);
            totalMaterialCost += fabricTotal;
        } else {
            this.log('❌ FABRIC/S section not found');
        }
        
        if (otherFabricSection) {
            const otherFabricTotal = this.calculateSectionTotal(otherFabricSection);
            this.log('🧮 OTHER FABRIC/S - TRIM/S total:', otherFabricTotal);
            this.updateSubtotal(otherFabricSection, otherFabricTotal);
            totalMaterialCost += otherFabricTotal;
        } else {
            this.log('❌ OTHER FABRIC/S - TRIM/S section not found');
        }
        
        if (trimSection) {
            const trimTotal = this.calculateSectionTotal(trimSection);
            this.log('🧮 TRIM/S total:', trimTotal);
            this.updateSubtotal(trimSection, trimTotal);
            totalMaterialCost += trimTotal;
        } else {
            this.log('❌ TRIM/S section not found');
        }
        
        // Calculate factory costs
        let totalFactoryCost = 0;
        
        if (operationsSection) {
            const operationsTotal = this.calculateSectionTotal(operationsSection);
            this.log('🧮 OPERATIONS total:', operationsTotal);
            this.updateSubtotal(operationsSection, operationsTotal);
            totalFactoryCost += operationsTotal;
        } else {
            this.log('❌ OPERATIONS section not found');
        }
        
        if (packagingSection) {
            const packagingTotal = this.calculateSectionTotal(packagingSection);
            this.log('🧮 PACKAGING total:', packagingTotal);
            this.updateSubtotal(packagingSection, packagingTotal);
            totalFactoryCost += packagingTotal;
        } else {
            this.log('❌ PACKAGING section not found');
        }
        
        if (overheadSection) {
            const overheadTotal = this.calculateSectionTotal(overheadSection);
            this.log('🧮 OVERHEAD/PROFIT total:', overheadTotal);
            this.updateSubtotal(overheadSection, overheadTotal);
            totalFactoryCost += overheadTotal;
        } else {
            this.log('❌ OVERHEAD/PROFIT section not found');
        }
        
        // Update grand totals
        const materialTotalElement = document.querySelector('#ballcapsBreakdown .material-total');
        const factoryTotalElement = document.querySelector('#ballcapsBreakdown .factory-total');
        
        if (materialTotalElement) {
            materialTotalElement.textContent = '$' + totalMaterialCost.toFixed(2);
        }
        
        if (factoryTotalElement) {
            factoryTotalElement.textContent = '$' + totalFactoryCost.toFixed(2);
        }
        
        this.log('✅ Ballcaps template calculations complete');
        this.log('Material Total:', totalMaterialCost.toFixed(2));
        this.log('Factory Total:', totalFactoryCost.toFixed(2));
    }

    /**
     * Add event listeners for ballcaps template real-time calculations
     */
    addBallCapsCalculationEventListeners() {
        this.log('🔧 Adding ballcaps calculation event listeners...');
        
        // Add input event listeners to all cost cells in ballcaps template
        const costSections = document.querySelectorAll('#ballcapsBreakdown .cost-section');
        this.log('Found cost sections:', costSections.length);
        
        costSections.forEach((section, sectionIndex) => {
            const inputCells = section.querySelectorAll('.cost-cell:not(.header-row .cost-cell):not(.subtotal-row .cost-cell)');
            this.log(`Section ${sectionIndex}: Found ${inputCells.length} input cells`);
            
            inputCells.forEach((cell, cellIndex) => {
                // Make cells editable
                cell.contentEditable = true;
                cell.style.border = '1px solid #ddd';
                cell.style.padding = '4px';
                cell.style.minHeight = '20px';
                
                // Add event listener for input changes
                cell.addEventListener('input', function() {
                    this.log('📝 Cell input detected:', this.textContent);
                    
                    // Calculate individual row cost if this is a consumption or price cell
                    this.calculateRowCost(this);
                    
                    // Debounce the full template calculation
                    clearTimeout(this.calculationTimeout);
                    this.calculationTimeout = setTimeout(() => {
                        this.calculateBallCapsTemplate();
                    }, 500);
                }.bind(this));
            });
        });
        
        this.log('✅ Ballcaps calculation event listeners added');
    }

    /**
     * Calculate material total from parsed data
     * @param {Object} parsedData - The parsed data object
     * @returns {string} - The material total as a string
     */
    calculateMaterialTotal(parsedData) {
        let total = 0;
        
        // Add fabric costs
        if (parsedData.fabric && parsedData.fabric.length > 0) {
            total += parsedData.fabric.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        }
        
        // Add other fabric/s - trim/s costs (stored as embroidery data)
        if (parsedData.embroidery && parsedData.embroidery.length > 0) {
            total += parsedData.embroidery.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        }
        
        // Add trim costs
        if (parsedData.trim && parsedData.trim.length > 0) {
            total += parsedData.trim.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        }
        
        return total.toFixed(2);
    }

    /**
     * Calculate factory total from parsed data
     * @param {Object} parsedData - The parsed data object
     * @returns {string} - The factory total as a string
     */
    calculateFactoryTotal(parsedData) {
        let total = 0;
        
        // Add operations costs
        if (parsedData.operations && parsedData.operations.length > 0) {
            total += parsedData.operations.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        }
        
        // Add packaging costs
        if (parsedData.packaging && parsedData.packaging.length > 0) {
            total += parsedData.packaging.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        }
        
        // Add overhead costs
        if (parsedData.overhead && parsedData.overhead.length > 0) {
            total += parsedData.overhead.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        }
        
        return total.toFixed(2);
    }

    /**
     * Calculate ballcaps subtotals from parsed data
     * @param {Object} parsedData - The parsed data object
     */
    calculateBallCapsSubtotals(parsedData) {
        this.log('Calculating BallCaps subtotals...');
        
        // Calculate fabric/s subtotal
        if (parsedData.fabric && parsedData.fabric.length > 0) {
            const fabricTotal = parsedData.fabric.reduce((sum, item) => {
                return sum + (parseFloat(item.cost) || 0);
            }, 0);
            this.updateBallCapsSubtotal('#ballcapsBreakdown .cost-section:nth-child(1)', fabricTotal);
        }
        
        // Calculate other fabric/s - trim/s subtotal (formerly embroidery)
        if (parsedData.embroidery && parsedData.embroidery.length > 0) {
            const otherFabricTotal = parsedData.embroidery.reduce((sum, item) => {
                return sum + (parseFloat(item.cost) || 0);
            }, 0);
            this.updateBallCapsSubtotal('#ballcapsBreakdown .cost-section:nth-child(2)', otherFabricTotal);
        }
        
        // Calculate trim subtotal
        if (parsedData.trim && parsedData.trim.length > 0) {
            const trimTotal = parsedData.trim.reduce((sum, item) => {
                return sum + (parseFloat(item.cost) || 0);
            }, 0);
            this.updateBallCapsSubtotal('#ballcapsBreakdown .cost-section:nth-child(3)', trimTotal);
        }
        
        // Calculate operations subtotal
        if (parsedData.operations && parsedData.operations.length > 0) {
            const operationsTotal = parsedData.operations.reduce((sum, item) => {
                return sum + (parseFloat(item.total) || 0);
            }, 0);
            this.updateBallCapsSubtotal('#ballcapsBreakdown .cost-section:nth-child(5)', operationsTotal);
        }
        
        // Calculate packaging subtotal
        if (parsedData.packaging && parsedData.packaging.length > 0) {
            const packagingTotal = parsedData.packaging.reduce((sum, item) => {
                return sum + (parseFloat(item.cost) || 0);
            }, 0);
            this.updateBallCapsSubtotal('#ballcapsBreakdown .cost-section:nth-child(6)', packagingTotal);
        }
        
        // Calculate overhead subtotal
        if (parsedData.overhead && parsedData.overhead.length > 0) {
            const overheadTotal = parsedData.overhead.reduce((sum, item) => {
                return sum + (parseFloat(item.cost) || 0);
            }, 0);
            this.updateBallCapsSubtotal('#ballcapsBreakdown .cost-section:nth-child(7)', overheadTotal);
        }
    }

    /**
     * Update ballcaps subtotal for a specific section
     * @param {string} selector - CSS selector for the section
     * @param {number} total - The total to display
     */
    updateBallCapsSubtotal(selector, total) {
        const section = document.querySelector(selector);
        if (section) {
            const subtotalRow = section.querySelector('.subtotal-row');
            if (subtotalRow) {
                const costCell = subtotalRow.querySelector('.cost-cell:last-child');
                if (costCell) {
                    costCell.textContent = '$' + total.toFixed(2);
                }
            }
        }
    }

    /**
     * Calculate ballcaps grand totals from parsed data
     * @param {Object} parsedData - The parsed data object
     * @returns {Object} - Object containing materialTotal and factoryTotal
     */
    calculateBallCapsGrandTotals(parsedData) {
        this.log('Calculating BallCaps grand totals...');
        
        // Use the parsed totals from Excel if available, otherwise calculate
        const materialTotal = parsedData.totalMaterialCost || this.calculateMaterialTotal(parsedData);
        this.log('Material Total (from Excel):', parsedData.totalMaterialCost, 'Calculated:', this.calculateMaterialTotal(parsedData));
        
        const factoryTotal = parsedData.totalFactoryCost || this.calculateFactoryTotal(parsedData);
        this.log('Factory Total (from Excel):', parsedData.totalFactoryCost, 'Calculated:', this.calculateFactoryTotal(parsedData));
        
        return { materialTotal, factoryTotal };
    }

    /**
     * Log message if debug mode is enabled
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this.debugMode) {
            console.log(...args);
        }
    }

    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BallcapsCalculator;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.BallcapsCalculator = BallcapsCalculator;
}
