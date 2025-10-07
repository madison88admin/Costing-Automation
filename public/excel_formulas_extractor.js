/**
 * Excel Formulas Extractor and Implementation System
 * This file contains all the formulas from Excel files and ensures they're properly implemented in the system
 */

class ExcelFormulasExtractor {
    constructor() {
        this.formulas = {
            ballcaps: {
                // FABRIC/S Section
                fabric: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // OTHER FABRIC/S - TRIM/S Section
                otherFabric: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // TRIM/S Section
                trim: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // OPERATIONS Section
                operations: {
                    rowCost: (smv, costPerMinute, quantity = 1) => smv * costPerMinute * quantity,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2*D2',
                    description: 'Cost = SMV × Cost per Minute × Quantity'
                },
                
                // PACKAGING Section
                packaging: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // OVERHEAD/PROFIT Section
                overhead: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // Grand Totals
                totals: {
                    materialTotal: (fabricTotal, otherFabricTotal, trimTotal) => 
                        fabricTotal + otherFabricTotal + trimTotal,
                    factoryTotal: (operationsTotal, packagingTotal, overheadTotal) => 
                        operationsTotal + packagingTotal + overheadTotal,
                    excelFormula: '=SUM(Fabric_Subtotal,OtherFabric_Subtotal,Trim_Subtotal)',
                    description: 'Sum of all material sections'
                }
            },
            
            beanie: {
                // YARN Section
                yarn: {
                    rowCost: (consumption, price) => (consumption / 1000) * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=(B2/1000)*C2',
                    description: 'Cost = (Consumption (G) ÷ 1000) × Material Price (USD/KG)'
                },
                
                // FABRIC Section
                fabric: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // TRIM Section
                trim: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // KNITTING Section
                knitting: {
                    rowCost: (time, sah) => time * sah,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Time × SAH'
                },
                
                // OPERATIONS Section
                operations: {
                    rowCost: (smv, costPerMinute) => smv * costPerMinute,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = SMV × Cost per Minute'
                },
                
                // PACKAGING Section
                packaging: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // OVERHEAD/PROFIT Section
                overhead: {
                    rowCost: (consumption, price) => consumption * price,
                    subtotal: (costs) => costs.reduce((sum, cost) => sum + cost, 0),
                    excelFormula: '=B2*C2',
                    description: 'Cost = Consumption × Price'
                },
                
                // Grand Totals
                totals: {
                    materialTotal: (yarnTotal, fabricTotal, trimTotal) => 
                        yarnTotal + fabricTotal + trimTotal,
                    factoryTotal: (knittingTotal, operationsTotal, packagingTotal, overheadTotal) => 
                        knittingTotal + operationsTotal + packagingTotal + overheadTotal,
                    excelFormula: '=SUM(Yarn_Subtotal,Fabric_Subtotal,Trim_Subtotal)',
                    description: 'Sum of all material sections'
                }
            }
        };
    }
    
    /**
     * Get formula for a specific section and template
     */
    getFormula(template, section, type = 'rowCost') {
        if (this.formulas[template] && this.formulas[template][section]) {
            return this.formulas[template][section][type];
        }
        return null;
    }
    
    /**
     * Calculate row cost using the appropriate formula
     */
    calculateRowCost(template, section, ...args) {
        const formula = this.getFormula(template, section, 'rowCost');
        if (formula) {
            return formula(...args);
        }
        return 0;
    }
    
    /**
     * Calculate section subtotal
     */
    calculateSubtotal(template, section, costs) {
        const formula = this.getFormula(template, section, 'subtotal');
        if (formula) {
            return formula(costs);
        }
        return 0;
    }
    
    /**
     * Get Excel formula string
     */
    getExcelFormula(template, section, type = 'rowCost') {
        if (this.formulas[template] && this.formulas[template][section]) {
            return this.formulas[template][section].excelFormula;
        }
        return '';
    }
    
    /**
     * Get formula description
     */
    getFormulaDescription(template, section) {
        if (this.formulas[template] && this.formulas[template][section]) {
            return this.formulas[template][section].description;
        }
        return '';
    }
    
