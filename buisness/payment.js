// Payment processing with Stripe integration

class PaymentProcessor {
    constructor() {
        // Replace with your actual Stripe publishable key
        this.stripePublicKey = 'pk_test_51RsYCLLHyKPtHB8bHeQcR7ijvLNRcq43w03P7NdfIJ8y3SmHbjsilch1dw0irzI0IDY8kyFWpxcpTtnSGWsfPCIv00N4Blg8nd'; // DEMO KEY - REPLACE THIS
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        
        this.initializeStripe();
    }

    async initializeStripe() {
        try {
            // Initialize Stripe
            this.stripe = Stripe(this.stripePublicKey);
            this.elements = this.stripe.elements();

            // Create card element
            this.cardElement = this.elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                    invalid: {
                        color: '#9e2146',
                    },
                },
            });

            // Mount card element
            this.cardElement.mount('#card-element');

            // Handle real-time validation errors from the card Element
            this.cardElement.on('change', ({ error }) => {
                const displayError = document.getElementById('card-errors');
                if (error) {
                    displayError.textContent = error.message;
                } else {
                    displayError.textContent = '';
                }
            });

        } catch (error) {
            console.error('Error initializing Stripe:', error);
            this.showFallbackPayment();
        }
    }

    async processPayment(customerInfo, orderData) {
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const originalText = placeOrderBtn.innerHTML;
        
        try {
            // Disable button and show loading
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = '<div class="loading-spinner"></div> Processing Payment...';

            // Validate customer information
            if (!this.validateCustomerInfo(customerInfo)) {
                throw new Error('Please fill in all required fields');
            }

            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

            if (paymentMethod === 'card') {
                return await this.processCardPayment(customerInfo, orderData);
            } else if (paymentMethod === 'paypal') {
                return await this.processPayPalPayment(customerInfo, orderData);
            } else {
                throw new Error('Invalid payment method selected');
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            throw error;
        } finally {
            // Re-enable button
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = originalText;
        }
    }

    async processCardPayment(customerInfo, orderData) {
        try {
            // Create payment method
            const { error, paymentMethod } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.cardElement,
                billing_details: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    address: {
                        line1: customerInfo.address,
                    },
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            // In a real implementation, you would send this to your backend
            // For demo purposes, we'll simulate the payment process
            return await this.simulatePaymentIntent(paymentMethod, orderData);

        } catch (error) {
            throw new Error(`Card payment failed: ${error.message}`);
        }
    }

    async processPayPalPayment(customerInfo, orderData) {
        // Simulate PayPal payment process
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate random success/failure for demo
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({
                        id: 'paypal_' + Date.now(),
                        status: 'succeeded',
                        amount: orderData.total * 100, // PayPal amounts in cents
                        payment_method: 'paypal'
                    });
                } else {
                    reject(new Error('PayPal payment was declined'));
                }
            }, 2000);
        });
    }

    async simulatePaymentIntent(paymentMethod, orderData) {
        // Simulate backend payment processing
        // In a real app, you would create a payment intent on your backend
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate random success/failure for demo
                if (Math.random() > 0.05) { // 95% success rate for demo
                    resolve({
                        id: 'pi_' + Date.now(),
                        status: 'succeeded',
                        amount: orderData.total * 100, // Stripe amounts in cents
                        payment_method: paymentMethod.id
                    });
                } else {
                    reject(new Error('Your card was declined. Please try a different payment method.'));
                }
            }, 2000);
        });
    }

    validateCustomerInfo(customerInfo) {
        return (
            customerInfo.name &&
            customerInfo.email &&
            customerInfo.address &&
            this.isValidEmail(customerInfo.email)
        );
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFallbackPayment() {
        // Show alternative payment methods if Stripe fails to load
        const cardElement = document.getElementById('card-element');
        if (cardElement) {
            cardElement.innerHTML = `
                <div class="fallback-payment">
                    <p><i class="fas fa-exclamation-triangle"></i> Card payments temporarily unavailable</p>
                    <p>Please use PayPal or contact us directly to place your order.</p>
                </div>
            `;
        }
    }

    // Demo mode notification
    showDemoNotification() {
        const notification = document.createElement('div');
        notification.className = 'demo-notification';
        notification.innerHTML = `
            <div class="demo-content">
                <h4><i class="fas fa-info-circle"></i> Demo Mode</h4>
                <p>This is a demonstration. No real payments will be processed.</p>
                <p>Use test card: 4242 4242 4242 4242</p>
                <button onclick="this.parentElement.parentElement.remove()">Got it</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
}

// Create global payment processor instance
window.paymentProcessor = new PaymentProcessor();

// Add demo notification styles
const style = document.createElement('style');
style.textContent = `
    .demo-notification {
        font-family: Arial, sans-serif;
    }
    
    .demo-content h4 {
        color: #e67e22;
        margin-bottom: 1rem;
    }
    
    .demo-content p {
        margin-bottom: 0.5rem;
        color: #7f8c8d;
    }
    
    .demo-content button {
        background: #3498db;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 1rem;
    }
    
    .fallback-payment {
        text-align: center;
        padding: 2rem;
        background: #fff3cd;
        border-radius: 8px;
        color: #856404;
    }
`;
document.head.appendChild(style);