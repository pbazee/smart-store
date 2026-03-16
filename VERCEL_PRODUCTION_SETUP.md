# Smartest Store KE - Production Deployment Guide

## Overview

This is a Next.js e-commerce store for Kenyan fashion, featuring M-Pesa payments, user authentication, product management, and order tracking.

**Tech Stack:**
- Frontend: Next.js 14+, React, Tailwind CSS
- Backend: Next.js API routes, Node.js
- Database: Supabase (PostgreSQL)
- Auth: Email/password (custom) + Clerk (optional OAuth)
- Payments: Paystack (M-Pesa, card)
- Email: Resend
- Hosting: Vercel

---

## Vercel + Supabase Production Setup

### Quick Start (10 minutes)

Follow these steps in order to deploy to production:

#### Step 1: Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Select your GitHub repository
4. Click **Import**

#### Step 2: Add Environment Variables to Vercel
1. In the Vercel project settings, go to **Settings** → **Environment Variables**
2. Add each variable below as shown. **Select all three environments** (Production, Preview, Development):

| Variable | Value | Source |
|----------|-------|--------|
| `AUTH_SESSION_SECRET` | `openssl rand -base64 32` | Generate new |
| `DATABASE_URL` | POOLED connection string | Supabase |
| `DIRECT_URL` | DIRECT connection string | Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Supabase Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key | Supabase Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Supabase Settings |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | pk_live_... | Paystack Dashboard |
| `PAYSTACK_SECRET_KEY` | sk_live_... | Paystack Dashboard |
| `RESEND_API_KEY` | re_... | Resend Dashboard |
| `USE_MOCK_DATA` | `false` | (Production mode) |

**👇 GET THESE VALUES FROM SUPABASE:**

#### Step 3: Configure Supabase Connection URLs

1. **Go to Supabase Dashboard** → Select your project
2. **Get the Pooled URL (for DATABASE_URL):**
   - Click **Settings** → **Database** → **Connection Pooler**
   - Copy the **PostgreSQL** URI
   - It will look like: `postgresql://postgres:password@db.projectid.supabase.co:6543/postgres`
   - Add these query params at the end:
     ```
     ?sslmode=require&pgbouncer=true&connection_limit=10&connect_timeout=30&pool_timeout=60
     ```
   - Full example:
     ```
     postgresql://postgres:password@db.projectid.supabase.co:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=10&connect_timeout=30&pool_timeout=60
     ```

3. **Get the Direct URL (for DIRECT_URL):**
   - Click **Settings** → **Database**
   - Look under "Connection string" section
   - Copy the **PostgreSQL** URI (not pooler, the regular one on port 5432)
   - It will look like: `postgresql://postgres:password@db.projectid.supabase.co:5432/postgres`
   - Add these query params:
     ```
     ?sslmode=require&connection_limit=10&pool_timeout=60
     ```
   - Full example:
     ```
     postgresql://postgres:password@db.projectid.supabase.co:5432/postgres?sslmode=require&connection_limit=10&pool_timeout=60
     ```

4. **Get Public Keys (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY):**
   - Click **Settings** → **API**
   - Copy **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **Anon Key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Get Service Role Key (SUPABASE_SERVICE_ROLE_KEY):**
   - Same place: **Settings** → **API**
   - Scroll down to "Service Role Secret"
   - Copy it → Use as `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **KEEP THIS SECRET** - Never expose in frontend

#### Step 4: Enable Supabase Auth Providers (Optional - if using OAuth)
*Skip this if using email/password only (recommended for Kenya market)*

1. Go to Supabase → **Authentication** → **Providers**
2. Enable "Email" (enabled by default)
3. To add Google OAuth:
   - Enable "Google"
   - Add your Google OAuth credentials
   - Set redirect URL: `https://your-vercel-domain.vercel.app/auth/callback`

#### Step 5: Configure Paystack Webhook (for payment confirmation)

1. Go to **Paystack Dashboard** → **Settings** → **API Keys & Webhooks**
2. Find "Webhooks" section
3. Add webhook URL:
   ```
   https://your-vercel-domain.vercel.app/api/webhooks/paystack
   ```
4. Select events:
   - ✅ charge.success
   - ✅ charge.failed
5. Copy **Public/Secret Keys**:
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` = Public Key
   - `PAYSTACK_SECRET_KEY` = Secret Key

#### Step 6: Deploy

1. In Vercel, click **Deploy**
2. Wait for build to complete
3. Check **Function Logs** for any errors:
   - Go to your Vercel project
   - Click the deployment
   - Click **Logs** tab
   - Look for any database connection errors

#### Step 7: Test the Deployment

Visit your Vercel URL:
- [ ] Homepage loads
- [ ] Can browse products
- [ ] Sign-in/signup page works
- [ ] Can add items to cart
- [ ] Checkout page loads without database errors
- [ ] Payment initialization works

---

## Common Issues & Fixes

### Issue: "Database connection failed" on Checkout

**Cause:** DATABASE_URL or DIRECT_URL not set in Vercel

**Fix:**
1. Go to Vercel Settings → Environment Variables
2. Verify both variables are set
3. Check they use correct Supabase connection strings
4. Redeploy: Click deployment → **Redeploy**

### Issue: Supabase Connection Timeout

**Cause:** Network issues or resource limits

**Fix:**
1. Verify `pgbouncer=true` is in DATABASE_URL query params
2. Check Supabase project is active (not paused)
3. In Supabase → **Settings** → **Infrastructure**, verify region is correct
4. Increase `connection_limit` to 20 in DATABASE_URL

### Issue: Authentication Fails

**Cause:** AUTH_SESSION_SECRET not set or changed

**Fix:**
1. Generate new secret: `openssl rand -base64 32`
2. Add to Vercel: `AUTH_SESSION_SECRET`
3. Redeploy

### Issue: Paystack Payments Not Working

**Cause:** Missing or incorrect PAYSTACK keys

**Fix:**
1. Verify you're using **LIVE** keys (pk_live_*, sk_live_*), not test keys
2. Add to Vercel environment variables
3. Verify webhook is configured correctly
4. Test in Paystack Dashboard → Test Transaction

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd smartest-store-ke
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Local Environment
```bash
# Copy example env
cp .env.example .env.local

