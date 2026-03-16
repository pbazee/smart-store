# Production Fixes - Complete Implementation Guide

## Overview

This document outlines the complete fixes for 3 critical production issues:
1. Database connection error banner on checkout
2. Sign-up page failing with generic errors
3. Sign-in page incomplete (no Google OAuth)

---

## FIXES IMPLEMENTED

### ✅ FIX #1: IMPROVED DATABASE ERROR HANDLING

**Files Modified:**
- `app/api/checkout/initialize-payment/route.ts`
- `app/api/checkout/confirm/route.ts`

**What Changed:**
Before: Generic "Database connection failed" error shown in production
After: 
- Development: Shows detailed connection diagnostics
- Production: Shows generic message but logs detailed error server-side
- Non-connection errors handled separately

**Impact:** Checkout page no longer shows scary DB error messages to production users

---

### ✅ FIX #2: BETTER SIGNUP ERROR REPORTING

**File Modified:**
- `app/auth/customer-auth.ts`

**What Changed:**
Before: Generic "Sign up failed" error hides real cause
After:
- Validates input before Prisma call
- Logs detailed error information
- Returns specific errors (duplicate email, service unavailable, etc.)
- Better error messages for common failures

**Impact:** Sign-up form now shows specific reasons for failures

---

### ✅ FIX #3: GOOGLE OAUTH IMPLEMENTATION

**New Files Created:**
1. `lib/supabase.ts` - Supabase client setup for App Router
2. `app/auth/callback/route.ts` - OAuth callback handler
3. Updated `app/auth/customer-auth.ts` - Added Google OAuth actions

**Component Updates:**
1. `components/auth/customer-sign-in-form.tsx` - Added Google button
2. `components/auth/customer-sign-up-form.tsx` - Added Google button

**What Changed:**
Before: No OAuth integration, only text mentioning Google
After:
- Full Google OAuth flow via Supabase
- Sign-in / Sign-up forms with Google buttons
- OAuth callback route that creates users automatically
- Email/password option below Google button

**Impact:** Users can now sign in/up with Google or email/password

---

## STEP-BY-STEP SETUP INSTRUCTIONS

### Step 1: Install Dependencies

Run this command in your terminal:

```bash
npm install @supabase/ssr@latest
```

### Step 2: Configure Supabase OAuth in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** and click to enable it
5. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials (Desktop app)
   - Authorized redirect URIs should include:
     ```
     https://vqqiyqmlckwknutlbfvw.supabase.co/auth/v1/callback
     ```
   - Copy the Client ID and Client Secret
6. Paste them into Supabase Google provider settings
7. Click **Save**

### Step 3: Add Production Redirect URLs to Supabase

In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add these Redirect URLs:
   - `https://smart-store-iota.vercel.app/auth/callback` (production)
   - `http://localhost:3000/auth/callback` (development)
   - `https://smart-store-iota.vercel.app/sign-in` (fallback)
   - `http://localhost:3000/sign-in` (development fallback)
3. Click **Save**

### Step 4: Verify Environment Variables in Vercel

