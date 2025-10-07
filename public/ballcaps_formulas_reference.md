# 🧢 Ballcaps Costing Template - Formulas & Calculations Reference

## 📋 Overview

This document contains all the calculation formulas and logic used in the Ballcaps costing template. The calculations are designed to work both in the web application and can be easily ported to Excel or other systems.

## 🧮 Core Calculation Formulas

### 1. Basic Cost Calculation
**Formula:** `Cost = Consumption × Price`

**Used in sections:**
- FABRIC/S
- OTHER FABRIC/S - TRIM/S  
- TRIM/S
- PACKAGING
- OVERHEAD/PROFIT

**Example:**
```
Consumption: 2.5 yards
Price: $3.50 per yard
Cost: 2.5 × 3.50 = $8.75
```

### 2. Operations Cost Calculation
**Formula:** `Cost = SMV × Cost per Minute × Quantity`

**Used in section:**
- OPERATIONS

**Example:**
```
SMV: 0.5 minutes
Cost per Minute: $0.15
Quantity: 1000 pieces
Cost: 0.5 × 0.15 × 1000 = $75.00
```

## 📊 Section Structure & Calculations

### FABRIC/S Section
| Column | Description | Formula |
|--------|-------------|---------|
| A | Description | Text input |
| B | Consumption (Yards) | Manual input |
| C | Price (USD/YD) | Manual input |
| D | Cost | `=B2*C2` |

**Subtotal:** `=SUM(D2:D10)`

### OTHER FABRIC/S - TRIM/S Section
| Column | Description | Formula |
|--------|-------------|---------|
| A | Description | Text input |
| B | Consumption (Yards) | Manual input |
| C | Price (USD/YD) | Manual input |
| D | Cost | `=B2*C2` |

**Subtotal:** `=SUM(D2:D10)`

### TRIM/S Section
| Column | Description | Formula |
|--------|-------------|---------|
| A | Description | Text input |
| B | Consumption (Piece) | Manual input |
| C | Price (USD/PC) | Manual input |
| D | Cost | `=B2*C2` |

**Subtotal:** `=SUM(D2:D10)`

### OPERATIONS Section
| Column | Description | Formula |
|--------|-------------|---------|
| A | Description | Text input |
| B | SMV | Manual input |
| C | Cost per Minute | Manual input |
| D | Quantity | Manual input |
| E | Cost | `=B2*C2*D2` |

**Subtotal:** `=SUM(E2:E10)`

### PACKAGING Section
| Column | Description | Formula |
|--------|-------------|---------|
| A | Description | Text input |
| B | Consumption | Manual input |
| C | Price | Manual input |
| D | Cost | `=B2*C2` |

**Subtotal:** `=SUM(D2:D10)`

### OVERHEAD/PROFIT Section
| Column | Description | Formula |
|--------|-------------|---------|
| A | Description | Text input |
| B | Consumption | Manual input |
| C | Price | Manual input |
| D | Cost | `=B2*C2` |

**Subtotal:** `=SUM(D2:D10)`

## 🎯 Grand Total Calculations

### Material Total
**Formula:** `Material Total = FABRIC/S Subtotal + OTHER FABRIC/S - TRIM/S Subtotal + TRIM/S Subtotal`

**Excel Formula:** `=Fabric_Subtotal + OtherFabric_Subtotal + Trim_Subtotal`

### Factory Total
**Formula:** `Factory Total = OPERATIONS Subtotal + PACKAGING Subtotal + OVERHEAD/PROFIT Subtotal`

**Excel Formula:** `=Operations_Subtotal + Packaging_Subtotal + Overhead_Subtotal`

## 💻 JavaScript Implementation

### Core Functions

#### 1. calculateRowCost(cell)
```javascript
function calculateRowCost(cell) {
    const row = cell.closest('.cost-row');
    if (!row) return;
    
    const cells = row.querySelectorAll('.cost-cell');
    if (cells.length >= 4) {
        const consumption = parseFloat(cells[1].textContent) || 0;
        const price = parseFloat(cells[2].textContent) || 0;
        const cost = consumption * price;
        
        if (consumption > 0 && price > 0) {
            cells[3].textContent = '$' + cost.toFixed(2);
        }
    }
}
```

#### 2. calculateSectionTotal(section)
```javascript
function calculateSectionTotal(section) {
    let total = 0;
    const rows = section.querySelectorAll('.cost-row:not(.header-row):not(.subtotal-row)');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('.cost-cell');
        if (cells.length >= 4) {
            const costText = cells[3].textContent.replace('$', '').trim();
            const cost = parseFloat(costText) || 0;
            total += cost;
        }
    });
    
    return total;
}
```

#### 3. calculateBallCapsTemplate()
```javascript
function calculateBallCapsTemplate() {
    // Find all sections
    const sections = document.querySelectorAll('#ballcapsBreakdown .cost-section');
    
    // Calculate each section total
    let totalMaterialCost = 0;
    let totalFactoryCost = 0;
    
    // Material sections
    const fabricSection = findSection('FABRIC/S');
    const otherFabricSection = findSection('OTHER FABRIC/S - TRIM/S');
    const trimSection = findSection('TRIM/S');
    
    if (fabricSection) {
        const fabricTotal = calculateSectionTotal(fabricSection);
        updateSubtotal(fabricSection, fabricTotal);
        totalMaterialCost += fabricTotal;
    }
    
    // Factory sections
    const operationsSection = findSection('OPERATIONS');
    const packagingSection = findSection('PACKAGING');
    const overheadSection = findSection('OVERHEAD/PROFIT');
    
    if (operationsSection) {
        const operationsTotal = calculateSectionTotal(operationsSection);
        updateSubtotal(operationsSection, operationsTotal);
        totalFactoryCost += operationsTotal;
    }
    
    // Update grand totals
    updateGrandTotals(totalMaterialCost, totalFactoryCost);
}
```

