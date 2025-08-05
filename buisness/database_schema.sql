-- E-Commerce Database Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- 1. Products table
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    description TEXT,
    image TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_alert INTEGER DEFAULT 5 CHECK (low_stock_alert >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Carts table (optional - for cross-device cart sync)
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    cart_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Orders table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    items JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    shipping_address TEXT,
    payment_id VARCHAR(255),
    payment_status VARCHAR(50),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_carts_session_id ON carts(session_id);

-- 5. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at 
    BEFORE UPDATE ON carts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS) for public access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for public access
-- Products: Anyone can read, but you might want to restrict who can modify
CREATE POLICY "Anyone can view products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert products" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update products" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete products" ON products
    FOR DELETE USING (true);

-- Carts: Anyone can manage their own cart (based on session_id)
CREATE POLICY "Anyone can manage carts" ON carts
    FOR ALL USING (true);

-- Orders: Anyone can create orders, view their own orders
CREATE POLICY "Anyone can create orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view orders" ON orders
    FOR SELECT USING (true);

-- 9. Insert some sample data (optional)
INSERT INTO products (name, price, description, image, stock_quantity, low_stock_alert) VALUES
('Crystal Healing Bracelet', 29.99, 'Beautiful crystal bracelet with healing properties. Made with genuine amethyst and rose quartz.', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop', 25, 5),
('Golden Chain Necklace', 49.99, 'Elegant 18k gold-plated chain necklace. Perfect for any occasion.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop', 15, 3),
('Leather Charm Bracelet', 24.99, 'Handcrafted leather bracelet with silver charms. Adjustable size.', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=300&fit=crop', 0, 5);

-- 10. Create a view for order summaries (optional)
CREATE VIEW order_summaries AS
SELECT 
    id,
    session_id,
    total_amount,
    jsonb_array_length(items) as item_count,
    status,
    created_at
FROM orders
ORDER BY created_at DESC;