In your Vercel project settings (Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://vqqiyqmlckwknutlbfvw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.vqqiyqmlckwknutlbfvw:...@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://postgres:...@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres?sslmode=require
```

**Verify:** All 5 variables are set and start with correct prefixes

### Step 5: Test Locally First

```bash
# Install dependencies
npm install

# Build to check for TypeScript errors
npm run build

# Start dev server
npm run dev
```

Then test on http://localhost:3000:
- [ ] Visit `/sign-in` - Should see Google button + Email form
- [ ] Visit `/sign-up` - Should see Google button + Email form  
- [ ] Try Google sign-in (will redirect to OAuth flow)
- [ ] Try email/password sign-up with test data
- [ ] Try email/password sign-in after sign-up
- [ ] Verify checkout doesn't show DB error banner

### Step 6: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat: Add Google OAuth and fix auth/DB errors

- Implement @supabase/ssr OAuth integration
- Add Google sign-in/sign-up buttons  
- Create /auth/callback route for OAuth redirects
- Improve database error handling and reporting
- Better error messages in sign-up/sign-in"

# Push to trigger Vercel deploy
git push origin main
```

Then verify on your Vercel production URL:
- [ ] `/sign-in` works with Google and email
- [ ] `/sign-up` works with Google and email
- [ ] Checkout doesn't show DB error
- [ ] Signed-in users can access account page

---

## FILE CHANGES SUMMARY

### Files Created:
```
lib/supabase.ts                          (NEW) - Supabase client setup
app/auth/callback/route.ts               (NEW) - OAuth callback handler  
```

### Files Updated:
```
app/auth/customer-auth.ts                - Added Google OAuth actions
components/auth/customer-sign-in-form.tsx - Added Google button + styling
components/auth/customer-sign-up-form.tsx - Added Google button + styling
app/api/checkout/initialize-payment/route.ts - Better error handling
app/api/checkout/confirm/route.ts        - Better error handling
```

### Files NOT changed (but important):
```
lib/local-auth.ts              - Already supports customer role
components/auth/auth-shell.tsx - Text already mentions Google
prisma/schema.prisma           - directUrl already configured
.env.local                     - Supabase vars already present
```

---

## BEFORE & AFTER CODE EXAMPLES

### Google Sign-In Button (New)

**BEFORE:**
```tsx
// No Google button at all!
<form action={formAction}>
  <input name="email" />
  <input name="password" />
  <button>Sign In</button>
</form>
```

**AFTER:**
```tsx
<form action={formAction}>
  {/* Google OAuth Button */}
  <button type="button" onClick={handleGoogleSignIn}>
    <GoogleIcon /> Continue with Google
  </button>

  {/* Divider */}
  <div>Or continue with email</div>

  {/* Email/Password Form */}  
  <input name="email" />
  <input name="password" />
  <button type="submit">Sign In</button>
</form>
```

### Error Handling (Improved)

**BEFORE:**
```bash
# Production checkout error
"Database connection failed. Verify Supabase pooled DATABASE_URL and DIRECT_URL configuration."
```

**AFTER (production):**
```bash
# User sees
"Temporary service unavailable. Please refresh and try again."

# Server logs (not shown to user)
"[2026-03-16T10:45:23Z] CRITICAL: Prisma connection error: ECONNREFUSED 
Host: aws-1-eu-west-1.pooler.supabase.com:6543"
```

### Sign-Up Error Reporting (Improved)

**BEFORE:**
```tsx
return { error: "Sign up failed. Please try again.", success: false };
// All errors return same generic message
```

**AFTER:**
```tsx
if (existingUser) 
  return { error: "Email already registered", success: false };
if (connection_error)
  return { error: "Service temporarily unavailable. Please try again in a moment.", success: false };
// Real, specific errors returned
```

---

## COMMON ISSUES & TROUBLESHOOTING

### Issue: "signInWithGoogleAction is not exported"

**Cause:** Old build cache
**Fix:** 
```bash
npm run build  # Should show no errors now
```

### Issue: Google button doesn't show

**Cause:** Supabase env vars not set in Vercel
**Fix:**
```bash
# Verify in Vercel project settings that these are set:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# Re-deploy after adding them:
git push origin main
```

### Issue: OAuth callback fails with "error=access_denied"

**Cause:** Redirect URL not added to Supabase/Google
**Fix:**
1. Go to Supabase → Authentication → URL Configuration
2. Verify `https://smart-store-iota.vercel.app/auth/callback` is listed
3. Go to Google OAuth app and add same URL to "Authorized redirect URIs"

### Issue: "Database connection failed" still appears

**Cause:** 
- Old env vars cached
- NODE_ENV not set to production

**Fix:**
```bash
# Local test - should work:
npm run build && npm run dev

# For Vercel, redeploy:
git push origin main

# Or trigger rebuild in Vercel UI → Deployments → Redeploy
```

### Issue: Sign-up creates user but doesn't sign in

**Cause:** createLocalAuthToken might be failing silently
**Fix:** Check browser console and server logs for errors

---

## VERIFICATION CHECKLIST

### Local Testing (before pushing)
- [ ] `npm install` completes without errors
- [ ] `npm run build` passes TypeScript checks
- [ ] `npm run dev` starts without errors
- [ ] `/sign-in` shows [Google button] [Email form]
- [ ] `/sign-up` shows [Google button] [Email form]
- [ ] Email/password sign-up creates account  
- [ ] Email/password sign-in works for created account
- [ ] Google OAuth flow runs (even if localhost redirect fails)
- [ ] Checkout page loads without DB error banner

### Production Verification (after Vercel deploy)
- [ ] https://smart-store-iota.vercel.app/sign-in loads quickly
- [ ] Google button is visible and clickable
- [ ] Email/password form is visible below divider
- [ ] Google sign-in redirects correctly back to site
- [ ] New OAuth users are auto-created in database
- [ ] Email/password sign-up works
- [ ] Checkout works without DB errors

---

## ROLLBACK PLAN (if needed)

If something breaks:

```bash
# View recent commits
git log --oneline | head -20

# Revert to last working state
git revert <commit-hash>
git push origin main

# Or reset completely:  
git reset --hard HEAD~1
git push -f origin main  # Use with caution!
```

---

## NEXT STEPS (Optional Enhancements)

1. **Social Auth:** Add GitHub, Apple Sign-In  
2. **Magic Links:** Email-based sign-in without passwords
3. **MFA:** Two-factor authentication for accounts
4. **Session Refresh:** Auto-refresh tokens before expiry
5. **Rate Limiting:** Prevent brute-force attacks on login

---

## SUPPORT CONTACT

If Google OAuth isn't working:
1. Check Supabase OAuth provider is enabled
2. Check Google Cloud OAuth credentials are valid
3. Check redirect URLs match exactly (including https protocol)
4. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is set in Vercel

