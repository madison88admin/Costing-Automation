/**
 * Excel Processing Utilities
 * Handles XLSX library loading and file processing
 */

class ExcelUtils {
    constructor() {
        this.isLoaded = false;
    }

    /**
     * Ensure XLSX library is loaded
     */
    async ensureXLSXLoaded() {
        return new Promise((resolve, reject) => {
            if (typeof XLSX !== 'undefined') {
                console.log('✅ XLSX library already loaded');
                this.isLoaded = true;
                resolve();
                return;
            }

            console.log('🔄 Loading XLSX library...');
            
            // Add overall timeout to prevent infinite waiting
            const timeoutId = setTimeout(() => {
                reject(new Error('XLSX library loading timed out after 5 seconds. Please check if js/xlsx.min.js exists and try refreshing the page.'));
            }, 5000);
            
            // Check if script is already being loaded
            const existingScript = document.querySelector('script[src*="xlsx"]');
            if (existingScript) {
                console.log('XLSX script already exists, checking if it loaded properly...');
                
                // Check if the script is already loaded and working
                if (typeof XLSX !== 'undefined') {
                    console.log('✅ XLSX library already available from existing script');
                    clearTimeout(timeoutId);
                    this.isLoaded = true;
                    resolve();
                    return;
                }
                
                // If script exists but XLSX is not available, wait with timeout
                console.log('⏳ Waiting for existing XLSX script to load...');
                let attempts = 0;
                const maxAttempts = 30; // 3 seconds max wait
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (typeof XLSX !== 'undefined') {
                        clearInterval(checkInterval);
                        clearTimeout(timeoutId);
                        console.log('✅ XLSX library loaded from existing script');
                        this.isLoaded = true;
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        console.warn('⚠️ Existing XLSX script failed to load, removing and retrying...');
                        // Remove the failed script and try loading a new one
                        existingScript.remove();
                        // Continue to load a new script below
                    }
                }, 100);
                
                // Return early to let the interval run
                return;
            }
            
            // Use local XLSX library to avoid CSP issues
            const script = document.createElement('script');
            script.src = 'js/xlsx.min.js';
            
            script.onload = () => {
                console.log('📦 XLSX library script loaded, checking availability...');
                // Wait a bit for the library to initialize
                setTimeout(() => {
                    if (typeof XLSX !== 'undefined') {
                        console.log('✅ XLSX library is available and ready');
                        clearTimeout(timeoutId);
                        this.isLoaded = true;
                        resolve();
                    } else {
                        console.error('❌ XLSX library loaded but not available');
                        clearTimeout(timeoutId);
                        reject(new Error('XLSX library loaded but not available'));
                    }
                }, 200);
            };
            
            script.onerror = (error) => {
                console.error('❌ Failed to load local XLSX library:', error);
                clearTimeout(timeoutId);
                reject(new Error('Failed to load XLSX library. Please ensure js/xlsx.min.js exists in the public folder and try refreshing the page.'));
            };
            
            document.head.appendChild(script);
            console.log('📤 XLSX script added to document head');
        });
    }

    /**
     * Read Excel file content
     */
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const fileType = this.getFileType(file.name);
                    
                    if (fileType === 'csv') {
                        const csvData = this.parseCSV(e.target.result);
                        resolve({
                            data: csvData,
                            images: [],
                            sheetName: 'CSV Data'
                        });
                    } else {
                        // For Excel files, ensure XLSX is loaded
                        console.log(`Processing ${fileType.toUpperCase()} file...`);
                        
                        if (typeof XLSX === 'undefined') {
                            console.log('XLSX library not loaded, loading now...');
                            await this.ensureXLSXLoaded();
                        } else {
                            console.log('XLSX library already available');
                        }
                        
                        if (typeof XLSX === 'undefined') {
                            throw new Error('Failed to load XLSX library. Please check your internet connection and try again.');
                        }
                        
                        const data = new Uint8Array(e.target.result);
                        
                        // Optimized XLSX reading with minimal options for speed
                        const workbook = XLSX.read(data, { 
                            type: 'array',
                            cellDates: false,  // Disable date parsing for speed
                            cellNF: false,    // Disable number formatting for speed
                            cellText: false,  // Disable text formatting for speed
                            raw: true,        // Use raw values for speed
                            dense: true       // Use dense array for speed
                        });
                        
                        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                            throw new Error('No worksheets found in the Excel file');
                        }
                        
                        console.log('Available sheets:', workbook.SheetNames);
                        
                        // Look for the correct sheet with Fuzzy Wool Blend data
                        let targetSheet = null;
                        let targetSheetName = null;
                        let allImages = [];
                        
                        // First, check for images at workbook level
                        console.log('🔍 Checking workbook level for images...');
                        if (workbook['!images']) {
                            console.log('Found images at workbook level:', Object.keys(workbook['!images']).length);
                            allImages = allImages.concat(this.extractImagesFromWorkbook(workbook));
                        }
                        
                        // Look for sheet with Fuzzy Wool Blend data
                        for (let i = 0; i < workbook.SheetNames.length; i++) {
                            const sheetName = workbook.SheetNames[i];
                            const worksheet = workbook.Sheets[sheetName];
                            let sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
                            // Normalize all empty cells to 0
                            sheetData = sheetData.map(row => Array.isArray(row)
                                ? row.map(cell => (cell === null || cell === undefined || cell === '' || cell === ' ' || cell === false) ? 0 : cell)
                                : row);
                            
                            // Check if this sheet contains Fuzzy Wool Blend data
                            const sheetString = JSON.stringify(sheetData).toLowerCase();
                            if (sheetString.includes('fuzzy wool blend') || sheetString.includes('tnff27-014') || sheetString.includes('f27')) {
                                console.log('🔍 Found Fuzzy Wool Blend data in sheet:', sheetName);
                                targetSheet = sheetData;
                                targetSheetName = sheetName;
                                break;
                            }
                        }
                        
                        // If no Fuzzy Wool Blend sheet found, use the first sheet as fallback
                        if (!targetSheet) {
                            console.log('🔍 No Fuzzy Wool Blend sheet found, using first sheet as fallback');
                            const firstSheetName = workbook.SheetNames[0];
                            const firstWorksheet = workbook.Sheets[firstSheetName];
                            targetSheet = XLSX.utils.sheet_to_json(firstWorksheet, { header: 1, raw: true });
                            targetSheetName = firstSheetName;
                            console.log('Using first sheet as fallback:', firstSheetName);
                        }
                        
                        // targetSheet is already converted to JSON data
                        const jsonData = targetSheet;
                        
                        if (!jsonData || jsonData.length === 0) {
                            throw new Error('Could not read the target worksheet data');
                        }
                        
                        // Extract embedded images from the worksheet (if available)
                        let worksheetImages = [];
                        if (workbook.Sheets[targetSheetName]) {
                            worksheetImages = this.extractImagesFromWorksheet(workbook.Sheets[targetSheetName]);
                        }
                        
                        // Combine workbook and worksheet images
                        allImages = allImages.concat(worksheetImages);
                        
                        console.log(`Excel file processed: ${jsonData.length} rows, ${jsonData[0] ? jsonData[0].length : 0} columns`);
                        console.log(`Found ${allImages.length} embedded images total`);
                        
                        // Return data with images
                        resolve({
                            data: jsonData,
                            images: allImages,
                            sheetName: targetSheetName
                        });
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('File reading error:', error);
                reject(new Error('Failed to read file. Please check if the file is corrupted or try a different file.'));
            };
            
            // Choose reading method based on file type
            const fileType = this.getFileType(file.name);
            if (fileType === 'csv') {
                reader.readAsText(file, 'UTF-8');
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    /**
     * Parse CSV content
     */
    parseCSV(csvText) {
        try {
            const lines = csvText.split(/\r?\n/);
            const result = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    // Simple CSV parsing - handles quoted fields
                    const row = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            row.push(current.trim());
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    
                    row.push(current.trim());
                    result.push(row);
                }
            }
            
            return result;
        } catch (error) {
            console.error('CSV parsing error:', error);
            throw new Error('Failed to parse CSV file');
        }
    }

    /**
     * Get file type from filename
     */
    getFileType(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        
        if (extension === 'csv') {
            return 'csv';
        } else if (['xlsx', 'xls', 'xlsm'].includes(extension)) {
            return 'excel';
        } else {
            return 'unknown';
        }
    }

    /**
     * Extract embedded images from Excel workbook
     */
    extractImagesFromWorkbook(workbook) {
        const images = [];
        
        try {
            console.log('🔍 Extracting images from workbook level...');
            
            if (workbook['!images']) {
                const imageData = workbook['!images'];
                console.log('Found workbook images:', Object.keys(imageData).length);
                
                Object.keys(imageData).forEach(key => {
                    const image = imageData[key];
                    if (image && image.data) {
                        try {
                            let mimeType = 'image/png';
                            
                            // Detect image type
                            if (image.data[0] === 0xFF && image.data[1] === 0xD8) {
                                mimeType = 'image/jpeg';
                            } else if (image.data[0] === 0x89 && image.data[1] === 0x50) {
                                mimeType = 'image/png';
                            } else if (image.data[0] === 0x47 && image.data[1] === 0x49) {
                                mimeType = 'image/gif';
                            }
                            
                            const base64 = btoa(String.fromCharCode.apply(null, image.data));
                            const dataUrl = `data:${mimeType};base64,${base64}`;
                            
                            images.push({
                                id: `workbook_${key}`,
                                dataUrl: dataUrl,
                                mimeType: mimeType,
                                position: image.position || null,
                                size: image.data.length
                            });
                            
                            console.log(`✅ Extracted workbook image ${key}: ${mimeType}, ${image.data.length} bytes`);
                        } catch (imgError) {
                            console.warn(`Failed to process workbook image ${key}:`, imgError);
                        }
                    }
                });
            }
            
        } catch (error) {
            console.warn('Error extracting images from workbook:', error);
        }
        
        return images;
    }

    /**
     * Extract embedded images from Excel worksheet
     */
    extractImagesFromWorksheet(worksheet) {
        const images = [];
        
        try {
            console.log('🔍 Searching for images in worksheet...');
            console.log('Worksheet properties:', Object.keys(worksheet));
            
            // Method 1: Check for !images property
            if (worksheet['!images']) {
                console.log('Found !images property with', Object.keys(worksheet['!images']).length, 'items');
                const imageData = worksheet['!images'];
                
                Object.keys(imageData).forEach(key => {
                    const image = imageData[key];
                    console.log(`Processing image ${key}:`, image);
                    
                    if (image && image.data) {
                        try {
                            // Convert binary data to base64 data URL
                            let mimeType = 'image/png'; // Default to PNG
                            
                            // Try to detect image type from the data
                            if (image.data[0] === 0xFF && image.data[1] === 0xD8) {
                                mimeType = 'image/jpeg';
                            } else if (image.data[0] === 0x89 && image.data[1] === 0x50) {
                                mimeType = 'image/png';
                            } else if (image.data[0] === 0x47 && image.data[1] === 0x49) {
                                mimeType = 'image/gif';
                            }
                            
                            // Convert binary data to base64
                            const base64 = btoa(String.fromCharCode.apply(null, image.data));
                            const dataUrl = `data:${mimeType};base64,${base64}`;
                            
                            images.push({
                                id: key,
                                dataUrl: dataUrl,
                                mimeType: mimeType,
                                position: image.position || null,
                                size: image.data.length
                            });
                            
                            console.log(`✅ Extracted image ${key}: ${mimeType}, ${image.data.length} bytes`);
                        } catch (imgError) {
                            console.warn(`Failed to process image ${key}:`, imgError);
                        }
                    }
                });
            }
            
            // Method 2: Check for !drawings property
            if (worksheet['!drawings']) {
                console.log('Found !drawings property with', Object.keys(worksheet['!drawings']).length, 'items');
                const drawingData = worksheet['!drawings'];
                
                Object.keys(drawingData).forEach(key => {
                    const drawing = drawingData[key];
                    console.log(`Processing drawing ${key}:`, drawing);
                    
                    if (drawing && drawing.data) {
                        try {
                            let mimeType = 'image/png';
                            
                            // Detect image type
                            if (drawing.data[0] === 0xFF && drawing.data[1] === 0xD8) {
                                mimeType = 'image/jpeg';
                            } else if (drawing.data[0] === 0x89 && drawing.data[1] === 0x50) {
                                mimeType = 'image/png';
                            } else if (drawing.data[0] === 0x47 && drawing.data[1] === 0x49) {
                                mimeType = 'image/gif';
                            }
                            
                            const base64 = btoa(String.fromCharCode.apply(null, drawing.data));
                            const dataUrl = `data:${mimeType};base64,${base64}`;
                            
                            images.push({
                                id: `drawing_${key}`,
                                dataUrl: dataUrl,
                                mimeType: mimeType,
                                position: drawing.position || null,
                                size: drawing.data.length
                            });
                            
                            console.log(`✅ Extracted drawing ${key}: ${mimeType}, ${drawing.data.length} bytes`);
                        } catch (drawingError) {
                            console.warn(`Failed to process drawing ${key}:`, drawingError);
                        }
                    }
                });
            }
            
            // Method 3: Check for images in cell data
            if (images.length === 0) {
                console.log('No images found in !images or !drawings, checking cell data...');
                
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                for (let row = range.s.r; row <= range.e.r; row++) {
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                        const cell = worksheet[cellAddress];
                        
                        if (cell && cell.v && typeof cell.v === 'string' && cell.v.startsWith('data:image/')) {
                            images.push({
                                id: `cell_${cellAddress}`,
                                dataUrl: cell.v,
                                mimeType: cell.v.split(';')[0].split(':')[1],
                                position: { row: row, col: col },
                                size: cell.v.length
                            });
                            console.log(`✅ Found image in cell ${cellAddress}`);
                        }
                    }
                }
            }
            
            // Method 4: Check for embedded objects in cells
            if (images.length === 0) {
                console.log('Checking for embedded objects in cells...');
                
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                for (let row = range.s.r; row <= range.e.r; row++) {
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                        const cell = worksheet[cellAddress];
                        
                        if (cell && cell.f && cell.f.includes('image')) {
                            console.log(`Found image reference in cell ${cellAddress}:`, cell);
                        }
                    }
                }
            }
            
            // Method 5: Try to extract from raw workbook data if available
            if (images.length === 0) {
                console.log('No images found using standard methods, trying alternative approach...');
                
                // This is a fallback method that might work with some Excel files
                try {
                    // Check if we can access the raw workbook data
                    const workbook = worksheet._workbook || worksheet;
                    if (workbook && workbook.SSF) {
                        console.log('Found SSF (Shared String Format) data, checking for images...');
                        // Sometimes images are stored in shared strings
                    }
                } catch (altError) {
                    console.log('Alternative extraction method failed:', altError);
                }
            }
            
            console.log(`🔍 Image extraction complete. Found ${images.length} images.`);
            
            // If still no images found, provide helpful debugging info
            if (images.length === 0) {
                console.log('💡 No images found. This could be because:');
                console.log('   - The Excel file has no embedded images');
                console.log('   - Images are in a format not supported by XLSX.js');
                console.log('   - Images are stored in a different location');
                console.log('   - The Excel file was created with a version that stores images differently');
                console.log('   - Try saving the Excel file as .xlsx format and re-uploading');
            }
            
        } catch (error) {
            console.warn('Error extracting images from worksheet:', error);
        }
        
        return images;
    }

    /**
     * Validate file
     */
    validateFile(file) {
        const fileType = this.getFileType(file.name);
        const maxSize = 10 * 1024 * 1024; // 10MB limit
        
        if (file.size > maxSize) {
            throw new Error('File size too large. Please use files smaller than 10MB.');
        }
        
        if (fileType === 'unknown') {
            throw new Error('Unsupported file type. Please use CSV, XLSX, XLS, or XLSM files.');
        }
        
        return fileType;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelUtils;
} else {
    window.ExcelUtils = ExcelUtils;
}
