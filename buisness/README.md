# 🎀 Accessory Shop - Supabase Integration

A modern e-commerce website with real-time database synchronization using Supabase.

## 🚀 Features

### Customer Features
- Browse product catalog
- Add items to shopping cart
- Real-time cart updates
- Secure checkout process
- Order tracking

### Admin Features
- Secure admin panel
- Add/delete products
- Real-time product management
- Order management
- Cloud-based data storage

### Technical Features
- **Supabase Integration** - Real-time database
- **Responsive Design** - Mobile and desktop friendly
- **Local Storage Fallback** - Works offline
- **Image Support** - Product images with fallbacks
- **Session Management** - Cross-device cart sync (optional)

## 📋 Setup Instructions

### 1. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open the SQL Editor
3. Copy and paste the contents of `database_schema.sql`
4. Run the SQL commands to create tables and policies

### 2. Configuration

1. Update the Supabase credentials in `supabase.js`:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseKey = 'YOUR_ANON_KEY';
   ```

2. Change the admin password in `main.js` (line 8):
   ```javascript
   this.adminPassword = 'your_secure_password';
   ```

### 3. Deployment

The website works with any static hosting service:
- GitHub Pages (current setup)
- Netlify
- Vercel
- Any web server

## 🗄️ Database Schema

### Tables Created:

1. **products** - Store product information
   - id, name, price, description, image
   - Timestamps for creation and updates

2. **orders** - Track customer orders
   - session_id, total_amount, items (JSON)
   - Order status and timestamps

3. **carts** (optional) - Cross-device cart sync
   - session_id, cart_data (JSON)
   - Automatic cart persistence

## 🔐 Security Features

- **Row Level Security (RLS)** enabled
- **Public read access** for products
- **Session-based** cart management
- **Admin password** protection
- **Input validation** on all forms

## 📱 Usage

### For Customers:
1. Browse products on the homepage
2. Click "Add to Cart" on desired items
3. View cart by clicking the cart icon
4. Adjust quantities or remove items
5. Click "Checkout" to place order

### For Admin:
1. Click "Admin" button in header
2. Enter admin password
3. Add new products using the form
4. Manage existing products
5. View orders in Supabase dashboard

## 🛠️ Customization

### Adding New Product Fields:
1. Add columns to the `products` table in Supabase
2. Update the product form in `index.html`
3. Modify the `addProduct()` function in `main.js`

### Styling Changes:
- Edit `styles.css` for visual customization
- Update colors, fonts, and layouts
- Modify responsive breakpoints

### Payment Integration:
- Add payment processor (Stripe, PayPal, etc.)
- Modify the `checkout()` function
- Add customer information collection

## 🔧 Troubleshooting

### Common Issues:

1. **Products not loading:**
   - Check Supabase credentials
   - Verify table creation
   - Check browser console for errors

2. **CORS errors:**
   - Ensure your domain is added to Supabase settings
   - Check RLS policies are correctly set

3. **Images not displaying:**
   - Verify image URLs are accessible
   - Check network connectivity
   - Images fall back to placeholders automatically

### Debug Mode:
Open browser Developer Tools (F12) to see:
- Network requests to Supabase
- Console logs for errors
- Local storage data

## 📊 Analytics

Monitor your store through:
- Supabase Dashboard for real-time data
- Orders table for sales tracking
- Product performance metrics

## 🚀 Future Enhancements

Potential features to add:
- User accounts and authentication
- Product categories and filtering
- Inventory management
- Email notifications
- Reviews and ratings
- Discount codes
- Shipping calculator
- Multi-language support

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Test with sample data
4. Review database policies

---

**Note:** Remember to keep your Supabase keys secure and never commit them to public repositories in production!