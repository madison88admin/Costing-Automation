-- Integration script for existing Supabase database
-- This script adds beanie and ballcaps functionality to your existing database

-- Create costs table (main cost records) - only if it doesn't exist
CREATE TABLE IF NOT EXISTS costs (
    id BIGSERIAL PRIMARY KEY,
    customer TEXT NOT NULL,
    season TEXT,
    style_number TEXT,
    style_name TEXT,
    costed_quantity TEXT,
    leadtime TEXT,
    total_material_cost DECIMAL(10,2) DEFAULT 0,
    total_factory_cost DECIMAL(10,2) DEFAULT 0,
    product_type TEXT DEFAULT 'beanie',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cost_items table (section data) - only if it doesn't exist
CREATE TABLE IF NOT EXISTS cost_items (
    id BIGSERIAL PRIMARY KEY,
    cost_id BIGINT REFERENCES costs(id) ON DELETE CASCADE,
    section TEXT NOT NULL, -- yarn, fabric, embroidery, trim, knitting, operations, packaging, overhead
    material TEXT,
    operation TEXT,
    type TEXT,
    consumption TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    time TEXT,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    is_subtotal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_costs_product_type ON costs(product_type);
CREATE INDEX IF NOT EXISTS idx_costs_customer ON costs(customer);
CREATE INDEX IF NOT EXISTS idx_costs_created_at ON costs(created_at);
CREATE INDEX IF NOT EXISTS idx_cost_items_cost_id ON cost_items(cost_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_section ON cost_items(section);

-- Insert sample data for both beanie and ballcaps
INSERT INTO costs (customer, season, style_number, style_name, costed_quantity, leadtime, total_material_cost, total_factory_cost, product_type) VALUES
('TNF', 'F27', 'TNFF27-014', 'Fuzzy Wool Blend Beanie', '2000pcs', '45 days', 1.92, 4.57, 'beanie'),
('TNF', 'F27', 'TNFF27-015', 'Classic Logo Ballcap', '3000pcs', '30 days', 2.15, 5.20, 'ballcaps');

-- Get the cost IDs for sample data
DO $$
DECLARE
    beanie_cost_id BIGINT;
    ballcaps_cost_id BIGINT;
BEGIN
    -- Get beanie cost ID
    SELECT id INTO beanie_cost_id FROM costs WHERE style_number = 'TNFF27-014';
    
    -- Insert sample BEANIE data
    INSERT INTO cost_items (cost_id, section, material, consumption, price, cost) VALUES
    (beanie_cost_id, 'yarn', 'UJ-F19-011) 100% Nylon, 1/7.2 Nm', '0.010', 0.50, 0.005),
    (beanie_cost_id, 'yarn', '(HYDD ECO) 65% RWS 21.5mic Merino Wool 35%', '0.020', 0.75, 0.015);
    
    INSERT INTO cost_items (cost_id, section, material, consumption, price, cost) VALUES
    (beanie_cost_id, 'fabric', 'Sample Fabric 1', '0.5', 2.00, 1.00),
    (beanie_cost_id, 'fabric', 'Sample Fabric 2', '0.3', 1.50, 0.45);
    
    INSERT INTO cost_items (cost_id, section, material, consumption, price, cost) VALUES
    (beanie_cost_id, 'trim', 'Sample Trim 1', '1', 0.10, 0.10),
    (beanie_cost_id, 'trim', 'Sample Trim 2', '2', 0.05, 0.10);
    
    INSERT INTO cost_items (cost_id, section, operation, time, cost, total) VALUES
    (beanie_cost_id, 'knitting', 'Flat-3GG', '8', '0.100', 0.80);
    
    INSERT INTO cost_items (cost_id, section, operation, time, cost, total) VALUES
    (beanie_cost_id, 'operations', 'Labeling', '', '', 0.05),
    (beanie_cost_id, 'operations', 'Neaten/Steaming/Packing (Beanie)', '', '', 0.10),
    (beanie_cost_id, 'operations', 'Linking Beanie (Flat/ 1 Layer/ Cuff)', '', '', 0.15),
    (beanie_cost_id, 'operations', 'Washing (Hat/ Glove)', '', '', 0.20),
    (beanie_cost_id, 'operations', 'Hand Closing (9-3GG)', '', '', 0.25);
    
    INSERT INTO cost_items (cost_id, section, type, notes, cost) VALUES
    (beanie_cost_id, 'packaging', 'Polybag', 'Individual polybag', 0.05),
    (beanie_cost_id, 'packaging', 'Hang Tag', 'Product information tag', 0.02);
    
    INSERT INTO cost_items (cost_id, section, type, cost) VALUES
    (beanie_cost_id, 'overhead', 'OVERHEAD', 0.20),
    (beanie_cost_id, 'overhead', 'PROFIT', 0.59);
    
    -- Get ballcaps cost ID
    SELECT id INTO ballcaps_cost_id FROM costs WHERE style_number = 'TNFF27-015';
    
    -- Insert sample BALLCAPS data
    INSERT INTO cost_items (cost_id, section, material, consumption, price, cost) VALUES
    (ballcaps_cost_id, 'fabric', 'Cotton Twill Fabric', '0.3', 3.50, 1.05),
    (ballcaps_cost_id, 'fabric', 'Mesh Back Panel', '0.1', 2.00, 0.20);
    
    INSERT INTO cost_items (cost_id, section, material, consumption, price, cost) VALUES
    (ballcaps_cost_id, 'embroidery', 'Logo Embroidery', '1', 0.25, 0.25),
    (ballcaps_cost_id, 'embroidery', 'Side Logo Embroidery', '1', 0.15, 0.15);
    
    INSERT INTO cost_items (cost_id, section, material, consumption, price, cost) VALUES
    (ballcaps_cost_id, 'trim', 'Plastic Buckle', '1', 0.08, 0.08),
    (ballcaps_cost_id, 'trim', 'Adjustable Strap', '1', 0.12, 0.12);
    
    INSERT INTO cost_items (cost_id, section, operation, time, cost, total) VALUES
    (ballcaps_cost_id, 'operations', 'Cutting', '0.5', '0.15', 0.075),
    (ballcaps_cost_id, 'operations', 'Sewing', '2.0', '0.20', 0.40),
    (ballcaps_cost_id, 'operations', 'Embroidery', '1.5', '0.30', 0.45),
    (ballcaps_cost_id, 'operations', 'Finishing', '0.5', '0.10', 0.05);
    
    INSERT INTO cost_items (cost_id, section, type, notes, cost) VALUES
    (ballcaps_cost_id, 'packaging', 'Polybag', 'Individual polybag', 0.05),
    (ballcaps_cost_id, 'packaging', 'Hang Tag', 'Product information tag', 0.03);
    
    INSERT INTO cost_items (cost_id, section, type, cost) VALUES
    (ballcaps_cost_id, 'overhead', 'OVERHEAD', 0.25),
    (ballcaps_cost_id, 'overhead', 'PROFIT', 0.75);
END $$;

-- Create a view for easy querying of complete cost data (both beanie and ballcaps)
CREATE OR REPLACE VIEW cost_summary AS
SELECT 
    c.id,
    c.customer,
    c.season,
    c.style_number,
    c.style_name,
    c.costed_quantity,
    c.leadtime,
    c.total_material_cost,
    c.total_factory_cost,
    c.product_type,
    c.created_at,
    -- YARN items (for beanie)
    (SELECT json_agg(json_build_object('material', material, 'consumption', consumption, 'price', price, 'cost', cost, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'yarn') as yarn,
    -- FABRIC items
    (SELECT json_agg(json_build_object('material', material, 'consumption', consumption, 'price', price, 'cost', cost, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'fabric') as fabric,
    -- EMBROIDERY items (for ballcaps)
    (SELECT json_agg(json_build_object('material', material, 'consumption', consumption, 'price', price, 'cost', cost, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'embroidery') as embroidery,
    -- TRIM items
    (SELECT json_agg(json_build_object('material', material, 'consumption', consumption, 'price', price, 'cost', cost, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'trim') as trim,
    -- KNITTING items (for beanie)
    (SELECT json_agg(json_build_object('operation', operation, 'time', time, 'cost', cost, 'total', total, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'knitting') as knitting,
    -- OPERATIONS items
    (SELECT json_agg(json_build_object('operation', operation, 'time', time, 'cost', cost, 'total', total, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'operations') as operations,
    -- PACKAGING items
    (SELECT json_agg(json_build_object('type', type, 'notes', notes, 'cost', cost, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'packaging') as packaging,
    -- OVERHEAD items
    (SELECT json_agg(json_build_object('type', type, 'notes', notes, 'cost', cost, 'is_subtotal', is_subtotal))
     FROM cost_items WHERE cost_id = c.id AND section = 'overhead') as overhead
FROM costs c
WHERE c.product_type IN ('beanie', 'ballcaps')
ORDER BY c.created_at DESC;

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

-- Create policies (uncomment and adjust as needed)
-- CREATE POLICY "Allow all operations for authenticated users" ON costs FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON cost_items FOR ALL USING (auth.role() = 'authenticated');