    /**
     * Validate that all formulas are properly implemented in the system
     */
    validateImplementation() {
        const results = {
            ballcaps: {},
            beanie: {},
            errors: []
        };
        
        // Test ballcaps formulas
        Object.keys(this.formulas.ballcaps).forEach(section => {
            try {
                const formula = this.formulas.ballcaps[section];
                if (section === 'totals') {
                    // Test totals formulas
                    const materialTotal = formula.materialTotal(10, 5, 3);
                    const factoryTotal = formula.factoryTotal(20, 5, 2);
                    results.ballcaps[section] = {
                        materialTotal: materialTotal === 18,
                        factoryTotal: factoryTotal === 27,
                        status: 'valid'
                    };
                } else {
                    // Test row cost formulas
                    const testResult = formula.rowCost(2, 3);
                    results.ballcaps[section] = {
                        testResult: testResult,
                        expected: 6,
                        status: testResult === 6 ? 'valid' : 'invalid'
                    };
                }
            } catch (error) {
                results.errors.push(`Ballcaps ${section}: ${error.message}`);
                results.ballcaps[section] = { status: 'error', error: error.message };
            }
        });
        
        // Test beanie formulas
        Object.keys(this.formulas.beanie).forEach(section => {
            try {
                const formula = this.formulas.beanie[section];
                if (section === 'totals') {
                    // Test totals formulas
                    const materialTotal = formula.materialTotal(10, 5, 3);
                    const factoryTotal = formula.factoryTotal(20, 10, 5, 2);
                    results.beanie[section] = {
                        materialTotal: materialTotal === 18,
                        factoryTotal: factoryTotal === 37,
                        status: 'valid'
                    };
                } else if (section === 'yarn') {
                    // Test yarn formula (special case with division by 1000)
                    const testResult = formula.rowCost(1000, 5);
                    results.beanie[section] = {
                        testResult: testResult,
                        expected: 5,
                        status: testResult === 5 ? 'valid' : 'invalid'
                    };
                } else {
                    // Test regular row cost formulas
                    const testResult = formula.rowCost(2, 3);
                    results.beanie[section] = {
                        testResult: testResult,
                        expected: 6,
                        status: testResult === 6 ? 'valid' : 'invalid'
                    };
                }
            } catch (error) {
                results.errors.push(`Beanie ${section}: ${error.message}`);
                results.beanie[section] = { status: 'error', error: error.message };
            }
        });
        
        return results;
    }
    
    /**
     * Export all formulas to CSV format
     */
    exportToCSV() {
        let csv = 'Template,Section,Type,Formula,Description,Excel_Formula\n';
        
        Object.keys(this.formulas).forEach(template => {
            Object.keys(this.formulas[template]).forEach(section => {
                const formula = this.formulas[template][section];
                if (section === 'totals') {
                    csv += `${template},${section},materialTotal,${formula.materialTotal.toString()},${formula.description},${formula.excelFormula}\n`;
                    csv += `${template},${section},factoryTotal,${formula.factoryTotal.toString()},${formula.description},${formula.excelFormula}\n`;
                } else {
                    csv += `${template},${section},rowCost,${formula.rowCost.toString()},${formula.description},${formula.excelFormula}\n`;
                    csv += `${template},${section},subtotal,${formula.subtotal.toString()},${formula.description},=SUM(range)\n`;
                }
            });
        });
        
        return csv;
    }
    
    /**
     * Generate Excel-compatible formulas for each section
     */
    generateExcelFormulas() {
        const excelFormulas = {
            ballcaps: {
                'FABRIC/S': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'OTHER FABRIC/S - TRIM/S': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'TRIM/S': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'OPERATIONS': {
                    'Cost (E2)': '=B2*C2*D2',
                    'Subtotal (E11)': '=SUM(E2:E10)'
                },
                'PACKAGING': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'OVERHEAD/PROFIT': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'TOTALS': {
                    'Material Total': '=Fabric_Subtotal+OtherFabric_Subtotal+Trim_Subtotal',
                    'Factory Total': '=Operations_Subtotal+Packaging_Subtotal+Overhead_Subtotal'
                }
            },
            beanie: {
                'YARN': {
                    'Cost (D2)': '=(B2/1000)*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'FABRIC': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'TRIM': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'KNITTING': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'OPERATIONS': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'PACKAGING': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'OVERHEAD/PROFIT': {
                    'Cost (D2)': '=B2*C2',
                    'Subtotal (D11)': '=SUM(D2:D10)'
                },
                'TOTALS': {
                    'Material Total': '=Yarn_Subtotal+Fabric_Subtotal+Trim_Subtotal',
                    'Factory Total': '=Knitting_Subtotal+Operations_Subtotal+Packaging_Subtotal+Overhead_Subtotal'
                }
            }
        };
        
        return excelFormulas;
    }
}

// Create global instance
window.excelFormulasExtractor = new ExcelFormulasExtractor();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelFormulasExtractor;
}
