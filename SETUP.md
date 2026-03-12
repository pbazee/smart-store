# Smartest Store KE - Setup Guide

## Installation & Environment Setup

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (PostgreSQL database)
- Clerk account (authentication)
- Paystack account (payment processing)

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# ===== DEMO MODE =====
USE_MOCK_DATA=false

# ===== SUPABASE (PostgreSQL) =====
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require"
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"

# ===== CLERK AUTHENTICATION =====
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"

# ===== PAYSTACK PAYMENTS =====
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxx"
PAYSTACK_SECRET_KEY="sk_test_xxx"

# ===== OPTIONAL: STRIPE PAYMENTS =====
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# ===== APP CONFIG =====
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

#### a. Supabase Connection
1. Go to [Supabase Console](https://supabase.com)
2. Create a new project
3. Copy the database connection string and paste into `DATABASE_URL`

#### b. Apply Migrations
```bash
npx prisma db push
```

#### c. Seed Development Data
```bash
npm run prisma:seed
```

This will create:
- Categories: Shoes, Clothes, Accessories
- 15+ sample products with variants
- Sample orders for testing

### 4. Clerk Authentication Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy API keys to `.env.local`
4. Configure user roles for admin functionality:
   - Go to Users → Select a user → Metadata (public)
   - Add: `{ "role": "admin" }`
5. Setup OAuth providers (optional):
   - Google, GitHub, etc.

### 5. Paystack Payment Setup

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Copy test keys from Account → API Keys
3. Paste into `.env.local`:
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`
4. Setup webhook (for production):
   - Settings → API Webhooks → Add Webhook
   - URL: `https://yourdomain.com/api/webhooks/paystack`
   - Events: charge.success, charge.failed

### 6. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`

---

## Project Structure

```
app/
  ├── (store)/                 # Public pages
  │   ├── page.tsx            # Home page
  │   ├── shop/               # Product browsing
  │   └── product/[slug]/     # Product details
  │
  ├── admin/                  # Protected admin routes
  │   ├── products/           # Manage products
  │   └── orders/             # Manage orders
  │
  ├── auth/                   # Authentication pages
  │   ├── sign-in/            # Login page
  │   └── sign-up/            # Registration page
  │
  ├── checkout/               # Checkout process
  ├── orders/                 # User order history
  ├── account/                # User profile
  │
  └── api/                    # API routes
      ├── admin/              # Admin endpoints
      ├── checkout/           # Payment initialization
      ├── orders/             # Order management
      └── webhooks/           # Payment webhooks

lib/
  ├── auth-utils.ts           # Authentication utilities
  ├── prisma.ts               # Prisma singleton client
  ├── store.ts                # Zustand cart store
  └── data-service.ts         # Database queries

prisma/
  ├── schema.prisma           # Database schema
  ├── seed.ts                 # Data seeding script
  └── seed-categories.ts      # Category seeding

components/
  ├── layout/                 # Layout components
  ├── product/                # Product components
  └── admin/                  # Admin components

types/
  ├── index.ts                # Application types
  └── api.ts                  # API response types
```

---

## Database Schema

### Products Table
- `id`: Unique identifier
- `name`: Product name
- `slug`: URL-friendly name
- `description`: Long description
- `category`: Product category
- `basePrice`: Base price in KES
- `images`: Array of image URLs
- `tags`: Product tags (new, trending, etc.)
- `isFeatured`: Featured on homepage
- `isNew`: New arrival flag

### Variants Table (colors, sizes)
- `id`: Unique identifier
- `productId`: Referenced product
- `color`: Color name
- `size`: Size designation
- `stock`: Available quantity
- `price`: Variant-specific price

### Orders Table
- `id`: Unique identifier
- `userId`: Customer (from Clerk)
- `orderNumber`: Human-readable order #
- `customerName`, `customerEmail`, `customerPhone`
- `address`, `city`: Shipping address
- `total`: Total amount in KES
- `status`: pending, processing, shipped, delivered, cancelled
- `paymentStatus`: pending, paid, failed, refunded
- `paymentMethod`: mpesa, card
- `paystackReference`: Paystack transaction reference

### Categories Table
- `id`: Unique identifier
- `name`: Category name
- `slug`: URL-friendly name
- `description`: Category description

---

## API Endpoints

### Public Endpoints
- `GET /api/products` - List all products
- `GET /api/products?category=shoes` - Filter by category

### Authentication Required
- `GET /api/orders` - Get user's orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/checkout/initialize-payment` - Start payment

### Admin Only (requires role: "admin" in Clerk metadata)
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `PATCH /api/admin/orders/[id]` - Update order status

### Webhooks
- `POST /api/webhooks/paystack` - Paystack payment callback

---

## Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel deploy

# Production envvars (set in Vercel dashboard)
# - Supabase connection string (production database)
# - Clerk production keys
# - Paystack production keys
```

### Self-Hosted

```bash
# Build
npm run build

# Start with environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \
CLERK_SECRET_KEY=sk_... \
DATABASE_URL=postgresql://... \
npm start
```

### Docker

```bash
docker build -t smartest-store-ke .
docker run -p 3000:3000 smartest-store-ke
```

---

## Testing

### Manual Testing

1. **Browse Products**
   - Go to http://localhost:3000/shop
   - Test category filtering
   - Add products to cart

2. **Checkout Flow**
   - Go to /checkout
   - Fill customer information
   - Select shipping address
   - Choose payment method (M-Pesa or Card)
   - Review order

3. **Payment (Paystack Test Mode)**
   - Use test card: 4084084084084081
   - Expiry: 12/25
   - CVV: 123
   - OTP: 123456

4. **Admin Dashboard**
   - Sign in with admin user
   - Go to /admin/products
   - Create, edit, delete products
   - Manage order statuses

### Email Testing
- Contact form submissions (if email configured)
- Order confirmation emails (stub implementation)

---

## Troubleshooting

### Database Connection Issues
```bash
# Test Supabase connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check schema
npx prisma studio
```

### Authentication Issues
- Verify Clerk keys in `.env.local`
- Check Clerk Dashboard → Instances → Settings → Paths
- Ensure /auth/sign-in exists

### Payment Issues
- Test Paystack keys in test mode
- Check webhook endpoint is accessible
- Verify webhook is registered in Paystack Dashboard

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

## Support

For issues or questions:
1. Check the documentation in code comments
2. Review Clerk, Supabase, and Paystack docs
3. Enable debug logging in development
4. Check server logs for API errors

---

**Last Updated:** March 9, 2026
**Version:** 1.0.0-MVP
