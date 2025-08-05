import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm';

// Leila's Jewelry Shop Supabase Configuration
const supabaseUrl = 'https://exkxigffpzntqvijgqff.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4a3hpZ2ZmcHpudHF2aWpncWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTQ1MzQsImV4cCI6MjA2OTkzMDUzNH0.RLYKCHr1pmZEI5_mbNGDuCViSuOBDWjtj8x8Yig1_Vk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
export async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        
        console.log('Supabase connection successful!');
        return true;
    } catch (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
}

// Database helper functions
export class SupabaseECommerce {
    
    // Products
    static async getAllProducts() {
        try {
            console.log('Fetching products from Supabase...');
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase query error:', error);
                throw new Error(`Database error: ${error.message}`);
            }
            
            console.log('Products fetched successfully:', data?.length || 0, 'items');
            return data || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            
            // Check if it's a network error
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Network connection error. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    }

    static async addProduct(product) {
        try {
            console.log('Adding product to Supabase:', product.name);
            
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: product.name,
                    price: product.price,
                    description: product.description,
                    image: product.image,
                    stock_quantity: product.stock_quantity || 0,
                    low_stock_alert: product.low_stock_alert || 5
                }])
                .select();
            
            if (error) {
                console.error('Supabase insert error:', error);
                
                // Handle specific error types
                if (error.code === '23505') {
                    throw new Error('A product with this name already exists');
                } else if (error.code === '42P01') {
                    throw new Error('Database table not found. Please run the database schema setup.');
                } else {
                    throw new Error(`Database error: ${error.message}`);
                }
            }
            
            console.log('Product added successfully:', data[0]);
            return data[0];
        } catch (error) {
            console.error('Error adding product:', error);
            
            // Check if it's a network error
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Network connection error. Please check your internet connection and try again.');
            }
            
            throw error;
        }
    }

    static async deleteProduct(productId) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    static async updateProduct(productId, updates) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', productId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    // Cart operations (optional - you might want to keep cart in localStorage for performance)
    static async saveCart(sessionId, cartData) {
        try {
            const { data, error } = await supabase
                .from('carts')
                .upsert([{
                    session_id: sessionId,
                    cart_data: cartData,
                    updated_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error saving cart:', error);
            throw error;
        }
    }

    static async getCart(sessionId) {
        try {
            const { data, error } = await supabase
                .from('carts')
                .select('cart_data')
                .eq('session_id', sessionId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
            return data?.cart_data || [];
        } catch (error) {
            console.error('Error fetching cart:', error);
            return [];
        }
    }

    // Orders
    static async createOrder(orderData) {
        try {
            // Start a transaction to update stock and create order
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select();
            
            if (error) throw error;
            
            // Update stock quantities for each item
            if (orderData.items && orderData.items.length > 0) {
                await this.updateStock(orderData.items);
            }
            
            return data[0];
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    static async updateStock(items) {
        try {
            for (const item of items) {
                // Get current product to check stock
                const { data: product, error: fetchError } = await supabase
                    .from('products')
                    .select('stock_quantity')
                    .eq('id', item.id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching product for stock update:', fetchError);
                    continue;
                }

                // Calculate new stock quantity
                const newStock = Math.max(0, product.stock_quantity - item.quantity);

                // Update stock quantity
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ stock_quantity: newStock })
                    .eq('id', item.id);

                if (updateError) {
                    console.error('Error updating stock:', updateError);
                }
            }
        } catch (error) {
            console.error('Error in stock update process:', error);
        }
    }

    static async getAllOrders() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    }

    // Initialize sample data
    static async initializeSampleProducts() {
        try {
            // Check if products already exist
            const existingProducts = await this.getAllProducts();
            if (existingProducts.length > 0) {
                return existingProducts;
            }

            const sampleProducts = [
                {
                    name: "Crystal Healing Bracelet",
                    price: 29.99,
                    description: "Beautiful crystal bracelet with healing properties. Made with genuine amethyst and rose quartz.",
                    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
                    stock_quantity: 25,
                    low_stock_alert: 5
                },
                {
                    name: "Golden Chain Necklace",
                    price: 49.99,
                    description: "Elegant 18k gold-plated chain necklace. Perfect for any occasion.",
                    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop",
                    stock_quantity: 15,
                    low_stock_alert: 3
                },
                {
                    name: "Leather Charm Bracelet",
                    price: 24.99,
                    description: "Handcrafted leather bracelet with silver charms. Adjustable size.",
                    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=300&fit=crop",
                    stock_quantity: 0,
                    low_stock_alert: 5
                }
            ];

            const promises = sampleProducts.map(product => this.addProduct(product));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error initializing sample products:', error);
            return [];
        }
    }
}

// Generate a session ID for cart management
export function getSessionId() {
    let sessionId = localStorage.getItem('ecommerce_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('ecommerce_session_id', sessionId);
    }
    return sessionId;
}