## 📈 Excel Implementation

### Sample Data Structure
```
A1: Description    B1: Consumption    C1: Price    D1: Cost
A2: Main Fabric    B2: 2.5           C2: 3.50     D2: =B2*C2
A3: Lining Fabric  B3: 1.0           C3: 2.00     D3: =B3*C3
A4: SUB TOTAL      B4:               C4:          D4: =SUM(D2:D3)
```

### Named Ranges (Recommended)
```
Fabric_Consumption: B2:B10
Fabric_Price: C2:C10
Fabric_Cost: D2:D10
Fabric_Subtotal: D11
```

### Complete Excel Formulas
```
FABRIC/S:
- Cost: =B2*C2
- Subtotal: =SUM(D2:D10)

TRIM/S:
- Cost: =B2*C2
- Subtotal: =SUM(D2:D10)

OPERATIONS:
- Cost: =B2*C2*D2
- Subtotal: =SUM(E2:E10)

PACKAGING:
- Cost: =B2*C2
- Subtotal: =SUM(D2:D10)

OVERHEAD/PROFIT:
- Cost: =B2*C2
- Subtotal: =SUM(D2:D10)

GRAND TOTALS:
- Material Total: =Fabric_Subtotal + OtherFabric_Subtotal + Trim_Subtotal
- Factory Total: =Operations_Subtotal + Packaging_Subtotal + Overhead_Subtotal
```

## 🔧 Event Handling

### Real-time Calculations
```javascript
// Add event listeners to editable cells
function addCalculationEventListeners() {
    const editableCells = document.querySelectorAll('.cost-cell:not(.header-row .cost-cell):not(.subtotal-row .cost-cell)');
    
    editableCells.forEach(cell => {
        cell.addEventListener('input', function() {
            // Calculate individual row cost
            calculateRowCost(this);
            
            // Debounce full template calculation
            clearTimeout(this.calculationTimeout);
            this.calculationTimeout = setTimeout(() => {
                calculateBallCapsTemplate();
            }, 500);
        });
    });
}
```

## 🎨 CSS Classes for Styling

### Required CSS Classes
```css
.cost-section { /* Section container */ }
.cost-table { /* Table container */ }
.cost-row { /* Row container */ }
.cost-cell { /* Cell container */ }
.header-row { /* Header row styling */ }
.subtotal-row { /* Subtotal row styling */ }
.editable { /* Editable cell styling */ }
```

## 📝 Data Validation

### Input Validation Rules
1. **Consumption:** Must be positive number
2. **Price:** Must be positive number
3. **SMV:** Must be positive number
4. **Quantity:** Must be positive integer
5. **Cost per Minute:** Must be positive number

### Error Handling
```javascript
function validateInput(value, type) {
    const num = parseFloat(value);
    
    if (isNaN(num) || num < 0) {
        return false;
    }
    
    if (type === 'quantity' && !Number.isInteger(num)) {
        return false;
    }
    
    return true;
}
```

## 🚀 Usage Examples

### Basic Usage
```javascript
// Initialize calculator
const calculator = new BallcapsCalculator();

// Enable calculations
calculator.addBallCapsCalculationEventListeners();

// Calculate all
calculator.calculateBallCapsTemplate();
```

### With Custom Data
```javascript
const parsedData = {
    fabric: [
        { material: 'Main Fabric', consumption: '2.5', price: '3.50', cost: '8.75' }
    ],
    trim: [
        { material: 'Button', consumption: '5', price: '0.50', cost: '2.50' }
    ],
    operations: [
        { operation: 'Cutting', smv: '0.5', cost: '0.15', total: '75.00' }
    ]
};

// Calculate from data
const materialTotal = calculator.calculateMaterialTotal(parsedData);
const factoryTotal = calculator.calculateFactoryTotal(parsedData);
```

## 📚 Files Reference

- `ballcaps_calculations.js` - Standalone calculation class
- `ballcaps_calculations_demo.html` - Interactive demo
- `ballcaps_excel_template.html` - Excel formulas reference
- `ballcaps_sample_data.csv` - Sample data with formulas

## 🔍 Debugging

### Enable Debug Mode
```javascript
const calculator = new BallcapsCalculator();
calculator.setDebugMode(true);
```

### Debug Output
The calculator will log:
- Section detection
- Row calculations
- Total calculations
- Error messages

## 📋 Testing Checklist

- [ ] Individual row calculations work
- [ ] Section subtotals update correctly
- [ ] Grand totals calculate properly
- [ ] Real-time updates function
- [ ] Data validation works
- [ ] Error handling functions
- [ ] Excel formulas match JavaScript logic
- [ ] All sections are detected correctly

---

*This reference document contains all the formulas and calculations used in the Ballcaps costing template. Use it as a guide for implementation in any system.*
