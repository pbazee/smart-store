# Production Environment Setup Guide for Vercel

## Overview
This document ensures the Vercel deployment is identical to the localhost environment by properly configuring all required environment variables and database connections.

## Critical Environment Variables

### 1. Application URL (REQUIRED for Production)
```
NEXT_PUBLIC_APP_URL=https://smart-store-iota.vercel.app
```
- **Purpose**: Used for metadata, OAuth redirects, email links, and social sharing
- **Impact**: Missing this causes broken og:image, wrong canonical URLs, auth failures
- **Where it's used**: app/layout.tsx (metadata), checkout API, Clerk auth redirects

### 2. Database Connection (REQUIRED)
```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]
DIRECT_URL=postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]
```
- **Purpose**: Connection to production PostgreSQL database (Supabase)
- **Important**: Must point to DIFFERENT database than development (avoid data leaks)
- **Note**: Supabase connection pooler URL for DATABASE_URL, direct URL for DIRECT_URL
- **Impact**: Without this, app falls back to defaults or uses development data

### 3. Supabase Storage (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```
- **Purpose**: File storage for product images, blog images, etc.
- **Prefix**: NEXT_PUBLIC_ means these are exposed to the client
- **Visibility**: Can be public (anon key has restricted permissions)

### 4. Clerk Authentication (REQUIRED)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[YOUR_LIVE_KEY]
CLERK_SECRET_KEY=sk_live_[YOUR_LIVE_KEY]
```
- **IMPORTANT**: Use LIVE keys in production, NOT test keys
- **Prefix**: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is exposed to client
- **Impact**: Wrong keys = authentication fails, users can't login/signup
- **Where configured**: Clerk dashboard > API Keys

### 5. Paystack Payment Processing (REQUIRED for M-Pesa)
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_[YOUR_LIVE_KEY]
PAYSTACK_SECRET_KEY=sk_live_[YOUR_LIVE_KEY]
```
- **IMPORTANT**: Use LIVE keys in production
- **Purpose**: Payment processing for M-Pesa and card payments
- **Impact**: Missing = checkout fails, payments can't be processed
- **Where configured**: Paystack dashboard > API Keys & Webhooks

### 6. Email Service (REQUIRED)
```
RESEND_API_KEY=re_[YOUR_API_KEY]
```
- **Purpose**: Sending transactional emails (order confirmations, etc.)
- **Impact**: Missing = email notifications don't work

### 7. Session Secret (REQUIRED)
```
AUTH_SESSION_SECRET=[GENERATE_A_RANDOM_VALUE]
```
- **Purpose**: Encrypting session data
- **How to generate**: `openssl rand -base64 32`
- **Impact**: Missing = session management fails, user data at risk

### Optional Variables

```
# Stripe (if you want to add Stripe payment method)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Data mode flag (usually keep as false for production)
USE_MOCK_DATA=false
```

## Setup Instructions for Vercel

### Step 1: Access Vercel Project Settings
1. Go to https://vercel.com/dashboard
2. Select your project: `smartest-store-ke` (or your project name)
3. Click **Settings** → **Environment Variables**

### Step 2: Add All Variables
For each variable in the list above:
1. Click "Add New"
2. Enter the variable name (e.g., `DATABASE_URL`)
3. Enter the value
4. Select which environments it applies to:
   - **Production** - for live deployment
   - **Preview** - for pull request deployments
   - **Development** - for local development (usually not needed)

### Step 3: Verify Database Connectivity
After adding DATABASE_URL and DIRECT_URL:
1. Go to your Vercel deployment
2. Check the **Function Logs**
3. Look for messages like: `[StoreSettings] Loaded from database:` or `[Announcements] Loaded X announcements`
4. If you see `[XXX] Query failed:` messages, the database connection failed

### Step 4: Verify All Data Loads
Check that these appear in logs:
- `[Announcements] Loaded X announcements from database`
- `[StoreSettings] Loaded from database:` with email/phone
- `[WhatsAppSettings] Loaded from database` (if configured)
- Product data is loaded without "falling back to defaults"

## Troubleshooting Production Issues

### Issue: Missing App Metadata (broken og:image, wrong title in links)
**Cause**: `NEXT_PUBLIC_APP_URL` not set or wrong
**Fix**: 
```
NEXT_PUBLIC_APP_URL=https://smart-store-iota.vercel.app
```
Redeploy after changing.

