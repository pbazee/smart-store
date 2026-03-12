# Admin Dashboard Setup & Usage Guide

## Setting Up Admin Users

### In Clerk Dashboard

1. **Create Admin User**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Users → Create User
   - Set email and password
   - Verify email

2. **Grant Admin Role**
   - Users → Select the user
   - Scroll to "Metadata" section (public)
   - Click "Edit"
   - Add this metadata:
   ```json
   {
     "role": "admin"
   }
   ```
   - Save

3. **Verify Admin Access**
   - Sign in as admin user
   - Navigate to http://localhost:3000/admin
   - Should see Admin Dashboard

---

## Admin Dashboard Features

### Products Management (`/admin/products`)

#### View Products
- List of all products with images
- Edit/Delete buttons on each product
- Search and filter capabilities
- Real-time database updates

#### Create Product
1. Click "New Product" button
2. Fill in product details:
   - **Name** (required): Product name
   - **Slug** (required): URL-friendly name (e.g., "nike-air-max")
   - **Description**: Long product description
   - **Category**: Select from Shoes, Clothes, Accessories
   - **Base Price**: Price in KES
   - **Gender**: Male, Female, or Unisex
   - **Images**: Upload product images
   - **Tags**: Add tags (trending, new, featured)
3. Add variants (colors/sizes):
   - Click "Add Variant"
   - Set color, size, stock count, and price
   - Multiple variants per product allowed
4. Click "Create Product"

#### Edit Product
1. Click edit icon on product card
2. Modify details
3. Update variants if needed
4. Save changes

#### Delete Product
1. Click delete icon on product card
2. Confirm deletion
3. Product removed from catalog

#### Featured Products
- Toggle "Featured" flag on product
- Featured products appear on homepage
- Up to 12 featured products recommended

---

### Orders Management (`/admin/orders`)

#### View Orders
- Table of all orders (paginated)
- Order number, customer, amount, status
- Payment status indicator
- Sort and filter options

#### Order Details
1. Click on any order to expand/open detail page
2. View:
   - Customer information
   - Shipping address
   - Order items and prices
   - Payment method
   - Current status
   - Order timeline

#### Update Order Status
1. Click on order or open detail page
2. Status dropdown shows options:
   - **Pending** → Order received
   - **Processing** → Picking and packing
   - **Shipped** → Order dispatched
   - **Delivered** → Order reached customer
   - **Cancelled** → Order canceled
3. Select new status
4. Changes save to database immediately
5. (Optional) Customer notified via email

#### Payment Status
- **Pending**: Awaiting payment
- **Paid**: Payment verified via Paystack
- **Failed**: Payment declined
- **Refunded**: Refund processed

---

## Admin API Endpoints

### Products Endpoints

**GET /api/admin/products**
- List all products
- Admin auth required
- Query: pagination, filtering
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/admin/products
```

**POST /api/admin/products**
- Create new product
- Admin auth required
```json
{
  "name": "Nike Air Max",
  "slug": "nike-air-max",
  "category": "shoes",
  "basePrice": 15999,
  "gender": "unisex",
  "variants": [
    {
      "color": "Black",
      "size": "40",
      "stock": 10,
      "price": 15999
    }
  ]
}
```

**PATCH /api/admin/products/[id]**
- Update product
- Admin auth required
```json
{
  "name": "Nike Air Max Updated",
  "basePrice": 16999,
  "isFeatured": true
}
```

**DELETE /api/admin/products/[id]**
- Delete product (and variants)
- Admin auth required
- No request body needed

### Orders Endpoints

**PATCH /api/admin/orders/[id]**
- Update order status
- Admin auth required
```json
{
  "status": "shipped",
  "paymentStatus": "paid"
}
```

---

## Best Practices

### Product Management
1. **Use Clear Slugs**: Use hyphens in slugs (e.g., "nike-air-max-2024")
2. **High-Quality Images**: Use multiple product images (2-5 per product)
3. **Accurate Stock**: Keep inventory counts up-to-date
4. **Category Consistency**: Keep category names consistent
5. **Variant Organization**: Group similar variants (sizes, colors)

### Order Management
1. **Process Quickly**: Update status within 24 hours of order
2. **Communicate**: Be responsive to customer inquiries
3. **Tracking**: Update status as order progresses through fulfillment
4. **Refunds**: Use appropriate payment status for refunded orders
5. **Records**: Keep detailed order notes for complex cases

### Inventory Management
1. **Stock Monitoring**: Check stock levels regularly
2. **Reorder Points**: Set automated reorders at 20% stock
3. **Seasonal Adjustments**: Adjust quantities for seasons
4. **Variant Balance**: Keep popular variants in stock
5. **Discontinuation**: Archive slow-moving variants

---

## Common Tasks

### Bulk Import Products
(Coming soon in v1.1)

### Export Orders Report
(Coming soon in v1.1)

### Customer Analytics
(Coming soon in v1.1)

### Inventory Alerts
(Coming soon in v1.1)

---

## Troubleshooting

### Can't Access Admin Dashboard
- **Issue**: Redirected to home
- **Solution**: Check metadata has `"role": "admin"` in Clerk
- **Verify**: Reload page after setting role (may need to log out/in)

### Products Not Appearing
- **Issue**: Created product but not visible in shop
- **Solution**: Check `USE_MOCK_DATA=false` in .env
- **Verify**: Restart development server

### Order Status Won't Update
- **Issue**: Status change not saving
- **Solution**: Check admin auth is working
- **Verify**: Check browser console for API errors

### Payment Not Verified
- **Issue**: Order shows paymentStatus="pending" after payment
- **Solution**: Webhook not received
- **Fix**: 
  - Check Paystack webhook settings
  - Verify URL is accessible from internet
  - Check server logs for webhook errors

---

## Security Notes

1. **Admin Role is Critical**: Only assign to trusted users
2. **API Keys**: Keep Paystack and Clerk keys secret
3. **Database**: Regular backups of Supabase
4. **Webhook Verification**: Always verify Paystack signatures
5. **Rate Limiting**: Implement for API endpoints

---

## Performance Tips

1. **Product Images**: Optimize/compress before upload
2. **Pagination**: Use pagination for large batches
3. **Caching**: Cache product listings on frontend
4. **Database**: Index slug field for faster lookups

---

**Last Updated:** March 9, 2026
**Version:** 1.0.0-MVP
