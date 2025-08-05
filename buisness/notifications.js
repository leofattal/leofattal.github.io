// Admin notification system for new orders

class AdminNotifications {
    constructor() {
        this.adminEmail = 'admin@accessoryshop.com'; // Default admin email
        this.emailNotificationsEnabled = true;
        this.lastOrderCheck = Date.now();
        this.newOrdersCount = 0;
        
        this.initializeEmailJS();
        this.startOrderPolling();
        this.loadSettings();
    }

    initializeEmailJS() {
        try {
            // Initialize EmailJS with your public key
            // Replace with your actual EmailJS public key
            emailjs.init('YOUR_EMAILJS_PUBLIC_KEY'); // DEMO - Replace this
            console.log('EmailJS initialized for admin notifications');
        } catch (error) {
            console.warn('EmailJS not available - using console notifications');
            this.emailNotificationsEnabled = false;
        }
    }

    loadSettings() {
        // Load admin settings from localStorage
        const savedEmail = localStorage.getItem('admin_email');
        const savedNotifications = localStorage.getItem('admin_notifications');
        
        if (savedEmail) {
            this.adminEmail = savedEmail;
            const emailInput = document.getElementById('adminEmail');
            if (emailInput) emailInput.value = savedEmail;
        }
        
        if (savedNotifications !== null) {
            this.emailNotificationsEnabled = savedNotifications === 'true';
            const checkbox = document.getElementById('emailNotifications');
            if (checkbox) checkbox.checked = this.emailNotificationsEnabled;
        }
    }

    saveSettings() {
        localStorage.setItem('admin_email', this.adminEmail);
        localStorage.setItem('admin_notifications', this.emailNotificationsEnabled.toString());
    }

    async sendOrderNotification(order, customerInfo) {
        if (!this.emailNotificationsEnabled) {
            console.log('Email notifications disabled');
            return;
        }

        try {
            // Show browser notification
            this.showBrowserNotification(order);

            // Send email notification (demo mode)
            await this.sendEmailNotification(order, customerInfo);
            
            // Update notification indicator
            this.updateNotificationIndicator();

        } catch (error) {
            console.error('Error sending admin notification:', error);
        }
    }

    showBrowserNotification(order) {
        // Request notification permission if not granted
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification('New Order Received! 🛍️', {
                body: `Order #${order.id} - $${order.total_amount.toFixed(2)}\nFrom: ${order.customer_name}`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛍️</text></svg>',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎀</text></svg>',
                tag: 'new-order',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                // Open admin modal to show orders
                if (window.store) {
                    window.store.openAdminModal();
                }
            };

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        }
    }

    async sendEmailNotification(order, customerInfo) {
        try {
            // In demo mode, we'll simulate email sending
            // Replace this with actual EmailJS call for production
            
            const templateParams = {
                to_email: this.adminEmail,
                order_id: order.id,
                order_total: order.total_amount.toFixed(2),
                customer_name: order.customer_name,
                customer_email: order.customer_email,
                customer_phone: order.customer_phone || 'Not provided',
                shipping_address: order.shipping_address,
                items_list: this.formatItemsList(order.items),
                order_date: new Date().toLocaleDateString(),
                order_time: new Date().toLocaleTimeString()
            };

            // Demo simulation
            console.log('📧 Admin Email Notification (DEMO MODE):', {
                to: this.adminEmail,
                subject: `New Order #${order.id} - $${order.total_amount.toFixed(2)}`,
                content: templateParams
            });

            // Uncomment for real EmailJS integration:
            /*
            await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
            console.log('Admin email notification sent successfully');
            */

            return true;
        } catch (error) {
            console.error('Failed to send email notification:', error);
            return false;
        }
    }

    formatItemsList(items) {
        return items.map(item => 
            `• ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
    }

    startOrderPolling() {
        // Check for new orders every 30 seconds
        setInterval(() => {
            this.checkForNewOrders();
        }, 30000);
    }

    async checkForNewOrders() {
        try {
            const orders = await SupabaseECommerce.getAllOrders();
            const newOrders = orders.filter(order => 
                new Date(order.created_at).getTime() > this.lastOrderCheck
            );

            if (newOrders.length > 0) {
                this.newOrdersCount += newOrders.length;
                this.updateNotificationIndicator();
                
                // Process each new order
                newOrders.forEach(order => {
                    this.showBrowserNotification(order);
                });
            }

            this.lastOrderCheck = Date.now();
        } catch (error) {
            console.error('Error checking for new orders:', error);
        }
    }

    updateNotificationIndicator() {
        const adminBtn = document.getElementById('adminBtn');
        if (!adminBtn) return;

        // Remove existing indicator
        const existing = adminBtn.querySelector('.notification-indicator');
        if (existing) existing.remove();

        // Add new indicator if there are new orders
        if (this.newOrdersCount > 0) {
            const indicator = document.createElement('span');
            indicator.className = 'notification-indicator';
            indicator.textContent = this.newOrdersCount > 9 ? '9+' : this.newOrdersCount;
            adminBtn.style.position = 'relative';
            adminBtn.appendChild(indicator);
        }
    }

    clearNotifications() {
        this.newOrdersCount = 0;
        this.updateNotificationIndicator();
    }

    updateAdminEmail(email) {
        this.adminEmail = email;
        this.saveSettings();
    }

    toggleEmailNotifications(enabled) {
        this.emailNotificationsEnabled = enabled;
        this.saveSettings();
    }

    // Demo notification for testing
    sendTestNotification() {
        const testOrder = {
            id: 'TEST-' + Date.now(),
            total_amount: 99.99,
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            items: [
                { name: 'Test Product', quantity: 2, price: 49.99 }
            ],
            created_at: new Date().toISOString()
        };

        this.sendOrderNotification(testOrder, {
            name: 'Test Customer',
            email: 'test@example.com'
        });
    }
}

// Initialize admin notifications
window.adminNotifications = new AdminNotifications();

// Request notification permission on page load
document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Browser notifications enabled for admin');
            }
        });
    }
});