### Issue: Missing Support Email/Phone/Settings
**Cause**: Database connection failed or database is empty
**Check**: 
1. Verify DATABASE_URL is correct
2. Check Vercel Function Logs for: `[StoreSettings] Query failed:`
3. Make sure production database has admin settings configured (check Supabase dashboard)

### Issue: Announcements/Popups Missing
**Cause**: Database connection failed
**Check**: Vercel logs for: `[Announcements] Database query failed:`

### Issue: Authentication Fails (users can't login)
**Cause**: Wrong Clerk keys (test keys instead of live)
**Fix**:
1. Go to Clerk dashboard
2. Verify you're using LIVE keys (start with `pk_live_` and `sk_live_`)
3. Update environment variables in Vercel
4. Redeploy

### Issue: Checkout Page Broken / Payments Fail
**Cause**: Missing PAYSTACK_SECRET_KEY or NEXT_PUBLIC_APP_URL
**Fix**:
1. Verify PAYSTACK_SECRET_KEY is set and correct
2. Verify NEXT_PUBLIC_APP_URL is set to production URL
3. Check Paystack webhook URLs are configured

## Data Seeding & Database Setup

### Production Database Should Have:
1. **StoreSettings** record with:
   - supportEmail
   - supportPhone  
   - adminNotificationEmail
   
2. **AnnouncementMessage** records (will auto-seed if empty)

3. **Products** (if using manual product management)

4. **Categories** (if using manual categories)

### To Verify Production Database Has Data:
1. Go to Supabase dashboard
2. Select your production project
3. Open "SQL Editor" or use "Table Editor"
4. Check each table for data:
   - `"StoreSettings"` - should have 1 record
   - `"AnnouncementMessage"` - should have records
   - `"Product"` - should have all your products

### If Production Database is Empty:
1. Check if development and production are using the SAME database (they shouldn't!)
2. Use Supabase dashboard to manually add StoreSettings record
3. For AnnouncementMessages, the app will auto-seed on first request
4. Reimport products if needed

## Environment Variable Checklist

Use this checklist to ensure nothing is missing:

- [ ] `NEXT_PUBLIC_APP_URL` = production URL
- [ ] `DATABASE_URL` = production database (not localhost)
- [ ] `DIRECT_URL` = same as DATABASE_URL (direct connection)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = set and accessible
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = set
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_` key
- [ ] `CLERK_SECRET_KEY` = `sk_live_` key
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` = `pk_live_` or test key
- [ ] `PAYSTACK_SECRET_KEY` = `sk_live_` or test key
- [ ] `RESEND_API_KEY` = set
- [ ] `AUTH_SESSION_SECRET` = set and unique

## Redeployment After Changes

After adding/changing environment variables:

1. Go to Vercel dashboard
2. Click on your project
3. Click **Deployments**
4. Click "..." next to the latest deployment → **Redeploy**
5. Select "Use existing git commit" (no rebuild needed)
6. Wait for deployment to complete

Or via Git:
```bash
git push origin main
```

## Debugging in Production

### View Function Logs:
1. Vercel dashboard → Your project → **Deployments** → Latest → **Logs**
2. Look for `[StoreSettings]`, `[Announcements]`, etc. messages

### Enable More Verbose Logging:
Insert this in pages/layout.tsx if you need more debugging:
```typescript
if (process.env.NODE_ENV === 'production') {
  console.log('[Init] Environment:', {
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasDb: !!process.env.DATABASE_URL,
    hasClerk: !!process.env.CLERK_SECRET_KEY,
  });
}
```

## Testing Production Parity

### Local Testing of Production Config:
```bash
# Temporarily set production env vars in .env.local
NEXT_PUBLIC_APP_URL=https://smart-store-iota.vercel.app
DATABASE_URL=postgresql://... (production DB)

npm run build
npm start
```

### Check:
1. Homepage loads correctly
2. All announcements/settings display
3. Shop page shows products
4. Checkout works
5. Admin pages accessible if logged in

## Related Files to Review
- [app/layout.tsx](app/layout.tsx) - metadata configuration
- [lib/app-url.ts](lib/app-url.ts) - URL resolution logic
- [lib/store-settings.ts](lib/store-settings.ts) - settings loading
- [lib/announcement-service.ts](lib/announcement-service.ts) - announcements loading
- [lib/prisma.ts](lib/prisma.ts) - database connection
