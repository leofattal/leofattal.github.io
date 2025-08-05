import { SupabaseECommerce, getSessionId, testSupabaseConnection } from './supabase.js';

// Store for all application data
class ECommerceStore {
    constructor() {
        this.products = [];
        this.cart = this.loadCart();
        this.isAdminLoggedIn = false;
        this.adminPassword = 'admin123'; // Change this to a secure password
        this.sessionId = getSessionId();
        
        this.initializeEventListeners();
        this.initializeData();
    }

    // Initialize data from Supabase
    async initializeData() {
        try {
            this.showNotification('Loading products...', 'info');
            
            // Test Supabase connection first
            const isConnected = await testSupabaseConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to database');
            }
            
            // Load products from Supabase
            this.products = await SupabaseECommerce.getAllProducts();
            
            // If no products exist, initialize with sample data
            if (this.products.length === 0) {
                this.showNotification('Initializing sample products...', 'info');
                this.products = await SupabaseECommerce.initializeSampleProducts();
            }
            
            this.renderProducts();
            this.updateCartDisplay();
            this.showNotification('Products loaded successfully!');
        } catch (error) {
            console.error('Error initializing data:', error);
            
            let errorMessage = 'Error loading products. ';
            
            if (error.message?.includes('Network connection error')) {
                errorMessage += 'Please check your internet connection.';
            } else if (error.message?.includes('Database table not found')) {
                errorMessage += 'Database not set up. Please run the database schema.';
            } else {
                errorMessage += 'Using offline mode.';
            }
            
            this.showNotification(errorMessage, 'error');
            
            // Fallback to local storage
            this.products = this.loadProductsLocal();
            if (this.products.length === 0) {
                this.initializeSampleProductsLocal();
            }
            this.renderProducts();
        }
    }

    // Fallback local storage methods
    loadProductsLocal() {
        const stored = localStorage.getItem('ecommerce_products');
        return stored ? JSON.parse(stored) : [];
    }

    saveProductsLocal() {
        localStorage.setItem('ecommerce_products', JSON.stringify(this.products));
    }

    loadCart() {
        const stored = localStorage.getItem('ecommerce_cart');
        return stored ? JSON.parse(stored) : [];
    }

    saveCart() {
        localStorage.setItem('ecommerce_cart', JSON.stringify(this.cart));
        // Optionally sync cart to Supabase for cross-device support
        // SupabaseECommerce.saveCart(this.sessionId, this.cart);
    }

    // Initialize sample products locally (fallback)
    initializeSampleProductsLocal() {
        const sampleProducts = [
            {
                id: Date.now() + 1,
                name: "Crystal Healing Bracelet",
                price: 29.99,
                description: "Beautiful crystal bracelet with healing properties. Made with genuine amethyst and rose quartz.",
                image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop"
            },
            {
                id: Date.now() + 2,
                name: "Golden Chain Necklace",
                price: 49.99,
                description: "Elegant 18k gold-plated chain necklace. Perfect for any occasion.",
                image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop"
            },
            {
                id: Date.now() + 3,
                name: "Leather Charm Bracelet",
                price: 24.99,
                description: "Handcrafted leather bracelet with silver charms. Adjustable size.",
                image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=300&fit=crop"
            }
        ];
        
        this.products = sampleProducts;
        this.saveProductsLocal();
        this.renderProducts();
    }

    // Event Listeners
    initializeEventListeners() {
        // Cart modal
        document.getElementById('cartBtn').addEventListener('click', () => this.openCartModal());
        document.getElementById('closeCart').addEventListener('click', () => this.closeModal('cartModal'));
        document.getElementById('checkoutBtn').addEventListener('click', () => this.checkout());
        document.getElementById('clearCartBtn').addEventListener('click', () => this.clearCart());

        // Admin modal
        document.getElementById('adminBtn').addEventListener('click', () => this.openAdminModal());
        document.getElementById('closeAdmin').addEventListener('click', () => this.closeModal('adminModal'));
        document.getElementById('loginBtn').addEventListener('click', () => this.adminLogin());
        document.getElementById('addProductBtn').addEventListener('click', () => this.addProduct());
        
        // Admin settings
        document.getElementById('refreshOrdersBtn')?.addEventListener('click', () => this.refreshOrders());
        document.getElementById('emailNotifications')?.addEventListener('change', (e) => {
            window.adminNotifications?.toggleEmailNotifications(e.target.checked);
        });
        document.getElementById('adminEmail')?.addEventListener('blur', (e) => {
            window.adminNotifications?.updateAdminEmail(e.target.value);
        });

        // Checkout modal
        document.getElementById('closeCheckout').addEventListener('click', () => this.closeModal('checkoutModal'));
        document.getElementById('placeOrderBtn').addEventListener('click', () => this.placeOrder());

        // Success modal
        document.getElementById('closeSuccess').addEventListener('click', () => this.closeModal('successModal'));
        document.getElementById('continueShopping').addEventListener('click', () => this.closeModal('successModal'));

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Admin password enter key
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.adminLogin();
            }
        });
    }

    // Product Management
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        
        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No products available</h3>
                    <p>Check back soon for new arrivals!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card ${this.isOutOfStock(product) ? 'out-of-stock' : ''}" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/400x300?text=Product+Image'">
                ${this.isOutOfStock(product) ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
                ${this.isLowStock(product) ? '<div class="low-stock-badge">Low Stock</div>' : ''}
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="stock-info">
                        <span class="stock-quantity">
                            <i class="fas fa-box"></i> 
                            ${product.stock_quantity || 0} in stock
                        </span>
                    </div>
                    <button class="add-to-cart-btn ${this.isOutOfStock(product) ? 'disabled' : ''}" 
                            onclick="store.addToCart(${product.id})" 
                            ${this.isOutOfStock(product) ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> 
                        ${this.isOutOfStock(product) ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    async addProduct() {
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const description = document.getElementById('productDescription').value.trim();
        const stock = parseInt(document.getElementById('productStock').value) || 0;
        const lowStockAlert = parseInt(document.getElementById('lowStockAlert').value) || 5;
        
        // Get image from the image upload manager
        const image = window.imageUploadManager ? window.imageUploadManager.getSelectedImage() : null;

        if (!name || !price || !description || !image) {
            this.showNotification('Please fill in all required fields and select an image', 'error');
            return;
        }

        if (price <= 0) {
            this.showNotification('Price must be greater than 0', 'error');
            return;
        }

        if (stock < 0) {
            this.showNotification('Stock quantity cannot be negative', 'error');
            return;
        }

        try {
            // Add to Supabase
            const newProduct = await SupabaseECommerce.addProduct({
                name,
                price,
                description,
                image,
                stock_quantity: stock,
                low_stock_alert: lowStockAlert
            });

            // Update local products array
            this.products.unshift(newProduct);
            this.renderProducts();
            this.renderAdminProducts();

            // Clear form
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productDescription').value = '';
            document.getElementById('productStock').value = '';
            document.getElementById('lowStockAlert').value = '';
            
            // Clear image selection
            if (window.imageUploadManager) {
                window.imageUploadManager.clearSelection();
            }

            this.showNotification('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
            // Show more specific error message
            const errorMessage = error.message || 'Error adding product. Please check your connection and try again.';
            this.showNotification(errorMessage, 'error');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            // Delete from Supabase
            await SupabaseECommerce.deleteProduct(productId);
            
            // Update local products array
            this.products = this.products.filter(p => p.id !== productId);
            this.renderProducts();
            this.renderAdminProducts();
            this.showNotification('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Error deleting product. Please try again.', 'error');
        }
    }

    // Cart Management
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Check if product is out of stock
        if (this.isOutOfStock(product)) {
            this.showNotification('This product is out of stock', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item.id === productId);
        const currentCartQuantity = existingItem ? existingItem.quantity : 0;
        
        // Check if adding one more would exceed available stock
        if (currentCartQuantity >= (product.stock_quantity || 0)) {
            this.showNotification(`Only ${product.stock_quantity || 0} items available`, 'error');
            return;
        }

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1,
                stock_quantity: product.stock_quantity || 0
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`${product.name} added to cart!`);
    }

    isOutOfStock(product) {
        return (product.stock_quantity || 0) <= 0;
    }

    isLowStock(product) {
        const stock = product.stock_quantity || 0;
        const alert = product.low_stock_alert || 5;
        return stock > 0 && stock <= alert;
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.renderCartItems();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.quantity += change;
        
        if (item.quantity <= 0) {
            this.removeFromCart(productId);
        } else {
            this.saveCart();
            this.updateCartDisplay();
            this.renderCartItems();
        }
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cartCount');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started!</p>
                </div>
            `;
            cartTotal.textContent = '0.00';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/60x60?text=Item'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="store.updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="store.updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="store.removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();
            this.renderCartItems();
            this.showNotification('Cart cleared!');
        }
    }

    async checkout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }

        // Close cart modal and open checkout modal
        this.closeModal('cartModal');
        this.openCheckoutModal();
    }

    openCheckoutModal() {
        this.openModal('checkoutModal');
        this.renderCheckoutItems();
        
        // Initialize payment methods
        this.initializePaymentMethods();
        
        // Show demo notification
        if (window.paymentProcessor) {
            setTimeout(() => {
                window.paymentProcessor.showDemoNotification();
            }, 1000);
        }
    }

    renderCheckoutItems() {
        const checkoutItems = document.getElementById('checkoutItems');
        const checkoutTotal = document.getElementById('checkoutTotal');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        checkoutTotal.textContent = total.toFixed(2);

        checkoutItems.innerHTML = this.cart.map(item => `
            <div class="checkout-item">
                <div>
                    <div class="checkout-item-name">${item.name}</div>
                    <div class="checkout-item-details">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
                </div>
                <div>$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');
    }

    initializePaymentMethods() {
        const paymentMethods = document.querySelectorAll('.payment-method');
        paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                paymentMethods.forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                method.querySelector('input').checked = true;
            });
        });
    }

    async placeOrder() {
        try {
            // Get customer information
            const customerInfo = {
                name: document.getElementById('customerName').value.trim(),
                email: document.getElementById('customerEmail').value.trim(),
                phone: document.getElementById('customerPhone').value.trim(),
                address: document.getElementById('shippingAddress').value.trim()
            };

            // Validate required fields
            if (!customerInfo.name || !customerInfo.email || !customerInfo.address) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }

            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const orderData = {
                session_id: this.sessionId,
                total_amount: total,
                items: this.cart,
                customer_name: customerInfo.name,
                customer_email: customerInfo.email,
                customer_phone: customerInfo.phone,
                shipping_address: customerInfo.address
            };

            // Process payment
            const paymentResult = await window.paymentProcessor.processPayment(customerInfo, {
                total: total,
                items: this.cart
            });

            // Create order in Supabase with payment info
            orderData.payment_id = paymentResult.id;
            orderData.payment_status = paymentResult.status;
            orderData.status = 'paid';

            const createdOrder = await SupabaseECommerce.createOrder(orderData);
            
            // Send admin notification
            if (window.adminNotifications) {
                await window.adminNotifications.sendOrderNotification(createdOrder, customerInfo);
            }
            
            // Clear cart
            this.cart = [];
            this.saveCart();
            this.updateCartDisplay();
            
            // Close checkout modal and show success
            this.closeModal('checkoutModal');
            this.showSuccessModal(createdOrder, paymentResult, customerInfo);
            
            this.showNotification(`Payment successful! Order #${createdOrder.id}`);

        } catch (error) {
            console.error('Error placing order:', error);
            this.showNotification(error.message || 'Error processing payment. Please try again.', 'error');
        }
    }

    showSuccessModal(order, paymentResult, customerInfo) {
        // Update success modal content
        document.getElementById('orderNumber').textContent = `#${order.id}`;
        document.getElementById('amountPaid').textContent = order.total_amount.toFixed(2);
        document.getElementById('confirmationEmail').textContent = customerInfo.email;
        
        this.openModal('successModal');
    }

    // Admin Management
    openAdminModal() {
        this.openModal('adminModal');
        if (this.isAdminLoggedIn) {
            document.getElementById('adminLogin').classList.add('hidden');
            document.getElementById('adminDashboard').classList.remove('hidden');
            this.renderAdminProducts();
        } else {
            document.getElementById('adminLogin').classList.remove('hidden');
            document.getElementById('adminDashboard').classList.add('hidden');
            document.getElementById('adminPassword').focus();
        }
    }

    adminLogin() {
        const password = document.getElementById('adminPassword').value;
        
        if (password === this.adminPassword) {
            this.isAdminLoggedIn = true;
            document.getElementById('adminLogin').classList.add('hidden');
            document.getElementById('adminDashboard').classList.remove('hidden');
            document.getElementById('adminPassword').value = '';
            this.renderAdminProducts();
            this.renderAdminOrders();
            
            // Clear notification indicator
            if (window.adminNotifications) {
                window.adminNotifications.clearNotifications();
            }
            
            this.showNotification('Admin login successful!');
        } else {
            this.showNotification('Invalid password!', 'error');
            document.getElementById('adminPassword').value = '';
        }
    }

    renderAdminProducts() {
        const adminList = document.getElementById('adminProductsList');
        
        if (this.products.length === 0) {
            adminList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box"></i>
                    <h4>No products to manage</h4>
                    <p>Add your first product using the form above!</p>
                </div>
            `;
            return;
        }

        adminList.innerHTML = this.products.map(product => `
            <div class="admin-product-item ${this.isOutOfStock(product) ? 'out-of-stock' : ''}">
                <img src="${product.image}" alt="${product.name}" class="admin-product-image"
                     onerror="this.src='https://via.placeholder.com/60x60?text=Product'">
                <div class="admin-product-info">
                    <div><strong>${product.name}</strong></div>
                    <div>$${product.price.toFixed(2)}</div>
                    <div class="stock-status">
                        <span class="stock-quantity ${this.isOutOfStock(product) ? 'out-of-stock' : this.isLowStock(product) ? 'low-stock' : 'in-stock'}">
                            <i class="fas fa-box"></i> Stock: ${product.stock_quantity || 0}
                            ${this.isOutOfStock(product) ? '(Out of Stock)' : this.isLowStock(product) ? '(Low Stock)' : ''}
                        </span>
                    </div>
                    <div class="product-description-admin">${product.description.substring(0, 50)}...</div>
                </div>
                <div class="admin-product-actions">
                    <button class="edit-stock-btn" onclick="store.editStock(${product.id}, ${product.stock_quantity || 0})">
                        <i class="fas fa-edit"></i> Stock
                    </button>
                    <button class="delete-product-btn" onclick="store.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Modal Management
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        if (modalId === 'cartModal') {
            this.renderCartItems();
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    openCartModal() {
        this.openModal('cartModal');
    }

    // Utility Methods
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async renderAdminOrders() {
        const adminOrdersList = document.getElementById('adminOrdersList');
        if (!adminOrdersList) return;

        try {
            const orders = await SupabaseECommerce.getAllOrders();
            const recentOrders = orders.slice(0, 10); // Show last 10 orders

            if (recentOrders.length === 0) {
                adminOrdersList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <h4>No orders yet</h4>
                        <p>Orders will appear here when customers make purchases</p>
                    </div>
                `;
                return;
            }

            adminOrdersList.innerHTML = recentOrders.map(order => `
                <div class="admin-order-item">
                    <div class="admin-order-info">
                        <h6>Order #${order.id}</h6>
                        <p><strong>${order.customer_name}</strong> - ${order.customer_email}</p>
                        <p>${order.items.length} item(s) - $${order.total_amount.toFixed(2)}</p>
                        <p><i class="fas fa-clock"></i> ${new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                        <span class="order-status ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading orders:', error);
            adminOrdersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error loading orders</h4>
                    <p>Please check your connection and try again</p>
                </div>
            `;
        }
    }

    async refreshOrders() {
        const refreshBtn = document.getElementById('refreshOrdersBtn');
        const originalText = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<div class="loading-spinner"></div> Refreshing...';
        refreshBtn.disabled = true;
        
        try {
            await this.renderAdminOrders();
            this.showNotification('Orders refreshed successfully!');
        } catch (error) {
            this.showNotification('Error refreshing orders', 'error');
        } finally {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    editStock(productId, currentStock) {
        const newStock = prompt(`Update stock quantity for this product:\n\nCurrent stock: ${currentStock}`, currentStock);
        
        if (newStock === null) return; // User cancelled
        
        const stockQuantity = parseInt(newStock);
        if (isNaN(stockQuantity) || stockQuantity < 0) {
            this.showNotification('Please enter a valid stock quantity (0 or higher)', 'error');
            return;
        }

        this.updateProductStock(productId, stockQuantity);
    }

    async updateProductStock(productId, newStock) {
        try {
            // Update in Supabase
            await SupabaseECommerce.updateProduct(productId, { stock_quantity: newStock });
            
            // Update local products array
            const product = this.products.find(p => p.id === productId);
            if (product) {
                product.stock_quantity = newStock;
            }
            
            // Re-render everything to show updated stock
            this.renderProducts();
            this.renderAdminProducts();
            
            this.showNotification('Stock quantity updated successfully!');
        } catch (error) {
            console.error('Error updating stock:', error);
            this.showNotification('Error updating stock quantity. Please try again.', 'error');
        }
    }
}

// Initialize the store when the page loads
let store;
document.addEventListener('DOMContentLoaded', () => {
    store = new ECommerceStore();
    // Make store globally available for inline event handlers
    window.store = store;
});