# Edit .env.local with your actual values
# (all the values from Step 2 above)
```

### 4. Run Database Migrations
```bash
npm run prisma:migrate
```

### 5. Seed Sample Data (Optional)
```bash
npm run prisma:seed
```

### 6. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## File Structure

```
smartest-store-ke/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication APIs
│   │   ├── checkout/      # Payment APIs
│   │   └── products/      # Product APIs
│   ├── admin/             # Admin dashboard
│   ├── checkout/          # Checkout flow
│   ├── sign-in/           # Customer sign-in
│   └── sign-up/           # Customer sign-up
│
├── components/
│   ├── auth/              # Authentication components
│   ├── shop/              # Shopping components
│   ├── product/           # Product components
│   └── layout/            # Layout components
│
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── session-user.ts    # Session management
│   ├── paystack.ts        # Paystack integration
│   └── supabase-*.ts      # Supabase utilities
│
├── prisma/
│   └── schema.prisma      # Database schema
│
├── .env.example           # Example env vars
└── package.json           # Dependencies
```

---

## Key Features

### Authentication
- Email/password sign-up and sign-in for customers
- Admin login for store management
- Session management with secure cookies

### E-Commerce
- Product catalog with categories, filters, search
- Shopping cart (client-side storage)
- Wish list functionality
- Product variants (size, color, etc.)

### Payments
- Paystack integration (M-Pesa, card payments)
- Payment status tracking
- Order management

### Admin Features
- Product management
- Category management  
- Order tracking and fulfillment
- Coupon/discount management
- Site settings and announcements
- Blog posts and hero slides

---

## Database Schema

Key tables:
- `User` - Customers and admins
- `Product` - Inventory
- `Category` - Product categories
- `Order` - Customer orders
- `OrderItem` - Items in orders
- `Cart` - Shopping carts
- `Variant` - Product variants
- `StoreSettings` - Global settings

Full schema: See `prisma/schema.prisma`

---

## Environment Variables Reference

| Variable | Required | Production | Purpose |
|----------|----------|------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Yes | Supabase API endpoint |
| DATABASE_URL | Yes | Yes | Pooled DB connection |
| DIRECT_URL | Yes | Yes | Direct DB connection |
| PAYSTACK_SECRET_KEY | Yes | Yes | Payment processing |
| AUTH_SESSION_SECRET | Yes | Yes | Session encryption |
| RESEND_API_KEY | No | No | Email sending |
| USE_MOCK_DATA | No | No | Use dummy data |

---

## Support & Troubleshooting

### Check Logs
```bash
# Local development
npm run dev
# Errors appear in terminal

# Production (Vercel)
# Go to https://vercel.com → Project → Deployments → Latest → Logs
```

### Database Issues
```bash
# Reset local database
npm run prisma:migrate reset

# Verify connection
npx prisma db push
```

### Clear Build Cache
```bash
# In Vercel: Settings → Git → Clear cache → Redeploy
```

---

## Security Checklist

Before production:
- [ ] `AUTH_SESSION_SECRET` is set (not default)
- [ ] `PAYSTACK_SECRET_KEY` is LIVE key (not test)
- [ ] `CLERK_SECRET_KEY` (if used) is LIVE key
- [ ] `DATABASE_URL` uses production database
- [ ] No secrets in git history
- [ ] All environment variables reviewed
- [ ] HTTPS enforced on Vercel (default)
- [ ] Admin users have strong passwords

---

## Deployment Checklist

Before pushing to production:
- [ ] All environment variables set in Vercel
- [ ] Database migrations run
- [ ] Paystack webhook configured
- [ ] Email service (Resend) configured (optional)
- [ ] Tests passing: `npm test`
- [ ] Build successful: `npm run build`
- [ ] No console errors on key pages
- [ ] Payments working in test mode
- [ ] Admin dashboard accessible

---

## Git Commands for Deployment

```bash
# 1. Make your changes
git add .
git commit -m "Your commit message"

# 2. Push to deploy (Vercel auto-deploys)
git push origin main

# 3. Check deployment status
# Visit: https://vercel.com/dashboard → Your Project → Deployments
```

---

## Next Steps

1. **Deploy**: Follow "Vercel + Supabase Production Setup" above
2. **Test**: Run through "Test the Deployment" checklist
3. **Monitor**: Check Vercel logs for issues
4. **Configure**: Set up email, analytics, etc. as needed

---

**Last Updated:** March 15, 2026  
**For questions:** See README.md or contact support
